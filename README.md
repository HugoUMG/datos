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

### Segunda ronda de mejoras

| Mejora | Qué hace |
|---|---|
| Editar y desactivar | Proveedores, partidas, empleados, departamentos y activos se pueden corregir. Los proveedores se desactivan (dejan de salir en facturas nuevas) sin perder su historial. Un activo dado de baja ya no se edita. |
| Historial del activo | `/inventario/:id` muestra factura, proveedor, datos del activo y una línea de tiempo: compra, alta, asignaciones, devoluciones y bajas. |
| Contraseñas | Cada usuario cambia la suya desde el menú (ícono de llave, pide la actual). El administrador restablece la de otros en Usuarios. Atiende R01 ("forzar cambio de contraseña"). |
| Orden, paginación y CSV | Todas las tablas ordenan al hacer clic en el encabezado, paginan de 10 en 10 y exportan a CSV (respetando búsqueda, filtro y orden). |
| Respaldo | Botón "Descargar respaldo" en Inicio (administrador): JSON con toda la información, sin contraseñas (hallazgo de respaldo de BD). |
| Inicio guiado | Con el sistema vacío, el Inicio muestra "Primeros pasos" en el orden correcto (departamento → empleado → proveedor/partida → factura → activo → asignación) y avisos de devoluciones vencidas, bajas por aprobar y asignaciones sin confirmar. |
| Servidor dormido | El login despierta al backend apenas se abre e indica "Conectando…" / "Servidor listo" (riesgo R03). Ver abajo cómo mantenerlo despierto. |

### Restricción de campos

Cada campo filtra lo que se teclea o pega (directiva `appRestrict`), se valida en pantalla y vuelve a validarse en el backend:

| Campo | Qué acepta |
|---|---|
| Número de factura | `SERIE-NÚMERO`: mayúsculas, dígitos y guiones; empieza con letra y lleva al menos un dígito; se pasa a mayúsculas solo |
| Montos (total, valor, monto asignado, valor final) | Solo números > 0 con máximo 2 decimales; no se puede teclear `e`, `+` ni `-` |
| Fechas | Desde 01/01/2000; factura y adquisición no futuras; asignación y devolución máximo 10 años adelante; adquisición ≥ fecha de factura; devolución ≥ asignación |
| NIT | Dígitos y verificador `0-9` o `K` (ej. `1234567-8`), sin duplicados |
| Teléfono | Dígitos, espacio, guion y `+`; mínimo 8 dígitos |
| Código de partida / centro de costo | Mayúsculas, dígitos, guion (y punto en partidas); únicos |
| Serie y etiqueta del activo | Letras, dígitos, guion, punto, guion bajo y diagonal; sin espacios; únicos |
| Nombre de empleado | Solo letras (con tildes y ñ), espacios, punto, apóstrofo y guion |
| Usuario | 3 a 30 caracteres: letras sin tildes, dígitos, punto, guion y guion bajo; sin espacios |
| Contraseña | Mínimo 8 caracteres |
| Textos libres (nombres, motivo, ubicación, notas) | Sin `<` ni `>`, con límite de longitud |

También se atendieron hallazgos del diagnóstico del SGC:

- **R01 / credenciales expuestas**: se quitaron `admin/admin123` de README, docs y código; las contraseñas iniciales vienen de variables de entorno (`SEED_*_PASSWORD`). La sesión del frontend ya no guarda la contraseña en `localStorage`.
- **Pruebas automatizadas**: 16 pruebas de backend (fechas, validaciones, edición, historial, contraseñas y respaldo, con H2) y una prueba de punta a punta en navegador del flujo completo.
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
(el login lo avisa). La base PostgreSQL gratuita de Render vence a los 30 días: descargar un respaldo antes.

**Mantenerlo despierto (opcional):** crear un monitor gratuito en [UptimeRobot](https://uptimerobot.com)
de tipo HTTP(s) a `https://activos-backend-y6j4.onrender.com/` cada 5 minutos.

**Variables de entorno:** al editarlas en el dashboard de Render, agregar o cambiar una por una. Reemplazarlas
todas (por ejemplo con "Add from .env") borra las `DB_*` que define el Blueprint y el backend deja de conectarse.

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
