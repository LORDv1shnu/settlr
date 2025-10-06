package com.settlr.backend.controller;

import com.settlr.backend.dto.GroupInvitationDTO;
import com.settlr.backend.service.GroupInvitationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invitations")
public class GroupInvitationController {

    private static final Logger logger = LoggerFactory.getLogger(GroupInvitationController.class);

    @Autowired
    private GroupInvitationService invitationService;

    @PostMapping("/send")
    public ResponseEntity<GroupInvitationDTO> sendInvitation(
            @RequestParam Long groupId,
            @RequestParam Long inviterId,
            @RequestParam Long inviteeId) {
        logger.info("POST /api/invitations/send - group={}, inviter={}, invitee={}", groupId, inviterId, inviteeId);
        try {
            GroupInvitationDTO invitation = invitationService.sendInvitation(groupId, inviterId, inviteeId);
            return ResponseEntity.status(HttpStatus.CREATED).body(invitation);
        } catch (RuntimeException e) {
            logger.error("Failed to send invitation: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{invitationId}/accept")
    public ResponseEntity<GroupInvitationDTO> acceptInvitation(@PathVariable Long invitationId) {
        logger.info("POST /api/invitations/{}/accept", invitationId);
        try {
            GroupInvitationDTO invitation = invitationService.acceptInvitation(invitationId);
            return ResponseEntity.ok(invitation);
        } catch (RuntimeException e) {
            logger.error("Failed to accept invitation: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{invitationId}/reject")
    public ResponseEntity<GroupInvitationDTO> rejectInvitation(@PathVariable Long invitationId) {
        logger.info("POST /api/invitations/{}/reject", invitationId);
        try {
            GroupInvitationDTO invitation = invitationService.rejectInvitation(invitationId);
            return ResponseEntity.ok(invitation);
        } catch (RuntimeException e) {
            logger.error("Failed to reject invitation: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/user/{userId}/pending")
    public ResponseEntity<List<GroupInvitationDTO>> getPendingInvitations(@PathVariable Long userId) {
        logger.info("GET /api/invitations/user/{}/pending", userId);
        try {
            List<GroupInvitationDTO> invitations = invitationService.getPendingInvitationsForUser(userId);
            return ResponseEntity.ok(invitations);
        } catch (Exception e) {
            logger.error("Failed to fetch pending invitations: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<GroupInvitationDTO>> getAllInvitations(@PathVariable Long userId) {
        logger.info("GET /api/invitations/user/{}", userId);
        try {
            List<GroupInvitationDTO> invitations = invitationService.getAllInvitationsForUser(userId);
            return ResponseEntity.ok(invitations);
        } catch (Exception e) {
            logger.error("Failed to fetch invitations: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
