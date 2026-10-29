import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminUser, Employee } from '../../../core/models/api.models';
import { AssetsApiService } from '../../../core/services/assets-api.service';
import { AuthService, RoleName } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { errorMessage } from '../../../core/http-error';
import { ROLE_LABELS } from '../../../shared/labels';
import { RestrictDirective } from '../../../shared/restrict.directive';
import { PagerComponent, SortHeaderComponent, TableCtl, exportCsv } from '../../../shared/table';
import { BadgeComponent, FieldErrorComponent, IconComponent, SearchBoxComponent } from '../../../shared/ui';
import { USERNAME_PATTERN } from '../../../shared/validators';

const ROLE_HELP: Record<RoleName, string> = {
  ADMINISTRADOR: 'Acceso total, incluida la gestión de usuarios y respaldos.',
  COMPRAS: 'Registra facturas, proveedores y partidas.',
  INVENTARIO: 'Gestiona inventario, asignaciones, bajas y reportes.',
  FINANZAS: 'Consulta reportes e inversión.',
  EMPLEADO: 'Solo ve y confirma sus propios bienes.'
};

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterLink, DatePipe, RestrictDirective, FieldErrorComponent, IconComponent, SearchBoxComponent, BadgeComponent, SortHeaderComponent, PagerComponent],
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
            <input id="u-name" formControlName="username" placeholder="jperez" autocomplete="off" maxlength="30" appRestrict="username" />
            <span class="hint">De 3 a 30 caracteres, sin espacios ni tildes.</span>
            <app-field-error [control]="form.controls.username" patternHint="De 3 a 30 caracteres: letras, dígitos, punto, guion o guion bajo." />
          </div>
          <div class="field">
            <label for="u-pass">Contraseña<span class="req">*</span></label>
            <input id="u-pass" type="password" formControlName="password" autocomplete="new-password" maxlength="72" />
            <span class="hint">Mínimo 8 caracteres.</span>
            <app-field-error [control]="form.controls.password" />
          </div>
          <div class="field">
            <label for="u-role">Rol<span class="req">*</span></label>
            <select id="u-role" formControlName="role">
              @for (r of roles; track r) { <option [value]="r">{{ roleLabel(r) }}</option> }
            </select>
            <span class="hint">{{ roleHelp(role()) }}</span>
          </div>
          @if (role() === 'EMPLEADO') {
            <div class="field">
              <label for="u-emp">Empleado vinculado<span class="req">*</span></label>
              <select id="u-emp" formControlName="employeeId">
                <option [ngValue]="null" disabled>{{ freeEmployees().length ? 'Selecciona un empleado' : 'Todos los empleados ya tienen cuenta' }}</option>
                @for (e of freeEmployees(); track e.id) { <option [ngValue]="e.id">{{ e.fullName }} · {{ e.email }}</option> }
              </select>
              @if (!employees().length) { <span class="hint">No hay empleados; regístralos en <a routerLink="/admin-empleados">Empleados</a>.</span> }
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
        @let v = t.view(users());
        <div class="toolbar">
          <app-search-box [value]="t.term()" (valueChange)="t.setTerm($event)" placeholder="Buscar por usuario o empleado…" />
          <select [ngModel]="t.filter('role')" (ngModelChange)="t.setFilter('role', $event)" aria-label="Filtrar por rol">
            <option value="">Todos los roles</option>
            @for (r of roles; track r) { <option [value]="r">{{ roleLabel(r) }}</option> }
          </select>
          <span class="count">{{ v.filtered.length }} de {{ v.total }}</span>
          <button type="button" class="btn-secondary btn-sm" (click)="exportar(v.filtered)" [disabled]="!v.filtered.length"><app-icon name="download" [size]="14" /> CSV</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th appSort="username" [ctl]="t">Usuario</th><th appSort="role" [ctl]="t">Rol</th>
              <th appSort="employee" [ctl]="t">Empleado</th><th appSort="createdAt" [ctl]="t">Creado</th><th></th>
            </tr></thead>
            <tbody>
              @for (u of v.items; track u.id) {
                <tr>
                  <td><strong>{{ u.username }}</strong>@if (u.username === auth.username()) { <span class="small muted"> (tú)</span> }</td>
                  <td><app-badge tone="primary">{{ roleLabel(u.role) }}</app-badge></td>
                  <td>{{ employeeName(u.employeeId) }}</td>
                  <td class="nowrap">{{ u.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                  <td>
                    @if (u.username !== auth.username()) {
                      <button type="button" class="btn-ghost btn-sm" (click)="openReset(u)"><app-icon name="key" [size]="14" /> Restablecer contraseña</button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty">Sin resultados.</td></tr>
              }
            </tbody>
          </table>
        </div>
        <app-pager [ctl]="t" [view]="v" />
      </div>

      @if (resetting(); as u) {
        <div class="modal-backdrop" (click)="resetting.set(null)">
          <form class="modal" [formGroup]="resetForm" (ngSubmit)="saveReset(u)" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" novalidate>
            <div>
              <h2>Restablecer contraseña</h2>
              <p class="muted small">Asigna una contraseña nueva a <strong>{{ u.username }}</strong> y compártela por un medio privado. Podrá cambiarla después desde su menú.</p>
            </div>
            <div class="field">
              <label for="r-pass">Nueva contraseña<span class="req">*</span></label>
              <input id="r-pass" type="password" formControlName="newPassword" autocomplete="new-password" maxlength="72" />
              <span class="hint">Mínimo 8 caracteres.</span>
              <app-field-error [control]="resetForm.controls.newPassword" />
            </div>
            <div class="field">
              <label for="r-pass2">Confirmar contraseña<span class="req">*</span></label>
              <input id="r-pass2" type="password" formControlName="confirm" autocomplete="new-password" maxlength="72" />
              @if (resetForm.controls.confirm.touched && resetForm.value.confirm !== resetForm.value.newPassword) {
                <span class="field-error">Las contraseñas no coinciden.</span>
              }
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="resetting.set(null)">Cancelar</button>
              <button type="submit" [disabled]="saving()">Guardar contraseña</button>
            </div>
          </form>
        </div>
      }
    </section>
  `
})
export class UsuariosPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AssetsApiService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly roles: RoleName[] = ['ADMINISTRADOR', 'COMPRAS', 'INVENTARIO', 'FINANZAS', 'EMPLEADO'];
  readonly users = signal<AdminUser[]>([]);
  readonly employees = signal<Employee[]>([]);
  readonly saving = signal(false);
  readonly resetting = signal<AdminUser | null>(null);
  readonly t = new TableCtl<AdminUser>({
    employee: (u) => this.employeeName(u.employeeId)
  });

  readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.pattern(USERNAME_PATTERN)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    role: this.fb.nonNullable.control<RoleName>('EMPLEADO', Validators.required),
    employeeId: [null as number | null, Validators.required]
  });
  readonly role = toSignal(this.form.controls.role.valueChanges, { initialValue: this.form.controls.role.value });

  readonly resetForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    confirm: ['', Validators.required]
  });

  constructor() {
    // El empleado vinculado solo es obligatorio para cuentas con rol EMPLEADO.
    this.form.controls.role.valueChanges.subscribe((role) => {
      const emp = this.form.controls.employeeId;
      emp.setValidators(role === 'EMPLEADO' ? Validators.required : null);
      if (role !== 'EMPLEADO') emp.setValue(null);
      emp.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.load();
    this.api.listEmployees().subscribe({ next: (rows) => this.employees.set(rows) });
  }

  load(): void {
    this.api.listUsers().subscribe({ next: (rows) => this.users.set(rows), error: (err) => this.toast.error(errorMessage(err)) });
  }

  /** Empleados que todavía no tienen cuenta (una cuenta por empleado). */
  freeEmployees(): Employee[] {
    const linked = new Set(this.users().map((u) => u.employeeId).filter(Boolean));
    return this.employees().filter((e) => !linked.has(e.id));
  }

  roleLabel(role: string): string {
    return ROLE_LABELS[role] ?? role;
  }

  roleHelp(role: RoleName): string {
    return ROLE_HELP[role];
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

  openReset(u: AdminUser): void {
    this.resetForm.reset();
    this.resetting.set(u);
  }

  saveReset(u: AdminUser): void {
    const v = this.resetForm.getRawValue();
    if (this.resetForm.invalid || v.newPassword !== v.confirm) {
      this.resetForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.api.resetPassword(u.id, v.newPassword!).subscribe({
      next: () => {
        this.toast.success(`Contraseña de ${u.username} restablecida.`);
        this.resetting.set(null);
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err, 'No fue posible restablecer la contraseña.'));
        this.saving.set(false);
      }
    });
  }

  exportar(rows: AdminUser[]): void {
    exportCsv('usuarios.csv', [
      { label: 'Usuario', value: (r) => r.username },
      { label: 'Rol', value: (r) => this.roleLabel(r.role) },
      { label: 'Empleado', value: (r) => this.employeeName(r.employeeId) },
      { label: 'Creado', value: (r) => r.createdAt }
    ], rows);
  }
}
