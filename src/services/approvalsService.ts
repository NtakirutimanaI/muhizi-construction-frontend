import api from './api';

export interface Approval {
    id: string;
    type: 'material' | 'money';
    title: string;
    requester: string;
    amount?: number;
    items?: { name: string; qty: number; unit: string }[];
    description: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: string;
    reviewedAt?: string;
}

const baseUrl = '/approvals';

export const approvalsService = {
    getAll: () => api.get(`${baseUrl}`),
    getOne: (id: string) => api.get(`${baseUrl}/${id}`),
    create: (data: Partial<Approval>) => api.post(`${baseUrl}`, data),
    update: (id: string, data: Partial<Approval>) => api.put(`${baseUrl}/${id}`, data),
    delete: (id: string) => api.delete(`${baseUrl}/${id}`),
};
