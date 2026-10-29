package com.proyectoinvdebienes.backend.web;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasKey;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/** Edición de catálogos, historial de activos, contraseñas y respaldo. */
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class ManagementFeaturesTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    private static final String ADMIN = "admin";
    private static final String ADMIN_PASS = "admin-pruebas";

    private MockHttpServletRequestBuilder asAdmin(MockHttpServletRequestBuilder req) {
        return req.with(httpBasic(ADMIN, ADMIN_PASS)).contentType(MediaType.APPLICATION_JSON);
    }

    private long create(String url, String body) throws Exception {
        String response = mvc.perform(asAdmin(post(url)).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode node = json.readTree(response);
        return node.get("id").asLong();
    }

    @Test
    void editaYDesactivaProveedor() throws Exception {
        long id = create("/api/acquisitions/suppliers", """
                {"name":"Proveedor Uno","taxId":"1234567-8","email":"uno@correo.com"}""");

        mvc.perform(asAdmin(put("/api/acquisitions/suppliers/" + id)).content("""
                        {"name":"Proveedor Renombrado","taxId":"1234567-8","email":"uno@correo.com"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Proveedor Renombrado"));

        mvc.perform(asAdmin(patch("/api/acquisitions/suppliers/" + id + "/active")).content("{\"active\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
    }

    @Test
    void historialDeActivoIncluyeFacturaYAsignaciones() throws Exception {
        long dep = create("/api/data/departments", "{\"name\":\"TI\",\"costCenterCode\":\"CC-TI\"}");
        long emp = create("/api/data/employees",
                "{\"fullName\":\"Ana Perez\",\"email\":\"ana@correo.com\",\"departmentId\":" + dep + "}");
        long sup = create("/api/acquisitions/suppliers", "{\"name\":\"P\",\"taxId\":\"7654321-0\",\"email\":\"p@c.com\"}");
        long bl = create("/api/acquisitions/budget-lines", "{\"code\":\"PP-1\",\"description\":\"Equipo\",\"allocatedAmount\":100}");
        String today = LocalDate.now().toString();
        long inv = create("/api/acquisitions/invoices", "{\"invoiceNumber\":\"FAC-1\",\"invoiceDate\":\"" + today
                + "\",\"totalAmount\":50,\"supplierId\":" + sup + ",\"budgetLineId\":" + bl + "}");
        long asset = create("/api/inventory/assets", "{\"name\":\"Laptop\",\"serialNumber\":\"SN-1\",\"acquisitionDate\":\""
                + today + "\",\"acquisitionCost\":50,\"tagType\":\"QR\",\"tagValue\":\"T-1\",\"purchaseInvoiceId\":" + inv + "}");
        create("/api/assignments", "{\"assetId\":" + asset + ",\"employeeId\":" + emp + ",\"assignedAt\":\"" + today + "\"}");

        mvc.perform(asAdmin(put("/api/inventory/assets/" + asset)).content(
                        "{\"name\":\"Laptop Dell\",\"serialNumber\":\"SN-1\",\"tagType\":\"QR\",\"tagValue\":\"T-1\",\"location\":\"Bodega 2\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Laptop Dell"));

        mvc.perform(asAdmin(get("/api/inventory/assets/" + asset + "/history")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.invoice.invoiceNumber").value("FAC-1"))
                .andExpect(jsonPath("$.assignments[0].employee.fullName").value("Ana Perez"))
                .andExpect(jsonPath("$.disposals").isArray());
    }

    @Test
    void cambioDeContrasenaExigeLaActual() throws Exception {
        mvc.perform(asAdmin(post("/api/auth/change-password"))
                        .content("{\"currentPassword\":\"incorrecta\",\"newPassword\":\"NuevaClave2026\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("actual")));

        mvc.perform(asAdmin(post("/api/auth/change-password"))
                        .content("{\"currentPassword\":\"" + ADMIN_PASS + "\",\"newPassword\":\"NuevaClave2026\"}"))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/auth/me").with(httpBasic(ADMIN, "NuevaClave2026"))).andExpect(status().isOk());
        mvc.perform(get("/api/auth/me").with(httpBasic(ADMIN, ADMIN_PASS))).andExpect(status().isUnauthorized());
    }

    @Test
    void adminReseteaContrasenaDeOtroUsuario() throws Exception {
        long id = create("/api/admin/users", "{\"username\":\"compras2\",\"password\":\"Inicial2026\",\"role\":\"COMPRAS\"}");
        mvc.perform(asAdmin(post("/api/admin/users/" + id + "/reset-password")).content("{\"newPassword\":\"Reseteada2026\"}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/auth/me").with(httpBasic("compras2", "Reseteada2026"))).andExpect(status().isOk());
    }

    @Test
    void respaldoDescargaTodoSinContrasenas() throws Exception {
        mvc.perform(asAdmin(get("/api/admin/backup")))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("respaldo-activos-")))
                .andExpect(jsonPath("$", hasKey("assets")))
                .andExpect(jsonPath("$.users[0]").exists())
                .andExpect(jsonPath("$.users[0].password").doesNotExist());
    }
}
