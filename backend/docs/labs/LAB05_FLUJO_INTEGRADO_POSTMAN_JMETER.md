# LAB 05 - Flujo Integrado (Postman + JMeter + Microservicio)

## Objetivo
Ejecutar flujo completo de alimentación y validación visual.

## Flujo recomendado
1. Crear `departments` (Postman).
2. Crear `suppliers` (Postman).
3. Crear `budget-lines` (Postman).
4. Correr carga de estrés por entidad (script o JMeter).
5. Validar en microservicio HTML/CSS que se listan registros.

## JMeter (opcional clase)
- Thread Group: 100 usuarios.
- Loop Count: 10 a 50.
- HTTP Request: `POST /api/data/suppliers`.
- Basic Auth Manager con `admin/admin123`.

## Scripts de estrés (alternativa)
```bash
python scripts/stress_load.py --entity suppliers --count 2000
python scripts/stress_load.py --entity budget-lines --count 2000
python scripts/stress_load.py --entity departments --count 2000
python scripts/stress_load.py --entity employees --count 2000 --department-id 1
```

## Evidencias requeridas (pantallas)
- Postman pruebas unitarias API REST.
- JMeter o terminal con ejecuciones de carga.
- Front de microservicio mostrando alta/listado.

## Criterios de revisión
- API REST funcional.
- Carga de 1000-5000 por entidad.
- Consumo con HTML+CSS.
- Registro de nombre en tabla de empleados.
