import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BudgetLine, Supplier } from '../../../core/models/api.models';
import { AssetsApiService } from '../../../core/services/assets-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="shell">
      <div class="between">
        <h2>Adquisiciones</h2>
        <a class="back-link" routerLink="/menu">← Volver al menú</a>
      </div>

      <div class="card">
        <form [formGroup]="invoiceForm" (ngSubmit)="submit()" class="grid grid-3">
          <label>Número de factura
            <input formControlName="invoiceNumber" placeholder="Ej. FAC-2026-0001" />
          </label>
          <input type="date" formControlName="invoiceDate" />
          <label>Total
            <input type="number" formControlName="totalAmount" placeholder="Ej. 15230.50" />
          </label>
          <label>ID proveedor
            <input type="number" formControlName="supplierId" placeholder="Ej. 1" />
          </label>
          <label>ID partida presupuestaria
            <input type="number" formControlName="budgetLineId" placeholder="Ej. 1" />
          </label>
          <textarea formControlName="notes" placeholder="Notas"></textarea>
          <button type="submit">Registrar factura</button>
        </form>
        <p *ngIf="message">{{ message }}</p>
      </div>

      <div class="card">
        <h3>Lista de proveedores</h3>
        <table *ngIf="suppliers.length">
          <thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Estado</th></tr></thead>
          <tbody><tr *ngFor="let p of suppliers"><td>{{ p.id }}</td><td>{{ p.name }}</td><td>{{ p.email }}</td><td>{{ p.phone || '-' }}</td><td>{{ p.active ? 'Activo' : 'Inactivo' }}</td></tr></tbody>
        </table>
      </div>

      <div class="card">
        <h3>Partidas presupuestarias</h3>
        <table *ngIf="budgetLines.length">
          <thead><tr><th>ID</th><th>Código</th><th>Descripción</th><th>Costo asignado</th></tr></thead>
          <tbody><tr *ngFor="let b of budgetLines"><td>{{ b.id }}</td><td>{{ b.code }}</td><td>{{ b.description }}</td><td>{{ b.allocatedAmount }}</td></tr></tbody>
        </table>
      </div>
    </section>
  `
})
export class AdquisicionesPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AssetsApiService);

  message = '';
  suppliers: Supplier[] = [];
  budgetLines: BudgetLine[] = [];
  readonly invoiceForm = this.fb.group({
    invoiceNumber: ['', Validators.required],
    invoiceDate: ['', Validators.required],
    totalAmount: [null, [Validators.required, Validators.min(0.01)]],
    supplierId: [null, [Validators.required, Validators.min(1)]],
    budgetLineId: [null, [Validators.required, Validators.min(1)]],
    notes: ['']
  });

  ngOnInit(): void {
    this.loadCatalogs();
  }

  loadCatalogs(): void {
    this.api.listSuppliers().subscribe({ next: (rows) => (this.suppliers = rows) });
    this.api.listBudgetLines().subscribe({ next: (rows) => (this.budgetLines = rows) });
  }

  submit(): void {
    if (this.invoiceForm.invalid) return;
    const payload = this.invoiceForm.getRawValue();

    const supplier = this.suppliers.find((item) => item.id === payload.supplierId);
    if (supplier && !supplier.active) {
      this.message = `El proveedor "${supplier.name}" no está activo.`;
      return;
    }

    this.api
      .createInvoice({
        invoiceNumber: payload.invoiceNumber!,
        invoiceDate: payload.invoiceDate!,
        totalAmount: payload.totalAmount!,
        supplierId: payload.supplierId!,
        budgetLineId: payload.budgetLineId!,
        notes: payload.notes ?? undefined
      })
      .subscribe({
        next: (invoice) => {
          this.message = `Factura registrada: ${invoice.invoiceNumber}`;
          this.invoiceForm.reset();
        },
        error: (err) => (this.message = err?.error?.error ?? 'No fue posible registrar la factura.')
      });
  }
}
