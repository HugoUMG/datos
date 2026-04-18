# LAB 03 - API REST + Microservicio + Estrés (Departments)

## Objetivo
Crear centros de costo/departamentos para alimentar catálogo base.

## API REST
- `POST /api/data/departments`
- `GET /api/data/departments`

## Postman
```json
{"name":"Tecnología Demo","costCenterCode":"CC-DEMO-01"}
```

## Microservicio
- URL: `http://localhost:5050/departments`
- Permite alta/listado con HTML + CSS.

## Estrés
```bash
python scripts/stress_load.py --entity departments --count 1000
python scripts/stress_load.py --entity departments --count 5000
```

## Evidencias
Tomar pantallas de Postman, consola y vista web.
