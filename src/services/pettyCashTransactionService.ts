import api from './api';

export interface PettyCashTransaction {
    id: string;
    fundId: string;
    fundCode?: string;
    voucherId?: string;
    voucherNumber?: string;
    transactionType: string;
    amount: number;
    balanceBefore?: number;
    balanceAfter?: number;
    description?: string;
    reference?: string;
    performedById?: string;
    performedByName?: string;
    createdAt: string;
}

export interface TransactionStats {
    totalTransactions: number;
    byType: Record<string, number>;
}

const baseUrl = '/petty-cash-transactions';

export const pettyCashTransactionService = {
    getAll: (fundId?: string) => {
        const params = fundId ? { fundId } : {};
        return api.get<PettyCashTransaction[]>(baseUrl, { params });
    },
    getByFund: (fundId: string) => api.get<PettyCashTransaction[]>(`${baseUrl}/fund/${fundId}`),
    getStats: () => api.get<TransactionStats>(`${baseUrl}/stats`),
    create: (data: Partial<PettyCashTransaction>) => api.post<PettyCashTransaction>(baseUrl, data),
};
