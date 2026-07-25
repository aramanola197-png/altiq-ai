async function request(path, options = {}) {
  const res = await fetch(`/api/opportunities${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const listOpportunities = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(q ? `?${q}` : '');
};

export const syncOpportunities = () => request('/sync', { method: 'POST' });

export const getOpportunity = (id) => request(`/${id}`);

export const matchForProject = (projectId) => request(`/match/${projectId}`);

export const draftSubmission = async (projectId, opportunityId) => {
  const res = await fetch(`/api/projects/${projectId}/submission/draft`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ opportunityId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Draft failed');
  return data;
};
