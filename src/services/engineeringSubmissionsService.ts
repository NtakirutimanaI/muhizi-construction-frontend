import api from './api';

export type SubmissionStatus = 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'corrections_requested';

export interface EngineeringSubmission {
    id: string;
    title: string;
    description: string;
    documentUrls: { name: string; url: string; type: string }[];
    status: SubmissionStatus;
    submittedBy: string;
    submitter?: { id: string; firstName?: string; lastName?: string; email: string };
    reviewedBy?: string;
    reviewNotes?: string;
    taskId?: string;
    submittedToAdmin?: boolean;
    submissionNotes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateEngineeringSubmissionDto {
    title: string;
    description: string;
    documentUrls?: { name: string; url: string; type: string }[];
    taskId?: string;
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
    update: (id: string, dto: Partial<CreateEngineeringSubmissionDto>) => api.put<EngineeringSubmission>(`${baseUrl}/${id}`, dto),
    updateStatus: (id: string, dto: UpdateSubmissionStatusDto) => api.put<EngineeringSubmission>(`${baseUrl}/${id}/status`, dto),
    submitToAdmin: (id: string, notes?: string) => api.put<EngineeringSubmission>(`${baseUrl}/${id}/submit-to-admin`, { notes }),
    undoSubmitToAdmin: (id: string) => api.put<EngineeringSubmission>(`${baseUrl}/${id}/undo-submit-to-admin`),
    remove: (id: string) => api.delete(`${baseUrl}/${id}`),
};
