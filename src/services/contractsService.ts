import api from './api';

export interface Contract {
    id: string;
    title: string;
    employeeName: string;
    department: string;
    type: 'permanent' | 'fixed_term' | 'internship' | 'contractor';
    startDate: string;
    endDate?: string;
    status: 'active' | 'expiring_soon' | 'expired' | 'draft';
    fileUrl?: string;
    fileSize?: string;
    createdAt: string;
}

const baseUrl = '/contracts';

export const contractsService = {
    getAll: () => api.get(`${baseUrl}`),
    getOne: (id: string) => api.get(`${baseUrl}/${id}`),
    create: (data: Partial<Contract>) => api.post(`${baseUrl}`, data),
    update: (id: string, data: Partial<Contract>) => api.put(`${baseUrl}/${id}`, data),
    delete: (id: string) => api.delete(`${baseUrl}/${id}`),
};
