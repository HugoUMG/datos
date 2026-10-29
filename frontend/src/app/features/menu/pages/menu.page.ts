import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Asset, Assignment, Disposal } from '../../../core/models/api.models';
import { AssetsApiService } from '../../../core/services/assets-api.service';
import { AuthService, ModuleName } from '../../../core/services/auth.service';
import { ROLE_LABELS } from '../../../shared/labels';
import { IconComponent } from '../../../shared/ui';

interface Shortcut {
  path: string;
  title: string;
  text: string;
  icon: string;
  module: ModuleName;
}

const SHORTCUTS: Shortcut[] = [
  { path: '/adquisiciones', title: 'Adquisiciones', text: 'Registra facturas de compra.', icon: 'cart', module: 'adquisiciones' },
  { path: '/catalogos', title: 'Proveedores y partidas', text: 'Catálogos para las compras.', icon: 'truck', module: 'catalogos' },
  { path: '/inventario', title: 'Inventario', text: 'Alta de activos y códigos QR.', icon: 'box', module: 'inventario' },
  { path: '/asignaciones', title: 'Asignaciones', text: 'Entrega y devolución de bienes.', icon: 'swap', module: 'asignaciones' },
  { path: '/bajas', title: 'Bajas', text: 'Solicitudes y aprobaciones de baja.', icon: 'trash', module: 'bajas' },
  { path: '/reportes', title: 'Reportes', text: 'Inversión y reportes exportables.', icon: 'chart', module: 'reportes' },
  { path: '/empleado', title: 'Mis activos', text: 'Confirma y consulta tus bienes.', icon: 'user', module: 'empleado' },
  { path: '/admin-empleados', title: 'Empleados', text: 'Registro de empleados.', icon: 'users', module: 'admin-empleados' },
  { path: '/usuarios', title: 'Usuarios', text: 'Cuentas y roles de acceso.', icon: 'key', module: 'usuarios' }
];

@Component({
  standalone: true,
  imports: [RouterLink, CurrencyPipe, IconComponent],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Hola, {{ auth.username() }}</h1>
          <p>Rol: {{ roleLabel() }} · {{ today }}</p>
        </div>
      </div>

      @if (showInventoryKpis() || totalInvested() !== null) {
        <div class="kpis">
          @if (showInventoryKpis()) {
            <div class="card kpi"><span class="label">Activos registrados</span><span class="value">{{ kpiValue(assets()?.length) }}</span></div>
            <div class="card kpi"><span class="label">Disponibles en almacén</span><span class="value">{{ kpiValue(inStock()) }}</span></div>
            <div class="card kpi"><span class="label">Asignaciones por confirmar</span><span class="value">{{ kpiValue(pendingAssignments()) }}</span></div>
            <div class="card kpi"><span class="label">Bajas pendientes</span><span class="value">{{ kpiValue(pendingDisposals()?.length) }}</span></div>
          }
          @if (totalInvested() !== null) {
            <div class="card kpi"><span class="label">Total invertido</span><span class="value">{{ totalInvested() | currency }}</span></div>
          }
        </div>
      }

      @if (auth.role() === 'EMPLEADO' && myPending() !== null) {
        <div class="card row between">
          <div>
            <h2>Tienes {{ myPending() }} asignación(es) por confirmar</h2>
            <p class="muted small">Revisa y acepta la recepción de los bienes que te asignaron.</p>
          </div>
          <a class="btn" routerLink="/empleado">Ver mis activos</a>
        </div>
      }

      <div>
        <h2 class="section-title">Módulos</h2>
        <div class="tiles">
          @for (s of shortcuts(); track s.path) {
            <a class="card tile" [routerLink]="s.path">
              <span class="tile-icon"><app-icon [name]="s.icon" [size]="22" /></span>
              <div><strong>{{ s.title }}</strong><p class="muted small">{{ s.text }}</p></div>
            </a>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .section-title { margin-bottom: .75rem; }
    .between { justify-content: space-between; }
    .tiles { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
    .tile { display: flex; gap: .9rem; align-items: center; text-decoration: none; color: inherit;
      transition: border-color .15s, transform .15s; }
    .tile:hover { border-color: var(--primary); transform: translateY(-1px); }
    .tile-icon { background: var(--primary-soft); color: var(--primary); border-radius: 10px; padding: .6rem; display: inline-flex; }
  `]
})
export class MenuPage implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(AssetsApiService);

  readonly today = new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  readonly roleLabel = computed(() => ROLE_LABELS[this.auth.role()] ?? this.auth.role());
  readonly shortcuts = computed(() => SHORTCUTS.filter((s) => this.auth.canAccessModule(s.module)));
  readonly showInventoryKpis = computed(() => this.auth.canAccessModule('inventario'));

  readonly assets = signal<Asset[] | null>(null);
  readonly assignments = signal<Assignment[] | null>(null);
  readonly pendingDisposals = signal<Disposal[] | null>(null);
  readonly totalInvested = signal<number | null>(null);
  readonly myPending = signal<number | null>(null);

  readonly inStock = computed(() => this.assets()?.filter((a) => a.status === 'EN_ALMACEN').length);
  readonly pendingAssignments = computed(
    () => this.assignments()?.filter((a) => a.status === 'PENDIENTE_CONFIRMACION').length
  );

  ngOnInit(): void {
    if (this.showInventoryKpis()) {
      this.api.listAssets().subscribe({ next: (rows) => this.assets.set(rows) });
      this.api.listAssignments().subscribe({ next: (rows) => this.assignments.set(rows) });
      this.api.listPendingDisposals().subscribe({ next: (rows) => this.pendingDisposals.set(rows) });
    }
    if (this.auth.canAccessModule('reportes')) {
      this.api.investedSummary().subscribe({ next: (s) => this.totalInvested.set(s.totalInvested) });
    }
    if (this.auth.role() === 'EMPLEADO') {
      this.api.myPendingAssignments().subscribe({ next: (rows) => this.myPending.set(rows.length) });
    }
  }

  kpiValue(value: number | undefined): string {
    return value === undefined ? '…' : String(value);
  }
}
