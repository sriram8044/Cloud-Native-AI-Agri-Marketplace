package com.agri.marketplace.service;

import com.agri.marketplace.dto.CropRequestDto;
import com.agri.marketplace.dto.CropResponseDto;

import java.util.List;

public interface CropService {

    CropResponseDto createCrop(CropRequestDto requestDto);

    CropResponseDto createCrop(CropRequestDto requestDto, String userEmail);

    List<CropResponseDto> getAllCrops(String search);

    CropResponseDto getCropById(Long id);

    CropResponseDto updateCrop(Long id, CropRequestDto requestDto, String userEmail);

    void deleteCrop(Long id, String userEmail);
}
