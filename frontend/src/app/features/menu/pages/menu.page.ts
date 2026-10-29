import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Asset, Assignment, BudgetLine, Department, Disposal, Employee, PurchaseInvoice, Supplier } from '../../../core/models/api.models';
import { AssetsApiService } from '../../../core/services/assets-api.service';
import { AuthService, ModuleName } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { downloadBlob, errorMessage } from '../../../core/http-error';
import { ROLE_LABELS } from '../../../shared/labels';
import { IconComponent } from '../../../shared/ui';
import { todayIso } from '../../../shared/validators';

interface Shortcut {
  path: string;
  title: string;
  text: string;
  icon: string;
  module: ModuleName;
}

interface Step {
  title: string;
  text: string;
  path: string;
  done: boolean;
}

interface Alert {
  text: string;
  path: string;
  action: string;
  tone: 'warning' | 'danger' | 'info';
}

const SHORTCUTS: Shortcut[] = [
  { path: '/adquisiciones', title: 'Adquisiciones', text: 'Registra facturas de compra.', icon: 'cart', module: 'adquisiciones' },
  { path: '/catalogos', title: 'Proveedores y partidas', text: 'Catálogos para las compras.', icon: 'truck', module: 'catalogos' },
  { path: '/inventario', title: 'Inventario', text: 'Alta de activos, historial y QR.', icon: 'box', module: 'inventario' },
  { path: '/asignaciones', title: 'Asignaciones', text: 'Entrega y devolución de bienes.', icon: 'swap', module: 'asignaciones' },
  { path: '/bajas', title: 'Bajas', text: 'Solicitudes y aprobaciones de baja.', icon: 'trash', module: 'bajas' },
  { path: '/reportes', title: 'Reportes', text: 'Inversión y reportes exportables.', icon: 'chart', module: 'reportes' },
  { path: '/empleado', title: 'Mis activos', text: 'Confirma y consulta tus bienes.', icon: 'user', module: 'empleado' },
  { path: '/admin-empleados', title: 'Empleados', text: 'Empleados y departamentos.', icon: 'users', module: 'admin-empleados' },
  { path: '/usuarios', title: 'Usuarios', text: 'Cuentas, roles y contraseñas.', icon: 'key', module: 'usuarios' }
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

      @if (steps().length && pendingSteps() > 0) {
        <div class="card">
          <div class="card-header">
            <div><h2>Primeros pasos</h2><p>Sigue este orden para dejar el sistema listo: cada paso necesita del anterior.</p></div>
            <span class="muted small">{{ steps().length - pendingSteps() }} de {{ steps().length }} completados</span>
          </div>
          <div class="progress"><span [style.width.%]="(steps().length - pendingSteps()) / steps().length * 100"></span></div>
          <ol class="steps">
            @for (s of steps(); track s.title; let i = $index) {
              <li [class.done]="s.done" [class.next]="i === nextStep()">
                <span class="num">@if (s.done) { <app-icon name="check" [size]="14" /> } @else { {{ i + 1 }} }</span>
                <div><strong>{{ s.title }}</strong><p class="small muted">{{ s.text }}</p></div>
                @if (!s.done) { <a class="btn btn-sm" [class.btn-secondary]="i !== nextStep()" [routerLink]="s.path">Ir</a> }
              </li>
            }
          </ol>
        </div>
      }

      @if (alerts().length) {
        <div class="alerts">
          @for (a of alerts(); track a.text) {
            <div class="alert" [class]="'alert alert-' + a.tone">
              <span>{{ a.text }}</span>
              <a [routerLink]="a.path">{{ a.action }} →</a>
            </div>
          }
        </div>
      }

      @if (showInventoryKpis() || totalInvested() !== null || isCompras()) {
        <div class="kpis">
          @if (showInventoryKpis()) {
            <div class="card kpi"><span class="label">Activos registrados</span><span class="value">{{ kpi(assets()?.length) }}</span></div>
            <div class="card kpi"><span class="label">Disponibles en almacén</span><span class="value">{{ kpi(inStock()) }}</span></div>
            <div class="card kpi"><span class="label">Asignados</span><span class="value">{{ kpi(assignedCount()) }}</span></div>
          }
          @if (isCompras()) {
            <div class="card kpi"><span class="label">Facturas registradas</span><span class="value">{{ kpi(invoices()?.length) }}</span></div>
            <div class="card kpi"><span class="label">Proveedores activos</span><span class="value">{{ kpi(activeSuppliers()) }}</span></div>
          }
          @if (totalInvested() !== null) {
            <div class="card kpi"><span class="label">Total invertido</span><span class="value">{{ totalInvested() | currency }}</span></div>
          }
        </div>
      }

      @if (auth.role() === 'EMPLEADO' && myPending() !== null) {
        @if (myPending()! > 0) {
          <div class="card row between">
            <div>
              <h2>Tienes {{ myPending() }} {{ myPending() === 1 ? 'bien' : 'bienes' }} por confirmar</h2>
              <p class="muted small">Revisa y acepta la recepción de los bienes que te asignaron.</p>
            </div>
            <a class="btn" routerLink="/empleado">Confirmar ahora</a>
          </div>
        } @else {
          <div class="card"><h2>Todo al día</h2><p class="muted small">No tienes asignaciones pendientes. Consulta tus bienes en Mis activos.</p></div>
        }
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

      @if (auth.isAdmin()) {
        <div class="card row between">
          <div>
            <h2>Respaldo de la información</h2>
            <p class="muted small">Descarga una copia de todos los datos (sin contraseñas) en un archivo JSON. Recomendado al menos una vez por semana.</p>
          </div>
          <button type="button" class="btn-secondary" (click)="backup()" [disabled]="backingUp()">
            @if (backingUp()) { <span class="spinner"></span> } @else { <app-icon name="download" [size]="16" /> } Descargar respaldo
          </button>
        </div>
      }
    </section>
  `,
  styles: [`
    .section-title { margin-bottom: .75rem; }
    .between { justify-content: space-between; }
    .tiles { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
    .tile { display: flex; gap: .9rem; align-items: center; text-decoration: none; color: inherit; transition: border-color .15s, transform .15s; }
    .tile:hover { border-color: var(--primary); transform: translateY(-1px); }
    .tile-icon { background: var(--primary-soft); color: var(--primary); border-radius: 10px; padding: .6rem; display: inline-flex; }
    .progress { height: 6px; background: var(--neutral-soft); border-radius: 99px; overflow: hidden; margin-bottom: 1rem; }
    .progress span { display: block; height: 100%; background: var(--success); transition: width .3s; }
    .steps { list-style: none; margin: 0; padding: 0; display: grid; gap: .5rem; }
    .steps li { display: flex; gap: .8rem; align-items: center; padding: .65rem .8rem; border: 1px solid var(--border); border-radius: var(--radius-sm); }
    .steps li > div { flex: 1; }
    .steps li.done { opacity: .6; }
    .steps li.done strong { text-decoration: line-through; }
    .steps li.next { border-color: var(--primary); background: var(--primary-soft); }
    .num { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font-size: .8rem; font-weight: 700;
      background: var(--neutral-soft); flex-shrink: 0; }
    .done .num { background: var(--success); color: #fff; }
    .next .num { background: var(--primary); color: #fff; }
    .alerts { display: grid; gap: .5rem; }
    .alerts .alert { display: flex; justify-content: space-between; gap: 1rem; align-items: center; flex-wrap: wrap; }
    .alerts a { font-weight: 600; color: inherit; }
  `]
})
export class MenuPage implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(AssetsApiService);
  private readonly toast = inject(ToastService);

  readonly today = new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  readonly roleLabel = computed(() => ROLE_LABELS[this.auth.role()] ?? this.auth.role());
  readonly shortcuts = computed(() => SHORTCUTS.filter((s) => this.auth.canAccessModule(s.module)));
  readonly showInventoryKpis = computed(() => this.auth.canAccessModule('inventario'));
  readonly isCompras = computed(() => this.auth.role() === 'COMPRAS');

  readonly assets = signal<Asset[] | null>(null);
  readonly assignments = signal<Assignment[] | null>(null);
  readonly pendingDisposals = signal<Disposal[] | null>(null);
  readonly departments = signal<Department[] | null>(null);
  readonly employees = signal<Employee[] | null>(null);
  readonly suppliers = signal<Supplier[] | null>(null);
  readonly budgetLines = signal<BudgetLine[] | null>(null);
  readonly invoices = signal<PurchaseInvoice[] | null>(null);
  readonly totalInvested = signal<number | null>(null);
  readonly myPending = signal<number | null>(null);
  readonly backingUp = signal(false);

  readonly inStock = computed(() => this.assets()?.filter((a) => a.status === 'EN_ALMACEN').length);
  readonly assignedCount = computed(() => this.assets()?.filter((a) => a.status === 'ASIGNADO').length);
  readonly activeSuppliers = computed(() => this.suppliers()?.filter((s) => s.active).length);

  /** Guía de arranque para el administrador, en el orden en que dependen los datos. */
  readonly steps = computed<Step[]>(() => {
    // Esperar a que lleguen todas las listas; si no, la guía parpadea con pasos "pendientes" que ya están hechos.
    const sources = [this.departments(), this.employees(), this.suppliers(), this.budgetLines(), this.invoices(), this.assets(), this.assignments()];
    if (!this.auth.isAdmin() || sources.some((rows) => rows === null)) return [];
    const count = (rows: unknown[] | null) => rows?.length ?? 0;
    return [
      { title: 'Crea un departamento', text: 'Los empleados pertenecen a un departamento.', path: '/admin-empleados', done: count(this.departments()) > 0 },
      { title: 'Registra empleados', text: 'Son quienes reciben los activos.', path: '/admin-empleados', done: count(this.employees()) > 0 },
      { title: 'Agrega un proveedor y una partida', text: 'Se necesitan para registrar facturas.', path: '/catalogos', done: count(this.suppliers()) > 0 && count(this.budgetLines()) > 0 },
      { title: 'Registra una factura de compra', text: 'Cada activo nace de una factura.', path: '/adquisiciones', done: count(this.invoices()) > 0 },
      { title: 'Da de alta un activo', text: 'Con su serie, etiqueta y QR.', path: '/inventario', done: count(this.assets()) > 0 },
      { title: 'Asigna el activo a un empleado', text: 'El empleado lo confirmará desde su portal.', path: '/asignaciones', done: count(this.assignments()) > 0 }
    ];
  });
  readonly pendingSteps = computed(() => this.steps().filter((s) => !s.done).length);
  readonly nextStep = computed(() => this.steps().findIndex((s) => !s.done));

  readonly alerts = computed<Alert[]>(() => {
    const list: Alert[] = [];
    const today = todayIso();
    const assignments = this.assignments() ?? [];
    const overdue = assignments.filter((a) => a.status === 'ACTIVA' && a.expectedReturnAt && a.expectedReturnAt < today).length;
    const toConfirm = assignments.filter((a) => a.status === 'PENDIENTE_CONFIRMACION').length;
    const disposals = this.pendingDisposals()?.length ?? 0;
    if (overdue) list.push({ text: `${overdue} ${overdue === 1 ? 'activo tiene' : 'activos tienen'} la devolución vencida.`, path: '/asignaciones', action: 'Revisar', tone: 'danger' });
    if (disposals) list.push({ text: `${disposals} ${disposals === 1 ? 'solicitud de baja espera' : 'solicitudes de baja esperan'} aprobación.`, path: '/bajas', action: 'Atender', tone: 'warning' });
    if (toConfirm) list.push({ text: `${toConfirm} ${toConfirm === 1 ? 'asignación espera' : 'asignaciones esperan'} que el empleado confirme la recepción.`, path: '/asignaciones', action: 'Ver', tone: 'info' });
    return list;
  });

  ngOnInit(): void {
    if (this.showInventoryKpis()) {
      this.api.listAssets().subscribe({ next: (rows) => this.assets.set(rows) });
      this.api.listAssignments().subscribe({ next: (rows) => this.assignments.set(rows) });
      this.api.listPendingDisposals().subscribe({ next: (rows) => this.pendingDisposals.set(rows) });
    }
    if (this.auth.isAdmin()) {
      this.api.listDepartments().subscribe({ next: (rows) => this.departments.set(rows) });
      this.api.listEmployees().subscribe({ next: (rows) => this.employees.set(rows) });
    }
    if (this.auth.isAdmin() || this.isCompras()) {
      this.api.listSuppliers().subscribe({ next: (rows) => this.suppliers.set(rows) });
      this.api.listBudgetLines().subscribe({ next: (rows) => this.budgetLines.set(rows) });
      this.api.listInvoices().subscribe({ next: (rows) => this.invoices.set(rows) });
    }
    if (this.auth.canAccessModule('reportes')) {
      this.api.investedSummary().subscribe({ next: (s) => this.totalInvested.set(s.totalInvested) });
    }
    if (this.auth.role() === 'EMPLEADO') {
      this.api.myPendingAssignments().subscribe({ next: (rows) => this.myPending.set(rows.length) });
    }
  }

  kpi(value: number | undefined): string {
    return value === undefined ? '…' : String(value);
  }

  backup(): void {
    this.backingUp.set(true);
    this.api.downloadBackup().subscribe({
      next: (blob) => {
        downloadBlob(blob, `respaldo-activos-${todayIso()}.json`);
        this.toast.success('Respaldo descargado. Guárdalo en un lugar seguro.');
        this.backingUp.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err, 'No se pudo generar el respaldo.'));
        this.backingUp.set(false);
      }
    });
  }
}
