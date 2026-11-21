package com.paycircle.dto;

import com.paycircle.enums.ExpenseCategory;
import com.paycircle.enums.SplitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseResponse {
    private Long id;
    private Long groupId;
    private String groupName;
    private String title;
    private String description;
    private BigDecimal amount;
    private ExpenseCategory category;
    private SplitType splitType;
    private UserSummaryResponse paidBy;
    private LocalDate expenseDate;
    private String receiptUrl;
    private List<ExpenseSplitResponse> splits;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
