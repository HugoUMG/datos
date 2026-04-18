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
      <div class="between"><h2>Proveedores y Partidas Presupuestarias</h2><a class="back-link" routerLink="/menu">← Volver al menú</a></div>

      <div class="card">
        <h3>Crear proveedor</h3>
        <form [formGroup]="supplierForm" (ngSubmit)="createSupplier()" class="grid grid-3">
          <input formControlName="name" placeholder="Nombre" />
          <input formControlName="taxId" placeholder="RFC/NIT" />
          <input formControlName="email" placeholder="Email" />
          <input formControlName="phone" placeholder="Teléfono" />
          <button type="submit">Guardar proveedor</button>
        </form>
      </div>

      <div class="card">
        <h3>Crear partida presupuestaria</h3>
        <form [formGroup]="budgetForm" (ngSubmit)="createBudgetLine()" class="grid grid-3">
          <input formControlName="code" placeholder="Código" />
          <input formControlName="description" placeholder="Descripción" />
          <input type="number" formControlName="allocatedAmount" placeholder="Costo asignado" />
          <button type="submit">Guardar partida</button>
        </form>
      </div>

      <div class="card">
        <div class="between"><h3>Lista de proveedores</h3><button type="button" (click)="loadData()">Actualizar</button></div>
        <table *ngIf="suppliers.length">
          <thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Estado</th></tr></thead>
          <tbody><tr *ngFor="let item of suppliers"><td>{{ item.id }}</td><td>{{ item.name }}</td><td>{{ item.email }}</td><td>{{ item.phone || '-' }}</td><td>{{ item.active ? 'Activo' : 'Inactivo' }}</td></tr></tbody>
        </table>
      </div>

      <div class="card">
        <h3>Lista de partidas presupuestarias</h3>
        <table *ngIf="budgetLines.length">
          <thead><tr><th>ID</th><th>Código</th><th>Descripción</th><th>Costo asignado</th></tr></thead>
          <tbody><tr *ngFor="let item of budgetLines"><td>{{ item.id }}</td><td>{{ item.code }}</td><td>{{ item.description }}</td><td>{{ item.allocatedAmount }}</td></tr></tbody>
        </table>
      </div>

      <p *ngIf="message">{{ message }}</p>
    </section>
  `
})
export class CatalogosPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AssetsApiService);

  suppliers: Supplier[] = [];
  budgetLines: BudgetLine[] = [];
  message = '';

  readonly supplierForm = this.fb.group({
    name: ['', Validators.required],
    taxId: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['']
  });

  readonly budgetForm = this.fb.group({
    code: ['', Validators.required],
    description: ['', Validators.required],
    allocatedAmount: [null, [Validators.required, Validators.min(0.01)]]
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.listSuppliers().subscribe({ next: (rows) => (this.suppliers = rows) });
    this.api.listBudgetLines().subscribe({ next: (rows) => (this.budgetLines = rows) });
  }

  createSupplier(): void {
    if (this.supplierForm.invalid) return;
    const payload = this.supplierForm.getRawValue();
    this.api.createSupplier({ name: payload.name!, taxId: payload.taxId!, email: payload.email!, phone: payload.phone ?? undefined }).subscribe({
      next: () => {
        this.message = 'Proveedor guardado';
        this.supplierForm.reset();
        this.loadData();
      },
      error: (err) => (this.message = err?.error?.error ?? 'Error')
    });
  }

  createBudgetLine(): void {
    if (this.budgetForm.invalid) return;
    const payload = this.budgetForm.getRawValue();
    this.api.createBudgetLine({ code: payload.code!, description: payload.description!, allocatedAmount: payload.allocatedAmount! }).subscribe({
      next: () => {
        this.message = 'Partida guardada';
        this.budgetForm.reset();
        this.loadData();
      },
      error: (err) => (this.message = err?.error?.error ?? 'Error')
    });
  }
}
