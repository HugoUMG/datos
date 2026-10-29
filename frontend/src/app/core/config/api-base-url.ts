const META_API_BASE = 'app-api-base-url';

function readApiBaseFromMeta(): string {
  if (typeof document === 'undefined') {
    return '';
  }

  const value = document.querySelector(`meta[name="${META_API_BASE}"]`)?.getAttribute('content')?.trim() ?? '';
  return value;
}

function normalizeUrl(value: string): string {
  return value.replace(/\/$/, '');
}

/**
 * Base del backend. Si la meta `app-api-base-url` está vacía se usan rutas relativas (/api/...):
 * en local las reenvía proxy.conf.json y en Render la regla de rewrite del sitio estático.
 */
export function getApiBaseUrl(): string {
  const metaValue = readApiBaseFromMeta();
  return metaValue ? normalizeUrl(metaValue) : '';
}

export function resolveApiUrl(url: string): string {
  if (!url.startsWith('/api')) {
    return url;
  }

  const base = getApiBaseUrl();
  return base ? `${base}${url}` : url;
}
