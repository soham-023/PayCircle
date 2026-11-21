package com.paycircle.service;

import com.paycircle.dto.*;
import com.paycircle.entity.*;
import com.paycircle.enums.ActivityType;
import com.paycircle.enums.NotificationType;
import com.paycircle.exception.BadRequestException;
import com.paycircle.exception.ResourceNotFoundException;
import com.paycircle.repository.*;
import com.paycircle.util.DebtSimplifier;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SettlementEngineService {

    private final ExpenseRepository expenseRepository;
    private final SettlementRepository settlementRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final GroupService groupService;
    private final ActivityService activityService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public GroupBalanceSummaryResponse calculateGroupBalances(Long groupId) {
        User currentUser = userService.getCurrentAuthenticatedUser();
        groupService.validateMembership(groupId, currentUser.getId());

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + groupId));

        List<GroupMember> members = groupMemberRepository.findByGroupId(groupId);
        List<Expense> expenses = expenseRepository.findByGroupIdOrderByExpenseDateDescCreatedAtDesc(groupId);
        List<Settlement> settlements = settlementRepository.findByGroupIdOrderBySettledAtDesc(groupId);

        Map<Long, UserSummaryResponse> usersMap = new HashMap<>();
        Map<Long, BigDecimal> totalPaidMap = new HashMap<>();
        Map<Long, BigDecimal> totalShareMap = new HashMap<>();
        Map<Long, BigDecimal> netBalanceMap = new HashMap<>();

        for (GroupMember gm : members) {
            Long uid = gm.getUser().getId();
            usersMap.put(uid, userService.mapToSummary(gm.getUser()));
            totalPaidMap.put(uid, BigDecimal.ZERO);
            totalShareMap.put(uid, BigDecimal.ZERO);
            netBalanceMap.put(uid, BigDecimal.ZERO);
        }

        BigDecimal totalGroupSpending = BigDecimal.ZERO;

        for (Expense exp : expenses) {
            Long payerId = exp.getPaidBy().getId();
            BigDecimal expAmount = exp.getAmount();
            totalGroupSpending = totalGroupSpending.add(expAmount);

            totalPaidMap.put(payerId, totalPaidMap.getOrDefault(payerId, BigDecimal.ZERO).add(expAmount));
            netBalanceMap.put(payerId, netBalanceMap.getOrDefault(payerId, BigDecimal.ZERO).add(expAmount));

            for (ExpenseSplit split : exp.getSplits()) {
                Long splitUserId = split.getUser().getId();
                BigDecimal splitAmount = split.getAmount();

                totalShareMap.put(splitUserId, totalShareMap.getOrDefault(splitUserId, BigDecimal.ZERO).add(splitAmount));
                netBalanceMap.put(splitUserId, netBalanceMap.getOrDefault(splitUserId, BigDecimal.ZERO).subtract(splitAmount));
            }
        }

        // Apply settlements
        for (Settlement s : settlements) {
            Long payerId = s.getPayer().getId();
            Long receiverId = s.getReceiver().getId();
            BigDecimal amount = s.getAmount();

            // Payer gave money, so their debt decreases (netBalance increases)
            netBalanceMap.put(payerId, netBalanceMap.getOrDefault(payerId, BigDecimal.ZERO).add(amount));
            // Receiver got money, so their credit decreases (netBalance decreases)
            netBalanceMap.put(receiverId, netBalanceMap.getOrDefault(receiverId, BigDecimal.ZERO).subtract(amount));
        }

        List<UserBalanceDetail> balanceDetails = new ArrayList<>();
        for (GroupMember gm : members) {
            Long uid = gm.getUser().getId();
            balanceDetails.add(UserBalanceDetail.builder()
                    .user(usersMap.get(uid))
                    .netBalance(netBalanceMap.getOrDefault(uid, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP))
                    .totalPaid(totalPaidMap.getOrDefault(uid, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP))
                    .totalShare(totalShareMap.getOrDefault(uid, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP))
                    .build());
        }

        // Calculate optimal debt simplification suggestions (Min-Cash-Flow)
        List<SuggestedSettlement> suggestedSettlements = DebtSimplifier.simplifyDebts(usersMap, netBalanceMap);

        return GroupBalanceSummaryResponse.builder()
                .groupId(group.getId())
                .groupName(group.getName())
                .totalGroupSpending(totalGroupSpending.setScale(2, RoundingMode.HALF_UP))
                .balances(balanceDetails)
                .suggestedSettlements(suggestedSettlements)
                .build();
    }

    @Transactional(readOnly = true)
    public OverallBalanceSummaryResponse calculateOverallUserBalances() {
        User currentUser = userService.getCurrentAuthenticatedUser();
        Long currentUserId = currentUser.getId();

        List<Expense> userExpenses = expenseRepository.findAllUserExpenses(currentUserId);
        List<Settlement> userSettlements = settlementRepository.findAllUserSettlements(currentUserId);

        // Map friendId -> net balance from current user's perspective:
        // positive = friend owes current user, negative = current user owes friend
        Map<Long, BigDecimal> friendNetBalances = new HashMap<>();
        Map<Long, UserSummaryResponse> friendUsers = new HashMap<>();

        for (Expense exp : userExpenses) {
            Long payerId = exp.getPaidBy().getId();

            if (payerId.equals(currentUserId)) {
                // Current user paid: other participants owe current user
                for (ExpenseSplit split : exp.getSplits()) {
                    Long participantId = split.getUser().getId();
                    if (!participantId.equals(currentUserId)) {
                        friendNetBalances.put(participantId,
                                friendNetBalances.getOrDefault(participantId, BigDecimal.ZERO).add(split.getAmount()));
                        friendUsers.putIfAbsent(participantId, userService.mapToSummary(split.getUser()));
                    }
                }
            } else {
                // Someone else paid: current user might owe them
                for (ExpenseSplit split : exp.getSplits()) {
                    if (split.getUser().getId().equals(currentUserId)) {
                        friendNetBalances.put(payerId,
                                friendNetBalances.getOrDefault(payerId, BigDecimal.ZERO).subtract(split.getAmount()));
                        friendUsers.putIfAbsent(payerId, userService.mapToSummary(exp.getPaidBy()));
                    }
                }
            }
        }

        // Apply settlements
        for (Settlement s : userSettlements) {
            Long payerId = s.getPayer().getId();
            Long receiverId = s.getReceiver().getId();

            if (payerId.equals(currentUserId)) {
                // Current user paid friend: user owes less / friend balance improves
                friendNetBalances.put(receiverId,
                        friendNetBalances.getOrDefault(receiverId, BigDecimal.ZERO).add(s.getAmount()));
                friendUsers.putIfAbsent(receiverId, userService.mapToSummary(s.getReceiver()));
            } else if (receiverId.equals(currentUserId)) {
                // Friend paid current user: friend owes less
                friendNetBalances.put(payerId,
                        friendNetBalances.getOrDefault(payerId, BigDecimal.ZERO).subtract(s.getAmount()));
                friendUsers.putIfAbsent(payerId, userService.mapToSummary(s.getPayer()));
            }
        }

        BigDecimal totalYouAreOwed = BigDecimal.ZERO;
        BigDecimal totalYouOwe = BigDecimal.ZERO;
        List<UserBalanceDetail> friendBalances = new ArrayList<>();

        for (Map.Entry<Long, BigDecimal> entry : friendNetBalances.entrySet()) {
            BigDecimal bal = entry.getValue().setScale(2, RoundingMode.HALF_UP);
            if (bal.compareTo(BigDecimal.ZERO) > 0) {
                totalYouAreOwed = totalYouAreOwed.add(bal);
            } else if (bal.compareTo(BigDecimal.ZERO) < 0) {
                totalYouOwe = totalYouOwe.add(bal.abs());
            }

            friendBalances.add(UserBalanceDetail.builder()
                    .user(friendUsers.get(entry.getKey()))
                    .netBalance(bal)
                    .totalPaid(BigDecimal.ZERO)
                    .totalShare(BigDecimal.ZERO)
                    .build());
        }

        BigDecimal netBalance = totalYouAreOwed.subtract(totalYouOwe);

        // Generate suggestions
        Map<Long, BigDecimal> algMap = new HashMap<>(friendNetBalances);
        algMap.put(currentUserId, netBalance);
        Map<Long, UserSummaryResponse> algUsers = new HashMap<>(friendUsers);
        algUsers.put(currentUserId, userService.mapToSummary(currentUser));

        List<SuggestedSettlement> suggestedSettlements = DebtSimplifier.simplifyDebts(algUsers, algMap);

        return OverallBalanceSummaryResponse.builder()
                .totalYouAreOwed(totalYouAreOwed)
                .totalYouOwe(totalYouOwe)
                .netBalance(netBalance)
                .friendBalances(friendBalances)
                .suggestedSettlements(suggestedSettlements)
                .build();
    }

    @Transactional
    public SettlementResponse recordSettlement(RecordSettlementRequest request) {
        User currentUser = userService.getCurrentAuthenticatedUser();
        Group group = null;

        if (request.getGroupId() != null) {
            groupService.validateMembership(request.getGroupId(), currentUser.getId());
            group = groupRepository.findById(request.getGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + request.getGroupId()));
        }

        User payer = currentUser;
        if (request.getPayerId() != null && !request.getPayerId().equals(currentUser.getId())) {
            payer = userRepository.findById(request.getPayerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Payer not found with id: " + request.getPayerId()));
        }

        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found with id: " + request.getReceiverId()));

        if (payer.getId().equals(receiver.getId())) {
            throw new BadRequestException("Payer and receiver cannot be the same user");
        }

        Settlement settlement = Settlement.builder()
                .group(group)
                .payer(payer)
                .receiver(receiver)
                .amount(request.getAmount().setScale(2, RoundingMode.HALF_UP))
                .paymentMethod(request.getPaymentMethod())
                .transactionReference(request.getTransactionReference())
                .notes(request.getNotes())
                .build();

        Settlement saved = settlementRepository.save(settlement);

        // Activity logging
        activityService.log(group, currentUser, ActivityType.SETTLEMENT_RECORDED,
                payer.getName() + " settled ₹" + saved.getAmount() + " with " + receiver.getName() + " via " + saved.getPaymentMethod());

        // Notify receiver
        notificationService.send(
                receiver,
                "Payment Received / Settled",
                payer.getName() + " recorded a payment of ₹" + saved.getAmount() + " to you",
                NotificationType.SETTLEMENT_CONFIRMED,
                saved.getId()
        );

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<SettlementResponse> getGroupSettlements(Long groupId) {
        User currentUser = userService.getCurrentAuthenticatedUser();
        groupService.validateMembership(groupId, currentUser.getId());

        return settlementRepository.findByGroupIdOrderBySettledAtDesc(groupId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SettlementResponse> getUserSettlements() {
        User currentUser = userService.getCurrentAuthenticatedUser();
        return settlementRepository.findAllUserSettlements(currentUser.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public SettlementResponse mapToResponse(Settlement s) {
        return SettlementResponse.builder()
                .id(s.getId())
                .groupId(s.getGroup() != null ? s.getGroup().getId() : null)
                .groupName(s.getGroup() != null ? s.getGroup().getName() : null)
                .payer(userService.mapToSummary(s.getPayer()))
                .receiver(userService.mapToSummary(s.getReceiver()))
                .amount(s.getAmount())
                .paymentMethod(s.getPaymentMethod())
                .transactionReference(s.getTransactionReference())
                .notes(s.getNotes())
                .settledAt(s.getSettledAt())
                .build();
    }
}
