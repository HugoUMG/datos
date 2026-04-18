package com.proyectoinvdebienes.backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.proyectoinvdebienes.backend.domain.enums.AssetStatus;
import com.proyectoinvdebienes.backend.domain.model.Asset;
import com.proyectoinvdebienes.backend.domain.model.PurchaseInvoice;
import com.proyectoinvdebienes.backend.repository.AssetRepository;
import com.proyectoinvdebienes.backend.repository.PurchaseInvoiceRepository;
import com.proyectoinvdebienes.backend.web.dto.CreateAssetRequest;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class InventoryService {

    private final AssetRepository assetRepository;
    private final PurchaseInvoiceRepository purchaseInvoiceRepository;

    public InventoryService(AssetRepository assetRepository, PurchaseInvoiceRepository purchaseInvoiceRepository) {
        this.assetRepository = assetRepository;
        this.purchaseInvoiceRepository = purchaseInvoiceRepository;
    }

    public Asset registerAsset(CreateAssetRequest request) {
        PurchaseInvoice invoice = purchaseInvoiceRepository.findById(request.purchaseInvoiceId())
                .orElseThrow(() -> new NotFoundException("Factura de adquisición no encontrada"));

        if (request.assetCode() != null && !request.assetCode().isBlank() && assetRepository.existsByAssetCode(request.assetCode())) {
            throw new BusinessException("El código de activo ya existe. Captura un valor único.");
        }
        if (assetRepository.existsBySerialNumber(request.serialNumber())) {
            throw new BusinessException("El número de serie ya existe. Captura un valor único.");
        }
        if (assetRepository.existsByTagValue(request.tagValue())) {
            throw new BusinessException("La etiqueta del activo ya existe. Captura un valor único.");
        }

        Asset asset = new Asset();
        asset.setAssetCode(request.assetCode() == null || request.assetCode().isBlank() ? generateAssetCode() : request.assetCode());
        asset.setName(request.name());
        asset.setDescription(request.description());
        asset.setSerialNumber(request.serialNumber());
        asset.setAcquisitionDate(request.acquisitionDate());
        asset.setAcquisitionCost(request.acquisitionCost());
        asset.setStatus(AssetStatus.EN_ALMACEN);
        asset.setTagType(request.tagType());
        asset.setTagValue(request.tagValue());
        asset.setLocation(request.location() == null || request.location().isBlank() ? "Almacén central" : request.location());
        asset.setPurchaseInvoice(invoice);

        return assetRepository.save(asset);
    }

    public List<Asset> listAssets() {
        return assetRepository.findAll();
    }

    public Asset findAssetById(Long assetId) {
        return assetRepository.findById(assetId)
                .orElseThrow(() -> new NotFoundException("Activo no encontrado"));
    }

    public byte[] buildAssetQrPng(Asset asset) {
        String qrPayload = "Código del bien: " + asset.getAssetCode() + "\n"
                + "Nombre del bien: " + asset.getName() + "\n"
                + "Ubicación: " + asset.getLocation() + "\n"
                + "Estado: " + asset.getStatus();

        try {
            BitMatrix matrix = new MultiFormatWriter().encode(qrPayload, BarcodeFormat.QR_CODE, 320, 320);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            return out.toByteArray();
        } catch (WriterException | IOException ex) {
            throw new BusinessException("No fue posible generar el código QR del activo");
        }
    }

    public byte[] generateAssetQrPng(Long assetId) {
        return buildAssetQrPng(findAssetById(assetId));
    }

    private String generateAssetCode() {
        return "ACT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
