# Android Test App (base para este backend)

Estructura mínima para una app Android (Kotlin + Retrofit + Compose) que consume el backend de este repositorio.

## Endpoint base
Configura `BASE_URL` en `app/build.gradle.kts` o usa `local.properties` para entornos locales.

Ejemplo local con emulador Android:
- Backend local: `http://10.0.2.2:8080/`

## Qué incluye
- `AuthApi`: login contra `/api/auth/login`
- `InventoryApi`: listado de activos `/api/inventory/assets`
- `BackendRepository`: capa simple de acceso a datos
- `MainViewModel`: estado de prueba para login + carga de inventario
- `MainActivity`: UI base con Compose para probar conectividad

## Siguientes pasos sugeridos
1. Agregar manejo de token persistente (DataStore).
2. Añadir interceptor para Basic/Bearer según endpoint.
3. Separar por módulos (`core`, `features`, `data`).
4. Agregar pruebas instrumentadas con MockWebServer.
