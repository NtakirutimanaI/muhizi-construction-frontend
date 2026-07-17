import api from './api';

export interface DailyReport {
    id: string;
    date: string;
    summary: string;
    submittedById: string;
    submittedByName: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateDailyReportDto {
    date?: string;
    summary: string;
}

const baseUrl = '/daily-reports';

export const dailyReportsService = {
    getAll: () => api.get<DailyReport[]>(baseUrl),
    getMy: () => api.get<DailyReport[]>(`${baseUrl}/my`),
    create: (dto: CreateDailyReportDto) => api.post<DailyReport>(baseUrl, dto),
    remove: (id: string) => api.delete(`${baseUrl}/${id}`),
};
