package com.agri.marketplace.controller;

import com.agri.marketplace.dto.AddToCartRequestDto;
import com.agri.marketplace.dto.UpdateCartItemRequestDto;
import com.agri.marketplace.entity.CartItem;
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
class CartIntegrationTest {

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
    private User customer1;
    private User customer2;
    private Crop crop1;
    private Crop crop2;

    @BeforeEach
    void setUp() {
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
        cartItemRepository.deleteAll();
        cropRepository.deleteAll();
        userRepository.deleteAll();

        farmer = userRepository.save(new User("Farmer Ramesh", "farmer@carttest.com", passwordEncoder.encode("Pass1"), Role.FARMER));
        customer1 = userRepository.save(new User("Customer Alice", "customer1@carttest.com", passwordEncoder.encode("Pass2"), Role.CUSTOMER));
        customer2 = userRepository.save(new User("Customer Bob", "customer2@carttest.com", passwordEncoder.encode("Pass3"), Role.CUSTOMER));

        crop1 = cropRepository.save(new Crop(null, "Organic Wheat", "Grains", "High grade wheat",
                new BigDecimal("45.00"), new BigDecimal("100.00"), "Punjab", null, farmer));
        crop2 = cropRepository.save(new Crop(null, "Fresh Apples", "Fruits", "Crisp apples",
                new BigDecimal("120.00"), new BigDecimal("50.00"), "Himachal", null, farmer));
    }

    @Test
    @DisplayName("CUSTOMER can add crop to cart with 201 Created")
    @WithMockUser(username = "customer1@carttest.com", roles = {"CUSTOMER"})
    void testAddToCart_Success() throws Exception {
        AddToCartRequestDto dto = new AddToCartRequestDto(crop1.getId(), new BigDecimal("10.00"));

        mockMvc.perform(post("/api/cart/items")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.cropId", is(crop1.getId().intValue())))
                .andExpect(jsonPath("$.cropName", is("Organic Wheat")))
                .andExpect(jsonPath("$.quantityKg", is(10.00)))
                .andExpect(jsonPath("$.lineTotal", is(450.00)));

        assertThat(cartItemRepository.findByCustomerOrderByCreatedAtDesc(customer1)).hasSize(1);
    }

    @Test
    @DisplayName("Adding same crop merges quantity consistently")
    @WithMockUser(username = "customer1@carttest.com", roles = {"CUSTOMER"})
    void testAddToCart_MergesQuantity() throws Exception {
        AddToCartRequestDto dto1 = new AddToCartRequestDto(crop1.getId(), new BigDecimal("10.00"));
        AddToCartRequestDto dto2 = new AddToCartRequestDto(crop1.getId(), new BigDecimal("15.00"));

        mockMvc.perform(post("/api/cart/items")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto1)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/cart/items")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quantityKg", is(25.00)))
                .andExpect(jsonPath("$.lineTotal", is(1125.00)));

        assertThat(cartItemRepository.findByCustomerOrderByCreatedAtDesc(customer1)).hasSize(1);
    }

    @Test
    @DisplayName("Adding quantity exceeding available stock returns 400 Bad Request")
    @WithMockUser(username = "customer1@carttest.com", roles = {"CUSTOMER"})
    void testAddToCart_ExceedsStock_Fails() throws Exception {
        AddToCartRequestDto dto = new AddToCartRequestDto(crop1.getId(), new BigDecimal("150.00"));

        mockMvc.perform(post("/api/cart/items")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("exceeds available stock")));
    }

    @Test
    @DisplayName("FARMER role cannot add items to cart (403 Forbidden)")
    @WithMockUser(username = "farmer@carttest.com", roles = {"FARMER"})
    void testAddToCart_FarmerRole_Forbidden() throws Exception {
        AddToCartRequestDto dto = new AddToCartRequestDto(crop1.getId(), new BigDecimal("5.00"));

        mockMvc.perform(post("/api/cart/items")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("CUSTOMER can view own cart and calculate subtotal")
    @WithMockUser(username = "customer1@carttest.com", roles = {"CUSTOMER"})
    void testGetCart_CalculatesSubtotal() throws Exception {
        cartItemRepository.save(new CartItem(customer1, crop1, new BigDecimal("10.00")));
        cartItemRepository.save(new CartItem(customer1, crop2, new BigDecimal("5.00")));

        mockMvc.perform(get("/api/cart"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems", is(2)))
                .andExpect(jsonPath("$.totalQuantityKg", is(15.00)))
                .andExpect(jsonPath("$.subtotal", is(1050.00))) // 10*45 + 5*120 = 450 + 600 = 1050
                .andExpect(jsonPath("$.items", hasSize(2)));
    }

    @Test
    @DisplayName("Customer cart isolation: Customer 2 cannot see Customer 1's cart items")
    @WithMockUser(username = "customer2@carttest.com", roles = {"CUSTOMER"})
    void testCartIsolation_CustomerCannotSeeOtherCart() throws Exception {
        cartItemRepository.save(new CartItem(customer1, crop1, new BigDecimal("10.00")));

        mockMvc.perform(get("/api/cart"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems", is(0)))
                .andExpect(jsonPath("$.items", hasSize(0)));
    }

    @Test
    @DisplayName("Customer cannot modify another customer's cart item (403 Forbidden)")
    @WithMockUser(username = "customer2@carttest.com", roles = {"CUSTOMER"})
    void testUpdateCartItem_Unauthorized_Forbidden() throws Exception {
        CartItem item1 = cartItemRepository.save(new CartItem(customer1, crop1, new BigDecimal("10.00")));

        UpdateCartItemRequestDto updateDto = new UpdateCartItemRequestDto(new BigDecimal("20.00"));

        mockMvc.perform(put("/api/cart/items/" + item1.getId())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Customer can update own cart item quantity")
    @WithMockUser(username = "customer1@carttest.com", roles = {"CUSTOMER"})
    void testUpdateCartItem_Success() throws Exception {
        CartItem item1 = cartItemRepository.save(new CartItem(customer1, crop1, new BigDecimal("10.00")));

        UpdateCartItemRequestDto updateDto = new UpdateCartItemRequestDto(new BigDecimal("20.00"));

        mockMvc.perform(put("/api/cart/items/" + item1.getId())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantityKg", is(20.00)))
                .andExpect(jsonPath("$.lineTotal", is(900.00)));
    }

    @Test
    @DisplayName("Customer can remove an item and clear cart")
    @WithMockUser(username = "customer1@carttest.com", roles = {"CUSTOMER"})
    void testRemoveAndClearCart() throws Exception {
        CartItem item1 = cartItemRepository.save(new CartItem(customer1, crop1, new BigDecimal("10.00")));
        CartItem item2 = cartItemRepository.save(new CartItem(customer1, crop2, new BigDecimal("5.00")));

        mockMvc.perform(delete("/api/cart/items/" + item1.getId())
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Item removed from cart")));

        assertThat(cartItemRepository.findById(item1.getId())).isEmpty();
        assertThat(cartItemRepository.findById(item2.getId())).isPresent();

        mockMvc.perform(delete("/api/cart")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Cart cleared successfully")));

        assertThat(cartItemRepository.findByCustomerOrderByCreatedAtDesc(customer1)).isEmpty();
    }
}
