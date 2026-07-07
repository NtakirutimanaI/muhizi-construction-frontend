import api from './api';

export interface Site {
    id: string;
    name: string;
    description?: string;
    location?: string;
    status: 'active' | 'inactive' | 'completed';
    startDate?: string;
    endDate?: string;
    budget?: number;
    spent?: number;
    progress: number;
    images?: string[];
    projectId: string;
    project?: { id: string; name: string };
    rules?: SiteRule[];
    activities?: SiteActivity[];
    evidence?: ProjectEvidence[];
    createdAt: string;
    updatedAt: string;
}

export interface SiteRule {
    id: string;
    title: string;
    iconName: string;
    pinColor: string;
    items: string[];
    order: number;
    isActive: boolean;
    siteId?: string;
    createdAt: string;
}

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

export interface ProjectEvidence {
    id: string;
    project: string;
    siteId?: string;
    type: 'image' | 'video';
    title: string;
    url: string;
    date: string;
    notes: string;
    approvedForClient?: boolean;
    createdAt: string;
}

export interface Approval {
    id: string;
    title: string;
    requester: string;
    amount: number | null;
    items: { name: string; qty: number; unit: string }[] | null;
    status: 'pending' | 'approved' | 'rejected';
    date: string;
}

export interface Contract {
    id: string;
    title: string;
    employee: string;
    type: string;
    period: string;
    status: string;
}

const baseUrl = '/sites';

export const sitesService = {
    getAll: () => api.get(`${baseUrl}`),
    getByProject: (projectId: string) => api.get(`${baseUrl}/project/${projectId}`),
    getOne: (id: string) => api.get(`${baseUrl}/${id}`),
    create: (data: Partial<Site>) => api.post(`${baseUrl}`, data),
    update: (id: string, data: Partial<Site>) => api.put(`${baseUrl}/${id}`, data),
    delete: (id: string) => api.delete(`${baseUrl}/${id}`),
};
