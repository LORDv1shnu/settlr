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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    private static final Logger logger = LoggerFactory.getLogger(ExpenseService.class);

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
        logger.info("ExpenseService.createExpense() - Creating expense: description={}, amount={}, paidById={}, groupId={}",
                   expenseDTO.getDescription(), expenseDTO.getAmount(), expenseDTO.getPaidById(), expenseDTO.getGroupId());
        logger.debug("ExpenseService.createExpense() - Split between: {}", expenseDTO.getSplitBetween());

        try {
            logger.debug("ExpenseService.createExpense() - Finding user with ID: {}", expenseDTO.getPaidById());
            User paidByUser = userRepository.findById(expenseDTO.getPaidById())
                    .orElseThrow(() -> {
                        logger.error("ExpenseService.createExpense() - User not found with id: {}", expenseDTO.getPaidById());
                        return new RuntimeException("User not found with id: " + expenseDTO.getPaidById());
                    });
            logger.info("ExpenseService.createExpense() - Found paidBy user: {} ({})", paidByUser.getName(), paidByUser.getEmail());

            logger.debug("ExpenseService.createExpense() - Finding group with ID: {}", expenseDTO.getGroupId());
            ExpenseGroup group = expenseGroupRepository.findById(expenseDTO.getGroupId())
                    .orElseThrow(() -> {
                        logger.error("ExpenseService.createExpense() - Group not found with id: {}", expenseDTO.getGroupId());
                        return new RuntimeException("Group not found with id: " + expenseDTO.getGroupId());
                    });
            logger.info("ExpenseService.createExpense() - Found group: {} with {} members", group.getName(), group.getMembers().size());

            Expense expense = convertToEntity(expenseDTO);
            expense.setPaidBy(paidByUser);
            expense.setGroup(group);

            // If no split members specified, split among all group members
            if (expenseDTO.getSplitBetween() == null || expenseDTO.getSplitBetween().isEmpty()) {
                List<Long> memberIds = group.getMembers().stream()
                        .map(User::getId)
                        .collect(Collectors.toList());
                expense.setSplitBetween(memberIds);
                logger.info("ExpenseService.createExpense() - No split members specified, splitting among all {} group members: {}",
                           memberIds.size(), memberIds);
            } else {
                logger.info("ExpenseService.createExpense() - Using specified split members: {}", expenseDTO.getSplitBetween());
            }

            logger.debug("ExpenseService.createExpense() - Saving expense to database");
            Expense savedExpense = expenseRepository.save(expense);
            logger.info("ExpenseService.createExpense() - Successfully saved expense to database with ID: {}", savedExpense.getId());

            ExpenseDTO result = convertToDTO(savedExpense);
            logger.info("ExpenseService.createExpense() - Expense creation completed successfully for: {}", expenseDTO.getDescription());
            return result;

        } catch (RuntimeException e) {
            logger.error("ExpenseService.createExpense() - Business logic error for expense {}: {}",
                        expenseDTO.getDescription(), e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            logger.error("ExpenseService.createExpense() - Unexpected database error for expense {}: {}",
                        expenseDTO.getDescription(), e.getMessage(), e);
            throw new RuntimeException("Failed to create expense: " + e.getMessage(), e);
        }
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

    /**
     * Calculate balances for each user in a group
     * Positive balance = user owes money
     * Negative balance = user is owed money
     */
    public Map<Long, Double> calculateUserBalances(Long groupId) {
        logger.info("ExpenseService.calculateUserBalances() - Calculating balances for group {}", groupId);

        Map<Long, Double> balances = new HashMap<>();
        List<Expense> expenses = expenseRepository.findByGroupIdOrderByCreatedAtDesc(groupId);

        logger.info("Found {} expenses for group {}", expenses.size(), groupId);

        for (Expense expense : expenses) {
            Long paidById = expense.getPaidBy().getId();
            List<Long> splitBetween = expense.getSplitBetween();
            double totalAmount = expense.getAmount().doubleValue();
            double amountPerPerson = expense.getAmountPerPerson().doubleValue();

            logger.debug("Processing expense: {} - Amount: {}, Paid by: {}, Split between: {} users",
                        expense.getDescription(), totalAmount, paidById, splitBetween.size());

            // Initialize balances for users involved in this expense
            balances.putIfAbsent(paidById, 0.0);
            for (Long userId : splitBetween) {
                balances.putIfAbsent(userId, 0.0);
            }

            // Each person in splitBetween owes their share
            for (Long userId : splitBetween) {
                balances.put(userId, balances.get(userId) + amountPerPerson);
            }

            // The person who paid gets credited for the full amount
            // This effectively means they paid totalAmount but only owe amountPerPerson
            // So their net change is: +amountPerPerson (from above) - totalAmount = amountPerPerson - totalAmount
            balances.put(paidById, balances.get(paidById) - totalAmount);

            logger.debug("Updated balances after expense {}: {}", expense.getDescription(), balances);
        }

        logger.info("Final balances for group {}: {}", groupId, balances);
        return balances;
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
