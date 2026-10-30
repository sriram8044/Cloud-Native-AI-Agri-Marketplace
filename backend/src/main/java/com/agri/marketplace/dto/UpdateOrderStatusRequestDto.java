package com.agri.marketplace.dto;

import com.agri.marketplace.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateOrderStatusRequestDto {

    @NotNull(message = "Order status is required")
    private OrderStatus status;

    public UpdateOrderStatusRequestDto() {
    }

    public UpdateOrderStatusRequestDto(OrderStatus status) {
        this.status = status;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }
}
