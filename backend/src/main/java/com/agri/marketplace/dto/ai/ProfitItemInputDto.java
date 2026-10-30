package com.agri.marketplace.dto.ai;

import java.math.BigDecimal;

public class ProfitItemInputDto {

    private Long crop_id;
    private String crop_name;
    private BigDecimal quantity_sold_kg;
    private BigDecimal revenue;
    private BigDecimal cost_per_kg;

    public ProfitItemInputDto() {
    }

    public ProfitItemInputDto(Long crop_id, String crop_name, BigDecimal quantity_sold_kg, BigDecimal revenue, BigDecimal cost_per_kg) {
        this.crop_id = crop_id;
        this.crop_name = crop_name;
        this.quantity_sold_kg = quantity_sold_kg;
        this.revenue = revenue;
        this.cost_per_kg = cost_per_kg;
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

    public BigDecimal getQuantity_sold_kg() {
        return quantity_sold_kg;
    }

    public void setQuantity_sold_kg(BigDecimal quantity_sold_kg) {
        this.quantity_sold_kg = quantity_sold_kg;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }

    public void setRevenue(BigDecimal revenue) {
        this.revenue = revenue;
    }

    public BigDecimal getCost_per_kg() {
        return cost_per_kg;
    }

    public void setCost_per_kg(BigDecimal cost_per_kg) {
        this.cost_per_kg = cost_per_kg;
    }
}
