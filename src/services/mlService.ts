import api from './api';

export interface LeadScoreResult {
    lead_score: number;
    priority: 'high' | 'medium' | 'low';
    reasons: string[];
}

export const mlService = {
    scoreLead: async (contactData: {
        name?: string;
        email?: string;
        phone?: string;
        company?: string;
        subject?: string;
        message?: string;
    }): Promise<LeadScoreResult> => {
        try {
            const response = await api.post('/ml/lead-score', contactData);
            return response.data;
        } catch {
            const lead_score = Math.min(100, (contactData.name?.length || 0) * 5);
            return {
                lead_score,
                priority: lead_score >= 70 ? 'high' : lead_score >= 40 ? 'medium' : 'low',
                reasons: ['Score computed client-side (ML service unavailable)']
            };
        }
    },
};
