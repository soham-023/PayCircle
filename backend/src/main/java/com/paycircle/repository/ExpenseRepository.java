package com.paycircle.repository;

import com.paycircle.entity.Expense;
import com.paycircle.enums.ExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByGroupIdOrderByExpenseDateDescCreatedAtDesc(Long groupId);

    @Query("SELECT DISTINCT e FROM Expense e LEFT JOIN e.splits s WHERE e.paidBy.id = :userId OR s.user.id = :userId ORDER BY e.expenseDate DESC")
    List<Expense> findAllUserExpenses(@Param("userId") Long userId);

    List<Expense> findByGroupIdAndCategory(Long groupId, ExpenseCategory category);

    @Query("SELECT e FROM Expense e WHERE e.group.id = :groupId AND e.expenseDate BETWEEN :startDate AND :endDate")
    List<Expense> findByGroupIdAndDateBetween(@Param("groupId") Long groupId,
                                            @Param("startDate") LocalDate startDate,
                                            @Param("endDate") LocalDate endDate);
}
