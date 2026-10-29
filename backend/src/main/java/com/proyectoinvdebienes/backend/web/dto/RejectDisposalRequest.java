package com.proyectoinvdebienes.backend.web.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectDisposalRequest(
        @NotBlank(message = "Indica quién rechaza la baja") String approvedBy
) {
}
