import apiClient from './client';

export const authService = {
  // Fetch CSRF token from backend
  getCsrf: async () => {
    try {
      const response = await apiClient.get('/api/auth/csrf');
      return response.data;
    } catch {
      return null;
    }
  },

  // Register new account (Role can be CUSTOMER or FARMER)
  register: async (userData) => {
    const response = await apiClient.post('/api/auth/register', userData);
    return response.data;
  },

  // Authenticate user & establish server session
  login: async (credentials) => {
    const response = await apiClient.post('/api/auth/login', credentials);
    return response.data;
  },

  // Terminate session
  logout: async () => {
    const response = await apiClient.post('/api/auth/logout');
    return response.data;
  },

  // Retrieve authenticated profile
  getCurrentUser: async () => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },
};
