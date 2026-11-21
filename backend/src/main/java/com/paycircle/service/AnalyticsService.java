package com.paycircle.service;

import com.paycircle.dto.GroupAnalyticsResponse;
import com.paycircle.dto.PersonalAnalyticsResponse;
import com.paycircle.entity.Expense;
import com.paycircle.entity.ExpenseSplit;
import com.paycircle.entity.Group;
import com.paycircle.entity.User;
import com.paycircle.enums.ExpenseCategory;
import com.paycircle.exception.ResourceNotFoundException;
import com.paycircle.repository.ExpenseRepository;
import com.paycircle.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ExpenseRepository expenseRepository;
    private final GroupRepository groupRepository;
    private final UserService userService;
    private final GroupService groupService;

    @Transactional(readOnly = true)
    public GroupAnalyticsResponse getGroupAnalytics(Long groupId) {
        User currentUser = userService.getCurrentAuthenticatedUser();
        groupService.validateMembership(groupId, currentUser.getId());

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + groupId));

        List<Expense> expenses = expenseRepository.findByGroupIdOrderByExpenseDateDescCreatedAtDesc(groupId);

        BigDecimal total = BigDecimal.ZERO;
        Map<ExpenseCategory, BigDecimal> categoryMap = new LinkedHashMap<>();
        Map<String, BigDecimal> memberMap = new LinkedHashMap<>();
        Map<String, BigDecimal> monthlyMap = new TreeMap<>();

        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM yyyy");

        for (Expense exp : expenses) {
            BigDecimal amt = exp.getAmount();
            total = total.add(amt);

            // Category spending
            categoryMap.put(exp.getCategory(),
                    categoryMap.getOrDefault(exp.getCategory(), BigDecimal.ZERO).add(amt));

            // Member spending (who paid)
            String memberName = exp.getPaidBy().getName();
            memberMap.put(memberName,
                    memberMap.getOrDefault(memberName, BigDecimal.ZERO).add(amt));

            // Monthly trend
            String monthYear = exp.getExpenseDate().format(monthFormatter);
            monthlyMap.put(monthYear,
                    monthlyMap.getOrDefault(monthYear, BigDecimal.ZERO).add(amt));
        }

        return GroupAnalyticsResponse.builder()
                .groupId(group.getId())
                .groupName(group.getName())
                .totalSpending(total.setScale(2, RoundingMode.HALF_UP))
                .categorySpending(categoryMap)
                .memberSpending(memberMap)
                .monthlyTrend(monthlyMap)
                .build();
    }

    @Transactional(readOnly = true)
    public PersonalAnalyticsResponse getPersonalAnalytics() {
        User currentUser = userService.getCurrentAuthenticatedUser();
        Long currentUserId = currentUser.getId();

        List<Expense> userExpenses = expenseRepository.findAllUserExpenses(currentUserId);

        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal totalShare = BigDecimal.ZERO;
        Map<ExpenseCategory, BigDecimal> categoryMap = new LinkedHashMap<>();
        Map<String, BigDecimal> monthlyMap = new TreeMap<>();

        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM yyyy");

        for (Expense exp : userExpenses) {
            if (exp.getPaidBy().getId().equals(currentUserId)) {
                totalPaid = totalPaid.add(exp.getAmount());
            }

            for (ExpenseSplit split : exp.getSplits()) {
                if (split.getUser().getId().equals(currentUserId)) {
                    totalShare = totalShare.add(split.getAmount());

                    categoryMap.put(exp.getCategory(),
                            categoryMap.getOrDefault(exp.getCategory(), BigDecimal.ZERO).add(split.getAmount()));

                    String monthYear = exp.getExpenseDate().format(monthFormatter);
                    monthlyMap.put(monthYear,
                            monthlyMap.getOrDefault(monthYear, BigDecimal.ZERO).add(split.getAmount()));
                }
            }
        }

        BigDecimal netBalance = totalPaid.subtract(totalShare);

        return PersonalAnalyticsResponse.builder()
                .totalPaid(totalPaid.setScale(2, RoundingMode.HALF_UP))
                .totalShare(totalShare.setScale(2, RoundingMode.HALF_UP))
                .netBalance(netBalance.setScale(2, RoundingMode.HALF_UP))
                .categorySpending(categoryMap)
                .monthlyTrend(monthlyMap)
                .build();
    }
}
