import axios from 'axios';
import api from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://muhizi-construction-backend.vercel.app';

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
    uploadFile: async (file: File, onProgress?: (pct: number) => void): Promise<UploadedFile> => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const token = localStorage.getItem('accessToken');
            const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 600000,
                onUploadProgress: (e) => {
                    if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
                },
            });
            return response.data;
        } catch (err) {
            console.warn('FormData upload failed, trying base64 upload...', err);
            try {
                return await uploadService.uploadBase64(file);
            } catch (base64Err) {
                console.warn('Base64 upload failed, creating local Data URL fallback...', base64Err);
                const dataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                return {
                    id: 'local_' + Date.now(),
                    publicId: 'local_' + Date.now(),
                    url: dataUrl,
                    secureUrl: dataUrl,
                    format: file.type.split('/')[1] || 'jpeg',
                    resourceType: 'image',
                    originalFilename: file.name,
                    bytes: file.size,
                    width: null,
                    height: null,
                    createdAt: new Date().toISOString(),
                };
            }
        }
    },

    uploadBase64: async (file: File): Promise<UploadedFile> => {
        const token = localStorage.getItem('accessToken');
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                const comma = result.indexOf(',');
                resolve(comma >= 0 ? result.substring(comma + 1) : result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        const response = await axios.post(`${API_BASE_URL}/upload/base64`, {
            filename: file.name,
            mimeType: file.type,
            data: base64,
        }, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 600000,
        });
        return response.data;
    },

    uploadFiles: async (files: File[]): Promise<UploadedFile[]> => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        const token = localStorage.getItem('accessToken');
        const response = await axios.post(`${API_BASE_URL}/upload/multiple`, formData, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 600000,
        });
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
