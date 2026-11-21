package com.paycircle.dto;

import com.paycircle.enums.RequestStatus;
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
public class PaymentRequestResponse {
    private Long id;
    private UserSummaryResponse sender;
    private UserSummaryResponse recipient;
    private Long groupId;
    private String groupName;
    private BigDecimal amount;
    private String note;
    private RequestStatus status;
    private String upiId;
    private String upiDeepLink;
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;
}
