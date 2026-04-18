package com.proyectoinvdebienes.backend.repository;

import com.proyectoinvdebienes.backend.domain.enums.AssignmentStatus;
import com.proyectoinvdebienes.backend.domain.model.Assignment;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    @EntityGraph(attributePaths = {"asset", "employee", "employee.department"})
    List<Assignment> findByEmployeeId(Long employeeId);

    @EntityGraph(attributePaths = {"asset", "employee", "employee.department"})
    List<Assignment> findByEmployeeIdAndStatus(Long employeeId, AssignmentStatus status);

    List<Assignment> findByAssetId(Long assetId);

    @EntityGraph(attributePaths = {"asset", "employee", "employee.department"})
    List<Assignment> findByStatus(AssignmentStatus status);

    @Override
    @EntityGraph(attributePaths = {"asset", "employee", "employee.department"})
    List<Assignment> findAll();
}
