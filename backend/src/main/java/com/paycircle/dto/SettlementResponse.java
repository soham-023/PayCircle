package com.paycircle.dto;

import com.paycircle.enums.PaymentMethod;
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
public class SettlementResponse {
    private Long id;
    private Long groupId;
    private String groupName;
    private UserSummaryResponse payer;
    private UserSummaryResponse receiver;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private String transactionReference;
    private String notes;
    private LocalDateTime settledAt;
}
