package com.proyectoinvdebienes.backend.web;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/** Pruebas de integración de las validaciones pedidas en la revisión (puntos de mejora del SGC). */
@SpringBootTest
@AutoConfigureMockMvc
class AcquisitionValidationTest {

    @Autowired
    private MockMvc mvc;

    private static final String ADMIN_USER = "admin";
    private static final String ADMIN_PASS = "admin-pruebas";

    @Test
    void rechazaSinCredenciales() throws Exception {
        mvc.perform(get("/api/acquisitions/invoices")).andExpect(status().isUnauthorized());
    }

    @Test
    void listaFacturas() throws Exception {
        mvc.perform(get("/api/acquisitions/invoices").with(httpBasic(ADMIN_USER, ADMIN_PASS)))
                .andExpect(status().isOk());
    }

    @Test
    void rechazaNumeroDeFacturaConCaracteresInvalidos() throws Exception {
        String body = """
                {"invoiceNumber":"fac 001$","invoiceDate":"2026-01-10","totalAmount":100,
                 "supplierId":1,"budgetLineId":1}
                """;
        mvc.perform(post("/api/acquisitions/invoices").with(httpBasic(ADMIN_USER, ADMIN_PASS))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("SERIE-NÚMERO")));
    }

    @Test
    void rechazaFechaDeFacturaDelAnio1420() throws Exception {
        String body = """
                {"invoiceNumber":"FAC-2026-0001","invoiceDate":"1420-01-10","totalAmount":100,
                 "supplierId":1,"budgetLineId":1}
                """;
        mvc.perform(post("/api/acquisitions/invoices").with(httpBasic(ADMIN_USER, ADMIN_PASS))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("2000")));
    }

    @Test
    void rechazaFechaDeFacturaFutura() throws Exception {
        String body = """
                {"invoiceNumber":"FAC-2026-0002","invoiceDate":"2999-01-10","totalAmount":100,
                 "supplierId":1,"budgetLineId":1}
                """;
        mvc.perform(post("/api/acquisitions/invoices").with(httpBasic(ADMIN_USER, ADMIN_PASS))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("futura")));
    }

    @Test
    void rechazaNitInvalido() throws Exception {
        String body = """
                {"name":"Proveedor X","taxId":"ABC","email":"x@correo.com"}
                """;
        mvc.perform(post("/api/acquisitions/suppliers").with(httpBasic(ADMIN_USER, ADMIN_PASS))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("NIT")));
    }
}
