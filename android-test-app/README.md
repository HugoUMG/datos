# Android Test App (base para este backend)

Estructura mínima para una app Android (Kotlin + Retrofit + Compose) que consume el backend de este repositorio.

## Configuración de URL (backend local)
Esta app ya soporta leer la URL desde una propiedad Gradle `BACKEND_BASE_URL`.

1. Crea/edita `android-test-app/local.properties`.
2. Agrega la URL de tu PC (misma red WiFi/LAN):

```properties
BACKEND_BASE_URL=http://192.168.1.4:8080/
```

> Para emulador Android puedes usar `http://10.0.2.2:8080/`.

## Requisitos para correr contra `192.168.1.4`
- Celular y PC en la misma red.
- Backend levantado en tu PC en puerto `8080`.
- Firewall de tu PC permitiendo conexiones entrantes al puerto `8080`.
- En backend Spring Boot, bind en `0.0.0.0` (si aplica en tu config).

## Qué incluye
- `AuthApi`: login contra `/api/auth/login`
- `InventoryApi`: listado de activos `/api/inventory/assets`
- `BackendRepository`: capa simple de acceso a datos
- `MainViewModel`: estado de prueba para login + carga de inventario
- `MainActivity`: UI base con Compose para probar conectividad
- `network_security_config.xml`: tráfico HTTP permitido para entorno local (`192.168.1.4`, `10.0.2.2`, `localhost`)

## Qué más podrías agregar ahora
1. **Interceptor de auth** para mandar token/Basic automáticamente.
2. **Pantalla de configuración** para cambiar URL sin recompilar.
3. **DataStore** para guardar URL, usuario y token.
4. **MockWebServer tests** para validar APIs sin depender del backend vivo.
5. **Health check** al endpoint de salud antes de login.
6. **Build flavors** (`dev`, `qa`, `prod`) con URLs separadas.
