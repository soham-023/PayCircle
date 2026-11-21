package com.paycircle.controller;

import com.paycircle.dto.CreatePaymentRequestDto;
import com.paycircle.dto.PaymentRequestResponse;
import com.paycircle.dto.UpiPaymentDetailsResponse;
import com.paycircle.service.PaymentRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payment-requests")
@RequiredArgsConstructor
@Tag(name = "Phone-number Settlement", description = "Endpoints for sending settlement requests by phone, accepting/rejecting, and UPI deep-linking")
public class PaymentRequestController {

    private final PaymentRequestService paymentRequestService;

    @PostMapping
    @Operation(summary = "Send a payment settlement request", description = "Target user can be specified via registered phone number or user ID")
    public ResponseEntity<PaymentRequestResponse> createPaymentRequest(@Valid @RequestBody CreatePaymentRequestDto request) {
        return new ResponseEntity<>(paymentRequestService.createPaymentRequest(request), HttpStatus.CREATED);
    }

    @GetMapping("/my")
    @Operation(summary = "Get all payment requests sent or received by current user")
    public ResponseEntity<List<PaymentRequestResponse>> getUserPaymentRequests() {
        return ResponseEntity.ok(paymentRequestService.getUserRequests());
    }

    @PostMapping("/{id}/respond")
    @Operation(summary = "Respond to payment request (ACCEPT, REJECT, CANCEL)",
            description = "Accepting automatically logs the settlement in the database with UPI details")
    public ResponseEntity<PaymentRequestResponse> respondToRequest(
            @PathVariable Long id,
            @RequestParam String action,
            @RequestParam(required = false) String transactionRef) {
        return ResponseEntity.ok(paymentRequestService.respondToRequest(id, action, transactionRef));
    }

    @GetMapping("/{id}/upi-details")
    @Operation(summary = "Get UPI payment details (URI and deep links for PhonePe, GPay, Paytm) to settle the request")
    public ResponseEntity<UpiPaymentDetailsResponse> getUpiDetails(@PathVariable Long id) {
        return ResponseEntity.ok(paymentRequestService.getUpiPaymentDetails(id));
    }
}
