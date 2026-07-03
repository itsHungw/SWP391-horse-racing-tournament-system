const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

/**
 * Origin of the backend API, or "" when the API is same-origin as the app.
 *
 * In dev VITE_API_BASE_URL is unset, so the base is the relative "/api/v1" and
 * requests go through the Vite proxy on the same origin -> "". In prod the base
 * is absolute (e.g. https://api.aqueduct.me/api/v1), so the API lives on a
 * different origin than the app (app.aqueduct.me) and we need that origin.
 */
function apiOrigin(): string {
  try {
    const origin = new URL(apiBaseUrl, window.location.origin).origin;
    return origin === window.location.origin ? "" : origin;
  } catch {
    return "";
  }
}

/**
 * Resolve a backend file URL for use in an <img src> or direct browser fetch.
 *
 * The backend returns root-relative paths like "/api/v1/files/download/x.jpg".
 * axios prefixes VITE_API_BASE_URL for XHR calls, but a plain <img src> does not
 * -- the browser resolves the relative path against the *page* origin. When the
 * API is on a different origin (prod: api.aqueduct.me vs app.aqueduct.me on
 * Vercel), that resolves to the frontend, which serves index.html and the image
 * breaks. Prefixing the API origin fixes it.
 *
 * Idempotent: absolute http(s), data:, and blob: URLs (already-resolved links,
 * bundled assets served absolutely, and local file previews) pass through
 * unchanged, so it is safe to wrap any image source.
 */
export function resolveFileUrl(url: string | null | undefined): string {
  if (!url) {
    return "";
  }
  if (/^(https?:|data:|blob:)/i.test(url)) {
    return url;
  }
  return `${apiOrigin()}${url}`;
}
