import { apiRequest } from './http';

export const getMyActivity = () => apiRequest('/api/activity/me');
