package com.paycircle.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OverallBalanceSummaryResponse {
    private BigDecimal totalYouAreOwed; // Sum of positive balances
    private BigDecimal totalYouOwe;      // Sum of negative balances
    private BigDecimal netBalance;       // totalYouAreOwed - totalYouOwe
    private List<UserBalanceDetail> friendBalances;
    private List<SuggestedSettlement> suggestedSettlements;
}
