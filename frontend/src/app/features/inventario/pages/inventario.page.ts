import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Asset } from '../../../core/models/api.models';
import { AssetsApiService } from '../../../core/services/assets-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="shell">
      <div class="between">
        <h2>Inventario</h2>
        <a class="back-link" routerLink="/menu">← Volver al menú</a>
      </div>

      <div class="card">
        <form [formGroup]="assetForm" (ngSubmit)="createAsset()" class="grid grid-3">
          <label>Nombre del bien
            <input formControlName="name" placeholder="Ej. Laptop Dell Latitude 5440" />
          </label>
          <label>Número de serie
            <input formControlName="serialNumber" placeholder="Ej. SN-2026-0001" />
          </label>
          <input formControlName="acquisitionDate" type="date" />
          <label>Valor unitario
            <input formControlName="acquisitionCost" type="number" placeholder="Ej. 12999.90" />
          </label>
          <label>Tipo de etiqueta
            <select formControlName="tagType"><option value="QR">QR</option><option value="RFID">RFID</option></select>
          </label>
          <label>Valor de etiqueta
            <input formControlName="tagValue" placeholder="Ej. TAG-0001" />
          </label>
          <label>Ubicación (opcional)
            <input formControlName="location" placeholder="Por defecto: Almacén central" />
          </label>
          <label>ID de factura
            <input formControlName="purchaseInvoiceId" type="number" placeholder="Ej. 1" />
          </label>
          <label>Descripción
            <input formControlName="description" placeholder="Ej. Equipo asignable para desarrollo" />
          </label>
          <button type="submit">Registrar activo</button>
        </form>
        <p *ngIf="message">{{ message }}</p>
      </div>

      <div class="card">
        <div class="between"><h3>Catálogo maestro</h3><button type="button" (click)="loadAssets()">Actualizar</button></div>
        <table *ngIf="assets.length">
          <thead><tr><th>ID</th><th>Código</th><th>Nombre</th><th>Ubicación</th><th>Estado</th><th>Valor unitario</th><th>QR</th></tr></thead>
          <tbody>
            <tr *ngFor="let asset of assets">
              <td>{{ asset.id }}</td><td>{{ asset.assetCode }}</td><td>{{ asset.name }}</td><td>{{ asset.location }}</td><td>{{ asset.status }}</td><td>{{ asset.acquisitionCost }}</td>
              <td>
                <button type="button" (click)="toggleQr(asset.id)">Mostrar QR</button>
                <a [href]="api.inventoryAssetQr(asset.id)" target="_blank">PNG</a>
                <div *ngIf="qrVisibleId === asset.id"><img [src]="api.inventoryAssetQr(asset.id)" alt="QR" width="120" /></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class InventarioPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly api = inject(AssetsApiService);
  assets: Asset[] = [];
  message = '';
  qrVisibleId: number | null = null;

  readonly assetForm = this.fb.group({
    assetCode: [''],
    name: ['', Validators.required],
    description: [''],
    serialNumber: ['', Validators.required],
    acquisitionDate: ['', Validators.required],
    acquisitionCost: [null, [Validators.required, Validators.min(0.01)]],
    tagType: this.fb.nonNullable.control<'QR' | 'RFID'>('QR', Validators.required),
    tagValue: ['', Validators.required],
    location: ['Almacén central'],
    purchaseInvoiceId: [null, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void { this.loadAssets(); }
  createAsset(): void {
    if (this.assetForm.invalid) return;
    const payload = this.assetForm.getRawValue();
    this.api.createAsset({
      assetCode: payload.assetCode ?? undefined,
      name: payload.name!,
      description: payload.description ?? undefined,
      serialNumber: payload.serialNumber!,
      acquisitionDate: payload.acquisitionDate!,
      acquisitionCost: payload.acquisitionCost!,
      tagType: payload.tagType!,
      tagValue: payload.tagValue!,
      location: payload.location ?? undefined,
      purchaseInvoiceId: payload.purchaseInvoiceId!
    }).subscribe({ next: () => { this.assetForm.patchValue({ location: 'Almacén central' }); this.loadAssets(); }, error: (err) => (this.message = err?.error?.error ?? 'Error') });
  }
  loadAssets(): void {
    this.api.listAssets().subscribe({ next: (assets) => (this.assets = assets), error: () => (this.message = 'No se pudo cargar inventario') });
  }

  toggleQr(assetId: number): void {
    this.qrVisibleId = this.qrVisibleId === assetId ? null : assetId;
  }
}
