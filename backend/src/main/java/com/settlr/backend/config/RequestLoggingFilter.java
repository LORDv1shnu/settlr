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
        String method = request.getMethod();
        String url = request.getRequestURL().toString();

        // Only log important operations (POST, PUT, DELETE) or errors
        boolean shouldLog = !method.equals("GET") || logger.isDebugEnabled();

        if (shouldLog) {
            logger.info("=== {} {} ===", method, url);
            logger.debug("Headers: User-Agent={}, Content-Type={}, Origin={}",
                       request.getHeader("User-Agent"), request.getHeader("Content-Type"), request.getHeader("Origin"));
        }

        try {
            // Continue with the request
            filterChain.doFilter(request, response);
        } finally {
            // Log response for important operations or errors
            long duration = System.currentTimeMillis() - startTime;
            int status = response.getStatus();

            if (shouldLog || status >= 400) {
                if (status >= 400) {
                    logger.warn("=== RESPONSE ERROR ===");
                    logger.warn("Status: {} | Duration: {}ms | URL: {}", status, duration, url);
                } else if (shouldLog) {
                    logger.info("=== RESPONSE ===");
                    logger.info("Status: {} | Duration: {}ms", status, duration);
                }
            }
        }
    }
}
