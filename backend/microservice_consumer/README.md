# Microservicio consumidor de API REST

Servicio Flask para consumir API del backend y mostrar formularios/listados en HTML+CSS.

## Ejecutar
```bash
cd microservice_consumer
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Abrir:
- `http://localhost:5050/`

Variables opcionales:
- `BACKEND_URL` (default `http://localhost:8080`)
- `BACKEND_USER` (default `admin`)
- `BACKEND_PASS` (default `admin123`)

## Carga de estrés
```bash
python scripts/stress_load.py --entity suppliers --count 1000
python scripts/stress_load.py --entity employees --count 1000 --department-id 1
```
