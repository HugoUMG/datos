# Sistema de Gestión de Activos y Bienes Empresariales

Proyecto con backend Spring Boot + frontend Angular para gestionar el ciclo completo de activos.

## Backend

Módulos disponibles:
- Adquisiciones
- Inventario
- Asignaciones/Resguardos
- Bajas y Enajenación
- Reportes

### Usuarios iniciales
Al arrancar se crean `admin`, `compras`, `inventario` y `finanzas` con las contraseñas de las variables
`SEED_ADMIN_PASSWORD`, `SEED_COMPRAS_PASSWORD`, `SEED_INVENTARIO_PASSWORD` y `SEED_FINANZAS_PASSWORD`.
Las contraseñas nunca se escriben en el repositorio.

## Frontend (Angular)

Flujo de pantallas:
1. Login (`/login`)
2. Menú general (`/menu`)
3. Módulos en rutas separadas y apertura en pestañas nuevas:
   - `/adquisiciones`
   - `/inventario`
   - `/asignaciones`
   - `/bajas`
   - `/reportes`

## Ejecución rápida frontend

```bash
cd frontend
npm install
npm start
```

## Base de datos MySQL / phpMyAdmin

Revisar documentación completa en:
- `docs/BDD_MYSQL_PHPMYADMIN.md`
# ProyectoFinalIS
# proyectoIngeniera
# proyectoooooooooo
