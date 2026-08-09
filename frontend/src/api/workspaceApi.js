import { apiRequest, apiUrl } from './http';

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
  return apiUrl(`/api/projects/${projectId}/export/${kind}?${q.toString()}`);
}

/**
 * Download a branded PDF with credentials (works cross-origin on Render).
 */
export async function downloadExportPdf(projectId, kind, type) {
  const q = new URLSearchParams({ format: 'pdf' });
  if (type) q.set('type', type);
  const url = apiUrl(`/api/projects/${projectId}/export/${kind}?${q.toString()}`);

  let res;
  try {
    res = await fetch(url, { credentials: 'include' });
  } catch {
    throw new Error("Can't reach the server to download the PDF.");
  }

  if (!res.ok) {
    let message = 'Could not download PDF.';
    try {
      const data = await res.json();
      if (data.message) message = data.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  let filename = `ALTIQ-AI_${kind}.pdf`;
  const cd = res.headers.get('Content-Disposition');
  if (cd) {
    const m = cd.match(/filename="([^"]+)"/);
    if (m) filename = m[1];
  }

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
