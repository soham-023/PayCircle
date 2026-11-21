package com.paycircle.service;

import com.paycircle.dto.*;
import com.paycircle.entity.Group;
import com.paycircle.entity.PaymentRequest;
import com.paycircle.entity.User;
import com.paycircle.enums.ActivityType;
import com.paycircle.enums.NotificationType;
import com.paycircle.enums.PaymentMethod;
import com.paycircle.enums.RequestStatus;
import com.paycircle.exception.BadRequestException;
import com.paycircle.exception.ResourceNotFoundException;
import com.paycircle.exception.UnauthorizedException;
import com.paycircle.repository.GroupRepository;
import com.paycircle.repository.PaymentRequestRepository;
import com.paycircle.repository.UserRepository;
import com.paycircle.util.UpiUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentRequestService {

    private final PaymentRequestRepository paymentRequestRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final UserService userService;
    private final SettlementEngineService settlementEngineService;
    private final ActivityService activityService;
    private final NotificationService notificationService;

    @Transactional
    public PaymentRequestResponse createPaymentRequest(CreatePaymentRequestDto request) {
        User sender = userService.getCurrentAuthenticatedUser();
        User recipient;

        if (request.getRecipientId() != null) {
            recipient = userRepository.findById(request.getRecipientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Recipient user not found with id: " + request.getRecipientId()));
        } else if (request.getRecipientPhone() != null && !request.getRecipientPhone().isBlank()) {
            String cleanPhone = request.getRecipientPhone().trim();
            recipient = userRepository.findByPhone(cleanPhone)
                    .orElseThrow(() -> new ResourceNotFoundException("No registered PayCircle user found with phone: " + cleanPhone));
        } else {
            throw new BadRequestException("Either recipientId or recipientPhone must be provided");
        }

        if (sender.getId().equals(recipient.getId())) {
            throw new BadRequestException("You cannot send a payment request to yourself");
        }

        Group group = null;
        if (request.getGroupId() != null) {
            group = groupRepository.findById(request.getGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + request.getGroupId()));
        }

        BigDecimal amount = request.getAmount().setScale(2, RoundingMode.HALF_UP);

        String upiDeepLink = null;
        if (sender.getUpiId() != null && !sender.getUpiId().isBlank()) {
            upiDeepLink = UpiUtil.generateUpiUri(sender.getUpiId(), sender.getName(), amount,
                    request.getNote() != null ? request.getNote() : "PayCircle settlement request");
        }

        PaymentRequest paymentRequest = PaymentRequest.builder()
                .sender(sender)
                .recipient(recipient)
                .group(group)
                .amount(amount)
                .note(request.getNote())
                .status(RequestStatus.PENDING)
                .upiId(sender.getUpiId())
                .upiDeepLink(upiDeepLink)
                .build();

        PaymentRequest saved = paymentRequestRepository.save(paymentRequest);

        activityService.log(group, sender, ActivityType.PAYMENT_REQUEST_SENT,
                sender.getName() + " sent payment request of ₹" + amount + " to " + recipient.getName());

        notificationService.send(
                recipient,
                "Payment Request Received",
                sender.getName() + " requested ₹" + amount + (request.getNote() != null ? ": " + request.getNote() : ""),
                NotificationType.SETTLEMENT_REQUEST,
                saved.getId()
        );

        return mapToResponse(saved);
    }

    @Transactional
    public PaymentRequestResponse respondToRequest(Long requestId, String action, String transactionRef) {
        User currentUser = userService.getCurrentAuthenticatedUser();
        PaymentRequest request = paymentRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found with id: " + requestId));

        if (!request.getStatus().equals(RequestStatus.PENDING)) {
            throw new BadRequestException("Request is already in status: " + request.getStatus());
        }

        if ("ACCEPT".equalsIgnoreCase(action) || "CONFIRM".equalsIgnoreCase(action)) {
            // Recipient accepts the request and settles the payment
            if (!request.getRecipient().getId().equals(currentUser.getId())) {
                throw new UnauthorizedException("Only the recipient can accept this payment request");
            }

            request.setStatus(RequestStatus.ACCEPTED);
            request.setRespondedAt(LocalDateTime.now());
            PaymentRequest saved = paymentRequestRepository.save(request);

            // Automatically record the settlement
            settlementEngineService.recordSettlement(RecordSettlementRequest.builder()
                    .groupId(request.getGroup() != null ? request.getGroup().getId() : null)
                    .payerId(request.getRecipient().getId())
                    .receiverId(request.getSender().getId())
                    .amount(request.getAmount())
                    .paymentMethod(PaymentMethod.UPI)
                    .transactionReference(transactionRef != null ? transactionRef : "UPI-" + System.currentTimeMillis())
                    .notes("Settled via PayCircle Request #" + request.getId() + (request.getNote() != null ? " - " + request.getNote() : ""))
                    .build());

            notificationService.send(
                    request.getSender(),
                    "Payment Request Accepted",
                    currentUser.getName() + " accepted and paid ₹" + request.getAmount(),
                    NotificationType.SETTLEMENT_CONFIRMED,
                    saved.getId()
            );

            return mapToResponse(saved);
        } else if ("REJECT".equalsIgnoreCase(action)) {
            if (!request.getRecipient().getId().equals(currentUser.getId())) {
                throw new UnauthorizedException("Only the recipient can reject this payment request");
            }

            request.setStatus(RequestStatus.REJECTED);
            request.setRespondedAt(LocalDateTime.now());
            PaymentRequest saved = paymentRequestRepository.save(request);

            notificationService.send(
                    request.getSender(),
                    "Payment Request Declined",
                    currentUser.getName() + " declined the payment request of ₹" + request.getAmount(),
                    NotificationType.SETTLEMENT_REQUEST,
                    saved.getId()
            );

            return mapToResponse(saved);
        } else if ("CANCEL".equalsIgnoreCase(action)) {
            if (!request.getSender().getId().equals(currentUser.getId())) {
                throw new UnauthorizedException("Only the sender can cancel this payment request");
            }

            request.setStatus(RequestStatus.CANCELLED);
            request.setRespondedAt(LocalDateTime.now());
            PaymentRequest saved = paymentRequestRepository.save(request);

            return mapToResponse(saved);
        } else {
            throw new BadRequestException("Invalid action: " + action + ". Allowed values: ACCEPT, REJECT, CANCEL");
        }
    }

    @Transactional(readOnly = true)
    public List<PaymentRequestResponse> getUserRequests() {
        User currentUser = userService.getCurrentAuthenticatedUser();
        return paymentRequestRepository.findAllForUser(currentUser.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UpiPaymentDetailsResponse getUpiPaymentDetails(Long requestId) {
        PaymentRequest request = paymentRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found with id: " + requestId));

        User payee = request.getSender();
        if (payee.getUpiId() == null || payee.getUpiId().isBlank()) {
            throw new BadRequestException("Payee (" + payee.getName() + ") has not configured a UPI ID yet");
        }

        return UpiUtil.buildPaymentDetails(
                payee.getUpiId(),
                payee.getName(),
                request.getAmount(),
                request.getNote() != null ? request.getNote() : "PayCircle Request #" + request.getId()
        );
    }

    public PaymentRequestResponse mapToResponse(PaymentRequest r) {
        return PaymentRequestResponse.builder()
                .id(r.getId())
                .sender(userService.mapToSummary(r.getSender()))
                .recipient(userService.mapToSummary(r.getRecipient()))
                .groupId(r.getGroup() != null ? r.getGroup().getId() : null)
                .groupName(r.getGroup() != null ? r.getGroup().getName() : null)
                .amount(r.getAmount())
                .note(r.getNote())
                .status(r.getStatus())
                .upiId(r.getUpiId())
                .upiDeepLink(r.getUpiDeepLink())
                .createdAt(r.getCreatedAt())
                .respondedAt(r.getRespondedAt())
                .build();
    }
}
