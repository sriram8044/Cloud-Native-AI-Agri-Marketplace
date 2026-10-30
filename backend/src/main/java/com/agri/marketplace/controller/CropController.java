package com.agri.marketplace.controller;

import com.agri.marketplace.dto.CropRequestDto;
import com.agri.marketplace.dto.CropResponseDto;
import com.agri.marketplace.service.CropService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/crops")
public class CropController {

    private final CropService cropService;

    public CropController(CropService cropService) {
        this.cropService = cropService;
    }

    @PostMapping
    public ResponseEntity<CropResponseDto> createCrop(@Valid @RequestBody CropRequestDto requestDto,
                                                      Principal principal) {
        String userEmail = principal != null ? principal.getName() : null;
        CropResponseDto created = cropService.createCrop(requestDto, userEmail);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<CropResponseDto>> getAllCrops(
            @RequestParam(value = "search", required = false) String search) {
        List<CropResponseDto> crops = cropService.getAllCrops(search);
        return ResponseEntity.ok(crops);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CropResponseDto> getCropById(@PathVariable("id") Long id) {
        CropResponseDto crop = cropService.getCropById(id);
        return ResponseEntity.ok(crop);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CropResponseDto> updateCrop(@PathVariable("id") Long id,
                                                      @Valid @RequestBody CropRequestDto requestDto,
                                                      Principal principal) {
        String userEmail = principal != null ? principal.getName() : null;
        CropResponseDto updated = cropService.updateCrop(id, requestDto, userEmail);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteCrop(@PathVariable("id") Long id,
                                                          Principal principal) {
        String userEmail = principal != null ? principal.getName() : null;
        cropService.deleteCrop(id, userEmail);
        return ResponseEntity.ok(Map.of("message", "Crop listing deleted successfully", "id", id.toString()));
    }
}
