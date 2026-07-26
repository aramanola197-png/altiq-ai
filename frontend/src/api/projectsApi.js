import { apiRequest } from './http';

const BASE = '/api/projects';

const request = (path = '', options = {}) => apiRequest(`${BASE}${path}`, options);

export const listProjects = () => request();
export const createProject = (body) => request('', { method: 'POST', body: JSON.stringify(body) });
export const getProject = (id) => request(`/${id}`);
export const updateProject = (id, body) => request(`/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
export const deleteProject = (id) => request(`/${id}`, { method: 'DELETE' });
