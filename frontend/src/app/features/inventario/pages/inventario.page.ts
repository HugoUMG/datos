import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Asset, PurchaseInvoice } from '../../../core/models/api.models';
import { AssetsApiService } from '../../../core/services/assets-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { errorMessage } from '../../../core/http-error';
import { ASSET_STATUSES, statusInfo } from '../../../shared/labels';
import { SearchPipe } from '../../../shared/search.pipe';
import { FieldErrorComponent, IconComponent, SearchBoxComponent, StatusBadgeComponent } from '../../../shared/ui';
import { MIN_DATE, dateRange, maxDecimals, todayIso } from '../../../shared/validators';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterLink, CurrencyPipe, DatePipe, SearchPipe, FieldErrorComponent, IconComponent, SearchBoxComponent, StatusBadgeComponent],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Inventario</h1>
          <p>Catálogo maestro de activos con su etiqueta QR/RFID.</p>
        </div>
        <button type="button" (click)="showForm.set(!showForm())">
          <app-icon [name]="showForm() ? 'x' : 'plus'" [size]="16" /> {{ showForm() ? 'Cerrar formulario' : 'Nuevo activo' }}
        </button>
      </div>

      @if (showForm()) {
        <div class="card">
          <div class="card-header"><div><h2>Registrar activo</h2><p>Los campos con * son obligatorios.</p></div></div>
          @if (!invoices().length) {
            <div class="alert alert-info" style="margin-bottom:1rem">
              Primero registra la factura de compra en <a routerLink="/adquisiciones">Adquisiciones</a>.
            </div>
          }
          <form [formGroup]="form" (ngSubmit)="createAsset()" class="form-grid" novalidate>
            <div class="field">
              <label for="a-name">Nombre del bien<span class="req">*</span></label>
              <input id="a-name" formControlName="name" placeholder="Laptop Dell Latitude 5440" maxlength="120" />
              <app-field-error [control]="form.controls.name" />
            </div>
            <div class="field">
              <label for="a-serial">Número de serie<span class="req">*</span></label>
              <input id="a-serial" formControlName="serialNumber" placeholder="SN-2026-0001" maxlength="60" />
              <app-field-error [control]="form.controls.serialNumber" />
            </div>
            <div class="field">
              <label for="a-invoice">Factura de compra<span class="req">*</span></label>
              <select id="a-invoice" formControlName="purchaseInvoiceId" (change)="syncDateWithInvoice()">
                <option [ngValue]="null" disabled>Selecciona la factura</option>
                @for (inv of invoices(); track inv.id) {
                  <option [ngValue]="inv.id">{{ inv.invoiceNumber }} · {{ inv.invoiceDate | date: 'dd/MM/yyyy' }}</option>
                }
              </select>
              <app-field-error [control]="form.controls.purchaseInvoiceId" />
            </div>
            <div class="field">
              <label for="a-date">Fecha de adquisición<span class="req">*</span></label>
              <input id="a-date" type="date" formControlName="acquisitionDate" [min]="minAcquisitionDate()" [max]="today" />
              <app-field-error [control]="form.controls.acquisitionDate" />
            </div>
            <div class="field">
              <label for="a-cost">Valor unitario (Q)<span class="req">*</span></label>
              <input id="a-cost" type="number" inputmode="decimal" formControlName="acquisitionCost" placeholder="0.00" min="0.01" step="0.01" />
              <app-field-error [control]="form.controls.acquisitionCost" />
            </div>
            <div class="field">
              <label for="a-tagtype">Tipo de etiqueta<span class="req">*</span></label>
              <select id="a-tagtype" formControlName="tagType"><option value="QR">QR</option><option value="RFID">RFID</option></select>
            </div>
            <div class="field">
              <label for="a-tag">Valor de etiqueta<span class="req">*</span></label>
              <input id="a-tag" formControlName="tagValue" placeholder="TAG-0001" maxlength="60" />
              <app-field-error [control]="form.controls.tagValue" />
            </div>
            <div class="field">
              <label for="a-loc">Ubicación</label>
              <input id="a-loc" formControlName="location" maxlength="120" />
            </div>
            <div class="field span-all">
              <label for="a-desc">Descripción</label>
              <textarea id="a-desc" formControlName="description" rows="2" maxlength="500" placeholder="Opcional"></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-secondary" (click)="resetForm()">Limpiar</button>
              <button type="submit" [disabled]="saving()">@if (saving()) { <span class="spinner"></span> } Registrar activo</button>
            </div>
          </form>
        </div>
      }

      <div class="card">
        <div class="card-header">
          <h2>Catálogo maestro</h2>
          <button type="button" class="btn-secondary btn-sm" (click)="loadAssets()"><app-icon name="refresh" [size]="14" /> Actualizar</button>
        </div>
        @let rows = assets() | search: term() : { status: statusFilter() };
        <div class="toolbar">
          <app-search-box [(value)]="term" placeholder="Buscar por código, nombre, serie, ubicación…" />
          <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)" aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            @for (s of statuses; track s) { <option [value]="s">{{ label(s) }}</option> }
          </select>
          <span class="count">{{ rows.length }} de {{ assets().length }}</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Nombre</th><th>Serie</th><th>Ubicación</th><th>Responsable</th><th>Estado</th><th class="right">Valor</th><th></th></tr></thead>
            <tbody>
              @for (a of rows; track a.id) {
                <tr>
                  <td class="mono nowrap">{{ a.assetCode }}</td>
                  <td><strong>{{ a.name }}</strong></td>
                  <td class="mono">{{ a.serialNumber }}</td>
                  <td>{{ a.location }}</td>
                  <td>{{ a.currentCustodian?.fullName || '—' }}</td>
                  <td><app-status-badge [status]="a.status" /></td>
                  <td class="right nowrap">{{ a.acquisitionCost | currency }}</td>
                  <td><button type="button" class="btn-ghost btn-sm" (click)="qrAsset.set(a)"><app-icon name="qr" [size]="15" /> QR</button></td>
                </tr>
              } @empty {
                <tr><td colspan="8" class="empty">
                  @if (loading()) { <span class="spinner"></span> Cargando… }
                  @else if (term() || statusFilter()) { <strong>Sin resultados</strong>Ajusta la búsqueda o el filtro de estado. }
                  @else { <strong>Aún no hay activos</strong>Usa “Nuevo activo” para registrar el primero. }
                </td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (qrAsset(); as a) {
        <div class="modal-backdrop" (click)="qrAsset.set(null)">
          <div class="modal qr" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-label="Código QR">
            <div><h2>{{ a.name }}</h2><p class="muted mono">{{ a.assetCode }}</p></div>
            <img [src]="api.inventoryAssetQr(a.id)" alt="Código QR del activo {{ a.assetCode }}" width="240" height="240" />
            <div class="modal-actions">
              <a class="btn btn-secondary" [href]="api.inventoryAssetQr(a.id)" [attr.download]="a.assetCode + '.png'" target="_blank">
                <app-icon name="download" [size]="16" /> Descargar PNG
              </a>
              <button type="button" (click)="qrAsset.set(null)">Cerrar</button>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: ['.qr img { justify-self: center; border: 1px solid var(--border); border-radius: 8px; }']
})
export class InventarioPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  readonly api = inject(AssetsApiService);

  readonly today = todayIso();
  readonly statuses = ASSET_STATUSES;
  readonly assets = signal<Asset[]>([]);
  readonly invoices = signal<PurchaseInvoice[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly term = signal('');
  readonly statusFilter = signal('');
  readonly qrAsset = signal<Asset | null>(null);
  readonly minAcquisitionDate = signal(MIN_DATE);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: [''],
    serialNumber: ['', [Validators.required, Validators.maxLength(60)]],
    acquisitionDate: [this.today, [Validators.required, dateRange(MIN_DATE, todayIso), (c: AbstractControl) => this.notBeforeInvoice(c.value)]],
    acquisitionCost: [null as number | null, [Validators.required, Validators.min(0.01), Validators.max(99999999.99), maxDecimals(2)]],
    tagType: this.fb.nonNullable.control<'QR' | 'RFID'>('QR', Validators.required),
    tagValue: ['', [Validators.required, Validators.maxLength(60)]],
    location: ['Almacén central'],
    purchaseInvoiceId: [null as number | null, Validators.required]
  });

  ngOnInit(): void {
    this.loadAssets();
    this.api.listInvoices().subscribe({ next: (rows) => this.invoices.set([...rows].sort((a, b) => b.id - a.id)) });
  }

  label(status: string): string {
    return statusInfo(status).label;
  }

  loadAssets(): void {
    this.loading.set(true);
    this.api.listAssets().subscribe({
      next: (assets) => this.assets.set([...assets].sort((a, b) => b.id - a.id)),
      error: (err) => this.toast.error(errorMessage(err, 'No se pudo cargar el inventario.')),
      complete: () => this.loading.set(false)
    });
  }

  /** La adquisición no puede ser anterior a la factura seleccionada. */
  private notBeforeInvoice(value: string | null): { notBefore: { label: string } } | null {
    const invoice = this.invoices().find((i) => i.id === this.form?.controls.purchaseInvoiceId.value);
    if (!value || !invoice) return null;
    return value < invoice.invoiceDate ? { notBefore: { label: 'la fecha de la factura' } } : null;
  }

  syncDateWithInvoice(): void {
    const invoice = this.invoices().find((i) => i.id === this.form.controls.purchaseInvoiceId.value);
    this.minAcquisitionDate.set(invoice?.invoiceDate ?? MIN_DATE);
    this.form.controls.acquisitionDate.updateValueAndValidity();
  }

  resetForm(): void {
    this.form.reset({ acquisitionDate: this.today, tagType: 'QR', location: 'Almacén central' });
    this.minAcquisitionDate.set(MIN_DATE);
  }

  createAsset(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Revisa los campos marcados en rojo.');
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.api.createAsset({
      name: v.name!.trim(),
      description: v.description || undefined,
      serialNumber: v.serialNumber!.trim(),
      acquisitionDate: v.acquisitionDate!,
      acquisitionCost: v.acquisitionCost!,
      tagType: v.tagType,
      tagValue: v.tagValue!.trim(),
      location: v.location || undefined,
      purchaseInvoiceId: v.purchaseInvoiceId!
    }).subscribe({
      next: (asset) => {
        this.toast.success(`Activo ${asset.assetCode} registrado.`);
        this.resetForm();
        this.loadAssets();
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err, 'No fue posible registrar el activo.'));
        this.saving.set(false);
      }
    });
  }
}
