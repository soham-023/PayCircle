package com.paycircle.repository;

import com.paycircle.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    List<Settlement> findByGroupIdOrderBySettledAtDesc(Long groupId);

    @Query("SELECT s FROM Settlement s WHERE s.payer.id = :userId OR s.receiver.id = :userId ORDER BY s.settledAt DESC")
    List<Settlement> findAllUserSettlements(@Param("userId") Long userId);

    @Query("SELECT s FROM Settlement s WHERE (s.payer.id = :u1 AND s.receiver.id = :u2) OR (s.payer.id = :u2 AND s.receiver.id = :u1)")
    List<Settlement> findBetweenUsers(@Param("u1") Long u1, @Param("u2") Long u2);
}
