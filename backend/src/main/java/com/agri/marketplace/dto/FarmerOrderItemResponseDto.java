package com.agri.marketplace.dto;

import com.agri.marketplace.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class FarmerOrderItemResponseDto {

    private Long orderItemId;
    private Long orderId;
    private OrderStatus orderStatus;
    private LocalDateTime orderDate;
    private String customerName;
    private String deliveryAddress;
    private Long cropId;
    private String cropName;
    private BigDecimal quantityKg;
    private BigDecimal pricePerKg;
    private BigDecimal lineTotal;

    public FarmerOrderItemResponseDto() {
    }

    public FarmerOrderItemResponseDto(Long orderItemId, Long orderId, OrderStatus orderStatus,
                                      LocalDateTime orderDate, String customerName,
                                      String deliveryAddress, Long cropId, String cropName,
                                      BigDecimal quantityKg, BigDecimal pricePerKg, BigDecimal lineTotal) {
        this.orderItemId = orderItemId;
        this.orderId = orderId;
        this.orderStatus = orderStatus;
        this.orderDate = orderDate;
        this.customerName = customerName;
        this.deliveryAddress = deliveryAddress;
        this.cropId = cropId;
        this.cropName = cropName;
        this.quantityKg = quantityKg;
        this.pricePerKg = pricePerKg;
        this.lineTotal = lineTotal;
    }

    public Long getOrderItemId() {
        return orderItemId;
    }

    public void setOrderItemId(Long orderItemId) {
        this.orderItemId = orderItemId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public OrderStatus getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(OrderStatus orderStatus) {
        this.orderStatus = orderStatus;
    }

    public LocalDateTime getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDateTime orderDate) {
        this.orderDate = orderDate;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
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

    public BigDecimal getQuantityKg() {
        return quantityKg;
    }

    public void setQuantityKg(BigDecimal quantityKg) {
        this.quantityKg = quantityKg;
    }

    public BigDecimal getPricePerKg() {
        return pricePerKg;
    }

    public void setPricePerKg(BigDecimal pricePerKg) {
        this.pricePerKg = pricePerKg;
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }

    public void setLineTotal(BigDecimal lineTotal) {
        this.lineTotal = lineTotal;
    }
}
