import { RestrictDirective } from '../../../shared/restrict.directive';
import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { errorMessage } from '../../../core/http-error';
import { resolveApiUrl } from '../../../core/config/api-base-url';
import { FieldErrorComponent, IconComponent } from '../../../shared/ui';

@Component({
  standalone: true,
  imports: [RestrictDirective, ReactiveFormsModule, FieldErrorComponent, IconComponent],
  template: `
    <section class="login">
      <div class="panel">
        <div class="brand">
          <span class="logo"><app-icon name="box" [size]="26" /></span>
          <h1>Gestión de Activos</h1>
          <p class="muted">Ingresa con tu usuario para administrar adquisiciones, inventario, asignaciones y bajas.</p>
        </div>

        @if (expirada()) {
          <div class="alert alert-warning">Tu sesión terminó. Vuelve a ingresar.</div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" class="stack" novalidate>
          <div class="field">
            <label for="username">Usuario</label>
            <input id="username" appRestrict="username" formControlName="username" autocomplete="username" placeholder="Tu usuario" autofocus />
            <app-field-error [control]="form.controls.username" />
          </div>

          <div class="field">
            <label for="password">Contraseña</label>
            <div class="pwd">
              <input id="password" [type]="showPassword() ? 'text' : 'password'" formControlName="password"
                autocomplete="current-password" placeholder="Tu contraseña" />
              <button type="button" class="btn-ghost" (click)="showPassword.set(!showPassword())"
                [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" />
              </button>
            </div>
            <app-field-error [control]="form.controls.password" />
          </div>

          @if (error()) {
            <div class="alert alert-danger" role="alert">{{ error() }}</div>
          }

          <button type="submit" [disabled]="loading()">
            @if (loading()) { <span class="spinner"></span> Ingresando… } @else { Iniciar sesión }
          </button>
          <p class="server" [class.ready]="server() === 'ready'" [class.down]="server() === 'down'" role="status">
            <span class="dot"></span>
            @switch (server()) {
              @case ('ready') { Servidor listo }
              @case ('down') { No se pudo contactar al servidor; revisa tu conexión. }
              @default { Conectando con el servidor… (si estuvo inactivo tarda hasta un minuto) }
            }
          </p>
          @if (slow()) {
            <p class="hint center">El servidor estaba inactivo y está despertando; puede tardar hasta un minuto.</p>
          }
        </form>
      </div>
    </section>
  `,
  styles: [`
    .login { min-height: 100vh; display: grid; place-items: center; padding: 1rem;
      background: radial-gradient(circle at 20% 10%, #dbeafe 0, transparent 40%), radial-gradient(circle at 80% 90%, #e0e7ff 0, transparent 40%), var(--bg); }
    .panel { width: min(420px, 100%); background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
      box-shadow: 0 20px 50px rgba(15,23,42,.08); padding: 2rem; display: grid; gap: 1.25rem; }
    .brand { display: grid; gap: .5rem; justify-items: center; text-align: center; }
    .logo { background: var(--primary); color: #fff; border-radius: 14px; padding: .65rem; display: inline-flex; }
    .stack { display: grid; gap: 1rem; }
    .pwd { position: relative; }
    .pwd input { padding-right: 2.75rem; }
    .pwd button { position: absolute; right: .25rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
    button[type=submit] { padding: .7rem; }
    .center { text-align: center; }
    .server { display: flex; gap: .45rem; align-items: center; justify-content: center; font-size: .8rem; color: var(--text-muted); }
    .server .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--warning); animation: pulse 1.2s infinite; }
    .server.ready .dot { background: var(--success); animation: none; }
    .server.down .dot { background: var(--danger); animation: none; }
    @keyframes pulse { 50% { opacity: .3; } }
  `]
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** ?expirada=1 cuando el interceptor cerró la sesión. */
  readonly expirada = input<string | undefined>();
  readonly error = signal('');
  readonly loading = signal(false);
  readonly slow = signal(false);
  readonly showPassword = signal(false);
  /** El backend gratuito se duerme; se "despierta" en cuanto se abre el login. */
  readonly server = signal<'checking' | 'ready' | 'down'>('checking');

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  constructor() {
    this.wakeServer();
    if (this.auth.isLoggedIn()) this.router.navigateByUrl('/menu');
  }

  private wakeServer(attempt = 1): void {
    // Cualquier respuesta HTTP (incluso 401 sin credenciales) significa que el servidor ya responde.
    fetch(resolveApiUrl('/api/auth/me'), { method: 'GET' })
      .then((res) => this.server.set(res.status === 502 || res.status === 503 ? 'checking' : 'ready'))
      .then(() => {
        if (this.server() === 'checking' && attempt < 12) setTimeout(() => this.wakeServer(attempt + 1), 5000);
      })
      .catch(() => (attempt < 12 ? setTimeout(() => this.wakeServer(attempt + 1), 5000) : this.server.set('down')));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, password } = this.form.getRawValue();
    this.error.set('');
    this.loading.set(true);
    const slowTimer = setTimeout(() => this.slow.set(true), 4000);

    this.auth.login(username.trim(), password).subscribe({
      next: () => {
        clearTimeout(slowTimer);
        this.router.navigateByUrl('/menu');
      },
      error: (err: unknown) => {
        clearTimeout(slowTimer);
        this.auth.logout();
        this.loading.set(false);
        this.slow.set(false);
        this.error.set(
          err instanceof HttpErrorResponse && err.status === 401
            ? 'Usuario o contraseña incorrectos.'
            : errorMessage(err, 'No fue posible iniciar sesión.')
        );
      }
    });
  }
}
