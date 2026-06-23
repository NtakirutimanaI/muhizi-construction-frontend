import api from './api';

export interface ContactMessage {
    id?: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    subject?: string;
    message: string;
    status?: 'new' | 'unread' | 'read' | 'replied' | 'sent';
    createdAt?: string;
    isDeleted?: boolean;
    deletedAt?: string | null;
    senderId?: string;
    sender?: {
        id: string;
        email?: string;
        username?: string;
        profile?: { firstName?: string; lastName?: string };
    };
}

export interface Profile {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    bio: string;
    greeting: string;
    aboutMeTitle: string;
    title: string;
    type?: string;
    role?: string;
    location: string;
    phone: string;
    website: string;
    company?: string;
    companyLogo?: string;
    avatar: string;
    cvUrl: string;
    yearsOfExperience: number;
    availableForHire: boolean;
    isPublic: boolean;
    allowMessages?: boolean;
    showViews?: boolean;
    maintenanceMode?: boolean;
    preferences?: {
        enableAnimations?: boolean;
        enableNotifications?: boolean;
    };
    poweredBy?: string;
    education: Array<{
        degree: string;
        institution: string;
        location: string;
        graduationYear: number;
        description?: string;
    }>;
    about: string;
    experience: Array<{
        title: string;
        company: string;
        location: string;
        startDate: string;
        endDate?: string;
        current: boolean;
        description?: string;
        technologies: string[];
    }>;
    skills: {
        backend: string[];
        frontend: string[];
        databases: string[];
        tools: string[];
        [key: string]: string[];
    };
    projects: Array<{
        name: string;
        description: string;
        technologies: string[];
        url?: string;
        githubUrl?: string;
        imageUrl?: string;
        featured: boolean;
        category?: 'Backend' | 'Frontend' | 'UI/UX' | 'Fullstack' | 'Other';
        effectiveness?: number; // 0-100
        published?: boolean;
        type?: string;
        role?: string;
    }>;
    certifications: Array<{
        name: string;
        issuer: string;
        date: string;
        credentialUrl?: string;
        imageUrl?: string;
    }>;
    languages: Array<{
        language: string;
        proficiency: string;
    }>;
    teamMembers: Array<{
        name: string;
        role: string;
        imageUrl?: string;
    }>;
    socialLinks: {
        github?: string;
        linkedin?: string;
        twitter?: string;
        facebook?: string;
        instagram?: string;
        [key: string]: string | undefined;
    };
    pageContent?: {
        heroSlides?: Array<{
            title: string;
            body: string;
            color: string;
        }>;
        services?: {
            heading?: string;
            subtitle?: string;
            items?: Array<{
                title: string;
                description: string;
                tags: string[];
                color: string;
                images?: string[];
            }>;
        };
        events?: Array<{
            title: string;
            date: string;
            location: string;
            description: string;
        }>;
        aboutStats?: Array<{
            value: number;
            suffix: string;
            label: string;
        }>;
        mission?: { title: string; text: string; icon: string };
        vision?: { title: string; text: string; icon: string };
        philosophy?: { title: string; text: string; icon: string };
        coreValues?: Array<{
            title: string;
            text: string;
            icon: string;
        }>;
        whyChooseUs?: Array<{
            title: string;
            text: string;
            icon: string;
        }>;
        cta?: {
            title: string;
            subtitle: string;
            buttonText: string;
            buttonLink: string;
            secondaryButtonText: string;
            secondaryButtonLink: string;
        };
        followUs?: {
            heading?: string;
            subtitle?: string;
            youtubeUrl?: string;
            videos?: Array<{
                url: string;
                title: string;
                description?: string;
            }>;
        };
        faq?: {
            heading?: string;
            items?: Array<{
                question: string;
                answer: string;
            }>;
        };
        contactSection?: {
            heading?: string;
            subtitle?: string;
        };
        footer?: {
            companyDescription?: string;
            copyrightText?: string;
            quickLinks?: Array<{ label: string; url: string }>;
            showSocialLinks?: boolean;
            showContactInfo?: boolean;
        };
        showTeamSection?: boolean;
    };
    services: string[];
    createdAt: string;
    updatedAt: string;
}

export const profileService = {
    // Get public profile
    getPublicProfile: async (username?: string): Promise<Profile> => {
        const response = await api.get('/profile/public', {
            params: username ? { username } : {},
        });
        return response.data;
    },

    // Send contact message
    sendContactMessage: async (message: ContactMessage) => {
        const response = await api.post('/profile/contact', message);
        return response.data;
    },

    // Get contact messages (Admin)
    getContactMessages: async (): Promise<ContactMessage[]> => {
        const response = await api.get('/profile/messages');
        return response.data;
    },

    // Get authenticated user profile
    getMyProfile: async (): Promise<Profile> => {
        const response = await api.get('/profile');
        return response.data;
    },

    // Update profile
    updateProfile: async (data: Partial<Profile>): Promise<Profile> => {
        const response = await api.put('/profile', data);
        return response.data;
    },

    // Get admin stats
    getStats: async (): Promise<{ projects: number; skills: number; messages: number; unreadMessages: number; certifications: number; experience: number; education: number; languages: number; views: number; clients: number }> => {
        const response = await api.get('/profile/stats');
        return response.data;
    },

    // Fetch GitHub Repos
    getGithubRepos: async (username: string) => {
        // We use direct fetch here to avoid configured axios interceptors that might send our backend auth token
        // which GitHub would reject (unless we strip it).
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
        if (!response.ok) throw new Error('Failed to fetch from GitHub');
        return response.json();
    },

    markMessageAsRead: async (messageId: string): Promise<ContactMessage> => {
        const response = await api.post(`/profile/messages/${messageId}/read`);
        return response.data;
    },

    // Delete a single message
    deleteContactMessage: async (messageId: string): Promise<void> => {
        await api.delete(`/profile/messages/${messageId}`);
    },

    // Admin send message
    sendAdminMessage: async (dto: { name: string; email: string; phone?: string; company?: string; subject?: string; message: string }): Promise<ContactMessage> => {
        const response = await api.post('/profile/messages/send', dto);
        return response.data;
    },

    // Get inbox messages
    getInboxMessages: async (): Promise<ContactMessage[]> => {
        const response = await api.get('/profile/messages/inbox');
        return response.data;
    },

    // Get sent messages
    getSentMessages: async (): Promise<ContactMessage[]> => {
        const response = await api.get('/profile/messages/sent');
        return response.data;
    },

    // Get trash messages
    getTrashMessages: async (): Promise<ContactMessage[]> => {
        const response = await api.get('/profile/messages/trash');
        return response.data;
    },

    // Move message to trash (soft delete)
    trashMessage: async (messageId: string): Promise<ContactMessage> => {
        const response = await api.post(`/profile/messages/${messageId}/trash`);
        return response.data;
    },

    // Restore message from trash
    restoreMessage: async (messageId: string): Promise<ContactMessage> => {
        const response = await api.post(`/profile/messages/${messageId}/restore`);
        return response.data;
    },

    // Permanently delete message
    permanentDeleteMessage: async (messageId: string): Promise<void> => {
        await api.delete(`/profile/messages/${messageId}/permanent`);
    },

    // Delete all messages
    deleteAllMessages: async (): Promise<void> => {
        await api.delete('/profile/messages');
    },

    // ───── Visitor Methods ─────

    recordVisit: async (data?: { name?: string; email?: string; company?: string; location?: string; page?: string; referrer?: string }): Promise<void> => {
        await api.post('/profile/visit', data || {});
    },

    getVisitors: async (page = 1, limit = 20): Promise<{ visitors: any[]; total: number; page: number; limit: number }> => {
        const response = await api.get(`/profile/visitors?page=${page}&limit=${limit}`);
        return response.data;
    },

    getVisitorStats: async (): Promise<{
        total: number; last30Days: number; last7Days: number; today: number;
        companies: { company: string; count: number }[];
        locations: { location: string; count: number }[];
        pages: { page: string; count: number }[];
    }> => {
        const response = await api.get('/profile/visitors/stats');
        return response.data;
    }
};
