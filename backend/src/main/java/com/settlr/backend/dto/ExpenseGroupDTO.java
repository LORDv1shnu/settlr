package com.settlr.backend.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class ExpenseGroupDTO {

    private Long id;

    @NotBlank(message = "Group name is required")
    private String name;

    private String description;

    private LocalDateTime createdAt;

    private List<UserDTO> members = new ArrayList<>();

    private List<Long> memberIds = new ArrayList<>();

    // Constructors
    public ExpenseGroupDTO() {}

    public ExpenseGroupDTO(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public ExpenseGroupDTO(Long id, String name, String description, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<UserDTO> getMembers() {
        return members;
    }

    public void setMembers(List<UserDTO> members) {
        this.members = members;
    }

    public List<Long> getMemberIds() {
        return memberIds;
    }

    public void setMemberIds(List<Long> memberIds) {
        this.memberIds = memberIds;
    }
}
