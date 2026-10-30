package com.agri.marketplace.service;

import com.agri.marketplace.dto.FarmerOrderItemResponseDto;
import com.agri.marketplace.dto.OrderItemResponseDto;
import com.agri.marketplace.dto.OrderResponseDto;
import com.agri.marketplace.dto.PlaceOrderRequestDto;
import com.agri.marketplace.entity.CartItem;
import com.agri.marketplace.entity.Crop;
import com.agri.marketplace.entity.Order;
import com.agri.marketplace.entity.OrderItem;
import com.agri.marketplace.entity.OrderStatus;
import com.agri.marketplace.entity.Role;
import com.agri.marketplace.entity.User;
import com.agri.marketplace.exception.InsufficientStockException;
import com.agri.marketplace.exception.ResourceNotFoundException;
import com.agri.marketplace.repository.CartItemRepository;
import com.agri.marketplace.repository.CropRepository;
import com.agri.marketplace.repository.OrderItemRepository;
import com.agri.marketplace.repository.OrderRepository;
import com.agri.marketplace.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final CropRepository cropRepository;
    private final UserRepository userRepository;

    public OrderServiceImpl(OrderRepository orderRepository,
                            OrderItemRepository orderItemRepository,
                            CartItemRepository cartItemRepository,
                            CropRepository cropRepository,
                            UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartItemRepository = cartItemRepository;
        this.cropRepository = cropRepository;
        this.userRepository = userRepository;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
    }

    @Override
    public OrderResponseDto placeOrder(PlaceOrderRequestDto requestDto, String customerEmail) {
        User customer = getUserByEmail(customerEmail);
        if (customer.getRole() != Role.CUSTOMER) {
            throw new AccessDeniedException("Only CUSTOMER accounts are permitted to place orders.");
        }

        List<CartItem> cartItems = cartItemRepository.findByCustomerOrderByCreatedAtDesc(customer);
        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cannot place order with an empty shopping cart.");
        }

        Order order = new Order();
        order.setCustomer(customer);
        order.setDeliveryAddress(requestDto.getDeliveryAddress().trim());
        order.setStatus(OrderStatus.PLACED);

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CartItem cartItem : cartItems) {
            Long cropId = cartItem.getCrop().getId();
            Crop crop = cropRepository.findByIdWithLock(cropId)
                    .orElseThrow(() -> new ResourceNotFoundException("Crop listing not found with id: " + cropId));

            BigDecimal requestedQty = cartItem.getQuantityKg();
            if (crop.getAvailableQuantityKg().compareTo(requestedQty) < 0) {
                throw new InsufficientStockException(
                        "Insufficient stock for crop '" + crop.getName() + "'. Available: " +
                        crop.getAvailableQuantityKg() + " kg, requested: " + requestedQty + " kg"
                );
            }

            // Decrement stock under pessimistic write lock
            crop.setAvailableQuantityKg(crop.getAvailableQuantityKg().subtract(requestedQty));
            cropRepository.save(crop);

            // Snapshot price and name for historical audit
            BigDecimal lineTotal = crop.getPricePerKg().multiply(requestedQty).setScale(2, RoundingMode.HALF_UP);
            totalAmount = totalAmount.add(lineTotal);

            OrderItem orderItem = new OrderItem(
                    order,
                    crop,
                    crop.getFarmer(),
                    crop.getName(),
                    crop.getPricePerKg(),
                    requestedQty,
                    lineTotal
            );
            order.addItem(orderItem);
        }

        order.setTotalAmount(totalAmount.setScale(2, RoundingMode.HALF_UP));

        Order savedOrder = orderRepository.save(order);

        // Atomically clear customer cart after successful order creation
        cartItemRepository.deleteByCustomer(customer);

        return mapToOrderResponseDto(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponseDto> getMyOrders(String customerEmail) {
        User customer = getUserByEmail(customerEmail);
        if (customer.getRole() != Role.CUSTOMER) {
            throw new AccessDeniedException("Only CUSTOMER accounts have customer order history.");
        }

        return orderRepository.findByCustomerOrderByCreatedAtDesc(customer)
                .stream()
                .map(this::mapToOrderResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponseDto getOrderById(Long orderId, String userEmail) {
        User user = getUserByEmail(userEmail);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (user.getRole() == Role.ADMIN) {
            return mapToOrderResponseDto(order);
        }

        if (user.getRole() == Role.CUSTOMER) {
            if (!order.getCustomer().getId().equals(user.getId())) {
                throw new AccessDeniedException("You are not authorized to view this order.");
            }
            return mapToOrderResponseDto(order);
        }

        if (user.getRole() == Role.FARMER) {
            boolean hasFarmerCrop = order.getItems().stream()
                    .anyMatch(item -> item.getFarmer() != null && item.getFarmer().getId().equals(user.getId()));
            if (!hasFarmerCrop) {
                throw new AccessDeniedException("You do not have any items in this order.");
            }
            return mapToOrderResponseDto(order);
        }

        throw new AccessDeniedException("Unauthorized to view this order.");
    }

    @Override
    @Transactional(readOnly = true)
    public List<FarmerOrderItemResponseDto> getFarmerOrderItems(String farmerEmail) {
        User farmer = getUserByEmail(farmerEmail);
        if (farmer.getRole() != Role.FARMER && farmer.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only FARMER and ADMIN accounts can view farmer orders.");
        }

        List<OrderItem> items = orderItemRepository.findByFarmerOrderByOrderDate(farmer);
        return items.stream()
                .map(this::mapToFarmerOrderItemDto)
                .collect(Collectors.toList());
    }

    @Override
    public OrderResponseDto updateOrderStatus(Long orderId, OrderStatus newStatus, String userEmail) {
        User user = getUserByEmail(userEmail);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        OrderStatus currentStatus = order.getStatus();

        if (currentStatus == OrderStatus.DELIVERED) {
            throw new IllegalStateException("Order has already been delivered and its status cannot be changed.");
        }

        if (currentStatus == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Order has already been cancelled and cannot be updated.");
        }

        if (user.getRole() == Role.CUSTOMER) {
            if (!order.getCustomer().getId().equals(user.getId())) {
                throw new AccessDeniedException("You are not authorized to update this order.");
            }
            if (newStatus != OrderStatus.CANCELLED) {
                throw new AccessDeniedException("Customers can only cancel eligible orders.");
            }
            if (currentStatus != OrderStatus.PLACED && currentStatus != OrderStatus.CONFIRMED) {
                throw new IllegalStateException("Orders that are already packed or shipped cannot be cancelled.");
            }

            // Restore stock transactionally under pessimistic write lock
            restoreOrderStock(order);
            order.setStatus(OrderStatus.CANCELLED);
            Order saved = orderRepository.save(order);
            return mapToOrderResponseDto(saved);
        }

        if (user.getRole() == Role.FARMER) {
            boolean hasFarmerCrop = order.getItems().stream()
                    .anyMatch(item -> item.getFarmer() != null && item.getFarmer().getId().equals(user.getId()));
            if (!hasFarmerCrop) {
                throw new AccessDeniedException("You do not have permissions for any items in this order.");
            }

            if (newStatus == OrderStatus.CANCELLED) {
                throw new AccessDeniedException("Farmers cannot cancel orders directly. Contact admin or customer.");
            }

            // Enforce valid forward progression: PLACED -> CONFIRMED -> PACKED -> SHIPPED -> DELIVERED
            boolean validTransition = switch (currentStatus) {
                case PLACED -> newStatus == OrderStatus.CONFIRMED;
                case CONFIRMED -> newStatus == OrderStatus.PACKED;
                case PACKED -> newStatus == OrderStatus.SHIPPED;
                case SHIPPED -> newStatus == OrderStatus.DELIVERED;
                default -> false;
            };

            if (!validTransition) {
                throw new IllegalStateException(
                        "Invalid status transition from " + currentStatus + " to " + newStatus
                );
            }

            order.setStatus(newStatus);
            Order saved = orderRepository.save(order);
            return mapToOrderResponseDto(saved);
        }

        if (user.getRole() == Role.ADMIN) {
            if (newStatus == OrderStatus.CANCELLED && currentStatus != OrderStatus.DELIVERED) {
                restoreOrderStock(order);
            }
            order.setStatus(newStatus);
            Order saved = orderRepository.save(order);
            return mapToOrderResponseDto(saved);
        }

        throw new AccessDeniedException("Unauthorized to update order status.");
    }

    private void restoreOrderStock(Order order) {
        for (OrderItem item : order.getItems()) {
            if (item.getCrop() != null && item.getCrop().getId() != null) {
                cropRepository.findByIdWithLock(item.getCrop().getId()).ifPresent(crop -> {
                    crop.setAvailableQuantityKg(crop.getAvailableQuantityKg().add(item.getQuantityKg()));
                    cropRepository.save(crop);
                });
            }
        }
    }

    private OrderResponseDto mapToOrderResponseDto(Order order) {
        List<OrderItemResponseDto> itemDtos = order.getItems().stream()
                .map(item -> new OrderItemResponseDto(
                        item.getId(),
                        item.getCrop() != null ? item.getCrop().getId() : null,
                        item.getCropNameSnapshot(),
                        item.getFarmer() != null ? item.getFarmer().getId() : null,
                        item.getFarmer() != null ? item.getFarmer().getName() : "Unknown Farmer",
                        item.getPricePerKgSnapshot(),
                        item.getQuantityKg(),
                        item.getLineTotal()
                ))
                .collect(Collectors.toList());

        return new OrderResponseDto(
                order.getId(),
                order.getCustomer().getId(),
                order.getCustomer().getName(),
                order.getCustomer().getEmail(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getDeliveryAddress(),
                order.getCreatedAt(),
                order.getUpdatedAt(),
                itemDtos
        );
    }

    private FarmerOrderItemResponseDto mapToFarmerOrderItemDto(OrderItem item) {
        Order order = item.getOrder();
        return new FarmerOrderItemResponseDto(
                item.getId(),
                order.getId(),
                order.getStatus(),
                order.getCreatedAt(),
                order.getCustomer() != null ? order.getCustomer().getName() : "Unknown Customer",
                order.getDeliveryAddress(),
                item.getCrop() != null ? item.getCrop().getId() : null,
                item.getCropNameSnapshot(),
                item.getQuantityKg(),
                item.getPricePerKgSnapshot(),
                item.getLineTotal()
        );
    }
}
