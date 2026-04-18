package com.proyectoinvdebienes.backend.web.controller;

import com.proyectoinvdebienes.backend.domain.model.Disposal;
import com.proyectoinvdebienes.backend.service.DisposalService;
import com.proyectoinvdebienes.backend.web.dto.ApproveDisposalRequest;
import com.proyectoinvdebienes.backend.web.dto.CreateDisposalRequest;
import com.proyectoinvdebienes.backend.web.dto.RejectDisposalRequest;
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
@RequestMapping("/api/disposals")
public class DisposalController {

    private final DisposalService disposalService;

    public DisposalController(DisposalService disposalService) {
        this.disposalService = disposalService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Disposal requestDisposal(@Valid @RequestBody CreateDisposalRequest request) {
        return disposalService.requestDisposal(request);
    }

    @PostMapping("/{id}/approve")
    public Disposal approveDisposal(@PathVariable Long id, @Valid @RequestBody ApproveDisposalRequest request) {
        return disposalService.approveDisposal(id, request);
    }

    @PostMapping("/{id}/reject")
    public Disposal rejectDisposal(@PathVariable Long id, @Valid @RequestBody RejectDisposalRequest request) {
        return disposalService.rejectDisposal(id, request);
    }

    @GetMapping("/pending")
    public List<Disposal> pendingDisposals() {
        return disposalService.findPending();
    }
}
