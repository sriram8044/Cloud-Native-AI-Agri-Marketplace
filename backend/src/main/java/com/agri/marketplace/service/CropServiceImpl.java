package com.agri.marketplace.service;

import com.agri.marketplace.dto.CropRequestDto;
import com.agri.marketplace.dto.CropResponseDto;
import com.agri.marketplace.entity.Crop;
import com.agri.marketplace.entity.Role;
import com.agri.marketplace.entity.User;
import com.agri.marketplace.exception.ResourceNotFoundException;
import com.agri.marketplace.repository.CropRepository;
import com.agri.marketplace.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CropServiceImpl implements CropService {

    private final CropRepository cropRepository;
    private final UserRepository userRepository;

    public CropServiceImpl(CropRepository cropRepository, UserRepository userRepository) {
        this.cropRepository = cropRepository;
        this.userRepository = userRepository;
    }

    @Override
    public CropResponseDto createCrop(CropRequestDto requestDto) {
        return createCrop(requestDto, null);
    }

    @Override
    public CropResponseDto createCrop(CropRequestDto requestDto, String userEmail) {
        Crop crop = new Crop();
        crop.setName(requestDto.getName().trim());
        crop.setCategory(requestDto.getCategory().trim());
        crop.setDescription(requestDto.getDescription());
        crop.setPricePerKg(requestDto.getPricePerKg());
        crop.setAvailableQuantityKg(requestDto.getAvailableQuantityKg());
        crop.setLocation(requestDto.getLocation().trim());

        if (userEmail != null) {
            User user = userRepository.findByEmail(userEmail.toLowerCase().trim())
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

            if (user.getRole() == Role.CUSTOMER) {
                throw new AccessDeniedException("Customers cannot create crop listings. Only registered farmers are permitted.");
            }
            crop.setFarmer(user);
        }

        Crop savedCrop = cropRepository.save(crop);
        return mapToResponseDto(savedCrop);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CropResponseDto> getAllCrops(String search) {
        List<Crop> crops;
        if (search != null && !search.trim().isEmpty()) {
            crops = cropRepository.findByNameContainingIgnoreCase(search.trim());
        } else {
            crops = cropRepository.findAll();
        }
        return crops.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CropResponseDto getCropById(Long id) {
        Crop crop = cropRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Crop not found with id: " + id));
        return mapToResponseDto(crop);
    }

    @Override
    public CropResponseDto updateCrop(Long id, CropRequestDto requestDto, String userEmail) {
        Crop crop = cropRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Crop not found with id: " + id));

        verifyOwnership(crop, userEmail, "modify");

        crop.setName(requestDto.getName().trim());
        crop.setCategory(requestDto.getCategory().trim());
        crop.setDescription(requestDto.getDescription());
        crop.setPricePerKg(requestDto.getPricePerKg());
        crop.setAvailableQuantityKg(requestDto.getAvailableQuantityKg());
        crop.setLocation(requestDto.getLocation().trim());

        Crop updated = cropRepository.save(crop);
        return mapToResponseDto(updated);
    }

    @Override
    public void deleteCrop(Long id, String userEmail) {
        Crop crop = cropRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Crop not found with id: " + id));

        verifyOwnership(crop, userEmail, "delete");

        cropRepository.delete(crop);
    }

    private void verifyOwnership(Crop crop, String userEmail, String action) {
        if (userEmail == null) {
            throw new AccessDeniedException("Authentication required to " + action + " listings.");
        }

        User user = userRepository.findByEmail(userEmail.toLowerCase().trim())
                .orElseThrow(() -> new AccessDeniedException("User not recognized."));

        // Admins have full oversight; otherwise user must be the listing owner
        if (user.getRole() != Role.ADMIN) {
            if (crop.getFarmer() == null || !crop.getFarmer().getId().equals(user.getId())) {
                throw new AccessDeniedException("Access denied: You do not have permission to " + action + " another farmer's listing.");
            }
        }
    }

    private CropResponseDto mapToResponseDto(Crop crop) {
        Long farmerId = null;
        String farmerName = null;
        if (crop.getFarmer() != null) {
            farmerId = crop.getFarmer().getId();
            farmerName = crop.getFarmer().getName();
        }

        return new CropResponseDto(
                crop.getId(),
                crop.getName(),
                crop.getCategory(),
                crop.getDescription(),
                crop.getPricePerKg(),
                crop.getAvailableQuantityKg(),
                crop.getLocation(),
                crop.getCreatedAt(),
                farmerId,
                farmerName
        );
    }
}
