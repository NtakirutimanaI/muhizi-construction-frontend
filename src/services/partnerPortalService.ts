import api from './api';
import type { Project } from './constructionService';
import type { ProjectEvidence } from './projectEvidenceService';

const baseUrl = '/partner-portal';

export const partnerPortalService = {
    getMyProjects: () => api.get(`${baseUrl}/projects`),
    getProjectEvidence: (projectId: string) => api.get(`${baseUrl}/projects/${projectId}/evidence`),
};

export type { Project, ProjectEvidence };
