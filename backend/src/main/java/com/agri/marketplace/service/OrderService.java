package com.agri.marketplace.service;

import com.agri.marketplace.dto.FarmerOrderItemResponseDto;
import com.agri.marketplace.dto.OrderResponseDto;
import com.agri.marketplace.dto.PlaceOrderRequestDto;
import com.agri.marketplace.entity.OrderStatus;

import java.util.List;

public interface OrderService {

    OrderResponseDto placeOrder(PlaceOrderRequestDto requestDto, String customerEmail);

    List<OrderResponseDto> getMyOrders(String customerEmail);

    OrderResponseDto getOrderById(Long orderId, String userEmail);

    List<FarmerOrderItemResponseDto> getFarmerOrderItems(String farmerEmail);

    OrderResponseDto updateOrderStatus(Long orderId, OrderStatus newStatus, String userEmail);
}
