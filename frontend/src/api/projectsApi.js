const BASE = '/api/projects';

async function request(path = '', options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const listProjects = () => request();
export const createProject = (body) => request('', { method: 'POST', body: JSON.stringify(body) });
export const getProject = (id) => request(`/${id}`);
export const updateProject = (id, body) => request(`/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
export const deleteProject = (id) => request(`/${id}`, { method: 'DELETE' });
