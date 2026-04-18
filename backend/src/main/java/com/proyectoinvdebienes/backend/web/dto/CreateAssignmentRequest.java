package com.proyectoinvdebienes.backend.web.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CreateAssignmentRequest(
        @NotNull Long assetId,
        @NotNull Long employeeId,
        @NotNull LocalDate assignedAt,
        LocalDate expectedReturnAt
) {
}
