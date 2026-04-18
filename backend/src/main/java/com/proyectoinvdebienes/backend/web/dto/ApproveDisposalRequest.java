package com.proyectoinvdebienes.backend.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ApproveDisposalRequest(
        @NotBlank String approvedBy,
        @NotNull BigDecimal finalValue
) {
}
