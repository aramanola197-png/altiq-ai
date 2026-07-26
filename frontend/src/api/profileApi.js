import { apiRequest } from './http';

const BASE = '/api/profile';

const request = (path, options = {}) => apiRequest(`${BASE}${path}`, options);

export const getProfile = () => request('/me');

export const saveProfile = (data) =>
  request('/', { method: 'POST', body: JSON.stringify(data) });
