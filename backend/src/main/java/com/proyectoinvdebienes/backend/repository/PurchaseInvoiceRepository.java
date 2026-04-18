package com.proyectoinvdebienes.backend.repository;

import com.proyectoinvdebienes.backend.domain.model.PurchaseInvoice;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseInvoiceRepository extends JpaRepository<PurchaseInvoice, Long> {
    Optional<PurchaseInvoice> findByInvoiceNumber(String invoiceNumber);
}
