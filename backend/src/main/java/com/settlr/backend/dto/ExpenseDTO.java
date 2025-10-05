package com.settlr.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class ExpenseDTO {

    private Long id;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    @NotNull(message = "Paid by user ID is required")
    private Long paidById;

    private UserDTO paidBy;

    @NotNull(message = "Group ID is required")
    private Long groupId;

    private ExpenseGroupDTO group;

    private List<Long> splitBetween = new ArrayList<>();

    private List<UserDTO> splitBetweenUsers = new ArrayList<>();

    private LocalDateTime createdAt;

    private BigDecimal amountPerPerson;

    // Constructors
    public ExpenseDTO() {}

    public ExpenseDTO(String description, BigDecimal amount, Long paidById, Long groupId) {
        this.description = description;
        this.amount = amount;
        this.paidById = paidById;
        this.groupId = groupId;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Long getPaidById() {
        return paidById;
    }

    public void setPaidById(Long paidById) {
        this.paidById = paidById;
    }

    public UserDTO getPaidBy() {
        return paidBy;
    }

    public void setPaidBy(UserDTO paidBy) {
        this.paidBy = paidBy;
    }

    public Long getGroupId() {
        return groupId;
    }

    public void setGroupId(Long groupId) {
        this.groupId = groupId;
    }

    public ExpenseGroupDTO getGroup() {
        return group;
    }

    public void setGroup(ExpenseGroupDTO group) {
        this.group = group;
    }

    public List<Long> getSplitBetween() {
        return splitBetween;
    }

    public void setSplitBetween(List<Long> splitBetween) {
        this.splitBetween = splitBetween;
    }

    public List<UserDTO> getSplitBetweenUsers() {
        return splitBetweenUsers;
    }

    public void setSplitBetweenUsers(List<UserDTO> splitBetweenUsers) {
        this.splitBetweenUsers = splitBetweenUsers;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public BigDecimal getAmountPerPerson() {
        return amountPerPerson;
    }

    public void setAmountPerPerson(BigDecimal amountPerPerson) {
        this.amountPerPerson = amountPerPerson;
    }
}
