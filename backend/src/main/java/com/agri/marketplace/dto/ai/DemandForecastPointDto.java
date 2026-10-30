package com.agri.marketplace.dto.ai;

import java.math.BigDecimal;

public class DemandForecastPointDto {

    private String date;
    private BigDecimal predicted_demand_kg;
    private Boolean is_fallback;

    public DemandForecastPointDto() {
    }

    public DemandForecastPointDto(String date, BigDecimal predicted_demand_kg, Boolean is_fallback) {
        this.date = date;
        this.predicted_demand_kg = predicted_demand_kg;
        this.is_fallback = is_fallback;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public BigDecimal getPredicted_demand_kg() {
        return predicted_demand_kg;
    }

    public void setPredicted_demand_kg(BigDecimal predicted_demand_kg) {
        this.predicted_demand_kg = predicted_demand_kg;
    }

    public Boolean getIs_fallback() {
        return is_fallback;
    }

    public void setIs_fallback(Boolean is_fallback) {
        this.is_fallback = is_fallback;
    }
}
