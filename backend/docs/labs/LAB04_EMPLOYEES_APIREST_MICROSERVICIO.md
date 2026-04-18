# LAB 04 - API REST + Microservicio + Estrés (Employees + Nombre del trabajo)

## Objetivo
Insertar empleados masivamente, incluyendo nombre del autor en la tabla.

## API REST
- `POST /api/data/employees`
- `GET /api/data/employees`

## Requisito de nombre
Este laboratorio inserta explícitamente un registro con nombre:
- `GPT-5.3-Codex`

## Preparación
Debe existir al menos 1 departamento (`departmentId` válido).

## Postman ejemplo
```json
{"fullName":"GPT-5.3-Codex","email":"gpt53codex@stress.local","departmentId":1}
```

## Microservicio
- URL: `http://localhost:5050/employees`
- Formulario + listado en HTML/CSS.

## Estrés
```bash
python scripts/stress_load.py --entity employees --count 1000 --department-id 1
python scripts/stress_load.py --entity employees --count 5000 --department-id 1
```

## Evidencia
- Captura donde aparezca `GPT-5.3-Codex` en empleados.
- Captura de la carga masiva en terminal.
