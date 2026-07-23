import api from './api';

export interface Update {
    id: string;
    title: string;
    slug: string;
    summary: string;
    content: string;
    image: string;
    category: string;
    author: string;
    readTime: string;
    comments: number;
    isPublished: boolean;
    publishedAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUpdateDto {
    title: string;
    slug?: string;
    summary?: string;
    content?: string;
    image?: string;
    category?: string;
    author?: string;
    readTime?: string;
    comments?: number;
    isPublished?: boolean;
}

const BASE = '/updates';

export const updatesService = {
    async getPublished(): Promise<Update[]> {
        const res = await api.get(`${BASE}/published`);
        return res.data;
    },

    async getAll(): Promise<Update[]> {
        const res = await api.get(BASE);
        return res.data;
    },

    async getOne(id: string): Promise<Update> {
        const res = await api.get(`${BASE}/${id}`);
        return res.data;
    },

    async getBySlug(slug: string): Promise<Update> {
        const res = await api.get(`${BASE}/slug/${slug}`);
        return res.data;
    },

    async create(dto: CreateUpdateDto): Promise<Update> {
        const res = await api.post(BASE, dto);
        return res.data;
    },

    async update(id: string, dto: Partial<CreateUpdateDto>): Promise<Update> {
        const res = await api.put(`${BASE}/${id}`, dto);
        return res.data;
    },

    async remove(id: string): Promise<void> {
        await api.delete(`${BASE}/${id}`);
    },
};
