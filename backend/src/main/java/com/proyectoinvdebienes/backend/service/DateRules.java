package com.proyectoinvdebienes.backend.service;

import java.time.LocalDate;

/**
 * Rangos de fecha válidos para el negocio. LocalDate acepta sin problema años
 * absurdos (ej. 1420), así que se acotan aquí además de en el frontend.
 */
public final class DateRules {

    public static final LocalDate MIN_DATE = LocalDate.of(2000, 1, 1);
    public static final int MAX_YEARS_AHEAD = 10;

    private DateRules() {
    }

    /** Fechas de hechos ya ocurridos: entre MIN_DATE y hoy. */
    public static void requireHistoric(LocalDate date, String field) {
        if (date == null) {
            return;
        }
        if (date.isBefore(MIN_DATE)) {
            throw new BusinessException(field + " no puede ser anterior al año " + MIN_DATE.getYear() + ".");
        }
        if (date.isAfter(LocalDate.now())) {
            throw new BusinessException(field + " no puede ser futura.");
        }
    }

    /** Fechas planificadas: entre MIN_DATE y MAX_YEARS_AHEAD años desde hoy. */
    public static void requireReasonable(LocalDate date, String field) {
        if (date == null) {
            return;
        }
        if (date.isBefore(MIN_DATE)) {
            throw new BusinessException(field + " no puede ser anterior al año " + MIN_DATE.getYear() + ".");
        }
        if (date.isAfter(LocalDate.now().plusYears(MAX_YEARS_AHEAD))) {
            throw new BusinessException(field + " no puede superar " + MAX_YEARS_AHEAD + " años a futuro.");
        }
    }
}
