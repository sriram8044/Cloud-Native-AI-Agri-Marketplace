package com.agri.marketplace.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class CartSummaryResponseDto {

    private List<CartItemResponseDto> items = new ArrayList<>();
    private int totalItems;
    private BigDecimal totalQuantityKg;
    private BigDecimal subtotal;

    public CartSummaryResponseDto() {
        this.items = new ArrayList<>();
        this.totalItems = 0;
        this.totalQuantityKg = BigDecimal.ZERO;
        this.subtotal = BigDecimal.ZERO;
    }

    public CartSummaryResponseDto(List<CartItemResponseDto> items, int totalItems,
                                  BigDecimal totalQuantityKg, BigDecimal subtotal) {
        this.items = items;
        this.totalItems = totalItems;
        this.totalQuantityKg = totalQuantityKg;
        this.subtotal = subtotal;
    }

    public List<CartItemResponseDto> getItems() {
        return items;
    }

    public void setItems(List<CartItemResponseDto> items) {
        this.items = items;
    }

    public int getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(int totalItems) {
        this.totalItems = totalItems;
    }

    public BigDecimal getTotalQuantityKg() {
        return totalQuantityKg;
    }

    public void setTotalQuantityKg(BigDecimal totalQuantityKg) {
        this.totalQuantityKg = totalQuantityKg;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }
}
