package com.settlr.backend.controller;

import com.settlr.backend.dto.ExpenseDTO;
import com.settlr.backend.service.ExpenseService;
import jakarta.validation.Valid;
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
        try {
            ExpenseDTO createdExpense = expenseService.createExpense(expenseDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdExpense);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
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
            // For now, return a simple balance structure
            // TODO: Implement proper balance calculation logic
            Map<String, Object> balances = new HashMap<>();
            balances.put("groupId", groupId);
            balances.put("totalExpenses", expenseService.getTotalExpensesByGroupId(groupId));
            balances.put("balances", new ArrayList<>());
            balances.put("settlements", new ArrayList<>());

            return ResponseEntity.ok(balances);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/group/{groupId}/total")
    public ResponseEntity<Double> getTotalExpensesByGroupId(@PathVariable Long groupId) {
        Double total = expenseService.getTotalExpensesByGroupId(groupId);
        return ResponseEntity.ok(total);
    }
}
