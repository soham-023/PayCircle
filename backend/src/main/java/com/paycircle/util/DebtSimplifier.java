package com.paycircle.util;

import com.paycircle.dto.SuggestedSettlement;
import com.paycircle.dto.UserSummaryResponse;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * Greedy Min-Cash-Flow Debt Simplification Algorithm.
 * Minimizes total number of transactions required to settle all debts in a group.
 */
public class DebtSimplifier {

    public static class ParticipantBalance {
        private final UserSummaryResponse user;
        private BigDecimal balance;

        public ParticipantBalance(UserSummaryResponse user, BigDecimal balance) {
            this.user = user;
            this.balance = balance.setScale(2, RoundingMode.HALF_UP);
        }

        public UserSummaryResponse getUser() {
            return user;
        }

        public BigDecimal getBalance() {
            return balance;
        }

        public void setBalance(BigDecimal balance) {
            this.balance = balance.setScale(2, RoundingMode.HALF_UP);
        }
    }

    public static List<SuggestedSettlement> simplifyDebts(Map<Long, UserSummaryResponse> usersMap,
                                                          Map<Long, BigDecimal> netBalances) {
        List<SuggestedSettlement> suggestions = new ArrayList<>();

        // Priority queues: creditors (max heap: largest positive balance) and debtors (min heap: largest negative balance)
        PriorityQueue<ParticipantBalance> creditors = new PriorityQueue<>(
                (a, b) -> b.getBalance().compareTo(a.getBalance())
        );
        PriorityQueue<ParticipantBalance> debtors = new PriorityQueue<>(
                Comparator.comparing(ParticipantBalance::getBalance)
        );

        for (Map.Entry<Long, BigDecimal> entry : netBalances.entrySet()) {
            Long userId = entry.getKey();
            BigDecimal balance = entry.getValue().setScale(2, RoundingMode.HALF_UP);
            UserSummaryResponse user = usersMap.get(userId);

            if (user == null) {
                continue;
            }

            if (balance.compareTo(new BigDecimal("0.01")) >= 0) {
                creditors.offer(new ParticipantBalance(user, balance));
            } else if (balance.compareTo(new BigDecimal("-0.01")) <= 0) {
                debtors.offer(new ParticipantBalance(user, balance));
            }
        }

        while (!creditors.isEmpty() && !debtors.isEmpty()) {
            ParticipantBalance creditor = creditors.poll();
            ParticipantBalance debtor = debtors.poll();

            BigDecimal creditAmount = creditor.getBalance();
            BigDecimal debitAmount = debtor.getBalance().abs();

            BigDecimal settlementAmount = creditAmount.min(debitAmount);

            String upiLink = null;
            if (creditor.getUser().getUpiId() != null && !creditor.getUser().getUpiId().isBlank()) {
                upiLink = UpiUtil.generateUpiUri(
                        creditor.getUser().getUpiId(),
                        creditor.getUser().getName(),
                        settlementAmount,
                        "PayCircle settlement"
                );
            }

            suggestions.add(SuggestedSettlement.builder()
                    .fromUser(debtor.getUser())
                    .toUser(creditor.getUser())
                    .amount(settlementAmount)
                    .upiDeepLink(upiLink)
                    .build());

            BigDecimal remainingCredit = creditAmount.subtract(settlementAmount).setScale(2, RoundingMode.HALF_UP);
            BigDecimal remainingDebit = debtor.getBalance().add(settlementAmount).setScale(2, RoundingMode.HALF_UP);

            if (remainingCredit.compareTo(new BigDecimal("0.01")) >= 0) {
                creditor.setBalance(remainingCredit);
                creditors.offer(creditor);
            }

            if (remainingDebit.compareTo(new BigDecimal("-0.01")) <= 0) {
                debtor.setBalance(remainingDebit);
                debtors.offer(debtor);
            }
        }

        return suggestions;
    }
}
