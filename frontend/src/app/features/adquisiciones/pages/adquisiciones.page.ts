import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BudgetLine, PurchaseInvoice, Supplier } from '../../../core/models/api.models';
import { AssetsApiService } from '../../../core/services/assets-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { errorMessage } from '../../../core/http-error';
import { SearchPipe } from '../../../shared/search.pipe';
import { FieldErrorComponent, IconComponent, SearchBoxComponent } from '../../../shared/ui';
import { MIN_DATE, dateRange, invoiceNumber, maxDecimals, todayIso } from '../../../shared/validators';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, SearchPipe, FieldErrorComponent, IconComponent, SearchBoxComponent],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Adquisiciones</h1>
          <p>Registra las facturas de compra; después podrás dar de alta sus activos en Inventario.</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div><h2>Registrar factura</h2><p>Los campos con * son obligatorios.</p></div></div>

        @if (!loadingCatalogs() && (!activeSuppliers().length || !budgetLines().length)) {
          <div class="alert alert-info" style="margin-bottom:1rem">
            Para registrar una factura necesitas al menos un proveedor activo y una partida presupuestaria.
            <a routerLink="/catalogos">Crear en Proveedores y partidas</a>.
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid" novalidate>
          <div class="field">
            <label for="inv-number">Número de factura<span class="req">*</span></label>
            <input id="inv-number" formControlName="invoiceNumber" placeholder="FAC-2026-0001" maxlength="30"
              (input)="upperCase()" autocomplete="off" />
            <span class="hint">Serie y número: mayúsculas, dígitos y guiones.</span>
            <app-field-error [control]="form.controls.invoiceNumber" />
          </div>
          <div class="field">
            <label for="inv-date">Fecha de factura<span class="req">*</span></label>
            <input id="inv-date" type="date" formControlName="invoiceDate" [min]="minDate" [max]="today" />
            <app-field-error [control]="form.controls.invoiceDate" />
          </div>
          <div class="field">
            <label for="inv-total">Total (Q)<span class="req">*</span></label>
            <input id="inv-total" type="number" inputmode="decimal" formControlName="totalAmount" placeholder="0.00" min="0.01" step="0.01" />
            <app-field-error [control]="form.controls.totalAmount" />
          </div>
          <div class="field">
            <label for="inv-supplier">Proveedor<span class="req">*</span></label>
            <select id="inv-supplier" formControlName="supplierId">
              <option [ngValue]="null" disabled>Selecciona un proveedor</option>
              @for (s of activeSuppliers(); track s.id) { <option [ngValue]="s.id">{{ s.name }} · NIT {{ s.taxId }}</option> }
            </select>
            <app-field-error [control]="form.controls.supplierId" />
          </div>
          <div class="field">
            <label for="inv-budget">Partida presupuestaria<span class="req">*</span></label>
            <select id="inv-budget" formControlName="budgetLineId">
              <option [ngValue]="null" disabled>Selecciona una partida</option>
              @for (b of budgetLines(); track b.id) { <option [ngValue]="b.id">{{ b.code }} — {{ b.description }}</option> }
            </select>
            <app-field-error [control]="form.controls.budgetLineId" />
          </div>
          <div class="field span-all">
            <label for="inv-notes">Notas</label>
            <textarea id="inv-notes" formControlName="notes" rows="2" maxlength="500" placeholder="Opcional"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="reset()">Limpiar</button>
            <button type="submit" [disabled]="saving()">
              @if (saving()) { <span class="spinner"></span> } Registrar factura
            </button>
          </div>
        </form>
      </div>

      <div class="card">
        <div class="card-header">
          <div><h2>Facturas registradas</h2></div>
          <button type="button" class="btn-secondary btn-sm" (click)="load()"><app-icon name="refresh" [size]="14" /> Actualizar</button>
        </div>
        @let rows = invoices() | search: term();
        <div class="toolbar">
          <app-search-box [(value)]="term" placeholder="Buscar por número, proveedor, partida…" />
          <span class="count">{{ rows.length }} de {{ invoices().length }}</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Número</th><th>Fecha</th><th>Proveedor</th><th>Partida</th><th class="right">Total</th><th>Notas</th></tr></thead>
            <tbody>
              @for (inv of rows; track inv.id) {
                <tr>
                  <td class="mono nowrap">{{ inv.invoiceNumber }}</td>
                  <td class="nowrap">{{ inv.invoiceDate | date: 'dd/MM/yyyy' }}</td>
                  <td>{{ inv.supplier?.name || '—' }}</td>
                  <td>{{ inv.budgetLine?.code || '—' }}</td>
                  <td class="right nowrap">{{ inv.totalAmount | currency }}</td>
                  <td class="muted small">{{ inv.notes || '—' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty">
                  @if (loading()) { <span class="spinner"></span> Cargando… }
                  @else if (term()) { <strong>Sin resultados</strong>Prueba con otro término de búsqueda. }
                  @else { <strong>Aún no hay facturas</strong>Registra la primera con el formulario de arriba. }
                </td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `
})
export class AdquisicionesPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AssetsApiService);
  private readonly toast = inject(ToastService);

  readonly minDate = MIN_DATE;
  readonly today = todayIso();

  readonly suppliers = signal<Supplier[]>([]);
  readonly budgetLines = signal<BudgetLine[]>([]);
  readonly invoices = signal<PurchaseInvoice[]>([]);
  readonly activeSuppliers = computed(() => this.suppliers().filter((s) => s.active));
  readonly loading = signal(true);
  readonly loadingCatalogs = signal(true);
  readonly saving = signal(false);
  readonly term = signal('');

  readonly form = this.fb.group({
    invoiceNumber: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), invoiceNumber()]],
    invoiceDate: [this.today, [Validators.required, dateRange(MIN_DATE, todayIso)]],
    totalAmount: [null as number | null, [Validators.required, Validators.min(0.01), Validators.max(99999999.99), maxDecimals(2)]],
    supplierId: [null as number | null, Validators.required],
    budgetLineId: [null as number | null, Validators.required],
    notes: ['']
  });

  ngOnInit(): void {
    this.api.listSuppliers().subscribe({ next: (rows) => this.suppliers.set(rows), complete: () => this.loadingCatalogs.set(false) });
    this.api.listBudgetLines().subscribe({ next: (rows) => this.budgetLines.set(rows) });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.listInvoices().subscribe({
      next: (rows) => this.invoices.set([...rows].sort((a, b) => b.id - a.id)),
      error: (err) => this.toast.error(errorMessage(err, 'No se pudieron cargar las facturas.')),
      complete: () => this.loading.set(false)
    });
  }

  upperCase(): void {
    const control = this.form.controls.invoiceNumber;
    const value = control.value ?? '';
    const upper = value.toUpperCase().replace(/\s+/g, '');
    if (upper !== value) control.setValue(upper);
  }

  reset(): void {
    this.form.reset({ invoiceDate: this.today, invoiceNumber: '', notes: '' });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Revisa los campos marcados en rojo.');
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .createInvoice({
        invoiceNumber: v.invoiceNumber!,
        invoiceDate: v.invoiceDate!,
        totalAmount: v.totalAmount!,
        supplierId: v.supplierId!,
        budgetLineId: v.budgetLineId!,
        notes: v.notes || undefined
      })
      .subscribe({
        next: (invoice) => {
          this.toast.success(`Factura ${invoice.invoiceNumber} registrada.`);
          this.reset();
          this.load();
          this.saving.set(false);
        },
        error: (err) => {
          this.toast.error(errorMessage(err, 'No fue posible registrar la factura.'));
          this.saving.set(false);
        }
      });
  }
}
