import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Department, Employee } from '../core/models/api.models';
import { AssetsApiService } from '../core/services/assets-api.service';
import { ToastService } from '../core/services/toast.service';
import { errorMessage } from '../core/http-error';
import { SearchPipe } from '../shared/search.pipe';
import { FieldErrorComponent, IconComponent, SearchBoxComponent } from '../shared/ui';
import { PERSON_NAME_PATTERN } from '../shared/validators';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, SearchPipe, FieldErrorComponent, IconComponent, SearchBoxComponent],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Empleados</h1>
          <p>Personas que pueden recibir activos. Para que entren al portal, crea su cuenta en Usuarios.</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h2>Registrar empleado</h2></div>
        <form [formGroup]="form" (ngSubmit)="createEmployee()" class="form-grid" novalidate>
          <div class="field">
            <label for="em-name">Nombre completo<span class="req">*</span></label>
            <input id="em-name" formControlName="fullName" placeholder="Nombre y apellido" maxlength="120" />
            <app-field-error [control]="form.controls.fullName" patternHint="El nombre solo puede contener letras y espacios." />
          </div>
          <div class="field">
            <label for="em-email">Email<span class="req">*</span></label>
            <input id="em-email" type="email" formControlName="email" placeholder="nombre@empresa.com" />
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
            <button type="submit" [disabled]="saving()"><app-icon name="plus" [size]="16" /> Registrar empleado</button>
          </div>
        </form>
      </div>

      <div class="card">
        <div class="card-header">
          <h2>Lista de empleados</h2>
          <button type="button" class="btn-secondary btn-sm" (click)="loadData()"><app-icon name="refresh" [size]="14" /> Actualizar</button>
        </div>
        @let rows = employees() | search: term();
        <div class="toolbar">
          <app-search-box [(value)]="term" placeholder="Buscar por nombre, email o departamento…" />
          <span class="count">{{ rows.length }} de {{ employees().length }}</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Departamento</th></tr></thead>
            <tbody>
              @for (e of rows; track e.id) {
                <tr><td class="muted">{{ e.id }}</td><td><strong>{{ e.fullName }}</strong></td><td>{{ e.email }}</td><td>{{ e.department?.name || '—' }}</td></tr>
              } @empty {
                <tr><td colspan="4" class="empty">{{ term() ? 'Sin resultados para la búsqueda.' : 'Aún no hay empleados.' }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `
})
export class AdminEmpleadosPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AssetsApiService);
  private readonly toast = inject(ToastService);

  readonly departments = signal<Department[]>([]);
  readonly employees = signal<Employee[]>([]);
  readonly term = signal('');
  readonly saving = signal(false);

  readonly form = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(120), Validators.pattern(PERSON_NAME_PATTERN)]],
    email: ['', [Validators.required, Validators.email]],
    departmentId: [null as number | null, Validators.required]
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.listDepartments().subscribe({ next: (rows) => this.departments.set(rows) });
    this.api.listEmployees().subscribe({ next: (rows) => this.employees.set(rows), error: (err) => this.toast.error(errorMessage(err)) });
  }

  createEmployee(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.api.createEmployeeData({ fullName: v.fullName!.trim(), email: v.email!.trim(), departmentId: v.departmentId! }).subscribe({
      next: (e) => {
        this.toast.success(`Empleado ${e.fullName} registrado.`);
        this.form.reset();
        this.loadData();
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err, 'No fue posible registrar el empleado.'));
        this.saving.set(false);
      }
    });
  }
}
