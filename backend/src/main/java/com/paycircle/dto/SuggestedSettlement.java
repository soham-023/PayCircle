package com.paycircle.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuggestedSettlement {
    private UserSummaryResponse fromUser; // Debtor who pays
    private UserSummaryResponse toUser;   // Creditor who receives
    private BigDecimal amount;
    private String upiDeepLink;          // Ready-to-use UPI link for the debtor to pay the creditor
}
