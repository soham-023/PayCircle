package com.paycircle.repository;

import com.paycircle.entity.ExpenseSplit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseSplitRepository extends JpaRepository<ExpenseSplit, Long> {

    List<ExpenseSplit> findByExpenseId(Long expenseId);

    List<ExpenseSplit> findByUserId(Long userId);

    @Query("SELECT s FROM ExpenseSplit s WHERE s.expense.group.id = :groupId")
    List<ExpenseSplit> findByGroupId(@Param("groupId") Long groupId);
}
