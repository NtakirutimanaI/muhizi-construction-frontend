import api from './api';

export interface EmployeeAssignment {
    id: string;
    employeeId: string;
    employee?: { id: string; firstName: string; lastName: string; email: string };
    projectId: string;
    project?: { id: string; name: string; location: string };
    siteId?: string;
    site?: { id: string; name: string; location: string };
    task?: string;
    role: 'storekeeper' | 'worker' | 'supervisor';
    startDate: string;
    endDate?: string;
    isActive: boolean;
    createdAt: string;
}

const baseUrl = '';

export const assignmentService = {
    getAll: () => api.get(`${baseUrl}/employee-assignments`),
    getMyTeam: () => api.get(`${baseUrl}/employee-assignments/my-team`),
    getOne: (id: string) => api.get(`${baseUrl}/employee-assignments/${id}`),
    getByEmployee: (employeeId: string) => api.get(`${baseUrl}/employee-assignments/employee/${employeeId}`),
    getByProject: (projectId: string) => api.get(`${baseUrl}/employee-assignments/project/${projectId}`),
    create: (data: Partial<EmployeeAssignment>) => api.post(`${baseUrl}/employee-assignments`, data),
    update: (id: string, data: Partial<EmployeeAssignment>) => api.put(`${baseUrl}/employee-assignments/${id}`, data),
    delete: (id: string) => api.delete(`${baseUrl}/employee-assignments/${id}`),
};
