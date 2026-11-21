package com.paycircle.repository;

import com.paycircle.entity.PaymentRequest;
import com.paycircle.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRequestRepository extends JpaRepository<PaymentRequest, Long> {

    @Query("SELECT r FROM PaymentRequest r WHERE r.sender.id = :userId OR r.recipient.id = :userId ORDER BY r.createdAt DESC")
    List<PaymentRequest> findAllForUser(@Param("userId") Long userId);

    List<PaymentRequest> findByRecipientIdAndStatus(Long recipientId, RequestStatus status);

    List<PaymentRequest> findByGroupIdOrderByCreatedAtDesc(Long groupId);
}
