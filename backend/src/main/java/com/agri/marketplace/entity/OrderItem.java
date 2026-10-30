package com.agri.marketplace.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "crop_id")
    private Crop crop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id", nullable = false)
    private User farmer;

    @Column(name = "crop_name_snapshot", nullable = false, length = 100)
    private String cropNameSnapshot;

    @Column(name = "price_per_kg_snapshot", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerKgSnapshot;

    @Column(name = "quantity_kg", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantityKg;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;

    public OrderItem() {
    }

    public OrderItem(Order order, Crop crop, User farmer, String cropNameSnapshot,
                     BigDecimal pricePerKgSnapshot, BigDecimal quantityKg, BigDecimal lineTotal) {
        this.order = order;
        this.crop = crop;
        this.farmer = farmer;
        this.cropNameSnapshot = cropNameSnapshot;
        this.pricePerKgSnapshot = pricePerKgSnapshot;
        this.quantityKg = quantityKg;
        this.lineTotal = lineTotal;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public Crop getCrop() {
        return crop;
    }

    public void setCrop(Crop crop) {
        this.crop = crop;
    }

    public User getFarmer() {
        return farmer;
    }

    public void setFarmer(User farmer) {
        this.farmer = farmer;
    }

    public String getCropNameSnapshot() {
        return cropNameSnapshot;
    }

    public void setCropNameSnapshot(String cropNameSnapshot) {
        this.cropNameSnapshot = cropNameSnapshot;
    }

    public BigDecimal getPricePerKgSnapshot() {
        return pricePerKgSnapshot;
    }

    public void setPricePerKgSnapshot(BigDecimal pricePerKgSnapshot) {
        this.pricePerKgSnapshot = pricePerKgSnapshot;
    }

    public BigDecimal getQuantityKg() {
        return quantityKg;
    }

    public void setQuantityKg(BigDecimal quantityKg) {
        this.quantityKg = quantityKg;
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }

    public void setLineTotal(BigDecimal lineTotal) {
        this.lineTotal = lineTotal;
    }
}
