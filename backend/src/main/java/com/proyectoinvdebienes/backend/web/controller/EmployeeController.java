package com.proyectoinvdebienes.backend.web.controller;

import com.proyectoinvdebienes.backend.domain.enums.AssignmentStatus;
import com.proyectoinvdebienes.backend.domain.model.Assignment;
import com.proyectoinvdebienes.backend.domain.model.Disposal;
import com.proyectoinvdebienes.backend.service.AssignmentService;
import com.proyectoinvdebienes.backend.service.DisposalService;
import com.proyectoinvdebienes.backend.service.InventoryService;
import com.proyectoinvdebienes.backend.web.dto.ConfirmAssignmentRequest;
import com.proyectoinvdebienes.backend.web.dto.CreateDisposalRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/employee")
public class EmployeeController {

    private final AssignmentService assignmentService;
    private final DisposalService disposalService;
    private final InventoryService inventoryService;

    public EmployeeController(AssignmentService assignmentService, DisposalService disposalService, InventoryService inventoryService) {
        this.assignmentService = assignmentService;
        this.disposalService = disposalService;
        this.inventoryService = inventoryService;
    }

    @GetMapping("/me/assignments")
    public List<Assignment> myAssignments(Authentication authentication) {
        Long employeeId = assignmentService.findEmployeeIdByUsername(authentication.getName());
        return assignmentService.listByEmployeeAndStatus(employeeId, AssignmentStatus.ACTIVA);
    }

    @GetMapping("/me/pending-assignments")
    public List<Assignment> myPendingAssignments(Authentication authentication) {
        Long employeeId = assignmentService.findEmployeeIdByUsername(authentication.getName());
        return assignmentService.listByEmployeeAndStatus(employeeId, AssignmentStatus.PENDIENTE_CONFIRMACION);
    }

    @PostMapping("/me/assignments/{assignmentId}/confirm")
    public Assignment confirmAssignment(
            @PathVariable Long assignmentId,
            @Valid @RequestBody ConfirmAssignmentRequest request,
            Authentication authentication
    ) {
        Long employeeId = assignmentService.findEmployeeIdByUsername(authentication.getName());
        return assignmentService.confirmAssignment(assignmentId, employeeId);
    }

    @PostMapping("/me/disposals")
    public Disposal requestOwnAssetDisposal(@Valid @RequestBody CreateDisposalRequest request, Authentication authentication) {
        String requestedBy = authentication.getName();
        return disposalService.requestDisposal(new CreateDisposalRequest(request.assetId(), request.reason(), "BAJA", requestedBy));
    }

    @GetMapping(value = "/me/assets/{assetId}/qr.png", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> employeeAssetQr(@PathVariable Long assetId) {
        return ResponseEntity.ok(inventoryService.generateAssetQrPng(assetId));
    }
}
