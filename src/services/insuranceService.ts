import api from './api';

export interface InsuranceSetting {
    id: string;
    provider: string;
    label: string;
    employeeAmount: number;
    employerAmount: number;
    description?: string;
    isActive: boolean;
    createdAt: string;
}

export const insuranceService = {
    getAll: () => api.get<InsuranceSetting[]>('/insurance'),
    getActive: () => api.get<InsuranceSetting[]>('/insurance/active'),
    getDeduction: () => api.get<{ totalDeduction: number }>('/insurance/deduction'),
    getOne: (id: string) => api.get<InsuranceSetting>(`/insurance/${id}`),
    create: (data: Partial<InsuranceSetting>) => api.post<InsuranceSetting>('/insurance', data),
    update: (id: string, data: Partial<InsuranceSetting>) => api.put<InsuranceSetting>(`/insurance/${id}`, data),
    delete: (id: string) => api.delete(`/insurance/${id}`),
};
