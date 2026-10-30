package com.agri.marketplace.dto.ai;

import java.util.List;

public class AiForecastRequestDto {

    private Long crop_id;
    private String crop_name;
    private List<HistoricalOrderRecordDto> historical_orders;
    private Integer horizon_days;
    private String aggregation_interval;

    public AiForecastRequestDto() {
    }

    public AiForecastRequestDto(Long crop_id, String crop_name, List<HistoricalOrderRecordDto> historical_orders, Integer horizon_days, String aggregation_interval) {
        this.crop_id = crop_id;
        this.crop_name = crop_name;
        this.historical_orders = historical_orders;
        this.horizon_days = horizon_days;
        this.aggregation_interval = aggregation_interval;
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

    public List<HistoricalOrderRecordDto> getHistorical_orders() {
        return historical_orders;
    }

    public void setHistorical_orders(List<HistoricalOrderRecordDto> historical_orders) {
        this.historical_orders = historical_orders;
    }

    public Integer getHorizon_days() {
        return horizon_days;
    }

    public void setHorizon_days(Integer horizon_days) {
        this.horizon_days = horizon_days;
    }

    public String getAggregation_interval() {
        return aggregation_interval;
    }

    public void setAggregation_interval(String aggregation_interval) {
        this.aggregation_interval = aggregation_interval;
    }
}
