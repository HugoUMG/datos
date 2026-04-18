package com.proyectoinvdebienes.backend.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateBudgetLineRequest(
        @NotBlank String code,
        @NotBlank String description,
        @NotNull @DecimalMin("0.01") BigDecimal allocatedAmount
) {
}
