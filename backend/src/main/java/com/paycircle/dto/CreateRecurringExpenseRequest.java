package com.paycircle.dto;

import com.paycircle.enums.ExpenseCategory;
import com.paycircle.enums.RecurringFrequency;
import com.paycircle.enums.SplitType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRecurringExpenseRequest {

    @NotNull(message = "Group ID is required")
    private Long groupId;

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "Category is required")
    private ExpenseCategory category;

    @NotNull(message = "Frequency is required")
    private RecurringFrequency frequency;

    @Builder.Default
    private SplitType splitType = SplitType.EQUAL;

    @NotNull(message = "Next due date is required")
    private LocalDate nextDueDate;
}
