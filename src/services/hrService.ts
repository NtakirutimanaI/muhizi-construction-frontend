import api from './api';

export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    position?: string;
    department: string;
    hireDate?: string;
    salary: number;
    status: 'active' | 'inactive' | 'terminated';
    avatar?: string;
    address?: string;
    gender?: string;
    maritalStatus?: string;
    nationalId?: string;
    educationLevel?: string;
    emergencyContact?: string;
    documents?: { name: string; url: string }[];
    createdAt: string;
}

export interface Attendance {
    id: string;
    employeeId: string;
    employee?: Employee;
    date: string;
    projectId?: string;
    project?: { id: string; name: string; location: string };
    site?: string;
    checkIn?: string;
    checkOut?: string;
    status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' | 'permission' | 'suspended';
    notes?: string;
    createdAt: string;
}

export interface Payroll {
    id: string;
    employeeId: string;
    employee?: Employee;
    month: number;
    year: number;
    basicSalary: number;
    allowances?: { label: string; amount: number }[];
    deductions?: { label: string; amount: number }[];
    totalAllowances: number;
    totalDeductions: number;
    netSalary: number;
    status: 'draft' | 'paid' | 'pending';
    paymentDate?: string;
    paymentMethod?: string;
    notes?: string;
    createdAt: string;
}

export interface EmployedUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    gender?: string;
    maritalStatus?: string;
    nationalId?: string;
    educationLevel?: string;
    role: string;
    employmentStatus?: string;
    employmentCategory?: string;
    workShift?: string;
    basicSalary: number;
    isActive: boolean;
    profile?: {
        id: string;
        firstName?: string;
        lastName?: string;
        avatar?: string;
    };
    createdAt: string;
}

const baseUrl = '';

export const hrService = {
    // Employees
    getEmployees: () => api.get(`${baseUrl}/employees`),
    getEmployedUsers: () => api.get(`${baseUrl}/auth/users/employed`),
    getEmployee: (id: string) => api.get(`${baseUrl}/employees/${id}`),
    createEmployee: (data: Partial<Employee>) => api.post(`${baseUrl}/employees`, data),
    updateEmployee: (id: string, data: Partial<Employee>) => api.put(`${baseUrl}/employees/${id}`, data),
    deleteEmployee: (id: string) => api.delete(`${baseUrl}/employees/${id}`),

    // Attendance
    getAttendance: () => api.get(`${baseUrl}/attendance`),
    getAttendanceStats: () => api.get(`${baseUrl}/attendance/stats`),
    getAttendanceByRange: (start: string, end: string) => api.get(`${baseUrl}/attendance/range?start=${start}&end=${end}`),
    getAttendanceByEmployee: (employeeId: string) => api.get(`${baseUrl}/attendance/employee/${employeeId}`),
    getAttendanceByEmployeeMonth: (employeeId: string, year: number, month: number) => api.get(`${baseUrl}/attendance/employee/${employeeId}/month?year=${year}&month=${month}`),
    getAttendanceByProject: (projectId: string) => api.get(`${baseUrl}/attendance/project/${projectId}`),
    getAttendanceBySite: (site: string) => api.get(`${baseUrl}/attendance/site/${encodeURIComponent(site)}`),
    createAttendance: (data: Partial<Attendance>) => api.post(`${baseUrl}/attendance`, data),
    updateAttendance: (id: string, data: Partial<Attendance>) => api.put(`${baseUrl}/attendance/${id}`, data),
    deleteAttendance: (id: string) => api.delete(`${baseUrl}/attendance/${id}`),

    // Payroll
    getPayroll: () => api.get(`${baseUrl}/payroll`),
    getPayrollByPeriod: (month: number, year: number) => api.get(`${baseUrl}/payroll/period?month=${month}&year=${year}`),
    getPayrollByEmployee: (employeeId: string) => api.get(`${baseUrl}/payroll/employee/${employeeId}`),
    createPayroll: (data: Partial<Payroll>) => api.post(`${baseUrl}/payroll`, data),
    updatePayroll: (id: string, data: Partial<Payroll>) => api.put(`${baseUrl}/payroll/${id}`, data),
    deletePayroll: (id: string) => api.delete(`${baseUrl}/payroll/${id}`),
};
