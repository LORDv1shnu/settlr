package com.settlr.backend.service;

import com.settlr.backend.entity.ExpenseGroup;
import com.settlr.backend.entity.Settlement;
import com.settlr.backend.entity.User;
import com.settlr.backend.repository.ExpenseGroupRepository;
import com.settlr.backend.repository.SettlementRepository;
import com.settlr.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class SettlementService {

    private static final Logger log = LoggerFactory.getLogger(SettlementService.class);

    @Autowired
    private SettlementRepository settlementRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExpenseGroupRepository expenseGroupRepository;

    /**
     * Create a new settlement
     */
    @Transactional
    public Settlement createSettlement(Long groupId, Long fromUserId, Long toUserId, BigDecimal amount, String paymentMethod, String notes) {
        log.info("Creating settlement: groupId={}, fromUserId={}, toUserId={}, amount={}", 
                 groupId, fromUserId, toUserId, amount);

        // Validate inputs
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }

        if (fromUserId.equals(toUserId)) {
            throw new IllegalArgumentException("From user and to user cannot be the same");
        }

        // Fetch entities
        ExpenseGroup group = expenseGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found with id: " + groupId));

        User fromUser = userRepository.findById(fromUserId)
                .orElseThrow(() -> new IllegalArgumentException("From user not found with id: " + fromUserId));

        User toUser = userRepository.findById(toUserId)
                .orElseThrow(() -> new IllegalArgumentException("To user not found with id: " + toUserId));

        // Create settlement
        Settlement settlement = new Settlement(group, fromUser, toUser, amount);
        settlement.setPaymentMethod(paymentMethod);
        settlement.setNotes(notes);

        Settlement savedSettlement = settlementRepository.save(settlement);
        log.info("Settlement created successfully with id: {}", savedSettlement.getId());

        return savedSettlement;
    }

    /**
     * Get all settlements for a group
     */
    public List<Settlement> getSettlementsByGroup(Long groupId) {
        log.info("Fetching settlements for group: {}", groupId);
        return settlementRepository.findByGroupId(groupId);
    }

    /**
     * Get all settlements involving a user
     */
    public List<Settlement> getSettlementsByUser(Long userId) {
        log.info("Fetching settlements for user: {}", userId);
        return settlementRepository.findByUserId(userId);
    }

    /**
     * Get all settlements in a group involving a specific user
     */
    public List<Settlement> getSettlementsByGroupAndUser(Long groupId, Long userId) {
        log.info("Fetching settlements for group: {} and user: {}", groupId, userId);
        return settlementRepository.findByGroupIdAndUserId(groupId, userId);
    }

    /**
     * Get settlements between two specific users in a group
     */
    public List<Settlement> getSettlementsBetweenUsers(Long groupId, Long fromUserId, Long toUserId) {
        log.info("Fetching settlements for group: {}, from: {}, to: {}", groupId, fromUserId, toUserId);
        return settlementRepository.findByGroupIdAndUsers(groupId, fromUserId, toUserId);
    }

    /**
     * Get settlement by ID
     */
    public Optional<Settlement> getSettlementById(Long id) {
        return settlementRepository.findById(id);
    }

    /**
     * Delete a settlement (in case of error)
     */
    @Transactional
    public void deleteSettlement(Long id) {
        log.info("Deleting settlement: {}", id);
        settlementRepository.deleteById(id);
    }

    /**
     * Calculate total settled amount between two users in a group
     */
    public BigDecimal getTotalSettledAmount(Long groupId, Long fromUserId, Long toUserId) {
        List<Settlement> settlements = getSettlementsBetweenUsers(groupId, fromUserId, toUserId);
        return settlements.stream()
                .map(Settlement::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
