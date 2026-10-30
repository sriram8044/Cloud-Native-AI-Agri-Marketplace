package com.agri.marketplace.controller;

import com.agri.marketplace.dto.CropRequestDto;
import com.agri.marketplace.entity.Crop;
import com.agri.marketplace.entity.Role;
import com.agri.marketplace.entity.User;
import com.agri.marketplace.repository.CartItemRepository;
import com.agri.marketplace.repository.CropRepository;
import com.agri.marketplace.repository.OrderItemRepository;
import com.agri.marketplace.repository.OrderRepository;
import com.agri.marketplace.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class CropSecurityIntegrationTest {

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

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User farmer1;
    private User farmer2;
    private User customer;

    @BeforeEach
    void setUp() {
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
        cartItemRepository.deleteAll();
        cropRepository.deleteAll();
        userRepository.deleteAll();

        farmer1 = new User("Farmer One", "farmer1@test.com", passwordEncoder.encode("Pass1"), Role.FARMER);
        farmer2 = new User("Farmer Two", "farmer2@test.com", passwordEncoder.encode("Pass2"), Role.FARMER);
        customer = new User("Customer Bob", "customer@test.com", passwordEncoder.encode("Pass3"), Role.CUSTOMER);

        userRepository.save(farmer1);
        userRepository.save(farmer2);
        userRepository.save(customer);
    }

    @Test
    @DisplayName("Public crop browsing is available without authentication")
    void testPublicBrowsing_Unauthenticated() throws Exception {
        Crop crop = new Crop(null, "Organic Corn", "Grains", "Fresh",
                new BigDecimal("30.00"), new BigDecimal("500.00"), "Punjab", null, farmer1);
        cropRepository.save(crop);

        mockMvc.perform(get("/api/crops"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Organic Corn"));

        mockMvc.perform(get("/api/crops/{id}", crop.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Organic Corn"));
    }

    @Test
    @DisplayName("Anonymous crop creation is rejected with 401 Unauthorized or 403 Forbidden")
    void testCreateCrop_Anonymous_Rejected() throws Exception {
        CropRequestDto request = new CropRequestDto("Barley", "Grains", "Descr",
                new BigDecimal("35.00"), new BigDecimal("200.00"), "Rajasthan");

        mockMvc.perform(post("/api/crops")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "customer@test.com", roles = {"CUSTOMER"})
    @DisplayName("Customer is denied crop creation with 403 Forbidden")
    void testCreateCrop_Customer_Forbidden() throws Exception {
        CropRequestDto request = new CropRequestDto("Barley", "Grains", "Descr",
                new BigDecimal("35.00"), new BigDecimal("200.00"), "Rajasthan");

        mockMvc.perform(post("/api/crops")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "farmer1@test.com", roles = {"FARMER"})
    @DisplayName("Farmer can successfully create crop listing and becomes owner")
    void testCreateCrop_Farmer_Success() throws Exception {
        CropRequestDto request = new CropRequestDto("Mustard Seed", "Oilseeds", "Pungent",
                new BigDecimal("70.00"), new BigDecimal("400.00"), "Haryana");

        mockMvc.perform(post("/api/crops")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.farmerId").value(farmer1.getId()))
                .andExpect(jsonPath("$.farmerName").value("Farmer One"));
    }

    @Test
    @WithMockUser(username = "farmer2@test.com", roles = {"FARMER"})
    @DisplayName("Farmer cannot update another farmer's crop listing (403 Forbidden)")
    void testUpdateCrop_AnotherFarmer_Forbidden() throws Exception {
        Crop crop = new Crop(null, "Wheat", "Grains", "Description",
                new BigDecimal("40.00"), new BigDecimal("100.00"), "MP", null, farmer1);
        cropRepository.save(crop);

        CropRequestDto updateRequest = new CropRequestDto("Modified Wheat", "Grains", "Description",
                new BigDecimal("45.00"), new BigDecimal("120.00"), "MP");

        mockMvc.perform(put("/api/crops/{id}", crop.getId())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value(containsString("permission to modify another farmer's listing")));
    }

    @Test
    @WithMockUser(username = "farmer1@test.com", roles = {"FARMER"})
    @DisplayName("Farmer can update their own crop listing")
    void testUpdateCrop_Owner_Success() throws Exception {
        Crop crop = new Crop(null, "Wheat", "Grains", "Old Description",
                new BigDecimal("40.00"), new BigDecimal("100.00"), "MP", null, farmer1);
        cropRepository.save(crop);

        CropRequestDto updateRequest = new CropRequestDto("Wheat Updated", "Grains", "New Description",
                new BigDecimal("48.00"), new BigDecimal("150.00"), "MP");

        mockMvc.perform(put("/api/crops/{id}", crop.getId())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Wheat Updated"))
                .andExpect(jsonPath("$.pricePerKg").value(48.00))
                .andExpect(jsonPath("$.description").value("New Description"));
    }

    @Test
    @WithMockUser(username = "farmer2@test.com", roles = {"FARMER"})
    @DisplayName("Farmer cannot delete another farmer's crop listing (403 Forbidden)")
    void testDeleteCrop_AnotherFarmer_Forbidden() throws Exception {
        Crop crop = new Crop(null, "Cotton", "Commercial", "Clean",
                new BigDecimal("90.00"), new BigDecimal("300.00"), "Gujarat", null, farmer1);
        cropRepository.save(crop);

        mockMvc.perform(delete("/api/crops/{id}", crop.getId()).with(csrf()))
                .andExpect(status().isForbidden());

        // Crop must still exist
        assertThat(cropRepository.findById(crop.getId())).isPresent();
    }

    @Test
    @WithMockUser(username = "farmer1@test.com", roles = {"FARMER"})
    @DisplayName("Farmer can delete their own crop listing")
    void testDeleteCrop_Owner_Success() throws Exception {
        Crop crop = new Crop(null, "Cotton", "Commercial", "Clean",
                new BigDecimal("90.00"), new BigDecimal("300.00"), "Gujarat", null, farmer1);
        cropRepository.save(crop);

        mockMvc.perform(delete("/api/crops/{id}", crop.getId()).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Crop listing deleted successfully"));

        assertThat(cropRepository.findById(crop.getId())).isEmpty();
    }
}
