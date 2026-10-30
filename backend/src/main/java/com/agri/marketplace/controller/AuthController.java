package com.agri.marketplace.controller;

import com.agri.marketplace.dto.CsrfResponseDto;
import com.agri.marketplace.dto.LoginRequestDto;
import com.agri.marketplace.dto.RegisterRequestDto;
import com.agri.marketplace.dto.UserResponseDto;
import com.agri.marketplace.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponseDto> register(@Valid @RequestBody RegisterRequestDto requestDto) {
        UserResponseDto createdUser = authService.register(requestDto);
        return new ResponseEntity<>(createdUser, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponseDto> login(@Valid @RequestBody LoginRequestDto requestDto,
                                                 HttpServletRequest request,
                                                 HttpServletResponse response) {
        UserResponseDto user = authService.login(requestDto, request, response);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(request, response);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDto> getCurrentUser(Authentication authentication) {
        UserResponseDto user = authService.getCurrentUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(user);
    }

    @GetMapping("/csrf")
    public ResponseEntity<CsrfResponseDto> getCsrfToken(HttpServletRequest request) {
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (csrfToken != null) {
            return ResponseEntity.ok(new CsrfResponseDto(
                    csrfToken.getToken(),
                    csrfToken.getHeaderName(),
                    csrfToken.getParameterName()
            ));
        }
        return ResponseEntity.noContent().build();
    }
}
