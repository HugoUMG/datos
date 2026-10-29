package com.proyectoinvdebienes.backend.web.dto;

import com.proyectoinvdebienes.backend.domain.enums.TagType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateAssetRequest(
        @Size(max = 40, message = "El código admite máximo 40 caracteres") String assetCode,
        @NotBlank(message = "El nombre del bien es obligatorio")
        @Size(max = 120, message = "El nombre admite máximo 120 caracteres") String name,
        @Size(max = 500, message = "La descripción admite máximo 500 caracteres") String description,
        @NotBlank(message = "El número de serie es obligatorio")
        @Size(max = 60, message = "El número de serie admite máximo 60 caracteres") String serialNumber,
        @NotNull(message = "La fecha de adquisición es obligatoria")
        @PastOrPresent(message = "La fecha de adquisición no puede ser futura")
        LocalDate acquisitionDate,
        @NotNull(message = "El valor unitario es obligatorio")
        @DecimalMin(value = "0.01", message = "El valor unitario debe ser mayor a 0")
        @DecimalMax(value = "99999999.99", message = "El valor unitario excede el máximo permitido")
        @Digits(integer = 8, fraction = 2, message = "El valor unitario admite máximo 2 decimales")
        BigDecimal acquisitionCost,
        @NotNull(message = "Selecciona el tipo de etiqueta") TagType tagType,
        @NotBlank(message = "El valor de etiqueta es obligatorio")
        @Size(max = 60, message = "La etiqueta admite máximo 60 caracteres") String tagValue,
        @Size(max = 120, message = "La ubicación admite máximo 120 caracteres") String location,
        @NotNull(message = "Selecciona la factura de adquisición") Long purchaseInvoiceId
) {
}
