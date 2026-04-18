import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Asset, Assignment } from '../../../core/models/api.models';
import { AssetsApiService } from '../../../core/services/assets-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe, RouterLink],
  template: `
    <section class="shell">
      <div class="between"><h2>Reportes</h2><a class="back-link" routerLink="/menu">← Volver al menú</a></div>

      <div class="card">
        <button type="button" (click)="loadSummary()">Cargar total invertido</button>
        <p *ngIf="totalInvested !== null"><strong>{{ totalInvested | currency : 'Q' }}</strong></p>
      </div>

      <div class="card">
        <form [formGroup]="employeeForm" (ngSubmit)="loadEmployeeReport()" class="grid grid-3">
          <label>Empleado ID
            <input type="number" formControlName="employeeId" placeholder="Ej. 1" />
          </label>
          <button type="submit">Reporte por empleado</button>
        </form>
        <table *ngIf="employeeAssignments.length">
          <thead><tr><th>Empleado ID</th><th>Código</th><th>Nombre</th><th>Valor unitario</th><th>Asignación</th><th>Devolución</th><th>Estado</th></tr></thead>
          <tbody>
            <tr *ngFor="let item of employeeAssignments">
              <td>{{ employeeIdDisplay(item) }}</td>
              <td>{{ item.asset?.assetCode || '-' }}</td>
              <td>{{ item.asset?.name || '-' }}</td>
              <td>{{ item.asset?.acquisitionCost ?? '-' }}</td>
              <td>{{ item.assignedAt || '-' }}</td>
              <td>{{ item.returnedAt || '-' }}</td>
              <td>{{ item.asset?.status || item.status || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <button type="button" (click)="loadUpcomingDisposals()">Reporte general</button>
        <table *ngIf="upcoming.length">
          <thead><tr><th>ID</th><th>Código</th><th>Nombre</th><th>Asignado a</th><th>Valor</th><th>Ingreso</th><th>Estado</th></tr></thead>
          <tbody><tr *ngFor="let asset of upcoming"><td>{{ asset.id }}</td><td>{{ asset.assetCode }}</td><td>{{ asset.name }}</td><td>{{ asset.currentCustodian?.id || 'desasignado' }}</td><td>{{ asset.acquisitionCost }}</td><td>{{ asset.acquisitionDate }}</td><td>{{ asset.status }}</td></tr></tbody>
        </table>
      </div>

      <div class="card grid grid-3">
        <button type="button" (click)="download('excel')">Exportar Excel</button>
        <button type="button" (click)="download('pdf')">Exportar PDF</button>
      </div>

      <p *ngIf="message">{{ message }}</p>
    </section>
  `
})
export class ReportesPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AssetsApiService);

  totalInvested: number | null = null;
  employeeAssignments: Assignment[] = [];
  upcoming: Asset[] = [];
  message = '';
  selectedEmployeeId: number | null = null;
  readonly employeeForm = this.fb.group({ employeeId: [null, [Validators.required, Validators.min(1)]] });

  loadSummary(): void { this.api.investedSummary().subscribe({ next: (summary) => (this.totalInvested = summary.totalInvested), error: (err) => (this.message = err?.error?.error ?? 'Error') }); }
  loadEmployeeReport(): void { if (this.employeeForm.invalid) return; const employeeId = this.employeeForm.getRawValue().employeeId!; this.selectedEmployeeId = employeeId; this.api.employeeReport(employeeId).subscribe({ next: (rows) => (this.employeeAssignments = rows ?? []), error: (err) => (this.message = err?.error?.error ?? 'Error') }); }
  loadUpcomingDisposals(): void { this.api.upcomingDisposals().subscribe({ next: (rows) => (this.upcoming = rows), error: (err) => (this.message = err?.error?.error ?? 'Error') }); }
  download(format: 'excel' | 'pdf'): void { this.api.exportInvested(format).subscribe({ next: (blob) => { const ext = format === 'pdf' ? 'pdf' : 'csv'; const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `reporte-bienes-invertidos.${ext}`; a.click(); URL.revokeObjectURL(url); }, error: (err) => (this.message = err?.error?.error ?? 'Error') }); }

  employeeIdDisplay(item: Assignment): string | number {
    return item?.employee?.id ?? this.selectedEmployeeId ?? 'desasignado';
  }
}
