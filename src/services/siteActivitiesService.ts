import api from './api';

export interface SiteActivity {
    id: string;
    project: string;
    siteId?: string;
    date: string;
    description: string;
    status: 'planned' | 'in_progress' | 'completed';
    workers: number;
    notes: string;
    isActive: boolean;
    createdAt: string;
}

const baseUrl = '/site-activities';

export const siteActivitiesService = {
    getAll: () => api.get(`${baseUrl}`),
    getAllAdmin: () => api.get(`${baseUrl}/admin`),
    getOne: (id: string) => api.get(`${baseUrl}/${id}`),
    create: (data: Partial<SiteActivity>) => api.post(`${baseUrl}`, data),
    update: (id: string, data: Partial<SiteActivity>) => api.put(`${baseUrl}/${id}`, data),
    delete: (id: string) => api.delete(`${baseUrl}/${id}`),
};
