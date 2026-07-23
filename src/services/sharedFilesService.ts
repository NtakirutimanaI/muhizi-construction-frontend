import api from './api';

export interface SharedFile {
    id: string;
    designId: string;
    sharedBy: string;
    sharedTo: string;
    recipientName?: string;
    recipientType: 'site_engineer' | 'partner' | 'client';
    projectId?: string;
    projectName?: string;
    notes?: string;
    createdAt: string;
}

const sharedFilesService = {
    share: (data: { designId: string; sharedTo: string; recipientName?: string; recipientType: string; projectId?: string; projectName?: string; notes?: string }) =>
        api.post('/shared-files', data),
    getAll: () => api.get('/shared-files'),
    getMine: () => api.get('/shared-files/my'),
    getByDesign: (designId: string) => api.get(`/shared-files/design/${designId}`),
    remove: (id: string) => api.delete(`/shared-files/${id}`),
};

export default sharedFilesService;
