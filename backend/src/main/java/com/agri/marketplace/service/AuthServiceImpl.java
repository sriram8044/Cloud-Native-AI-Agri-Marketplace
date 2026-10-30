package com.agri.marketplace.service;

import com.agri.marketplace.dto.LoginRequestDto;
import com.agri.marketplace.dto.RegisterRequestDto;
import com.agri.marketplace.dto.UserResponseDto;
import com.agri.marketplace.entity.Role;
import com.agri.marketplace.entity.User;
import com.agri.marketplace.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public AuthServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
    }

    @Override
    public UserResponseDto register(RegisterRequestDto requestDto) {
        // Enforce role security: ADMIN cannot be registered publicly
        if (requestDto.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Privileged role assignment is prohibited. Registration as ADMIN is not permitted.");
        }

        String normalizedEmail = requestDto.getEmail().toLowerCase().trim();

        // Enforce unique email check
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("An account with this email address already exists.");
        }

        // Determine assigned role (default: CUSTOMER, or FARMER if specified)
        Role assignedRole = requestDto.getRole() != null ? requestDto.getRole() : Role.CUSTOMER;

        User user = new User();
        user.setName(requestDto.getName().trim());
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(requestDto.getPassword()));
        user.setRole(assignedRole);

        User savedUser = userRepository.save(user);
        return mapToResponseDto(savedUser);
    }

    @Override
    public UserResponseDto login(LoginRequestDto requestDto, HttpServletRequest request, HttpServletResponse response) {
        String normalizedEmail = requestDto.getEmail().toLowerCase().trim();

        // Authenticate credentials against UserDetailsService & PasswordEncoder
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, requestDto.getPassword())
        );

        // Establish SecurityContext and server-managed session
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        HttpSession session = request.getSession(true);
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalStateException("Authenticated user record not found."));

        return mapToResponseDto(user);
    }

    @Override
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponseDto getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() ||
                "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found: " + email));

        return mapToResponseDto(user);
    }

    private UserResponseDto mapToResponseDto(User user) {
        return new UserResponseDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt()
        );
    }
}
