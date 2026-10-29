package com.proyectoinvdebienes.backend.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateBudgetLineRequest(
        @NotBlank(message = "El código es obligatorio")
        @Pattern(regexp = "^[A-Z0-9][A-Z0-9.-]{1,29}$",
                message = "El código solo admite mayúsculas, dígitos, puntos y guiones (ej. PP-2026-01)")
        String code,
        @NotBlank(message = "La descripción es obligatoria")
        @Size(max = 200, message = "La descripción admite máximo 200 caracteres") @Pattern(regexp = ValidationPatterns.NO_HTML, message = "La descripción " + ValidationPatterns.NO_HTML_MESSAGE)
        String description,
        @NotNull(message = "El monto asignado es obligatorio")
        @DecimalMin(value = "0.01", message = "El monto asignado debe ser mayor a 0")
        @DecimalMax(value = "999999999.99", message = "El monto asignado excede el máximo permitido")
        @Digits(integer = 9, fraction = 2, message = "El monto admite máximo 2 decimales")
        BigDecimal allocatedAmount
) {
}
