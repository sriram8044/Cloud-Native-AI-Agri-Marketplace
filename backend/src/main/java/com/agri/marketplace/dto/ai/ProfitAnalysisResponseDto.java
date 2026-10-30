package com.agri.marketplace.dto.ai;

import java.math.BigDecimal;
import java.util.List;

public class ProfitAnalysisResponseDto {

    private Long farmer_id;
    private BigDecimal total_gross_revenue;
    private Boolean profit_available;
    private BigDecimal total_estimated_cost;
    private BigDecimal total_estimated_profit;
    private BigDecimal overall_profit_margin_percent;
    private List<CropProfitSummaryDto> crop_summaries;
    private String guidance;

    public ProfitAnalysisResponseDto() {
    }

    public Long getFarmer_id() {
        return farmer_id;
    }

    public void setFarmer_id(Long farmer_id) {
        this.farmer_id = farmer_id;
    }

    public BigDecimal getTotal_gross_revenue() {
        return total_gross_revenue;
    }

    public void setTotal_gross_revenue(BigDecimal total_gross_revenue) {
        this.total_gross_revenue = total_gross_revenue;
    }

    public Boolean getProfit_available() {
        return profit_available;
    }

    public void setProfit_available(Boolean profit_available) {
        this.profit_available = profit_available;
    }

    public BigDecimal getTotal_estimated_cost() {
        return total_estimated_cost;
    }

    public void setTotal_estimated_cost(BigDecimal total_estimated_cost) {
        this.total_estimated_cost = total_estimated_cost;
    }

    public BigDecimal getTotal_estimated_profit() {
        return total_estimated_profit;
    }

    public void setTotal_estimated_profit(BigDecimal total_estimated_profit) {
        this.total_estimated_profit = total_estimated_profit;
    }

    public BigDecimal getOverall_profit_margin_percent() {
        return overall_profit_margin_percent;
    }

    public void setOverall_profit_margin_percent(BigDecimal overall_profit_margin_percent) {
        this.overall_profit_margin_percent = overall_profit_margin_percent;
    }

    public List<CropProfitSummaryDto> getCrop_summaries() {
        return crop_summaries;
    }

    public void setCrop_summaries(List<CropProfitSummaryDto> crop_summaries) {
        this.crop_summaries = crop_summaries;
    }

    public String getGuidance() {
        return guidance;
    }

    public void setGuidance(String guidance) {
        this.guidance = guidance;
    }
}
