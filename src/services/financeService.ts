import api from './api';

export interface Income {
    id: string;
    description: string;
    amount: number;
    category: 'project_payment' | 'rental' | 'investment' | 'consulting' | 'other';
    source?: string;
    projectId?: string;
    project?: { id: string; name: string };
    date: string;
    paymentMethod?: string;
    reference?: string;
    notes?: string;
    items?: { description: string; amount: number }[];
    recordedById?: string;
    recordedByName?: string;
    createdAt: string;
}

export interface Expense {
    id: string;
    description: string;
    amount: number;
    category: 'materials' | 'labor' | 'equipment' | 'transport' | 'utilities' | 'rent' | 'salary' | 'marketing' | 'other';
    projectId?: string;
    project?: { id: string; name: string };
    date: string;
    paymentMethod?: string;
    receipt?: string;
    vendor?: string;
    notes?: string;
    items?: { description: string; amount: number }[];
    recordedById?: string;
    recordedByName?: string;
    createdAt: string;
}

export interface ReportTransaction {
    id: string;
    type: 'income' | 'expense';
    description: string;
    category: string;
    amount: number;
    date: string;
    party: string | null;
    recordedByName: string | null;
}

export interface MonthlyReport {
    year: number;
    month: number;
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    incomeCount: number;
    expenseCount: number;
    incomeByCategory: Record<string, number>;
    expenseByCategory: Record<string, number>;
    transactions: ReportTransaction[];
}

export interface YearlyReport {
    year: number;
    totalIncome: number;
    totalExpense: number;
    transactions: ReportTransaction[];
    netProfit: number;
    monthlyData: { month: number; income: number; expense: number }[];
}

const baseUrl = '';

export const financeService = {
    // Incomes
    getIncomes: () => api.get(`${baseUrl}/incomes`),
    getIncome: (id: string) => api.get(`${baseUrl}/incomes/${id}`),
    getIncomeTotal: () => api.get(`${baseUrl}/incomes/total`),
    getIncomesByRange: (start: string, end: string) => api.get(`${baseUrl}/incomes/range?start=${start}&end=${end}`),
    createIncome: (data: Partial<Income>) => api.post(`${baseUrl}/incomes`, data),
    updateIncome: (id: string, data: Partial<Income>) => api.put(`${baseUrl}/incomes/${id}`, data),

    // Expenses
    getExpenses: () => api.get(`${baseUrl}/expenses`),
    getExpense: (id: string) => api.get(`${baseUrl}/expenses/${id}`),
    getExpenseTotal: () => api.get(`${baseUrl}/expenses/total`),
    getExpensesByRange: (start: string, end: string) => api.get(`${baseUrl}/expenses/range?start=${start}&end=${end}`),
    createExpense: (data: Partial<Expense>) => api.post(`${baseUrl}/expenses`, data),
    updateExpense: (id: string, data: Partial<Expense>) => api.put(`${baseUrl}/expenses/${id}`, data),

    // Reports
    getMonthlyReport: (year: number, month: number) => api.get(`${baseUrl}/reports/monthly/${year}/${month}`),
    getYearlyReport: (year: number) => api.get(`${baseUrl}/reports/yearly/${year}`),
};
