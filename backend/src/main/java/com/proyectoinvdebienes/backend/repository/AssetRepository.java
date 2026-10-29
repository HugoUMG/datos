package com.proyectoinvdebienes.backend.repository;

import com.proyectoinvdebienes.backend.domain.model.Asset;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetRepository extends JpaRepository<Asset, Long> {
    Optional<Asset> findByAssetCode(String assetCode);
    boolean existsByAssetCode(String assetCode);
    boolean existsBySerialNumber(String serialNumber);
    boolean existsByTagValue(String tagValue);
    boolean existsBySerialNumberAndIdNot(String serialNumber, Long id);
    boolean existsByTagValueAndIdNot(String tagValue, Long id);
    long countByCurrentCustodianId(Long employeeId);
}
