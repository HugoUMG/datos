package com.proyectoinvdebienes.backend.repository;

import com.proyectoinvdebienes.backend.domain.enums.AssignmentStatus;
import com.proyectoinvdebienes.backend.domain.model.Assignment;
import com.proyectoinvdebienes.backend.web.dto.EmployeeAssignedAssetDto;
import com.proyectoinvdebienes.backend.web.dto.EmployeeInvestmentSummaryDto;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Query("""
            SELECT new com.proyectoinvdebienes.backend.web.dto.EmployeeInvestmentSummaryDto(
                e.id,
                e.fullName,
                COUNT(a.id),
                COALESCE(SUM(ast.acquisitionCost), 0)
            )
            FROM Assignment a
            JOIN a.employee e
            JOIN a.asset ast
            WHERE a.status = com.proyectoinvdebienes.backend.domain.enums.AssignmentStatus.ACTIVA
            GROUP BY e.id, e.fullName
            ORDER BY COUNT(a.id) DESC
            """)
    List<EmployeeInvestmentSummaryDto> findInvestmentByEmployee();

    @Query("""
            SELECT new com.proyectoinvdebienes.backend.web.dto.EmployeeAssignedAssetDto(
                e.id,
                e.fullName,
                ast.assetCode,
                COALESCE(ast.description, ast.name),
                ast.acquisitionCost
            )
            FROM Assignment a
            JOIN a.employee e
            JOIN a.asset ast
            WHERE e.id = :employeeId
              AND a.status = com.proyectoinvdebienes.backend.domain.enums.AssignmentStatus.ACTIVA
            ORDER BY ast.assetCode ASC
            """)
    List<EmployeeAssignedAssetDto> findActiveAssignedAssetsByEmployeeId(@Param("employeeId") Long employeeId);
}

