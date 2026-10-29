import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BudgetLine, Supplier } from '../../../core/models/api.models';
import { AssetsApiService } from '../../../core/services/assets-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { errorMessage } from '../../../core/http-error';
import { SearchPipe } from '../../../shared/search.pipe';
import { BadgeComponent, FieldErrorComponent, IconComponent, SearchBoxComponent } from '../../../shared/ui';
import { CODE_PATTERN, NIT_PATTERN, PHONE_PATTERN, maxDecimals } from '../../../shared/validators';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, SearchPipe, FieldErrorComponent, IconComponent, SearchBoxComponent, BadgeComponent],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Proveedores y partidas</h1>
          <p>Catálogos que se usan al registrar facturas de compra.</p>
        </div>
      </div>

      <div class="card">
        <div class="tabs" role="tablist">
          <button type="button" role="tab" [class.active]="tab() === 'suppliers'" (click)="tab.set('suppliers')">
            Proveedores ({{ suppliers().length }})
          </button>
          <button type="button" role="tab" [class.active]="tab() === 'budget'" (click)="tab.set('budget')">
            Partidas presupuestarias ({{ budgetLines().length }})
          </button>
        </div>

        @if (tab() === 'suppliers') {
          <form [formGroup]="supplierForm" (ngSubmit)="createSupplier()" class="form-grid" novalidate>
            <div class="field">
              <label for="s-name">Nombre<span class="req">*</span></label>
              <input id="s-name" formControlName="name" placeholder="Distribuidora S.A." maxlength="120" />
              <app-field-error [control]="supplierForm.controls.name" />
            </div>
            <div class="field">
              <label for="s-nit">NIT<span class="req">*</span></label>
              <input id="s-nit" formControlName="taxId" placeholder="1234567-8" maxlength="15" />
              <app-field-error [control]="supplierForm.controls.taxId" patternHint="NIT inválido: solo dígitos y el verificador (0-9 o K), ej. 1234567-8." />
            </div>
            <div class="field">
              <label for="s-email">Email<span class="req">*</span></label>
              <input id="s-email" type="email" formControlName="email" placeholder="ventas@proveedor.com" />
              <app-field-error [control]="supplierForm.controls.email" />
            </div>
            <div class="field">
              <label for="s-phone">Teléfono</label>
              <input id="s-phone" type="tel" formControlName="phone" placeholder="5555-1234" maxlength="15" />
              <app-field-error [control]="supplierForm.controls.phone" patternHint="Teléfono inválido: mínimo 8 dígitos (ej. 5555-1234)." />
            </div>
            <div class="form-actions">
              <button type="submit" [disabled]="saving()"><app-icon name="plus" [size]="16" /> Agregar proveedor</button>
            </div>
          </form>

          @let srows = suppliers() | search: supplierTerm();
          <div class="toolbar" style="margin-top:1.25rem">
            <app-search-box [(value)]="supplierTerm" placeholder="Buscar por nombre, NIT o email…" />
            <span class="count">{{ srows.length }} de {{ suppliers().length }}</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Nombre</th><th>NIT</th><th>Email</th><th>Teléfono</th><th>Estado</th></tr></thead>
              <tbody>
                @for (s of srows; track s.id) {
                  <tr>
                    <td><strong>{{ s.name }}</strong></td><td class="mono">{{ s.taxId }}</td><td>{{ s.email }}</td>
                    <td>{{ s.phone || '—' }}</td>
                    <td><app-badge [tone]="s.active ? 'success' : 'neutral'">{{ s.active ? 'Activo' : 'Inactivo' }}</app-badge></td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="empty">{{ supplierTerm() ? 'Sin resultados para la búsqueda.' : 'Aún no hay proveedores.' }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <form [formGroup]="budgetForm" (ngSubmit)="createBudgetLine()" class="form-grid" novalidate>
            <div class="field">
              <label for="b-code">Código<span class="req">*</span></label>
              <input id="b-code" formControlName="code" placeholder="PP-2026-01" maxlength="30" (input)="upperCode()" />
              <app-field-error [control]="budgetForm.controls.code" patternHint="Solo mayúsculas, dígitos, puntos y guiones (ej. PP-2026-01)." />
            </div>
            <div class="field">
              <label for="b-desc">Descripción<span class="req">*</span></label>
              <input id="b-desc" formControlName="description" placeholder="Equipo de cómputo" maxlength="200" />
              <app-field-error [control]="budgetForm.controls.description" />
            </div>
            <div class="field">
              <label for="b-amount">Monto asignado (Q)<span class="req">*</span></label>
              <input id="b-amount" type="number" inputmode="decimal" formControlName="allocatedAmount" placeholder="0.00" min="0.01" step="0.01" />
              <app-field-error [control]="budgetForm.controls.allocatedAmount" />
            </div>
            <div class="form-actions">
              <button type="submit" [disabled]="saving()"><app-icon name="plus" [size]="16" /> Agregar partida</button>
            </div>
          </form>

          @let brows = budgetLines() | search: budgetTerm();
          <div class="toolbar" style="margin-top:1.25rem">
            <app-search-box [(value)]="budgetTerm" placeholder="Buscar por código o descripción…" />
            <span class="count">{{ brows.length }} de {{ budgetLines().length }}</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Código</th><th>Descripción</th><th class="right">Monto asignado</th></tr></thead>
              <tbody>
                @for (b of brows; track b.id) {
                  <tr><td class="mono">{{ b.code }}</td><td>{{ b.description }}</td><td class="right">{{ b.allocatedAmount | currency }}</td></tr>
                } @empty {
                  <tr><td colspan="3" class="empty">{{ budgetTerm() ? 'Sin resultados para la búsqueda.' : 'Aún no hay partidas.' }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </section>
  `
})
export class CatalogosPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AssetsApiService);
  private readonly toast = inject(ToastService);

  readonly tab = signal<'suppliers' | 'budget'>('suppliers');
  readonly suppliers = signal<Supplier[]>([]);
  readonly budgetLines = signal<BudgetLine[]>([]);
  readonly supplierTerm = signal('');
  readonly budgetTerm = signal('');
  readonly saving = signal(false);

  readonly supplierForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    taxId: ['', [Validators.required, Validators.pattern(NIT_PATTERN)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.pattern(PHONE_PATTERN)]
  });

  readonly budgetForm = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(CODE_PATTERN)]],
    description: ['', [Validators.required, Validators.maxLength(200)]],
    allocatedAmount: [null as number | null, [Validators.required, Validators.min(0.01), Validators.max(999999999.99), maxDecimals(2)]]
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.listSuppliers().subscribe({ next: (rows) => this.suppliers.set(rows), error: (err) => this.toast.error(errorMessage(err)) });
    this.api.listBudgetLines().subscribe({ next: (rows) => this.budgetLines.set(rows), error: (err) => this.toast.error(errorMessage(err)) });
  }

  upperCode(): void {
    const c = this.budgetForm.controls.code;
    const upper = (c.value ?? '').toUpperCase().replace(/\s+/g, '');
    if (upper !== c.value) c.setValue(upper);
  }

  createSupplier(): void {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }
    const v = this.supplierForm.getRawValue();
    this.saving.set(true);
    this.api.createSupplier({ name: v.name!.trim(), taxId: v.taxId!.toUpperCase(), email: v.email!.trim(), phone: v.phone || undefined }).subscribe({
      next: (s) => {
        this.toast.success(`Proveedor "${s.name}" agregado.`);
        this.supplierForm.reset();
        this.loadData();
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err, 'No fue posible guardar el proveedor.'));
        this.saving.set(false);
      }
    });
  }

  createBudgetLine(): void {
    if (this.budgetForm.invalid) {
      this.budgetForm.markAllAsTouched();
      return;
    }
    const v = this.budgetForm.getRawValue();
    this.saving.set(true);
    this.api.createBudgetLine({ code: v.code!, description: v.description!.trim(), allocatedAmount: v.allocatedAmount! }).subscribe({
      next: (b) => {
        this.toast.success(`Partida ${b.code} agregada.`);
        this.budgetForm.reset();
        this.loadData();
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err, 'No fue posible guardar la partida.'));
        this.saving.set(false);
      }
    });
  }
}
