package com.proyectoinvdebienes.backend.service;

import com.proyectoinvdebienes.backend.repository.AssetRepository;
import com.proyectoinvdebienes.backend.repository.AssignmentRepository;
import com.proyectoinvdebienes.backend.repository.BudgetLineRepository;
import com.proyectoinvdebienes.backend.repository.DepartmentRepository;
import com.proyectoinvdebienes.backend.repository.DisposalRepository;
import com.proyectoinvdebienes.backend.repository.EmployeeRepository;
import com.proyectoinvdebienes.backend.repository.PurchaseInvoiceRepository;
import com.proyectoinvdebienes.backend.repository.SupplierRepository;
import com.proyectoinvdebienes.backend.repository.UserAccountRepository;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Respaldo lógico de toda la información del sistema en un solo JSON (hallazgo
 * "Respaldo y recuperación de la base de datos" del SGC). Las contraseñas no se incluyen.
 */
@Service
public class BackupService {

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final SupplierRepository supplierRepository;
    private final BudgetLineRepository budgetLineRepository;
    private final PurchaseInvoiceRepository purchaseInvoiceRepository;
    private final AssetRepository assetRepository;
    private final AssignmentRepository assignmentRepository;
    private final DisposalRepository disposalRepository;
    private final UserAccountRepository userAccountRepository;

    public BackupService(
            DepartmentRepository departmentRepository,
            EmployeeRepository employeeRepository,
            SupplierRepository supplierRepository,
            BudgetLineRepository budgetLineRepository,
            PurchaseInvoiceRepository purchaseInvoiceRepository,
            AssetRepository assetRepository,
            AssignmentRepository assignmentRepository,
            DisposalRepository disposalRepository,
            UserAccountRepository userAccountRepository
    ) {
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
        this.supplierRepository = supplierRepository;
        this.budgetLineRepository = budgetLineRepository;
        this.purchaseInvoiceRepository = purchaseInvoiceRepository;
        this.assetRepository = assetRepository;
        this.assignmentRepository = assignmentRepository;
        this.disposalRepository = disposalRepository;
        this.userAccountRepository = userAccountRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> snapshot() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("generatedAt", LocalDateTime.now());
        data.put("departments", departmentRepository.findAll());
        data.put("employees", employeeRepository.findAll());
        data.put("suppliers", supplierRepository.findAll());
        data.put("budgetLines", budgetLineRepository.findAll());
        data.put("invoices", purchaseInvoiceRepository.findAll());
        data.put("assets", assetRepository.findAll());
        data.put("assignments", assignmentRepository.findAll());
        data.put("disposals", disposalRepository.findAll());
        data.put("users", userAccountRepository.findAll().stream()
                .map(user -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", user.getId());
                    row.put("username", user.getUsername());
                    row.put("role", user.getRole().name());
                    row.put("employeeId", user.getEmployee() != null ? user.getEmployee().getId() : null);
                    row.put("createdAt", user.getCreatedAt());
                    return row;
                })
                .toList());
        return data;
    }
}
