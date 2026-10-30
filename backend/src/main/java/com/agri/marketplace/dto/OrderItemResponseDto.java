package com.agri.marketplace.dto;

import java.math.BigDecimal;

public class OrderItemResponseDto {

    private Long id;
    private Long cropId;
    private String cropName;
    private Long farmerId;
    private String farmerName;
    private BigDecimal pricePerKg;
    private BigDecimal quantityKg;
    private BigDecimal lineTotal;

    public OrderItemResponseDto() {
    }

    public OrderItemResponseDto(Long id, Long cropId, String cropName, Long farmerId,
                                String farmerName, BigDecimal pricePerKg, BigDecimal quantityKg,
                                BigDecimal lineTotal) {
        this.id = id;
        this.cropId = cropId;
        this.cropName = cropName;
        this.farmerId = farmerId;
        this.farmerName = farmerName;
        this.pricePerKg = pricePerKg;
        this.quantityKg = quantityKg;
        this.lineTotal = lineTotal;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCropId() {
        return cropId;
    }

    public void setCropId(Long cropId) {
        this.cropId = cropId;
    }

    public String getCropName() {
        return cropName;
    }

    public void setCropName(String cropName) {
        this.cropName = cropName;
    }

    public Long getFarmerId() {
        return farmerId;
    }

    public void setFarmerId(Long farmerId) {
        this.farmerId = farmerId;
    }

    public String getFarmerName() {
        return farmerName;
    }

    public void setFarmerName(String farmerName) {
        this.farmerName = farmerName;
    }

    public BigDecimal getPricePerKg() {
        return pricePerKg;
    }

    public void setPricePerKg(BigDecimal pricePerKg) {
        this.pricePerKg = pricePerKg;
    }

    public BigDecimal getQuantityKg() {
        return quantityKg;
    }

    public void setQuantityKg(BigDecimal quantityKg) {
        this.quantityKg = quantityKg;
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }

    public void setLineTotal(BigDecimal lineTotal) {
        this.lineTotal = lineTotal;
    }
}
