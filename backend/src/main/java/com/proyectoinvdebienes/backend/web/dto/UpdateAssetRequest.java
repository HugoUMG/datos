package com.proyectoinvdebienes.backend.web.dto;

import com.proyectoinvdebienes.backend.domain.enums.TagType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Datos editables de un activo; la factura, fecha y costo de adquisición no cambian. */
public record UpdateAssetRequest(
        @NotBlank(message = "El nombre del bien es obligatorio")
        @Size(max = 120, message = "El nombre admite máximo 120 caracteres") @Pattern(regexp = ValidationPatterns.NO_HTML, message = "El nombre " + ValidationPatterns.NO_HTML_MESSAGE)
        String name,
        @Size(max = 500, message = "La descripción admite máximo 500 caracteres") @Pattern(regexp = ValidationPatterns.NO_HTML, message = "La descripción " + ValidationPatterns.NO_HTML_MESSAGE)
        String description,
        @NotBlank(message = "El número de serie es obligatorio")
        @Size(max = 60, message = "El número de serie admite máximo 60 caracteres") @Pattern(regexp = ValidationPatterns.SERIAL, message = "El número de serie " + ValidationPatterns.SERIAL_MESSAGE)
        String serialNumber,
        @NotNull(message = "Selecciona el tipo de etiqueta") TagType tagType,
        @NotBlank(message = "El valor de etiqueta es obligatorio")
        @Size(max = 60, message = "La etiqueta admite máximo 60 caracteres") @Pattern(regexp = ValidationPatterns.SERIAL, message = "La etiqueta " + ValidationPatterns.SERIAL_MESSAGE)
        String tagValue,
        @Size(max = 120, message = "La ubicación admite máximo 120 caracteres") @Pattern(regexp = ValidationPatterns.NO_HTML, message = "La ubicación " + ValidationPatterns.NO_HTML_MESSAGE)
        String location
) {
}
