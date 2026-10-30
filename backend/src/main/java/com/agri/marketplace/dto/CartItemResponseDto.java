package com.agri.marketplace.dto;

import java.math.BigDecimal;

public class CartItemResponseDto {

    private Long id;
    private Long cropId;
    private String cropName;
    private String category;
    private BigDecimal pricePerKg;
    private BigDecimal quantityKg;
    private BigDecimal availableStockKg;
    private BigDecimal lineTotal;
    private String farmerName;
    private String location;

    public CartItemResponseDto() {
    }

    public CartItemResponseDto(Long id, Long cropId, String cropName, String category,
                               BigDecimal pricePerKg, BigDecimal quantityKg, BigDecimal availableStockKg,
                               BigDecimal lineTotal, String farmerName, String location) {
        this.id = id;
        this.cropId = cropId;
        this.cropName = cropName;
        this.category = category;
        this.pricePerKg = pricePerKg;
        this.quantityKg = quantityKg;
        this.availableStockKg = availableStockKg;
        this.lineTotal = lineTotal;
        this.farmerName = farmerName;
        this.location = location;
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
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

    public BigDecimal getAvailableStockKg() {
        return availableStockKg;
    }

    public void setAvailableStockKg(BigDecimal availableStockKg) {
        this.availableStockKg = availableStockKg;
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }

    public void setLineTotal(BigDecimal lineTotal) {
        this.lineTotal = lineTotal;
    }

    public String getFarmerName() {
        return farmerName;
    }

    public void setFarmerName(String farmerName) {
        this.farmerName = farmerName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }
}
