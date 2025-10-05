package com.settlr.backend.repository;

import com.settlr.backend.entity.Expense;
import com.settlr.backend.entity.ExpenseGroup;
import com.settlr.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByGroup(ExpenseGroup group);

    List<Expense> findByGroupId(Long groupId);

    List<Expense> findByPaidBy(User paidBy);

    List<Expense> findByPaidById(Long paidById);

    @Query("SELECT e FROM Expense e WHERE e.group.id = :groupId ORDER BY e.createdAt DESC")
    List<Expense> findByGroupIdOrderByCreatedAtDesc(@Param("groupId") Long groupId);

    @Query("SELECT e FROM Expense e WHERE :userId MEMBER OF e.splitBetween")
    List<Expense> findExpensesSplitWithUser(@Param("userId") Long userId);

    @Query("SELECT e FROM Expense e JOIN e.group.members m WHERE m.id = :userId ORDER BY e.createdAt DESC")
    List<Expense> findExpensesByUserId(@Param("userId") Long userId);

    @Query("SELECT e FROM Expense e WHERE e.group.id = :groupId AND e.createdAt BETWEEN :startDate AND :endDate ORDER BY e.createdAt DESC")
    List<Expense> findByGroupIdAndDateRange(@Param("groupId") Long groupId,
                                          @Param("startDate") LocalDateTime startDate,
                                          @Param("endDate") LocalDateTime endDate);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.group.id = :groupId")
    Double getTotalExpensesByGroupId(@Param("groupId") Long groupId);
}
