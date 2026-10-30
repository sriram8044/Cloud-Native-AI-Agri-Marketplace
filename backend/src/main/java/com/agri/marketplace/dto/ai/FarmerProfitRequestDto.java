package com.agri.marketplace.dto.ai;

import java.math.BigDecimal;
import java.util.Map;

public class FarmerProfitRequestDto {

    private Map<Long, BigDecimal> cropCosts;

    public FarmerProfitRequestDto() {
    }

    public FarmerProfitRequestDto(Map<Long, BigDecimal> cropCosts) {
        this.cropCosts = cropCosts;
    }

    public Map<Long, BigDecimal> getCropCosts() {
        return cropCosts;
    }

    public void setCropCosts(Map<Long, BigDecimal> cropCosts) {
        this.cropCosts = cropCosts;
    }
}
