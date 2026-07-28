import api from './api';

export interface Stock {
    id: string;
    item: string;
    category: string;
    type: 'in' | 'out';
    quantity: number;
    unit: string;
    unitPrice: number;
    totalCost: number;
    date: string;
    reference: string;
    notes: string;
    evidenceUrls?: string[];
    createdById?: string;
    createdByName?: string;
    createdAt: string;
}

export interface StockBalance {
    item: string;
    category: string;
    unit: string;
    balance: number;
    totalIn: number;
    totalOut: number;
}

const baseUrl = '/stock';

export const stockService = {
    getAll: () => api.get(`${baseUrl}`),
    getOne: (id: string) => api.get(`${baseUrl}/${id}`),
    getStats: () => api.get(`${baseUrl}/stats`),
    getBalance: () => api.get(`${baseUrl}/balance`),
    create: (data: Partial<Stock>) => api.post(`${baseUrl}`, data),
    update: (id: string, data: Partial<Stock>) => api.put(`${baseUrl}/${id}`, data),
    delete: (id: string) => api.delete(`${baseUrl}/${id}`),
};
