# LAB 01 - API REST + Microservicio + Estrés (Suppliers)

## Objetivo
Crear y consumir API REST de `suppliers`, luego cargar 1000-5000 registros.

## 1) API REST backend usada
- `POST /api/data/suppliers`
- `GET /api/data/suppliers`

## 2) Prueba previa en Postman
- Método: `POST`
- URL: `http://localhost:8080/api/data/suppliers`
- Auth: Basic (`admin` / `admin123`)
- Body JSON:
```json
{"name":"Proveedor Demo","taxId":"RFC-DEMO-X","email":"demo@proveedor.com","phone":"555-1010"}
```

## 3) Consumo por microservicio (HTML+CSS)
1. `cd microservice_consumer`
2. `python -m venv .venv && source .venv/bin/activate`
3. `pip install -r requirements.txt`
4. `python app.py`
5. Abrir `http://localhost:5050/suppliers`

## 4) Carga de estrés
```bash
python scripts/stress_load.py --entity suppliers --count 1000
python scripts/stress_load.py --entity suppliers --count 5000
```

## 5) Evidencia (pantallas)
- Capturar Postman request/response.
- Capturar terminal de stress_load.
- Capturar pantalla de `http://localhost:5050/suppliers` mostrando listado.
