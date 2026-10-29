package com.proyectoinvdebienes.backend.web.dto;

import jakarta.validation.constraints.NotNull;

public record SetActiveRequest(@NotNull(message = "Indica si el registro queda activo") Boolean active) {
}
