import api from './api';

export interface ProjectEffectivenessResult {
    effectiveness_score: number;
    confidence: string;
    suggestions: string[];
}

export interface VisitorTrendResult {
    trend: 'up' | 'down' | 'stable';
    growth_rate: number;
    forecast: number[];
    confidence: string;
}

export interface LeadScoreResult {
    lead_score: number;
    priority: 'high' | 'medium' | 'low';
    reasons: string[];
}

export interface MessageClassification {
    category: string;
    confidence: number;
    label: string;
}

export const mlService = {
    predictProjectEffectiveness: async (projectData: {
        name?: string;
        description?: string;
        technologies?: string[];
        category?: string;
        hasUrl?: boolean;
        hasGithub?: boolean;
        isFeatured?: boolean;
        teamSize?: number;
        budget?: number;
        timeline?: number;
    }): Promise<ProjectEffectivenessResult> => {
        try {
            const response = await api.post('/ml/project-effectiveness', projectData);
            return response.data;
        } catch {
            return {
                effectiveness_score: 50,
                confidence: 'low',
                suggestions: ['ML service unavailable. Using default score.']
            };
        }
    },

    forecastVisitorTrend: async (historicalCounts: number[]): Promise<VisitorTrendResult> => {
        try {
            const response = await api.post('/ml/visitor-trend', { historical_counts: historicalCounts });
            return response.data;
        } catch {
            const avg = historicalCounts.length > 0
                ? historicalCounts.reduce((a, b) => a + b, 0) / historicalCounts.length
                : 0;
            return {
                trend: 'stable',
                growth_rate: 0,
                forecast: [avg, avg, avg],
                confidence: 'low'
            };
        }
    },

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

    classifyMessage: async (message: string): Promise<MessageClassification> => {
        try {
            const response = await api.post('/ml/classify-message', { message });
            return response.data;
        } catch {
            return {
                category: 'general',
                confidence: 0,
                label: 'Could not classify (ML service unavailable)'
            };
        }
    }
};
