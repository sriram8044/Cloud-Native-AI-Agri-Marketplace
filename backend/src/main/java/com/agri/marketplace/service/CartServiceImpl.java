package com.agri.marketplace.service;

import com.agri.marketplace.dto.AddToCartRequestDto;
import com.agri.marketplace.dto.CartItemResponseDto;
import com.agri.marketplace.dto.CartSummaryResponseDto;
import com.agri.marketplace.dto.UpdateCartItemRequestDto;
import com.agri.marketplace.entity.CartItem;
import com.agri.marketplace.entity.Crop;
import com.agri.marketplace.entity.Role;
import com.agri.marketplace.entity.User;
import com.agri.marketplace.exception.InsufficientStockException;
import com.agri.marketplace.exception.ResourceNotFoundException;
import com.agri.marketplace.repository.CartItemRepository;
import com.agri.marketplace.repository.CropRepository;
import com.agri.marketplace.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CartServiceImpl implements CartService {

    private final CartItemRepository cartItemRepository;
    private final CropRepository cropRepository;
    private final UserRepository userRepository;

    public CartServiceImpl(CartItemRepository cartItemRepository,
                           CropRepository cropRepository,
                           UserRepository userRepository) {
        this.cartItemRepository = cartItemRepository;
        this.cropRepository = cropRepository;
        this.userRepository = userRepository;
    }

    private User getCustomerOrThrow(String customerEmail) {
        User user = userRepository.findByEmail(customerEmail.toLowerCase().trim())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + customerEmail));
        if (user.getRole() != Role.CUSTOMER) {
            throw new AccessDeniedException("Only CUSTOMER accounts are permitted to manage a shopping cart.");
        }
        return user;
    }

    @Override
    @Transactional(readOnly = true)
    public CartSummaryResponseDto getCart(String customerEmail) {
        User customer = getCustomerOrThrow(customerEmail);
        List<CartItem> items = cartItemRepository.findByCustomerOrderByCreatedAtDesc(customer);

        List<CartItemResponseDto> itemDtos = new ArrayList<>();
        BigDecimal totalQuantity = BigDecimal.ZERO;
        BigDecimal subtotal = BigDecimal.ZERO;

        for (CartItem item : items) {
            CartItemResponseDto dto = mapToResponseDto(item);
            itemDtos.add(dto);
            totalQuantity = totalQuantity.add(dto.getQuantityKg());
            subtotal = subtotal.add(dto.getLineTotal());
        }

        return new CartSummaryResponseDto(
                itemDtos,
                itemDtos.size(),
                totalQuantity.setScale(2, RoundingMode.HALF_UP),
                subtotal.setScale(2, RoundingMode.HALF_UP)
        );
    }

    @Override
    public CartItemResponseDto addToCart(AddToCartRequestDto requestDto, String customerEmail) {
        User customer = getCustomerOrThrow(customerEmail);

        if (requestDto.getQuantityKg() == null || requestDto.getQuantityKg().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        Crop crop = cropRepository.findById(requestDto.getCropId())
                .orElseThrow(() -> new ResourceNotFoundException("Crop listing not found with id: " + requestDto.getCropId()));

        Optional<CartItem> existingItemOpt = cartItemRepository.findByCustomerAndCrop(customer, crop);

        CartItem itemToSave;
        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            BigDecimal newQuantity = existingItem.getQuantityKg().add(requestDto.getQuantityKg());
            if (newQuantity.compareTo(crop.getAvailableQuantityKg()) > 0) {
                throw new InsufficientStockException(
                        "Cannot add " + requestDto.getQuantityKg() + " kg. Total in cart (" + newQuantity +
                        " kg) would exceed available stock of " + crop.getAvailableQuantityKg() + " kg for '" + crop.getName() + "'"
                );
            }
            existingItem.setQuantityKg(newQuantity);
            itemToSave = cartItemRepository.save(existingItem);
        } else {
            if (requestDto.getQuantityKg().compareTo(crop.getAvailableQuantityKg()) > 0) {
                throw new InsufficientStockException(
                        "Requested quantity " + requestDto.getQuantityKg() + " kg exceeds available stock of " +
                        crop.getAvailableQuantityKg() + " kg for '" + crop.getName() + "'"
                );
            }
            CartItem newItem = new CartItem(customer, crop, requestDto.getQuantityKg());
            itemToSave = cartItemRepository.save(newItem);
        }

        return mapToResponseDto(itemToSave);
    }

    @Override
    public CartItemResponseDto updateCartItem(Long itemId, UpdateCartItemRequestDto requestDto, String customerEmail) {
        User customer = getCustomerOrThrow(customerEmail);

        if (requestDto.getQuantityKg() == null || requestDto.getQuantityKg().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + itemId));

        if (!item.getCustomer().getId().equals(customer.getId())) {
            throw new AccessDeniedException("You are not authorized to modify this cart item");
        }

        Crop crop = item.getCrop();
        if (requestDto.getQuantityKg().compareTo(crop.getAvailableQuantityKg()) > 0) {
            throw new InsufficientStockException(
                    "Requested quantity " + requestDto.getQuantityKg() + " kg exceeds available stock of " +
                    crop.getAvailableQuantityKg() + " kg for '" + crop.getName() + "'"
            );
        }

        item.setQuantityKg(requestDto.getQuantityKg());
        CartItem saved = cartItemRepository.save(item);
        return mapToResponseDto(saved);
    }

    @Override
    public void removeCartItem(Long itemId, String customerEmail) {
        User customer = getCustomerOrThrow(customerEmail);

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + itemId));

        if (!item.getCustomer().getId().equals(customer.getId())) {
            throw new AccessDeniedException("You are not authorized to remove this cart item");
        }

        cartItemRepository.delete(item);
    }

    @Override
    public void clearCart(String customerEmail) {
        User customer = getCustomerOrThrow(customerEmail);
        cartItemRepository.deleteByCustomer(customer);
    }

    private CartItemResponseDto mapToResponseDto(CartItem item) {
        Crop crop = item.getCrop();
        BigDecimal lineTotal = crop.getPricePerKg().multiply(item.getQuantityKg()).setScale(2, RoundingMode.HALF_UP);
        String farmerName = crop.getFarmer() != null ? crop.getFarmer().getName() : "Unknown Farmer";

        return new CartItemResponseDto(
                item.getId(),
                crop.getId(),
                crop.getName(),
                crop.getCategory(),
                crop.getPricePerKg().setScale(2, RoundingMode.HALF_UP),
                item.getQuantityKg().setScale(2, RoundingMode.HALF_UP),
                crop.getAvailableQuantityKg().setScale(2, RoundingMode.HALF_UP),
                lineTotal,
                farmerName,
                crop.getLocation()
        );
    }
}
