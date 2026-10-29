import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Assignment } from '../../../core/models/api.models';
import { AssetsApiService } from '../../../core/services/assets-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { downloadBlob, errorMessage } from '../../../core/http-error';
import { SearchPipe } from '../../../shared/search.pipe';
import { FieldErrorComponent, IconComponent, SearchBoxComponent, StatusBadgeComponent } from '../../../shared/ui';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DatePipe, SearchPipe, FieldErrorComponent, IconComponent, SearchBoxComponent, StatusBadgeComponent],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Mis activos</h1>
          <p>Confirma los bienes que te asignaron, consulta los que tienes a tu cargo y solicita bajas.</p>
        </div>
        <button type="button" class="btn-secondary" (click)="downloadMyReport()"><app-icon name="download" [size]="16" /> Exportar PDF</button>
      </div>

      @if (pendingAssignments().length) {
        <div class="card">
          <div class="card-header"><div><h2>Por confirmar ({{ pendingAssignments().length }})</h2><p>Acepta los términos para confirmar que recibiste cada bien.</p></div></div>
          <div class="pending">
            @for (item of pendingAssignments(); track item.id) {
              <div class="pending-item">
                <div>
                  <strong>{{ item.asset.name }}</strong>
                  <p class="small muted"><span class="mono">{{ item.asset.assetCode }}</span> · asignado el {{ item.assignedAt | date: 'dd/MM/yyyy' }}</p>
                </div>
                <label class="terms">
                  <input type="checkbox" [(ngModel)]="termsAccepted[item.id]" [name]="'terms' + item.id" />
                  <span>Recibiré y resguardaré el bien, reportaré daños y lo devolveré en la fecha acordada.</span>
                </label>
                <button type="button" (click)="confirm(item)" [disabled]="!termsAccepted[item.id]"><app-icon name="check" [size]="16" /> Confirmar recepción</button>
              </div>
            }
          </div>
        </div>
      }

      <div class="card">
        <div class="card-header">
          <h2>Bienes a mi cargo</h2>
          <button type="button" class="btn-secondary btn-sm" (click)="load()"><app-icon name="refresh" [size]="14" /> Actualizar</button>
        </div>
        @let rows = assignments() | search: term();
        @if (assignments().length > 5) {
          <div class="toolbar">
            <app-search-box [(value)]="term" placeholder="Buscar por código, nombre o ubicación…" />
            <span class="count">{{ rows.length }} de {{ assignments().length }}</span>
          </div>
        }
        <div class="table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Nombre</th><th>Ubicación</th><th>Estado</th><th>Asignado</th><th></th></tr></thead>
            <tbody>
              @for (item of rows; track item.id) {
                <tr>
                  <td class="mono">{{ item.asset.assetCode }}</td><td>{{ item.asset.name }}</td><td>{{ item.asset.location }}</td>
                  <td><app-status-badge [status]="item.asset.status" /></td>
                  <td class="nowrap">{{ item.assignedAt | date: 'dd/MM/yyyy' }}</td>
                  <td><a class="btn btn-ghost btn-sm" [href]="api.employeeAssetQr(item.asset.id)" target="_blank"><app-icon name="qr" [size]="15" /> QR</a></td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty">
                  @if (loading()) { <span class="spinner"></span> Cargando… } @else { <strong>No tienes bienes a tu cargo</strong> }
                </td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (assignments().length) {
        <div class="card">
          <div class="card-header"><h2>Solicitar baja de un bien</h2></div>
          <form [formGroup]="disposalForm" (ngSubmit)="requestDisposal()" class="form-grid" novalidate>
            <div class="field">
              <label for="e-asset">Bien<span class="req">*</span></label>
              <select id="e-asset" formControlName="assetId">
                <option [ngValue]="null" disabled>Selecciona un bien</option>
                @for (item of assignments(); track item.id) { <option [ngValue]="item.asset.id">{{ item.asset.assetCode }} — {{ item.asset.name }}</option> }
              </select>
              <app-field-error [control]="disposalForm.controls.assetId" />
            </div>
            <div class="field">
              <label for="e-reason">Motivo<span class="req">*</span></label>
              <input id="e-reason" formControlName="reason" placeholder="Daño, extravío, fin de vida útil…" maxlength="300" />
              <app-field-error [control]="disposalForm.controls.reason" />
            </div>
            <div class="form-actions"><button type="submit">Enviar solicitud</button></div>
          </form>
        </div>
      }
    </section>
  `,
  styles: [`
    .pending { display: grid; gap: .75rem; }
    .pending-item { display: grid; gap: .75rem; grid-template-columns: 1.2fr 2fr auto; align-items: center;
      padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface-2); }
    .terms { display: flex; gap: .5rem; align-items: flex-start; font-size: .85rem; cursor: pointer; }
    .terms input { margin-top: .2rem; }
    @media (max-width: 800px) { .pending-item { grid-template-columns: 1fr; } }
  `]
})
export class EmpleadoPage implements OnInit {
  readonly api = inject(AssetsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly assignments = signal<Assignment[]>([]);
  readonly pendingAssignments = signal<Assignment[]>([]);
  readonly loading = signal(true);
  readonly term = signal('');
  termsAccepted: Record<number, boolean> = {};

  readonly disposalForm = this.fb.group({
    assetId: [null as number | null, Validators.required],
    reason: ['', [Validators.required, Validators.maxLength(300)]]
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.myAssignments().subscribe({
      next: (rows) => this.assignments.set(rows),
      error: (err) => this.toast.error(errorMessage(err, 'No fue posible cargar tus activos.')),
      complete: () => this.loading.set(false)
    });
    this.api.myPendingAssignments().subscribe({ next: (rows) => this.pendingAssignments.set(rows) });
  }

  confirm(item: Assignment): void {
    if (!this.termsAccepted[item.id]) return;
    this.api.confirmAssignment(item.id).subscribe({
      next: () => {
        this.toast.success(`Recepción de ${item.asset.assetCode} confirmada.`);
        this.load();
      },
      error: (err) => this.toast.error(errorMessage(err, 'No fue posible confirmar la asignación.'))
    });
  }

  requestDisposal(): void {
    if (this.disposalForm.invalid) {
      this.disposalForm.markAllAsTouched();
      return;
    }
    const v = this.disposalForm.getRawValue();
    this.api.requestDisposalByEmployee({ assetId: v.assetId!, reason: v.reason!.trim() }).subscribe({
      next: () => {
        this.toast.success('Solicitud de baja enviada.');
        this.disposalForm.reset();
      },
      error: (err) => this.toast.error(errorMessage(err, 'No fue posible solicitar la baja.'))
    });
  }

  downloadMyReport(): void {
    this.api.exportMyAssetsPdf().subscribe({
      next: (blob) => downloadBlob(blob, 'reporte-mis-activos.pdf'),
      error: (err) => this.toast.error(errorMessage(err, 'No fue posible generar el PDF.'))
    });
  }
}
