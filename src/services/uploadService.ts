import api from './api';

export interface UploadedFile {
    id: string;
    publicId: string;
    url: string;
    secureUrl: string;
    format: string;
    resourceType: string;
    originalFilename: string;
    bytes: number;
    width: number | null;
    height: number | null;
    createdAt: string;
}

export const uploadService = {
    uploadFile: async (file: File): Promise<UploadedFile> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/upload', formData);
        return response.data;
    },

    uploadFiles: async (files: File[]): Promise<UploadedFile[]> => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        const response = await api.post('/upload/multiple', formData);
        return response.data;
    },

    getAllFiles: async (): Promise<UploadedFile[]> => {
        const response = await api.get('/upload/files');
        return response.data;
    },

    deleteFile: async (id: string): Promise<void> => {
        await api.delete(`/upload/${id}`);
    },
};
