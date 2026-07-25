async function request(projectId, path = '', options = {}) {
  const res = await fetch(`/api/projects/${projectId}/chat${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const getChatHistory = (projectId) => request(projectId);
export const sendMessage = (projectId, content, mode = 'general') =>
  request(projectId, '', { method: 'POST', body: JSON.stringify({ content, mode }) });
