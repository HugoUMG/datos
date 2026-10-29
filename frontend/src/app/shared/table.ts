import { Component, computed, input, signal } from '@angular/core';
import { matchesSearch, searchWords } from './search.pipe';

type Getter<T> = (row: T) => unknown;

export interface TableView<T> {
  items: T[];
  filtered: T[];
  total: number;
  page: number;
  pages: number;
  from: number;
  to: number;
}

/**
 * Estado de una tabla: búsqueda, filtros exactos, orden por columna y paginación.
 * Uso en plantilla: `@let v = table.view(rows())` y luego `@for (r of v.items; ...)`.
 */
export class TableCtl<T> {
  readonly term = signal('');
  readonly filters = signal<Record<string, unknown>>({});
  readonly sortKey = signal<string | null>(null);
  readonly sortDir = signal<'asc' | 'desc'>('asc');
  readonly page = signal(1);

  constructor(
    private readonly getters: Record<string, Getter<T>> = {},
    readonly pageSize = 10
  ) {}

  setTerm(value: string): void {
    this.term.set(value);
    this.page.set(1);
  }

  setFilter(key: string, value: unknown): void {
    this.filters.update((f) => ({ ...f, [key]: value }));
    this.page.set(1);
  }

  filter(key: string): unknown {
    return this.filters()[key] ?? '';
  }

  toggleSort(key: string): void {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  arrow(key: string): string {
    if (this.sortKey() !== key) return '↕';
    return this.sortDir() === 'asc' ? '↑' : '↓';
  }

  value(row: T, key: string): unknown {
    const getter = this.getters[key];
    if (getter) return getter(row);
    return key.split('.').reduce<unknown>((obj, part) => (obj as Record<string, unknown> | null)?.[part], row);
  }

  /** Filas filtradas y ordenadas (todas, sin paginar): lo que se exporta. */
  filtered(rows: T[] | null | undefined): T[] {
    const words = searchWords(this.term());
    const exact = Object.entries(this.filters()).filter(([, v]) => v !== '' && v !== null && v !== undefined);
    let result = (rows ?? []).filter(
      (row) => exact.every(([key, expected]) => this.value(row, key) === expected) && matchesSearch(row, words)
    );
    const key = this.sortKey();
    if (key) {
      const dir = this.sortDir() === 'asc' ? 1 : -1;
      result = [...result].sort((a, b) => compare(this.value(a, key), this.value(b, key)) * dir);
    }
    return result;
  }

  view(rows: T[] | null | undefined): TableView<T> {
    const filtered = this.filtered(rows);
    const pages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
    const page = Math.min(this.page(), pages);
    const start = (page - 1) * this.pageSize;
    const items = filtered.slice(start, start + this.pageSize);
    return {
      items,
      filtered,
      total: rows?.length ?? 0,
      page,
      pages,
      from: filtered.length ? start + 1 : 0,
      to: start + items.length
    };
  }
}

function compare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined || a === '') return 1;
  if (b === null || b === undefined || b === '') return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && String(a).trim() !== '' && String(b).trim() !== '') return na - nb;
  return String(a).localeCompare(String(b), 'es', { sensitivity: 'base', numeric: true });
}

/** Encabezado de columna que ordena la tabla al hacer clic. */
@Component({
  selector: 'th[appSort]',
  standalone: true,
  template: `<button type="button" class="th-sort" (click)="ctl().toggleSort(appSort())" [attr.aria-label]="'Ordenar por ' + label()">
    <ng-content /><span class="arrow" [class.on]="ctl().sortKey() === appSort()">{{ ctl().arrow(appSort()) }}</span>
  </button>`,
  host: { '[attr.aria-sort]': 'ariaSort()' }
})
export class SortHeaderComponent {
  readonly appSort = input.required<string>();
  readonly ctl = input.required<TableCtl<any>>();
  readonly label = input('esta columna');
  readonly ariaSort = computed(() =>
    this.ctl().sortKey() !== this.appSort() ? null : this.ctl().sortDir() === 'asc' ? 'ascending' : 'descending'
  );
}

/** Controles de paginación "Mostrando 1–10 de 42  ‹ 1 / 5 ›". */
@Component({
  selector: 'app-pager',
  standalone: true,
  template: `
    @if (view().filtered.length > ctl().pageSize) {
      <div class="pager">
        <span class="muted small">Mostrando {{ view().from }}–{{ view().to }} de {{ view().filtered.length }}</span>
        <div class="row">
          <button type="button" class="btn-secondary btn-sm" [disabled]="view().page <= 1" (click)="ctl().page.set(view().page - 1)" aria-label="Página anterior">‹ Anterior</button>
          <span class="small">{{ view().page }} / {{ view().pages }}</span>
          <button type="button" class="btn-secondary btn-sm" [disabled]="view().page >= view().pages" (click)="ctl().page.set(view().page + 1)" aria-label="Página siguiente">Siguiente ›</button>
        </div>
      </div>
    }
  `
})
export class PagerComponent {
  readonly ctl = input.required<TableCtl<any>>();
  readonly view = input.required<TableView<any>>();
}

export interface CsvColumn<T> {
  label: string;
  value: (row: T) => unknown;
}

/** Descarga filas como CSV (UTF-8 con BOM para que Excel respete acentos). */
export function exportCsv<T>(filename: string, columns: CsvColumn<T>[], rows: T[]): void {
  const escape = (v: unknown): string => {
    const text = v === null || v === undefined ? '' : String(v);
    return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [columns.map((c) => escape(c.label)).join(','), ...rows.map((r) => columns.map((c) => escape(c.value(r))).join(','))];
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
