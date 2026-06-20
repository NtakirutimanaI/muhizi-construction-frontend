import api from './api';

export interface SiteRule {
    id: string;
    title: string;
    iconName: string;
    pinColor: string;
    items: string[];
    order: number;
    isActive: boolean;
    createdAt: string;
}

const baseUrl = '/site-rules';

export const siteRulesService = {
    getAll: () => api.get(`${baseUrl}`),
    getAllAdmin: () => api.get(`${baseUrl}/admin`),
    getOne: (id: string) => api.get(`${baseUrl}/${id}`),
    create: (data: Partial<SiteRule>) => api.post(`${baseUrl}`, data),
    update: (id: string, data: Partial<SiteRule>) => api.put(`${baseUrl}/${id}`, data),
    delete: (id: string) => api.delete(`${baseUrl}/${id}`),
};
