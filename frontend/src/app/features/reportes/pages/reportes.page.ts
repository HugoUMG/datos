import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Asset, Assignment, Employee } from '../../../core/models/api.models';
import { AssetsApiService } from '../../../core/services/assets-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { downloadBlob, errorMessage } from '../../../core/http-error';
import { ASSET_STATUSES, statusInfo } from '../../../shared/labels';
import { PagerComponent, SortHeaderComponent, TableCtl, exportCsv } from '../../../shared/table';
import { IconComponent, SearchBoxComponent, StatusBadgeComponent } from '../../../shared/ui';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe, DatePipe, IconComponent, SearchBoxComponent, StatusBadgeComponent, SortHeaderComponent, PagerComponent],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Reportes</h1>
          <p>Inversión en activos, reporte general y reporte por empleado.</p>
        </div>
        <div class="row">
          <button type="button" class="btn-secondary" (click)="download('excel')" [disabled]="exporting()"><app-icon name="download" [size]="16" /> Inversión (Excel)</button>
          <button type="button" class="btn-secondary" (click)="download('pdf')" [disabled]="exporting()"><app-icon name="download" [size]="16" /> Inversión (PDF)</button>
        </div>
      </div>

      <div class="kpis">
        <div class="card kpi"><span class="label">Total invertido</span><span class="value">{{ totalInvested() === null ? '…' : (totalInvested() | currency) }}</span></div>
        <div class="card kpi"><span class="label">Activos</span><span class="value">{{ assets().length }}</span></div>
        <div class="card kpi"><span class="label">Asignados</span><span class="value">{{ assignedCount() }}</span></div>
        <div class="card kpi"><span class="label">Valor en almacén</span><span class="value">{{ stockValue() | currency }}</span></div>
      </div>

      <div class="card">
        <div class="tabs" role="tablist">
          <button type="button" role="tab" [class.active]="tab() === 'general'" (click)="tab.set('general')">Reporte general</button>
          <button type="button" role="tab" [class.active]="tab() === 'employee'" (click)="tab.set('employee')">Por empleado</button>
        </div>

        @if (tab() === 'general') {
          @let v = gt.view(assets());
          <div class="toolbar">
            <app-search-box [value]="gt.term()" (valueChange)="gt.setTerm($event)" placeholder="Buscar por código, nombre, responsable…" />
            <select [ngModel]="gt.filter('status')" (ngModelChange)="gt.setFilter('status', $event)" aria-label="Filtrar por estado">
              <option value="">Todos los estados</option>
              @for (s of statuses; track s) { <option [value]="s">{{ label(s) }}</option> }
            </select>
            <span class="count">{{ v.filtered.length }} de {{ v.total }}</span>
            <button type="button" class="btn-secondary btn-sm" (click)="exportGeneral(v.filtered)" [disabled]="!v.filtered.length"><app-icon name="download" [size]="14" /> CSV</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr>
                <th appSort="assetCode" [ctl]="gt">Código</th><th appSort="name" [ctl]="gt">Nombre</th>
                <th appSort="currentCustodian.fullName" [ctl]="gt">Responsable</th><th appSort="acquisitionDate" [ctl]="gt">Ingreso</th>
                <th appSort="status" [ctl]="gt">Estado</th><th appSort="acquisitionCost" [ctl]="gt" class="right">Valor</th>
              </tr></thead>
              <tbody>
                @for (a of v.items; track a.id) {
                  <tr>
                    <td class="mono nowrap">{{ a.assetCode }}</td>
                    <td>@if (canSeeHistory()) { <a class="link-btn" [routerLink]="['/inventario', a.id]">{{ a.name }}</a> } @else { {{ a.name }} }</td>
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
          <app-pager [ctl]="gt" [view]="v" />
        } @else {
          <div class="toolbar">
            <select [ngModel]="employeeId()" (ngModelChange)="selectEmployee($event)" aria-label="Empleado" style="flex:1 1 260px">
              <option [ngValue]="null" disabled>Selecciona un empleado</option>
              @for (e of employees(); track e.id) { <option [ngValue]="e.id">{{ e.fullName }}{{ e.department ? ' · ' + e.department.name : '' }}</option> }
            </select>
            @if (employeeId()) {
              <span class="count">{{ employeeAssignments().length }} registro(s)</span>
              <button type="button" class="btn-secondary btn-sm" (click)="exportEmployee()" [disabled]="!employeeAssignments().length"><app-icon name="download" [size]="14" /> CSV</button>
            }
          </div>
          @if (employeeId()) {
            @let ev = et.view(employeeAssignments());
            <div class="table-wrap">
              <table>
                <thead><tr>
                  <th appSort="asset.assetCode" [ctl]="et">Código</th><th appSort="asset.name" [ctl]="et">Nombre</th>
                  <th appSort="assignedAt" [ctl]="et">Asignado</th><th appSort="returnedAt" [ctl]="et">Devuelto</th>
                  <th appSort="status" [ctl]="et">Estado</th><th appSort="asset.acquisitionCost" [ctl]="et" class="right">Valor</th>
                </tr></thead>
                <tbody>
                  @for (item of ev.items; track item.id) {
                    <tr>
                      <td class="mono">{{ item.asset.assetCode }}</td><td>{{ item.asset.name }}</td>
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
            <app-pager [ctl]="et" [view]="ev" />
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
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly statuses = ASSET_STATUSES;
  readonly tab = signal<'general' | 'employee'>('general');
  readonly totalInvested = signal<number | null>(null);
  readonly assets = signal<Asset[]>([]);
  readonly employees = signal<Employee[]>([]);
  readonly employeeAssignments = signal<Assignment[]>([]);
  readonly employeeId = signal<number | null>(null);
  readonly loading = signal(true);
  readonly exporting = signal(false);
  readonly gt = new TableCtl<Asset>();
  readonly et = new TableCtl<Assignment>();
  /** El historial vive en Inventario; Finanzas no tiene acceso a ese módulo. */
  readonly canSeeHistory = computed(() => this.auth.canAccessModule('inventario'));

  readonly assignedCount = computed(() => this.assets().filter((a) => a.status === 'ASIGNADO').length);
  readonly stockValue = computed(() =>
    this.assets().filter((a) => a.status === 'EN_ALMACEN').reduce((sum, a) => sum + Number(a.acquisitionCost || 0), 0)
  );

  ngOnInit(): void {
    this.api.investedSummary().subscribe({ next: (s) => this.totalInvested.set(s.totalInvested), error: (err) => this.toast.error(errorMessage(err)) });
    this.api.upcomingDisposals().subscribe({
      next: (rows) => this.assets.set(rows),
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
    this.et.page.set(1);
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

  exportGeneral(rows: Asset[]): void {
    exportCsv('reporte-general.csv', [
      { label: 'Código', value: (r) => r.assetCode },
      { label: 'Nombre', value: (r) => r.name },
      { label: 'Responsable', value: (r) => r.currentCustodian?.fullName ?? 'Sin asignar' },
      { label: 'Ingreso', value: (r) => r.acquisitionDate },
      { label: 'Estado', value: (r) => statusInfo(r.status).label },
      { label: 'Valor', value: (r) => r.acquisitionCost }
    ], rows);
  }

  exportEmployee(): void {
    const employee = this.employees().find((e) => e.id === this.employeeId());
    const slug = (employee?.fullName ?? 'empleado').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-');
    exportCsv(`reporte-${slug}.csv`, [
      { label: 'Código', value: (r: Assignment) => r.asset.assetCode },
      { label: 'Nombre', value: (r: Assignment) => r.asset.name },
      { label: 'Asignado', value: (r: Assignment) => r.assignedAt },
      { label: 'Devuelto', value: (r: Assignment) => r.returnedAt },
      { label: 'Estado', value: (r: Assignment) => statusInfo(r.status).label },
      { label: 'Valor', value: (r: Assignment) => r.asset.acquisitionCost }
    ], this.et.filtered(this.employeeAssignments()));
  }
}
