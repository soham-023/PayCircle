package com.paycircle.repository;

import com.paycircle.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {

    @Query("SELECT DISTINCT g FROM Group g JOIN g.members m WHERE m.user.id = :userId ORDER BY g.updatedAt DESC")
    List<Group> findAllByUserId(@Param("userId") Long userId);
}
