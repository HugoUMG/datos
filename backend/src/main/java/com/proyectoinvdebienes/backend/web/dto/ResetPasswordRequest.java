package com.proyectoinvdebienes.backend.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "La nueva contraseña es obligatoria")
        @Size(min = 8, max = 72, message = "La nueva contraseña debe tener al menos 8 caracteres")
        String newPassword
) {
}
