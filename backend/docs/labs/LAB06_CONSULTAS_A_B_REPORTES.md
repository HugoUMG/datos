# LAB 06 - Consultas A y B (SQL + Backend)

## Consulta A (SQL)
**Objetivo:** obtener por empleado la cantidad de bienes activos asignados y el monto total invertido.

```sql
SELECT
  e.id AS codigo_empleado,
  e.full_name AS nombre_empleado,
  COUNT(a.id) AS cantidad_bienes_asignados,
  COALESCE(SUM(ast.acquisition_cost), 0) AS monto_total_asignado
FROM assignment a
JOIN employee e ON e.id = a.employee_id
JOIN asset ast ON ast.id = a.asset_id
WHERE a.status = 'ACTIVA'
GROUP BY e.id, e.full_name
ORDER BY cantidad_bienes_asignados DESC;
```

## Consulta B (SQL)
**Parámetro:** código de empleado.

```sql
SELECT
  e.id AS codigo_empleado,
  e.full_name AS nombre_empleado,
  ast.asset_code AS codigo_bien,
  COALESCE(ast.description, ast.name) AS descripcion_bien,
  ast.acquisition_cost AS costo_bien
FROM assignment a
JOIN employee e ON e.id = a.employee_id
JOIN asset ast ON ast.id = a.asset_id
WHERE e.id = :codigo_empleado
  AND a.status = 'ACTIVA'
ORDER BY ast.asset_code ASC;
```

## Endpoint backend implementado para Consulta B
- `GET /api/reports/employee/{employeeId}/assigned-assets`

### Ejemplo Postman
```http
GET https://datos-gh6q.onrender.com/api/reports/employee/1/assigned-assets
Authorization: Basic admin admin123
```

## Endpoint backend implementado para Consulta A
- `GET /api/reports/invested-by-employee`

### Ejemplo Postman
```http
GET https://datos-gh6q.onrender.com/api/reports/invested-by-employee
Authorization: Basic admin admin123
```
