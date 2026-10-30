package com.agri.marketplace.dto.ai;

import java.util.List;

public class AiProfitRequestDto {

    private Long farmer_id;
    private List<ProfitItemInputDto> items;

    public AiProfitRequestDto() {
    }

    public AiProfitRequestDto(Long farmer_id, List<ProfitItemInputDto> items) {
        this.farmer_id = farmer_id;
        this.items = items;
    }

    public Long getFarmer_id() {
        return farmer_id;
    }

    public void setFarmer_id(Long farmer_id) {
        this.farmer_id = farmer_id;
    }

    public List<ProfitItemInputDto> getItems() {
        return items;
    }

    public void setItems(List<ProfitItemInputDto> items) {
        this.items = items;
    }
}
