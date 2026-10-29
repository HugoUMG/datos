import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Mismas reglas que DateRules en el backend: nada antes del 2000. */
export const MIN_DATE = '2000-01-01';
export const MAX_YEARS_AHEAD = 10;

export function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function yearsAheadIso(years: number): string {
  const [y, m, d] = todayIso().split('-');
  return `${Number(y) + years}-${m}-${d}`;
}

/**
 * Fecha (yyyy-MM-dd) dentro de [min, max]. Los input date dejan teclear años como 1420 o 20260,
 * así que se valida el valor y no solo los atributos min/max del input.
 */
export function dateRange(min: string, max: () => string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null;
    if (!value) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return { dateFormat: true };
    if (value < min) return { dateMin: { min } };
    const maxValue = max();
    if (value > maxValue) return { dateMax: { max: maxValue } };
    return null;
  };
}

/** La fecha de este control no puede ser anterior a la de `otherControlName`. */
export function notBefore(otherControlName: string, label: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const other = control.parent?.get(otherControlName)?.value as string | null;
    const value = control.value as string | null;
    if (!value || !other) return null;
    return value < other ? { notBefore: { label } } : null;
  };
}

/** Número de factura SERIE-NÚMERO, ej. FAC-2026-0001 (igual que el backend). */
export const INVOICE_NUMBER_PATTERN = /^[A-Z][A-Z0-9]*(-[A-Z0-9]+)*$/;

export function invoiceNumber(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value as string | null) ?? '';
    if (!value) return null;
    if (!INVOICE_NUMBER_PATTERN.test(value)) return { invoiceFormat: true };
    if (!/[0-9]/.test(value)) return { invoiceDigit: true };
    return null;
  };
}

export const NIT_PATTERN = /^[0-9]{4,12}-?[0-9Kk]$/;
export const PHONE_PATTERN = /^\+?[0-9 -]{8,15}$/;
export const PERSON_NAME_PATTERN = /^[\p{L} .'-]+$/u;
export const CODE_PATTERN = /^[A-Z0-9][A-Z0-9.-]{1,29}$/;
export const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,30}$/;

/** Máximo de decimales para montos. */
export function maxDecimals(decimals: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    const [, fraction = ''] = String(value).split('.');
    return fraction.length > decimals ? { maxDecimals: { decimals } } : null;
  };
}

/** Serie y etiqueta de activos (igual que el backend). */
export const SERIAL_PATTERN = /^[A-Za-z0-9._/-]+$/;
/** Centro de costo de un departamento, ej. CC-TI. */
export const COST_CENTER_PATTERN = /^[A-Z0-9][A-Z0-9-]{1,19}$/;
