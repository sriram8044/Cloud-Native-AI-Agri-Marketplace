package com.agri.marketplace.controller;

import com.agri.marketplace.dto.PlaceOrderRequestDto;
import com.agri.marketplace.entity.*;
import com.agri.marketplace.repository.*;
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
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class OrderPlacementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CropRepository cropRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User farmer;
    private User customer;
    private Crop crop1;
    private Crop crop2;

    @BeforeEach
    void setUp() {
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
        cartItemRepository.deleteAll();
        cropRepository.deleteAll();
        userRepository.deleteAll();

        farmer = userRepository.save(new User("Farmer Narayan", "farmer@ordertest.com", passwordEncoder.encode("Pass1"), Role.FARMER));
        customer = userRepository.save(new User("Customer Priya", "customer@ordertest.com", passwordEncoder.encode("Pass2"), Role.CUSTOMER));

        crop1 = cropRepository.save(new Crop(null, "Organic Turmeric", "Spices", "Pure organic turmeric",
                new BigDecimal("150.00"), new BigDecimal("50.00"), "Kerala", null, farmer));
        crop2 = cropRepository.save(new Crop(null, "Basmati Rice", "Grains", "Aromatic long grain",
                new BigDecimal("90.00"), new BigDecimal("100.00"), "Haryana", null, farmer));
    }

    @Test
    @DisplayName("CUSTOMER places order: decreases stock, captures snapshots, clears cart, creates Order and OrderItems")
    @WithMockUser(username = "customer@ordertest.com", roles = {"CUSTOMER"})
    void testPlaceOrder_Success() throws Exception {
        cartItemRepository.save(new CartItem(customer, crop1, new BigDecimal("10.00")));
        cartItemRepository.save(new CartItem(customer, crop2, new BigDecimal("20.00")));

        PlaceOrderRequestDto requestDto = new PlaceOrderRequestDto("Flat 402, Green Meadows, MG Road, Bengaluru");

        mockMvc.perform(post("/api/orders")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.customerEmail", is("customer@ordertest.com")))
                .andExpect(jsonPath("$.status", is("PLACED")))
                .andExpect(jsonPath("$.deliveryAddress", is("Flat 402, Green Meadows, MG Road, Bengaluru")))
                // Expected total: (10 * 150) + (20 * 90) = 1500 + 1800 = 3300.00
                .andExpect(jsonPath("$.totalAmount", is(3300.00)))
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.items[0].cropName", notNullValue()))
                .andExpect(jsonPath("$.items[0].pricePerKg", notNullValue()));

        // Verify stock decremented in MySQL DB
        Crop updatedCrop1 = cropRepository.findById(crop1.getId()).orElseThrow();
        assertThat(updatedCrop1.getAvailableQuantityKg()).isEqualByComparingTo(new BigDecimal("40.00")); // 50 - 10

        Crop updatedCrop2 = cropRepository.findById(crop2.getId()).orElseThrow();
        assertThat(updatedCrop2.getAvailableQuantityKg()).isEqualByComparingTo(new BigDecimal("80.00")); // 100 - 20

        // Verify cart is cleared
        assertThat(cartItemRepository.findByCustomerOrderByCreatedAtDesc(customer)).isEmpty();

        // Verify snapshot values survive subsequent crop price updates
        crop1.setPricePerKg(new BigDecimal("250.00"));
        crop1.setName("Modified Turmeric Name");
        cropRepository.save(crop1);

        List<Order> orders = orderRepository.findByCustomerOrderByCreatedAtDesc(customer);
        assertThat(orders).hasSize(1);
        Order order = orders.get(0);
        assertThat(order.getTotalAmount()).isEqualByComparingTo(new BigDecimal("3300.00"));
        OrderItem item1 = order.getItems().stream()
                .filter(i -> i.getCrop().getId().equals(crop1.getId()))
                .findFirst()
                .orElseThrow();
        assertThat(item1.getCropNameSnapshot()).isEqualTo("Organic Turmeric");
        assertThat(item1.getPricePerKgSnapshot()).isEqualByComparingTo(new BigDecimal("150.00"));
    }

    @Test
    @DisplayName("Empty cart cannot place order (400 Bad Request)")
    @WithMockUser(username = "customer@ordertest.com", roles = {"CUSTOMER"})
    void testPlaceOrder_EmptyCart_Fails() throws Exception {
        PlaceOrderRequestDto requestDto = new PlaceOrderRequestDto("123 Main Street");

        mockMvc.perform(post("/api/orders")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("empty shopping cart")));
    }

    @Test
    @DisplayName("Order placement fails when stock becomes insufficient, transaction rolled back")
    @WithMockUser(username = "customer@ordertest.com", roles = {"CUSTOMER"})
    void testPlaceOrder_InsufficientStock_RollsBack() throws Exception {
        // Customer puts 40 kg in cart
        cartItemRepository.save(new CartItem(customer, crop1, new BigDecimal("40.00")));

        // Another buyer or farmer reduces available stock to 20 kg
        crop1.setAvailableQuantityKg(new BigDecimal("20.00"));
        cropRepository.save(crop1);

        PlaceOrderRequestDto requestDto = new PlaceOrderRequestDto("123 Main Street");

        mockMvc.perform(post("/api/orders")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Insufficient stock")));

        // Verify stock remains untouched at 20.00
        Crop currentCrop = cropRepository.findById(crop1.getId()).orElseThrow();
        assertThat(currentCrop.getAvailableQuantityKg()).isEqualByComparingTo(new BigDecimal("20.00"));

        // Verify no order created
        assertThat(orderRepository.findByCustomerOrderByCreatedAtDesc(customer)).isEmpty();

        // Cart items preserved
        assertThat(cartItemRepository.findByCustomerOrderByCreatedAtDesc(customer)).hasSize(1);
    }
}
