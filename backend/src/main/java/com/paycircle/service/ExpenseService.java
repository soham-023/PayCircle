package com.paycircle.service;

import com.paycircle.dto.*;
import com.paycircle.entity.*;
import com.paycircle.enums.ActivityType;
import com.paycircle.enums.NotificationType;
import com.paycircle.enums.SplitType;
import com.paycircle.exception.BadRequestException;
import com.paycircle.exception.ResourceNotFoundException;
import com.paycircle.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository expenseSplitRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final GroupService groupService;
    private final ActivityService activityService;
    private final NotificationService notificationService;

    @Transactional
    public ExpenseResponse createExpense(CreateExpenseRequest request) {
        User currentUser = userService.getCurrentAuthenticatedUser();
        Group group = null;

        if (request.getGroupId() != null) {
            groupService.validateMembership(request.getGroupId(), currentUser.getId());
            group = groupRepository.findById(request.getGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + request.getGroupId()));
        }

        User payer = currentUser;
        if (request.getPaidById() != null && !request.getPaidById().equals(currentUser.getId())) {
            payer = userRepository.findById(request.getPaidById())
                    .orElseThrow(() -> new ResourceNotFoundException("Payer user not found with id: " + request.getPaidById()));
        }

        BigDecimal totalAmount = request.getAmount().setScale(2, RoundingMode.HALF_UP);

        Expense expense = Expense.builder()
                .group(group)
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .amount(totalAmount)
                .category(request.getCategory())
                .splitType(request.getSplitType())
                .paidBy(payer)
                .expenseDate(request.getExpenseDate() != null ? request.getExpenseDate() : LocalDate.now())
                .receiptUrl(request.getReceiptUrl())
                .build();

        Expense savedExpense = expenseRepository.save(expense);

        // Calculate and validate splits based on split type
        List<ExpenseSplit> calculatedSplits = calculateSplits(savedExpense, request.getSplits(), totalAmount, request.getSplitType());
        expenseSplitRepository.saveAll(calculatedSplits);
        savedExpense.setSplits(calculatedSplits);

        // Activity logging
        activityService.log(group, currentUser, ActivityType.EXPENSE_ADDED,
                currentUser.getName() + " added expense '" + savedExpense.getTitle() + "' of ₹" + totalAmount);

        // Notify other participants
        for (ExpenseSplit split : calculatedSplits) {
            if (!split.getUser().getId().equals(currentUser.getId())) {
                notificationService.send(
                        split.getUser(),
                        "New Expense Added",
                        currentUser.getName() + " added '" + savedExpense.getTitle() + "' (Your share: ₹" + split.getAmount() + ")",
                        NotificationType.EXPENSE_ADDED,
                        savedExpense.getId()
                );
            }
        }

        return mapToResponse(savedExpense);
    }

    private List<ExpenseSplit> calculateSplits(Expense expense, List<ExpenseSplitRequest> splitRequests, BigDecimal totalAmount, SplitType splitType) {
        if (splitRequests == null || splitRequests.isEmpty()) {
            throw new BadRequestException("At least one participant split must be specified");
        }

        List<ExpenseSplit> result = new ArrayList<>();
        int count = splitRequests.size();

        switch (splitType) {
            case EQUAL -> {
                BigDecimal equalShare = totalAmount.divide(BigDecimal.valueOf(count), 2, RoundingMode.DOWN);
                BigDecimal totalCalculated = equalShare.multiply(BigDecimal.valueOf(count));
                BigDecimal remainder = totalAmount.subtract(totalCalculated); // Cents/paise remainder

                for (int i = 0; i < count; i++) {
                    ExpenseSplitRequest req = splitRequests.get(i);
                    User user = userRepository.findById(req.getUserId())
                            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + req.getUserId()));

                    // Add 1 cent/paise to first 'remainder' participants so sum exactly matches totalAmount
                    BigDecimal share = (i < remainder.multiply(new BigDecimal(100)).intValue())
                            ? equalShare.add(new BigDecimal("0.01"))
                            : equalShare;

                    result.add(ExpenseSplit.builder()
                            .expense(expense)
                            .user(user)
                            .amount(share)
                            .isPaid(false)
                            .build());
                }
            }
            case EXACT -> {
                BigDecimal sum = BigDecimal.ZERO;
                for (ExpenseSplitRequest req : splitRequests) {
                    if (req.getAmount() == null || req.getAmount().compareTo(BigDecimal.ZERO) < 0) {
                        throw new BadRequestException("Exact amount must be specified and non-negative for each participant");
                    }
                    BigDecimal memberAmt = req.getAmount().setScale(2, RoundingMode.HALF_UP);
                    sum = sum.add(memberAmt);

                    User user = userRepository.findById(req.getUserId())
                            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + req.getUserId()));

                    result.add(ExpenseSplit.builder()
                            .expense(expense)
                            .user(user)
                            .amount(memberAmt)
                            .isPaid(false)
                            .build());
                }

                if (sum.compareTo(totalAmount) != 0) {
                    throw new BadRequestException("Sum of exact splits (₹" + sum + ") must equal total expense amount (₹" + totalAmount + ")");
                }
            }
            case PERCENTAGE -> {
                BigDecimal totalPercentage = BigDecimal.ZERO;
                for (ExpenseSplitRequest req : splitRequests) {
                    if (req.getPercentage() == null || req.getPercentage().compareTo(BigDecimal.ZERO) < 0) {
                        throw new BadRequestException("Percentage must be specified and non-negative for each participant");
                    }
                    totalPercentage = totalPercentage.add(req.getPercentage());
                }

                if (totalPercentage.setScale(2, RoundingMode.HALF_UP).compareTo(new BigDecimal("100.00")) != 0) {
                    throw new BadRequestException("Total percentage (" + totalPercentage + "%) must equal 100%");
                }

                BigDecimal calculatedSum = BigDecimal.ZERO;
                for (int i = 0; i < count; i++) {
                    ExpenseSplitRequest req = splitRequests.get(i);
                    User user = userRepository.findById(req.getUserId())
                            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + req.getUserId()));

                    BigDecimal share;
                    if (i == count - 1) {
                        // Last member gets remaining amount to avoid rounding discrepancies
                        share = totalAmount.subtract(calculatedSum).setScale(2, RoundingMode.HALF_UP);
                    } else {
                        share = totalAmount.multiply(req.getPercentage())
                                .divide(new BigDecimal(100), 2, RoundingMode.HALF_UP);
                        calculatedSum = calculatedSum.add(share);
                    }

                    result.add(ExpenseSplit.builder()
                            .expense(expense)
                            .user(user)
                            .amount(share)
                            .percentage(req.getPercentage())
                            .isPaid(false)
                            .build());
                }
            }
            case SHARES -> {
                int totalShares = 0;
                for (ExpenseSplitRequest req : splitRequests) {
                    if (req.getShares() == null || req.getShares() <= 0) {
                        throw new BadRequestException("Shares must be positive integer for each participant");
                    }
                    totalShares += req.getShares();
                }

                BigDecimal calculatedSum = BigDecimal.ZERO;
                for (int i = 0; i < count; i++) {
                    ExpenseSplitRequest req = splitRequests.get(i);
                    User user = userRepository.findById(req.getUserId())
                            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + req.getUserId()));

                    BigDecimal share;
                    if (i == count - 1) {
                        // Last member absorbs rounding difference
                        share = totalAmount.subtract(calculatedSum).setScale(2, RoundingMode.HALF_UP);
                    } else {
                        share = totalAmount.multiply(BigDecimal.valueOf(req.getShares()))
                                .divide(BigDecimal.valueOf(totalShares), 2, RoundingMode.HALF_UP);
                        calculatedSum = calculatedSum.add(share);
                    }

                    result.add(ExpenseSplit.builder()
                            .expense(expense)
                            .user(user)
                            .amount(share)
                            .shares(req.getShares())
                            .isPaid(false)
                            .build());
                }
            }
        }

        return result;
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> getGroupExpenses(Long groupId) {
        User currentUser = userService.getCurrentAuthenticatedUser();
        groupService.validateMembership(groupId, currentUser.getId());

        List<Expense> expenses = expenseRepository.findByGroupIdOrderByExpenseDateDescCreatedAtDesc(groupId);
        return expenses.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> getUserExpenses() {
        User currentUser = userService.getCurrentAuthenticatedUser();
        List<Expense> expenses = expenseRepository.findAllUserExpenses(currentUser.getId());
        return expenses.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ExpenseResponse getExpenseById(Long expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + expenseId));
        return mapToResponse(expense);
    }

    @Transactional
    public void deleteExpense(Long expenseId) {
        User currentUser = userService.getCurrentAuthenticatedUser();
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + expenseId));

        if (!expense.getPaidBy().getId().equals(currentUser.getId())) {
            throw new BadRequestException("Only the payer can delete this expense");
        }

        activityService.log(expense.getGroup(), currentUser, ActivityType.EXPENSE_DELETED,
                currentUser.getName() + " deleted expense '" + expense.getTitle() + "'");

        expenseRepository.delete(expense);
    }

    public ExpenseResponse mapToResponse(Expense e) {
        List<ExpenseSplitResponse> splits = e.getSplits().stream().map(s -> ExpenseSplitResponse.builder()
                .id(s.getId())
                .user(userService.mapToSummary(s.getUser()))
                .amount(s.getAmount())
                .percentage(s.getPercentage())
                .shares(s.getShares())
                .isPaid(s.getIsPaid())
                .build()).collect(Collectors.toList());

        return ExpenseResponse.builder()
                .id(e.getId())
                .groupId(e.getGroup() != null ? e.getGroup().getId() : null)
                .groupName(e.getGroup() != null ? e.getGroup().getName() : null)
                .title(e.getTitle())
                .description(e.getDescription())
                .amount(e.getAmount())
                .category(e.getCategory())
                .splitType(e.getSplitType())
                .paidBy(userService.mapToSummary(e.getPaidBy()))
                .expenseDate(e.getExpenseDate())
                .receiptUrl(e.getReceiptUrl())
                .splits(splits)
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}
