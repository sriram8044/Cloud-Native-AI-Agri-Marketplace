package com.agri.marketplace.security;

import com.agri.marketplace.dto.ErrorResponseDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final ObjectMapper objectMapper;

    public SecurityConfig(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // Configure Cookie-based CSRF protection with readable cookie for Single Page Apps
        CookieCsrfTokenRepository tokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
        requestHandler.setCsrfRequestAttributeName(null);

        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf
                .csrfTokenRepository(tokenRepository)
                .csrfTokenRequestHandler(requestHandler)
                .ignoringRequestMatchers("/api/auth/register", "/api/auth/login")
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )
            .authorizeHttpRequests(auth -> auth
                // Public endpoints: Health & Actuator
                .requestMatchers(HttpMethod.GET, "/api/health", "/actuator/**").permitAll()
                // Public endpoints: Crop browsing and search
                .requestMatchers(HttpMethod.GET, "/api/crops", "/api/crops/**").permitAll()
                // Public endpoints: Authentication onboarding
                .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/auth/csrf").permitAll()
                // Protected authentication endpoints
                .requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/auth/logout").authenticated()
                // Farmer-only protected operations
                .requestMatchers(HttpMethod.POST, "/api/crops").hasAnyRole("FARMER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/crops/**").hasAnyRole("FARMER", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/crops/**").hasAnyRole("FARMER", "ADMIN")
                // Customer-only cart endpoints
                .requestMatchers("/api/cart", "/api/cart/**").hasRole("CUSTOMER")
                // Customer order placement and order history
                .requestMatchers(HttpMethod.POST, "/api/orders").hasRole("CUSTOMER")
                .requestMatchers(HttpMethod.GET, "/api/orders/my").hasRole("CUSTOMER")
                // Farmer order management
                .requestMatchers(HttpMethod.GET, "/api/orders/farmer").hasAnyRole("FARMER", "ADMIN")
                // Farmer AI Intelligence endpoints
                .requestMatchers("/api/ai/**").hasAnyRole("FARMER", "ADMIN")
                // Order detail and status updates (authorized in controller/service)
                .requestMatchers(HttpMethod.GET, "/api/orders/*").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/api/orders/*/status").authenticated()
                // All other endpoints require authentication
                .anyRequest().authenticated()
            )
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    ErrorResponseDto errorDto = new ErrorResponseDto(
                            LocalDateTime.now(),
                            HttpServletResponse.SC_UNAUTHORIZED,
                            "Unauthorized",
                            "Authentication required: " + authException.getMessage(),
                            request.getRequestURI()
                    );
                    response.getWriter().write(objectMapper.writeValueAsString(errorDto));
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    ErrorResponseDto errorDto = new ErrorResponseDto(
                            LocalDateTime.now(),
                            HttpServletResponse.SC_FORBIDDEN,
                            "Forbidden",
                            "Access denied: You do not have the required permissions to perform this action.",
                            request.getRequestURI()
                    );
                    response.getWriter().write(objectMapper.writeValueAsString(errorDto));
                })
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:*",
                "http://127.0.0.1:*"
        ));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "Accept",
                "Origin",
                "X-XSRF-TOKEN"
        ));
        config.setExposedHeaders(List.of("Set-Cookie", "X-XSRF-TOKEN"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
