package com.settlr.backend.controller;

import com.settlr.backend.dto.UserDTO;
import com.settlr.backend.service.UserService;
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
@RequestMapping("/api/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        logger.info("GET /api/users - Fetching all users");
        try {
            List<UserDTO> users = userService.getAllUsers();
            logger.info("GET /api/users - Successfully retrieved {} users", users.size());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("GET /api/users - Error retrieving users: {}", e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        logger.info("GET /api/users/{} - Fetching user by ID", id);
        try {
            Optional<UserDTO> user = userService.getUserById(id);
            if (user.isPresent()) {
                logger.info("GET /api/users/{} - User found: {}", id, user.get().getEmail());
                return ResponseEntity.ok(user.get());
            } else {
                logger.warn("GET /api/users/{} - User not found", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("GET /api/users/{} - Error retrieving user: {}", id, e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<UserDTO> getUserByEmail(@PathVariable String email) {
        logger.info("GET /api/users/email/{} - Fetching user by email", email);
        try {
            Optional<UserDTO> user = userService.getUserByEmail(email);
            if (user.isPresent()) {
                logger.info("GET /api/users/email/{} - User found with ID: {}", email, user.get().getId());
                return ResponseEntity.ok(user.get());
            } else {
                logger.warn("GET /api/users/email/{} - User not found", email);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("GET /api/users/email/{} - Error retrieving user: {}", email, e.getMessage(), e);
            throw e;
        }
    }

    @PostMapping
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody UserDTO userDTO) {
        logger.info("POST /api/users - Creating new user with email: {}", userDTO.getEmail());
        logger.debug("POST /api/users - User data: name={}, email={}", userDTO.getName(), userDTO.getEmail());

        try {
            UserDTO createdUser = userService.createUser(userDTO);
            logger.info("POST /api/users - Successfully created user with ID: {} and email: {}",
                       createdUser.getId(), createdUser.getEmail());
            return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
        } catch (RuntimeException e) {
            logger.error("POST /api/users - Error creating user with email {}: {}",
                        userDTO.getEmail(), e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("POST /api/users - Unexpected error creating user with email {}: {}",
                        userDTO.getEmail(), e.getMessage(), e);
            throw e;
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @Valid @RequestBody UserDTO userDTO) {
        logger.info("PUT /api/users/{} - Updating user with ID: {}", id, userDTO.getEmail());
        logger.debug("PUT /api/users/{} - Updated user data: name={}, email={}", id, userDTO.getName(), userDTO.getEmail());

        try {
            UserDTO updatedUser = userService.updateUser(id, userDTO);
            logger.info("PUT /api/users/{} - Successfully updated user", id);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            logger.error("PUT /api/users/{} - Error updating user: {}", id, e.getMessage(), e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("PUT /api/users/{} - Unexpected error updating user: {}", id, e.getMessage(), e);
            throw e;
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        logger.info("DELETE /api/users/{} - Deleting user", id);
        try {
            userService.deleteUser(id);
            logger.info("DELETE /api/users/{} - Successfully deleted user", id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            logger.error("DELETE /api/users/{} - Error deleting user: {}", id, e.getMessage(), e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("DELETE /api/users/{} - Unexpected error deleting user: {}", id, e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserDTO>> searchUsers(@RequestParam String name) {
        logger.info("GET /api/users/search - Searching users by name: {}", name);
        try {
            List<UserDTO> users = userService.searchUsersByName(name);
            logger.info("GET /api/users/search - Found {} users matching the name: {}", users.size(), name);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("GET /api/users/search - Error searching users: {}", e.getMessage(), e);
            throw e;
        }
    }
}
