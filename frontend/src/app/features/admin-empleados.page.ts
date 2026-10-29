import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Department, Employee } from '../core/models/api.models';
import { AssetsApiService } from '../core/services/assets-api.service';
import { ToastService } from '../core/services/toast.service';
import { errorMessage } from '../core/http-error';
import { RestrictDirective } from '../shared/restrict.directive';
import { PagerComponent, SortHeaderComponent, TableCtl, exportCsv } from '../shared/table';
import { FieldErrorComponent, IconComponent, SearchBoxComponent } from '../shared/ui';
import { COST_CENTER_PATTERN, PERSON_NAME_PATTERN } from '../shared/validators';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RestrictDirective, FieldErrorComponent, IconComponent, SearchBoxComponent, SortHeaderComponent, PagerComponent],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Empleados</h1>
          <p>Personas que pueden recibir activos, organizadas por departamento. Para que entren al portal, crea su cuenta en Usuarios.</p>
        </div>
      </div>

      <div class="card">
        <div class="tabs" role="tablist">
          <button type="button" role="tab" [class.active]="tab() === 'employees'" (click)="tab.set('employees')">Empleados ({{ employees().length }})</button>
          <button type="button" role="tab" [class.active]="tab() === 'departments'" (click)="tab.set('departments')">Departamentos ({{ departments().length }})</button>
        </div>

        @if (tab() === 'employees') {
          @if (!departments().length) {
            <div class="alert alert-info" style="margin-bottom:1rem">
              Primero crea al menos un departamento en la pestaña <button type="button" class="link-btn" (click)="tab.set('departments')">Departamentos</button>.
            </div>
          }
          <form [formGroup]="form" (ngSubmit)="saveEmployee()" class="form-grid" novalidate>
            <div class="field">
              <label for="em-name">Nombre completo<span class="req">*</span></label>
              <input id="em-name" formControlName="fullName" placeholder="Nombre y apellido" maxlength="120" appRestrict="name" />
              <app-field-error [control]="form.controls.fullName" patternHint="El nombre solo puede contener letras y espacios." />
            </div>
            <div class="field">
              <label for="em-email">Email<span class="req">*</span></label>
              <input id="em-email" type="email" formControlName="email" placeholder="nombre@empresa.com" maxlength="120" />
              <app-field-error [control]="form.controls.email" />
            </div>
            <div class="field">
              <label for="em-dep">Departamento<span class="req">*</span></label>
              <select id="em-dep" formControlName="departmentId">
                <option [ngValue]="null" disabled>Selecciona un departamento</option>
                @for (dep of departments(); track dep.id) { <option [ngValue]="dep.id">{{ dep.name }}{{ dep.costCenterCode ? ' (' + dep.costCenterCode + ')' : '' }}</option> }
              </select>
              <app-field-error [control]="form.controls.departmentId" />
            </div>
            <div class="form-actions">
              @if (editingEmployee(); as e) {
                <span class="muted small" style="margin-right:auto">Editando: <strong>{{ e.fullName }}</strong></span>
                <button type="button" class="btn-secondary" (click)="cancelEmployee()">Cancelar</button>
                <button type="submit" [disabled]="saving()"><app-icon name="check" [size]="16" /> Guardar cambios</button>
              } @else {
                <button type="submit" [disabled]="saving() || !departments().length"><app-icon name="plus" [size]="16" /> Registrar empleado</button>
              }
            </div>
          </form>

          @let v = t.view(employees());
          <div class="toolbar" style="margin-top:1.25rem">
            <app-search-box [value]="t.term()" (valueChange)="t.setTerm($event)" placeholder="Buscar por nombre, email o departamento…" />
            <select [value]="t.filter('department.id')" (change)="t.setFilter('department.id', depValue($any($event.target).value))" aria-label="Filtrar por departamento">
              <option value="">Todos los departamentos</option>
              @for (dep of departments(); track dep.id) { <option [value]="dep.id">{{ dep.name }}</option> }
            </select>
            <span class="count">{{ v.filtered.length }} de {{ v.total }}</span>
            <button type="button" class="btn-secondary btn-sm" (click)="exportEmployees(v.filtered)" [disabled]="!v.filtered.length"><app-icon name="download" [size]="14" /> CSV</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr>
                <th appSort="fullName" [ctl]="t">Nombre</th><th appSort="email" [ctl]="t">Email</th>
                <th appSort="department.name" [ctl]="t">Departamento</th><th></th>
              </tr></thead>
              <tbody>
                @for (e of v.items; track e.id) {
                  <tr>
                    <td><strong>{{ e.fullName }}</strong></td><td>{{ e.email }}</td><td>{{ e.department?.name || '—' }}</td>
                    <td><button type="button" class="btn-ghost btn-sm" (click)="editEmployee(e)">Editar</button></td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="empty">{{ t.term() ? 'Sin resultados para la búsqueda.' : 'Aún no hay empleados.' }}</td></tr>
                }
              </tbody>
            </table>
          </div>
          <app-pager [ctl]="t" [view]="v" />
        } @else {
          <form [formGroup]="depForm" (ngSubmit)="saveDepartment()" class="form-grid" novalidate>
            <div class="field">
              <label for="dep-name">Nombre<span class="req">*</span></label>
              <input id="dep-name" formControlName="name" placeholder="Tecnología" maxlength="80" appRestrict="text" />
              <app-field-error [control]="depForm.controls.name" />
            </div>
            <div class="field">
              <label for="dep-cc">Centro de costo<span class="req">*</span></label>
              <input id="dep-cc" formControlName="costCenterCode" placeholder="CC-TI" maxlength="20" appRestrict="code" />
              <span class="hint">Código único: mayúsculas, dígitos y guiones.</span>
              <app-field-error [control]="depForm.controls.costCenterCode" patternHint="Solo mayúsculas, dígitos y guiones (ej. CC-TI)." />
            </div>
            <div class="form-actions">
              @if (editingDepartment(); as d) {
                <span class="muted small" style="margin-right:auto">Editando: <strong>{{ d.name }}</strong></span>
                <button type="button" class="btn-secondary" (click)="cancelDepartment()">Cancelar</button>
                <button type="submit" [disabled]="saving()"><app-icon name="check" [size]="16" /> Guardar cambios</button>
              } @else {
                <button type="submit" [disabled]="saving()"><app-icon name="plus" [size]="16" /> Agregar departamento</button>
              }
            </div>
          </form>

          <div class="table-wrap" style="margin-top:1.25rem">
            <table>
              <thead><tr><th>Nombre</th><th>Centro de costo</th><th class="right">Empleados</th><th></th></tr></thead>
              <tbody>
                @for (d of departments(); track d.id) {
                  <tr>
                    <td><strong>{{ d.name }}</strong></td><td class="mono">{{ d.costCenterCode || '—' }}</td>
                    <td class="right">{{ headcount()[d.id] || 0 }}</td>
                    <td><button type="button" class="btn-ghost btn-sm" (click)="editDepartment(d)">Editar</button></td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="empty"><strong>Aún no hay departamentos</strong>Crea el primero con el formulario de arriba.</td></tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </section>
  `
})
export class AdminEmpleadosPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AssetsApiService);
  private readonly toast = inject(ToastService);

  readonly tab = signal<'employees' | 'departments'>('employees');
  readonly departments = signal<Department[]>([]);
  readonly employees = signal<Employee[]>([]);
  readonly t = new TableCtl<Employee>();
  readonly saving = signal(false);
  readonly editingEmployee = signal<Employee | null>(null);
  readonly editingDepartment = signal<Department | null>(null);
  readonly headcount = computed(() => {
    const counts: Record<number, number> = {};
    for (const e of this.employees()) if (e.department) counts[e.department.id] = (counts[e.department.id] ?? 0) + 1;
    return counts;
  });

  readonly form = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(120), Validators.pattern(PERSON_NAME_PATTERN)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    departmentId: [null as number | null, Validators.required]
  });

  readonly depForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    costCenterCode: ['', [Validators.required, Validators.pattern(COST_CENTER_PATTERN)]]
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.listDepartments().subscribe({
      next: (rows) => {
        this.departments.set(rows);
        if (!rows.length) this.tab.set('departments');
      }
    });
    this.api.listEmployees().subscribe({ next: (rows) => this.employees.set(rows), error: (err) => this.toast.error(errorMessage(err)) });
  }

  depValue(value: string): number | '' {
    return value === '' ? '' : Number(value);
  }

  editEmployee(e: Employee): void {
    this.editingEmployee.set(e);
    this.form.reset({ fullName: e.fullName, email: e.email, departmentId: e.department?.id ?? null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEmployee(): void {
    this.editingEmployee.set(null);
    this.form.reset();
  }

  saveEmployee(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload = { fullName: v.fullName!.trim(), email: v.email!.trim(), departmentId: v.departmentId! };
    const editing = this.editingEmployee();
    this.saving.set(true);
    const request = editing ? this.api.updateEmployee(editing.id, payload) : this.api.createEmployeeData(payload);
    request.subscribe({
      next: (e) => {
        this.toast.success(editing ? `Empleado ${e.fullName} actualizado.` : `Empleado ${e.fullName} registrado.`);
        this.cancelEmployee();
        this.loadData();
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err, 'No fue posible guardar el empleado.'));
        this.saving.set(false);
      }
    });
  }

  editDepartment(d: Department): void {
    this.editingDepartment.set(d);
    this.depForm.reset({ name: d.name, costCenterCode: d.costCenterCode ?? '' });
  }

  cancelDepartment(): void {
    this.editingDepartment.set(null);
    this.depForm.reset();
  }

  saveDepartment(): void {
    if (this.depForm.invalid) {
      this.depForm.markAllAsTouched();
      return;
    }
    const v = this.depForm.getRawValue();
    const payload = { name: v.name!.trim(), costCenterCode: v.costCenterCode! };
    const editing = this.editingDepartment();
    this.saving.set(true);
    const request = editing ? this.api.updateDepartment(editing.id, payload) : this.api.createDepartment(payload);
    request.subscribe({
      next: (d) => {
        this.toast.success(editing ? `Departamento ${d.name} actualizado.` : `Departamento ${d.name} creado.`);
        this.cancelDepartment();
        this.loadData();
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err, 'No fue posible guardar el departamento.'));
        this.saving.set(false);
      }
    });
  }

  exportEmployees(rows: Employee[]): void {
    exportCsv('empleados.csv', [
      { label: 'Nombre', value: (r) => r.fullName },
      { label: 'Email', value: (r) => r.email },
      { label: 'Departamento', value: (r) => r.department?.name },
      { label: 'Centro de costo', value: (r) => r.department?.costCenterCode }
    ], rows);
  }
}
