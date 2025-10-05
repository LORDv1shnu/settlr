package com.settlr.backend.repository;

import com.settlr.backend.entity.ExpenseGroup;
import com.settlr.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseGroupRepository extends JpaRepository<ExpenseGroup, Long> {

    @Query("SELECT g FROM ExpenseGroup g JOIN g.members m WHERE m = :user")
    List<ExpenseGroup> findGroupsByUser(@Param("user") User user);

    @Query("SELECT g FROM ExpenseGroup g JOIN g.members m WHERE m.id = :userId")
    List<ExpenseGroup> findGroupsByUserId(@Param("userId") Long userId);

    @Query("SELECT g FROM ExpenseGroup g WHERE g.name LIKE %:name%")
    List<ExpenseGroup> findByNameContaining(@Param("name") String name);
}
