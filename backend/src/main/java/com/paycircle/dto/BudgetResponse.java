package com.paycircle.dto;

import com.paycircle.enums.ExpenseCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetResponse {
    private Long id;
    private Long groupId;
    private String groupName;
    private ExpenseCategory category;
    private BigDecimal limitAmount;
    private BigDecimal spentAmount;
    private BigDecimal remainingAmount;
    private Double percentageUsed;
    private Boolean isExceeded;
    private Boolean isWarning; // spent >= alertThresholdPercent
    private Integer alertThresholdPercent;
    private Integer month;
    private Integer year;
    private LocalDateTime createdAt;
}
