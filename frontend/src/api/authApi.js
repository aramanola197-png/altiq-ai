import { apiRequest } from './http';

const BASE = '/api/auth';

const request = (path, options = {}) => apiRequest(`${BASE}${path}`, options);

export const register = (email, password, name) =>
  request('/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });

export const login = (email, password) =>
  request('/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const getMe = () => request('/me');

export const logout = () => request('/logout', { method: 'POST' });

export const changePassword = (securityQuestion, securityAnswer, newPassword) =>
  request('/change-password', {
    method: 'POST',
    body: JSON.stringify({ securityQuestion, securityAnswer, newPassword }),
  });
