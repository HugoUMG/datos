package com.proyectoinvdebienes.backend.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreatePurchaseInvoiceRequest(
        // Formato SERIE-NÚMERO (ej. FAC-2026-0001): empieza con letra; solo mayúsculas, dígitos y guiones.
        @NotBlank(message = "El número de factura es obligatorio")
        @Size(min = 3, max = 30, message = "El número de factura debe tener entre 3 y 30 caracteres")
        @Pattern(regexp = "^[A-Z][A-Z0-9]*(-[A-Z0-9]+)*$",
                message = "El número de factura debe tener el formato SERIE-NÚMERO (ej. FAC-2026-0001)")
        @Pattern(regexp = ".*[0-9].*", message = "El número de factura debe incluir al menos un dígito")
        String invoiceNumber,
        @NotNull(message = "La fecha de factura es obligatoria")
        @PastOrPresent(message = "La fecha de factura no puede ser futura")
        LocalDate invoiceDate,
        @NotNull(message = "El total es obligatorio")
        @DecimalMin(value = "0.01", message = "El total debe ser mayor a 0")
        @DecimalMax(value = "99999999.99", message = "El total excede el máximo permitido")
        @Digits(integer = 8, fraction = 2, message = "El total admite máximo 2 decimales")
        BigDecimal totalAmount,
        @NotNull(message = "Selecciona un proveedor") Long supplierId,
        @NotNull(message = "Selecciona una partida presupuestaria") Long budgetLineId,
        @Size(max = 500, message = "Las notas admiten máximo 500 caracteres") String notes
) {
}
