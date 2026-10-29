import { Pipe, PipeTransform } from '@angular/core';
import { statusInfo } from './labels';

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Junta los valores de texto del objeto (y de sus objetos anidados) para buscar en ellos. */
function collectText(value: unknown, depth: number, out: string[]): void {
  if (value === null || value === undefined) return;
  if (typeof value === 'object') {
    if (depth <= 0) return;
    for (const inner of Object.values(value as Record<string, unknown>)) collectText(inner, depth - 1, out);
    return;
  }
  const text = String(value);
  out.push(text);
  // Permite buscar "en almacén" además de "EN_ALMACEN".
  if (/^[A-Z_]+$/.test(text)) out.push(statusInfo(text).label);
}

/**
 * Filtra una lista por texto libre: todas las palabras deben aparecer en algún campo.
 * Uso: `@let filtered = rows | search: term : { status: 'ACTIVA' }`.
 */
@Pipe({ name: 'search', standalone: true })
export class SearchPipe implements PipeTransform {
  transform<T>(rows: T[] | null | undefined, term: string | null | undefined, equals?: Record<string, unknown>): T[] {
    if (!rows) return [];
    const words = normalize(term ?? '').split(/\s+/).filter(Boolean);
    const exact = Object.entries(equals ?? {}).filter(([, v]) => v !== '' && v !== null && v !== undefined);

    return rows.filter((row) => {
      for (const [key, expected] of exact) {
        if ((row as Record<string, unknown>)[key] !== expected) return false;
      }
      if (!words.length) return true;
      const parts: string[] = [];
      collectText(row, 3, parts);
      const haystack = normalize(parts.join(' '));
      return words.every((word) => haystack.includes(word));
    });
  }
}
