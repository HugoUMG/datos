package com.proyectoinvdebienes.backend.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateEmployeeDataRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 120, message = "El nombre admite máximo 120 caracteres")
        @Pattern(regexp = "^[\\p{L} .'-]+$", message = "El nombre solo puede contener letras y espacios")
        String fullName,
        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email no es válido") String email,
        @NotNull(message = "Selecciona un departamento") Long departmentId
) {
}
