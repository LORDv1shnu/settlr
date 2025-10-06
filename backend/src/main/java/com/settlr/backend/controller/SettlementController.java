package com.settlr.backend.controller;

import com.settlr.backend.dto.SettlementDTO;
import com.settlr.backend.entity.Settlement;
import com.settlr.backend.service.SettlementService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/settlements")
@CrossOrigin(origins = "http://localhost:3000")
public class SettlementController {

    private static final Logger log = LoggerFactory.getLogger(SettlementController.class);

    @Autowired
    private SettlementService settlementService;

    /**
     * Create a new settlement
     * POST /api/settlements
     */
    @PostMapping
    public ResponseEntity<?> createSettlement(@RequestBody SettlementDTO dto) {
        try {
            log.info("POST /api/settlements - Creating settlement from user {} to user {} in group {} for amount {}", 
                     dto.getFromUserId(), dto.getToUserId(), dto.getGroupId(), dto.getAmount());

            Settlement settlement = settlementService.createSettlement(
                dto.getGroupId(),
                dto.getFromUserId(),
                dto.getToUserId(),
                dto.getAmount(),
                dto.getPaymentMethod(),
                dto.getNotes()
            );

            SettlementDTO responseDto = convertToDTO(settlement);
            log.info("Settlement created successfully with id: {}", settlement.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
        } catch (IllegalArgumentException e) {
            log.error("Invalid settlement request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error creating settlement", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create settlement: " + e.getMessage());
        }
    }

    /**
     * Get all settlements for a group
     * GET /api/settlements/group/{groupId}
     */
    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<SettlementDTO>> getSettlementsByGroup(@PathVariable Long groupId) {
        log.info("GET /api/settlements/group/{} - Fetching settlements for group", groupId);
        
        List<Settlement> settlements = settlementService.getSettlementsByGroup(groupId);
        List<SettlementDTO> dtos = settlements.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        log.info("Found {} settlements for group {}", dtos.size(), groupId);
        return ResponseEntity.ok(dtos);
    }

    /**
     * Get all settlements for a user
     * GET /api/settlements/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SettlementDTO>> getSettlementsByUser(@PathVariable Long userId) {
        log.info("GET /api/settlements/user/{} - Fetching settlements for user", userId);
        
        List<Settlement> settlements = settlementService.getSettlementsByUser(userId);
        List<SettlementDTO> dtos = settlements.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        log.info("Found {} settlements for user {}", dtos.size(), userId);
        return ResponseEntity.ok(dtos);
    }

    /**
     * Get settlements for a user in a specific group
     * GET /api/settlements/group/{groupId}/user/{userId}
     */
    @GetMapping("/group/{groupId}/user/{userId}")
    public ResponseEntity<List<SettlementDTO>> getSettlementsByGroupAndUser(
            @PathVariable Long groupId,
            @PathVariable Long userId) {
        log.info("GET /api/settlements/group/{}/user/{} - Fetching settlements", groupId, userId);
        
        List<Settlement> settlements = settlementService.getSettlementsByGroupAndUser(groupId, userId);
        List<SettlementDTO> dtos = settlements.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        log.info("Found {} settlements for group {} and user {}", dtos.size(), groupId, userId);
        return ResponseEntity.ok(dtos);
    }

    /**
     * Delete a settlement (for corrections)
     * DELETE /api/settlements/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSettlement(@PathVariable Long id) {
        try {
            log.info("DELETE /api/settlements/{} - Deleting settlement", id);
            settlementService.deleteSettlement(id);
            return ResponseEntity.ok().body("Settlement deleted successfully");
        } catch (Exception e) {
            log.error("Error deleting settlement", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete settlement: " + e.getMessage());
        }
    }

    /**
     * Helper method to convert Settlement entity to DTO
     */
    private SettlementDTO convertToDTO(Settlement settlement) {
        SettlementDTO dto = new SettlementDTO();
        dto.setId(settlement.getId());
        dto.setGroupId(settlement.getGroup().getId());
        dto.setGroupName(settlement.getGroup().getName());
        dto.setFromUserId(settlement.getFromUser().getId());
        dto.setFromUserName(settlement.getFromUser().getName());
        dto.setToUserId(settlement.getToUser().getId());
        dto.setToUserName(settlement.getToUser().getName());
        dto.setAmount(settlement.getAmount());
        dto.setSettledAt(settlement.getSettledAt());
        dto.setPaymentMethod(settlement.getPaymentMethod());
        dto.setNotes(settlement.getNotes());
        return dto;
    }
}
