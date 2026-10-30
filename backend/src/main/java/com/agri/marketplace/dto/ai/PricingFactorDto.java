package com.agri.marketplace.dto.ai;

public class PricingFactorDto {

    private String factor;
    private String impact;
    private String description;

    public PricingFactorDto() {
    }

    public PricingFactorDto(String factor, String impact, String description) {
        this.factor = factor;
        this.impact = impact;
        this.description = description;
    }

    public String getFactor() {
        return factor;
    }

    public void setFactor(String factor) {
        this.factor = factor;
    }

    public String getImpact() {
        return impact;
    }

    public void setImpact(String impact) {
        this.impact = impact;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
