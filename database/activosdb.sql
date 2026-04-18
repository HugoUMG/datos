-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 17-04-2026 a las 08:40:38
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `activosdb`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asset`
--

CREATE TABLE `asset` (
  `id` bigint(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `asset_code` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `serial_number` varchar(255) NOT NULL,
  `acquisition_date` date NOT NULL,
  `acquisition_cost` decimal(19,2) NOT NULL,
  `status` varchar(50) NOT NULL,
  `tag_type` varchar(50) NOT NULL,
  `tag_value` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `purchase_invoice_id` bigint(20) NOT NULL,
  `current_custodian_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `asset`
--

INSERT INTO `asset` (`id`, `created_at`, `updated_at`, `asset_code`, `name`, `description`, `serial_number`, `acquisition_date`, `acquisition_cost`, `status`, `tag_type`, `tag_value`, `location`, `purchase_invoice_id`, `current_custodian_id`) VALUES
(1, '2026-04-17 03:36:48.000000', '2026-04-17 03:40:26.000000', 'ACT-DD4A9060', 'Mesa', 'Mesa profesional', '001', '2026-04-16', 4000.00, 'DADO_DE_BAJA', 'QR', 'TAG-1', 'Almacén central', 1, 1),
(2, '2026-04-17 03:44:12.000000', '2026-04-17 03:44:12.000000', 'ACT-548EBF38', 'Pared de tabla roca', 'Material para construcción', '23412', '2026-04-16', 5000.00, 'EN_ALMACEN', 'QR', 'TAG-0002', 'Almacén Central', 2, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `assignment`
--

CREATE TABLE `assignment` (
  `id` bigint(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `asset_id` bigint(20) NOT NULL,
  `employee_id` bigint(20) NOT NULL,
  `assigned_at` date NOT NULL,
  `expected_return_at` date DEFAULT NULL,
  `returned_at` date DEFAULT NULL,
  `status` varchar(50) NOT NULL,
  `digital_signature` varchar(255) NOT NULL,
  `receipt_confirmation` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `assignment`
--

INSERT INTO `assignment` (`id`, `created_at`, `updated_at`, `asset_id`, `employee_id`, `assigned_at`, `expected_return_at`, `returned_at`, `status`, `digital_signature`, `receipt_confirmation`) VALUES
(1, '2026-04-17 03:37:42.000000', '2026-04-17 03:37:56.000000', 1, 1, '2026-04-16', '2026-05-31', '2026-04-16', 'DEVUELTA', 'firmadelinventario', 'OK'),
(2, '2026-04-17 03:38:45.000000', '2026-04-17 03:38:45.000000', 1, 1, '2026-04-17', '2026-05-29', NULL, 'ACTIVA', 'firmainventario', 'OK');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `budget_line`
--

CREATE TABLE `budget_line` (
  `id` bigint(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `code` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `allocated_amount` decimal(19,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `budget_line`
--

INSERT INTO `budget_line` (`id`, `created_at`, `updated_at`, `code`, `description`, `allocated_amount`) VALUES
(1, '2026-04-16 01:11:17.000000', '2026-04-16 01:11:17.000000', 'TI-2026-001', 'Equipamiento tecnológico', 500000.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `department`
--

CREATE TABLE `department` (
  `id` bigint(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `name` varchar(255) NOT NULL,
  `cost_center_code` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `department`
--

INSERT INTO `department` (`id`, `created_at`, `updated_at`, `name`, `cost_center_code`) VALUES
(1, '2026-04-16 01:11:17.000000', '2026-04-16 01:11:17.000000', 'OFICINA', 'CC-TI-01'),
(2, '2026-04-16 22:43:29.000000', '2026-04-16 22:43:29.000000', 'DE_CAMPO', 'CC-TI-02'),
(3, '2026-04-16 22:07:18.000000', '2026-04-16 22:43:29.000000', 'HIBRIDO', 'CC-TI-03');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `disposal`
--

CREATE TABLE `disposal` (
  `id` bigint(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `asset_id` bigint(20) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `disposal_type` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL,
  `requested_by` varchar(255) NOT NULL,
  `requested_at` date NOT NULL,
  `approved_by` varchar(255) DEFAULT NULL,
  `approved_at` date DEFAULT NULL,
  `final_value` decimal(19,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `disposal`
--

INSERT INTO `disposal` (`id`, `created_at`, `updated_at`, `asset_id`, `reason`, `disposal_type`, `status`, `requested_by`, `requested_at`, `approved_by`, `approved_at`, `final_value`) VALUES
(1, '2026-04-17 03:39:38.000000', '2026-04-17 03:40:26.000000', 1, 'SE QUEBRÓ', 'SOLICITADA', 'APROBADA', 'Empleado', '2026-04-16', 'directo de finanzas', '2026-04-16', 4000.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `employee`
--

CREATE TABLE `employee` (
  `id` bigint(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `department_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `employee`
--

INSERT INTO `employee` (`id`, `created_at`, `updated_at`, `full_name`, `email`, `department_id`) VALUES
(1, '2026-04-16 01:11:17.000000', '2026-04-16 01:11:17.000000', 'Empleado Demo', 'empleado.demo@empresa.com', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `purchase_invoice`
--

CREATE TABLE `purchase_invoice` (
  `id` bigint(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `invoice_number` varchar(255) NOT NULL,
  `invoice_date` date NOT NULL,
  `total_amount` decimal(19,2) NOT NULL,
  `supplier_id` bigint(20) NOT NULL,
  `budget_line_id` bigint(20) NOT NULL,
  `notes` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `purchase_invoice`
--

INSERT INTO `purchase_invoice` (`id`, `created_at`, `updated_at`, `invoice_number`, `invoice_date`, `total_amount`, `supplier_id`, `budget_line_id`, `notes`) VALUES
(1, '2026-04-16 01:11:17.000000', '2026-04-16 01:11:17.000000', 'FAC-2026-0001', '2026-04-16', 12000.00, 1, 1, 'Factura de arranque'),
(2, '2026-04-17 03:43:03.000000', '2026-04-17 03:43:03.000000', 'FAC-2026-2', '2026-04-16', 35000.00, 1, 1, 'COMPRAS DE MATERIAL'),
(3, '2026-04-17 04:09:40.000000', '2026-04-17 04:09:40.000000', '52353425', '2026-04-16', 234535.00, 2, 1, 'POLLITO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `supplier`
--

CREATE TABLE `supplier` (
  `id` bigint(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `name` varchar(255) NOT NULL,
  `tax_id` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `active` bit(1) NOT NULL DEFAULT b'1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `supplier`
--

INSERT INTO `supplier` (`id`, `created_at`, `updated_at`, `name`, `tax_id`, `email`, `phone`, `active`) VALUES
(1, '2026-04-16 01:11:17.000000', '2026-04-16 01:11:17.000000', 'Proveedor Demo', 'RFC-DEMO-001', 'proveedor1@demo.com', '555-1000', b'1'),
(2, '2026-04-16 22:07:18.000000', '2026-04-16 22:07:18.000000', 'DISTRIBUIDORA DON POLLOTE', 'REF-45300', 'pollote@gmail.com', '5555555', b'0');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `transfer`
--

CREATE TABLE `transfer` (
  `id` bigint(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `asset_id` bigint(20) NOT NULL,
  `from_department_id` bigint(20) NOT NULL,
  `to_department_id` bigint(20) NOT NULL,
  `requested_at` date DEFAULT NULL,
  `approved_at` date DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `approved_by` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_account`
--

CREATE TABLE `user_account` (
  `id` bigint(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL,
  `employee_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `user_account`
--

INSERT INTO `user_account` (`id`, `created_at`, `updated_at`, `username`, `password`, `role`, `employee_id`) VALUES
(1, '2026-04-16 07:11:47.000000', '2026-04-16 07:11:47.000000', 'admin', '$2a$10$aTDtwJEJKbg1ebjFfcu0eOcGUdGEG..4MFEjZ7MhU.cK4ESqy2LfK', 'ADMINISTRADOR', NULL),
(2, '2026-04-16 07:11:47.000000', '2026-04-16 07:11:47.000000', 'compras', '$2a$10$xcbGh5WuU76PR67cM3t.Juedu64fL.3CsJVlRjMb9hYG5v7ABIIKi', 'COMPRAS', NULL),
(3, '2026-04-16 07:11:48.000000', '2026-04-16 07:11:48.000000', 'inventario', '$2a$10$PoQSFUXrRFflsalYjDydZ.Buh0YqU/3rxBWlx5raQ11s7kgFLdP7S', 'INVENTARIO', NULL),
(4, '2026-04-16 07:11:48.000000', '2026-04-16 07:11:48.000000', 'finanzas', '$2a$10$bKjVwycRTbvhEBLQFXzYl.WT6CZ.PAmqf5wFPeJIM3LoSRQedfLGm', 'FINANZAS', NULL),
(5, '2026-04-16 07:19:19.000000', '2026-04-16 07:19:19.000000', 'compras1', '$2a$10$aTdlR9AXxzczwWItkjvEJuRiO0REF1WauC3fsj4hvdZ5zmXOXbFHG', 'COMPRAS', NULL),
(6, '2026-04-17 03:33:48.000000', '2026-04-17 03:33:48.000000', 'finanzas1', '$2a$10$q/IejcfSQKzeUR6yC/3NTeydF1S7OVboKV.eYimge8564knOyl3Bm', 'FINANZAS', NULL),
(7, '2026-04-17 03:35:22.000000', '2026-04-17 03:35:22.000000', 'inventario1', '$2a$10$2oEBC4ElkrR2trOBjwKXx.1t7jM9/pYpbTyYQpladkPsE5M3zsJQ6', 'INVENTARIO', NULL),
(8, '2026-04-17 03:46:34.000000', '2026-04-17 03:46:34.000000', 'Empleado', '$2a$10$YU5o6er8xpmkXnGFQwtSx..6B0gZVZ1x7te58JZexRLdwqgqcqRtq', 'EMPLEADO', 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `asset`
--
ALTER TABLE `asset`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_asset_code` (`asset_code`),
  ADD UNIQUE KEY `uk_asset_serial` (`serial_number`),
  ADD UNIQUE KEY `uk_asset_tag_value` (`tag_value`),
  ADD KEY `idx_asset_invoice` (`purchase_invoice_id`),
  ADD KEY `idx_asset_custodian` (`current_custodian_id`),
  ADD KEY `idx_asset_status` (`status`),
  ADD KEY `idx_asset_location` (`location`);

--
-- Indices de la tabla `assignment`
--
ALTER TABLE `assignment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_assignment_asset` (`asset_id`),
  ADD KEY `idx_assignment_employee` (`employee_id`),
  ADD KEY `idx_assignment_status` (`status`),
  ADD KEY `idx_assignment_assigned_at` (`assigned_at`);

--
-- Indices de la tabla `budget_line`
--
ALTER TABLE `budget_line`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_budget_line_code` (`code`);

--
-- Indices de la tabla `department`
--
ALTER TABLE `department`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_department_name` (`name`),
  ADD UNIQUE KEY `uk_department_cost_center` (`cost_center_code`);

--
-- Indices de la tabla `disposal`
--
ALTER TABLE `disposal`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_disposal_asset` (`asset_id`),
  ADD KEY `idx_disposal_status` (`status`),
  ADD KEY `idx_disposal_requested_at` (`requested_at`);

--
-- Indices de la tabla `employee`
--
ALTER TABLE `employee`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_employee_email` (`email`),
  ADD KEY `idx_employee_department` (`department_id`);

--
-- Indices de la tabla `purchase_invoice`
--
ALTER TABLE `purchase_invoice`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_purchase_invoice_number` (`invoice_number`),
  ADD KEY `idx_purchase_invoice_supplier` (`supplier_id`),
  ADD KEY `idx_purchase_invoice_budget_line` (`budget_line_id`),
  ADD KEY `idx_purchase_invoice_date` (`invoice_date`);

--
-- Indices de la tabla `supplier`
--
ALTER TABLE `supplier`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_supplier_tax_id` (`tax_id`);

--
-- Indices de la tabla `transfer`
--
ALTER TABLE `transfer`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_transfer_asset` (`asset_id`),
  ADD KEY `idx_transfer_from_department` (`from_department_id`),
  ADD KEY `idx_transfer_to_department` (`to_department_id`);

--
-- Indices de la tabla `user_account`
--
ALTER TABLE `user_account`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_user_account_username` (`username`),
  ADD UNIQUE KEY `uk_user_account_employee` (`employee_id`),
  ADD KEY `idx_user_account_employee` (`employee_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `asset`
--
ALTER TABLE `asset`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `assignment`
--
ALTER TABLE `assignment`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `budget_line`
--
ALTER TABLE `budget_line`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `department`
--
ALTER TABLE `department`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `disposal`
--
ALTER TABLE `disposal`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `employee`
--
ALTER TABLE `employee`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `purchase_invoice`
--
ALTER TABLE `purchase_invoice`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `supplier`
--
ALTER TABLE `supplier`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `transfer`
--
ALTER TABLE `transfer`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `user_account`
--
ALTER TABLE `user_account`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `asset`
--
ALTER TABLE `asset`
  ADD CONSTRAINT `fk_asset_current_custodian` FOREIGN KEY (`current_custodian_id`) REFERENCES `employee` (`id`),
  ADD CONSTRAINT `fk_asset_invoice` FOREIGN KEY (`purchase_invoice_id`) REFERENCES `purchase_invoice` (`id`);

--
-- Filtros para la tabla `assignment`
--
ALTER TABLE `assignment`
  ADD CONSTRAINT `fk_assignment_asset` FOREIGN KEY (`asset_id`) REFERENCES `asset` (`id`),
  ADD CONSTRAINT `fk_assignment_employee` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`);

--
-- Filtros para la tabla `disposal`
--
ALTER TABLE `disposal`
  ADD CONSTRAINT `fk_disposal_asset` FOREIGN KEY (`asset_id`) REFERENCES `asset` (`id`);

--
-- Filtros para la tabla `employee`
--
ALTER TABLE `employee`
  ADD CONSTRAINT `fk_employee_department` FOREIGN KEY (`department_id`) REFERENCES `department` (`id`);

--
-- Filtros para la tabla `purchase_invoice`
--
ALTER TABLE `purchase_invoice`
  ADD CONSTRAINT `fk_purchase_invoice_budget_line` FOREIGN KEY (`budget_line_id`) REFERENCES `budget_line` (`id`),
  ADD CONSTRAINT `fk_purchase_invoice_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`id`);

--
-- Filtros para la tabla `transfer`
--
ALTER TABLE `transfer`
  ADD CONSTRAINT `fk_transfer_asset` FOREIGN KEY (`asset_id`) REFERENCES `asset` (`id`),
  ADD CONSTRAINT `fk_transfer_from_department` FOREIGN KEY (`from_department_id`) REFERENCES `department` (`id`),
  ADD CONSTRAINT `fk_transfer_to_department` FOREIGN KEY (`to_department_id`) REFERENCES `department` (`id`);

--
-- Filtros para la tabla `user_account`
--
ALTER TABLE `user_account`
  ADD CONSTRAINT `fk_user_account_employee` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
