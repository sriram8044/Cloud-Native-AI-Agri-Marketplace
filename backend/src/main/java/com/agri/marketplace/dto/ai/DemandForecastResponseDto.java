package com.agri.marketplace.dto.ai;

import java.util.List;

public class DemandForecastResponseDto {

    private Long crop_id;
    private String crop_name;
    private String status;
    private Boolean has_sufficient_data;
    private Integer historical_points_count;
    private Integer minimum_points_required;
    private Integer forecast_horizon_days;
    private List<DemandForecastPointDto> forecast;
    private ModelEvaluationMetricsDto baseline_model;
    private ModelEvaluationMetricsDto evaluated_model;
    private List<String> data_limitations;

    public DemandForecastResponseDto() {
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getHas_sufficient_data() {
        return has_sufficient_data;
    }

    public void setHas_sufficient_data(Boolean has_sufficient_data) {
        this.has_sufficient_data = has_sufficient_data;
    }

    public Integer getHistorical_points_count() {
        return historical_points_count;
    }

    public void setHistorical_points_count(Integer historical_points_count) {
        this.historical_points_count = historical_points_count;
    }

    public Integer getMinimum_points_required() {
        return minimum_points_required;
    }

    public void setMinimum_points_required(Integer minimum_points_required) {
        this.minimum_points_required = minimum_points_required;
    }

    public Integer getForecast_horizon_days() {
        return forecast_horizon_days;
    }

    public void setForecast_horizon_days(Integer forecast_horizon_days) {
        this.forecast_horizon_days = forecast_horizon_days;
    }

    public List<DemandForecastPointDto> getForecast() {
        return forecast;
    }

    public void setForecast(List<DemandForecastPointDto> forecast) {
        this.forecast = forecast;
    }

    public ModelEvaluationMetricsDto getBaseline_model() {
        return baseline_model;
    }

    public void setBaseline_model(ModelEvaluationMetricsDto baseline_model) {
        this.baseline_model = baseline_model;
    }

    public ModelEvaluationMetricsDto getEvaluated_model() {
        return evaluated_model;
    }

    public void setEvaluated_model(ModelEvaluationMetricsDto evaluated_model) {
        this.evaluated_model = evaluated_model;
    }

    public List<String> getData_limitations() {
        return data_limitations;
    }

    public void setData_limitations(List<String> data_limitations) {
        this.data_limitations = data_limitations;
    }
}
