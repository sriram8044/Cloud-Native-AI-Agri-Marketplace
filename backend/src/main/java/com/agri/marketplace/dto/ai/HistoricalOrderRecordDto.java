package com.agri.marketplace.dto.ai;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class HistoricalOrderRecordDto {

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime order_date;

    private BigDecimal quantity_kg;
    private BigDecimal price_per_kg;

    public HistoricalOrderRecordDto() {
    }

    public HistoricalOrderRecordDto(LocalDateTime order_date, BigDecimal quantity_kg, BigDecimal price_per_kg) {
        this.order_date = order_date;
        this.quantity_kg = quantity_kg;
        this.price_per_kg = price_per_kg;
    }

    public LocalDateTime getOrder_date() {
        return order_date;
    }

    public void setOrder_date(LocalDateTime order_date) {
        this.order_date = order_date;
    }

    public BigDecimal getQuantity_kg() {
        return quantity_kg;
    }

    public void setQuantity_kg(BigDecimal quantity_kg) {
        this.quantity_kg = quantity_kg;
    }

    public BigDecimal getPrice_per_kg() {
        return price_per_kg;
    }

    public void setPrice_per_kg(BigDecimal price_per_kg) {
        this.price_per_kg = price_per_kg;
    }
}
