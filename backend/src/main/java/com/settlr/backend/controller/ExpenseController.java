package com.settlr.backend.controller;

import com.settlr.backend.dto.ExpenseDTO;
import com.settlr.backend.service.ExpenseService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private static final Logger logger = LoggerFactory.getLogger(ExpenseController.class);

    @Autowired
    private ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<List<ExpenseDTO>> getAllExpenses() {
        List<ExpenseDTO> expenses = expenseService.getAllExpenses();
        return ResponseEntity.ok(expenses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseDTO> getExpenseById(@PathVariable Long id) {
        Optional<ExpenseDTO> expense = expenseService.getExpenseById(id);
        return expense.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<ExpenseDTO>> getExpensesByGroupId(@PathVariable Long groupId) {
        List<ExpenseDTO> expenses = expenseService.getExpensesByGroupId(groupId);
        return ResponseEntity.ok(expenses);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ExpenseDTO>> getExpensesByUserId(@PathVariable Long userId) {
        List<ExpenseDTO> expenses = expenseService.getExpensesByUserId(userId);
        return ResponseEntity.ok(expenses);
    }

    @PostMapping
    public ResponseEntity<ExpenseDTO> createExpense(@Valid @RequestBody ExpenseDTO expenseDTO) {
        logger.info("POST /api/expenses - Creating new expense with description: {}", expenseDTO.getDescription());
        logger.info("POST /api/expenses - Expense data: amount={}, paidById={}, groupId={}, splitBetween={}",
                   expenseDTO.getAmount(), expenseDTO.getPaidById(), expenseDTO.getGroupId(), expenseDTO.getSplitBetween());

        try {
            // Validate required fields
            if (expenseDTO.getDescription() == null || expenseDTO.getDescription().trim().isEmpty()) {
                logger.error("POST /api/expenses - Validation error: Description is required");
                return ResponseEntity.badRequest().build();
            }

            if (expenseDTO.getAmount() == null || expenseDTO.getAmount().compareTo(java.math.BigDecimal.ZERO) <= 0) {
                logger.error("POST /api/expenses - Validation error: Amount must be positive, got: {}", expenseDTO.getAmount());
                return ResponseEntity.badRequest().build();
            }

            if (expenseDTO.getPaidById() == null) {
                logger.error("POST /api/expenses - Validation error: PaidById is required");
                return ResponseEntity.badRequest().build();
            }

            if (expenseDTO.getGroupId() == null) {
                logger.error("POST /api/expenses - Validation error: GroupId is required");
                return ResponseEntity.badRequest().build();
            }

            ExpenseDTO createdExpense = expenseService.createExpense(expenseDTO);
            logger.info("POST /api/expenses - Successfully created expense with ID: {} and description: {}",
                       createdExpense.getId(), createdExpense.getDescription());
            return ResponseEntity.status(HttpStatus.CREATED).body(createdExpense);
        } catch (RuntimeException e) {
            logger.error("POST /api/expenses - Error creating expense with description {}: {}",
                        expenseDTO.getDescription(), e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("POST /api/expenses - Unexpected error creating expense with description {}: {}",
                        expenseDTO.getDescription(), e.getMessage(), e);
            throw e;
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpenseDTO> updateExpense(@PathVariable Long id, @Valid @RequestBody ExpenseDTO expenseDTO) {
        try {
            ExpenseDTO updatedExpense = expenseService.updateExpense(id, expenseDTO);
            return ResponseEntity.ok(updatedExpense);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long id) {
        try {
            expenseService.deleteExpense(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/group/{groupId}/balances")
    public ResponseEntity<Map<String, Object>> getGroupBalances(@PathVariable Long groupId) {
        try {
            logger.info("GET /api/expenses/group/{}/balances - Calculating group balances", groupId);

            // Get all expenses for the group
            List<ExpenseDTO> expenses = expenseService.getExpensesByGroupId(groupId);
            logger.info("Found {} expenses for group {}", expenses.size(), groupId);

            // Calculate balances for each user
            Map<Long, Double> userBalances = expenseService.calculateUserBalances(groupId);
            logger.info("Calculated balances for {} users in group {}", userBalances.size(), groupId);

            // Convert user balances to response format
            List<Map<String, Object>> balancesList = new ArrayList<>();
            for (Map.Entry<Long, Double> entry : userBalances.entrySet()) {
                Map<String, Object> balance = new HashMap<>();
                balance.put("userId", entry.getKey());
                balance.put("amount", entry.getValue());
                balancesList.add(balance);
            }

            // Calculate total expenses
            Double totalExpenses = expenseService.getTotalExpensesByGroupId(groupId);
            logger.info("Total expenses for group {}: {}", groupId, totalExpenses);

            Map<String, Object> response = new HashMap<>();
            response.put("groupId", groupId);
            response.put("totalExpenses", totalExpenses);
            response.put("balances", balancesList);
            response.put("userBalances", userBalances); // For easier frontend access
            response.put("settlements", new ArrayList<>()); // TODO: Implement settlement suggestions

            logger.info("GET /api/expenses/group/{}/balances - Successfully calculated balances", groupId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            logger.error("GET /api/expenses/group/{}/balances - Error calculating balances: {}", groupId, e.getMessage(), e);
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/group/{groupId}/total")
    public ResponseEntity<Double> getTotalExpensesByGroupId(@PathVariable Long groupId) {
        Double total = expenseService.getTotalExpensesByGroupId(groupId);
        return ResponseEntity.ok(total);
    }
}
