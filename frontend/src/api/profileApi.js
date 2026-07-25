const BASE = '/api/profile';

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

export const getProfile = () => request('/me');

export const saveProfile = (data) =>
  request('/', { method: 'POST', body: JSON.stringify(data) });
