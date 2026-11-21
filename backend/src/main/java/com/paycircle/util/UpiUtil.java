package com.paycircle.util;

import com.paycircle.dto.UpiPaymentDetailsResponse;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class UpiUtil {

    /**
     * Generates standard NPCI UPI URI string.
     * upi://pay?pa={upiId}&pn={name}&am={amount}&tn={note}&cu=INR
     */
    public static String generateUpiUri(String upiId, String payeeName, BigDecimal amount, String note) {
        if (upiId == null || upiId.isBlank()) {
            return null;
        }

        String safeUpiId = upiId.trim();
        String safeName = payeeName != null ? URLEncoder.encode(payeeName.trim(), StandardCharsets.UTF_8) : "Payee";
        String safeAmount = amount != null ? amount.setScale(2, RoundingMode.HALF_UP).toPlainString() : "0.00";
        String safeNote = note != null ? URLEncoder.encode(note.trim(), StandardCharsets.UTF_8) : "PayCircle Payment";

        return String.format("upi://pay?pa=%s&pn=%s&am=%s&tn=%s&cu=INR", safeUpiId, safeName, safeAmount, safeNote);
    }

    public static UpiPaymentDetailsResponse buildPaymentDetails(String upiId, String payeeName, BigDecimal amount, String note) {
        String baseUri = generateUpiUri(upiId, payeeName, amount, note);
        if (baseUri == null) {
            return null;
        }

        String queryParams = baseUri.substring("upi://pay?".length());

        return UpiPaymentDetailsResponse.builder()
                .payeeUpiId(upiId)
                .payeeName(payeeName)
                .amount(amount != null ? amount.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO)
                .transactionNote(note)
                .upiUri(baseUri)
                .gpayUri("tez://upi/pay?" + queryParams)
                .phonepeUri("phonepe://pay?" + queryParams)
                .paytmUri("paytmmp://pay?" + queryParams)
                .build();
    }
}
