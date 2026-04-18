package com.proyectoinvdebienes.backend.service;

import com.proyectoinvdebienes.backend.domain.enums.AssetStatus;
import com.proyectoinvdebienes.backend.domain.enums.DisposalStatus;
import com.proyectoinvdebienes.backend.domain.model.Asset;
import com.proyectoinvdebienes.backend.domain.model.Disposal;
import com.proyectoinvdebienes.backend.repository.AssetRepository;
import com.proyectoinvdebienes.backend.repository.DisposalRepository;
import com.proyectoinvdebienes.backend.web.dto.ApproveDisposalRequest;
import com.proyectoinvdebienes.backend.web.dto.CreateDisposalRequest;
import com.proyectoinvdebienes.backend.web.dto.RejectDisposalRequest;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DisposalService {

    private final DisposalRepository disposalRepository;
    private final AssetRepository assetRepository;

    public DisposalService(DisposalRepository disposalRepository, AssetRepository assetRepository) {
        this.disposalRepository = disposalRepository;
        this.assetRepository = assetRepository;
    }

    @Transactional
    public Disposal requestDisposal(CreateDisposalRequest request) {
        Asset asset = assetRepository.findById(request.assetId())
                .orElseThrow(() -> new NotFoundException("Activo no encontrado"));

        Disposal disposal = new Disposal();
        disposal.setAsset(asset);
        disposal.setReason(request.reason());
        disposal.setDisposalType(request.disposalType() == null || request.disposalType().isBlank() ? "BAJA" : request.disposalType());
        disposal.setStatus(DisposalStatus.SOLICITADA);
        disposal.setRequestedBy(request.requestedBy());
        disposal.setRequestedAt(LocalDate.now());

        return disposalRepository.save(disposal);
    }

    @Transactional
    public Disposal approveDisposal(Long disposalId, ApproveDisposalRequest request) {
        Disposal disposal = disposalRepository.findById(disposalId)
                .orElseThrow(() -> new NotFoundException("Solicitud de baja no encontrada"));

        disposal.setStatus(DisposalStatus.APROBADA);
        disposal.setApprovedBy(request.approvedBy());
        disposal.setApprovedAt(LocalDate.now());
        disposal.setFinalValue(request.finalValue());

        Asset asset = disposal.getAsset();
        asset.setStatus(AssetStatus.DADO_DE_BAJA);
        assetRepository.save(asset);

        return disposalRepository.save(disposal);
    }

    @Transactional
    public Disposal rejectDisposal(Long disposalId, RejectDisposalRequest request) {
        Disposal disposal = disposalRepository.findById(disposalId)
                .orElseThrow(() -> new NotFoundException("Solicitud de baja no encontrada"));

        disposal.setStatus(DisposalStatus.RECHAZADA);
        disposal.setApprovedBy(request.approvedBy());
        disposal.setApprovedAt(LocalDate.now());
        disposal.setFinalValue(null);

        return disposalRepository.save(disposal);
    }

    public List<Disposal> findPending() {
        return disposalRepository.findByStatus(DisposalStatus.SOLICITADA);
    }
}
