package com.settlr.backend.dto;

import java.time.LocalDateTime;

public class GroupInvitationDTO {

    private Long id;
    private Long groupId;
    private String groupName;
    private Long inviterId;
    private String inviterName;
    private Long inviteeId;
    private String inviteeName;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;

    public GroupInvitationDTO() {}

    public GroupInvitationDTO(Long id, Long groupId, String groupName, Long inviterId, 
                              String inviterName, Long inviteeId, String inviteeName, 
                              String status, LocalDateTime createdAt, LocalDateTime respondedAt) {
        this.id = id;
        this.groupId = groupId;
        this.groupName = groupName;
        this.inviterId = inviterId;
        this.inviterName = inviterName;
        this.inviteeId = inviteeId;
        this.inviteeName = inviteeName;
        this.status = status;
        this.createdAt = createdAt;
        this.respondedAt = respondedAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getGroupId() {
        return groupId;
    }

    public void setGroupId(Long groupId) {
        this.groupId = groupId;
    }

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
    }

    public Long getInviterId() {
        return inviterId;
    }

    public void setInviterId(Long inviterId) {
        this.inviterId = inviterId;
    }

    public String getInviterName() {
        return inviterName;
    }

    public void setInviterName(String inviterName) {
        this.inviterName = inviterName;
    }

    public Long getInviteeId() {
        return inviteeId;
    }

    public void setInviteeId(Long inviteeId) {
        this.inviteeId = inviteeId;
    }

    public String getInviteeName() {
        return inviteeName;
    }

    public void setInviteeName(String inviteeName) {
        this.inviteeName = inviteeName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getRespondedAt() {
        return respondedAt;
    }

    public void setRespondedAt(LocalDateTime respondedAt) {
        this.respondedAt = respondedAt;
    }
}
