package com.paycircle.repository;

import com.paycircle.entity.ActivityLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    List<ActivityLog> findByGroupIdOrderByCreatedAtDesc(Long groupId, Pageable pageable);

    @Query("SELECT a FROM ActivityLog a WHERE a.group.id IN (SELECT m.group.id FROM GroupMember m WHERE m.user.id = :userId) OR a.user.id = :userId ORDER BY a.createdAt DESC")
    List<ActivityLog> findUserFeed(@Param("userId") Long userId, Pageable pageable);
}
