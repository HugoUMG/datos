import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Assignment } from '../../../core/models/api.models';
import { AssetsApiService } from '../../../core/services/assets-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule],
  template: `
    <section class="shell">
      <div class="between"><h2>Portal de Empleado</h2><a class="back-link" routerLink="/menu">← Volver al menú</a></div>

      <div class="card">
        <div class="between"><h3>Asignaciones de bienes para empleado (pendientes)</h3><button type="button" (click)="load()">Actualizar</button></div>
        <div *ngFor="let item of pendingAssignments" class="card">
          <p><strong>{{ item.asset.assetCode }}</strong> - {{ item.asset.name }} - {{ item.status }}</p>
          <label>
            <input type="checkbox" [(ngModel)]="termsAccepted[item.id]" name="terms{{item.id}}" />
            Acepto términos: recibiré y resguardaré el bien asignado, reportaré daños y devolveré en la fecha acordada.
          </label>
          <button type="button" (click)="confirm(item.id)" [disabled]="!termsAccepted[item.id]">Confirmar asignación y recibido</button>
        </div>
        <p *ngIf="!pendingAssignments.length" class="muted">No tienes asignaciones pendientes.</p>
      </div>

      <div class="card">
        <div class="between"><h3>Mis activos</h3><button type="button" (click)="downloadMyReport()">Exportar PDF</button></div>
        <table *ngIf="assignments.length">
          <thead><tr><th>Código</th><th>Nombre</th><th>Ubicación</th><th>Estado</th><th>Asignado</th><th>QR</th></tr></thead>
          <tbody>
            <tr *ngFor="let item of assignments">
              <td>{{ item.asset.assetCode }}</td><td>{{ item.asset.name }}</td><td>{{ item.asset.location }}</td><td>{{ item.asset.status }}</td><td>{{ item.assignedAt }}</td>
              <td><a [href]="api.employeeAssetQr(item.asset.id)" target="_blank">Ver PNG</a></td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!assignments.length" class="muted">No tienes activos activos por ahora.</p>
      </div>

      <div class="card">
        <h3>Baja de mis activos</h3>
        <form [formGroup]="disposalForm" (ngSubmit)="requestDisposal()" class="grid grid-3">
          <input type="number" formControlName="assetId" placeholder="ID activo" />
          <input formControlName="reason" placeholder="Motivo" />
          <button type="submit">Solicitar baja</button>
        </form>
      </div>

      <p *ngIf="message" class="error">{{ message }}</p>
    </section>
  `
})
export class EmpleadoPage implements OnInit {
  readonly api = inject(AssetsApiService);
  private readonly fb = inject(FormBuilder);
  assignments: Assignment[] = [];
  pendingAssignments: Assignment[] = [];
  termsAccepted: Record<number, boolean> = {};
  message = '';
  readonly disposalForm = this.fb.group({ assetId: [null, [Validators.required, Validators.min(1)]], reason: ['', Validators.required] });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.myAssignments().subscribe({ next: (rows) => (this.assignments = rows) });
    this.api.myPendingAssignments().subscribe({
      next: (rows) => {
        this.pendingAssignments = rows;
        this.message = '';
      },
      error: (err) => (this.message = err?.error?.error ?? 'No fue posible cargar tus activos')
    });
  }

  confirm(assignmentId: number): void {
    if (!this.termsAccepted[assignmentId]) return;
    this.api.confirmAssignment(assignmentId).subscribe({
      next: () => {
        this.message = 'Asignación confirmada correctamente.';
        this.load();
      },
      error: (err) => (this.message = err?.error?.error ?? 'No fue posible confirmar la asignación')
    });
  }

  requestDisposal(): void {
    if (this.disposalForm.invalid) return;
    const payload = this.disposalForm.getRawValue();
    this.api.requestDisposalByEmployee({ assetId: payload.assetId!, reason: payload.reason! }).subscribe({
      next: () => {
        this.message = 'Solicitud de baja enviada.';
        this.disposalForm.reset();
      },
      error: (err) => (this.message = err?.error?.error ?? 'No fue posible solicitar la baja')
    });
  }

  downloadMyReport(): void {
    this.api.exportMyAssetsPdf().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte-mis-activos.pdf';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => (this.message = err?.error?.error ?? 'No fue posible generar el PDF')
    });
  }
}
