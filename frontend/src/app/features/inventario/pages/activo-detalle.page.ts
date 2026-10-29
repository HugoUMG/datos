import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AssetHistory } from '../../../core/models/api.models';
import { AssetsApiService } from '../../../core/services/assets-api.service';
import { errorMessage } from '../../../core/http-error';
import { IconComponent, StatusBadgeComponent } from '../../../shared/ui';

interface TimelineEvent {
  date: string;
  title: string;
  detail: string;
  tone: 'primary' | 'success' | 'warning' | 'danger';
}

@Component({
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, IconComponent, StatusBadgeComponent],
  template: `
    <section class="page">
      <a routerLink="/inventario" class="back">← Volver a Inventario</a>

      @if (error()) {
        <div class="alert alert-danger">{{ error() }}</div>
      } @else if (!history()) {
        <div class="card empty"><span class="spinner"></span> Cargando historial…</div>
      } @else {
        @let h = history()!;
        <div class="page-header">
          <div>
            <h1>{{ h.asset.name }}</h1>
            <p><span class="mono">{{ h.asset.assetCode }}</span> · <app-status-badge [status]="h.asset.status" /></p>
          </div>
          <a class="btn btn-secondary" [href]="api.inventoryAssetQr(h.asset.id)" target="_blank"><app-icon name="qr" [size]="16" /> Código QR</a>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h2>Datos del activo</h2></div>
            <dl class="details">
              <div><dt>Número de serie</dt><dd class="mono">{{ h.asset.serialNumber }}</dd></div>
              <div><dt>Etiqueta</dt><dd>{{ h.asset.tagType }} · <span class="mono">{{ h.asset.tagValue }}</span></dd></div>
              <div><dt>Ubicación</dt><dd>{{ h.asset.location }}</dd></div>
              <div><dt>Responsable actual</dt><dd>{{ h.asset.currentCustodian?.fullName || 'Sin asignar' }}</dd></div>
              <div><dt>Fecha de adquisición</dt><dd>{{ h.asset.acquisitionDate | date: 'dd/MM/yyyy' }}</dd></div>
              <div><dt>Valor</dt><dd>{{ h.asset.acquisitionCost | currency }}</dd></div>
              @if (h.asset.description) { <div style="grid-column:1/-1"><dt>Descripción</dt><dd>{{ h.asset.description }}</dd></div> }
            </dl>
          </div>
          <div class="card">
            <div class="card-header"><h2>Factura de compra</h2></div>
            @if (h.invoice; as inv) {
              <dl class="details">
                <div><dt>Número</dt><dd class="mono">{{ inv.invoiceNumber }}</dd></div>
                <div><dt>Fecha</dt><dd>{{ inv.invoiceDate | date: 'dd/MM/yyyy' }}</dd></div>
                <div><dt>Proveedor</dt><dd>{{ inv.supplier?.name || '—' }}</dd></div>
                <div><dt>NIT</dt><dd class="mono">{{ inv.supplier?.taxId || '—' }}</dd></div>
                <div><dt>Partida</dt><dd>{{ inv.budgetLine?.code || '—' }}</dd></div>
                <div><dt>Total de la factura</dt><dd>{{ inv.totalAmount | currency }}</dd></div>
              </dl>
            } @else {
              <p class="muted">Sin factura asociada.</p>
            }
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div><h2>Historial</h2><p>Todo lo que le ha pasado a este activo, del más reciente al más antiguo.</p></div></div>
          <ol class="timeline">
            @for (e of timeline(); track $index) {
              <li [class]="e.tone">
                <time>{{ e.date | date: 'dd/MM/yyyy' }}</time>
                <div><strong>{{ e.title }}</strong></div>
                <div class="small muted">{{ e.detail }}</div>
              </li>
            }
          </ol>
        </div>
      }
    </section>
  `,
  styles: ['.back { text-decoration: none; font-weight: 600; font-size: .9rem; } .page-header p { display: flex; gap: .5rem; align-items: center; }']
})
export class ActivoDetallePage {
  readonly api = inject(AssetsApiService);

  /** :id de la ruta (withComponentInputBinding). */
  readonly id = input.required<string>();
  readonly history = signal<AssetHistory | null>(null);
  readonly error = signal('');

  constructor() {
    effect(() => {
      const id = Number(this.id());
      this.history.set(null);
      this.error.set('');
      this.api.assetHistory(id).subscribe({
        next: (h) => this.history.set(h),
        error: (err) => this.error.set(errorMessage(err, 'No se pudo cargar el historial del activo.'))
      });
    });
  }

  readonly timeline = computed<TimelineEvent[]>(() => {
    const h = this.history();
    if (!h) return [];
    const events: TimelineEvent[] = [];
    if (h.invoice) {
      events.push({ date: h.invoice.invoiceDate, title: `Comprado con la factura ${h.invoice.invoiceNumber}`, detail: h.invoice.supplier?.name ?? '', tone: 'primary' });
    }
    events.push({ date: h.asset.acquisitionDate, title: 'Registrado en inventario', detail: `Ubicación inicial: ${h.asset.location}`, tone: 'primary' });
    for (const a of h.assignments) {
      const who = a.employee?.fullName ?? 'un empleado';
      events.push({
        date: a.assignedAt,
        title: `Asignado a ${who}`,
        detail: a.status === 'PENDIENTE_CONFIRMACION' ? 'Pendiente de que el empleado confirme la recepción' : 'Recepción confirmada por el empleado',
        tone: a.status === 'PENDIENTE_CONFIRMACION' ? 'warning' : 'success'
      });
      if (a.returnedAt) events.push({ date: a.returnedAt, title: `Devuelto por ${who}`, detail: 'Regresó al almacén central', tone: 'primary' });
    }
    for (const d of h.disposals) {
      events.push({ date: d.requestedAt, title: 'Baja solicitada', detail: `${d.reason} · por ${d.requestedBy}`, tone: 'warning' });
      if (d.approvedAt) {
        const approved = d.status === 'APROBADA' || d.status === 'EJECUTADA';
        events.push({
          date: d.approvedAt,
          title: approved ? 'Baja aprobada' : 'Baja rechazada',
          detail: `por ${d.approvedBy ?? '—'}${approved && d.finalValue !== undefined && d.finalValue !== null ? ` · valor final Q${Number(d.finalValue).toFixed(2)}` : ''}`,
          tone: approved ? 'danger' : 'primary'
        });
      }
    }
    // Más reciente primero; a igual fecha se respeta el orden en que ocurrió.
    return events.map((e, i) => ({ e, i })).sort((a, b) => (a.e.date === b.e.date ? b.i - a.i : a.e.date < b.e.date ? 1 : -1)).map((x) => x.e);
  });
}
