import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { notificationService, type Notification } from '../services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextProps {
    notifications: Notification[];
    unreadCount: number;
    showNotifications: boolean;
    setShowNotifications: (show: boolean) => void;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    toggleNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

const typeLabels: Record<string, string> = {
    system: 'System',
    account_activity: 'Messages',
    profile_update: 'Profile',
    welcome: 'Welcome',
    password_reset: 'Password',
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('all');

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getAll();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await notificationService.delete(id);
            const wasUnread = notifications.find(n => n.id === id && !n.isRead);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to delete notification', error);
        }
    };

    const toggleNotifications = () => setShowNotifications(prev => !prev);

    const uniqueTypes = useMemo(() => {
        const types = new Set(notifications.map(n => n.type));
        return ['all', ...Array.from(types)];
    }, [notifications]);

    const filtered = useMemo(() => {
        if (activeTab === 'all') return notifications;
        return notifications.filter(n => n.type === activeTab);
    }, [notifications, activeTab]);

    // Initial load and polling every minute
    useEffect(() => {
        if (!isAuthenticated) return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                showNotifications,
                setShowNotifications,
                fetchNotifications,
                markAsRead,
                markAllAsRead,
                deleteNotification,
                toggleNotifications,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
};

export type { NotificationContextProps };
export { typeLabels, typeLabels as NOTIFICATION_TYPE_LABELS };
