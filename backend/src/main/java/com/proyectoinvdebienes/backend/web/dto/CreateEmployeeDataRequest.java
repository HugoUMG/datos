package com.proyectoinvdebienes.backend.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateEmployeeDataRequest(
        @NotBlank String fullName,
        @Email @NotBlank String email,
        @NotNull Long departmentId
) {
}
