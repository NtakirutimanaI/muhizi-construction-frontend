import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCommentDots, FaTimes, FaPaperPlane, FaRobot, FaUser, FaPlus, FaHistory, FaTrash, FaEnvelope } from 'react-icons/fa';
import { chatService, type ChatMessage } from '../services/chatService';

interface StoredSession {
    id: string;
    date: string;
    preview: string;
}

interface UserMetadata {
    ip?: string;
    location?: string;
    device?: string;
    email?: string;
}

const ChatWidget = () => {
    // UI State
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'chat' | 'history' | 'settings'>('chat');

    // Chat State
    const [sessionId, setSessionId] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    // Metadata State
    const [metadata, setMetadata] = useState<UserMetadata>({});
    const [userEmail, setUserEmail] = useState('');

    // History State
    const [sessions, setSessions] = useState<StoredSession[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Init & Load Sessions
    useEffect(() => {
        const stored = localStorage.getItem('chat_history_sessions');
        if (stored) {
            setSessions(JSON.parse(stored));
        }

        let currentSid = localStorage.getItem('chatSessionId');
        if (!currentSid) {
            startNewChat(false);
        } else {
            setSessionId(currentSid);
            loadConversation(currentSid);
        }

        // Capture Metadata
        captureMetadata();
    }, []);

    // Load Email from local storage if exists
    useEffect(() => {
        const storedEmail = localStorage.getItem('chatUserEmail');
        if (storedEmail) {
            setUserEmail(storedEmail);
            setMetadata(prev => ({ ...prev, email: storedEmail }));
        }
    }, []);

    const captureMetadata = async () => {
        const device = navigator.userAgent;
        let ip = '';
        let location = '';

        try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            if (data.ip) ip = data.ip;
            if (data.city && data.country_name) location = `${data.city}, ${data.country_name}`;
        } catch (e) {
            console.warn("Could not fetch location data, using defaults");
        }

        setMetadata(prev => ({
            ...prev,
            device,
            ip,
            location
        }));
    };

    const handleSaveEmail = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('chatUserEmail', userEmail);
        setMetadata(prev => ({ ...prev, email: userEmail }));
        setView('chat');
    };

    // Auto-scroll
    useEffect(() => {
        if (view === 'chat') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, view, isOpen]);

    const startNewChat = (saveCurrent = true) => {
        if (saveCurrent && sessionId && messages.length > 1) {
            saveCurrentSession();
        }

        const newId = 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem('chatSessionId', newId);
        setSessionId(newId);
        setMessages([{
            id: 'init',
            content: "Hi there! I'm MIS virtual assistant. I can check projects, skills, or general info for you. How can I help?",
            sender: 'bot',
            createdAt: new Date().toISOString(),
            isRead: true
        }]);
        setView('chat');
    };

    const saveCurrentSession = () => {
        if (!sessionId || messages.length <= 1) return;

        const lastMsg = messages[messages.length - 1].content.substring(0, 30) + '...';
        const newSessionObj: StoredSession = {
            id: sessionId,
            date: new Date().toLocaleDateString(),
            preview: lastMsg
        };

        // Check if already exists, update it, else add
        const existingIdx = sessions.findIndex(s => s.id === sessionId);
        let newSessions = [...sessions];
        if (existingIdx >= 0) {
            newSessions[existingIdx] = newSessionObj;
        } else {
            newSessions = [newSessionObj, ...sessions];
        }

        setSessions(newSessions);
        localStorage.setItem('chat_history_sessions', JSON.stringify(newSessions));
    };

    const loadConversation = async (sid: string) => {
        try {
            setLoading(true);
            const conv = await chatService.getHistory(sid);
            if (conv && conv.messages && conv.messages.length > 0) {
                setMessages(conv.messages);
            } else {
                // If ID exists but no msgs on backend, reset
                setMessages([{
                    id: 'init',
                    content: "Hi there! I'm MIS virtual assistant. How can I help you today?",
                    sender: 'bot',
                    createdAt: new Date().toISOString(),
                    isRead: true
                }]);
            }
        } catch (e) {
            console.error("Failed", e);
        } finally {
            setLoading(false);
        }
    };

    const switchSession = (sid: string) => {
        // Save current if needed before switching
        saveCurrentSession();

        setSessionId(sid);
        localStorage.setItem('chatSessionId', sid);
        loadConversation(sid);
        setView('chat');
    };

    const clearHistory = () => {
        if (window.confirm('Clear all chat history?')) {
            setSessions([]);
            localStorage.removeItem('chat_history_sessions');
        }
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || loading) return;

        const initialContent = inputValue;
        setInputValue('');
        setLoading(true);

        try {
            // Include metadata (optional)
            const { userMessage, botMessage } = await chatService.sendMessage(
                sessionId,
                initialContent,
                {
                    email: metadata.email,
                    location: metadata.location,
                    ipAddress: metadata.ip,
                    device: metadata.device
                }
            );
            setMessages(prev => [...prev, userMessage, botMessage]);

            // Background save to history list
        } catch (error) {
            console.error('Failed to send message', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chat-widget-container">
            <motion.button
                className="chat-toggle-btn"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    zIndex: 9999,
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'var(--text-main)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    border: '2px solid #fff',
                    cursor: 'pointer'
                }}
            >
                {isOpen ? <FaTimes size={24} /> : <FaCommentDots size={28} />}
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="chat-panel"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        style={{
                            position: 'fixed',
                            bottom: '7rem',
                            zIndex: 9999,
                            width: '350px',
                            maxHeight: '600px',
                            height: '500px',
                            background: '#fff',
                            borderRadius: '16px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            border: '1px solid #e2e8f0'
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '0.8rem 1rem', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FaRobot style={{ color: '#000', fontSize: '14px' }} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#fff' }}>Assistant</h3>
                                    <div style={{ fontSize: '0.7rem', color: '#4ade80' }}>Online</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button onClick={() => setView('settings')} title="Settings" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                                    <FaEnvelope />
                                </button>
                                <button onClick={() => setView(view === 'chat' ? 'history' : 'chat')} title="History" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                                    <FaHistory />
                                </button>
                                <button onClick={() => startNewChat(true)} title="New Chat" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <FaPlus size={12} />
                                </button>
                                <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.3)' }} />
                                <button onClick={() => setIsOpen(false)} title="Close" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FaTimes size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        {view === 'chat' ? (
                            <>
                                {/* Messages */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {messages.map((msg, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '8px', flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: msg.sender === 'user' ? '#e5e5e5' : '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                {msg.sender === 'user' ? <FaUser size={12} color="#555" /> : <FaRobot size={14} color="#0284c7" />}
                                            </div>
                                            <div style={{
                                                maxWidth: '75%',
                                                padding: '0.6rem 0.9rem',
                                                borderRadius: '12px',
                                                fontSize: '0.9rem',
                                                background: msg.sender === 'user' ? '#000' : '#fff',
                                                color: msg.sender === 'user' ? '#fff' : '#000',
                                                border: msg.sender === 'user' ? 'none' : '1px solid #e5e5e5',
                                                borderBottomRightRadius: msg.sender === 'user' ? '0' : '12px',
                                                borderBottomLeftRadius: msg.sender === 'user' ? '12px' : '0',
                                            }}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {loading && (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e0f2fe' }}></div>
                                            <div style={{ background: '#fff', padding: '0.6rem', borderRadius: '12px', border: '1px solid #e5e5e5', color: '#888', fontSize: '0.8rem' }}>
                                                Thinking...
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <form onSubmit={handleSend} style={{ padding: '0.8rem', borderTop: '1px solid #eee', display: 'flex', gap: '8px', background: '#fff' }}>
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="Type a message..."
                                        style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '20px', border: '1px solid #ccc', background: '#fff', outline: 'none', fontSize: '0.9rem' }}
                                    />
                                    <button type="submit" disabled={!inputValue.trim() || loading} style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FaPaperPlane size={14} />
                                    </button>
                                </form>
                            </>
                        ) : view === 'settings' ? (
                            <div style={{ flex: 1, padding: '1.5rem', background: '#fff' }}>
                                <h4 style={{ fontWeight: 800, marginBottom: '1rem' }}>Chat Settings</h4>
                                <form onSubmit={handleSaveEmail}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Your Email</label>
                                        <input
                                            type="email"
                                            value={userEmail}
                                            onChange={(e) => setUserEmail(e.target.value)}
                                            placeholder="name@example.com"
                                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                        />
                                        <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '5px' }}>
                                            Providing your email helps us get back to you if we miss your message.
                                        </p>
                                    </div>
                                    <button type="submit" style={{ width: '100%', padding: '0.8rem', background: '#000', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', border: 'none' }}>
                                        Save Settings
                                    </button>
                                </form>
                                <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                                    <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Debug Info</p>
                                    <div style={{ background: '#f5f5f5', padding: '0.8rem', borderRadius: '8px', fontSize: '0.75rem', color: '#666' }}>
                                        <div>IP: {metadata.ip || 'Unknown'}</div>
                                        <div>Loc: {metadata.location || 'Unknown'}</div>
                                        <div>Dev: {(metadata.device || '').substring(0, 20)}...</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ flex: 1, overflowY: 'auto', background: '#f4f4f4', padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ margin: 0, fontWeight: 700 }}>Chat History</h4>
                                    <button onClick={clearHistory} style={{ color: '#ef4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', border: 'none', background: 'none', cursor: 'pointer' }}>
                                        <FaTrash /> Clear
                                    </button>
                                </div>

                                {sessions.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#888', marginTop: '2rem', fontSize: '0.9rem' }}>
                                        No previous chats found.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {sessions.map(sess => (
                                            <div
                                                key={sess.id}
                                                onClick={() => switchSession(sess.id)}
                                                style={{
                                                    background: '#fff',
                                                    padding: '0.8rem',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    border: sess.id === sessionId ? '2px solid var(--primary)' : '1px solid #ddd',
                                                    transition: 'transform 0.2s',
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Session {sess.id.substr(5, 4)}</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#888' }}>{sess.date}</span>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {sess.preview}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatWidget;
