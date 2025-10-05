package com.settlr.backend.service;

import com.settlr.backend.dto.UserDTO;
import com.settlr.backend.entity.User;
import com.settlr.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    public List<UserDTO> getAllUsers() {
        logger.debug("UserService.getAllUsers() - Fetching all users from database");
        try {
            List<User> users = userRepository.findAll();
            logger.info("UserService.getAllUsers() - Found {} users in database", users.size());
            return users.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("UserService.getAllUsers() - Database error: {}", e.getMessage(), e);
            throw e;
        }
    }

    public Optional<UserDTO> getUserById(Long id) {
        logger.debug("UserService.getUserById() - Searching for user with ID: {}", id);
        try {
            Optional<User> user = userRepository.findById(id);
            if (user.isPresent()) {
                logger.info("UserService.getUserById() - Found user with ID: {}, email: {}",
                           id, user.get().getEmail());
            } else {
                logger.warn("UserService.getUserById() - No user found with ID: {}", id);
            }
            return user.map(this::convertToDTO);
        } catch (Exception e) {
            logger.error("UserService.getUserById() - Database error for ID {}: {}", id, e.getMessage(), e);
            throw e;
        }
    }

    public Optional<UserDTO> getUserByEmail(String email) {
        logger.debug("UserService.getUserByEmail() - Searching for user with email: {}", email);
        try {
            Optional<User> user = userRepository.findByEmail(email);
            if (user.isPresent()) {
                logger.info("UserService.getUserByEmail() - Found user with email: {}, ID: {}",
                           email, user.get().getId());
            } else {
                logger.warn("UserService.getUserByEmail() - No user found with email: {}", email);
            }
            return user.map(this::convertToDTO);
        } catch (Exception e) {
            logger.error("UserService.getUserByEmail() - Database error for email {}: {}", email, e.getMessage(), e);
            throw e;
        }
    }

    public UserDTO createUser(UserDTO userDTO) {
        logger.info("UserService.createUser() - Creating user with email: {}, name: {}",
                   userDTO.getEmail(), userDTO.getName());

        try {
            // Check if user already exists
            logger.debug("UserService.createUser() - Checking if user already exists with email: {}", userDTO.getEmail());
            boolean exists = userRepository.existsByEmail(userDTO.getEmail());

            if (exists) {
                logger.warn("UserService.createUser() - User already exists with email: {}", userDTO.getEmail());
                throw new RuntimeException("User with email " + userDTO.getEmail() + " already exists");
            }

            logger.debug("UserService.createUser() - Email is unique, proceeding with user creation");
            User user = convertToEntity(userDTO);
            logger.debug("UserService.createUser() - Converted DTO to entity, saving to database");

            User savedUser = userRepository.save(user);
            logger.info("UserService.createUser() - Successfully saved user to database with ID: {}", savedUser.getId());

            UserDTO result = convertToDTO(savedUser);
            logger.info("UserService.createUser() - User creation completed successfully for email: {}", userDTO.getEmail());
            return result;

        } catch (RuntimeException e) {
            logger.error("UserService.createUser() - Business logic error for email {}: {}",
                        userDTO.getEmail(), e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            logger.error("UserService.createUser() - Unexpected database error for email {}: {}",
                        userDTO.getEmail(), e.getMessage(), e);
            throw new RuntimeException("Failed to create user: " + e.getMessage(), e);
        }
    }

    public UserDTO updateUser(Long id, UserDTO userDTO) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // Check if email is being changed and if it already exists
        if (!existingUser.getEmail().equals(userDTO.getEmail()) &&
            userRepository.existsByEmail(userDTO.getEmail())) {
            throw new RuntimeException("User with email " + userDTO.getEmail() + " already exists");
        }

        existingUser.setName(userDTO.getName());
        existingUser.setEmail(userDTO.getEmail());

        User savedUser = userRepository.save(existingUser);
        return convertToDTO(savedUser);
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }

    public List<UserDTO> searchUsersByName(String name) {
        return userRepository.findByNameContaining(name).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Helper methods for conversion
    private UserDTO convertToDTO(User user) {
        logger.trace("UserService.convertToDTO() - Converting user entity to DTO for ID: {}", user.getId());
        return new UserDTO(user.getId(), user.getName(), user.getEmail(), user.getCreatedAt());
    }

    private User convertToEntity(UserDTO userDTO) {
        logger.trace("UserService.convertToEntity() - Converting DTO to user entity for email: {}", userDTO.getEmail());
        User user = new User();
        user.setName(userDTO.getName());
        user.setEmail(userDTO.getEmail());
        return user;
    }
}
