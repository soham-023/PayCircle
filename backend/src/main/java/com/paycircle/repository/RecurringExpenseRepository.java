package com.paycircle.repository;

import com.paycircle.entity.RecurringExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RecurringExpenseRepository extends JpaRepository<RecurringExpense, Long> {

    List<RecurringExpense> findByGroupIdAndIsActiveTrue(Long groupId);

    List<RecurringExpense> findByGroupId(Long groupId);

    List<RecurringExpense> findByIsActiveTrueAndNextDueDateLessThanEqual(LocalDate date);
}
