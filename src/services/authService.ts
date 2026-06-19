import api from './api';

export const authService = {
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

    getAllUsers: async () => {
        const response = await api.get('/auth/users');
        return response.data;
    },
};
