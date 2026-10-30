package com.agri.marketplace.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class AddToCartRequestDto {

    @NotNull(message = "Crop ID is required")
    private Long cropId;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.01", message = "Quantity must be greater than zero")
    private BigDecimal quantityKg;

    public AddToCartRequestDto() {
    }

    public AddToCartRequestDto(Long cropId, BigDecimal quantityKg) {
        this.cropId = cropId;
        this.quantityKg = quantityKg;
    }

    public Long getCropId() {
        return cropId;
    }

    public void setCropId(Long cropId) {
        this.cropId = cropId;
    }

    public BigDecimal getQuantityKg() {
        return quantityKg;
    }

    public void setQuantityKg(BigDecimal quantityKg) {
        this.quantityKg = quantityKg;
    }
}
