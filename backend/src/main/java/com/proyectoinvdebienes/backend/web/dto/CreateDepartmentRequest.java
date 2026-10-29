package com.proyectoinvdebienes.backend.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateDepartmentRequest(
        @NotBlank(message = "El nombre del departamento es obligatorio")
        @Size(max = 80, message = "El nombre admite máximo 80 caracteres") @Pattern(regexp = ValidationPatterns.NO_HTML, message = "El nombre " + ValidationPatterns.NO_HTML_MESSAGE)
        String name,
        @NotBlank(message = "El centro de costo es obligatorio")
        @Pattern(regexp = "^[A-Z0-9][A-Z0-9-]{1,19}$",
                message = "El centro de costo solo admite mayúsculas, dígitos y guiones (ej. CC-TI)")
        String costCenterCode
) {
}
