import api from './api';

export interface Permission {
    id: string;
    role: string;
    resource: string;
    action: string;
    allowed: boolean;
    isActive: boolean;
}

const baseUrl = '/permissions';

export const permissionsService = {
    getAll: () => api.get<Permission[]>(`${baseUrl}`),
    getByRole: (role: string) => api.get<Permission[]>(`${baseUrl}/${role}`),
    /** Replaces every granted permission for a role with this "resource:action" list. */
    updateByRole: (role: string, permissions: string[]) => api.put(`${baseUrl}/${role}`, permissions),
};
