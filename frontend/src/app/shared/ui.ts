import { Component, computed, input, model } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { BadgeTone, statusInfo } from './labels';

/** Íconos SVG en línea (trazos estilo Lucide) para no depender de librerías externas. */
const ICONS: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
  cart: 'M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6M9 21h.01M18 21h.01',
  box: 'M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',
  swap: 'M7 7h13l-4-4M17 17H4l4 4',
  trash: 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14',
  chart: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  users: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M22 19v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8',
  user: 'M20 21v-1a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v1M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  truck: 'M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4',
  key: 'M15 7a4 4 0 1 1-3.9 5H3v3h3v3h3v-3h2.1A4 4 0 0 1 15 7z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.3-4.3',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  menu: 'M3 6h18M3 12h18M3 18h18',
  x: 'M18 6 6 18M6 6l12 12',
  plus: 'M12 5v14M5 12h14',
  refresh: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5',
  download: 'M12 3v12M7 10l5 5 5-5M5 21h14',
  qr: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h4v4h-4',
  check: 'M20 6 9 17l-5-5',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  'eye-off': 'M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6',
  undo: 'M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3'
};

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="path()" /></svg>`,
  styles: [':host { display: inline-flex; flex-shrink: 0; }']
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly size = input(18);
  readonly path = computed(() => ICONS[this.name()] ?? '');
}

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="badge" [class]="'badge badge-' + info().tone">{{ info().label }}</span>`
})
export class StatusBadgeComponent {
  readonly status = input<string | null | undefined>();
  readonly info = computed(() => statusInfo(this.status()));
}

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `<span [class]="'badge badge-' + tone()"><ng-content /></span>`
})
export class BadgeComponent {
  readonly tone = input<BadgeTone>('neutral');
}

/** Mensaje de error de un control, solo cuando el usuario ya lo tocó. */
@Component({
  selector: 'app-field-error',
  standalone: true,
  template: `@if (message(); as msg) { <span class="field-error" role="alert">{{ msg }}</span> }`
})
export class FieldErrorComponent {
  readonly control = input.required<AbstractControl | null>();
  /** Mensaje para errores de `Validators.pattern`. */
  readonly patternHint = input('El formato no es válido.');

  message(): string | null {
    const c = this.control();
    if (!c || !c.errors || !(c.touched || c.dirty)) return null;
    const e = c.errors;
    if (e['required']) return 'Este campo es obligatorio.';
    if (e['email']) return 'Escribe un email válido (ej. nombre@empresa.com).';
    if (e['min']) return `Debe ser mayor o igual a ${e['min'].min}.`;
    if (e['max']) return `Debe ser menor o igual a ${e['max'].max}.`;
    if (e['minlength']) return `Mínimo ${e['minlength'].requiredLength} caracteres.`;
    if (e['maxlength']) return `Máximo ${e['maxlength'].requiredLength} caracteres.`;
    if (e['dateFormat']) return 'Fecha inválida.';
    if (e['dateMin']) return `La fecha no puede ser anterior al ${formatIso(e['dateMin'].min)}.`;
    if (e['dateMax']) return `La fecha no puede ser posterior al ${formatIso(e['dateMax'].max)}.`;
    if (e['notBefore']) return `No puede ser anterior a ${e['notBefore'].label}.`;
    if (e['invoiceFormat']) return 'Usa el formato SERIE-NÚMERO: letras mayúsculas, dígitos y guiones (ej. FAC-2026-0001).';
    if (e['invoiceDigit']) return 'El número de factura debe incluir al menos un dígito.';
    if (e['maxDecimals']) return `Máximo ${e['maxDecimals'].decimals} decimales.`;
    if (e['pattern']) return this.patternMessage();
    return 'Valor inválido.';
  }

  private patternMessage(): string {
    return this.patternHint();
  }
}

function formatIso(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Caja de búsqueda con contador "N de M" para la barra de cada tabla. */
@Component({
  selector: 'app-search-box',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="search">
      <app-icon name="search" [size]="16" />
      <input type="search" [ngModel]="value()" (ngModelChange)="value.set($event)" [placeholder]="placeholder()"
        [attr.aria-label]="placeholder()" />
    </div>
  `,
  styles: [':host { display: contents; }']
})
export class SearchBoxComponent {
  readonly value = model('');
  readonly placeholder = input('Buscar…');
}
