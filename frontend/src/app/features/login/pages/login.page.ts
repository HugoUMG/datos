import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="shell centered">
      <div class="card auth-card">
        <h1>Ingreso al Sistema de Activos</h1>
        <p class="muted"></p>



        <form [formGroup]="form" (ngSubmit)="submit()" class="stack">
          <label>Usuario</label>
          <input formControlName="username" placeholder="usuario" />

          <label>Contraseña</label>
          <input type="password" formControlName="password" placeholder="contraseña" />

          <button type="submit">Iniciar sesión</button>
        </form>

        <p class="error" *ngIf="error">{{ error }}</p>
      </div>
    </section>
  `
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  error = '';

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, password } = this.form.getRawValue();
    this.auth.login(username.trim(), password).subscribe({
      next: () => this.router.navigateByUrl('/menu'),
      error: () => {
        this.auth.logout();
        this.error = 'Credenciales inválidas o usuario sin permisos.';
      }
    });
  }
}
