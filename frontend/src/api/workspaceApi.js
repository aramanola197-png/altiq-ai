import { apiRequest } from './http';

const request = (projectId, path, options = {}) =>
  apiRequest(`/api/projects/${projectId}${path}`, options);

export const getResearch = (projectId) => request(projectId, '/research');
export const generateResearch = (projectId) =>
  request(projectId, '/research/generate', { method: 'POST' });

export const getBrand = (projectId) => request(projectId, '/brand');
export const generateBrand = (projectId) =>
  request(projectId, '/brand/generate', { method: 'POST' });

export const getDocuments = (projectId) => request(projectId, '/documents');
export const generateDocument = (projectId, type) =>
  request(projectId, '/documents/generate', {
    method: 'POST',
    body: JSON.stringify({ type }),
  });

export const getTimeline = (projectId) => request(projectId, '/timeline');

export const updateResearch = (projectId, id, content) =>
  request(projectId, `/research/${id}`, { method: 'PATCH', body: JSON.stringify({ content }) });

export const updateBrand = (projectId, id, content) =>
  request(projectId, `/brand/${id}`, { method: 'PATCH', body: JSON.stringify({ content }) });

export const updateDocument = (projectId, id, content) =>
  request(projectId, `/documents/${id}`, { method: 'PATCH', body: JSON.stringify({ content }) });

export function exportUrl(projectId, kind, format = 'markdown', type) {
  const q = new URLSearchParams({ format });
  if (type) q.set('type', type);
  return `/api/projects/${projectId}/export/${kind}?${q.toString()}`;
}
