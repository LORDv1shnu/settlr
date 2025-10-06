package com.settlr.backend.controller;

import com.settlr.backend.dto.LoginRequest;
import com.settlr.backend.dto.UserDTO;
import com.settlr.backend.entity.User;
import com.settlr.backend.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<UserDTO> login(@RequestBody LoginRequest req) {
        logger.info("POST /api/auth/login - Attempt login for email: {}", req.getEmail());

        Optional<UserDTO> userOpt = userService.getUserByEmail(req.getEmail());
        if (userOpt.isEmpty()) {
            logger.warn("Login failed - user not found: {}", req.getEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserDTO userDTO = userOpt.get();
        // Fetch raw entity to check password (service helper)
        Optional<User> userEntityOpt = userService.findEntityByEmail(req.getEmail());
        if (userEntityOpt.isEmpty()) {
            logger.error("Login inconsistency - user DTO present but entity missing for: {}", req.getEmail());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }

        User user = userEntityOpt.get();
        if (user.getPassword() != null && user.getPassword().equals(req.getPassword())) {
            // Do not return password in response
            userDTO.setPassword(null);
            logger.info("Login successful for email: {}", req.getEmail());
            return ResponseEntity.ok(userDTO);
        } else {
            logger.warn("Login failed - invalid password for: {}", req.getEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}
