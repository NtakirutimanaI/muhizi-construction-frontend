import api from './api';

export interface Category {
    id: string;
    value: string;
    label: string;
    isBuiltin: boolean;
    createdAt: string;
    updatedAt: string;
}

const baseUrl = '/categories';

export const categoriesService = {
    getAll: () => api.get(`${baseUrl}`),
    getOne: (id: string) => api.get(`${baseUrl}/${id}`),
    create: (data: { value: string; label?: string }) => api.post(`${baseUrl}`, data),
    update: (id: string, data: { value?: string; label?: string }) => api.put(`${baseUrl}/${id}`, data),
    delete: (id: string) => api.delete(`${baseUrl}/${id}`),
};
