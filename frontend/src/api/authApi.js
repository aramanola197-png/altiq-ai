const BASE = '/api/auth';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const register = (email, password, name) =>
  request('/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });

export const login = (email, password) =>
  request('/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const getMe = () => request('/me');

export const logout = () => request('/logout', { method: 'POST' });
