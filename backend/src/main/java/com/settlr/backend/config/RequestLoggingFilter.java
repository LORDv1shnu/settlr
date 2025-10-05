package com.settlr.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                  FilterChain filterChain) throws ServletException, IOException {

        long startTime = System.currentTimeMillis();

        // Log incoming request
        logger.info("=== INCOMING REQUEST ===");
        logger.info("Method: {} | URL: {} | Remote Address: {}",
                   request.getMethod(), request.getRequestURL().toString(), request.getRemoteAddr());
        logger.info("Headers: User-Agent={}, Content-Type={}, Origin={}",
                   request.getHeader("User-Agent"), request.getHeader("Content-Type"), request.getHeader("Origin"));

        try {
            // Continue with the request
            filterChain.doFilter(request, response);
        } finally {
            // Log response
            long duration = System.currentTimeMillis() - startTime;
            logger.info("=== RESPONSE ===");
            logger.info("Status: {} | Duration: {}ms | Content-Type: {}",
                       response.getStatus(), duration, response.getContentType());
            logger.info("========================");
        }
    }
}
