package com.agri.marketplace.dto.ai;

import java.math.BigDecimal;

public class ModelEvaluationMetricsDto {

    private String name;
    private BigDecimal mae;
    private BigDecimal rmse;
    private Integer sample_size;
    private String description;

    public ModelEvaluationMetricsDto() {
    }

    public ModelEvaluationMetricsDto(String name, BigDecimal mae, BigDecimal rmse, Integer sample_size, String description) {
        this.name = name;
        this.mae = mae;
        this.rmse = rmse;
        this.sample_size = sample_size;
        this.description = description;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getMae() {
        return mae;
    }

    public void setMae(BigDecimal mae) {
        this.mae = mae;
    }

    public BigDecimal getRmse() {
        return rmse;
    }

    public void setRmse(BigDecimal rmse) {
        this.rmse = rmse;
    }

    public Integer getSample_size() {
        return sample_size;
    }

    public void setSample_size(Integer sample_size) {
        this.sample_size = sample_size;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
