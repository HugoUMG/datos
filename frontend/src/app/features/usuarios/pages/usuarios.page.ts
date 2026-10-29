import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminUser, Employee } from '../../../core/models/api.models';
import { AssetsApiService } from '../../../core/services/assets-api.service';
import { RoleName } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { errorMessage } from '../../../core/http-error';
import { ROLE_LABELS } from '../../../shared/labels';
import { SearchPipe } from '../../../shared/search.pipe';
import { BadgeComponent, FieldErrorComponent, IconComponent, SearchBoxComponent } from '../../../shared/ui';
import { USERNAME_PATTERN } from '../../../shared/validators';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, SearchPipe, FieldErrorComponent, IconComponent, SearchBoxComponent, BadgeComponent],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Usuarios</h1>
          <p>Cuentas de acceso al sistema y su rol.</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h2>Crear usuario</h2></div>
        <form [formGroup]="form" (ngSubmit)="createUser()" class="form-grid" novalidate>
          <div class="field">
            <label for="u-name">Usuario<span class="req">*</span></label>
            <input id="u-name" formControlName="username" placeholder="jperez" autocomplete="off" maxlength="30" />
            <app-field-error [control]="form.controls.username" patternHint="De 3 a 30 caracteres: letras, dígitos, punto, guion o guion bajo." />
          </div>
          <div class="field">
            <label for="u-pass">Contraseña<span class="req">*</span></label>
            <input id="u-pass" type="password" formControlName="password" autocomplete="new-password" />
            <span class="hint">Mínimo 8 caracteres.</span>
            <app-field-error [control]="form.controls.password" />
          </div>
          <div class="field">
            <label for="u-role">Rol<span class="req">*</span></label>
            <select id="u-role" formControlName="role">
              @for (r of roles; track r) { <option [value]="r">{{ roleLabel(r) }}</option> }
            </select>
          </div>
          @if (role() === 'EMPLEADO') {
            <div class="field">
              <label for="u-emp">Empleado vinculado<span class="req">*</span></label>
              <select id="u-emp" formControlName="employeeId">
                <option [ngValue]="null" disabled>Selecciona un empleado</option>
                @for (e of employees(); track e.id) { <option [ngValue]="e.id">{{ e.fullName }} · {{ e.email }}</option> }
              </select>
              <span class="hint">La cuenta de empleado ve solo sus propios activos.</span>
              <app-field-error [control]="form.controls.employeeId" />
            </div>
          }
          <div class="form-actions">
            <button type="submit" [disabled]="saving()"><app-icon name="plus" [size]="16" /> Crear usuario</button>
          </div>
        </form>
      </div>

      <div class="card">
        <div class="card-header">
          <h2>Usuarios registrados</h2>
          <button type="button" class="btn-secondary btn-sm" (click)="load()"><app-icon name="refresh" [size]="14" /> Actualizar</button>
        </div>
        @let rows = users() | search: term();
        <div class="toolbar">
          <app-search-box [(value)]="term" placeholder="Buscar por usuario o rol…" />
          <span class="count">{{ rows.length }} de {{ users().length }}</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Usuario</th><th>Rol</th><th>Empleado</th><th>Creado</th></tr></thead>
            <tbody>
              @for (u of rows; track u.id) {
                <tr>
                  <td><strong>{{ u.username }}</strong></td>
                  <td><app-badge tone="primary">{{ roleLabel(u.role) }}</app-badge></td>
                  <td>{{ employeeName(u.employeeId) }}</td>
                  <td class="nowrap">{{ u.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="4" class="empty">Sin resultados.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `
})
export class UsuariosPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AssetsApiService);
  private readonly toast = inject(ToastService);

  readonly roles: RoleName[] = ['ADMINISTRADOR', 'COMPRAS', 'INVENTARIO', 'FINANZAS', 'EMPLEADO'];
  readonly users = signal<AdminUser[]>([]);
  readonly employees = signal<Employee[]>([]);
  readonly term = signal('');
  readonly saving = signal(false);

  readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.pattern(USERNAME_PATTERN)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    role: this.fb.nonNullable.control<RoleName>('EMPLEADO', Validators.required),
    employeeId: [null as number | null]
  });
  readonly role = toSignal(this.form.controls.role.valueChanges, { initialValue: this.form.controls.role.value });

  constructor() {
    // El empleado vinculado solo es obligatorio para cuentas con rol EMPLEADO.
    this.form.controls.role.valueChanges.subscribe((role) => {
      const emp = this.form.controls.employeeId;
      emp.setValidators(role === 'EMPLEADO' ? Validators.required : null);
      if (role !== 'EMPLEADO') emp.setValue(null);
      emp.updateValueAndValidity();
    });
    this.form.controls.employeeId.setValidators(Validators.required);
  }

  ngOnInit(): void {
    this.load();
    this.api.listEmployees().subscribe({ next: (rows) => this.employees.set(rows) });
  }

  load(): void {
    this.api.listUsers().subscribe({ next: (rows) => this.users.set(rows), error: (err) => this.toast.error(errorMessage(err)) });
  }

  roleLabel(role: string): string {
    return ROLE_LABELS[role] ?? role;
  }

  employeeName(id?: number): string {
    if (!id) return '—';
    return this.employees().find((e) => e.id === id)?.fullName ?? `#${id}`;
  }

  createUser(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.api.createUser({ username: v.username!.trim(), password: v.password!, role: v.role, employeeId: v.employeeId ?? undefined }).subscribe({
      next: (user) => {
        this.toast.success(`Usuario ${user.username} creado como ${this.roleLabel(user.role)}.`);
        this.form.reset({ role: 'EMPLEADO', username: '', password: '', employeeId: null });
        this.load();
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err, 'No fue posible crear el usuario.'));
        this.saving.set(false);
      }
    });
  }
}
