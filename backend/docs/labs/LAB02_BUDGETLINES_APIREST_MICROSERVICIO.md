# LAB 02 - API REST + Microservicio + Estrés (Budget Lines)

## Objetivo
Registrar partidas presupuestarias por API y consumo web.

## 1) API REST backend usada
- `POST /api/data/budget-lines`
- `GET /api/data/budget-lines`

## 2) Prueba en Postman
- URL: `http://localhost:8080/api/data/budget-lines`
- Auth Basic: `admin/admin123`
- Body:
```json
{"code":"BL-DEMO-01","description":"Partida Demo","allocatedAmount":10000}
```

## 3) Microservicio (consumo)
- Ir a `http://localhost:5050/budget-lines`
- Crear y listar con la pantalla HTML/CSS.

## 4) Estrés 1000-5000
```bash
python scripts/stress_load.py --entity budget-lines --count 1000
python scripts/stress_load.py --entity budget-lines --count 3000
```

## 5) Evidencias
- Screenshot Postman
- Screenshot terminal con carga
- Screenshot pantalla de listado en microservicio
