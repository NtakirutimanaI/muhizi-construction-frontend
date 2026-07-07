import api from './api';

export interface ChatMessage {
    id: string;
    content: string;
    sender: 'user' | 'bot' | 'admin';
    createdAt: string;
    isRead: boolean;
}

export interface ChatConversation {
    id: string;
    sessionId: string;
    email?: string;
    location?: string;
    ipAddress?: string;
    device?: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
}

export const chatService = {
    // Public: Send Message
    sendMessage: async (sessionId: string, content: string, metadata?: { email?: string, location?: string, ipAddress?: string, device?: string }) => {
        const response = await api.post('/chat/message', { sessionId, content, ...metadata });
        return response.data; // { userMessage, botMessage }
    },

    // Public: Get History
    getHistory: async (sessionId: string) => {
        const response = await api.get(`/chat/history/${sessionId}`);
        return response.data; // Conversation object with messages
    },

    // Admin: Get All Conversations
    getAllConversations: async () => {
        const response = await api.get('/chat/admin/conversations');
        return response.data;
    },

    // Admin: Delete Conversation
    deleteConversation: async (id: string) => {
        const response = await api.delete(`/chat/admin/conversations/${id}`);
        return response.data;
    }
};
