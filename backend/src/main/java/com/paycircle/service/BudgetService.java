package com.paycircle.service;

import com.paycircle.dto.BudgetResponse;
import com.paycircle.dto.CreateBudgetRequest;
import com.paycircle.entity.Budget;
import com.paycircle.entity.Expense;
import com.paycircle.entity.Group;
import com.paycircle.entity.User;
import com.paycircle.enums.ActivityType;
import com.paycircle.enums.NotificationType;
import com.paycircle.exception.BadRequestException;
import com.paycircle.exception.ResourceNotFoundException;
import com.paycircle.repository.BudgetRepository;
import com.paycircle.repository.ExpenseRepository;
import com.paycircle.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;
    private final GroupRepository groupRepository;
    private final UserService userService;
    private final GroupService groupService;
    private final ActivityService activityService;
    private final NotificationService notificationService;

    @Transactional
    public BudgetResponse createBudget(CreateBudgetRequest request) {
        User currentUser = userService.getCurrentAuthenticatedUser();
        Group group = null;

        if (request.getGroupId() != null) {
            groupService.validateMembership(request.getGroupId(), currentUser.getId());
            group = groupRepository.findById(request.getGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + request.getGroupId()));
        }

        Budget budget = Budget.builder()
                .group(group)
                .user(group == null ? currentUser : null)
                .category(request.getCategory())
                .limitAmount(request.getLimitAmount().setScale(2, RoundingMode.HALF_UP))
                .month(request.getMonth())
                .year(request.getYear())
                .alertThresholdPercent(request.getAlertThresholdPercent() != null ? request.getAlertThresholdPercent() : 80)
                .build();

        Budget saved = budgetRepository.save(budget);

        activityService.log(group, currentUser, ActivityType.BUDGET_CREATED,
                currentUser.getName() + " set budget of ₹" + saved.getLimitAmount() + " for " +
                        (saved.getCategory() != null ? saved.getCategory().name() : "all categories") +
                        " (" + saved.getMonth() + "/" + saved.getYear() + ")");

        return calculateBudgetStatus(saved);
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> getGroupBudgets(Long groupId, Integer month, Integer year) {
        User currentUser = userService.getCurrentAuthenticatedUser();
        groupService.validateMembership(groupId, currentUser.getId());

        List<Budget> budgets = (month != null && year != null)
                ? budgetRepository.findByGroupIdAndMonthAndYear(groupId, month, year)
                : budgetRepository.findByGroupId(groupId);

        return budgets.stream().map(this::calculateBudgetStatus).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> getUserBudgets(Integer month, Integer year) {
        User currentUser = userService.getCurrentAuthenticatedUser();
        List<Budget> budgets = (month != null && year != null)
                ? budgetRepository.findByUserIdAndMonthAndYear(currentUser.getId(), month, year)
                : budgetRepository.findByUserId(currentUser.getId());

        return budgets.stream().map(this::calculateBudgetStatus).collect(Collectors.toList());
    }

    public BudgetResponse calculateBudgetStatus(Budget budget) {
        LocalDate startOfMonth = LocalDate.of(budget.getYear(), budget.getMonth(), 1);
        LocalDate endOfMonth = startOfMonth.plusMonths(1).minusDays(1);

        BigDecimal spentAmount = BigDecimal.ZERO;

        if (budget.getGroup() != null) {
            List<Expense> expenses = expenseRepository.findByGroupIdAndDateBetween(
                    budget.getGroup().getId(), startOfMonth, endOfMonth
            );

            for (Expense exp : expenses) {
                if (budget.getCategory() == null || budget.getCategory().equals(exp.getCategory())) {
                    spentAmount = spentAmount.add(exp.getAmount());
                }
            }
        } else if (budget.getUser() != null) {
            List<Expense> allUserExpenses = expenseRepository.findAllUserExpenses(budget.getUser().getId());
            for (Expense exp : allUserExpenses) {
                if (!exp.getExpenseDate().isBefore(startOfMonth) && !exp.getExpenseDate().isAfter(endOfMonth)) {
                    if (budget.getCategory() == null || budget.getCategory().equals(exp.getCategory())) {
                        spentAmount = spentAmount.add(exp.getAmount());
                    }
                }
            }
        }

        BigDecimal limit = budget.getLimitAmount();
        BigDecimal remaining = limit.subtract(spentAmount);
        double percentage = limit.compareTo(BigDecimal.ZERO) > 0
                ? spentAmount.divide(limit, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                : 0.0;

        boolean isExceeded = spentAmount.compareTo(limit) > 0;
        boolean isWarning = percentage >= budget.getAlertThresholdPercent();

        return BudgetResponse.builder()
                .id(budget.getId())
                .groupId(budget.getGroup() != null ? budget.getGroup().getId() : null)
                .groupName(budget.getGroup() != null ? budget.getGroup().getName() : null)
                .category(budget.getCategory())
                .limitAmount(limit)
                .spentAmount(spentAmount.setScale(2, RoundingMode.HALF_UP))
                .remainingAmount(remaining.setScale(2, RoundingMode.HALF_UP))
                .percentageUsed(Math.round(percentage * 100.0) / 100.0)
                .isExceeded(isExceeded)
                .isWarning(isWarning)
                .alertThresholdPercent(budget.getAlertThresholdPercent())
                .month(budget.getMonth())
                .year(budget.getYear())
                .createdAt(budget.getCreatedAt())
                .build();
    }
}
