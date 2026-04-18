package com.proyectoinvdebienes.backend.web.controller;

import com.proyectoinvdebienes.backend.domain.model.BudgetLine;
import com.proyectoinvdebienes.backend.domain.model.Department;
import com.proyectoinvdebienes.backend.domain.model.Employee;
import com.proyectoinvdebienes.backend.domain.model.Supplier;
import com.proyectoinvdebienes.backend.repository.BudgetLineRepository;
import com.proyectoinvdebienes.backend.repository.DepartmentRepository;
import com.proyectoinvdebienes.backend.repository.EmployeeRepository;
import com.proyectoinvdebienes.backend.repository.SupplierRepository;
import com.proyectoinvdebienes.backend.service.NotFoundException;
import com.proyectoinvdebienes.backend.web.dto.CreateBudgetLineRequest;
import com.proyectoinvdebienes.backend.web.dto.CreateDepartmentRequest;
import com.proyectoinvdebienes.backend.web.dto.CreateEmployeeDataRequest;
import com.proyectoinvdebienes.backend.web.dto.CreateSupplierRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/data")
public class DataSeedController {

    private final SupplierRepository supplierRepository;
    private final BudgetLineRepository budgetLineRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;

    public DataSeedController(
            SupplierRepository supplierRepository,
            BudgetLineRepository budgetLineRepository,
            DepartmentRepository departmentRepository,
            EmployeeRepository employeeRepository
    ) {
        this.supplierRepository = supplierRepository;
        this.budgetLineRepository = budgetLineRepository;
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
    }

    @PostMapping("/suppliers")
    @ResponseStatus(HttpStatus.CREATED)
    public Supplier createSupplier(@Valid @RequestBody CreateSupplierRequest request) {
        Supplier supplier = new Supplier();
        supplier.setName(request.name());
        supplier.setTaxId(request.taxId());
        supplier.setEmail(request.email());
        supplier.setPhone(request.phone());
        supplier.setActive(true);
        return supplierRepository.save(supplier);
    }

    @GetMapping("/suppliers")
    public List<Supplier> listSuppliers() {
        return supplierRepository.findAll();
    }

    @PostMapping("/budget-lines")
    @ResponseStatus(HttpStatus.CREATED)
    public BudgetLine createBudgetLine(@Valid @RequestBody CreateBudgetLineRequest request) {
        BudgetLine budgetLine = new BudgetLine();
        budgetLine.setCode(request.code());
        budgetLine.setDescription(request.description());
        budgetLine.setAllocatedAmount(request.allocatedAmount());
        return budgetLineRepository.save(budgetLine);
    }

    @GetMapping("/budget-lines")
    public List<BudgetLine> listBudgetLines() {
        return budgetLineRepository.findAll();
    }

    @PostMapping("/departments")
    @ResponseStatus(HttpStatus.CREATED)
    public Department createDepartment(@Valid @RequestBody CreateDepartmentRequest request) {
        Department department = new Department();
        department.setName(request.name());
        department.setCostCenterCode(request.costCenterCode());
        return departmentRepository.save(department);
    }

    @GetMapping("/departments")
    public List<Department> listDepartments() {
        return departmentRepository.findAll();
    }

    @PostMapping("/employees")
    @ResponseStatus(HttpStatus.CREATED)
    public Employee createEmployee(@Valid @RequestBody CreateEmployeeDataRequest request) {
        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new NotFoundException("Departamento no encontrado"));

        Employee employee = new Employee();
        employee.setFullName(request.fullName());
        employee.setEmail(request.email());
        employee.setDepartment(department);
        return employeeRepository.save(employee);
    }

    @GetMapping("/employees")
    public List<Employee> listEmployees() {
        return employeeRepository.findAll();
    }
}
