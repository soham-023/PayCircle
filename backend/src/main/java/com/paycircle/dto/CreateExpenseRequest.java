package com.paycircle.dto;

import com.paycircle.enums.ExpenseCategory;
import com.paycircle.enums.SplitType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateExpenseRequest {

    private Long groupId;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "Category is required")
    private ExpenseCategory category;

    @NotNull(message = "Split type is required")
    private SplitType splitType;

    private Long paidById; // If null, defaults to currently authenticated user

    private LocalDate expenseDate; // If null, defaults to today

    private String receiptUrl;

    @NotEmpty(message = "At least one member must be included in splits")
    @Valid
    private List<ExpenseSplitRequest> splits;
}
