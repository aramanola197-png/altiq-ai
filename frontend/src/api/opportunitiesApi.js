import { apiRequest } from './http';

const request = (path, options = {}) => apiRequest(`/api/opportunities${path}`, options);

export const listOpportunities = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(q ? `?${q}` : '');
};

export const syncOpportunities = () => request('/sync', { method: 'POST' });

export const getOpportunity = (id) => request(`/${id}`);

export const matchForProject = (projectId) => request(`/match/${projectId}`);

export const draftSubmission = (projectId, opportunityId) =>
  apiRequest(`/api/projects/${projectId}/submission/draft`, {
    method: 'POST',
    body: JSON.stringify({ opportunityId }),
  });
