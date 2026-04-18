package com.proyectoinvdebienes.backend.web.dto;

import jakarta.validation.constraints.AssertTrue;

public record ConfirmAssignmentRequest(
        @AssertTrue(message = "Debes aceptar términos y condiciones para confirmar la asignación")
        Boolean acceptedTerms
) {
}
