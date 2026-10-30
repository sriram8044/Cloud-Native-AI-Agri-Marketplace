package com.agri.marketplace.controller;

import com.agri.marketplace.dto.ai.*;
import com.agri.marketplace.entity.*;
import com.agri.marketplace.exception.AiServiceUnavailableException;
import com.agri.marketplace.repository.*;
import com.agri.marketplace.service.AiServiceClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AiControllerIntegrationTest {

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

    @MockitoBean
    private AiServiceClient aiServiceClient;

    private User farmer1;
    private User farmer2;
    private User customer;
    private Crop crop1;
    private Crop crop2;

    @BeforeEach
    void setUp() {
        cartItemRepository.deleteAll();
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
        cropRepository.deleteAll();
        userRepository.deleteAll();

        farmer1 = new User();
        farmer1.setName("Farmer One");
        farmer1.setEmail("farmer1@agri.com");
        farmer1.setPassword(passwordEncoder.encode("Password@123"));
        farmer1.setRole(Role.FARMER);
        farmer1 = userRepository.save(farmer1);

        farmer2 = new User();
        farmer2.setName("Farmer Two");
        farmer2.setEmail("farmer2@agri.com");
        farmer2.setPassword(passwordEncoder.encode("Password@123"));
        farmer2.setRole(Role.FARMER);
        farmer2 = userRepository.save(farmer2);

        customer = new User();
        customer.setName("Customer One");
        customer.setEmail("customer@agri.com");
        customer.setPassword(passwordEncoder.encode("Password@123"));
        customer.setRole(Role.CUSTOMER);
        customer = userRepository.save(customer);

        crop1 = new Crop(
                null,
                "Organic Sharbati Wheat",
                "Grains",
                "High quality wheat",
                new BigDecimal("42.50"),
                new BigDecimal("1500.00"),
                "MP",
                LocalDateTime.now(),
                farmer1
        );
        crop1 = cropRepository.save(crop1);

        crop2 = new Crop(
                null,
                "Nagpur Oranges",
                "Fruits",
                "Sweet oranges",
                new BigDecimal("65.00"),
                new BigDecimal("800.00"),
                "Maharashtra",
                LocalDateTime.now(),
                farmer2
        );
        crop2 = cropRepository.save(crop2);
    }

    @Test
    @DisplayName("Unauthenticated request to AI forecast returns 401 Unauthorized")
    void unauthenticated_cannotAccessForecast() throws Exception {
        mockMvc.perform(get("/api/ai/forecast/" + crop1.getId()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "customer@agri.com", roles = {"CUSTOMER"})
    @DisplayName("CUSTOMER role cannot access AI endpoints, returns 403 Forbidden")
    void customer_cannotAccessAiEndpoints() throws Exception {
        mockMvc.perform(get("/api/ai/forecast/" + crop1.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "farmer2@agri.com", roles = {"FARMER"})
    @DisplayName("Farmer 2 cannot view AI forecast for Farmer 1's crop, returns 403 Forbidden")
    void farmerCannotAccessOtherFarmersCropForecast() throws Exception {
        mockMvc.perform(get("/api/ai/forecast/" + crop1.getId()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("permission")));
    }

    @Test
    @WithMockUser(username = "farmer1@agri.com", roles = {"FARMER"})
    @DisplayName("Farmer 1 successfully requests demand forecast for their own crop")
    void farmer1_canAccessOwnCropForecast() throws Exception {
        DemandForecastResponseDto mockResponse = new DemandForecastResponseDto();
        mockResponse.setCrop_id(crop1.getId());
        mockResponse.setCrop_name(crop1.getName());
        mockResponse.setStatus("INSUFFICIENT_DATA");
        mockResponse.setHas_sufficient_data(false);
        mockResponse.setHistorical_points_count(0);
        mockResponse.setMinimum_points_required(5);
        mockResponse.setForecast_horizon_days(7);
        mockResponse.setForecast(List.of(
                new DemandForecastPointDto("2026-10-28", BigDecimal.ZERO, true)
        ));
        mockResponse.setData_limitations(List.of("No completed customer orders exist yet."));

        when(aiServiceClient.getDemandForecast(any())).thenReturn(mockResponse);

        mockMvc.perform(get("/api/ai/forecast/" + crop1.getId() + "?horizon=7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.crop_id", is(crop1.getId().intValue())))
                .andExpect(jsonPath("$.status", is("INSUFFICIENT_DATA")))
                .andExpect(jsonPath("$.has_sufficient_data", is(false)))
                .andExpect(jsonPath("$.forecast", hasSize(1)));
    }

    @Test
    @WithMockUser(username = "farmer1@agri.com", roles = {"FARMER"})
    @DisplayName("AI Service unavailable returns 503 SERVICE_UNAVAILABLE gracefully")
    void aiServiceDown_returns503ServiceUnavailable() throws Exception {
        when(aiServiceClient.getDemandForecast(any()))
                .thenThrow(new AiServiceUnavailableException("AI forecasting service is currently unreachable."));

        mockMvc.perform(get("/api/ai/forecast/" + crop1.getId()))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status", is(503)))
                .andExpect(jsonPath("$.error", is("Service Unavailable")))
                .andExpect(jsonPath("$.message", containsString("unreachable")));
    }

    @Test
    @WithMockUser(username = "farmer1@agri.com", roles = {"FARMER"})
    @DisplayName("Farmer 1 requests price recommendation with cost floor")
    void farmer1_canRequestPriceRecommendation() throws Exception {
        PriceRecommendationResponseDto mockPricing = new PriceRecommendationResponseDto();
        mockPricing.setCrop_id(crop1.getId());
        mockPricing.setCrop_name(crop1.getName());
        mockPricing.setCurrent_price_per_kg(new BigDecimal("42.50"));
        mockPricing.setSuggested_price_per_kg(new BigDecimal("44.00"));
        mockPricing.setPrice_range(new PriceRangeDto(new BigDecimal("40.00"), new BigDecimal("48.00")));
        mockPricing.setMethodology("EXPLAINABLE_RULE_ENGINE");
        mockPricing.setFactors(List.of(
                new PricingFactorDto("Cost Floor", "PROTECTIVE", "Margin floor maintained")
        ));
        mockPricing.setAction_required("Farmer review required. Prices will NOT be modified automatically.");

        when(aiServiceClient.getPriceRecommendation(any())).thenReturn(mockPricing);

        FarmerPricingRequestDto body = new FarmerPricingRequestDto(new BigDecimal("32.00"));

        mockMvc.perform(post("/api/ai/pricing/" + crop1.getId())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.crop_id", is(crop1.getId().intValue())))
                .andExpect(jsonPath("$.suggested_price_per_kg", is(44.00)))
                .andExpect(jsonPath("$.methodology", is("EXPLAINABLE_RULE_ENGINE")))
                .andExpect(jsonPath("$.factors", hasSize(1)));
    }

    @Test
    @WithMockUser(username = "farmer1@agri.com", roles = {"FARMER"})
    @DisplayName("Farmer 1 requests profit intelligence summary")
    void farmer1_canRequestProfitSummary() throws Exception {
        ProfitAnalysisResponseDto mockProfit = new ProfitAnalysisResponseDto();
        mockProfit.setFarmer_id(farmer1.getId());
        mockProfit.setTotal_gross_revenue(new BigDecimal("1200.00"));
        mockProfit.setProfit_available(true);
        mockProfit.setTotal_estimated_cost(new BigDecimal("800.00"));
        mockProfit.setTotal_estimated_profit(new BigDecimal("400.00"));
        mockProfit.setOverall_profit_margin_percent(new BigDecimal("33.33"));
        mockProfit.setCrop_summaries(Collections.emptyList());
        mockProfit.setGuidance("Costs verified.");

        when(aiServiceClient.getProfitAnalysis(any())).thenReturn(mockProfit);

        FarmerProfitRequestDto body = new FarmerProfitRequestDto(Map.of(crop1.getId(), new BigDecimal("30.00")));

        mockMvc.perform(post("/api/ai/profit/summary")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.farmer_id", is(farmer1.getId().intValue())))
                .andExpect(jsonPath("$.total_gross_revenue", is(1200.00)))
                .andExpect(jsonPath("$.profit_available", is(true)))
                .andExpect(jsonPath("$.total_estimated_profit", is(400.00)));
    }

    @Test
    @WithMockUser(username = "farmer1@agri.com", roles = {"FARMER"})
    @DisplayName("Requesting forecast for non-existent crop returns 404 Not Found")
    void nonExistentCrop_returns404() throws Exception {
        mockMvc.perform(get("/api/ai/forecast/99999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Crop not found")));
    }
}
