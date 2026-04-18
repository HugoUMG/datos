package com.proyectoinvdebienes.backend.service;

import com.proyectoinvdebienes.backend.domain.model.BudgetLine;
import com.proyectoinvdebienes.backend.domain.model.PurchaseInvoice;
import com.proyectoinvdebienes.backend.domain.model.Supplier;
import com.proyectoinvdebienes.backend.repository.BudgetLineRepository;
import com.proyectoinvdebienes.backend.repository.PurchaseInvoiceRepository;
import com.proyectoinvdebienes.backend.repository.SupplierRepository;
import com.proyectoinvdebienes.backend.web.dto.CreateBudgetLineRequest;
import com.proyectoinvdebienes.backend.web.dto.CreatePurchaseInvoiceRequest;
import com.proyectoinvdebienes.backend.web.dto.CreateSupplierRequest;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AcquisitionService {

    private final PurchaseInvoiceRepository purchaseInvoiceRepository;
    private final SupplierRepository supplierRepository;
    private final BudgetLineRepository budgetLineRepository;

    public AcquisitionService(
            PurchaseInvoiceRepository purchaseInvoiceRepository,
            SupplierRepository supplierRepository,
            BudgetLineRepository budgetLineRepository
    ) {
        this.purchaseInvoiceRepository = purchaseInvoiceRepository;
        this.supplierRepository = supplierRepository;
        this.budgetLineRepository = budgetLineRepository;
    }

    public PurchaseInvoice createInvoice(CreatePurchaseInvoiceRequest request) {
        if (purchaseInvoiceRepository.findByInvoiceNumber(request.invoiceNumber()).isPresent()) {
            throw new BusinessException("La factura ya existe: " + request.invoiceNumber());
        }

        Supplier supplier = supplierRepository.findById(request.supplierId())
                .orElseThrow(() -> new NotFoundException("Proveedor no encontrado"));

        if (!supplier.isActive()) {
            throw new BusinessException("El proveedor \"" + supplier.getName() + "\" no está activo.");
        }

        BudgetLine budgetLine = budgetLineRepository.findById(request.budgetLineId())
                .orElseThrow(() -> new NotFoundException("Partida presupuestaria no encontrada"));

        PurchaseInvoice invoice = new PurchaseInvoice();
        invoice.setInvoiceNumber(request.invoiceNumber());
        invoice.setInvoiceDate(request.invoiceDate());
        invoice.setTotalAmount(request.totalAmount());
        invoice.setSupplier(supplier);
        invoice.setBudgetLine(budgetLine);
        invoice.setNotes(request.notes());

        return purchaseInvoiceRepository.save(invoice);
    }

    public Supplier createSupplier(CreateSupplierRequest request) {
        Supplier supplier = new Supplier();
        supplier.setName(request.name());
        supplier.setTaxId(request.taxId());
        supplier.setEmail(request.email());
        supplier.setPhone(request.phone());
        supplier.setActive(true);
        return supplierRepository.save(supplier);
    }

    public List<Supplier> listSuppliers() {
        return supplierRepository.findAll();
    }

    public BudgetLine createBudgetLine(CreateBudgetLineRequest request) {
        BudgetLine budgetLine = new BudgetLine();
        budgetLine.setCode(request.code());
        budgetLine.setDescription(request.description());
        budgetLine.setAllocatedAmount(request.allocatedAmount());
        return budgetLineRepository.save(budgetLine);
    }

    public List<BudgetLine> listBudgetLines() {
        return budgetLineRepository.findAll();
    }
}
