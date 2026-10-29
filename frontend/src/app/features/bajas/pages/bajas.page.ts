import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Asset, Disposal } from '../../../core/models/api.models';
import { AssetsApiService } from '../../../core/services/assets-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { errorMessage } from '../../../core/http-error';
import { SearchPipe } from '../../../shared/search.pipe';
import { FieldErrorComponent, IconComponent, SearchBoxComponent, StatusBadgeComponent } from '../../../shared/ui';
import { maxDecimals } from '../../../shared/validators';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, SearchPipe, FieldErrorComponent, IconComponent, SearchBoxComponent, StatusBadgeComponent],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Bajas y enajenación</h1>
          <p>Solicita la baja de un activo y aprueba o rechaza las solicitudes pendientes.</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h2>Solicitar baja</h2></div>
        <form [formGroup]="requestForm" (ngSubmit)="requestDisposal()" class="form-grid" novalidate>
          <div class="field">
            <label for="d-asset">Activo<span class="req">*</span></label>
            <select id="d-asset" formControlName="assetId">
              <option [ngValue]="null" disabled>Selecciona un activo</option>
              @for (a of eligibleAssets(); track a.id) { <option [ngValue]="a.id">{{ a.assetCode }} — {{ a.name }}</option> }
            </select>
            <app-field-error [control]="requestForm.controls.assetId" />
          </div>
          <div class="field">
            <label for="d-reason">Motivo<span class="req">*</span></label>
            <input id="d-reason" formControlName="reason" placeholder="Fin de vida útil, daño irreparable…" maxlength="300" />
            <app-field-error [control]="requestForm.controls.reason" />
          </div>
          <div class="field">
            <label for="d-by">Solicitado por<span class="req">*</span></label>
            <input id="d-by" formControlName="requestedBy" maxlength="80" />
            <app-field-error [control]="requestForm.controls.requestedBy" />
          </div>
          <div class="form-actions">
            <button type="submit" [disabled]="saving()">@if (saving()) { <span class="spinner"></span> } Enviar solicitud</button>
          </div>
        </form>
      </div>

      <div class="card">
        <div class="card-header">
          <h2>Solicitudes pendientes</h2>
          <button type="button" class="btn-secondary btn-sm" (click)="loadPending()"><app-icon name="refresh" [size]="14" /> Actualizar</button>
        </div>
        @let rows = pending() | search: term();
        <div class="toolbar">
          <app-search-box [(value)]="term" placeholder="Buscar por activo, motivo o solicitante…" />
          <span class="count">{{ rows.length }} de {{ pending().length }}</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Activo</th><th>Motivo</th><th>Solicitado por</th><th>Fecha</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              @for (d of rows; track d.id) {
                <tr>
                  <td><span class="mono">{{ d.asset.assetCode }}</span><br /><span class="small muted">{{ d.asset.name }}</span></td>
                  <td>{{ d.reason }}</td>
                  <td>{{ d.requestedBy }}</td>
                  <td class="nowrap">{{ d.requestedAt | date: 'dd/MM/yyyy' }}</td>
                  <td><app-status-badge [status]="d.status" /></td>
                  <td>
                    <div class="row">
                      <button type="button" class="btn-success btn-sm" (click)="openApprove(d)"><app-icon name="check" [size]="14" /> Aprobar</button>
                      <button type="button" class="btn-secondary btn-sm" (click)="reject(d)">Rechazar</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty">
                  @if (loading()) { <span class="spinner"></span> Cargando… }
                  @else if (term()) { <strong>Sin resultados</strong> }
                  @else { <strong>No hay solicitudes pendientes</strong>Todo al día. }
                </td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (approving(); as d) {
        <div class="modal-backdrop" (click)="approving.set(null)">
          <form class="modal" [formGroup]="approveForm" (ngSubmit)="approve(d)" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" novalidate>
            <div>
              <h2>Aprobar baja</h2>
              <p class="muted small">{{ d.asset.assetCode }} — {{ d.asset.name }} · costo de adquisición {{ d.asset.acquisitionCost | currency }}</p>
            </div>
            <div class="field">
              <label for="ap-by">Aprobado por<span class="req">*</span></label>
              <input id="ap-by" formControlName="approvedBy" maxlength="80" />
              <app-field-error [control]="approveForm.controls.approvedBy" />
            </div>
            <div class="field">
              <label for="ap-val">Valor final (Q)<span class="req">*</span></label>
              <input id="ap-val" type="number" inputmode="decimal" formControlName="finalValue" min="0" step="0.01" placeholder="0.00" />
              <span class="hint">Valor de rescate o venta; 0 si se desecha.</span>
              <app-field-error [control]="approveForm.controls.finalValue" />
            </div>
            <div class="alert alert-warning small">El activo quedará dado de baja y ya no podrá asignarse.</div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="approving.set(null)">Cancelar</button>
              <button type="submit" class="btn-success">Aprobar baja</button>
            </div>
          </form>
        </div>
      }
    </section>
  `
})
export class BajasPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AssetsApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly pending = signal<Disposal[]>([]);
  readonly assets = signal<Asset[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly term = signal('');
  readonly approving = signal<Disposal | null>(null);

  /** No se puede pedir baja de algo ya dado de baja ni con una solicitud abierta. */
  readonly eligibleAssets = computed(() => {
    const requested = new Set(this.pending().map((d) => d.asset.id));
    return this.assets().filter((a) => a.status !== 'DADO_DE_BAJA' && !requested.has(a.id));
  });

  readonly requestForm = this.fb.group({
    assetId: [null as number | null, Validators.required],
    reason: ['', [Validators.required, Validators.maxLength(300)]],
    requestedBy: [this.auth.username(), [Validators.required, Validators.maxLength(80)]]
  });

  readonly approveForm = this.fb.group({
    approvedBy: [this.auth.username(), Validators.required],
    finalValue: [null as number | null, [Validators.required, Validators.min(0), maxDecimals(2)]]
  });

  ngOnInit(): void {
    this.loadPending();
  }

  loadPending(): void {
    this.loading.set(true);
    this.api.listAssets().subscribe({ next: (rows) => this.assets.set(rows) });
    this.api.listPendingDisposals().subscribe({
      next: (rows) => this.pending.set(rows),
      error: (err) => this.toast.error(errorMessage(err, 'No se pudieron cargar las solicitudes.')),
      complete: () => this.loading.set(false)
    });
  }

  requestDisposal(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }
    const v = this.requestForm.getRawValue();
    this.saving.set(true);
    this.api.requestDisposal({ assetId: v.assetId!, reason: v.reason!.trim(), requestedBy: v.requestedBy!.trim() }).subscribe({
      next: () => {
        this.toast.success('Solicitud de baja enviada.');
        this.requestForm.reset({ requestedBy: this.auth.username() });
        this.loadPending();
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err, 'No fue posible enviar la solicitud.'));
        this.saving.set(false);
      }
    });
  }

  openApprove(d: Disposal): void {
    this.approveForm.reset({ approvedBy: this.auth.username(), finalValue: null });
    this.approving.set(d);
  }

  approve(d: Disposal): void {
    if (this.approveForm.invalid) {
      this.approveForm.markAllAsTouched();
      return;
    }
    const v = this.approveForm.getRawValue();
    this.api.approveDisposal(d.id, { approvedBy: v.approvedBy!.trim(), finalValue: v.finalValue! }).subscribe({
      next: () => {
        this.toast.success(`Baja de ${d.asset.assetCode} aprobada.`);
        this.approving.set(null);
        this.loadPending();
      },
      error: (err) => this.toast.error(errorMessage(err, 'No fue posible aprobar la baja.'))
    });
  }

  async reject(d: Disposal): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Rechazar solicitud',
      message: `¿Rechazar la baja de ${d.asset.assetCode} — ${d.asset.name}? El activo conservará su estado actual.`,
      confirmText: 'Rechazar',
      danger: true
    });
    if (!ok) return;
    this.api.rejectDisposal(d.id, { approvedBy: this.auth.username() }).subscribe({
      next: () => {
        this.toast.info(`Solicitud de ${d.asset.assetCode} rechazada.`);
        this.loadPending();
      },
      error: (err) => this.toast.error(errorMessage(err, 'No fue posible rechazar la solicitud.'))
    });
  }
}
