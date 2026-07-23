import api from './api';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
    id: string;
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    assignedTo: string;
    assignedToName: string;
    assignedBy: string;
    assignedByName: string;
    dueDate: string;
    notes: string;
    completionNotes: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskDto {
    title: string;
    description: string;
    priority?: TaskPriority;
    assignedTo: string;
    assignedToName: string;
    dueDate?: string;
    notes?: string;
}

export interface UpdateTaskDto {
    status?: TaskStatus;
    completionNotes?: string;
}

export interface EditTaskDto {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    assignedTo?: string;
    assignedToName?: string;
    dueDate?: string;
    notes?: string;
}

const baseUrl = '/tasks';

export const tasksService = {
    getAll: () => api.get<Task[]>(baseUrl),
    getMy: () => api.get<Task[]>(`${baseUrl}/my`),
    getOne: (id: string) => api.get<Task>(`${baseUrl}/${id}`),
    getTeamMembers: () => api.get<any[]>(`${baseUrl}/team-members`),
    create: (dto: CreateTaskDto) => api.post<Task>(baseUrl, dto),
    updateStatus: (id: string, dto: UpdateTaskDto) => api.put<Task>(`${baseUrl}/${id}/status`, dto),
    update: (id: string, dto: EditTaskDto) => api.put<Task>(`${baseUrl}/${id}`, dto),
    remove: (id: string) => api.delete(`${baseUrl}/${id}`),
    clearAll: () => api.delete(`${baseUrl}/clear-all`),
};
