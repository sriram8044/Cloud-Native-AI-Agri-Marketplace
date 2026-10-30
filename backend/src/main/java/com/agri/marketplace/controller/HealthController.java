package com.agri.marketplace.controller;

import com.agri.marketplace.dto.HealthResponseDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<HealthResponseDto> getHealth() {
        HealthResponseDto response = new HealthResponseDto(
                "UP",
                "agri-marketplace-backend",
                "Cloud-Native Agri Marketplace Backend is running",
                LocalDateTime.now()
        );
        return ResponseEntity.ok(response);
    }
}
