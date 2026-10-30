package com.agri.marketplace.controller;

import com.agri.marketplace.dto.FarmerOrderItemResponseDto;
import com.agri.marketplace.dto.OrderResponseDto;
import com.agri.marketplace.dto.PlaceOrderRequestDto;
import com.agri.marketplace.dto.UpdateOrderStatusRequestDto;
import com.agri.marketplace.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderResponseDto> placeOrder(@Valid @RequestBody PlaceOrderRequestDto requestDto,
                                                       Authentication authentication) {
        OrderResponseDto order = orderService.placeOrder(requestDto, authentication.getName());
        return new ResponseEntity<>(order, HttpStatus.CREATED);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<OrderResponseDto>> getMyOrders(Authentication authentication) {
        List<OrderResponseDto> orders = orderService.getMyOrders(authentication.getName());
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/farmer")
    @PreAuthorize("hasAnyRole('FARMER', 'ADMIN')")
    public ResponseEntity<List<FarmerOrderItemResponseDto>> getFarmerOrders(Authentication authentication) {
        List<FarmerOrderItemResponseDto> items = orderService.getFarmerOrderItems(authentication.getName());
        return ResponseEntity.ok(items);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OrderResponseDto> getOrderById(@PathVariable("id") Long id,
                                                         Authentication authentication) {
        OrderResponseDto order = orderService.getOrderById(id, authentication.getName());
        return ResponseEntity.ok(order);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OrderResponseDto> updateOrderStatus(@PathVariable("id") Long id,
                                                              @Valid @RequestBody UpdateOrderStatusRequestDto requestDto,
                                                              Authentication authentication) {
        OrderResponseDto order = orderService.updateOrderStatus(id, requestDto.getStatus(), authentication.getName());
        return ResponseEntity.ok(order);
    }
}
