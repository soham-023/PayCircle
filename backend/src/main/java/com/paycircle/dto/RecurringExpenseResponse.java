package com.paycircle.dto;

import com.paycircle.enums.ExpenseCategory;
import com.paycircle.enums.RecurringFrequency;
import com.paycircle.enums.SplitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecurringExpenseResponse {
    private Long id;
    private Long groupId;
    private String groupName;
    private String title;
    private BigDecimal amount;
    private ExpenseCategory category;
    private RecurringFrequency frequency;
    private UserSummaryResponse paidBy;
    private SplitType splitType;
    private LocalDate nextDueDate;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
