package com.paycircle.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@Tag(name = "Health Check", description = "Application health status")
public class HealthController {

    @GetMapping
    @Operation(summary = "System health check endpoint")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "app", "PayCircle Backend API",
                "tagline", "Split Smart. Pay Fair. Stay Connected.",
                "version", "1.0.0",
                "timestamp", LocalDateTime.now()
        ));
    }
}
