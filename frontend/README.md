# Frontend Angular — Gestión de Activos

SPA en Angular 20 (componentes standalone) con navegación lateral por rol.

## Pantallas

| Ruta | Rol(es) | Qué hace |
|---|---|---|
| `/login` | todos | Ingreso con usuario y contraseña |
| `/menu` | todos | Inicio con indicadores y accesos según el rol |
| `/adquisiciones` | Administrador, Compras | Registro y listado de facturas de compra |
| `/catalogos` | Administrador, Compras, Inventario | Proveedores y partidas presupuestarias |
| `/inventario` | Administrador, Inventario | Alta de activos, búsqueda, filtro por estado y QR |
| `/asignaciones` | Administrador, Inventario | Asignar activos y registrar devoluciones |
| `/bajas` | Administrador, Inventario | Solicitar, aprobar y rechazar bajas |
| `/reportes` | Administrador, Finanzas, Inventario | Reporte general, por empleado y exportación |
| `/empleado` | Empleado, Administrador | Confirmar recepción, ver mis bienes y pedir bajas |
| `/admin-empleados` | Administrador | Registro de empleados |
| `/usuarios` | Administrador | Cuentas de acceso y roles |

## Experiencia de usuario

- Todas las tablas tienen barra de búsqueda (sin importar acentos ni mayúsculas) y, donde aplica, filtro por estado.
- Los formularios usan listas desplegables en lugar de pedir IDs a mano.
- Validación en vivo con mensajes en español debajo de cada campo:
  - **Número de factura**: formato `SERIE-NÚMERO` (ej. `FAC-2026-0001`); solo mayúsculas, dígitos y guiones, con al menos un dígito.
  - **Fechas**: nada antes del 01/01/2000; las fechas de factura y adquisición no pueden ser futuras; las planificadas, máximo 10 años adelante. La adquisición no puede ser anterior a su factura y la devolución no puede ser anterior a la asignación.
  - **NIT**, teléfono, montos (máx. 2 decimales), usuario y contraseña (mín. 8 caracteres).
- Notificaciones (toasts) de éxito/error y diálogo de confirmación para acciones irreversibles.
- Diseño adaptable a móvil (menú lateral desplegable).
- Montos en quetzales y fechas `dd/MM/yyyy` (locale `es-GT`).

Las mismas reglas se validan también en el backend, así que no se pueden saltar desde Postman.

## Seguridad

- Autenticación **HTTP Basic** contra el backend.
- La sesión se guarda en `sessionStorage` (se borra al cerrar el navegador) y si el backend responde 401 se vuelve al login.

## Desarrollo local

```bash
cd frontend
npm install
npm start
```

`npm start` usa `proxy.conf.json` para enrutar `/api` a `http://localhost:8080`.

## Despliegue

Ver `render.yaml` en la raíz: el sitio estático reenvía `/api/*` al backend, por lo que la meta `app-api-base-url`
de `src/index.html` queda vacía. Si se quisiera llamar al backend directamente, se pone su URL ahí y se agrega el
dominio del frontend a `CORS_ALLOWED_ORIGINS` del backend.
