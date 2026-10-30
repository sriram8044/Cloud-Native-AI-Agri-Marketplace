package com.agri.marketplace.service;

import com.agri.marketplace.dto.AddToCartRequestDto;
import com.agri.marketplace.dto.CartItemResponseDto;
import com.agri.marketplace.dto.CartSummaryResponseDto;
import com.agri.marketplace.dto.UpdateCartItemRequestDto;

public interface CartService {

    CartSummaryResponseDto getCart(String customerEmail);

    CartItemResponseDto addToCart(AddToCartRequestDto requestDto, String customerEmail);

    CartItemResponseDto updateCartItem(Long itemId, UpdateCartItemRequestDto requestDto, String customerEmail);

    void removeCartItem(Long itemId, String customerEmail);

    void clearCart(String customerEmail);
}
