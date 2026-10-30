package com.agri.marketplace.controller;

import com.agri.marketplace.dto.UpdateOrderStatusRequestDto;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class OrderLifecycleSecurityTest {

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

    private User farmer1;
    private User farmer2;
    private User customer1;
    private User customer2;
    private User admin;
    private Crop cropFarmer1;
    private Crop cropFarmer2;

    @BeforeEach
    void setUp() {
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
        cartItemRepository.deleteAll();
        cropRepository.deleteAll();
        userRepository.deleteAll();

        farmer1 = userRepository.save(new User("Farmer Alpha", "farmer1@lifecycletest.com", passwordEncoder.encode("Pass1"), Role.FARMER));
        farmer2 = userRepository.save(new User("Farmer Beta", "farmer2@lifecycletest.com", passwordEncoder.encode("Pass2"), Role.FARMER));
        customer1 = userRepository.save(new User("Customer One", "customer1@lifecycletest.com", passwordEncoder.encode("Pass3"), Role.CUSTOMER));
        customer2 = userRepository.save(new User("Customer Two", "customer2@lifecycletest.com", passwordEncoder.encode("Pass4"), Role.CUSTOMER));
        admin = userRepository.save(new User("Admin System", "admin@lifecycletest.com", passwordEncoder.encode("Pass5"), Role.ADMIN));

        cropFarmer1 = cropRepository.save(new Crop(null, "Organic Potatoes", "Vegetables", "Fresh harvest",
                new BigDecimal("25.00"), new BigDecimal("200.00"), "Uttar Pradesh", null, farmer1));
        cropFarmer2 = cropRepository.save(new Crop(null, "Darjeeling Tea", "Beverages", "First flush",
                new BigDecimal("500.00"), new BigDecimal("30.00"), "West Bengal", null, farmer2));
    }

    private Order createOrder(User customer, Crop crop, User farmer, BigDecimal qty, OrderStatus status) {
        Order order = new Order();
        order.setCustomer(customer);
        order.setDeliveryAddress("Sample Road, City 101");
        order.setStatus(status);

        BigDecimal lineTotal = crop.getPricePerKg().multiply(qty);
        order.setTotalAmount(lineTotal);

        OrderItem item = new OrderItem(order, crop, farmer, crop.getName(), crop.getPricePerKg(), qty, lineTotal);
        order.addItem(item);

        return orderRepository.save(order);
    }

    @Test
    @DisplayName("CUSTOMER can view own order history")
    @WithMockUser(username = "customer1@lifecycletest.com", roles = {"CUSTOMER"})
    void testGetMyOrders_Success() throws Exception {
        createOrder(customer1, cropFarmer1, farmer1, new BigDecimal("10.00"), OrderStatus.PLACED);

        mockMvc.perform(get("/api/orders/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].customerEmail", is("customer1@lifecycletest.com")))
                .andExpect(jsonPath("$[0].status", is("PLACED")));
    }

    @Test
    @DisplayName("Customer cannot view another customer's order (403 Forbidden)")
    @WithMockUser(username = "customer2@lifecycletest.com", roles = {"CUSTOMER"})
    void testGetOrderById_UnauthorizedCustomer_Forbidden() throws Exception {
        Order order1 = createOrder(customer1, cropFarmer1, farmer1, new BigDecimal("10.00"), OrderStatus.PLACED);

        mockMvc.perform(get("/api/orders/" + order1.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Farmer sees only order items for crops they listed")
    @WithMockUser(username = "farmer1@lifecycletest.com", roles = {"FARMER"})
    void testFarmerOrders_Isolation() throws Exception {
        // Order 1 has farmer1's crop
        createOrder(customer1, cropFarmer1, farmer1, new BigDecimal("10.00"), OrderStatus.PLACED);
        // Order 2 has farmer2's crop
        createOrder(customer2, cropFarmer2, farmer2, new BigDecimal("5.00"), OrderStatus.PLACED);

        mockMvc.perform(get("/api/orders/farmer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].cropName", is("Organic Potatoes")));
    }

    @Test
    @DisplayName("Farmer can advance order fulfillment: PLACED -> CONFIRMED -> PACKED -> SHIPPED -> DELIVERED")
    @WithMockUser(username = "farmer1@lifecycletest.com", roles = {"FARMER"})
    void testFarmerStatusProgression_Success() throws Exception {
        Order order = createOrder(customer1, cropFarmer1, farmer1, new BigDecimal("10.00"), OrderStatus.PLACED);

        // Step 1: PLACED -> CONFIRMED
        mockMvc.perform(patch("/api/orders/" + order.getId() + "/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateOrderStatusRequestDto(OrderStatus.CONFIRMED))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CONFIRMED")));

        // Step 2: CONFIRMED -> PACKED
        mockMvc.perform(patch("/api/orders/" + order.getId() + "/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateOrderStatusRequestDto(OrderStatus.PACKED))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PACKED")));

        // Step 3: PACKED -> SHIPPED
        mockMvc.perform(patch("/api/orders/" + order.getId() + "/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateOrderStatusRequestDto(OrderStatus.SHIPPED))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SHIPPED")));

        // Step 4: SHIPPED -> DELIVERED
        mockMvc.perform(patch("/api/orders/" + order.getId() + "/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateOrderStatusRequestDto(OrderStatus.DELIVERED))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("DELIVERED")));
    }

    @Test
    @DisplayName("Farmer cannot perform invalid status transition (e.g., skip to DELIVERED) (400 Bad Request)")
    @WithMockUser(username = "farmer1@lifecycletest.com", roles = {"FARMER"})
    void testFarmerStatus_InvalidTransition_Fails() throws Exception {
        Order order = createOrder(customer1, cropFarmer1, farmer1, new BigDecimal("10.00"), OrderStatus.PLACED);

        mockMvc.perform(patch("/api/orders/" + order.getId() + "/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateOrderStatusRequestDto(OrderStatus.DELIVERED))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Invalid status transition")));
    }

    @Test
    @DisplayName("Farmer cannot cancel order directly (403 Forbidden)")
    @WithMockUser(username = "farmer1@lifecycletest.com", roles = {"FARMER"})
    void testFarmerCancel_Forbidden() throws Exception {
        Order order = createOrder(customer1, cropFarmer1, farmer1, new BigDecimal("10.00"), OrderStatus.PLACED);

        mockMvc.perform(patch("/api/orders/" + order.getId() + "/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateOrderStatusRequestDto(OrderStatus.CANCELLED))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Customer can cancel PLACED order and stock is transactionally restored")
    @WithMockUser(username = "customer1@lifecycletest.com", roles = {"CUSTOMER"})
    void testCustomerCancelOrder_RestoresStock() throws Exception {
        // Suppose crop stock was originally 200, decrement 20 on placement -> 180
        cropFarmer1.setAvailableQuantityKg(new BigDecimal("180.00"));
        cropRepository.save(cropFarmer1);

        Order order = createOrder(customer1, cropFarmer1, farmer1, new BigDecimal("20.00"), OrderStatus.PLACED);

        mockMvc.perform(patch("/api/orders/" + order.getId() + "/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateOrderStatusRequestDto(OrderStatus.CANCELLED))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")));

        // Stock restored back to 200 (180 + 20)
        Crop refreshedCrop = cropRepository.findById(cropFarmer1.getId()).orElseThrow();
        assertThat(refreshedCrop.getAvailableQuantityKg()).isEqualByComparingTo(new BigDecimal("200.00"));
    }

    @Test
    @DisplayName("Customer cannot cancel order once SHIPPED (400 Bad Request)")
    @WithMockUser(username = "customer1@lifecycletest.com", roles = {"CUSTOMER"})
    void testCustomerCancelShippedOrder_Fails() throws Exception {
        Order order = createOrder(customer1, cropFarmer1, farmer1, new BigDecimal("10.00"), OrderStatus.SHIPPED);

        mockMvc.perform(patch("/api/orders/" + order.getId() + "/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateOrderStatusRequestDto(OrderStatus.CANCELLED))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("cannot be cancelled")));
    }

    @Test
    @DisplayName("ADMIN has full oversight to view and update any order")
    @WithMockUser(username = "admin@lifecycletest.com", roles = {"ADMIN"})
    void testAdminOversight_Success() throws Exception {
        Order order = createOrder(customer1, cropFarmer1, farmer1, new BigDecimal("10.00"), OrderStatus.PLACED);

        mockMvc.perform(get("/api/orders/" + order.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(order.getId().intValue())));

        mockMvc.perform(patch("/api/orders/" + order.getId() + "/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateOrderStatusRequestDto(OrderStatus.CONFIRMED))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CONFIRMED")));
    }
}
