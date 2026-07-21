import api from './api';

export interface Project {
    id: string;
    name: string;
    description?: string;
    type: 'construction' | 'renovation';
    status: 'planning' | 'in_progress' | 'completed' | 'cancelled';
    startDate?: string;
    endDate?: string;
    budget?: number;
    spent?: number;
    location?: string;
    clientName?: string;
    clientContact?: string;
    clientUserId?: string;
    partnerUserId?: string;
    progress: number;
    images?: string[];
    documents?: { name: string; url: string }[];
    milestones?: { title: string; date: string; completed: boolean }[];
    sites?: { id: string; name: string; progress: number; status: string; location?: string }[];
    createdAt: string;
    updatedAt: string;
}

export interface Design {
    id: string;
    title: string;
    description?: string;
    type: 'architectural' | 'structural' | 'interior' | 'landscape';
    status: 'draft' | 'approved' | 'rejected';
    fileUrl?: string;
    thumbnailUrl?: string;
    projectId?: string;
    project?: Project;
    metadata?: { architect?: string; scale?: string; version?: string; dimensions?: string };
    createdAt: string;
}

export interface Partnership {
    id: string;
    entityKind: 'company' | 'individual';
    companyName: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    registrationNumber?: string;
    taxId?: string;
    partnershipType: 'supplier' | 'subcontractor' | 'investor' | 'joint_venture' | 'other';
    otherTypeDescription?: string;
    status: 'pending' | 'active' | 'inactive' | 'rejected';
    licenseNumber?: string;
    licenseExpiry?: string;
    insuranceExpiry?: string;
    investmentAmount?: number;
    equityPercentage?: number;
    projectId?: string;
    project?: { id: string; name: string };
    agreementFile?: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
    reviewedById?: string;
    reviewedByName?: string;
    reviewedAt?: string;
    createdAt: string;
}

const baseUrl = '';

export const constructionService = {
    // Projects
    getProjects: () => api.get(`${baseUrl}/projects`),
    getProject: (id: string) => api.get(`${baseUrl}/projects/${id}`),
    createProject: (data: Partial<Project>) => api.post(`${baseUrl}/projects`, data),
    updateProject: (id: string, data: Partial<Project>) => api.put(`${baseUrl}/projects/${id}`, data),
    deleteProject: (id: string) => api.delete(`${baseUrl}/projects/${id}`),

    // Designs
    getDesigns: () => api.get(`${baseUrl}/designs`),
    getDesign: (id: string) => api.get(`${baseUrl}/designs/${id}`),
    createDesign: (data: Partial<Design>) => api.post(`${baseUrl}/designs`, data),
    updateDesign: (id: string, data: Partial<Design>) => api.put(`${baseUrl}/designs/${id}`, data),
    deleteDesign: (id: string) => api.delete(`${baseUrl}/designs/${id}`),

    // Partnerships
    getPartnerships: () => api.get(`${baseUrl}/partnerships`),
    getPartnership: (id: string) => api.get(`${baseUrl}/partnerships/${id}`),
    createPartnership: (data: Partial<Partnership>) => api.post(`${baseUrl}/partnerships`, data),
    updatePartnership: (id: string, data: Partial<Partnership>) => api.put(`${baseUrl}/partnerships/${id}`, data),
    deletePartnership: (id: string) => api.delete(`${baseUrl}/partnerships/${id}`),
};
