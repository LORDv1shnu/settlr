package com.settlr.backend.controller;

import com.settlr.backend.dto.ExpenseGroupDTO;
import com.settlr.backend.service.ExpenseGroupService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/groups")
public class ExpenseGroupController {

    private static final Logger logger = LoggerFactory.getLogger(ExpenseGroupController.class);

    @Autowired
    private ExpenseGroupService expenseGroupService;

    @GetMapping
    public ResponseEntity<List<ExpenseGroupDTO>> getAllGroups() {
        logger.info("GET /api/groups - Fetching all groups");
        List<ExpenseGroupDTO> groups = expenseGroupService.getAllGroups();
        logger.info("GET /api/groups - Successfully retrieved {} groups", groups.size());
        return ResponseEntity.ok(groups);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseGroupDTO> getGroupById(@PathVariable Long id) {
        logger.info("GET /api/groups/{} - Fetching group by ID", id);
        Optional<ExpenseGroupDTO> group = expenseGroupService.getGroupById(id);
        if (group.isPresent()) {
            logger.info("GET /api/groups/{} - Group found: {}", id, group.get().getName());
            return ResponseEntity.ok(group.get());
        } else {
            logger.warn("GET /api/groups/{} - Group not found", id);
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ExpenseGroupDTO>> getGroupsByUserId(@PathVariable Long userId) {
        logger.info("GET /api/groups/user/{} - Fetching groups for user", userId);
        List<ExpenseGroupDTO> groups = expenseGroupService.getGroupsByUserId(userId);
        logger.info("GET /api/groups/user/{} - Found {} groups for user", userId, groups.size());
        return ResponseEntity.ok(groups);
    }

    @PostMapping
    public ResponseEntity<ExpenseGroupDTO> createGroup(@Valid @RequestBody ExpenseGroupDTO groupDTO,
                                                       @RequestParam(required = false) Long createdByUserId) {
        logger.info("POST /api/groups - Creating new group with name: {}", groupDTO.getName());
        logger.debug("POST /api/groups - Group data: name={}, description={}, memberIds={}, createdByUserId={}",
                    groupDTO.getName(), groupDTO.getDescription(), groupDTO.getMemberIds(), createdByUserId);

        try {
            // If createdByUserId is provided, add it to memberIds if not already present
            if (createdByUserId != null) {
                if (groupDTO.getMemberIds() == null) {
                    groupDTO.setMemberIds(new java.util.ArrayList<>());
                }
                if (!groupDTO.getMemberIds().contains(createdByUserId)) {
                    groupDTO.getMemberIds().add(createdByUserId);
                    logger.info("POST /api/groups - Added creator (user ID: {}) to group members", createdByUserId);
                }
            }

            ExpenseGroupDTO createdGroup = expenseGroupService.createGroup(groupDTO);
            logger.info("POST /api/groups - Successfully created group with ID: {} and name: {}",
                       createdGroup.getId(), createdGroup.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(createdGroup);
        } catch (RuntimeException e) {
            logger.error("POST /api/groups - Error creating group with name {}: {}",
                        groupDTO.getName(), e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("POST /api/groups - Unexpected error creating group with name {}: {}",
                        groupDTO.getName(), e.getMessage(), e);
            throw e;
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpenseGroupDTO> updateGroup(@PathVariable Long id, @Valid @RequestBody ExpenseGroupDTO groupDTO) {
        try {
            ExpenseGroupDTO updatedGroup = expenseGroupService.updateGroup(id, groupDTO);
            return ResponseEntity.ok(updatedGroup);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long id) {
        try {
            expenseGroupService.deleteGroup(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{groupId}/members/{userId}")
    public ResponseEntity<ExpenseGroupDTO> addMemberToGroup(@PathVariable Long groupId, @PathVariable Long userId) {
        try {
            ExpenseGroupDTO updatedGroup = expenseGroupService.addMemberToGroup(groupId, userId);
            return ResponseEntity.ok(updatedGroup);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<ExpenseGroupDTO> removeMemberFromGroup(@PathVariable Long groupId, @PathVariable Long userId) {
        try {
            ExpenseGroupDTO updatedGroup = expenseGroupService.removeMemberFromGroup(groupId, userId);
            return ResponseEntity.ok(updatedGroup);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
