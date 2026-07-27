import api from './api';

export interface LineItem {
    id: string;
    description: string;
    expenseCategory: string;
    debit: number;
    credit: number;
    quantity: number;
    unitCost: number;
}

export interface SupportingDoc {
    id: string;
    name: string;
    type: string;
    url: string;
}

export interface TransactionLine {
    id: string;
    date: string;
    description: string;
    debit: number;
    credit: number;
}

export interface PettyCashVoucher {
    id: string;
    voucherNumber: string;
    date: string;
    reference?: string;
    status: 'draft' | 'pending' | 'approved' | 'paid' | 'closed' | 'rejected';
    payeeName: string;
    employeeId?: string;
    department?: string;
    position?: string;
    payeePhone?: string;
    payeeEmail?: string;
    amount: number;
    currency: string;
    paymentPurpose: string;
    paymentMethod?: string;
    paymentDate?: string;
    cashFundAccount?: string;
    description?: string;
    fundId?: string;
    fundName?: string;
    lineItems?: LineItem[];
    expenseCategory?: string;
    transactions?: TransactionLine[];
    requestedByName?: string;
    requestedBySignature?: string;
    requestedDate?: string;
    approvedByName?: string;
    approvedBySignature?: string;
    approvedDate?: string;
    rejectionReason?: string;
    confirmedByName?: string;
    confirmedDate?: string;
    paymentConfirmationNotes?: string;
    checkedByName?: string;
    checkedBySignature?: string;
    checkedDate?: string;
    paidByName?: string;
    paidBySignature?: string;
    paidDate?: string;
    receivedByName?: string;
    receivedBySignature?: string;
    receivedDate?: string;
    supportingDocs?: SupportingDoc[];
    receiptUrl?: string;
    notes?: string;
    transactionType?: string;
    createdById?: string;
    createdByName?: string;
    lastModifiedById?: string;
    lastModifiedByName?: string;
    softwareVersion?: string;
    createdAt: string;
    updatedAt: string;
}

export interface VoucherStats {
    total: number;
    totalAmount: number;
    draft: number;
    pending: number;
    approved: number;
    paid: number;
    closed: number;
    rejected: number;
}

const baseUrl = '/petty-cash-vouchers';

type CreatePayload = {
    date: string;
    reference?: string;
    payeeName: string;
    employeeId?: string;
    department?: string;
    position?: string;
    payeePhone?: string;
    payeeEmail?: string;
    amount: number;
    currency?: string;
    paymentPurpose: string;
    paymentMethod?: string;
    paymentDate?: string;
    cashFundAccount?: string;
    description?: string;
    fundId?: string;
    fundName?: string;
    lineItems?: LineItem[];
    expenseCategory?: string;
    transactions?: TransactionLine[];
    requestedByName?: string;
    requestedBySignature?: string;
    requestedDate?: string;
    checkedByName?: string;
    checkedBySignature?: string;
    checkedDate?: string;
    paidByName?: string;
    paidBySignature?: string;
    paidDate?: string;
    receivedByName?: string;
    receivedBySignature?: string;
    receivedDate?: string;
    supportingDocs?: SupportingDoc[];
    receiptUrl?: string;
    notes?: string;
    transactionType?: string;
    softwareVersion?: string;
};

export const pettyCashVoucherService = {
    getAll: () => api.get<PettyCashVoucher[]>(baseUrl),
    getOne: (id: string) => api.get<PettyCashVoucher>(`${baseUrl}/${id}`),
    getStats: () => api.get<VoucherStats>(`${baseUrl}/stats`),
    create: (data: CreatePayload) => api.post<PettyCashVoucher>(baseUrl, data),
    update: (id: string, data: Partial<CreatePayload>) =>
        api.put<PettyCashVoucher>(`${baseUrl}/${id}`, data),
    submit: (id: string) => api.post<PettyCashVoucher>(`${baseUrl}/${id}/submit`, {}),
    approve: (id: string) => api.post<PettyCashVoucher>(`${baseUrl}/${id}/approve`, {}),
    reject: (id: string, reason?: string) => api.post<PettyCashVoucher>(`${baseUrl}/${id}/reject`, { reason }),
    markPaid: (id: string, notes?: string) => api.post<PettyCashVoucher>(`${baseUrl}/${id}/pay`, { notes }),
    close: (id: string) => api.post<PettyCashVoucher>(`${baseUrl}/${id}/close`, {}),
    delete: (id: string) => api.delete(`${baseUrl}/${id}`),
};
