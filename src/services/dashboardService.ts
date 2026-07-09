import api from './api';

export interface AdminKpi {
    activeProjects: number;
    pendingApprovals: number;
    totalEmployees: number;
    mtdExpenses: number;
    mtdIncomes: number;
    stockAlerts: number;
}

export interface ManagingDirectorKpi {
    stockAlerts: number;
    pendingRequests: number;
    activeSites: number;
    recentEvidence: number;
}

export interface FinanceDirectorKpi {
    mtdIncomes: number;
    mtdExpenses: number;
    cashFlow: number;
    pendingPayments: number;
}

export interface SiteEngineerKpi {
    assignedSites: number;
    pendingRequests: number;
}

export interface EngineeringStudioKpi {
    assignedDesigns: number;
    pendingSubmissions: number;
}

export interface ClientKpi {
    totalProjects: number;
    activeProjects: number;
}

const baseUrl = '/dashboard';

export const dashboardService = {
    getAdminKpi: async (): Promise<AdminKpi> => {
        const response = await api.get(`${baseUrl}/admin`);
        return response.data;
    },
    getManagingDirectorKpi: async (): Promise<ManagingDirectorKpi> => {
        const response = await api.get(`${baseUrl}/managing-director`);
        return response.data;
    },
    getFinanceDirectorKpi: async (): Promise<FinanceDirectorKpi> => {
        const response = await api.get(`${baseUrl}/finance-director`);
        return response.data;
    },
    getSiteEngineerKpi: async (): Promise<SiteEngineerKpi> => {
        const response = await api.get(`${baseUrl}/site-engineer`);
        return response.data;
    },
    getEngineeringStudioKpi: async (): Promise<EngineeringStudioKpi> => {
        const response = await api.get(`${baseUrl}/engineering-studio`);
        return response.data;
    },
    getClientKpi: async (): Promise<ClientKpi> => {
        const response = await api.get(`${baseUrl}/client`);
        return response.data;
    },
};
