import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AssetsApiService } from '../../../core/services/assets-api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="shell">
      <div class="card">
        <div class="between">
          <div>
            <h1>Menú Principal</h1>
            <p class="muted">Sesión activa: <strong>{{ auth.username() }}</strong> ({{ auth.role() }})</p>
          </div>
          <button type="button" (click)="logout()">Cerrar sesión</button>
        </div>

        <p>Modulos:</p>
        <div class="grid grid-3">
          <button *ngIf="auth.canAccessModule('adquisiciones')" type="button" (click)="go('/adquisiciones')">Adquisiciones</button>
          <button *ngIf="auth.canAccessModule('inventario')" type="button" (click)="go('/inventario')">Inventario</button>
          <button *ngIf="auth.canAccessModule('asignaciones')" type="button" (click)="go('/asignaciones')">Asignaciones</button>
          <button *ngIf="auth.canAccessModule('bajas')" type="button" (click)="go('/bajas')">Bajas</button>
          <button *ngIf="auth.canAccessModule('reportes')" type="button" (click)="go('/reportes')">Reportes</button>
          <button *ngIf="auth.canAccessModule('empleado')" type="button" (click)="go('/empleado')">Mis activos</button>
          <button *ngIf="auth.canAccessModule('catalogos')" type="button" (click)="go('/catalogos')">Proveedores y partidas</button>
          <button *ngIf="auth.canAccessModule('admin-empleados')" type="button" (click)="go('/admin-empleados')">Empleados</button>
        </div>
      </div>

      <div class="card" *ngIf="auth.isAdmin()">
        <h2>Creación de usuario</h2>
        <p class="muted">Registro de creación de usuarios en el sistema.</p>

        <form [formGroup]="userForm" (ngSubmit)="createUser()" class="grid grid-3">
          <input formControlName="username" placeholder="nuevo usuario" />
          <input formControlName="password" placeholder="contraseña" type="password" />
          <select formControlName="role">
            <option value="ADMINISTRADOR">ADMINISTRADOR</option>
            <option value="COMPRAS">COMPRAS</option>
            <option value="INVENTARIO">INVENTARIO</option>
            <option value="EMPLEADO">EMPLEADO</option>
            <option value="FINANZAS">FINANZAS</option>
          </select>
          <input type="number" formControlName="employeeId" placeholder="employeeId (solo EMPLEADO)" />
          <button type="submit">Crear usuario</button>
        </form>

        <p *ngIf="message">{{ message }}</p>
      </div>
    </section>
  `
})
export class MenuPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly api = inject(AssetsApiService);
  readonly auth = inject(AuthService);

  message = '';
  readonly userForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    role: this.fb.nonNullable.control<'ADMINISTRADOR' | 'COMPRAS' | 'INVENTARIO' | 'EMPLEADO' | 'FINANZAS'>(
      'EMPLEADO',
      Validators.required
    ),
    employeeId: [null]
  });

  go(path: string): void {
    this.router.navigateByUrl(path);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  createUser(): void {
    if (this.userForm.invalid) return;
    const payload = this.userForm.getRawValue();
    this.api.createUser({
      username: payload.username!,
      password: payload.password!,
      role: payload.role,
      employeeId: payload.employeeId ?? undefined
    }).subscribe({
      next: (user) => (this.message = `Usuario creado: ${user.username} (${user.role})`),
      error: (err) => (this.message = err?.error?.error ?? 'No fue posible crear el usuario.')
    });
  }
}
