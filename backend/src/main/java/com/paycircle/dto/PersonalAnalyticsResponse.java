package com.paycircle.dto;

import com.paycircle.enums.ExpenseCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonalAnalyticsResponse {
    private BigDecimal totalPaid;
    private BigDecimal totalShare;
    private BigDecimal netBalance;
    private Map<ExpenseCategory, BigDecimal> categorySpending;
    private Map<String, BigDecimal> monthlyTrend;
}
