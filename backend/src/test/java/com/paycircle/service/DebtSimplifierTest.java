package com.paycircle.service;

import com.paycircle.dto.SuggestedSettlement;
import com.paycircle.dto.UserSummaryResponse;
import com.paycircle.util.DebtSimplifier;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class DebtSimplifierTest {

    @Test
    @DisplayName("Should simplify 3-way circular debt into minimal transactions")
    public void testSimplifyCircularDebts() {
        // User 1 owes User 2 $50, User 2 owes User 3 $50
        // Net balances:
        // User 1: -50 (Debtor)
        // User 2: 0 (Settled)
        // User 3: +50 (Creditor)
        // Algorithm should simplify to: User 1 pays User 3 $50 directly (1 transaction instead of 2!)

        Map<Long, UserSummaryResponse> users = new HashMap<>();
        users.put(1L, UserSummaryResponse.builder().id(1L).name("Alice").phone("+911111111111").upiId("alice@upi").build());
        users.put(2L, UserSummaryResponse.builder().id(2L).name("Bob").phone("+912222222222").upiId("bob@upi").build());
        users.put(3L, UserSummaryResponse.builder().id(3L).name("Charlie").phone("+913333333333").upiId("charlie@upi").build());

        Map<Long, BigDecimal> netBalances = new HashMap<>();
        netBalances.put(1L, new BigDecimal("-50.00"));
        netBalances.put(2L, new BigDecimal("0.00"));
        netBalances.put(3L, new BigDecimal("50.00"));

        List<SuggestedSettlement> suggestions = DebtSimplifier.simplifyDebts(users, netBalances);

        assertEquals(1, suggestions.size(), "Should produce exactly 1 simplified transaction");
        assertEquals(1L, suggestions.get(0).getFromUser().getId(), "Alice should be debtor");
        assertEquals(3L, suggestions.get(0).getToUser().getId(), "Charlie should be creditor");
        assertEquals(new BigDecimal("50.00"), suggestions.get(0).getAmount());
        assertNotNull(suggestions.get(0).getUpiDeepLink(), "Should generate UPI deep link for creditor");
    }

    @Test
    @DisplayName("Should handle 4 users with mixed positive and negative balances")
    public void testMultipleDebtorsAndCreditors() {
        Map<Long, UserSummaryResponse> users = new HashMap<>();
        users.put(1L, UserSummaryResponse.builder().id(1L).name("User1").phone("1").build());
        users.put(2L, UserSummaryResponse.builder().id(2L).name("User2").phone("2").build());
        users.put(3L, UserSummaryResponse.builder().id(3L).name("User3").phone("3").build());
        users.put(4L, UserSummaryResponse.builder().id(4L).name("User4").phone("4").build());

        // Net balances sum to zero:
        // 1: +100
        // 2: +50
        // 3: -80
        // 4: -70
        Map<Long, BigDecimal> netBalances = new HashMap<>();
        netBalances.put(1L, new BigDecimal("100.00"));
        netBalances.put(2L, new BigDecimal("50.00"));
        netBalances.put(3L, new BigDecimal("-80.00"));
        netBalances.put(4L, new BigDecimal("-70.00"));

        List<SuggestedSettlement> suggestions = DebtSimplifier.simplifyDebts(users, netBalances);

        // Max transactions for 4 users is at most 3
        assertTrue(suggestions.size() <= 3);

        BigDecimal totalSettled = suggestions.stream()
                .map(SuggestedSettlement::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertEquals(new BigDecimal("150.00"), totalSettled, "Total settled amount should match total positive credit");
    }
}
