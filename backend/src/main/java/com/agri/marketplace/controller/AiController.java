package com.agri.marketplace.controller;

import com.agri.marketplace.dto.ai.*;
import com.agri.marketplace.service.AiIntelligenceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
public class AiController {

    private final AiIntelligenceService aiIntelligenceService;

    public AiController(AiIntelligenceService aiIntelligenceService) {
        this.aiIntelligenceService = aiIntelligenceService;
    }

    @GetMapping("/forecast/{cropId}")
    public ResponseEntity<DemandForecastResponseDto> getCropDemandForecast(
            @PathVariable Long cropId,
            @RequestParam(required = false, defaultValue = "7") Integer horizon,
            Authentication authentication) {

        DemandForecastResponseDto response = aiIntelligenceService.getCropDemandForecast(
                cropId, horizon, authentication.getName()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/pricing/{cropId}")
    public ResponseEntity<PriceRecommendationResponseDto> getCropPriceRecommendation(
            @PathVariable Long cropId,
            @Valid @RequestBody(required = false) FarmerPricingRequestDto requestDto,
            Authentication authentication) {

        BigDecimal costPerKg = (requestDto != null) ? requestDto.getCostPerKg() : null;
        PriceRecommendationResponseDto response = aiIntelligenceService.getCropPriceRecommendation(
                cropId, costPerKg, authentication.getName()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/profit/summary")
    public ResponseEntity<ProfitAnalysisResponseDto> getFarmerProfitSummary(
            @RequestBody(required = false) FarmerProfitRequestDto requestDto,
            Authentication authentication) {

        Map<Long, BigDecimal> cropCosts = (requestDto != null) ? requestDto.getCropCosts() : null;
        ProfitAnalysisResponseDto response = aiIntelligenceService.getFarmerProfitSummary(
                cropCosts, authentication.getName()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profit/summary")
    public ResponseEntity<ProfitAnalysisResponseDto> getFarmerProfitSummaryDefault(
            Authentication authentication) {

        ProfitAnalysisResponseDto response = aiIntelligenceService.getFarmerProfitSummary(
                null, authentication.getName()
        );
        return ResponseEntity.ok(response);
    }
}
