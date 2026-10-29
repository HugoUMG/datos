import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

export type RoleName = 'ADMINISTRADOR' | 'COMPRAS' | 'INVENTARIO' | 'EMPLEADO' | 'FINANZAS';
export type ModuleName =
  | 'adquisiciones'
  | 'inventario'
  | 'asignaciones'
  | 'bajas'
  | 'reportes'
  | 'empleado'
  | 'catalogos'
  | 'admin-empleados'
  | 'usuarios';

// La sesión vive en sessionStorage (no localStorage): al cerrar el navegador la contraseña no queda guardada.
const store = sessionStorage;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http: HttpClient;
  private readonly usernameState = signal<string>(store.getItem('inv_user') ?? '');
  private readonly passwordState = signal<string>(store.getItem('inv_pass') ?? '');
  private readonly roleState = signal<RoleName | ''>((store.getItem('inv_role') as RoleName | null) ?? '');
  private readonly employeeIdState = signal<number | null>(Number(store.getItem('inv_employee_id') || '') || null);

  constructor(http: HttpClient) {
    this.http = http;
    // Limpia sesiones viejas que guardaban la contraseña en localStorage.
    ['inv_user', 'inv_pass', 'inv_role', 'inv_employee_id'].forEach((key) => localStorage.removeItem(key));
  }

  readonly isLoggedIn = computed(() => !!this.usernameState() && !!this.passwordState());
  readonly username = computed(() => this.usernameState());
  readonly role = computed(() => this.roleState());
  readonly employeeId = computed(() => this.employeeIdState());
  readonly isAdmin = computed(() => this.roleState() === 'ADMINISTRADOR');

  login(username: string, password: string): Observable<{ username: string; role: RoleName; employeeId: number | null }> {
    this.usernameState.set(username);
    this.passwordState.set(password);
    store.setItem('inv_user', username);
    store.setItem('inv_pass', password);

    return this.http.get<{ username: string; role: RoleName; employeeId: number | null }>('/api/auth/me').pipe(
      tap((profile) => {
        this.roleState.set(profile.role);
        this.employeeIdState.set(profile.employeeId ?? null);
        store.setItem('inv_role', profile.role);
        if (profile.employeeId !== null && profile.employeeId !== undefined) {
          store.setItem('inv_employee_id', String(profile.employeeId));
        } else {
          store.removeItem('inv_employee_id');
        }
      })
    );
  }

  logout(): void {
    this.usernameState.set('');
    this.passwordState.set('');
    this.roleState.set('');
    this.employeeIdState.set(null);
    ['inv_user', 'inv_pass', 'inv_role', 'inv_employee_id'].forEach((key) => store.removeItem(key));
  }

  /** Tras cambiar la contraseña, las siguientes peticiones deben usar la nueva. */
  updateStoredPassword(password: string): void {
    this.passwordState.set(password);
    store.setItem('inv_pass', password);
  }

  basicToken(): string {
    return btoa(`${this.usernameState()}:${this.passwordState()}`);
  }

  canAccessModule(module: ModuleName): boolean {
    const role = this.roleState();
    if (!role) return false;
    if (role === 'ADMINISTRADOR') return true;
    if (role === 'COMPRAS') return module === 'adquisiciones' || module === 'catalogos';
    if (role === 'INVENTARIO') return module === 'inventario' || module === 'asignaciones' || module === 'bajas' || module === 'reportes' || module === 'catalogos';
    if (role === 'FINANZAS') return module === 'reportes';
    return module === 'empleado';
  }
}
