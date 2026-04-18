import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

type RoleName = 'ADMINISTRADOR' | 'COMPRAS' | 'INVENTARIO' | 'EMPLEADO' | 'FINANZAS';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http: HttpClient;
  private readonly usernameState = signal<string>(localStorage.getItem('inv_user') ?? '');
  private readonly passwordState = signal<string>(localStorage.getItem('inv_pass') ?? '');
  private readonly roleState = signal<RoleName | ''>((localStorage.getItem('inv_role') as RoleName | null) ?? '');
  private readonly employeeIdState = signal<number | null>(Number(localStorage.getItem('inv_employee_id') || '') || null);

  constructor(http: HttpClient) {
    this.http = http;
  }

  readonly isLoggedIn = computed(() => !!this.usernameState() && !!this.passwordState());
  readonly username = computed(() => this.usernameState());
  readonly role = computed(() => this.roleState());
  readonly employeeId = computed(() => this.employeeIdState());
  readonly isAdmin = computed(() => this.roleState() === 'ADMINISTRADOR');

  login(username: string, password: string): Observable<{ username: string; role: RoleName; employeeId: number | null }> {
    this.usernameState.set(username);
    this.passwordState.set(password);
    localStorage.setItem('inv_user', username);
    localStorage.setItem('inv_pass', password);

    return this.http.get<{ username: string; role: RoleName; employeeId: number | null }>('/api/auth/me').pipe(
      tap((profile) => {
        this.roleState.set(profile.role);
        this.employeeIdState.set(profile.employeeId ?? null);
        localStorage.setItem('inv_role', profile.role);
        if (profile.employeeId !== null && profile.employeeId !== undefined) {
          localStorage.setItem('inv_employee_id', String(profile.employeeId));
        } else {
          localStorage.removeItem('inv_employee_id');
        }
      })
    );
  }

  logout(): void {
    this.usernameState.set('');
    this.passwordState.set('');
    this.roleState.set('');
    this.employeeIdState.set(null);
    localStorage.removeItem('inv_user');
    localStorage.removeItem('inv_pass');
    localStorage.removeItem('inv_role');
    localStorage.removeItem('inv_employee_id');
  }

  basicToken(): string {
    return btoa(`${this.usernameState()}:${this.passwordState()}`);
  }

  canAccessModule(module: 'adquisiciones' | 'inventario' | 'asignaciones' | 'bajas' | 'reportes' | 'empleado' | 'catalogos' | 'admin-empleados'): boolean {
    const role = this.roleState();
    if (!role) return false;
    if (role === 'ADMINISTRADOR') return true;
    if (role === 'COMPRAS') return module === 'adquisiciones';
    if (role === 'INVENTARIO') return module === 'inventario' || module === 'asignaciones' || module === 'bajas' || module === 'reportes' || module === 'catalogos';
    if (role === 'FINANZAS') return module === 'reportes';
    return module === 'empleado';
  }
}
