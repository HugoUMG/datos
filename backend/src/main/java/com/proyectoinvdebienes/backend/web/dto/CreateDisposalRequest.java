package com.proyectoinvdebienes.backend.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateDisposalRequest(
        @NotNull(message = "Selecciona un activo") Long assetId,
        @NotBlank(message = "El motivo es obligatorio")
        @Size(max = 300, message = "El motivo admite máximo 300 caracteres") @Pattern(regexp = ValidationPatterns.NO_HTML, message = "El motivo " + ValidationPatterns.NO_HTML_MESSAGE)
        String reason,
        String disposalType,
        @NotBlank(message = "Indica quién solicita la baja")
        @Size(max = 80, message = "El solicitante admite máximo 80 caracteres") @Pattern(regexp = ValidationPatterns.NO_HTML, message = "El solicitante " + ValidationPatterns.NO_HTML_MESSAGE)
        String requestedBy
) {
}
