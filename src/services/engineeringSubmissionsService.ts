import api from './api';

export type SubmissionStatus = 'submitted' | 'reviewed' | 'approved' | 'rejected';

export interface EngineeringSubmission {
    id: string;
    title: string;
    description: string;
    documentUrls: { name: string; url: string; type: string }[];
    status: SubmissionStatus;
    submittedBy: string;
    reviewedBy?: string;
    reviewNotes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateEngineeringSubmissionDto {
    title: string;
    description: string;
    documentUrls?: { name: string; url: string; type: string }[];
}

export interface UpdateSubmissionStatusDto {
    status: SubmissionStatus;
    reviewNotes?: string;
}

const baseUrl = '/engineering-submissions';

export const engineeringSubmissionsService = {
    getAll: () => api.get<EngineeringSubmission[]>(baseUrl),
    getMy: () => api.get<EngineeringSubmission[]>(`${baseUrl}/my`),
    getOne: (id: string) => api.get<EngineeringSubmission>(`${baseUrl}/${id}`),
    create: (dto: CreateEngineeringSubmissionDto) => api.post<EngineeringSubmission>(baseUrl, dto),
    updateStatus: (id: string, dto: UpdateSubmissionStatusDto) => api.put<EngineeringSubmission>(`${baseUrl}/${id}/status`, dto),
    remove: (id: string) => api.delete(`${baseUrl}/${id}`),
};
