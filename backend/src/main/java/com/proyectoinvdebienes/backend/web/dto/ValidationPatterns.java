package com.proyectoinvdebienes.backend.web.dto;

/** Patrones compartidos por los DTO; coinciden con la directiva appRestrict del frontend. */
public final class ValidationPatterns {

    /** Serie y etiqueta de activos: letras, dígitos, guion, punto, guion bajo y diagonal. */
    public static final String SERIAL = "^[A-Za-z0-9._/-]+$";
    public static final String SERIAL_MESSAGE = "solo admite letras, dígitos, guion, punto, guion bajo y diagonal";

    /** Texto libre sin etiquetas HTML. */
    public static final String NO_HTML = "^[^<>]*$";
    public static final String NO_HTML_MESSAGE = "no puede contener los caracteres < ni >";

    private ValidationPatterns() {
    }
}
