package com.proyectoinvdebienes.backend.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ApproveDisposalRequest(
        @NotBlank(message = "Indica quién aprueba la baja") String approvedBy,
        @NotNull(message = "El valor final es obligatorio")
        @DecimalMin(value = "0.00", message = "El valor final no puede ser negativo")
        BigDecimal finalValue
) {
}
