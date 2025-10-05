package com.settlr.backend.service;

import com.settlr.backend.dto.ExpenseGroupDTO;
import com.settlr.backend.dto.UserDTO;
import com.settlr.backend.entity.ExpenseGroup;
import com.settlr.backend.entity.User;
import com.settlr.backend.repository.ExpenseGroupRepository;
import com.settlr.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ExpenseGroupService {

    @Autowired
    private ExpenseGroupRepository expenseGroupRepository;

    @Autowired
    private UserRepository userRepository;

    public List<ExpenseGroupDTO> getAllGroups() {
        return expenseGroupRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Optional<ExpenseGroupDTO> getGroupById(Long id) {
        return expenseGroupRepository.findById(id)
                .map(this::convertToDTO);
    }

    public List<ExpenseGroupDTO> getGroupsByUserId(Long userId) {
        return expenseGroupRepository.findGroupsByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ExpenseGroupDTO createGroup(ExpenseGroupDTO groupDTO) {
        ExpenseGroup group = convertToEntity(groupDTO);

        // Add members to the group
        if (groupDTO.getMemberIds() != null && !groupDTO.getMemberIds().isEmpty()) {
            List<User> members = userRepository.findAllById(groupDTO.getMemberIds());
            group.setMembers(members);
        }

        ExpenseGroup savedGroup = expenseGroupRepository.save(group);
        return convertToDTO(savedGroup);
    }

    public ExpenseGroupDTO updateGroup(Long id, ExpenseGroupDTO groupDTO) {
        ExpenseGroup existingGroup = expenseGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + id));

        existingGroup.setName(groupDTO.getName());
        existingGroup.setDescription(groupDTO.getDescription());

        // Update members if provided
        if (groupDTO.getMemberIds() != null) {
            List<User> members = userRepository.findAllById(groupDTO.getMemberIds());
            existingGroup.setMembers(members);
        }

        ExpenseGroup savedGroup = expenseGroupRepository.save(existingGroup);
        return convertToDTO(savedGroup);
    }

    public void deleteGroup(Long id) {
        if (!expenseGroupRepository.existsById(id)) {
            throw new RuntimeException("Group not found with id: " + id);
        }
        expenseGroupRepository.deleteById(id);
    }

    public ExpenseGroupDTO addMemberToGroup(Long groupId, Long userId) {
        ExpenseGroup group = expenseGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + groupId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        group.addMember(user);
        ExpenseGroup savedGroup = expenseGroupRepository.save(group);
        return convertToDTO(savedGroup);
    }

    public ExpenseGroupDTO removeMemberFromGroup(Long groupId, Long userId) {
        ExpenseGroup group = expenseGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + groupId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        group.removeMember(user);
        ExpenseGroup savedGroup = expenseGroupRepository.save(group);
        return convertToDTO(savedGroup);
    }

    // Helper methods for conversion
    private ExpenseGroupDTO convertToDTO(ExpenseGroup group) {
        ExpenseGroupDTO dto = new ExpenseGroupDTO();
        dto.setId(group.getId());
        dto.setName(group.getName());
        dto.setDescription(group.getDescription());
        dto.setCreatedAt(group.getCreatedAt());

        // Convert members to DTOs
        List<UserDTO> memberDTOs = group.getMembers().stream()
                .map(this::convertUserToDTO)
                .collect(Collectors.toList());
        dto.setMembers(memberDTOs);

        // Set member IDs
        List<Long> memberIds = group.getMembers().stream()
                .map(User::getId)
                .collect(Collectors.toList());
        dto.setMemberIds(memberIds);

        return dto;
    }

    private ExpenseGroup convertToEntity(ExpenseGroupDTO dto) {
        ExpenseGroup group = new ExpenseGroup();
        group.setName(dto.getName());
        group.setDescription(dto.getDescription());
        return group;
    }

    private UserDTO convertUserToDTO(User user) {
        return new UserDTO(user.getId(), user.getName(), user.getEmail(), user.getCreatedAt());
    }
}
