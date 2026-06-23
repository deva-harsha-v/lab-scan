import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('labscan_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh token on 401
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return client(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = sessionStorage.getItem('labscan_refresh');

      // Don't redirect to login for public routes (scan page, aruco lookup, etc.)
      const publicPaths = ['/aruco', '/experiments/aruco'];
      const isPublicRequest = publicPaths.some((p) => originalRequest.url?.includes(p));
      if (!refreshToken || isPublicRequest) {
        sessionStorage.removeItem('labscan_token');
        sessionStorage.removeItem('labscan_user');
        if (!isPublicRequest) window.location.href = '/';
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = res.data;
        sessionStorage.setItem('labscan_token', accessToken);
        sessionStorage.setItem('labscan_refresh', newRefresh);
        client.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return client(originalRequest);
      } catch (err) {
        processQueue(err, null);
        sessionStorage.removeItem('labscan_token');
        sessionStorage.removeItem('labscan_refresh');
        sessionStorage.removeItem('labscan_user');
        window.location.href = '/';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth API helper
export const authApi = {
  login: (identifier, password, portalType) => client.post('/auth/login', { identifier, password, portalType }),
  register: (name, email, password, role) =>
    client.post('/auth/register', { name, email, password, role }),
  refresh: (refreshToken) => client.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) => client.post('/auth/logout', { refreshToken }),
  me: () => client.get('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    client.post('/auth/change-password', { currentPassword, newPassword }),
};

export const apiClient = client;
export default client;
