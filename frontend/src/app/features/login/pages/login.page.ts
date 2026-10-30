import { RestrictDirective } from '../../../shared/restrict.directive';
import { Component, OnDestroy, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { retry, throwError, timeout, timer } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { errorMessage } from '../../../core/http-error';
import { resolveApiUrl } from '../../../core/config/api-base-url';
import { FieldErrorComponent, IconComponent } from '../../../shared/ui';

/** Render suspende el backend gratuito tras 15 min sin uso y tarda 1–2 min en volver. */
const WAKE_LIMIT_MS = 4 * 60_000;
const WAKE_ATTEMPT_MS = 45_000;

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

        @if (server() !== 'ready') {
          <div class="wake" [class.down]="server() === 'down'" role="status" aria-live="polite">
            @if (server() === 'down') {
              <div>
                <strong>El servidor no respondió</strong>
                <p class="small">Puede ser tu conexión o que el servicio esté reiniciando.</p>
              </div>
              <button type="button" class="btn-secondary btn-sm" (click)="startWake()">Reintentar</button>
            } @else {
              <div class="wake-head">
                <span class="spinner"></span>
                <strong>Despertando el servidor… {{ elapsedLabel() }}</strong>
              </div>
              <p class="small">Estuvo inactivo y tarda entre 1 y 2 minutos en arrancar. Puedes escribir tus datos mientras tanto: entrarás en cuanto esté listo.</p>
              <div class="bar"><span></span></div>
            }
          </div>
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

          <button type="submit" [disabled]="loading() || waitingToLogin()">
            @if (waitingToLogin()) { <span class="spinner"></span> Entrarás en cuanto el servidor esté listo… }
            @else if (loading()) { <span class="spinner"></span> Ingresando… }
            @else { Iniciar sesión }
          </button>
          @if (waitingToLogin()) {
            <button type="button" class="btn-ghost cancel" (click)="waitingToLogin.set(false)">Cancelar</button>
          }
          @if (server() === 'ready') {
            <p class="server-ok" role="status"><span class="dot"></span> Servidor listo</p>
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
    button[type=submit] { padding: .7rem; white-space: normal; }
    .cancel { justify-self: center; margin-top: -.5rem; }
    .wake { background: var(--warning-soft); color: var(--warning); border: 1px solid #fde68a; border-radius: var(--radius-sm);
      padding: .8rem 1rem; display: grid; gap: .45rem; }
    .wake.down { background: var(--danger-soft); color: var(--danger); border-color: #fecaca; display: flex;
      justify-content: space-between; align-items: center; gap: .75rem; }
    .wake-head { display: flex; gap: .5rem; align-items: center; }
    .wake p { color: #78350f; }
    .wake.down p { color: #7f1d1d; }
    .bar { height: 4px; background: #fde68a; border-radius: 99px; overflow: hidden; }
    .bar span { display: block; height: 100%; width: 35%; background: var(--warning); border-radius: 99px; animation: slide 1.4s ease-in-out infinite; }
    @keyframes slide { from { transform: translateX(-100%); } to { transform: translateX(300%); } }
    .server-ok { display: flex; gap: .45rem; align-items: center; justify-content: center; font-size: .8rem; color: var(--text-muted); }
    .server-ok .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); }
  `]
})
export class LoginPage implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** ?expirada=1 cuando el interceptor cerró la sesión. */
  readonly expirada = input<string | undefined>();
  readonly error = signal('');
  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly server = signal<'checking' | 'ready' | 'down'>('checking');
  /** El usuario ya pidió entrar pero el servidor sigue despertando. */
  readonly waitingToLogin = signal(false);
  private readonly elapsed = signal(0);
  readonly elapsedLabel = computed(() => {
    const s = this.elapsed();
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  });
  private wakeStart = 0;
  private ticker?: ReturnType<typeof setInterval>;
  private destroyed = false;

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  constructor() {
    if (this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/menu');
      return;
    }
    this.startWake();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    clearInterval(this.ticker);
  }

  startWake(): void {
    this.server.set('checking');
    this.wakeStart = Date.now();
    this.elapsed.set(0);
    clearInterval(this.ticker);
    this.ticker = setInterval(() => this.elapsed.set(Math.round((Date.now() - this.wakeStart) / 1000)), 1000);
    this.ping();
  }

  /** Cualquier respuesta del backend (incluso 401 sin credenciales) significa que ya está arriba. */
  private ping(): void {
    if (this.destroyed) return;
    const controller = new AbortController();
    const abort = setTimeout(() => controller.abort(), WAKE_ATTEMPT_MS);
    fetch(resolveApiUrl('/api/auth/me'), { signal: controller.signal, cache: 'no-store' })
      .then((res) => {
        clearTimeout(abort);
        if (res.status >= 500) throw new Error('despertando');
        this.onReady();
      })
      .catch(() => {
        clearTimeout(abort);
        if (Date.now() - this.wakeStart > WAKE_LIMIT_MS) {
          clearInterval(this.ticker);
          this.server.set('down');
          this.waitingToLogin.set(false);
        } else {
          setTimeout(() => this.ping(), 3000);
        }
      });
  }

  private onReady(): void {
    clearInterval(this.ticker);
    this.server.set('ready');
    if (this.waitingToLogin()) {
      this.waitingToLogin.set(false);
      this.submit();
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set('');
    if (this.server() !== 'ready') {
      if (this.server() === 'down') this.startWake();
      this.waitingToLogin.set(true);
      return;
    }

    const { username, password } = this.form.getRawValue();
    this.loading.set(true);
    this.auth
      .login(username.trim(), password)
      .pipe(
        timeout(60_000),
        // Si el servidor se volvió a dormir o está reiniciando, reintentar en vez de fallar.
        retry({
          count: 3,
          delay: (err) =>
            err instanceof HttpErrorResponse && err.status !== 0 && err.status < 500 ? throwError(() => err) : timer(3000)
        })
      )
      .subscribe({
        next: () => this.router.navigateByUrl('/menu'),
        error: (err: unknown) => {
          this.auth.logout();
          this.loading.set(false);
          this.error.set(
            err instanceof HttpErrorResponse && err.status === 401
              ? 'Usuario o contraseña incorrectos.'
              : errorMessage(err, 'El servidor tardó demasiado en responder. Intenta de nuevo.')
          );
        }
      });
  }
}
