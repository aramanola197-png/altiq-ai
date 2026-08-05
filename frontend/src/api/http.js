/**
 * Shared fetch wrapper used by every api/*.js file.
 *
 * Production: set VITE_API_URL to the backend origin (no trailing slash),
 * e.g. https://altiq-ai-api.onrender.com
 * Local dev: leave unset — requests stay on /api and Vite proxies to :5000.
 */
export function getApiBase() {
  const raw = import.meta.env.VITE_API_URL;
  if (!raw || typeof raw !== 'string') return '';
  return raw.replace(/\/$/, '');
}

export function apiUrl(path) {
  const base = getApiBase();
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

async function safeParseJson(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export async function apiRequest(path, options = {}) {
  let res;
  const url = apiUrl(path);
  try {
    res = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
  } catch (networkErr) {
    throw new Error(
      "Can't reach the server. If you're developing locally, start the backend (cd backend && npm start). In production, check VITE_API_URL and CORS."
    );
  }

  const data = await safeParseJson(res);

  if (!res.ok) {
    throw new Error(data.message || `Something went wrong (${res.status}). Please try again.`);
  }

  return data;
}
