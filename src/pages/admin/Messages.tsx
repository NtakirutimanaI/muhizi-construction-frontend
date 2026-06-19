import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FaUser, FaCalendarAlt, FaEnvelope, FaPhone, FaBuilding, FaCheck, FaClock, FaTrash, FaInbox } from 'react-icons/fa';
import { profileService, type ContactMessage } from '../../services/profileService';
import Loading from '../../components/Loading';
import { useToast } from '../../context/ToastContext';

const Messages = () => {
    const { searchQuery } = useOutletContext<{ searchQuery: string }>();
    const { showToast } = useToast();
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async () => {
        try {
            const data = await profileService.getContactMessages();
            setMessages(data);
        } catch (error) {
            console.error(error);
            showToast('Failed to load messages', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectMessage = async (msg: ContactMessage) => {
        setSelectedMessage(msg);

        // Mark as read if it's unread
        if (!msg.status || msg.status === 'unread' || msg.status === 'new') {
            try {
                await profileService.markMessageAsRead(msg.id!);
                // Update local state
                setMessages(prev => prev.map(m =>
                    m.id === msg.id ? { ...m, status: 'read' as any } : m
                ));
            } catch (error) {
                console.error('Failed to mark message as read:', error);
            }
        }
    };

    const handleDelete = async (messageId: string) => {
        if (!confirm('Are you sure you want to delete this message? This cannot be undone.')) {
            return;
        }

        try {
            setMessages(prev => prev.filter(m => m.id !== messageId));
            if (selectedMessage?.id === messageId) {
                setSelectedMessage(null);
            }
            showToast('Message deleted successfully', 'success');
        } catch (error) {
            console.error('Failed to delete message:', error);
            showToast('Failed to delete message', 'error');
        }
    };

    if (loading) return <Loading />;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredMessages = messages.filter(m => {
        const query = (searchQuery || '').toLowerCase();
        const matchesSearch = m.name.toLowerCase().includes(query) ||
            m.email.toLowerCase().includes(query) ||
            (m.subject && m.subject.toLowerCase().includes(query)) ||
            (m.message && m.message.toLowerCase().includes(query)) ||
            (m.phone && m.phone.toLowerCase().includes(query));

        const matchesFilter = filter === 'all' ||
            (filter === 'unread' && (!m.status || m.status === 'unread' || m.status === 'new')) ||
            (filter === 'read' && m.status === 'read');

        return matchesSearch && matchesFilter;
    });

    const unreadCount = messages.filter(m => !m.status || m.status === 'unread' || m.status === 'new').length;

    return (
        <div style={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    Contact Messages
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    Messages submitted through the contact form on your public portfolio
                </p>
            </div>

            {/* Stats and Filters */}
            <div className="content-card" style={{
                padding: '1.25rem',
                marginBottom: '1.5rem',
                background: 'linear-gradient(135deg, var(--bg-white) 0%, var(--bg-body) 100%)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                Total Messages
                            </p>
                            <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                {messages.length}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                Unread
                            </p>
                            <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>
                                {unreadCount}
                            </p>
                        </div>
                    </div>

                    {/* Filter Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {(['all', 'unread', 'read'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    padding: '0.4rem 0.9rem',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    border: filter === f ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                    background: filter === f ? 'rgba(123, 192, 67, 0.1)' : 'var(--bg-white)',
                                    color: filter === f ? 'var(--text-main)' : 'var(--text-muted)',
                                    fontWeight: filter === f ? 600 : 400,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Two-Panel Layout: List LEFT, Detail RIGHT */}
            <div className="messages-layout" style={{
                display: 'grid',
                gridTemplateColumns: selectedMessage ? 'minmax(300px, 400px) 1fr' : 'minmax(300px, 400px)',
                gap: '1.5rem',
                flex: 1,
                overflow: 'hidden',
                minHeight: 0
            }}>
                {/* LEFT Panel - Message List */}
                <div className="content-card" style={{
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '1rem 1.25rem',
                        borderBottom: '1px solid var(--border-color)',
                        background: 'var(--bg-white)'
                    }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                            Inbox ({filteredMessages.length})
                        </h3>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-body)' }}>
                        {filteredMessages.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '3rem 1rem',
                                color: 'var(--text-muted)'
                            }}>
                                <FaInbox size={40} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                <p style={{ fontSize: '0.95rem' }}>
                                    {filter === 'all' ? 'No messages yet' : `No ${filter} messages`}
                                </p>
                            </div>
                        ) : (
                            filteredMessages.map((msg: any) => (
                                <div
                                    key={msg.id}
                                    onClick={() => handleSelectMessage(msg)}
                                    style={{
                                        padding: '1.5rem 1.5rem',
                                        minHeight: '140px',
                                        borderBottom: '1px solid var(--border-color)',
                                        borderLeft: `3px solid ${!msg.status || msg.status === 'unread' || msg.status === 'new' ? 'var(--primary)' : 'transparent'}`,
                                        background: selectedMessage?.id === msg.id ? 'rgba(123, 192, 67, 0.08)' : 'var(--bg-white)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedMessage?.id !== msg.id) {
                                            e.currentTarget.style.background = 'var(--bg-body)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedMessage?.id !== msg.id) {
                                            e.currentTarget.style.background = 'var(--bg-white)';
                                        }
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <h4 style={{
                                            fontSize: '0.95rem',
                                            fontWeight: !msg.status || msg.status === 'unread' || msg.status === 'new' ? 700 : 500,
                                            margin: 0,
                                            color: 'var(--text-main)'
                                        }}>
                                            {msg.name}
                                        </h4>
                                        {(!msg.status || msg.status === 'unread' || msg.status === 'new') && (
                                            <span style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                background: 'var(--primary)',
                                                flexShrink: 0
                                            }} />
                                        )}
                                    </div>
                                    {msg.subject && (
                                        <p style={{
                                            fontSize: '0.85rem',
                                            color: 'var(--text-main)',
                                            margin: '0 0 0.5rem 0',
                                            fontWeight: 600,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 1,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {msg.subject}
                                        </p>
                                    )}
                                    <p style={{
                                        fontSize: '0.85rem',
                                        color: 'var(--text-muted)',
                                        margin: '0 0 0.8rem 0',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        lineHeight: '1.4'
                                    }}>
                                        {msg.message}
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                                        {formatDate(msg.createdAt)}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT Panel - Message Detail */}
                {selectedMessage && (
                    <div className="content-card" style={{
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '1.25rem',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'var(--bg-white)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '12px',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    background: !selectedMessage.status || selectedMessage.status === 'unread' || selectedMessage.status === 'new' ? 'rgba(123, 192, 67, 0.15)' : 'rgba(0, 128, 128, 0.15)',
                                    color: !selectedMessage.status || selectedMessage.status === 'unread' || selectedMessage.status === 'new' ? 'var(--primary)' : 'var(--primary-teal)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem'
                                }}>
                                    {!selectedMessage.status || selectedMessage.status === 'unread' || selectedMessage.status === 'new' ? <FaClock size={10} /> : <FaCheck size={10} />}
                                    {!selectedMessage.status || selectedMessage.status === 'unread' || selectedMessage.status === 'new' ? 'NEW' : 'READ'}
                                </span>
                            </div>
                            <button
                                onClick={() => handleDelete(selectedMessage.id!)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    border: '1px solid var(--primary-red)',
                                    background: 'transparent',
                                    color: 'var(--primary-red)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--primary-red)';
                                    e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--primary-red)';
                                }}
                            >
                                <FaTrash size={12} /> Delete
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                            {/* Sender Info */}
                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-teal) 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white'
                                    }}>
                                        <FaUser size={22} />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
                                            {selectedMessage.name}
                                        </h2>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <FaCalendarAlt size={11} />
                                            {formatDate(selectedMessage.createdAt!)}
                                        </p>
                                    </div>
                                </div>

                                {/* Subject */}
                                {selectedMessage.subject && (
                                    <div style={{
                                        padding: '0.75rem 1rem',
                                        background: 'var(--bg-body)',
                                        borderRadius: '6px',
                                        marginBottom: '1rem'
                                    }}>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.25rem 0' }}>
                                            Subject
                                        </p>
                                        <p style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                                            {selectedMessage.subject}
                                        </p>
                                    </div>
                                )}

                                {/* Contact Info */}
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '1.5rem',
                                    padding: '1rem',
                                    background: 'var(--bg-body)',
                                    borderRadius: '6px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                        <FaEnvelope size={15} style={{ color: 'var(--primary-teal)' }} />
                                        <a href={`mailto:${selectedMessage.email}`} style={{
                                            color: 'var(--primary-teal)',
                                            textDecoration: 'none',
                                            fontWeight: 500
                                        }}>
                                            {selectedMessage.email}
                                        </a>
                                    </div>

                                    {selectedMessage.phone && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                            <FaPhone size={15} style={{ color: 'var(--text-muted)' }} />
                                            <span style={{ fontWeight: 500 }}>{selectedMessage.phone}</span>
                                        </div>
                                    )}

                                    {selectedMessage.company && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                            <FaBuilding size={15} style={{ color: 'var(--text-muted)' }} />
                                            <span style={{ fontWeight: 500 }}>{selectedMessage.company}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Message Content */}
                            <div>
                                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Message
                                </h3>
                                <div style={{
                                    background: 'var(--bg-white)',
                                    padding: '1.5rem',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    lineHeight: '1.7',
                                    whiteSpace: 'pre-wrap',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-main)'
                                }}>
                                    {selectedMessage.message || 'No message content'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
