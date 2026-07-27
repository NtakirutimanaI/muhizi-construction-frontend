import api from './api';

export interface PettyCashRecord {
    id: string;
    description: string;
    amount: number;
    type: 'in' | 'out';
    date: string;
    receivedFrom?: string;
    paidTo?: string;
    reference?: string;
    notes?: string;
    recordedById?: string;
    recordedByName?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PettyCashBalance {
    totalIn: number;
    totalOut: number;
    balance: number;
}

const baseUrl = '/petty-cash';

export const pettyCashService = {
    getAll: () => api.get<PettyCashRecord[]>(baseUrl),
    getOne: (id: string) => api.get<PettyCashRecord>(`${baseUrl}/${id}`),
    getBalance: () => api.get<PettyCashBalance>(`${baseUrl}/balance`),
    create: (data: { description: string; amount: number; type: 'in' | 'out'; date: string; receivedFrom?: string; paidTo?: string; reference?: string; notes?: string }) =>
        api.post<PettyCashRecord>(baseUrl, data),
    update: (id: string, data: { description?: string; amount?: number; type?: 'in' | 'out'; date?: string; receivedFrom?: string; paidTo?: string; reference?: string; notes?: string }) =>
        api.put<PettyCashRecord>(`${baseUrl}/${id}`, data),
    delete: (id: string) => api.delete(`${baseUrl}/${id}`),
};
