const META_API_BASE = 'app-api-base-url';
const DEFAULT_RENDER_BACKEND = 'https://datos-gh6q.onrender.com';

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

export function getApiBaseUrl(): string {
  const metaValue = readApiBaseFromMeta();

  if (metaValue) {
    return normalizeUrl(metaValue);
  }

  if (typeof window !== 'undefined' && window.location.hostname.endsWith('.onrender.com')) {
    return DEFAULT_RENDER_BACKEND;
  }

  return '';
}

export function resolveApiUrl(url: string): string {
  if (!url.startsWith('/api')) {
    return url;
  }

  const base = getApiBaseUrl();
  return base ? `${base}${url}` : url;
}
