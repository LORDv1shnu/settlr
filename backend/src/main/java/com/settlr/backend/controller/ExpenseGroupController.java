package com.settlr.backend.controller;

import com.settlr.backend.dto.ExpenseGroupDTO;
import com.settlr.backend.service.ExpenseGroupService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/groups")
@CrossOrigin(origins = "*")
public class ExpenseGroupController {

    @Autowired
    private ExpenseGroupService expenseGroupService;

    @GetMapping
    public ResponseEntity<List<ExpenseGroupDTO>> getAllGroups() {
        List<ExpenseGroupDTO> groups = expenseGroupService.getAllGroups();
        return ResponseEntity.ok(groups);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseGroupDTO> getGroupById(@PathVariable Long id) {
        Optional<ExpenseGroupDTO> group = expenseGroupService.getGroupById(id);
        return group.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ExpenseGroupDTO>> getGroupsByUserId(@PathVariable Long userId) {
        List<ExpenseGroupDTO> groups = expenseGroupService.getGroupsByUserId(userId);
        return ResponseEntity.ok(groups);
    }

    @PostMapping
    public ResponseEntity<ExpenseGroupDTO> createGroup(@Valid @RequestBody ExpenseGroupDTO groupDTO) {
        try {
            ExpenseGroupDTO createdGroup = expenseGroupService.createGroup(groupDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdGroup);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
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
