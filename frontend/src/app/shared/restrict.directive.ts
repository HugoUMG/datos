import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Tipos de campo y qué caracteres admiten mientras se escribe o se pega.
 * Las mismas reglas se validan después con Validators.pattern y en el backend.
 */
export type RestrictMode =
  | 'digits'   // solo dígitos
  | 'money'    // número positivo con máximo 2 decimales
  | 'nit'      // dígitos, guion y K (verificador)
  | 'phone'    // dígitos, espacio, guion y +
  | 'code'     // MAYÚSCULAS, dígitos, guion y punto (factura, partida, centro de costo)
  | 'serial'   // letras, dígitos, guion, punto, guion bajo y diagonal (serie, etiqueta)
  | 'name'     // letras (con tildes y ñ), espacios, punto, apóstrofo y guion
  | 'username' // letras sin tildes, dígitos, punto, guion y guion bajo; sin espacios
  | 'text';    // texto libre sin < > (evita etiquetas HTML)

const ALLOWED: Record<Exclude<RestrictMode, 'money'>, RegExp> = {
  digits: /[^0-9]/g,
  nit: /[^0-9Kk-]/g,
  phone: /[^0-9 +-]/g,
  code: /[^A-Z0-9.-]/g,
  serial: /[^A-Za-z0-9._/-]/g,
  name: /[^\p{L} .'-]/gu,
  username: /[^a-zA-Z0-9._-]/g,
  text: /[<>]/g
};

const UPPERCASE: RestrictMode[] = ['code', 'nit'];

export function sanitize(mode: RestrictMode, raw: string): string {
  let value = raw ?? '';
  if (UPPERCASE.includes(mode)) value = value.toUpperCase();
  if (mode === 'money') {
    value = value.replace(/[^0-9.]/g, '');
    const [int, ...rest] = value.split('.');
    return rest.length ? `${int}.${rest.join('').slice(0, 2)}` : int;
  }
  value = value.replace(ALLOWED[mode], '');
  // Sin espacios al inicio ni dobles espacios.
  if (mode === 'name' || mode === 'text' || mode === 'phone') value = value.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
  return value;
}

@Directive({ selector: 'input[appRestrict], textarea[appRestrict]', standalone: true })
export class RestrictDirective {
  readonly appRestrict = input.required<RestrictMode>();
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly control = inject(NgControl, { optional: true, self: true });

  /** En inputs type=number el navegador acepta e, E, + y -; se bloquean. */
  @HostListener('keydown', ['$event'])
  onKeydown(e: Event): void {
    const event = e as KeyboardEvent;
    const mode = this.appRestrict();
    if ((mode === 'money' || mode === 'digits') && ['e', 'E', '+', '-'].includes(event.key)) event.preventDefault();
    if (mode === 'digits' && (event.key === '.' || event.key === ',')) event.preventDefault();
  }

  @HostListener('input')
  onInput(): void {
    const input = this.el.nativeElement;
    const current = input.value;
    const clean = sanitize(this.appRestrict(), current);
    if (clean === current) return;
    const caret = input.selectionStart;
    input.value = clean;
    if (this.control?.control) {
      const value = input.type === 'number' ? (clean === '' ? null : Number(clean)) : clean;
      this.control.control.setValue(value, { emitModelToViewChange: false });
    }
    if (caret !== null && input.type !== 'number') {
      const pos = Math.max(0, caret - (current.length - clean.length));
      input.setSelectionRange(pos, pos);
    }
  }
}
