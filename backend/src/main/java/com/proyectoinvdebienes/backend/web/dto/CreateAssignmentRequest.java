package com.proyectoinvdebienes.backend.web.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CreateAssignmentRequest(
        @NotNull(message = "Selecciona un activo") Long assetId,
        @NotNull(message = "Selecciona un empleado") Long employeeId,
        @NotNull(message = "La fecha de asignación es obligatoria") LocalDate assignedAt,
        LocalDate expectedReturnAt
) {
}
