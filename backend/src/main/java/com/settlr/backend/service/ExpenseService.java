package com.settlr.backend.service;

import com.settlr.backend.dto.ExpenseDTO;
import com.settlr.backend.dto.ExpenseGroupDTO;
import com.settlr.backend.dto.UserDTO;
import com.settlr.backend.entity.Expense;
import com.settlr.backend.entity.ExpenseGroup;
import com.settlr.backend.entity.User;
import com.settlr.backend.repository.ExpenseRepository;
import com.settlr.backend.repository.ExpenseGroupRepository;
import com.settlr.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExpenseGroupRepository expenseGroupRepository;

    public List<ExpenseDTO> getAllExpenses() {
        return expenseRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Optional<ExpenseDTO> getExpenseById(Long id) {
        return expenseRepository.findById(id)
                .map(this::convertToDTO);
    }

    public List<ExpenseDTO> getExpensesByGroupId(Long groupId) {
        return expenseRepository.findByGroupIdOrderByCreatedAtDesc(groupId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ExpenseDTO> getExpensesByUserId(Long userId) {
        return expenseRepository.findExpensesByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ExpenseDTO createExpense(ExpenseDTO expenseDTO) {
        User paidByUser = userRepository.findById(expenseDTO.getPaidById())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + expenseDTO.getPaidById()));

        ExpenseGroup group = expenseGroupRepository.findById(expenseDTO.getGroupId())
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + expenseDTO.getGroupId()));

        Expense expense = convertToEntity(expenseDTO);
        expense.setPaidBy(paidByUser);
        expense.setGroup(group);

        // If no split members specified, split among all group members
        if (expenseDTO.getSplitBetween() == null || expenseDTO.getSplitBetween().isEmpty()) {
            List<Long> memberIds = group.getMembers().stream()
                    .map(User::getId)
                    .collect(Collectors.toList());
            expense.setSplitBetween(memberIds);
        }

        Expense savedExpense = expenseRepository.save(expense);
        return convertToDTO(savedExpense);
    }

    public ExpenseDTO updateExpense(Long id, ExpenseDTO expenseDTO) {
        Expense existingExpense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found with id: " + id));

        User paidByUser = userRepository.findById(expenseDTO.getPaidById())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + expenseDTO.getPaidById()));

        ExpenseGroup group = expenseGroupRepository.findById(expenseDTO.getGroupId())
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + expenseDTO.getGroupId()));

        existingExpense.setDescription(expenseDTO.getDescription());
        existingExpense.setAmount(expenseDTO.getAmount());
        existingExpense.setPaidBy(paidByUser);
        existingExpense.setGroup(group);
        existingExpense.setSplitBetween(expenseDTO.getSplitBetween());

        Expense savedExpense = expenseRepository.save(existingExpense);
        return convertToDTO(savedExpense);
    }

    public void deleteExpense(Long id) {
        if (!expenseRepository.existsById(id)) {
            throw new RuntimeException("Expense not found with id: " + id);
        }
        expenseRepository.deleteById(id);
    }

    public Double getTotalExpensesByGroupId(Long groupId) {
        Double total = expenseRepository.getTotalExpensesByGroupId(groupId);
        return total != null ? total : 0.0;
    }

    // Helper methods for conversion
    private ExpenseDTO convertToDTO(Expense expense) {
        ExpenseDTO dto = new ExpenseDTO();
        dto.setId(expense.getId());
        dto.setDescription(expense.getDescription());
        dto.setAmount(expense.getAmount());
        dto.setPaidById(expense.getPaidBy().getId());
        dto.setGroupId(expense.getGroup().getId());
        dto.setSplitBetween(expense.getSplitBetween());
        dto.setCreatedAt(expense.getCreatedAt());
        dto.setAmountPerPerson(expense.getAmountPerPerson());

        // Set paid by user details
        dto.setPaidBy(convertUserToDTO(expense.getPaidBy()));

        // Set group details
        dto.setGroup(convertGroupToDTO(expense.getGroup()));

        // Set split between users
        if (expense.getSplitBetween() != null && !expense.getSplitBetween().isEmpty()) {
            List<User> splitUsers = userRepository.findAllById(expense.getSplitBetween());
            List<UserDTO> splitUserDTOs = splitUsers.stream()
                    .map(this::convertUserToDTO)
                    .collect(Collectors.toList());
            dto.setSplitBetweenUsers(splitUserDTOs);
        }

        return dto;
    }

    private Expense convertToEntity(ExpenseDTO dto) {
        Expense expense = new Expense();
        expense.setDescription(dto.getDescription());
        expense.setAmount(dto.getAmount());
        expense.setSplitBetween(dto.getSplitBetween());
        return expense;
    }

    private UserDTO convertUserToDTO(User user) {
        return new UserDTO(user.getId(), user.getName(), user.getEmail(), user.getCreatedAt());
    }

    private ExpenseGroupDTO convertGroupToDTO(ExpenseGroup group) {
        ExpenseGroupDTO dto = new ExpenseGroupDTO();
        dto.setId(group.getId());
        dto.setName(group.getName());
        dto.setDescription(group.getDescription());
        dto.setCreatedAt(group.getCreatedAt());
        return dto;
    }
}
