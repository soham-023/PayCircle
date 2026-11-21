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
public class GroupBalanceSummaryResponse {
    private Long groupId;
    private String groupName;
    private BigDecimal totalGroupSpending;
    private List<UserBalanceDetail> balances;
    private List<SuggestedSettlement> suggestedSettlements;
}
