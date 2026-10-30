package com.agri.marketplace.repository;

import com.agri.marketplace.entity.OrderItem;
import com.agri.marketplace.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("SELECT oi FROM OrderItem oi JOIN oi.order o WHERE oi.farmer = :farmer ORDER BY o.createdAt DESC")
    List<OrderItem> findByFarmerOrderByOrderDate(@Param("farmer") User farmer);

    @Query("SELECT oi FROM OrderItem oi JOIN oi.order o WHERE oi.crop.id = :cropId AND o.status != com.agri.marketplace.entity.OrderStatus.CANCELLED ORDER BY o.createdAt ASC")
    List<OrderItem> findValidOrdersByCropId(@Param("cropId") Long cropId);

    @Query("SELECT oi FROM OrderItem oi JOIN oi.order o WHERE oi.farmer = :farmer AND o.status != com.agri.marketplace.entity.OrderStatus.CANCELLED ORDER BY o.createdAt ASC")
    List<OrderItem> findValidOrdersByFarmer(@Param("farmer") User farmer);
}

