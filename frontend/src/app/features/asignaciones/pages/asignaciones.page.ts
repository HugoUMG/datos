import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Asset, Assignment, Employee } from '../../../core/models/api.models';
import { AssetsApiService } from '../../../core/services/assets-api.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { errorMessage } from '../../../core/http-error';
import { ASSIGNMENT_STATUSES, statusInfo } from '../../../shared/labels';
import { SearchPipe } from '../../../shared/search.pipe';
import { FieldErrorComponent, IconComponent, SearchBoxComponent, StatusBadgeComponent } from '../../../shared/ui';
import { MAX_YEARS_AHEAD, MIN_DATE, dateRange, notBefore, todayIso, yearsAheadIso } from '../../../shared/validators';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DatePipe, SearchPipe, FieldErrorComponent, IconComponent, SearchBoxComponent, StatusBadgeComponent],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Asignaciones y resguardos</h1>
          <p>Entrega activos a empleados; el empleado confirma la recepción desde su portal.</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div><h2>Nueva asignación</h2><p>Solo se listan activos disponibles en almacén.</p></div></div>
        <form [formGroup]="form" (ngSubmit)="assign()" class="form-grid" novalidate>
          <div class="field">
            <label for="as-asset">Activo<span class="req">*</span></label>
            <select id="as-asset" formControlName="assetId">
              <option [ngValue]="null" disabled>{{ availableAssets().length ? 'Selecciona un activo' : 'No hay activos disponibles' }}</option>
              @for (a of availableAssets(); track a.id) { <option [ngValue]="a.id">{{ a.assetCode }} — {{ a.name }}</option> }
            </select>
            <app-field-error [control]="form.controls.assetId" />
          </div>
          <div class="field">
            <label for="as-emp">Empleado<span class="req">*</span></label>
            <select id="as-emp" formControlName="employeeId">
              <option [ngValue]="null" disabled>Selecciona un empleado</option>
              @for (e of employees(); track e.id) { <option [ngValue]="e.id">{{ e.fullName }}{{ e.department ? ' · ' + e.department.name : '' }}</option> }
            </select>
            <app-field-error [control]="form.controls.employeeId" />
          </div>
          <div class="field">
            <label for="as-date">Fecha de asignación<span class="req">*</span></label>
            <input id="as-date" type="date" formControlName="assignedAt" [min]="minDate" [max]="maxDate" (change)="form.controls.expectedReturnAt.updateValueAndValidity()" />
            <app-field-error [control]="form.controls.assignedAt" />
          </div>
          <div class="field">
            <label for="as-ret">Devolución prevista</label>
            <input id="as-ret" type="date" formControlName="expectedReturnAt" [min]="form.controls.assignedAt.value || minDate" [max]="maxDate" />
            <span class="hint">Opcional.</span>
            <app-field-error [control]="form.controls.expectedReturnAt" />
          </div>
          <div class="form-actions">
            <button type="submit" [disabled]="saving()">@if (saving()) { <span class="spinner"></span> } Registrar asignación</button>
          </div>
        </form>
      </div>

      <div class="card">
        <div class="card-header">
          <h2>Historial de asignaciones</h2>
          <button type="button" class="btn-secondary btn-sm" (click)="load()"><app-icon name="refresh" [size]="14" /> Actualizar</button>
        </div>
        @let rows = assignments() | search: term() : { status: statusFilter() };
        <div class="toolbar">
          <app-search-box [(value)]="term" placeholder="Buscar por activo, empleado…" />
          <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)" aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            @for (s of statuses; track s) { <option [value]="s">{{ label(s) }}</option> }
          </select>
          <span class="count">{{ rows.length }} de {{ assignments().length }}</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Activo</th><th>Empleado</th><th>Asignado</th><th>Devolución prevista</th><th>Devuelto</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              @for (item of rows; track item.id) {
                <tr>
                  <td><span class="mono">{{ item.asset.assetCode }}</span><br /><span class="small muted">{{ item.asset.name }}</span></td>
                  <td>{{ item.employee?.fullName || '—' }}</td>
                  <td class="nowrap">{{ item.assignedAt | date: 'dd/MM/yyyy' }}</td>
                  <td class="nowrap">{{ (item.expectedReturnAt | date: 'dd/MM/yyyy') || '—' }}</td>
                  <td class="nowrap">{{ (item.returnedAt | date: 'dd/MM/yyyy') || '—' }}</td>
                  <td><app-status-badge [status]="item.status" /></td>
                  <td>
                    @if (item.status === 'ACTIVA') {
                      <button type="button" class="btn-secondary btn-sm" (click)="returnAsset(item)"><app-icon name="undo" [size]="14" /> Registrar devolución</button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="empty">
                  @if (loading()) { <span class="spinner"></span> Cargando… }
                  @else if (term() || statusFilter()) { <strong>Sin resultados</strong>Ajusta la búsqueda o el filtro. }
                  @else { <strong>Aún no hay asignaciones</strong> }
                </td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `
})
export class AsignacionesPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AssetsApiService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly minDate = MIN_DATE;
  readonly maxDate = yearsAheadIso(MAX_YEARS_AHEAD);
  readonly statuses = ASSIGNMENT_STATUSES;

  readonly assignments = signal<Assignment[]>([]);
  readonly assets = signal<Asset[]>([]);
  readonly employees = signal<Employee[]>([]);
  readonly availableAssets = computed(() => this.assets().filter((a) => a.status === 'EN_ALMACEN'));
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly term = signal('');
  readonly statusFilter = signal('');

  readonly form = this.fb.group({
    assetId: [null as number | null, Validators.required],
    employeeId: [null as number | null, Validators.required],
    assignedAt: [todayIso(), [Validators.required, dateRange(MIN_DATE, () => this.maxDate)]],
    expectedReturnAt: ['', [dateRange(MIN_DATE, () => this.maxDate), notBefore('assignedAt', 'la fecha de asignación')]]
  });

  ngOnInit(): void {
    this.load();
    this.api.listEmployees().subscribe({ next: (rows) => this.employees.set(rows) });
  }

  label(status: string): string {
    return statusInfo(status).label;
  }

  load(): void {
    this.loading.set(true);
    this.api.listAssets().subscribe({ next: (rows) => this.assets.set(rows) });
    this.api.listAssignments().subscribe({
      next: (rows) => this.assignments.set([...rows].sort((a, b) => b.id - a.id)),
      error: (err) => this.toast.error(errorMessage(err, 'No se pudieron cargar las asignaciones.')),
      complete: () => this.loading.set(false)
    });
  }

  assign(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.api.createAssignment({
      assetId: v.assetId!,
      employeeId: v.employeeId!,
      assignedAt: v.assignedAt!,
      expectedReturnAt: v.expectedReturnAt || undefined
    }).subscribe({
      next: () => {
        this.toast.success('Asignación registrada. Queda pendiente de que el empleado la confirme.');
        this.form.reset({ assignedAt: todayIso(), expectedReturnAt: '' });
        this.load();
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err, 'No fue posible registrar la asignación.'));
        this.saving.set(false);
      }
    });
  }

  async returnAsset(item: Assignment): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Registrar devolución',
      message: `¿Confirmas que ${item.employee?.fullName ?? 'el empleado'} devolvió ${item.asset.assetCode} — ${item.asset.name}? El activo volverá al almacén.`,
      confirmText: 'Registrar devolución'
    });
    if (!ok) return;
    this.api.returnAssignment(item.id).subscribe({
      next: () => {
        this.toast.success(`Devolución de ${item.asset.assetCode} registrada.`);
        this.load();
      },
      error: (err) => this.toast.error(errorMessage(err, 'No fue posible registrar la devolución.'))
    });
  }
}
