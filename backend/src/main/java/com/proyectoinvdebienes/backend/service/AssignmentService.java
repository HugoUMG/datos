package com.proyectoinvdebienes.backend.service;

import com.proyectoinvdebienes.backend.domain.enums.AssetStatus;
import com.proyectoinvdebienes.backend.domain.enums.AssignmentStatus;
import com.proyectoinvdebienes.backend.domain.model.Asset;
import com.proyectoinvdebienes.backend.domain.model.Assignment;
import com.proyectoinvdebienes.backend.domain.model.Employee;
import com.proyectoinvdebienes.backend.repository.AssetRepository;
import com.proyectoinvdebienes.backend.repository.AssignmentRepository;
import com.proyectoinvdebienes.backend.repository.EmployeeRepository;
import com.proyectoinvdebienes.backend.repository.UserAccountRepository;
import com.proyectoinvdebienes.backend.web.dto.CreateAssignmentRequest;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssetRepository assetRepository;
    private final EmployeeRepository employeeRepository;
    private final UserAccountRepository userAccountRepository;

    public AssignmentService(
            AssignmentRepository assignmentRepository,
            AssetRepository assetRepository,
            EmployeeRepository employeeRepository,
            UserAccountRepository userAccountRepository
    ) {
        this.assignmentRepository = assignmentRepository;
        this.assetRepository = assetRepository;
        this.employeeRepository = employeeRepository;
        this.userAccountRepository = userAccountRepository;
    }

    @Transactional
    public Assignment assignAsset(CreateAssignmentRequest request) {
        Asset asset = assetRepository.findById(request.assetId())
                .orElseThrow(() -> new NotFoundException("Activo no encontrado"));

        if (asset.getStatus() == AssetStatus.DADO_DE_BAJA) {
            throw new BusinessException("Los activos dados de baja no pueden reasignarse");
        }

        if (asset.getStatus() == AssetStatus.ASIGNADO) {
            throw new BusinessException("El activo ya está asignado");
        }

        Employee employee = employeeRepository.findById(request.employeeId())
                .orElseThrow(() -> new NotFoundException("Empleado no encontrado"));

        Assignment assignment = new Assignment();
        assignment.setAsset(asset);
        assignment.setEmployee(employee);
        assignment.setAssignedAt(request.assignedAt());
        assignment.setExpectedReturnAt(request.expectedReturnAt());
        assignment.setStatus(AssignmentStatus.PENDIENTE_CONFIRMACION);
        assignment.setDigitalSignature("PENDIENTE_CONFIRMACION");
        assignment.setReceiptConfirmation("PENDIENTE_CONFIRMACION");

        return assignmentRepository.save(assignment);
    }

    @Transactional
    public Assignment confirmAssignment(Long assignmentId, Long employeeId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new NotFoundException("Asignación no encontrada"));

        if (!assignment.getEmployee().getId().equals(employeeId)) {
            throw new BusinessException("No puedes confirmar una asignación de otro empleado");
        }

        if (assignment.getStatus() != AssignmentStatus.PENDIENTE_CONFIRMACION) {
            throw new BusinessException("La asignación ya fue confirmada o cerrada");
        }

        Asset asset = assignment.getAsset();
        if (asset.getStatus() == AssetStatus.DADO_DE_BAJA) {
            throw new BusinessException("No se puede confirmar asignación de un activo dado de baja");
        }

        String departmentName = assignment.getEmployee().getDepartment() != null
                ? assignment.getEmployee().getDepartment().getName()
                : "ALMACEN_CENTRAL";

        assignment.setStatus(AssignmentStatus.ACTIVA);
        assignment.setReceiptConfirmation("CONFIRMADA_POR_EMPLEADO");
        assignment.setDigitalSignature("TERMINOS_ACEPTADOS");

        asset.setCurrentCustodian(assignment.getEmployee());
        asset.setStatus(AssetStatus.ASIGNADO);
        asset.setLocation(departmentName);
        assetRepository.save(asset);

        return assignmentRepository.save(assignment);
    }

    @Transactional
    public Assignment returnAssignment(Long assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new NotFoundException("Asignación no encontrada"));

        if (assignment.getStatus() != AssignmentStatus.ACTIVA) {
            throw new BusinessException("Solo se pueden devolver asignaciones activas");
        }

        assignment.setStatus(AssignmentStatus.DEVUELTA);
        assignment.setReturnedAt(LocalDate.now());

        Asset asset = assignment.getAsset();
        asset.setStatus(AssetStatus.EN_ALMACEN);
        asset.setCurrentCustodian(null);
        asset.setLocation("Almacén central");
        assetRepository.save(asset);

        return assignmentRepository.save(assignment);
    }

    public List<Assignment> listByEmployee(Long employeeId) {
        return assignmentRepository.findByEmployeeId(employeeId);
    }

    public List<Assignment> listByEmployeeAndStatus(Long employeeId, AssignmentStatus status) {
        return assignmentRepository.findByEmployeeIdAndStatus(employeeId, status);
    }

    public List<Assignment> listAll() {
        return assignmentRepository.findAll();
    }

    public List<Assignment> listReturned() {
        return assignmentRepository.findByStatus(AssignmentStatus.DEVUELTA);
    }

    public Long findEmployeeIdByUsername(String username) {
        Long employeeId = userAccountRepository.findByUsername(username)
                .map(user -> user.getEmployee() != null ? user.getEmployee().getId() : null)
                .orElseThrow(() -> new NotFoundException("Usuario autenticado no encontrado"));

        if (employeeId == null) {
            throw new BusinessException("La cuenta no está vinculada a un empleado.");
        }
        return employeeId;
    }
}
