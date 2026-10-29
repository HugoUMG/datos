export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral';

interface StatusInfo {
  label: string;
  tone: BadgeTone;
}

/** Etiquetas legibles y color de cada estado que devuelve el backend. */
const STATUS: Record<string, StatusInfo> = {
  // Activos
  EN_ALMACEN: { label: 'En almacén', tone: 'info' },
  ASIGNADO: { label: 'Asignado', tone: 'success' },
  EN_TRASLADO: { label: 'En traslado', tone: 'warning' },
  EN_REVISION: { label: 'En revisión', tone: 'warning' },
  DADO_DE_BAJA: { label: 'Dado de baja', tone: 'danger' },
  // Asignaciones
  PENDIENTE_CONFIRMACION: { label: 'Pendiente de confirmar', tone: 'warning' },
  ACTIVA: { label: 'Activa', tone: 'success' },
  DEVUELTA: { label: 'Devuelta', tone: 'neutral' },
  // Bajas
  SOLICITADA: { label: 'Solicitada', tone: 'warning' },
  APROBADA: { label: 'Aprobada', tone: 'success' },
  RECHAZADA: { label: 'Rechazada', tone: 'danger' },
  EJECUTADA: { label: 'Ejecutada', tone: 'neutral' }
};

export function statusInfo(status: string | null | undefined): StatusInfo {
  if (!status) return { label: '—', tone: 'neutral' };
  return STATUS[status] ?? { label: status.replace(/_/g, ' ').toLowerCase(), tone: 'neutral' };
}

export const ASSET_STATUSES = ['EN_ALMACEN', 'ASIGNADO', 'EN_TRASLADO', 'EN_REVISION', 'DADO_DE_BAJA'];
export const ASSIGNMENT_STATUSES = ['PENDIENTE_CONFIRMACION', 'ACTIVA', 'DEVUELTA'];

export const ROLE_LABELS: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  COMPRAS: 'Compras',
  INVENTARIO: 'Inventario',
  FINANZAS: 'Finanzas',
  EMPLEADO: 'Empleado'
};
