package com.proyectoinvdebienes.backend.web.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectDisposalRequest(
        @NotBlank String approvedBy
) {
}
