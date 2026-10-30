package com.agri.marketplace.dto.ai;

import java.math.BigDecimal;

public class CropProfitSummaryDto {

    private Long crop_id;
    private String crop_name;
    private BigDecimal quantity_sold_kg;
    private BigDecimal gross_revenue;
    private BigDecimal cost_per_kg;
    private BigDecimal estimated_cost;
    private BigDecimal estimated_profit;
    private BigDecimal profit_margin_percent;
    private String status;

    public CropProfitSummaryDto() {
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

    public BigDecimal getGross_revenue() {
        return gross_revenue;
    }

    public void setGross_revenue(BigDecimal gross_revenue) {
        this.gross_revenue = gross_revenue;
    }

    public BigDecimal getCost_per_kg() {
        return cost_per_kg;
    }

    public void setCost_per_kg(BigDecimal cost_per_kg) {
        this.cost_per_kg = cost_per_kg;
    }

    public BigDecimal getEstimated_cost() {
        return estimated_cost;
    }

    public void setEstimated_cost(BigDecimal estimated_cost) {
        this.estimated_cost = estimated_cost;
    }

    public BigDecimal getEstimated_profit() {
        return estimated_profit;
    }

    public void setEstimated_profit(BigDecimal estimated_profit) {
        this.estimated_profit = estimated_profit;
    }

    public BigDecimal getProfit_margin_percent() {
        return profit_margin_percent;
    }

    public void setProfit_margin_percent(BigDecimal profit_margin_percent) {
        this.profit_margin_percent = profit_margin_percent;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
