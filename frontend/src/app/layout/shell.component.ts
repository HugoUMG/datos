import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService, ModuleName } from '../core/services/auth.service';
import { ROLE_LABELS } from '../shared/labels';
import { IconComponent } from '../shared/ui';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  module?: ModuleName;
}

const NAV: NavItem[] = [
  { path: '/menu', label: 'Inicio', icon: 'home' },
  { path: '/adquisiciones', label: 'Adquisiciones', icon: 'cart', module: 'adquisiciones' },
  { path: '/catalogos', label: 'Proveedores y partidas', icon: 'truck', module: 'catalogos' },
  { path: '/inventario', label: 'Inventario', icon: 'box', module: 'inventario' },
  { path: '/asignaciones', label: 'Asignaciones', icon: 'swap', module: 'asignaciones' },
  { path: '/bajas', label: 'Bajas', icon: 'trash', module: 'bajas' },
  { path: '/reportes', label: 'Reportes', icon: 'chart', module: 'reportes' },
  { path: '/empleado', label: 'Mis activos', icon: 'user', module: 'empleado' },
  { path: '/admin-empleados', label: 'Empleados', icon: 'users', module: 'admin-empleados' },
  { path: '/usuarios', label: 'Usuarios', icon: 'key', module: 'usuarios' }
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <div class="layout" [class.open]="menuOpen()">
      <aside class="sidebar">
        <div class="brand">
          <span class="logo"><app-icon name="box" [size]="20" /></span>
          <div><strong>Gestión de Activos</strong><span>Innova Sistemas</span></div>
        </div>
        <nav>
          @for (item of nav(); track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
              <app-icon [name]="item.icon" />
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>
        <div class="user">
          <div class="avatar">{{ initial() }}</div>
          <div class="who"><strong>{{ auth.username() }}</strong><span>{{ roleLabel() }}</span></div>
          <button type="button" class="btn-ghost logout" (click)="logout()" title="Cerrar sesión" aria-label="Cerrar sesión">
            <app-icon name="logout" />
          </button>
        </div>
      </aside>
      <div class="scrim" (click)="menuOpen.set(false)"></div>
      <div class="main">
        <header class="topbar">
          <button type="button" class="btn-secondary menu-btn" (click)="menuOpen.set(true)" aria-label="Abrir menú">
            <app-icon name="menu" />
          </button>
          <strong>Gestión de Activos</strong>
        </header>
        <main class="content"><router-outlet /></main>
      </div>
    </div>
  `,
  styles: [`
    .layout { display: grid; grid-template-columns: 250px 1fr; min-height: 100vh; }
    .sidebar { background: var(--sidebar); color: var(--sidebar-text); display: flex; flex-direction: column;
      position: sticky; top: 0; height: 100vh; padding: 1rem .75rem; gap: 1rem; }
    .brand { display: flex; gap: .65rem; align-items: center; padding: .25rem .5rem .75rem; border-bottom: 1px solid #1e293b; }
    .brand strong { color: #fff; display: block; font-size: .95rem; }
    .brand span { font-size: .75rem; color: #94a3b8; }
    .logo { background: var(--primary); color: #fff; border-radius: 10px; padding: .45rem; display: inline-flex; }
    nav { display: grid; gap: .15rem; overflow-y: auto; flex: 1; align-content: start; }
    nav a { display: flex; align-items: center; gap: .65rem; padding: .6rem .7rem; border-radius: 8px;
      color: var(--sidebar-text); text-decoration: none; font-size: .9rem; font-weight: 500; }
    nav a:hover { background: var(--sidebar-active); color: #fff; }
    nav a.active { background: var(--primary); color: #fff; }
    .user { display: flex; align-items: center; gap: .6rem; padding: .75rem .5rem 0; border-top: 1px solid #1e293b; }
    .avatar { width: 34px; height: 34px; border-radius: 50%; background: #334155; color: #fff; display: grid;
      place-items: center; font-weight: 700; text-transform: uppercase; flex-shrink: 0; }
    .who { flex: 1; min-width: 0; }
    .who strong { color: #fff; display: block; font-size: .875rem; overflow: hidden; text-overflow: ellipsis; }
    .who span { font-size: .75rem; color: #94a3b8; }
    .logout { color: #94a3b8; }
    .logout:hover { color: #fff; background: var(--sidebar-active); }
    .main { min-width: 0; display: flex; flex-direction: column; }
    .content { padding: 1.75rem; flex: 1; }
    .topbar, .scrim { display: none; }

    @media (max-width: 900px) {
      .layout { grid-template-columns: 1fr; }
      .sidebar { position: fixed; inset: 0 auto 0 0; width: 260px; z-index: 40; transform: translateX(-100%);
        transition: transform .2s ease; }
      .layout.open .sidebar { transform: none; }
      .layout.open .scrim { display: block; position: fixed; inset: 0; background: rgba(15,23,42,.4); z-index: 30; }
      .topbar { display: flex; align-items: center; gap: .75rem; padding: .75rem 1rem; background: var(--surface);
        border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 20; }
      .menu-btn { padding: .45rem; }
      .content { padding: 1rem; }
    }
  `]
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly menuOpen = signal(false);
  readonly nav = computed(() => {
    this.auth.role();
    return NAV.filter((item) => !item.module || this.auth.canAccessModule(item.module));
  });
  readonly initial = computed(() => this.auth.username().charAt(0) || '?');
  readonly roleLabel = computed(() => ROLE_LABELS[this.auth.role()] ?? this.auth.role());

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.menuOpen.set(false));
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
