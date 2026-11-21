package com.paycircle.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpiPaymentDetailsResponse {
    private String payeeUpiId;
    private String payeeName;
    private BigDecimal amount;
    private String transactionNote;
    private String upiUri;
    private String gpayUri;
    private String phonepeUri;
    private String paytmUri;
}
