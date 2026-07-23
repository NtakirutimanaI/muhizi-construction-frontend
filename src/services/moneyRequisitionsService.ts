import api from './api';

export interface MoneyRequisition {
    id: string;
    title: string;
    description: string;
    amount: number;
    status: 'draft' | 'pending' | 'approved' | 'rejected';
    requestedAt: string;
    requesterId?: string;
    requesterName?: string;
    reviewedById?: string;
    reviewedByName?: string;
    reviewedAt?: string;
    adminNotes?: string;
    department?: string;
    reason?: string;
    requestedDisbursementDate?: string;
    requesterSignature?: string;
    authorizationStatus?: string;
    authorizedByName?: string;
    authorizedByPosition?: string;
    authorizedBySignature?: string;
    authorizationDate?: string;
    stampUrl?: string;
    createdAt: string;
    updatedAt: string;
}

const baseUrl = '/money-requisitions';

export const moneyRequisitionsService = {
    getAll: () => api.get<MoneyRequisition[]>(`${baseUrl}`),
    getOne: (id: string) => api.get<MoneyRequisition>(`${baseUrl}/${id}`),
    create: (data: { title: string; description: string; amount: number; requestedAt: string; department?: string; reason?: string; requestedDisbursementDate?: string; status?: 'draft' | 'pending'; requesterSignature?: string }) =>
        api.post<MoneyRequisition>(`${baseUrl}`, data),
    submit: (id: string) => api.post<MoneyRequisition>(`${baseUrl}/${id}/submit`),
    review: (id: string, data: { status: 'approved' | 'rejected'; notes?: string; modifiedAmount?: number; modificationReason?: string; authorizedByName?: string; authorizedByPosition?: string; authorizedBySignature?: string; authorizationDate?: string; stampUrl?: string }) =>
        api.post<MoneyRequisition>(`${baseUrl}/${id}/review`, data),
    update: (id: string, data: { title?: string; description?: string; amount?: number; requestedAt?: string; department?: string; reason?: string; requestedDisbursementDate?: string }) =>
        api.patch<MoneyRequisition>(`${baseUrl}/${id}`, data),
    delete: (id: string) => api.delete(`${baseUrl}/${id}`),
};
