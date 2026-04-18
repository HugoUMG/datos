package com.proyectoinvdebienes.backend.web.dto;

import com.proyectoinvdebienes.backend.domain.enums.RoleName;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateUserRequest(
        @NotBlank String username,
        @NotBlank String password,
        @NotNull RoleName role,
        Long employeeId
) {
}
