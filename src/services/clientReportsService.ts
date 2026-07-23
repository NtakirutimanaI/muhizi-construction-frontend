import api from './api';
import type { Project } from './constructionService';

export interface ClientReportMedia {
    url: string;
    type: 'image' | 'video';
}

export interface ClientReport {
    id: string;
    title: string;
    description?: string;
    progressPercentage: number;
    status: 'draft' | 'published';
    projectId: string;
    project?: Project;
    createdById: string;
    createdBy?: { id: string; firstName?: string; lastName?: string };
    media?: ClientReportMedia[];
    createdAt: string;
    updatedAt: string;
}

const baseUrl = '/client-reports';

export const clientReportsService = {
    getAll: (status?: string) => api.get<ClientReport[]>(baseUrl, { params: status ? { status } : undefined }),
    getOne: (id: string) => api.get<ClientReport>(`${baseUrl}/${id}`),
    create: (data: { projectId: string; title: string; description?: string; progressPercentage?: number; status?: 'draft' | 'published'; media?: ClientReportMedia[] }) =>
        api.post<ClientReport>(baseUrl, data),
    update: (id: string, data: Partial<{ title: string; description: string; progressPercentage: number; status: 'draft' | 'published'; media: ClientReportMedia[] }>) =>
        api.put<ClientReport>(`${baseUrl}/${id}`, data),
    delete: (id: string) => api.delete(`${baseUrl}/${id}`),
};
