import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Asset, Assignment, Employee } from '../../../core/models/api.models';
import { AssetsApiService } from '../../../core/services/assets-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { downloadBlob, errorMessage } from '../../../core/http-error';
import { ASSET_STATUSES, statusInfo } from '../../../shared/labels';
import { SearchPipe } from '../../../shared/search.pipe';
import { IconComponent, SearchBoxComponent, StatusBadgeComponent } from '../../../shared/ui';

@Component({
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, SearchPipe, IconComponent, SearchBoxComponent, StatusBadgeComponent],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Reportes</h1>
          <p>Inversión en activos, reporte general y reporte por empleado.</p>
        </div>
        <div class="row">
          <button type="button" class="btn-secondary" (click)="download('excel')" [disabled]="exporting()"><app-icon name="download" [size]="16" /> Exportar Excel</button>
          <button type="button" class="btn-secondary" (click)="download('pdf')" [disabled]="exporting()"><app-icon name="download" [size]="16" /> Exportar PDF</button>
        </div>
      </div>

      <div class="kpis">
        <div class="card kpi"><span class="label">Total invertido</span><span class="value">{{ totalInvested() === null ? '…' : (totalInvested() | currency) }}</span></div>
        <div class="card kpi"><span class="label">Activos</span><span class="value">{{ upcoming().length }}</span></div>
        <div class="card kpi"><span class="label">Asignados</span><span class="value">{{ assignedCount() }}</span></div>
        <div class="card kpi"><span class="label">Valor en almacén</span><span class="value">{{ stockValue() | currency }}</span></div>
      </div>

      <div class="card">
        <div class="tabs" role="tablist">
          <button type="button" role="tab" [class.active]="tab() === 'general'" (click)="tab.set('general')">Reporte general</button>
          <button type="button" role="tab" [class.active]="tab() === 'employee'" (click)="tab.set('employee')">Por empleado</button>
        </div>

        @if (tab() === 'general') {
          @let rows = upcoming() | search: term() : { status: statusFilter() };
          <div class="toolbar">
            <app-search-box [(value)]="term" placeholder="Buscar por código, nombre, responsable…" />
            <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)" aria-label="Filtrar por estado">
              <option value="">Todos los estados</option>
              @for (s of statuses; track s) { <option [value]="s">{{ label(s) }}</option> }
            </select>
            <span class="count">{{ rows.length }} de {{ upcoming().length }}</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Código</th><th>Nombre</th><th>Responsable</th><th>Ingreso</th><th>Estado</th><th class="right">Valor</th></tr></thead>
              <tbody>
                @for (a of rows; track a.id) {
                  <tr>
                    <td class="mono nowrap">{{ a.assetCode }}</td><td>{{ a.name }}</td>
                    <td>{{ a.currentCustodian?.fullName || 'Sin asignar' }}</td>
                    <td class="nowrap">{{ a.acquisitionDate | date: 'dd/MM/yyyy' }}</td>
                    <td><app-status-badge [status]="a.status" /></td>
                    <td class="right nowrap">{{ a.acquisitionCost | currency }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="empty">@if (loading()) { <span class="spinner"></span> Cargando… } @else { Sin resultados. }</td></tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="toolbar">
            <select [ngModel]="employeeId()" (ngModelChange)="selectEmployee($event)" aria-label="Empleado" style="flex:1 1 260px">
              <option [ngValue]="null" disabled>Selecciona un empleado</option>
              @for (e of employees(); track e.id) { <option [ngValue]="e.id">{{ e.fullName }}{{ e.department ? ' · ' + e.department.name : '' }}</option> }
            </select>
            @if (employeeId()) { <span class="count">{{ employeeAssignments().length }} registro(s)</span> }
          </div>
          @if (employeeId()) {
            <div class="table-wrap">
              <table>
                <thead><tr><th>Código</th><th>Nombre</th><th>Asignado</th><th>Devuelto</th><th>Estado</th><th class="right">Valor</th></tr></thead>
                <tbody>
                  @for (item of employeeAssignments(); track item.id) {
                    <tr>
                      <td class="mono">{{ item.asset.assetCode || '—' }}</td><td>{{ item.asset.name || '—' }}</td>
                      <td class="nowrap">{{ (item.assignedAt | date: 'dd/MM/yyyy') || '—' }}</td>
                      <td class="nowrap">{{ (item.returnedAt | date: 'dd/MM/yyyy') || '—' }}</td>
                      <td><app-status-badge [status]="item.status" /></td>
                      <td class="right nowrap">{{ item.asset.acquisitionCost | currency }}</td>
                    </tr>
                  } @empty {
                    <tr><td colspan="6" class="empty">Este empleado no tiene asignaciones registradas.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <p class="empty">Elige un empleado para ver su historial de bienes.</p>
          }
        }
      </div>
    </section>
  `
})
export class ReportesPage implements OnInit {
  private readonly api = inject(AssetsApiService);
  private readonly toast = inject(ToastService);

  readonly statuses = ASSET_STATUSES;
  readonly tab = signal<'general' | 'employee'>('general');
  readonly totalInvested = signal<number | null>(null);
  readonly upcoming = signal<Asset[]>([]);
  readonly employees = signal<Employee[]>([]);
  readonly employeeAssignments = signal<Assignment[]>([]);
  readonly employeeId = signal<number | null>(null);
  readonly loading = signal(true);
  readonly exporting = signal(false);
  readonly term = signal('');
  readonly statusFilter = signal('');

  readonly assignedCount = computed(() => this.upcoming().filter((a) => a.status === 'ASIGNADO').length);
  readonly stockValue = computed(() =>
    this.upcoming().filter((a) => a.status === 'EN_ALMACEN').reduce((sum, a) => sum + Number(a.acquisitionCost || 0), 0)
  );

  ngOnInit(): void {
    this.api.investedSummary().subscribe({ next: (s) => this.totalInvested.set(s.totalInvested), error: (err) => this.toast.error(errorMessage(err)) });
    this.api.upcomingDisposals().subscribe({
      next: (rows) => this.upcoming.set(rows),
      error: (err) => this.toast.error(errorMessage(err, 'No se pudo cargar el reporte general.')),
      complete: () => this.loading.set(false)
    });
    this.api.listEmployees().subscribe({ next: (rows) => this.employees.set(rows) });
  }

  label(status: string): string {
    return statusInfo(status).label;
  }

  selectEmployee(id: number): void {
    this.employeeId.set(id);
    this.api.employeeReport(id).subscribe({
      next: (rows) => this.employeeAssignments.set(rows ?? []),
      error: (err) => this.toast.error(errorMessage(err, 'No se pudo cargar el reporte del empleado.'))
    });
  }

  download(format: 'excel' | 'pdf'): void {
    this.exporting.set(true);
    this.api.exportInvested(format).subscribe({
      next: (blob) => {
        downloadBlob(blob, `reporte-bienes-invertidos.${format === 'pdf' ? 'pdf' : 'csv'}`);
        this.exporting.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err, 'No se pudo generar el archivo.'));
        this.exporting.set(false);
      }
    });
  }
}
