package com.proyectoinvdebienes.backend.web.dto;

import java.math.BigDecimal;

public record EmployeeInvestmentSummaryDto(
        Long employeeId,
        String employeeName,
        Long assignedAssetsCount,
        BigDecimal totalAssignedAmount
) {
}
