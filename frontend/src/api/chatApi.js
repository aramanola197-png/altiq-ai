import { apiRequest } from './http';

const request = (projectId, path = '', options = {}) =>
  apiRequest(`/api/projects/${projectId}/chat${path}`, options);

export const getChatHistory = (projectId) => request(projectId);
export const sendMessage = (projectId, content, mode = 'general') =>
  request(projectId, '', { method: 'POST', body: JSON.stringify({ content, mode }) });
