package com.agri.marketplace.service;

import com.agri.marketplace.dto.ai.*;
import com.agri.marketplace.exception.AiServiceUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;

@Service
public class AiServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AiServiceClient.class);

    private final RestClient restClient;

    public AiServiceClient(
            @Value("${ai.service.url:http://localhost:8000}") String aiServiceUrl,
            @Value("${ai.service.connect-timeout-ms:5000}") int connectTimeoutMs,
            @Value("${ai.service.read-timeout-ms:5000}") int readTimeoutMs) {

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs));
        requestFactory.setReadTimeout(Duration.ofMillis(readTimeoutMs));

        this.restClient = RestClient.builder()
                .baseUrl(aiServiceUrl)
                .requestFactory(requestFactory)
                .build();

        log.info("Initialized AiServiceClient target URL: {}", aiServiceUrl);
    }

    public DemandForecastResponseDto getDemandForecast(AiForecastRequestDto requestDto) {
        try {
            return restClient.post()
                    .uri("/api/forecast/demand")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestDto)
                    .retrieve()
                    .body(DemandForecastResponseDto.class);
        } catch (ResourceAccessException ex) {
            log.error("AI service connection timeout or refused while requesting demand forecast: {}", ex.getMessage());
            throw new AiServiceUnavailableException("AI forecasting service is currently unreachable. Please ensure the AI service is running.");
        } catch (RestClientResponseException ex) {
            log.error("AI service returned error HTTP {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new AiServiceUnavailableException("AI forecasting service returned an error: " + ex.getStatusText());
        } catch (Exception ex) {
            log.error("Unexpected error contacting AI service: {}", ex.getMessage());
            throw new AiServiceUnavailableException("Unable to process demand forecast with AI service.");
        }
    }

    public PriceRecommendationResponseDto getPriceRecommendation(AiPricingRequestDto requestDto) {
        try {
            return restClient.post()
                    .uri("/api/pricing/recommend")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestDto)
                    .retrieve()
                    .body(PriceRecommendationResponseDto.class);
        } catch (ResourceAccessException ex) {
            log.error("AI service connection timeout or refused while requesting pricing recommendation: {}", ex.getMessage());
            throw new AiServiceUnavailableException("AI dynamic pricing service is currently unreachable.");
        } catch (RestClientResponseException ex) {
            log.error("AI service returned error HTTP {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new AiServiceUnavailableException("AI dynamic pricing service returned an error: " + ex.getStatusText());
        } catch (Exception ex) {
            log.error("Unexpected error contacting AI service: {}", ex.getMessage());
            throw new AiServiceUnavailableException("Unable to process price recommendation with AI service.");
        }
    }

    public ProfitAnalysisResponseDto getProfitAnalysis(AiProfitRequestDto requestDto) {
        try {
            return restClient.post()
                    .uri("/api/profit/analyze")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestDto)
                    .retrieve()
                    .body(ProfitAnalysisResponseDto.class);
        } catch (ResourceAccessException ex) {
            log.error("AI service connection timeout or refused while requesting profit analysis: {}", ex.getMessage());
            throw new AiServiceUnavailableException("AI profit intelligence service is currently unreachable.");
        } catch (RestClientResponseException ex) {
            log.error("AI service returned error HTTP {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new AiServiceUnavailableException("AI profit intelligence service returned an error: " + ex.getStatusText());
        } catch (Exception ex) {
            log.error("Unexpected error contacting AI service: {}", ex.getMessage());
            throw new AiServiceUnavailableException("Unable to process profit analysis with AI service.");
        }
    }
}
