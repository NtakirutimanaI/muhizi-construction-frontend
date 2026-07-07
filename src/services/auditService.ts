import api from './api';

export interface AuditLog {
    id: string;
    userId?: string;
    userEmail?: string;
    userRole?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: any;
    ipAddress?: string;
    createdAt: string;
}

const baseUrl = '';

export const auditService = {
    getAll: () => api.get(`${baseUrl}/audit`),
    getStats: () => api.get(`${baseUrl}/audit/stats`),
    getByUser: (userId: string) => api.get(`${baseUrl}/audit/user/${userId}`),
};
