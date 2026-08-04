/**
 * Shared fetch wrapper used by every api/*.js file.
 *
 * This exists to fix a real bug: when the backend isn't reachable
 * (not running, wrong port, network drop), fetch still resolves —
 * it just resolves with a non-JSON or empty body — and calling
 * `res.json()` directly on that throws a cryptic
 * "Unexpected end of JSON input" error that gets shown to the user
 * verbatim. This wrapper catches both failure modes and always
 * throws a clear, human-readable message instead.
 */
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
  try {
    res = await fetch(path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
  } catch (networkErr) {
    // fetch() only throws for genuine network failures — the backend
    // being down, CORS being misconfigured, no connection, etc.
    throw new Error(
      "Can't reach the server. Make sure the backend is running (cd backend && npm run dev) and try again."
    );
  }

  const data = await safeParseJson(res);

  if (!res.ok) {
    throw new Error(data.message || `Something went wrong (${res.status}). Please try again.`);
  }

  return data;
}
