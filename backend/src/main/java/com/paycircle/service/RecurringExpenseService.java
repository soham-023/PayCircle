package com.paycircle.service;

import com.paycircle.dto.CreateExpenseRequest;
import com.paycircle.dto.CreateRecurringExpenseRequest;
import com.paycircle.dto.ExpenseSplitRequest;
import com.paycircle.dto.RecurringExpenseResponse;
import com.paycircle.entity.Group;
import com.paycircle.entity.GroupMember;
import com.paycircle.entity.RecurringExpense;
import com.paycircle.entity.User;
import com.paycircle.enums.ActivityType;
import com.paycircle.enums.RecurringFrequency;
import com.paycircle.enums.SplitType;
import com.paycircle.exception.ResourceNotFoundException;
import com.paycircle.repository.GroupMemberRepository;
import com.paycircle.repository.GroupRepository;
import com.paycircle.repository.RecurringExpenseRepository;
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
public class RecurringExpenseService {

    private final RecurringExpenseRepository recurringExpenseRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserService userService;
    private final GroupService groupService;
    private final ExpenseService expenseService;
    private final ActivityService activityService;

    @Transactional
    public RecurringExpenseResponse createRecurringExpense(CreateRecurringExpenseRequest request) {
        User currentUser = userService.getCurrentAuthenticatedUser();
        groupService.validateMembership(request.getGroupId(), currentUser.getId());

        Group group = groupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + request.getGroupId()));

        RecurringExpense recurring = RecurringExpense.builder()
                .group(group)
                .title(request.getTitle().trim())
                .amount(request.getAmount().setScale(2, RoundingMode.HALF_UP))
                .category(request.getCategory())
                .frequency(request.getFrequency())
                .paidBy(currentUser)
                .splitType(request.getSplitType() != null ? request.getSplitType() : SplitType.EQUAL)
                .nextDueDate(request.getNextDueDate())
                .isActive(true)
                .build();

        RecurringExpense saved = recurringExpenseRepository.save(recurring);

        activityService.log(group, currentUser, ActivityType.EXPENSE_ADDED,
                currentUser.getName() + " created recurring expense '" + saved.getTitle() + "' (₹" + saved.getAmount() + " / " + saved.getFrequency() + ")");

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<RecurringExpenseResponse> getGroupRecurringExpenses(Long groupId) {
        User currentUser = userService.getCurrentAuthenticatedUser();
        groupService.validateMembership(groupId, currentUser.getId());

        return recurringExpenseRepository.findByGroupId(groupId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public RecurringExpenseResponse toggleStatus(Long id) {
        RecurringExpense recurring = recurringExpenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring expense not found with id: " + id));

        recurring.setIsActive(!recurring.getIsActive());
        RecurringExpense updated = recurringExpenseRepository.save(recurring);
        return mapToResponse(updated);
    }

    @Transactional
    public void triggerDueRecurringExpense(Long id) {
        RecurringExpense recurring = recurringExpenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring expense not found with id: " + id));

        // Get group members to create equal split
        List<GroupMember> members = groupMemberRepository.findByGroupId(recurring.getGroup().getId());
        List<ExpenseSplitRequest> splits = members.stream()
                .map(m -> ExpenseSplitRequest.builder().userId(m.getUser().getId()).build())
                .collect(Collectors.toList());

        expenseService.createExpense(CreateExpenseRequest.builder()
                .groupId(recurring.getGroup().getId())
                .title("[Recurring] " + recurring.getTitle())
                .description("Auto-generated from recurring template (" + recurring.getFrequency() + ")")
                .amount(recurring.getAmount())
                .category(recurring.getCategory())
                .splitType(SplitType.EQUAL)
                .paidById(recurring.getPaidBy().getId())
                .expenseDate(LocalDate.now())
                .splits(splits)
                .build());

        // Advance next due date
        recurring.setNextDueDate(calculateNextDate(recurring.getNextDueDate(), recurring.getFrequency()));
        recurringExpenseRepository.save(recurring);
    }

    private LocalDate calculateNextDate(LocalDate current, RecurringFrequency frequency) {
        return switch (frequency) {
            case DAILY -> current.plusDays(1);
            case WEEKLY -> current.plusWeeks(1);
            case MONTHLY -> current.plusMonths(1);
            case YEARLY -> current.plusYears(1);
        };
    }

    public RecurringExpenseResponse mapToResponse(RecurringExpense r) {
        return RecurringExpenseResponse.builder()
                .id(r.getId())
                .groupId(r.getGroup().getId())
                .groupName(r.getGroup().getName())
                .title(r.getTitle())
                .amount(r.getAmount())
                .category(r.getCategory())
                .frequency(r.getFrequency())
                .paidBy(userService.mapToSummary(r.getPaidBy()))
                .splitType(r.getSplitType())
                .nextDueDate(r.getNextDueDate())
                .isActive(r.getIsActive())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
