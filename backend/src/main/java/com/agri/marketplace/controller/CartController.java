package com.agri.marketplace.controller;

import com.agri.marketplace.dto.AddToCartRequestDto;
import com.agri.marketplace.dto.CartItemResponseDto;
import com.agri.marketplace.dto.CartSummaryResponseDto;
import com.agri.marketplace.dto.UpdateCartItemRequestDto;
import com.agri.marketplace.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@PreAuthorize("hasRole('CUSTOMER')")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<CartSummaryResponseDto> getCart(Authentication authentication) {
        CartSummaryResponseDto cart = cartService.getCart(authentication.getName());
        return ResponseEntity.ok(cart);
    }

    @PostMapping("/items")
    public ResponseEntity<CartItemResponseDto> addToCart(@Valid @RequestBody AddToCartRequestDto requestDto,
                                                         Authentication authentication) {
        CartItemResponseDto item = cartService.addToCart(requestDto, authentication.getName());
        return new ResponseEntity<>(item, HttpStatus.CREATED);
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<CartItemResponseDto> updateCartItem(@PathVariable("id") Long id,
                                                              @Valid @RequestBody UpdateCartItemRequestDto requestDto,
                                                              Authentication authentication) {
        CartItemResponseDto item = cartService.updateCartItem(id, requestDto, authentication.getName());
        return ResponseEntity.ok(item);
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<Map<String, String>> removeCartItem(@PathVariable("id") Long id,
                                                              Authentication authentication) {
        cartService.removeCartItem(id, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Item removed from cart"));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> clearCart(Authentication authentication) {
        cartService.clearCart(authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Cart cleared successfully"));
    }
}
