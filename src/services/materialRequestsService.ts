import api from './api';

export interface MaterialRequest {
    id: string;
    project: string;
    material: string;
    quantity: number;
    unit: string;
    date: string;
    status: 'pending' | 'approved' | 'delivered' | 'rejected';
    notes: string;
}

const baseUrl = '/material-requests';

export const materialRequestsService = {
    getAll: () => api.get(`${baseUrl}`),
    getOne: (id: string) => api.get(`${baseUrl}/${id}`),
    create: (data: Partial<MaterialRequest>) => api.post(`${baseUrl}`, data),
    update: (id: string, data: Partial<MaterialRequest>) => api.put(`${baseUrl}/${id}`, data),
    delete: (id: string) => api.delete(`${baseUrl}/${id}`),
};
