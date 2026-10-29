package com.proyectoinvdebienes.backend.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class DateRulesTest {

    @Test
    void rechazaAniosAbsurdos() {
        assertThatThrownBy(() -> DateRules.requireHistoric(LocalDate.of(1420, 5, 1), "La fecha"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("anterior al año 2000");
    }

    @Test
    void rechazaFechasHistoricasFuturas() {
        assertThatThrownBy(() -> DateRules.requireHistoric(LocalDate.now().plusDays(1), "La fecha"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("futura");
    }

    @Test
    void aceptaFechasValidas() {
        assertThatCode(() -> DateRules.requireHistoric(LocalDate.now(), "La fecha")).doesNotThrowAnyException();
        assertThatCode(() -> DateRules.requireReasonable(LocalDate.now().plusYears(1), "La fecha"))
                .doesNotThrowAnyException();
        assertThatCode(() -> DateRules.requireHistoric(null, "La fecha")).doesNotThrowAnyException();
    }

    @Test
    void rechazaFechasPlanificadasMuyLejanas() {
        assertThatThrownBy(() -> DateRules.requireReasonable(LocalDate.of(9999, 1, 1), "La fecha"))
                .isInstanceOf(BusinessException.class);
    }
}
