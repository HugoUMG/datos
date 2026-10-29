package com.proyectoinvdebienes.backend.service;

import com.proyectoinvdebienes.backend.domain.model.Asset;
import com.proyectoinvdebienes.backend.domain.model.Assignment;
import com.proyectoinvdebienes.backend.domain.model.Disposal;
import com.proyectoinvdebienes.backend.domain.model.PurchaseInvoice;
import java.util.List;

/** Trazabilidad completa de un activo: de qué factura vino, a quién se asignó y si se dio de baja. */
public record AssetHistory(
        Asset asset,
        PurchaseInvoice invoice,
        List<Assignment> assignments,
        List<Disposal> disposals
) {
}
