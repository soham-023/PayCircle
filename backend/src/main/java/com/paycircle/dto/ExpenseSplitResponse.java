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
public class ExpenseSplitResponse {
    private Long id;
    private UserSummaryResponse user;
    private BigDecimal amount;
    private BigDecimal percentage;
    private Integer shares;
    private Boolean isPaid;
}
