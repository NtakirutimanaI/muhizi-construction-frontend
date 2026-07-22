import api from './api';

export interface MoneyRequisition {
    id: string;
    title: string;
    description: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: string;
    requesterId?: string;
    requesterName?: string;
    reviewedById?: string;
    reviewedByName?: string;
    reviewedAt?: string;
    adminNotes?: string;
    createdAt: string;
    updatedAt: string;
}

const baseUrl = '/money-requisitions';

export const moneyRequisitionsService = {
    getAll: () => api.get<MoneyRequisition[]>(`${baseUrl}`),
    getOne: (id: string) => api.get<MoneyRequisition>(`${baseUrl}/${id}`),
    create: (data: { title: string; description: string; amount: number; requestedAt: string }) =>
        api.post<MoneyRequisition>(`${baseUrl}`, data),
    review: (id: string, data: { status: 'approved' | 'rejected'; notes?: string; modifiedAmount?: number; modificationReason?: string }) =>
        api.post<MoneyRequisition>(`${baseUrl}/${id}/review`, data),
    delete: (id: string) => api.delete(`${baseUrl}/${id}`),
};
