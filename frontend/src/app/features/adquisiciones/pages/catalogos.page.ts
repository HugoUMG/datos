import { CurrencyPipe } from '@angular/common';
import { RestrictDirective } from '../../../shared/restrict.directive';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BudgetLine, Supplier } from '../../../core/models/api.models';
import { AssetsApiService } from '../../../core/services/assets-api.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { errorMessage } from '../../../core/http-error';
import { PagerComponent, SortHeaderComponent, TableCtl, exportCsv } from '../../../shared/table';
import { BadgeComponent, FieldErrorComponent, IconComponent, SearchBoxComponent } from '../../../shared/ui';
import { CODE_PATTERN, NIT_PATTERN, PHONE_PATTERN, maxDecimals } from '../../../shared/validators';

@Component({
  standalone: true,
  imports: [RestrictDirective, ReactiveFormsModule, CurrencyPipe, FieldErrorComponent, IconComponent, SearchBoxComponent, BadgeComponent, SortHeaderComponent, PagerComponent],
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
          <form [formGroup]="supplierForm" (ngSubmit)="saveSupplier()" class="form-grid" novalidate>
            <div class="field">
              <label for="s-name">Nombre<span class="req">*</span></label>
              <input id="s-name" appRestrict="text" formControlName="name" placeholder="Distribuidora S.A." maxlength="120" />
              <app-field-error [control]="supplierForm.controls.name" />
            </div>
            <div class="field">
              <label for="s-nit">NIT<span class="req">*</span></label>
              <input id="s-nit" appRestrict="nit" formControlName="taxId" placeholder="1234567-8" maxlength="15" />
              <app-field-error [control]="supplierForm.controls.taxId" patternHint="NIT inválido: solo dígitos y el verificador (0-9 o K), ej. 1234567-8." />
            </div>
            <div class="field">
              <label for="s-email">Email<span class="req">*</span></label>
              <input id="s-email" type="email" formControlName="email" placeholder="ventas@proveedor.com" />
              <app-field-error [control]="supplierForm.controls.email" />
            </div>
            <div class="field">
              <label for="s-phone">Teléfono</label>
              <input id="s-phone" appRestrict="phone" type="tel" formControlName="phone" placeholder="5555-1234" maxlength="15" />
              <app-field-error [control]="supplierForm.controls.phone" patternHint="Teléfono inválido: mínimo 8 dígitos (ej. 5555-1234)." />
            </div>
            <div class="form-actions">
              @if (editingSupplier(); as s) {
                <span class="muted small" style="margin-right:auto">Editando: <strong>{{ s.name }}</strong></span>
                <button type="button" class="btn-secondary" (click)="cancelSupplier()">Cancelar</button>
                <button type="submit" [disabled]="saving()"><app-icon name="check" [size]="16" /> Guardar cambios</button>
              } @else {
                <button type="submit" [disabled]="saving()"><app-icon name="plus" [size]="16" /> Agregar proveedor</button>
              }
            </div>
          </form>

          @let sv = st.view(suppliers());
          <div class="toolbar" style="margin-top:1.25rem">
            <app-search-box [value]="st.term()" (valueChange)="st.setTerm($event)" placeholder="Buscar por nombre, NIT o email…" />
            <select [value]="st.filter('active')" (change)="st.setFilter('active', activeValue($any($event.target).value))" aria-label="Filtrar por estado">
              <option value="">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option>
            </select>
            <span class="count">{{ sv.filtered.length }} de {{ sv.total }}</span>
            <button type="button" class="btn-secondary btn-sm" (click)="exportSuppliers(sv.filtered)" [disabled]="!sv.filtered.length"><app-icon name="download" [size]="14" /> CSV</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr>
                <th appSort="name" [ctl]="st">Nombre</th><th appSort="taxId" [ctl]="st">NIT</th><th appSort="email" [ctl]="st">Email</th>
                <th>Teléfono</th><th appSort="active" [ctl]="st">Estado</th><th></th>
              </tr></thead>
              <tbody>
                @for (s of sv.items; track s.id) {
                  <tr>
                    <td><strong>{{ s.name }}</strong></td><td class="mono">{{ s.taxId }}</td><td>{{ s.email }}</td>
                    <td>{{ s.phone || '—' }}</td>
                    <td><app-badge [tone]="s.active ? 'success' : 'neutral'">{{ s.active ? 'Activo' : 'Inactivo' }}</app-badge></td>
                    <td>
                      <div class="row">
                        <button type="button" class="btn-ghost btn-sm" (click)="editSupplier(s)">Editar</button>
                        <button type="button" class="btn-ghost btn-sm" (click)="toggleSupplier(s)">{{ s.active ? 'Desactivar' : 'Activar' }}</button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="empty">{{ st.term() ? 'Sin resultados para la búsqueda.' : 'Aún no hay proveedores.' }}</td></tr>
                }
              </tbody>
            </table>
          </div>
          <app-pager [ctl]="st" [view]="sv" />
        } @else {
          <form [formGroup]="budgetForm" (ngSubmit)="saveBudgetLine()" class="form-grid" novalidate>
            <div class="field">
              <label for="b-code">Código<span class="req">*</span></label>
              <input id="b-code" appRestrict="code" formControlName="code" placeholder="PP-2026-01" maxlength="30" (input)="upperCode()" />
              <app-field-error [control]="budgetForm.controls.code" patternHint="Solo mayúsculas, dígitos, puntos y guiones (ej. PP-2026-01)." />
            </div>
            <div class="field">
              <label for="b-desc">Descripción<span class="req">*</span></label>
              <input id="b-desc" appRestrict="text" formControlName="description" placeholder="Equipo de cómputo" maxlength="200" />
              <app-field-error [control]="budgetForm.controls.description" />
            </div>
            <div class="field">
              <label for="b-amount">Monto asignado (Q)<span class="req">*</span></label>
              <input id="b-amount" appRestrict="money" type="number" inputmode="decimal" formControlName="allocatedAmount" placeholder="0.00" min="0.01" step="0.01" />
              <app-field-error [control]="budgetForm.controls.allocatedAmount" />
            </div>
            <div class="form-actions">
              @if (editingBudget(); as b) {
                <span class="muted small" style="margin-right:auto">Editando: <strong>{{ b.code }}</strong></span>
                <button type="button" class="btn-secondary" (click)="cancelBudget()">Cancelar</button>
                <button type="submit" [disabled]="saving()"><app-icon name="check" [size]="16" /> Guardar cambios</button>
              } @else {
                <button type="submit" [disabled]="saving()"><app-icon name="plus" [size]="16" /> Agregar partida</button>
              }
            </div>
          </form>

          @let bv = bt.view(budgetLines());
          <div class="toolbar" style="margin-top:1.25rem">
            <app-search-box [value]="bt.term()" (valueChange)="bt.setTerm($event)" placeholder="Buscar por código o descripción…" />
            <span class="count">{{ bv.filtered.length }} de {{ bv.total }}</span>
            <button type="button" class="btn-secondary btn-sm" (click)="exportBudget(bv.filtered)" [disabled]="!bv.filtered.length"><app-icon name="download" [size]="14" /> CSV</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr>
                <th appSort="code" [ctl]="bt">Código</th><th appSort="description" [ctl]="bt">Descripción</th>
                <th appSort="allocatedAmount" [ctl]="bt" class="right">Monto asignado</th><th></th>
              </tr></thead>
              <tbody>
                @for (b of bv.items; track b.id) {
                  <tr>
                    <td class="mono">{{ b.code }}</td><td>{{ b.description }}</td><td class="right">{{ b.allocatedAmount | currency }}</td>
                    <td><button type="button" class="btn-ghost btn-sm" (click)="editBudget(b)">Editar</button></td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="empty">{{ bt.term() ? 'Sin resultados para la búsqueda.' : 'Aún no hay partidas.' }}</td></tr>
                }
              </tbody>
            </table>
          </div>
          <app-pager [ctl]="bt" [view]="bv" />
        }
      </div>
    </section>
  `
})
export class CatalogosPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AssetsApiService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly tab = signal<'suppliers' | 'budget'>('suppliers');
  readonly suppliers = signal<Supplier[]>([]);
  readonly budgetLines = signal<BudgetLine[]>([]);
  readonly st = new TableCtl<Supplier>();
  readonly bt = new TableCtl<BudgetLine>();
  readonly saving = signal(false);
  readonly editingSupplier = signal<Supplier | null>(null);
  readonly editingBudget = signal<BudgetLine | null>(null);

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

  activeValue(value: string): boolean | '' {
    return value === '' ? '' : value === 'true';
  }

  upperCode(): void {
    const c = this.budgetForm.controls.code;
    const upper = (c.value ?? '').toUpperCase().replace(/\s+/g, '');
    if (upper !== c.value) c.setValue(upper);
  }

  editSupplier(s: Supplier): void {
    this.editingSupplier.set(s);
    this.supplierForm.reset({ name: s.name, taxId: s.taxId, email: s.email, phone: s.phone ?? '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelSupplier(): void {
    this.editingSupplier.set(null);
    this.supplierForm.reset();
  }

  saveSupplier(): void {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }
    const v = this.supplierForm.getRawValue();
    const payload = { name: v.name!.trim(), taxId: v.taxId!.toUpperCase(), email: v.email!.trim(), phone: v.phone || undefined };
    const editing = this.editingSupplier();
    this.saving.set(true);
    const request = editing ? this.api.updateSupplier(editing.id, payload) : this.api.createSupplier(payload);
    request.subscribe({
      next: (s) => {
        this.toast.success(editing ? `Proveedor "${s.name}" actualizado.` : `Proveedor "${s.name}" agregado.`);
        this.cancelSupplier();
        this.loadData();
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err, 'No fue posible guardar el proveedor.'));
        this.saving.set(false);
      }
    });
  }

  async toggleSupplier(s: Supplier): Promise<void> {
    if (s.active) {
      const ok = await this.confirm.ask({
        title: 'Desactivar proveedor',
        message: `"${s.name}" ya no aparecerá al registrar facturas nuevas. Sus facturas anteriores se conservan.`,
        confirmText: 'Desactivar',
        danger: true
      });
      if (!ok) return;
    }
    this.api.setSupplierActive(s.id, !s.active).subscribe({
      next: (updated) => {
        this.toast.success(`Proveedor "${updated.name}" ${updated.active ? 'activado' : 'desactivado'}.`);
        this.loadData();
      },
      error: (err) => this.toast.error(errorMessage(err, 'No fue posible cambiar el estado del proveedor.'))
    });
  }

  editBudget(b: BudgetLine): void {
    this.editingBudget.set(b);
    this.budgetForm.reset({ code: b.code, description: b.description, allocatedAmount: b.allocatedAmount });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelBudget(): void {
    this.editingBudget.set(null);
    this.budgetForm.reset();
  }

  saveBudgetLine(): void {
    if (this.budgetForm.invalid) {
      this.budgetForm.markAllAsTouched();
      return;
    }
    const v = this.budgetForm.getRawValue();
    const payload = { code: v.code!, description: v.description!.trim(), allocatedAmount: v.allocatedAmount! };
    const editing = this.editingBudget();
    this.saving.set(true);
    const request = editing ? this.api.updateBudgetLine(editing.id, payload) : this.api.createBudgetLine(payload);
    request.subscribe({
      next: (b) => {
        this.toast.success(editing ? `Partida ${b.code} actualizada.` : `Partida ${b.code} agregada.`);
        this.cancelBudget();
        this.loadData();
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(errorMessage(err, 'No fue posible guardar la partida.'));
        this.saving.set(false);
      }
    });
  }

  exportSuppliers(rows: Supplier[]): void {
    exportCsv('proveedores.csv', [
      { label: 'Nombre', value: (r) => r.name },
      { label: 'NIT', value: (r) => r.taxId },
      { label: 'Email', value: (r) => r.email },
      { label: 'Teléfono', value: (r) => r.phone },
      { label: 'Estado', value: (r) => (r.active ? 'Activo' : 'Inactivo') }
    ], rows);
  }

  exportBudget(rows: BudgetLine[]): void {
    exportCsv('partidas.csv', [
      { label: 'Código', value: (r) => r.code },
      { label: 'Descripción', value: (r) => r.description },
      { label: 'Monto asignado', value: (r) => r.allocatedAmount }
    ], rows);
  }
}
