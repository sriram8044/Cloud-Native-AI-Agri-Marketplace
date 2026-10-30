package com.agri.marketplace.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class CropRequestDto {

    @NotBlank(message = "Crop name is required")
    @Size(max = 100, message = "Crop name must not exceed 100 characters")
    private String name;

    @NotBlank(message = "Category is required")
    @Size(max = 50, message = "Category must not exceed 50 characters")
    private String category;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    @NotNull(message = "Price per kg is required")
    @DecimalMin(value = "0.01", message = "Price per kg must be greater than zero")
    @Digits(integer = 8, fraction = 2, message = "Price must have at most 8 integer digits and 2 decimal places")
    private BigDecimal pricePerKg;

    @NotNull(message = "Available quantity is required")
    @DecimalMin(value = "0.01", message = "Available quantity must be greater than zero")
    @Digits(integer = 10, fraction = 2, message = "Quantity must have at most 10 integer digits and 2 decimal places")
    private BigDecimal availableQuantityKg;

    @NotBlank(message = "Location is required")
    @Size(max = 100, message = "Location must not exceed 100 characters")
    private String location;

    public CropRequestDto() {
    }

    public CropRequestDto(String name, String category, String description,
                          BigDecimal pricePerKg, BigDecimal availableQuantityKg, String location) {
        this.name = name;
        this.category = category;
        this.description = description;
        this.pricePerKg = pricePerKg;
        this.availableQuantityKg = availableQuantityKg;
        this.location = location;
    }

    // Getters and Setters

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
}
