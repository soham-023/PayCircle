package com.paycircle.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseSplitRequest {

    @NotNull(message = "User ID is required for split")
    private Long userId;

    private BigDecimal amount;

    private BigDecimal percentage;

    private Integer shares;
}
