import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://muhizi-construction-backend.vercel.app';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

const NO_REFRESH_RETRY_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password'];

const clearSessionAndRedirect = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
};

let refreshPromise: Promise<string | null> | null = null;

const performRefresh = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        return accessToken;
    } catch {
        return null;
    }
};

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isAuthEndpoint = Boolean(originalRequest?.url) && NO_REFRESH_RETRY_PATHS.some((path) => originalRequest.url.includes(path));

        if (error.response?.status === 401 && !isAuthEndpoint) {
            if (!originalRequest._retry) {
                originalRequest._retry = true;
                refreshPromise = refreshPromise || performRefresh();
                const newAccessToken = await refreshPromise;
                refreshPromise = null;

                if (newAccessToken) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                }
            }
            clearSessionAndRedirect();
        }
        return Promise.reject(error);
    }
);

export default api;
