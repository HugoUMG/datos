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

export function searchWords(term: string): string[] {
  return normalize(term ?? '').split(/\s+/).filter(Boolean);
}

/** Todas las palabras deben aparecer en algún campo de la fila (sin importar acentos ni mayúsculas). */
export function matchesSearch(row: unknown, words: string[]): boolean {
  if (!words.length) return true;
  const parts: string[] = [];
  collectText(row, 3, parts);
  const haystack = normalize(parts.join(' '));
  return words.every((word) => haystack.includes(word));
}
