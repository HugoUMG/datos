package com.proyectoinvdebienes.backend.web.controller;

import com.proyectoinvdebienes.backend.domain.model.Assignment;
import com.proyectoinvdebienes.backend.service.AssignmentService;
import com.proyectoinvdebienes.backend.web.dto.CreateAssignmentRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    private final AssignmentService assignmentService;

    public AssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Assignment assignAsset(@Valid @RequestBody CreateAssignmentRequest request) {
        return assignmentService.assignAsset(request);
    }

    @PostMapping("/{assignmentId}/return")
    public Assignment returnAsset(@PathVariable Long assignmentId) {
        return assignmentService.returnAssignment(assignmentId);
    }

    @GetMapping("/employee/{employeeId}")
    public List<Assignment> byEmployee(@PathVariable Long employeeId) {
        return assignmentService.listByEmployee(employeeId);
    }

    @GetMapping
    public List<Assignment> allAssignments() {
        return assignmentService.listAll();
    }

    @GetMapping("/returns")
    public List<Assignment> returnedAssignments() {
        return assignmentService.listReturned();
    }
}
