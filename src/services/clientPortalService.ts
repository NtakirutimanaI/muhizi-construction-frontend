import api from './api';
import type { Project } from './constructionService';
import type { ProjectEvidence } from './projectEvidenceService';

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
    createdAt: string;
    updatedAt: string;
}

export interface ClientProjectProgress {
    project: Project;
    evidenceCount: number;
    reports: ClientReport[];
}

const baseUrl = '/client';

export const clientPortalService = {
    getMyProjects: () => api.get(`${baseUrl}/projects`),
    getProjectProgress: (projectId: string) => api.get(`${baseUrl}/projects/${projectId}/progress`),
    getProjectEvidence: (projectId: string) => api.get(`${baseUrl}/projects/${projectId}/evidence`),
    getMyReports: () => api.get(`${baseUrl}/reports`),
};

export type { Project, ProjectEvidence };
