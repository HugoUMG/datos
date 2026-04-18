# Base de Datos MySQL para phpMyAdmin

Este documento define una base de datos **MySQL 8+** para acoplarse al backend Java/Spring Boot del proyecto (`proyectoInvdeBienes`), permitiendo guardado de datos, historial y operación general de los módulos:

- Adquisiciones
- Inventario
- Asignaciones / Resguardos
- Bajas y enajenación
- Reportes

---

## 1) Script SQL completo (crear en phpMyAdmin)

> En phpMyAdmin: **SQL** → pegar y ejecutar por bloques (o todo junto si tu servidor lo permite).

```sql
-- =====================================================
-- 1. Crear base de datos
-- =====================================================
CREATE DATABASE IF NOT EXISTS activosdb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE activosdb;

-- =====================================================
-- 2. Tablas maestras
-- =====================================================
CREATE TABLE IF NOT EXISTS supplier (
  id BIGINT NOT NULL AUTO_INCREMENT,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NULL,
  active BIT(1) NOT NULL DEFAULT b'1',
  PRIMARY KEY (id),
  UNIQUE KEY uk_supplier_tax_id (tax_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS budget_line (
  id BIGINT NOT NULL AUTO_INCREMENT,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  code VARCHAR(255) NOT NULL,
  description VARCHAR(255) NOT NULL,
  allocated_amount DECIMAL(19,2) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_budget_line_code (code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS department (
  id BIGINT NOT NULL AUTO_INCREMENT,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  name VARCHAR(255) NOT NULL,
  cost_center_code VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_department_name (name),
  UNIQUE KEY uk_department_cost_center (cost_center_code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee (
  id BIGINT NOT NULL AUTO_INCREMENT,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  department_id BIGINT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_employee_email (email),
  KEY idx_employee_department (department_id),
  CONSTRAINT fk_employee_department
    FOREIGN KEY (department_id) REFERENCES department(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_account (
  id BIGINT NOT NULL AUTO_INCREMENT,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  employee_id BIGINT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_account_username (username),
  UNIQUE KEY uk_user_account_employee (employee_id),
  KEY idx_user_account_employee (employee_id),
  CONSTRAINT fk_user_account_employee
    FOREIGN KEY (employee_id) REFERENCES employee(id)
) ENGINE=InnoDB;

-- =====================================================
-- 3. Adquisiciones
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_invoice (
  id BIGINT NOT NULL AUTO_INCREMENT,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  invoice_number VARCHAR(255) NOT NULL,
  invoice_date DATE NOT NULL,
  total_amount DECIMAL(19,2) NOT NULL,
  supplier_id BIGINT NOT NULL,
  budget_line_id BIGINT NOT NULL,
  notes VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_purchase_invoice_number (invoice_number),
  KEY idx_purchase_invoice_supplier (supplier_id),
  KEY idx_purchase_invoice_budget_line (budget_line_id),
  CONSTRAINT fk_purchase_invoice_supplier
    FOREIGN KEY (supplier_id) REFERENCES supplier(id),
  CONSTRAINT fk_purchase_invoice_budget_line
    FOREIGN KEY (budget_line_id) REFERENCES budget_line(id)
) ENGINE=InnoDB;

-- =====================================================
-- 4. Inventario
-- =====================================================
CREATE TABLE IF NOT EXISTS asset (
  id BIGINT NOT NULL AUTO_INCREMENT,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  asset_code VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(255) NULL,
  serial_number VARCHAR(255) NOT NULL,
  acquisition_date DATE NOT NULL,
  acquisition_cost DECIMAL(19,2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  tag_type VARCHAR(50) NOT NULL,
  tag_value VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  purchase_invoice_id BIGINT NOT NULL,
  current_custodian_id BIGINT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_asset_code (asset_code),
  UNIQUE KEY uk_asset_serial (serial_number),
  UNIQUE KEY uk_asset_tag_value (tag_value),
  KEY idx_asset_invoice (purchase_invoice_id),
  KEY idx_asset_custodian (current_custodian_id),
  CONSTRAINT fk_asset_invoice
    FOREIGN KEY (purchase_invoice_id) REFERENCES purchase_invoice(id),
  CONSTRAINT fk_asset_current_custodian
    FOREIGN KEY (current_custodian_id) REFERENCES employee(id)
) ENGINE=InnoDB;

-- =====================================================
-- 5. Asignaciones y resguardos
-- =====================================================
CREATE TABLE IF NOT EXISTS assignment (
  id BIGINT NOT NULL AUTO_INCREMENT,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  asset_id BIGINT NOT NULL,
  employee_id BIGINT NOT NULL,
  assigned_at DATE NOT NULL,
  expected_return_at DATE NULL,
  returned_at DATE NULL,
  status VARCHAR(50) NOT NULL,
  digital_signature VARCHAR(255) NOT NULL,
  receipt_confirmation VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_assignment_asset (asset_id),
  KEY idx_assignment_employee (employee_id),
  KEY idx_assignment_status (status),
  CONSTRAINT fk_assignment_asset
    FOREIGN KEY (asset_id) REFERENCES asset(id),
  CONSTRAINT fk_assignment_employee
    FOREIGN KEY (employee_id) REFERENCES employee(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transfer (
  id BIGINT NOT NULL AUTO_INCREMENT,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  asset_id BIGINT NOT NULL,
  from_department_id BIGINT NOT NULL,
  to_department_id BIGINT NOT NULL,
  requested_at DATE NULL,
  approved_at DATE NULL,
  status VARCHAR(50) NULL,
  approved_by VARCHAR(255) NULL,
  PRIMARY KEY (id),
  KEY idx_transfer_asset (asset_id),
  KEY idx_transfer_from_department (from_department_id),
  KEY idx_transfer_to_department (to_department_id),
  CONSTRAINT fk_transfer_asset
    FOREIGN KEY (asset_id) REFERENCES asset(id),
  CONSTRAINT fk_transfer_from_department
    FOREIGN KEY (from_department_id) REFERENCES department(id),
  CONSTRAINT fk_transfer_to_department
    FOREIGN KEY (to_department_id) REFERENCES department(id)
) ENGINE=InnoDB;

-- =====================================================
-- 6. Bajas y enajenación
-- =====================================================
CREATE TABLE IF NOT EXISTS disposal (
  id BIGINT NOT NULL AUTO_INCREMENT,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  asset_id BIGINT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  disposal_type VARCHAR(255) NULL,
  status VARCHAR(50) NOT NULL,
  requested_by VARCHAR(255) NOT NULL,
  requested_at DATE NOT NULL,
  approved_by VARCHAR(255) NULL,
  approved_at DATE NULL,
  final_value DECIMAL(19,2) NULL,
  PRIMARY KEY (id),
  KEY idx_disposal_asset (asset_id),
  KEY idx_disposal_status (status),
  CONSTRAINT fk_disposal_asset
    FOREIGN KEY (asset_id) REFERENCES asset(id)
) ENGINE=InnoDB;

-- =====================================================
-- 7. Índices para reportes
-- =====================================================
CREATE INDEX idx_asset_status ON asset(status);
CREATE INDEX idx_asset_location ON asset(location);
CREATE INDEX idx_purchase_invoice_date ON purchase_invoice(invoice_date);
CREATE INDEX idx_assignment_assigned_at ON assignment(assigned_at);
CREATE INDEX idx_disposal_requested_at ON disposal(requested_at);

-- =====================================================
-- 8. Datos mínimos de arranque (opcional)
-- =====================================================
INSERT INTO supplier (created_at, updated_at, name, tax_id, email, phone, active)
VALUES
  (NOW(), NOW(), 'Proveedor Demo', 'RFC-DEMO-001', 'proveedor1@demo.com', '555-1000', b'1')
ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at);

INSERT INTO budget_line (created_at, updated_at, code, description, allocated_amount)
VALUES
  (NOW(), NOW(), 'TI-2026-001', 'Equipamiento tecnológico', 500000.00)
ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at);

INSERT INTO department (created_at, updated_at, name, cost_center_code)
VALUES
  (NOW(), NOW(), 'Tecnología', 'CC-TI-01')
ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at);

INSERT INTO employee (created_at, updated_at, full_name, email, department_id)
SELECT NOW(), NOW(), 'Empleado Demo', 'empleado.demo@empresa.com', d.id
FROM department d
WHERE d.cost_center_code = 'CC-TI-01'
  AND NOT EXISTS (
    SELECT 1 FROM employee e WHERE e.email = 'empleado.demo@empresa.com'
  );

INSERT INTO purchase_invoice (
  created_at, updated_at, invoice_number, invoice_date, total_amount, supplier_id, budget_line_id, notes
)
SELECT NOW(), NOW(), 'FAC-2026-0001', CURDATE(), 12000.00, s.id, b.id, 'Factura de arranque'
FROM supplier s
JOIN budget_line b ON b.code = 'TI-2026-001'
WHERE s.tax_id = 'RFC-DEMO-001'
  AND NOT EXISTS (
    SELECT 1 FROM purchase_invoice pi WHERE pi.invoice_number = 'FAC-2026-0001'
  );
```

---

## 2) Catálogos de valores (enums del backend)

Usar estos valores para evitar errores en inserciones manuales:

- `asset.status`: `EN_ALMACEN`, `ASIGNADO`, `EN_TRASLADO`, `EN_REVISION`, `DADO_DE_BAJA`
- `asset.tag_type`: `QR`, `RFID`
- `assignment.status`: `ACTIVA`, `DEVUELTA`
- `disposal.status` y `transfer.status`: `SOLICITADA`, `APROBADA`, `RECHAZADA`, `EJECUTADA`
- `user_account.role`: `ADMINISTRADOR`, `INVENTARIO`, `COMPRAS`, `EMPLEADO`, `FINANZAS`

---

## 3) Configuración Spring Boot para MySQL (en lugar de H2)

En `src/main/resources/application.properties`, usar por ejemplo:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/activosdb?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.username=root
spring.datasource.password=TU_PASSWORD

spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```

> Recomendado: usar `ddl-auto=validate` cuando ya cargaste el esquema SQL manualmente.

---

## 4) Flujo mínimo de prueba (guardar y registrar datos)

1. Crear proveedor + partida presupuestaria (si no existen).
2. Crear factura (`purchase_invoice`).
3. Registrar activo (`asset`) asociado a la factura.
4. Registrar asignación (`assignment`) del activo a un empleado.
5. Registrar solicitud de baja (`disposal`) para ese activo.

Con esto ya queda habilitado el ciclo de vida completo para consultas/reportes del backend.

---


## 5) Ingreso y usuarios (explícito)

El backend ahora autentica usuarios desde la tabla `user_account` (HTTP Basic).
Ahora `user_account` se vincula con `employee` mediante `employee_id` para habilitar validaciones y permisos por tipo de usuario.

Credencial administrador por defecto:

- Usuario: `admin`
- Contraseña: `admin123`

Al iniciar la aplicación se auto-registran si no existen: `admin`, `compras`, `inventario`, `finanzas`.

Con usuario admin se puede crear usuarios nuevos desde frontend (menú) o vía API:

- `POST /api/admin/users`

Payload ejemplo:

```json
{
  "username": "operador1",
  "password": "operador123",
  "role": "EMPLEADO",
  "employeeId": 1
}
```

### Menús/módulos por rol

- `ADMINISTRADOR`: acceso total.
- `COMPRAS`: adquisiciones (facturas, altas de compra).
- `INVENTARIO`: inventario, asignaciones, bajas y reportes operativos.
- `EMPLEADO`: portal propio para ver activos asignados.
- `FINANZAS`: reportes financieros/contables.

---

## 6) Notas de compatibilidad

- El backend usa `GenerationType.IDENTITY`, por eso las PK son `AUTO_INCREMENT`.
- `created_at` y `updated_at` son obligatorios para todas las tablas heredadas de `BaseEntity`.
- Si usas phpMyAdmin y cargas este SQL antes de iniciar backend, el sistema podrá persistir datos sin depender de H2 en memoria.
