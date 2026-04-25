# Frontend Angular - Gestión de Activos y Bienes

## Flujo de interfaces

1. **Login** (`/login`) – primera pantalla obligatoria.
2. **Menú general** (`/menu`) – hub principal para abrir módulos en pestañas nuevas.
3. **Módulos** (cada uno en su propia ruta y pestaña):
   - `/adquisiciones`
   - `/inventario`
   - `/asignaciones`
   - `/bajas`
   - `/reportes`

Cada módulo incluye botón **"Volver al menú"**.

## Credenciales admin (explícitas)

- **Usuario:** `admin`
- **Contraseña:** `admin123`

> Con `admin` se habilita en menú el formulario para crear nuevos usuarios en backend (`POST /api/admin/users`).

## Seguridad

- El frontend usa autenticación **HTTP Basic**.
- El backend crea usuarios por defecto al iniciar (`admin`, `compras`, `inventario`, `finanzas`).

## Desarrollo local

```bash
cd frontend
npm install
npm start
```

`npm start` usa `proxy.conf.json` para enrutar `/api` a `http://localhost:8080`.

## Despliegue en Render

Este frontend está preparado para desplegarse como **Static Site** en Render:

- Se genera con `npm run build`.
- El directorio publicado es `dist/frontend/browser`.
- `public/_redirects` incluye:
  - Proxy de `/api/*` hacia el backend desplegado.
  - Fallback SPA `/* -> /index.html` para evitar errores **Not Found** al recargar rutas como `/menu` o `/inventario`.
- Si tu backend cambia de dominio, ajusta `src/index.html` en la meta `app-api-base-url`.

También se incluye `render.yaml` en la raíz del repositorio para definir backend + frontend en un solo blueprint.
