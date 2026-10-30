package com.agri.marketplace.controller;

import com.agri.marketplace.dto.CropRequestDto;
import com.agri.marketplace.repository.CropRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import com.agri.marketplace.entity.Role;
import com.agri.marketplace.entity.User;
import com.agri.marketplace.repository.CartItemRepository;
import com.agri.marketplace.repository.OrderItemRepository;
import com.agri.marketplace.repository.OrderRepository;
import com.agri.marketplace.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(username = "farmer@example.com", roles = {"FARMER"})
class CropControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CropRepository cropRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @BeforeEach
    void setUp() {
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
        cartItemRepository.deleteAll();
        cropRepository.deleteAll();
        userRepository.deleteAll();
        userRepository.save(new User("Mock Farmer", "farmer@example.com", "pass123", Role.FARMER));
    }

    @Test
    @DisplayName("POST /api/crops creates a new crop listing with 201 Created")
    void testCreateCrop_Success() throws Exception {
        CropRequestDto requestDto = new CropRequestDto(
                "Basmati Rice",
                "Grains",
                "Premium quality aged basmati rice",
                new BigDecimal("85.50"),
                new BigDecimal("500.00"),
                "Punjab, India"
        );

        mockMvc.perform(post("/api/crops")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Basmati Rice"))
                .andExpect(jsonPath("$.category").value("Grains"))
                .andExpect(jsonPath("$.description").value("Premium quality aged basmati rice"))
                .andExpect(jsonPath("$.pricePerKg").value(85.50))
                .andExpect(jsonPath("$.availableQuantityKg").value(500.00))
                .andExpect(jsonPath("$.location").value("Punjab, India"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty());
    }

    @Test
    @DisplayName("POST /api/crops fails validation with 400 Bad Request when required fields are missing")
    void testCreateCrop_ValidationError_MissingFields() throws Exception {
        CropRequestDto invalidDto = new CropRequestDto(); // all null

        mockMvc.perform(post("/api/crops")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.name").isNotEmpty())
                .andExpect(jsonPath("$.validationErrors.category").isNotEmpty())
                .andExpect(jsonPath("$.validationErrors.pricePerKg").isNotEmpty())
                .andExpect(jsonPath("$.validationErrors.availableQuantityKg").isNotEmpty())
                .andExpect(jsonPath("$.validationErrors.location").isNotEmpty());
    }

    @Test
    @DisplayName("POST /api/crops fails validation with 400 Bad Request when price or quantity is zero/negative")
    void testCreateCrop_ValidationError_NonPositiveValues() throws Exception {
        CropRequestDto invalidDto = new CropRequestDto(
                "Wheat",
                "Grains",
                "Organic wheat",
                new BigDecimal("-10.00"),
                new BigDecimal("0.00"),
                "Haryana"
        );

        mockMvc.perform(post("/api/crops")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.pricePerKg").isNotEmpty())
                .andExpect(jsonPath("$.validationErrors.availableQuantityKg").isNotEmpty());
    }

    @Test
    @DisplayName("GET /api/crops retrieves all crop listings")
    void testGetAllCrops() throws Exception {
        // Create 2 crops
        CropRequestDto crop1 = new CropRequestDto("Organic Wheat", "Grains", "Grade A",
                new BigDecimal("42.00"), new BigDecimal("1000.00"), "Madhya Pradesh");
        CropRequestDto crop2 = new CropRequestDto("Yellow Corn", "Grains", "Sweet corn",
                new BigDecimal("30.00"), new BigDecimal("750.00"), "Karnataka");

        mockMvc.perform(post("/api/crops")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(crop1)));

        mockMvc.perform(post("/api/crops")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(crop2)));

        mockMvc.perform(get("/api/crops"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name").value("Organic Wheat"))
                .andExpect(jsonPath("$[1].name").value("Yellow Corn"));
    }

    @Test
    @DisplayName("GET /api/crops/{id} retrieves an existing crop by ID")
    void testGetCropById_Success() throws Exception {
        CropRequestDto requestDto = new CropRequestDto("Barley", "Grains", "High malt content",
                new BigDecimal("35.00"), new BigDecimal("300.00"), "Rajasthan");

        String response = mockMvc.perform(post("/api/crops")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long createdId = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(get("/api/crops/{id}", createdId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(createdId))
                .andExpect(jsonPath("$.name").value("Barley"))
                .andExpect(jsonPath("$.location").value("Rajasthan"));
    }

    @Test
    @DisplayName("GET /api/crops/{id} returns 404 Not Found for non-existent ID")
    void testGetCropById_NotFound() throws Exception {
        mockMvc.perform(get("/api/crops/{id}", 99999L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value(containsString("Crop not found with id: 99999")));
    }

    @Test
    @DisplayName("GET /api/crops?search=rice filters crops by name case-insensitively")
    void testSearchCrops() throws Exception {
        CropRequestDto crop1 = new CropRequestDto("Basmati Rice", "Grains", "Aged",
                new BigDecimal("90.00"), new BigDecimal("400.00"), "Punjab");
        CropRequestDto crop2 = new CropRequestDto("Sona Masoori Rice", "Grains", "Polished",
                new BigDecimal("60.00"), new BigDecimal("600.00"), "Andhra Pradesh");
        CropRequestDto crop3 = new CropRequestDto("Soybean", "Legumes", "Non-GMO",
                new BigDecimal("55.00"), new BigDecimal("250.00"), "Maharashtra");

        mockMvc.perform(post("/api/crops")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(crop1)));
        mockMvc.perform(post("/api/crops")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(crop2)));
        mockMvc.perform(post("/api/crops")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(crop3)));

        // Search case-insensitively for "rice"
        mockMvc.perform(get("/api/crops").param("search", "rice"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].name", containsInAnyOrder("Basmati Rice", "Sona Masoori Rice")));

        // Search case-insensitively for uppercase "SOY"
        mockMvc.perform(get("/api/crops").param("search", "SOY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Soybean"));
    }
}
