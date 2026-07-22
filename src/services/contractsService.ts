import api from './api';

export interface Contract {
    id: string;
    title: string;
    employeeId?: string;
    employeeName: string;
    department: string;
    type: 'permanent' | 'fixed_term' | 'internship' | 'contractor';
    startDate: string;
    endDate?: string;
    status: 'active' | 'expiring_soon' | 'expired' | 'draft';
    basicSalary: number;
    netSalary: number;
    paymentFrequency?: string;
    workingConditions?: string;
    fileUrl?: string;
    fileSize?: string;
    body?: string;
    footer?: string;
    createdAt: string;
}

const baseUrl = '/contracts';

export const contractsService = {
    getAll: () => api.get<Contract[]>(`${baseUrl}`),
    getOne: (id: string) => api.get<Contract>(`${baseUrl}/${id}`),
    getByEmployee: (employeeId: string) => api.get<Contract[]>(`${baseUrl}/employee/${employeeId}`),
    create: (data: Partial<Contract>) => api.post<Contract>(`${baseUrl}`, data),
    update: (id: string, data: Partial<Contract>) => api.put<Contract>(`${baseUrl}/${id}`, data),
    delete: (id: string) => api.delete(`${baseUrl}/${id}`),
};
