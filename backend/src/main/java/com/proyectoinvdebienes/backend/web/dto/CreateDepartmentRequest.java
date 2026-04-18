package com.proyectoinvdebienes.backend.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateDepartmentRequest(
        @NotBlank String name,
        @NotBlank String costCenterCode
) {
}
