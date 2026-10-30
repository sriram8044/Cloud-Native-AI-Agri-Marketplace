package com.agri.marketplace.dto.ai;

import java.math.BigDecimal;
import java.util.List;

public class PriceRecommendationResponseDto {

    private Long crop_id;
    private String crop_name;
    private BigDecimal current_price_per_kg;
    private BigDecimal suggested_price_per_kg;
    private PriceRangeDto price_range;
    private String methodology;
    private List<PricingFactorDto> factors;
    private String action_required;

    public PriceRecommendationResponseDto() {
    }

    public Long getCrop_id() {
        return crop_id;
    }

    public void setCrop_id(Long crop_id) {
        this.crop_id = crop_id;
    }

    public String getCrop_name() {
        return crop_name;
    }

    public void setCrop_name(String crop_name) {
        this.crop_name = crop_name;
    }

    public BigDecimal getCurrent_price_per_kg() {
        return current_price_per_kg;
    }

    public void setCurrent_price_per_kg(BigDecimal current_price_per_kg) {
        this.current_price_per_kg = current_price_per_kg;
    }

    public BigDecimal getSuggested_price_per_kg() {
        return suggested_price_per_kg;
    }

    public void setSuggested_price_per_kg(BigDecimal suggested_price_per_kg) {
        this.suggested_price_per_kg = suggested_price_per_kg;
    }

    public PriceRangeDto getPrice_range() {
        return price_range;
    }

    public void setPrice_range(PriceRangeDto price_range) {
        this.price_range = price_range;
    }

    public String getMethodology() {
        return methodology;
    }

    public void setMethodology(String methodology) {
        this.methodology = methodology;
    }

    public List<PricingFactorDto> getFactors() {
        return factors;
    }

    public void setFactors(List<PricingFactorDto> factors) {
        this.factors = factors;
    }

    public String getAction_required() {
        return action_required;
    }

    public void setAction_required(String action_required) {
        this.action_required = action_required;
    }
}
