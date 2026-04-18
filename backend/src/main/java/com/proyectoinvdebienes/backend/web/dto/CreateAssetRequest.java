package com.proyectoinvdebienes.backend.web.dto;

import com.proyectoinvdebienes.backend.domain.enums.TagType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateAssetRequest(
        String assetCode,
        @NotBlank String name,
        String description,
        @NotBlank String serialNumber,
        @NotNull LocalDate acquisitionDate,
        @NotNull @DecimalMin(value = "0.01") BigDecimal acquisitionCost,
        @NotNull TagType tagType,
        @NotBlank String tagValue,
        String location,
        @NotNull Long purchaseInvoiceId
) {
}
