package com.agri.marketplace.dto.ai;

import java.math.BigDecimal;

public class AiPricingRequestDto {

    private Long crop_id;
    private String crop_name;
    private BigDecimal current_price_per_kg;
    private BigDecimal available_quantity_kg;
    private BigDecimal cost_per_kg;
    private Integer historical_order_count;
    private BigDecimal historical_total_demand_kg;
    private BigDecimal forecast_demand_kg;
    private String forecast_confidence;

    public AiPricingRequestDto() {
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

    public BigDecimal getAvailable_quantity_kg() {
        return available_quantity_kg;
    }

    public void setAvailable_quantity_kg(BigDecimal available_quantity_kg) {
        this.available_quantity_kg = available_quantity_kg;
    }

    public BigDecimal getCost_per_kg() {
        return cost_per_kg;
    }

    public void setCost_per_kg(BigDecimal cost_per_kg) {
        this.cost_per_kg = cost_per_kg;
    }

    public Integer getHistorical_order_count() {
        return historical_order_count;
    }

    public void setHistorical_order_count(Integer historical_order_count) {
        this.historical_order_count = historical_order_count;
    }

    public BigDecimal getHistorical_total_demand_kg() {
        return historical_total_demand_kg;
    }

    public void setHistorical_total_demand_kg(BigDecimal historical_total_demand_kg) {
        this.historical_total_demand_kg = historical_total_demand_kg;
    }

    public BigDecimal getForecast_demand_kg() {
        return forecast_demand_kg;
    }

    public void setForecast_demand_kg(BigDecimal forecast_demand_kg) {
        this.forecast_demand_kg = forecast_demand_kg;
    }

    public String getForecast_confidence() {
        return forecast_confidence;
    }

    public void setForecast_confidence(String forecast_confidence) {
        this.forecast_confidence = forecast_confidence;
    }
}
