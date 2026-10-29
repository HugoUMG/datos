# Sistema de Gestión de Activos — Innova Sistemas

Backend Spring Boot 3 (Java 21) + frontend Angular 20 para el ciclo completo de activos:
adquisiciones, inventario, asignaciones, bajas y reportes, con acceso por rol
(Administrador, Compras, Inventario, Finanzas, Empleado).

- `backend/` — API REST. Ver [backend/README.md](backend/README.md).
- `frontend/` — SPA. Ver [frontend/README.md](frontend/README.md).
- `render.yaml` — despliegue completo (base de datos, backend y frontend) en Render.
- `.github/workflows/ci.yml` — compila y prueba backend y frontend en cada push / pull request.

## Mejoras de la revisión (puntos de mejora del SGC, Fase 1)

| Punto de mejora | Qué se hizo |
|---|---|
| Validar letras y números en las facturas | El número de factura sigue el formato `SERIE-NÚMERO` (ej. `FAC-2026-0001`): mayúsculas, dígitos y guiones, con al menos un dígito. Se convierte a mayúsculas al escribir. El total solo acepta montos > 0 con 2 decimales. Validado en frontend **y** backend. |
| Barra de búsqueda o filtro en cada ventana | Todas las tablas tienen buscador (ignora acentos y mayúsculas) con contador "N de M"; inventario, asignaciones y reportes también filtran por estado. |
| Fechas absurdas (ej. año 1420) | Ninguna fecha antes del 01/01/2000; factura y adquisición no pueden ser futuras; fechas planificadas máximo 10 años adelante; la adquisición no puede ser anterior a su factura y la devolución no puede ser anterior a la asignación. Validado en frontend **y** backend (`DateRules`). |
| Mejorar todas las pantallas | Rediseño completo: menú lateral por rol, inicio con indicadores, listas desplegables en lugar de escribir IDs, mensajes de error por campo, notificaciones, confirmación antes de acciones irreversibles, estados con colores, montos en Q y fechas dd/MM/yyyy, diseño para móvil. Pantalla nueva de Usuarios y listado de facturas. |

También se atendieron hallazgos del diagnóstico del SGC:

- **R01 / credenciales expuestas**: se quitaron `admin/admin123` de README, docs y código; las contraseñas iniciales vienen de variables de entorno (`SEED_*_PASSWORD`). La sesión del frontend ya no guarda la contraseña en `localStorage`.
- **Pruebas automatizadas**: 11 pruebas (unitarias de fechas e integración de validaciones con H2) en lugar de solo la prueba de contexto.
- **CI/CD**: pipeline de GitHub Actions + Blueprint de Render.
- **Configuración por ambiente**: CORS y `ddl-auto` configurables por variable de entorno; perfil `postgres` para Render.
- Errores de validación del backend ahora explican qué campo está mal en lugar de "Datos inválidos".

## Despliegue en Render

1. En Render: **New → Blueprint** y elegir este repositorio (rama con `render.yaml`).
2. Render pedirá las contraseñas iniciales `SEED_ADMIN_PASSWORD`, `SEED_COMPRAS_PASSWORD`,
   `SEED_INVENTARIO_PASSWORD` y `SEED_FINANZAS_PASSWORD`.
3. Se crean `activos-db` (PostgreSQL), `activos-backend` y `activos-frontend`.
   Si Render le pone otro nombre al backend, actualizar la URL del rewrite `/api/*` en `render.yaml`.

En el plan gratuito el backend se duerme tras 15 minutos sin uso; la primera petición puede tardar ~1 minuto
(el login lo avisa). La base PostgreSQL gratuita de Render vence a los 30 días.

## Ejecución local

```bash
# Backend (MySQL local por defecto; ver backend/README.md)
cd backend
SEED_ADMIN_PASSWORD=<elige-una> mvn spring-boot:run

# Frontend (proxy de /api a localhost:8080)
cd frontend
npm install
npm start
```
