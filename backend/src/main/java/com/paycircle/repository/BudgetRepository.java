package com.paycircle.repository;

import com.paycircle.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByGroupIdAndMonthAndYear(Long groupId, Integer month, Integer year);

    List<Budget> findByUserIdAndMonthAndYear(Long userId, Integer month, Integer year);

    List<Budget> findByGroupId(Long groupId);

    List<Budget> findByUserId(Long userId);
}
