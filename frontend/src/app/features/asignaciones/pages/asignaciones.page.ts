import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Assignment } from '../../../core/models/api.models';
import { AssetsApiService } from '../../../core/services/assets-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="shell">
      <div class="between"><h2>Asignaciones y Resguardos</h2><a class="back-link" routerLink="/menu">← Volver al menú</a></div>

      <div class="card">
        <form [formGroup]="assignmentForm" (ngSubmit)="assign()" class="grid grid-3">
          <label>ID activo
            <input type="number" formControlName="assetId" placeholder="Ej. 1" />
          </label>
          <label>ID empleado
            <input type="number" formControlName="employeeId" placeholder="Ej. 1" />
          </label>
          <input type="date" formControlName="assignedAt" />
          <input type="date" formControlName="expectedReturnAt" />
          <button type="submit">Registrar asignación</button>
        </form>
      </div>

      <div class="card">
        <form [formGroup]="returnForm" (ngSubmit)="returnAsset()" class="grid grid-3">
          <label>ID asignación
            <input type="number" formControlName="assignmentId" placeholder="Ej. 1" />
          </label>
          <button type="submit">Registrar devolución</button>
        </form>
      </div>

      <div class="card">
        <form [formGroup]="employeeForm" (ngSubmit)="loadEmployeeAssignments()" class="grid grid-3">
          <label>Empleado ID
            <input type="number" formControlName="employeeId" placeholder="Ej. 1" />
          </label>
          <button type="submit">Ver historial</button>
          <button type="button" (click)="loadReturns()">Ver devoluciones</button>
        </form>
        <table *ngIf="assignments.length">
          <thead><tr><th>Asignación</th><th>Código del bien</th><th>Nombre del bien</th><th>Estado</th><th>Fecha asignación</th><th>Próxima devolución</th><th>Fecha devolución</th></tr></thead>
          <tbody><tr *ngFor="let item of assignments"><td>{{ item.id }}</td><td>{{ item.asset.assetCode }}</td><td>{{ item.asset.name }}</td><td>{{ item.status }}</td><td>{{ item.assignedAt }}</td><td>{{ item.expectedReturnAt || '-' }}</td><td>{{ item.returnedAt || '-' }}</td></tr></tbody>
        </table>
        <p *ngIf="message">{{ message }}</p>
      </div>
    </section>
  `
})
export class AsignacionesPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AssetsApiService);
  assignments: Assignment[] = [];
  message = '';

  readonly assignmentForm = this.fb.group({
    assetId: [null, [Validators.required, Validators.min(1)]],
    employeeId: [null, [Validators.required, Validators.min(1)]],
    assignedAt: ['', Validators.required],
    expectedReturnAt: ['']
  });
  readonly returnForm = this.fb.group({ assignmentId: [null, [Validators.required, Validators.min(1)]] });
  readonly employeeForm = this.fb.group({ employeeId: [null, [Validators.required, Validators.min(1)]] });

  assign(): void {
    if (this.assignmentForm.invalid) return;
    const payload = this.assignmentForm.getRawValue();
    this.api.createAssignment({
      assetId: payload.assetId!,
      employeeId: payload.employeeId!,
      assignedAt: payload.assignedAt!,
      expectedReturnAt: payload.expectedReturnAt ?? undefined
    }).subscribe({ next: () => (this.message = 'Asignación registrada en estado pendiente de confirmación del empleado'), error: (err) => (this.message = err?.error?.error ?? 'Error') });
  }
  returnAsset(): void { if (this.returnForm.invalid) return; this.api.returnAssignment(this.returnForm.getRawValue().assignmentId!).subscribe({ next: () => (this.message = 'Devolución registrada'), error: (err) => (this.message = err?.error?.error ?? 'Error') }); }
  loadEmployeeAssignments(): void { if (this.employeeForm.invalid) return; this.api.listAssignmentsByEmployee(this.employeeForm.getRawValue().employeeId!).subscribe({ next: (rows) => (this.assignments = rows), error: (err) => (this.message = err?.error?.error ?? 'Error') }); }
  loadReturns(): void { this.api.listReturnedAssignments().subscribe({ next: (rows) => (this.assignments = rows), error: (err) => (this.message = err?.error?.error ?? 'Error') }); }
}
