import api from './api';

export const authService = {
    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    login: async (credentials: { email: string; password: string }) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    register: async (data: any) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    changePassword: async (data: any) => {
        const response = await api.post('/auth/change-password', data);
        return response.data;
    },

    refresh: async (refreshToken: string) => {
        const response = await api.post('/auth/refresh', { refreshToken });
        return response.data;
    },

    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data;
    },

    forgotPassword: async (email: string) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (data: { email: string; otp: string; newPassword: string }) => {
        const response = await api.post('/auth/reset-password', data);
        return response.data;
    },

    getAllUsers: async () => {
        const response = await api.get('/auth/users');
        return response.data;
    },

    createUser: async (data: { email: string; password: string; firstName: string; lastName: string; role?: string; phone?: string }) => {
        const response = await api.post('/auth/users', data);
        return response.data;
    },

    getUser: async (id: string) => {
        const response = await api.get(`/auth/users/${id}`);
        return response.data;
    },

    updateUser: async (id: string, data: any) => {
        const response = await api.patch(`/auth/users/${id}`, data);
        return response.data;
    },

    deleteUser: async (id: string) => {
        const response = await api.delete(`/auth/users/${id}`);
        return response.data;
    },
};
