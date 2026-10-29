package com.proyectoinvdebienes.backend.web.dto;

import com.proyectoinvdebienes.backend.domain.enums.RoleName;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank(message = "El usuario es obligatorio")
        @Pattern(regexp = "^[a-zA-Z0-9._-]{3,30}$",
                message = "El usuario debe tener de 3 a 30 caracteres sin espacios")
        String username,
        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, max = 72, message = "La contraseña debe tener al menos 8 caracteres")
        String password,
        @NotNull(message = "Selecciona un rol") RoleName role,
        Long employeeId
) {
}
