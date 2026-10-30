package com.agri.marketplace.repository;

import com.agri.marketplace.entity.CartItem;
import com.agri.marketplace.entity.Crop;
import com.agri.marketplace.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    List<CartItem> findByCustomerOrderByCreatedAtDesc(User customer);

    Optional<CartItem> findByCustomerAndCrop(User customer, Crop crop);

    void deleteByCustomer(User customer);

    long countByCustomer(User customer);
}
