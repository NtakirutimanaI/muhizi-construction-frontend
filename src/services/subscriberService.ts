import api from './api';

export interface Subscriber {
    id: string;
    email: string;
    isActive: boolean;
    source: string;
    mlScore: number;
    mlCategory: string;
    subscribedAt: string;
    updatedAt: string;
}

export interface CreateSubscriberDto {
    email: string;
    source?: string;
}

export interface SendUpdateDto {
    subject: string;
    message: string;
    html?: string;
}

const BASE = '/subscribers';

export const subscriberService = {
    async subscribe(dto: CreateSubscriberDto): Promise<Subscriber> {
        const res = await api.post(BASE, dto);
        return res.data;
    },

    async getAll(): Promise<Subscriber[]> {
        const res = await api.get(BASE);
        return res.data;
    },

    async getOne(id: string): Promise<Subscriber> {
        const res = await api.get(`${BASE}/${id}`);
        return res.data;
    },

    async update(id: string, dto: Partial<Pick<Subscriber, 'isActive' | 'mlScore' | 'mlCategory'>>): Promise<Subscriber> {
        const res = await api.patch(`${BASE}/${id}`, dto);
        return res.data;
    },

    async remove(id: string): Promise<void> {
        await api.delete(`${BASE}/${id}`);
    },

    async sendUpdate(dto: SendUpdateDto): Promise<{ sent: number; total: number }> {
        const res = await api.post(`${BASE}/send-update`, dto);
        return res.data;
    },
};
