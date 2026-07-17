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
        location?: string;
        featured: boolean;
        category?: 'Backend' | 'Frontend' | 'UI/UX' | 'Fullstack' | 'Other';
        effectiveness?: number;
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
        socialLinks?: {
            twitter?: string;
            linkedin?: string;
            facebook?: string;
            instagram?: string;
        };
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
        news?: Array<{
            slug: string;
            title: string;
            date: string;
            category: string;
            summary: string;
            image: string;
            author: string;
            comments: number;
            readTime: string;
            content: string[];
        }>;
        events?: Array<{
            title: string;
            date: string;
            location: string;
            description: string;
        }>;
        aboutSection?: {
            heading?: string;
            subtitle?: string;
            cards?: Array<{ title: string; description: string }>;
            tickerText?: string;
            imageUrl?: string;
        };
        aboutStats?: Array<{
            value: number;
            suffix: string;
            label: string;
        }>;
        aboutPage?: {
            statNumber?: number;
            statSuffix?: string;
            statTitle?: string;
            statDescription?: string;
            heading?: string;
            description?: string;
            globalReachNumber?: number;
            globalReachSuffix?: string;
            globalReachCaption?: string;
        };
        commitment?: {
            anchorImage?: string;
            anchorTitle?: string;
            anchorDescription?: string;
            cards?: Array<{ title: string; description: string }>;
            imageCardImage?: string;
        };
        teamSection?: {
            brands?: Array<{ name: string; logoUrl?: string }>;
        };
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
        projectsSection?: {
            heading?: string;
            subtitle?: string;
        };
        followUs?: {
            heading?: string;
            subtitle?: string;
            youtubeUrl?: string;
            viewMoreText?: string;
            viewMoreUrl?: string;
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
            servicesList?: Array<{ label: string }>;
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

    // Get public company profile (no auth required — used by the marketing site)
    getPublicProfile: async (): Promise<Profile> => {
        const response = await api.get('/profile/public');
        return response.data;
    },

    // Update profile
    updateProfile: async (data: Partial<Profile>): Promise<Profile> => {
        const response = await api.put('/profile', data);
        return response.data;
    },

    // Mark message as read
    markMessageAsRead: async (messageId: string): Promise<ContactMessage> => {
        const response = await api.post(`/profile/messages/${messageId}/read`);
        return response.data;
    },

    // Fetch GitHub Repos
    getGithubRepos: async (username: string) => {
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
        if (!response.ok) throw new Error('Failed to fetch from GitHub');
        return response.json();
    },
};
