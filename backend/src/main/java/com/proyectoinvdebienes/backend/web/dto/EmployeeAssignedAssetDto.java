package com.proyectoinvdebienes.backend.web.dto;

import java.math.BigDecimal;

public record EmployeeAssignedAssetDto(
        Long employeeId,
        String employeeName,
        String assetCode,
        String assetDescription,
        BigDecimal assetCost
) {
}
