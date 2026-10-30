package com.agri.marketplace.controller;

import com.agri.marketplace.dto.LoginRequestDto;
import com.agri.marketplace.dto.RegisterRequestDto;
import com.agri.marketplace.entity.Role;
import com.agri.marketplace.entity.User;
import com.agri.marketplace.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("POST /api/auth/register successfully registers a customer and hashes the password")
    void testRegister_Customer_Success() throws Exception {
        RegisterRequestDto request = new RegisterRequestDto(
                "Anita Sharma",
                "anita@example.com",
                "Secret@123",
                Role.CUSTOMER
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Anita Sharma"))
                .andExpect(jsonPath("$.email").value("anita@example.com"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.password").doesNotExist()); // No password hash returned

        // Verify password is encrypted in database
        User savedUser = userRepository.findByEmail("anita@example.com").orElseThrow();
        assertThat(savedUser.getPassword()).isNotEqualTo("Secret@123");
        assertThat(savedUser.getPassword()).startsWith("$2a$");
        assertThat(passwordEncoder.matches("Secret@123", savedUser.getPassword())).isTrue();
    }

    @Test
    @DisplayName("POST /api/auth/register successfully registers a farmer")
    void testRegister_Farmer_Success() throws Exception {
        RegisterRequestDto request = new RegisterRequestDto(
                "Baldev Singh",
                "baldev@farmer.com",
                "FarmPass#1",
                Role.FARMER
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("FARMER"));

        User savedUser = userRepository.findByEmail("baldev@farmer.com").orElseThrow();
        assertThat(savedUser.getRole()).isEqualTo(Role.FARMER);
    }

    @Test
    @DisplayName("POST /api/auth/register rejects attempt to self-assign ADMIN role with 400 Bad Request")
    void testRegister_AdminRole_Rejected() throws Exception {
        RegisterRequestDto request = new RegisterRequestDto(
                "Attacker",
                "hacker@example.com",
                "HackPass123",
                Role.ADMIN
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(containsString("Registration as ADMIN is not permitted")));

        assertThat(userRepository.findByEmail("hacker@example.com")).isEmpty();
    }

    @Test
    @DisplayName("POST /api/auth/register rejects duplicate email with 400 Bad Request")
    void testRegister_DuplicateEmail_Rejected() throws Exception {
        RegisterRequestDto first = new RegisterRequestDto("First", "duplicate@test.com", "Password123", Role.CUSTOMER);
        RegisterRequestDto second = new RegisterRequestDto("Second", "duplicate@test.com", "Password456", Role.CUSTOMER);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(second)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(containsString("already exists")));
    }

    @Test
    @DisplayName("POST /api/auth/login succeeds with valid credentials and establishes session")
    void testLogin_Success() throws Exception {
        // Create user
        User user = new User("Pooja", "pooja@example.com", passwordEncoder.encode("ValidPass123"), Role.CUSTOMER);
        userRepository.save(user);

        LoginRequestDto loginRequest = new LoginRequestDto("pooja@example.com", "ValidPass123");

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("pooja@example.com"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andReturn();

        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        assertThat(session).isNotNull();

        // Verify session allows access to /api/auth/me
        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Pooja"))
                .andExpect(jsonPath("$.email").value("pooja@example.com"));
    }

    @Test
    @DisplayName("POST /api/auth/login fails with invalid password with 401 Unauthorized")
    void testLogin_WrongPassword_Unauthorized() throws Exception {
        User user = new User("Pooja", "pooja2@example.com", passwordEncoder.encode("ValidPass123"), Role.CUSTOMER);
        userRepository.save(user);

        LoginRequestDto loginRequest = new LoginRequestDto("pooja2@example.com", "WrongPassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("POST /api/auth/logout invalidates session")
    void testLogout() throws Exception {
        User user = new User("User", "logout@test.com", passwordEncoder.encode("Pass123"), Role.CUSTOMER);
        userRepository.save(user);

        LoginRequestDto loginRequest = new LoginRequestDto("logout@test.com", "Pass123");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession(false);

        // Perform logout with session and CSRF token
        mockMvc.perform(post("/api/auth/logout")
                        .with(csrf())
                        .session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully"));

        // Subsequent call to /api/auth/me should fail with 401
        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/auth/csrf returns CSRF token metadata")
    void testGetCsrfToken() throws Exception {
        mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.headerName").isNotEmpty());
    }
}
