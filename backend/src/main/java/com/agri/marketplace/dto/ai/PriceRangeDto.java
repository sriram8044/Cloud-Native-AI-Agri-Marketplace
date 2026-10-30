package com.agri.marketplace.dto.ai;

import java.math.BigDecimal;

public class PriceRangeDto {

    private BigDecimal min_price_per_kg;
    private BigDecimal max_price_per_kg;

    public PriceRangeDto() {
    }

    public PriceRangeDto(BigDecimal min_price_per_kg, BigDecimal max_price_per_kg) {
        this.min_price_per_kg = min_price_per_kg;
        this.max_price_per_kg = max_price_per_kg;
    }

    public BigDecimal getMin_price_per_kg() {
        return min_price_per_kg;
    }

    public void setMin_price_per_kg(BigDecimal min_price_per_kg) {
        this.min_price_per_kg = min_price_per_kg;
    }

    public BigDecimal getMax_price_per_kg() {
        return max_price_per_kg;
    }

    public void setMax_price_per_kg(BigDecimal max_price_per_kg) {
        this.max_price_per_kg = max_price_per_kg;
    }
}
