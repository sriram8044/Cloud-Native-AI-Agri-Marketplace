package com.agri.marketplace.dto.ai;

import jakarta.validation.constraints.DecimalMin;
import java.math.BigDecimal;

public class FarmerPricingRequestDto {

    @DecimalMin(value = "0.0", message = "Cost per kg cannot be negative")
    private BigDecimal costPerKg;

    public FarmerPricingRequestDto() {
    }

    public FarmerPricingRequestDto(BigDecimal costPerKg) {
        this.costPerKg = costPerKg;
    }

    public BigDecimal getCostPerKg() {
        return costPerKg;
    }

    public void setCostPerKg(BigDecimal costPerKg) {
        this.costPerKg = costPerKg;
    }
}
