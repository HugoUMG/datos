package com.proyectoinvdebienes.backend.web.controller;

import com.proyectoinvdebienes.backend.domain.model.BudgetLine;
import com.proyectoinvdebienes.backend.domain.model.PurchaseInvoice;
import com.proyectoinvdebienes.backend.domain.model.Supplier;
import com.proyectoinvdebienes.backend.service.AcquisitionService;
import com.proyectoinvdebienes.backend.web.dto.CreateBudgetLineRequest;
import com.proyectoinvdebienes.backend.web.dto.CreatePurchaseInvoiceRequest;
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
@RequestMapping("/api/acquisitions")
public class AcquisitionController {

    private final AcquisitionService acquisitionService;

    public AcquisitionController(AcquisitionService acquisitionService) {
        this.acquisitionService = acquisitionService;
    }

    @PostMapping("/invoices")
    @ResponseStatus(HttpStatus.CREATED)
    public PurchaseInvoice createInvoice(@Valid @RequestBody CreatePurchaseInvoiceRequest request) {
        return acquisitionService.createInvoice(request);
    }

    @PostMapping("/suppliers")
    @ResponseStatus(HttpStatus.CREATED)
    public Supplier createSupplier(@Valid @RequestBody CreateSupplierRequest request) {
        return acquisitionService.createSupplier(request);
    }

    @GetMapping("/suppliers")
    public List<Supplier> listSuppliers() {
        return acquisitionService.listSuppliers();
    }

    @PostMapping("/budget-lines")
    @ResponseStatus(HttpStatus.CREATED)
    public BudgetLine createBudgetLine(@Valid @RequestBody CreateBudgetLineRequest request) {
        return acquisitionService.createBudgetLine(request);
    }

    @GetMapping("/budget-lines")
    public List<BudgetLine> listBudgetLines() {
        return acquisitionService.listBudgetLines();
    }
}
