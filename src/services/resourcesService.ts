import api from './api';

export interface Resource {
    id: string;
    type: 'credential' | 'link' | 'note' | 'event';
    title: string;
    content: string;
    metadata: any;
    createdAt: string;
}

export const resourcesService = {
    getAll: async () => {
        const response = await api.get('/resources');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/resources', data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.put(`/resources/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/resources/${id}`);
        return response.data;
    }
};
