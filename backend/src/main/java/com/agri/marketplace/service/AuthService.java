package com.agri.marketplace.service;

import com.agri.marketplace.dto.LoginRequestDto;
import com.agri.marketplace.dto.RegisterRequestDto;
import com.agri.marketplace.dto.UserResponseDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;

public interface AuthService {

    UserResponseDto register(RegisterRequestDto requestDto);

    UserResponseDto login(LoginRequestDto requestDto, HttpServletRequest request, HttpServletResponse response);

    void logout(HttpServletRequest request, HttpServletResponse response);

    UserResponseDto getCurrentUser(Authentication authentication);
}
