package com.agri.marketplace.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CropResponseDto {

    private Long id;
    private String name;
    private String category;
    private String description;
    private BigDecimal pricePerKg;
    private BigDecimal availableQuantityKg;
    private String location;
    private LocalDateTime createdAt;
    private Long farmerId;
    private String farmerName;

    public CropResponseDto() {
    }

    public CropResponseDto(Long id, String name, String category, String description,
                           BigDecimal pricePerKg, BigDecimal availableQuantityKg,
                           String location, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.description = description;
        this.pricePerKg = pricePerKg;
        this.availableQuantityKg = availableQuantityKg;
        this.location = location;
        this.createdAt = createdAt;
    }

    public CropResponseDto(Long id, String name, String category, String description,
                           BigDecimal pricePerKg, BigDecimal availableQuantityKg,
                           String location, LocalDateTime createdAt, Long farmerId, String farmerName) {
        this(id, name, category, description, pricePerKg, availableQuantityKg, location, createdAt);
        this.farmerId = farmerId;
        this.farmerName = farmerName;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPricePerKg() {
        return pricePerKg;
    }

    public void setPricePerKg(BigDecimal pricePerKg) {
        this.pricePerKg = pricePerKg;
    }

    public BigDecimal getAvailableQuantityKg() {
        return availableQuantityKg;
    }

    public void setAvailableQuantityKg(BigDecimal availableQuantityKg) {
        this.availableQuantityKg = availableQuantityKg;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
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
}
