package com.proyectoinvdebienes.backend.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateSupplierRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 120, message = "El nombre admite máximo 120 caracteres") @Pattern(regexp = ValidationPatterns.NO_HTML, message = "El nombre " + ValidationPatterns.NO_HTML_MESSAGE)
        String name,
        // NIT guatemalteco: dígitos más dígito verificador (0-9 o K), ej. 1234567-8 o 123456K
        @NotBlank(message = "El NIT es obligatorio")
        @Pattern(regexp = "^[0-9]{4,12}-?[0-9Kk]$", message = "El NIT no es válido (ej. 1234567-8)")
        String taxId,
        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email no es válido") String email,
        @Pattern(regexp = "^$|^\\+?[0-9 -]{8,15}$", message = "El teléfono debe tener 8 dígitos (ej. 5555-1234)")
        String phone
) {
}
