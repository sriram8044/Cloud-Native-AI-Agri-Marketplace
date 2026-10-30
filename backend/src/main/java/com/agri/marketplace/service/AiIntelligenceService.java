package com.agri.marketplace.service;

import com.agri.marketplace.dto.ai.*;
import com.agri.marketplace.entity.Crop;
import com.agri.marketplace.entity.OrderItem;
import com.agri.marketplace.entity.Role;
import com.agri.marketplace.entity.User;
import com.agri.marketplace.exception.ResourceNotFoundException;
import com.agri.marketplace.repository.CropRepository;
import com.agri.marketplace.repository.OrderItemRepository;
import com.agri.marketplace.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class AiIntelligenceService {

    private final CropRepository cropRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final AiServiceClient aiServiceClient;

    public AiIntelligenceService(
            CropRepository cropRepository,
            OrderItemRepository orderItemRepository,
            UserRepository userRepository,
            AiServiceClient aiServiceClient) {
        this.cropRepository = cropRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
        this.aiServiceClient = aiServiceClient;
    }

    public DemandForecastResponseDto getCropDemandForecast(Long cropId, Integer horizonDays, String userEmail) {
        User user = findUserByEmail(userEmail);
        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new ResourceNotFoundException("Crop not found with id: " + cropId));

        validateFarmerOwnership(crop, user);

        int horizon = (horizonDays != null && horizonDays > 0) ? horizonDays : 7;
        List<OrderItem> validItems = orderItemRepository.findValidOrdersByCropId(cropId);

        List<HistoricalOrderRecordDto> historyRecords = new ArrayList<>();
        for (OrderItem item : validItems) {
            historyRecords.add(new HistoricalOrderRecordDto(
                    item.getOrder().getCreatedAt(),
                    item.getQuantityKg(),
                    item.getPricePerKgSnapshot()
            ));
        }

        AiForecastRequestDto requestDto = new AiForecastRequestDto(
                crop.getId(),
                crop.getName(),
                historyRecords,
                horizon,
                "daily"
        );

        return aiServiceClient.getDemandForecast(requestDto);
    }

    public PriceRecommendationResponseDto getCropPriceRecommendation(Long cropId, BigDecimal costPerKg, String userEmail) {
        User user = findUserByEmail(userEmail);
        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new ResourceNotFoundException("Crop not found with id: " + cropId));

        validateFarmerOwnership(crop, user);

        List<OrderItem> validItems = orderItemRepository.findValidOrdersByCropId(cropId);
        int orderCount = validItems.size();
        BigDecimal totalDemand = BigDecimal.ZERO;
        for (OrderItem item : validItems) {
            totalDemand = totalDemand.add(item.getQuantityKg());
        }

        AiPricingRequestDto requestDto = new AiPricingRequestDto();
        requestDto.setCrop_id(crop.getId());
        requestDto.setCrop_name(crop.getName());
        requestDto.setCurrent_price_per_kg(crop.getPricePerKg());
        requestDto.setAvailable_quantity_kg(crop.getAvailableQuantityKg());
        requestDto.setCost_per_kg(costPerKg);
        requestDto.setHistorical_order_count(orderCount);
        requestDto.setHistorical_total_demand_kg(totalDemand);

        return aiServiceClient.getPriceRecommendation(requestDto);
    }

    public ProfitAnalysisResponseDto getFarmerProfitSummary(Map<Long, BigDecimal> cropCosts, String userEmail) {
        User user = findUserByEmail(userEmail);
        List<Crop> farmerCrops = cropRepository.findByFarmerId(user.getId());
        List<OrderItem> farmerOrders = orderItemRepository.findValidOrdersByFarmer(user);

        // Aggregate orders per crop
        Map<Long, BigDecimal> soldQtyMap = new HashMap<>();
        Map<Long, BigDecimal> revenueMap = new HashMap<>();

        for (OrderItem item : farmerOrders) {
            if (item.getCrop() != null) {
                Long cropId = item.getCrop().getId();
                soldQtyMap.put(cropId, soldQtyMap.getOrDefault(cropId, BigDecimal.ZERO).add(item.getQuantityKg()));
                revenueMap.put(cropId, revenueMap.getOrDefault(cropId, BigDecimal.ZERO).add(item.getLineTotal()));
            }
        }

        List<ProfitItemInputDto> items = new ArrayList<>();
        Map<Long, BigDecimal> costMap = cropCosts != null ? cropCosts : Collections.emptyMap();

        for (Crop crop : farmerCrops) {
            Long cropId = crop.getId();
            BigDecimal soldQty = soldQtyMap.getOrDefault(cropId, BigDecimal.ZERO);
            BigDecimal revenue = revenueMap.getOrDefault(cropId, BigDecimal.ZERO);
            BigDecimal cost = costMap.get(cropId);

            items.add(new ProfitItemInputDto(
                    cropId,
                    crop.getName(),
                    soldQty,
                    revenue,
                    cost
            ));
        }

        AiProfitRequestDto requestDto = new AiProfitRequestDto(user.getId(), items);
        return aiServiceClient.getProfitAnalysis(requestDto);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private void validateFarmerOwnership(Crop crop, User user) {
        if (user.getRole() == Role.ADMIN) {
            return;
        }
        if (crop.getFarmer() == null || !crop.getFarmer().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to access AI intelligence for this crop.");
        }
    }
}
