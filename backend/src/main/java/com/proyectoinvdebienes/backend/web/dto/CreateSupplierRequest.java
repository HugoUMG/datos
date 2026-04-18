package com.proyectoinvdebienes.backend.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateSupplierRequest(
        @NotBlank String name,
        @NotBlank String taxId,
        @Email @NotBlank String email,
        String phone
) {
}
