import { CurrencyPipe, DatePipe } from '@angular/common';
import { RestrictDirective } from '../../../shared/restrict.directive';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Asset, PurchaseInvoice } from '../../../core/models/api.models';
import { AssetsApiService } from '../../../core/services/assets-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { errorMessage } from '../../../core/http-error';
import { ASSET_STATUSES, statusInfo } from '../../../shared/labels';
import { PagerComponent, SortHeaderComponent, TableCtl, exportCsv } from '../../../shared/table';
import { FieldErrorComponent, IconComponent, SearchBoxComponent, StatusBadgeComponent } from '../../../shared/ui';
import { MIN_DATE, SERIAL_PATTERN, dateRange, maxDecimals, todayIso } from '../../../shared/validators';

@Component({
  standalone: true,
  imports: [RestrictDirective, ReactiveFormsModule, FormsModule, RouterLink, CurrencyPipe, DatePipe, SortHeaderComponent, PagerComponent, FieldErrorComponent, IconComponent, SearchBoxComponent, StatusBadgeComponent],
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
              <input id="a-name" appRestrict="text" formControlName="name" placeholder="Laptop Dell Latitude 5440" maxlength="120" />
              <app-field-error [control]="form.controls.name" />
            </div>
            <div class="field">
              <label for="a-serial">Número de serie<span class="req">*</span></label>
              <input id="a-serial" appRestrict="serial" formControlName="serialNumber" placeholder="SN-2026-0001" maxlength="60" />
              <app-field-error [control]="form.controls.serialNumber" patternHint="Solo letras, dígitos, guion, punto, guion bajo y diagonal." />
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
              <input id="a-cost" appRestrict="money" type="number" inputmode="decimal" formControlName="acquisitionCost" placeholder="0.00" min="0.01" step="0.01" />
              <app-field-error [control]="form.controls.acquisitionCost" />
            </div>
            <div class="field">
              <label for="a-tagtype">Tipo de etiqueta<span class="req">*</span></label>
              <select id="a-tagtype" formControlName="tagType"><option value="QR">QR</option><option value="RFID">RFID</option></select>
            </div>
            <div class="field">
              <label for="a-tag">Valor de etiqueta<span class="req">*</span></label>
              <input id="a-tag" appRestrict="serial" formControlName="tagValue" placeholder="TAG-0001" maxlength="60" />
              <app-field-error [control]="form.controls.tagValue" patternHint="Solo letras, dígitos, guion, punto, guion bajo y diagonal." />
            </div>
            <div class="field">
              <label for="a-loc">Ubicación</label>
              <input id="a-loc" appRestrict="text" formControlName="location" maxlength="120" />
            </div>
            <div class="field span-all">
              <label for="a-desc">Descripción</label>
              <textarea id="a-desc" appRestrict="text" formControlName="description" rows="2" maxlength="500" placeholder="Opcional"></textarea>
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
        @let v = t.view(assets());
        <div class="toolbar">
          <app-search-box [value]="t.term()" (valueChange)="t.setTerm($event)" placeholder="Buscar por código, nombre, serie, ubicación…" />
          <select [ngModel]="t.filter('status')" (ngModelChange)="t.setFilter('status', $event)" aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            @for (s of statuses; track s) { <option [value]="s">{{ label(s) }}</option> }
          </select>
          <span class="count">{{ v.filtered.length }} de {{ v.total }}</span>
          <button type="button" class="btn-secondary btn-sm" (click)="exportar(v.filtered)" [disabled]="!v.filtered.length"><app-icon name="download" [size]="14" /> CSV</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th appSort="assetCode" [ctl]="t">Código</th><th appSort="name" [ctl]="t">Nombre</th><th appSort="serialNumber" [ctl]="t">Serie</th>
              <th appSort="location" [ctl]="t">Ubicación</th><th appSort="currentCustodian.fullName" [ctl]="t">Responsable</th>
              <th appSort="status" [ctl]="t">Estado</th><th appSort="acquisitionCost" [ctl]="t" class="right">Valor</th><th></th>
            </tr></thead>
            <tbody>
              @for (a of v.items; track a.id) {
                <tr>
                  <td class="mono nowrap">{{ a.assetCode }}</td>
                  <td><a class="link-btn" [routerLink]="['/inventario', a.id]" title="Ver historial">{{ a.name }}</a></td>
                  <td class="mono">{{ a.serialNumber }}</td>
                  <td>{{ a.location }}</td>
                  <td>{{ a.currentCustodian?.fullName || '—' }}</td>
                  <td><app-status-badge [status]="a.status" /></td>
                  <td class="right nowrap">{{ a.acquisitionCost | currency }}</td>
                  <td>
                    <div class="row">
                      <a class="btn btn-ghost btn-sm" [routerLink]="['/inventario', a.id]">Historial</a>
                      @if (a.status !== 'DADO_DE_BAJA') {
                        <button type="button" class="btn-ghost btn-sm" (click)="openEdit(a)">Editar</button>
                      }
                      <button type="button" class="btn-ghost btn-sm" (click)="qrAsset.set(a)"><app-icon name="qr" [size]="15" /> QR</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="8" class="empty">
                  @if (loading()) { <span class="spinner"></span> Cargando… }
                  @else if (t.term() || t.filter('status')) { <strong>Sin resultados</strong>Ajusta la búsqueda o el filtro de estado. }
                  @else { <strong>Aún no hay activos</strong>Usa “Nuevo activo” para registrar el primero. }
                </td></tr>
              }
            </tbody>
          </table>
        </div>
        <app-pager [ctl]="t" [view]="v" />
      </div>

      @if (editing(); as a) {
        <div class="modal-backdrop" (click)="editing.set(null)">
          <form class="modal wide" [formGroup]="editForm" (ngSubmit)="saveEdit(a)" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" novalidate>
            <div><h2>Editar activo</h2><p class="muted small mono">{{ a.assetCode }} · la factura, fecha y costo no se modifican</p></div>
            <div class="form-grid">
              <div class="field">
                <label for="e-name">Nombre<span class="req">*</span></label>
                <input id="e-name" formControlName="name" maxlength="120" appRestrict="text" />
                <app-field-error [control]="editForm.controls.name" />
              </div>
              <div class="field">
                <label for="e-serial">Número de serie<span class="req">*</span></label>
                <input id="e-serial" formControlName="serialNumber" maxlength="60" appRestrict="code" />
                <app-field-error [control]="editForm.controls.serialNumber" patternHint="Solo letras, dígitos y guiones." />
              </div>
              <div class="field">
                <label for="e-tagtype">Tipo de etiqueta</label>
                <select id="e-tagtype" formControlName="tagType"><option value="QR">QR</option><option value="RFID">RFID</option></select>
              </div>
              <div class="field">
                <label for="e-tag">Valor de etiqueta<span class="req">*</span></label>
                <input id="e-tag" formControlName="tagValue" maxlength="60" appRestrict="code" />
                <app-field-error [control]="editForm.controls.tagValue" patternHint="Solo letras, dígitos y guiones." />
              </div>
              <div class="field">
                <label for="e-loc">Ubicación</label>
                <input id="e-loc" formControlName="location" maxlength="120" appRestrict="text" />
              </div>
              <div class="field span-all">
                <label for="e-desc">Descripción</label>
                <textarea id="e-desc" formControlName="description" rows="2" maxlength="500"></textarea>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="editing.set(null)">Cancelar</button>
              <button type="submit" [disabled]="saving()">Guardar cambios</button>
            </div>
          </form>
        </div>
      }

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
  readonly t = new TableCtl<Asset>();
  readonly editing = signal<Asset | null>(null);
  readonly qrAsset = signal<Asset | null>(null);
  readonly minAcquisitionDate = signal(MIN_DATE);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: [''],
    serialNumber: ['', [Validators.required, Validators.maxLength(60), Validators.pattern(SERIAL_PATTERN)]],
    acquisitionDate: [this.today, [Validators.required, dateRange(MIN_DATE, todayIso), (c: AbstractControl) => this.notBeforeInvoice(c.value)]],
    acquisitionCost: [null as number | null, [Validators.required, Validators.min(0.01), Validators.max(99999999.99), maxDecimals(2)]],
    tagType: this.fb.nonNullable.control<'QR' | 'RFID'>('QR', Validators.required),
    tagValue: ['', [Validators.required, Validators.maxLength(60), Validators.pattern(SERIAL_PATTERN)]],
    location: ['Almacén central', Validators.maxLength(120)],
    purchaseInvoiceId: [null as number | null, Validators.required]
  });

  readonly editForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    serialNumber: ['', [Validators.required, Validators.maxLength(60), Validators.pattern(SERIAL_PATTERN)]],
    tagType: this.fb.nonNullable.control<'QR' | 'RFID'>('QR'),
    tagValue: ['', [Validators.required, Validators.maxLength(60), Validators.pattern(SERIAL_PATTERN)]],
    location: ['', Validators.maxLength(120)],
    description: ['', Validators.maxLength(500)]
  });

  ngOnInit(): void {
    this.loadAssets();
    this.api.listInvoices().subscribe({ next: (rows) => this.invoices.set([...rows].sort((a, b) => b.id - a.id)) });
  }

  openEdit(a: Asset): void {
    this.editForm.reset({
      name: a.name,
      serialNumber: a.serialNumber,
      tagType: a.tagType,
      tagValue: a.tagValue,
      location: a.location,
      description: a.description ?? ''
    });
    this.editing.set(a);
  }

  saveEdit(a: Asset): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const v = this.editForm.getRawValue();
    this.saving.set(true);
    this.api.updateAsset(a.id, {
      name: v.name!.trim(),
      serialNumber: v.serialNumber!.trim(),
      tagType: v.tagType,
      tagValue: v.tagValue!.trim(),
      location: v.location || undefined,
      description: v.description || undefined
    }).subscribe({
      next: (updated) => {
        this.toast.success(`Activo ${updated.assetCode} actualizado.`);
        this.editing.set(null);
        this.loadAssets();
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err, 'No fue posible actualizar el activo.'));
        this.saving.set(false);
      }
    });
  }

  exportar(rows: Asset[]): void {
    exportCsv('inventario.csv', [
      { label: 'Código', value: (r) => r.assetCode },
      { label: 'Nombre', value: (r) => r.name },
      { label: 'Serie', value: (r) => r.serialNumber },
      { label: 'Etiqueta', value: (r) => `${r.tagType} ${r.tagValue}` },
      { label: 'Ubicación', value: (r) => r.location },
      { label: 'Responsable', value: (r) => r.currentCustodian?.fullName },
      { label: 'Estado', value: (r) => statusInfo(r.status).label },
      { label: 'Fecha de adquisición', value: (r) => r.acquisitionDate },
      { label: 'Valor', value: (r) => r.acquisitionCost }
    ], rows);
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
