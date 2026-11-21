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
public class GroupAnalyticsResponse {
    private Long groupId;
    private String groupName;
    private BigDecimal totalSpending;
    private Map<ExpenseCategory, BigDecimal> categorySpending;
    private Map<String, BigDecimal> memberSpending;
    private Map<String, BigDecimal> monthlyTrend;
}
