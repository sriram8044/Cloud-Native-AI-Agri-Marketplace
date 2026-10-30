package com.agri.marketplace.service;

import com.agri.marketplace.dto.CropRequestDto;
import com.agri.marketplace.dto.CropResponseDto;
import com.agri.marketplace.entity.Crop;
import com.agri.marketplace.exception.ResourceNotFoundException;
import com.agri.marketplace.repository.CropRepository;
import com.agri.marketplace.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CropServiceTest {

    @Mock
    private CropRepository cropRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CropServiceImpl cropService;

    private Crop crop;
    private CropRequestDto requestDto;

    @BeforeEach
    void setUp() {
        crop = new Crop(
                1L,
                "Wheat",
                "Grains",
                "High protein wheat",
                new BigDecimal("45.00"),
                new BigDecimal("800.00"),
                "Punjab",
                LocalDateTime.now()
        );

        requestDto = new CropRequestDto(
                "Wheat",
                "Grains",
                "High protein wheat",
                new BigDecimal("45.00"),
                new BigDecimal("800.00"),
                "Punjab"
        );
    }

    @Test
    @DisplayName("createCrop saves entity and returns valid DTO")
    void testCreateCrop() {
        when(cropRepository.save(any(Crop.class))).thenReturn(crop);

        CropResponseDto response = cropService.createCrop(requestDto);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("Wheat");
        verify(cropRepository, times(1)).save(any(Crop.class));
    }

    @Test
    @DisplayName("getAllCrops without search returns all crops")
    void testGetAllCrops_NoSearch() {
        when(cropRepository.findAll()).thenReturn(Arrays.asList(crop));

        List<CropResponseDto> result = cropService.getAllCrops(null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Wheat");
        verify(cropRepository, times(1)).findAll();
        verify(cropRepository, never()).findByNameContainingIgnoreCase(any());
    }

    @Test
    @DisplayName("getAllCrops with search calls findByNameContainingIgnoreCase")
    void testGetAllCrops_WithSearch() {
        when(cropRepository.findByNameContainingIgnoreCase("wheat")).thenReturn(Arrays.asList(crop));

        List<CropResponseDto> result = cropService.getAllCrops("wheat");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Wheat");
        verify(cropRepository, times(1)).findByNameContainingIgnoreCase("wheat");
    }

    @Test
    @DisplayName("getCropById returns DTO when found")
    void testGetCropById_Found() {
        when(cropRepository.findById(1L)).thenReturn(Optional.of(crop));

        CropResponseDto result = cropService.getCropById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getCropById throws ResourceNotFoundException when not found")
    void testGetCropById_NotFound() {
        when(cropRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cropService.getCropById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Crop not found with id: 99");
    }
}
