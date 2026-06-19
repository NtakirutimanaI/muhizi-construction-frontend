import api from './api';

export interface Notification {
    id: string;
    type: 'profile_update' | 'welcome' | 'password_reset' | 'account_activity' | 'system';
    title: string;
    message: string;
    status: 'pending' | 'sent' | 'failed';
    isRead: boolean;
    metadata?: Record<string, any>;
    createdAt: string;
    sentAt?: string;
}

export const notificationService = {
    getAll: async (): Promise<Notification[]> => {
        const response = await api.get('/notifications');
        return response.data;
    },

    getUnread: async (): Promise<Notification[]> => {
        const response = await api.get('/notifications/unread');
        return response.data;
    },

    markAsRead: async (id: string): Promise<Notification> => {
        const response = await api.patch(`/notifications/${id}/read`);
        return response.data;
    },

    markAllAsRead: async (): Promise<void> => {
        await api.patch('/notifications/read-all');
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/notifications/${id}`);
    }
};
