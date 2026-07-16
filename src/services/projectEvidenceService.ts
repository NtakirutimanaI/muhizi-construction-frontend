import api from './api';

export interface ProjectEvidence {
    id: string;
    project: string;
    type: 'image' | 'video';
    title: string;
    url: string;
    date: string;
    notes: string;
    approvedForClient?: boolean;
    siteId?: string;
}

const baseUrl = '/project-evidence';

export const projectEvidenceService = {
    getAll: () => api.get(`${baseUrl}`),
    getOne: (id: string) => api.get(`${baseUrl}/${id}`),
    create: (data: Partial<ProjectEvidence>) => api.post(`${baseUrl}`, data),
    update: (id: string, data: Partial<ProjectEvidence>) => api.put(`${baseUrl}/${id}`, data),
    delete: (id: string) => api.delete(`${baseUrl}/${id}`),
    getClientVisible: () => api.get(`${baseUrl}?clientVisible=true`),
};
