package com.proyectoinvdebienes.backend.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreatePurchaseInvoiceRequest(
        @NotBlank String invoiceNumber,
        @NotNull LocalDate invoiceDate,
        @NotNull @DecimalMin(value = "0.01") BigDecimal totalAmount,
        @NotNull Long supplierId,
        @NotNull Long budgetLineId,
        String notes
) {
}
