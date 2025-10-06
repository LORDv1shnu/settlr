package com.settlr.backend.service;

import com.settlr.backend.dto.GroupInvitationDTO;
import com.settlr.backend.entity.ExpenseGroup;
import com.settlr.backend.entity.GroupInvitation;
import com.settlr.backend.entity.GroupInvitation.InvitationStatus;
import com.settlr.backend.entity.User;
import com.settlr.backend.repository.ExpenseGroupRepository;
import com.settlr.backend.repository.GroupInvitationRepository;
import com.settlr.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class GroupInvitationService {

    private static final Logger logger = LoggerFactory.getLogger(GroupInvitationService.class);

    @Autowired
    private GroupInvitationRepository invitationRepository;

    @Autowired
    private ExpenseGroupRepository groupRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public GroupInvitationDTO sendInvitation(Long groupId, Long inviterId, Long inviteeId) {
        logger.info("Sending invitation for group {} from user {} to user {}", groupId, inviterId, inviteeId);

        // Check if invitation already exists
        if (invitationRepository.existsByGroupIdAndInviteeIdAndStatus(groupId, inviteeId, InvitationStatus.PENDING)) {
            throw new RuntimeException("Invitation already pending for this user");
        }

        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        User inviter = userRepository.findById(inviterId)
                .orElseThrow(() -> new RuntimeException("Inviter not found"));

        User invitee = userRepository.findById(inviteeId)
                .orElseThrow(() -> new RuntimeException("Invitee not found"));

        // Check if user is already a member
        if (group.getMembers().stream().anyMatch(m -> m.getId().equals(inviteeId))) {
            throw new RuntimeException("User is already a member of this group");
        }

        GroupInvitation invitation = new GroupInvitation(group, inviter, invitee);
        GroupInvitation saved = invitationRepository.save(invitation);

        logger.info("Invitation sent successfully with ID: {}", saved.getId());
        return convertToDTO(saved);
    }

    @Transactional
    public GroupInvitationDTO acceptInvitation(Long invitationId) {
        logger.info("Accepting invitation with ID: {}", invitationId);

        GroupInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new RuntimeException("Invitation has already been responded to");
        }

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitation.setRespondedAt(LocalDateTime.now());

        // Add user to group
        ExpenseGroup group = invitation.getGroup();
        User invitee = invitation.getInvitee();
        group.getMembers().add(invitee);

        groupRepository.save(group);
        GroupInvitation saved = invitationRepository.save(invitation);

        logger.info("Invitation accepted and user {} added to group {}", invitee.getId(), group.getId());
        return convertToDTO(saved);
    }

    @Transactional
    public GroupInvitationDTO rejectInvitation(Long invitationId) {
        logger.info("Rejecting invitation with ID: {}", invitationId);

        GroupInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new RuntimeException("Invitation has already been responded to");
        }

        invitation.setStatus(InvitationStatus.REJECTED);
        invitation.setRespondedAt(LocalDateTime.now());

        GroupInvitation saved = invitationRepository.save(invitation);

        logger.info("Invitation rejected");
        return convertToDTO(saved);
    }

    public List<GroupInvitationDTO> getPendingInvitationsForUser(Long userId) {
        logger.info("Fetching pending invitations for user: {}", userId);
        List<GroupInvitation> invitations = invitationRepository.findByInviteeIdAndStatus(userId, InvitationStatus.PENDING);
        return invitations.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<GroupInvitationDTO> getAllInvitationsForUser(Long userId) {
        logger.info("Fetching all invitations for user: {}", userId);
        List<GroupInvitation> invitations = invitationRepository.findByInviteeId(userId);
        return invitations.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    private GroupInvitationDTO convertToDTO(GroupInvitation invitation) {
        return new GroupInvitationDTO(
                invitation.getId(),
                invitation.getGroup().getId(),
                invitation.getGroup().getName(),
                invitation.getInviter().getId(),
                invitation.getInviter().getName(),
                invitation.getInvitee().getId(),
                invitation.getInvitee().getName(),
                invitation.getStatus().name(),
                invitation.getCreatedAt(),
                invitation.getRespondedAt()
        );
    }
}
