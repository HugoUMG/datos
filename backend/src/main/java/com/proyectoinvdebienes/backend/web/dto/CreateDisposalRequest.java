package com.proyectoinvdebienes.backend.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateDisposalRequest(
        @NotNull Long assetId,
        @NotBlank String reason,
        String disposalType,
        @NotBlank String requestedBy
) {
}
