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
public class UserBalanceDetail {
    private UserSummaryResponse user;
    private BigDecimal netBalance; // >0 means owed money, <0 means owes money, =0 settled
    private BigDecimal totalPaid;
    private BigDecimal totalShare;
}
