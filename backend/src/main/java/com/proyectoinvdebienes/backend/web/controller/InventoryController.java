package com.proyectoinvdebienes.backend.web.controller;

import com.proyectoinvdebienes.backend.domain.model.Asset;
import com.proyectoinvdebienes.backend.service.InventoryService;
import com.proyectoinvdebienes.backend.web.dto.CreateAssetRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import com.proyectoinvdebienes.backend.service.AssetHistory;
import com.proyectoinvdebienes.backend.web.dto.UpdateAssetRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping("/assets")
    @ResponseStatus(HttpStatus.CREATED)
    public Asset createAsset(@Valid @RequestBody CreateAssetRequest request) {
        return inventoryService.registerAsset(request);
    }

    @PutMapping("/assets/{assetId}")
    public Asset updateAsset(@PathVariable Long assetId, @Valid @RequestBody UpdateAssetRequest request) {
        return inventoryService.updateAsset(assetId, request);
    }

    @GetMapping("/assets/{assetId}/history")
    public AssetHistory assetHistory(@PathVariable Long assetId) {
        return inventoryService.assetHistory(assetId);
    }

    @GetMapping("/assets")
    public List<Asset> listAssets() {
        return inventoryService.listAssets();
    }

    @GetMapping(value = "/assets/{assetId}/qr.png", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> assetQr(@PathVariable Long assetId) {
        return ResponseEntity.ok(inventoryService.generateAssetQrPng(assetId));
    }
}
