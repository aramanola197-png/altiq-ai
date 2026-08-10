import { apiRequest } from './http';

const request = (projectId, path = '', options = {}) =>
  apiRequest(`/api/projects/${projectId}/chat${path}`, options);

export const getChatHistory = (projectId) => request(projectId);

/**
 * Send a chat message.
 * Supports:
 *   sendMessage(projectId, "hello", "general")
 *   sendMessage(projectId, { content: "hello", mode: "general" })
 */
export const sendMessage = (projectId, contentOrOpts, mode = 'general') => {
  let content = contentOrOpts;
  let resolvedMode = mode;
  if (contentOrOpts && typeof contentOrOpts === 'object') {
    content = contentOrOpts.content;
    resolvedMode = contentOrOpts.mode || 'general';
  }
  return request(projectId, '', {
    method: 'POST',
    body: JSON.stringify({ content: String(content || ''), mode: resolvedMode }),
  });
};
