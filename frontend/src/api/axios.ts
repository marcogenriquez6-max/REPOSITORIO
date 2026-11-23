import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error || {};
    const status = response?.status;
    const original = config || {};

    if (status === 401 && !original._retry && !String(original.url || '').includes('/auth/login')) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = (async () => {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) return null;
            const r = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
            const data = r.data?.data || r.data;
            if (data?.token) localStorage.setItem('token', data.token);
            if (data?.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
            if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));
            window.dispatchEvent(new CustomEvent('unior:auth-refreshed', { detail: data }));
            return data?.token ?? null;
          })().finally(() => { refreshing = null; });
        }
        const newToken = await refreshing;
        if (newToken) {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch {
        // fallthrough to logout
      }
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('unior:session-expired'));
      if (window.location.pathname !== '/login') {
        sessionStorage.setItem('unior:sessionExpired', '1');
        window.location.href = '/login';
      }
    }

    if (status === 403) error.userMessage = response?.data?.message || 'No tiene permisos para esta acción.';
    if (status === 409) error.userMessage = response?.data?.message || 'Conflicto de estado o transición inválida.';
    return Promise.reject(error);
  }
);

export default api;
