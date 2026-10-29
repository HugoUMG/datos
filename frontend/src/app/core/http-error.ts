import { HttpErrorResponse } from '@angular/common/http';

/** Convierte un error HTTP en un mensaje entendible para el usuario. */
export function errorMessage(err: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  if (!(err instanceof HttpErrorResponse)) return fallback;
  if (err.status === 0) {
    return 'No se pudo conectar con el servidor. Si estuvo inactivo puede tardar hasta un minuto en despertar; intenta de nuevo.';
  }
  if (err.status === 401) return 'Tu sesión expiró o las credenciales no son válidas.';
  if (err.status === 403) return 'No tienes permisos para realizar esta acción.';
  const apiMessage = (err.error as { error?: string } | null)?.error;
  if (apiMessage) return apiMessage;
  if (err.status >= 500) return 'El servidor tuvo un problema al procesar la solicitud. Intenta de nuevo.';
  return fallback;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
