import api from './api';

export interface PettyCashFund {
    id: string;
    fundCode: string;
    fundName: string;
    openingBalance: number;
    currentBalance: number;
    currency: string;
    custodian: string;
    custodianId?: string;
    description?: string;
    status: 'active' | 'inactive';
    createdById?: string;
    createdByName?: string;
    lastModifiedById?: string;
    lastModifiedByName?: string;
    createdAt: string;
    updatedAt: string;
}

export interface FundStats {
    totalFunds: number;
    totalBalance: number;
    activeFunds: number;
    inactiveFunds: number;
}

const baseUrl = '/petty-cash-funds';

export const pettyCashFundService = {
    getAll: () => api.get<PettyCashFund[]>(baseUrl),
    getOne: (id: string) => api.get<PettyCashFund>(`${baseUrl}/${id}`),
    getStats: () => api.get<FundStats>(`${baseUrl}/stats`),
    create: (data: Partial<PettyCashFund>) => api.post<PettyCashFund>(baseUrl, data),
    update: (id: string, data: Partial<PettyCashFund>) => api.put<PettyCashFund>(`${baseUrl}/${id}`, data),
    replenish: (id: string, amount: number, description?: string) =>
        api.post(`${baseUrl}/${id}/replenish`, { amount, description }),
    adjust: (id: string, amount: number, description?: string) =>
        api.post(`${baseUrl}/${id}/adjust`, { amount, description }),
    delete: (id: string) => api.delete(`${baseUrl}/${id}`),
};
