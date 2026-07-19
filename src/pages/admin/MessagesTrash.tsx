import { useState, useEffect, useMemo } from 'react';
import { FaEnvelope, FaArchive, FaTrash, FaUndo, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { profileService, type ContactMessage } from '../../services/profileService';
import { loadPageCache, savePageCache } from '../../utils/pageCache';
import { useToast } from '../../context/ToastContext';

const StatTile = ({ icon, label, value, accent, emphasis }: { icon: React.ReactNode; label: string; value: string; accent: string; emphasis?: boolean }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0,
        background: emphasis ? `${accent}12` : 'var(--bg-white)',
        border: `1px solid ${emphasis ? `${accent}40` : 'var(--border-color)'}`,
        borderRadius: 10, padding: '0.8rem 1rem',
    }}>
        <div style={{
            width: 36, height: 36, borderRadius: 9, background: `${accent}18`, color: accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.95rem',
        }}>{icon}</div>
        <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
            <div style={{ fontSize: emphasis ? '1.1rem' : '0.95rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
        </div>
    </div>
);

const PAGE_SIZES = [5, 10, 15, 20];

const MessagesTrash = () => {
    const { showToast } = useToast();
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => { loadMessages(); }, []);

    const loadMessages = async () => {
        try {
            const cached = loadPageCache<ContactMessage[]>('pg_messages_trash');
            if (cached) {
                setMessages(cached);
            }
            const data = await profileService.getTrashMessages();
            setMessages(data || []);
            savePageCache('pg_messages_trash', data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (messageId: string) => {
        try {
            await profileService.restoreMessage(messageId);
            setMessages(prev => prev.filter(m => m.id !== messageId));
            showToast('Message restored from trash', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to restore message', 'error');
        }
    };

    const handlePermanentDelete = async (messageId: string) => {
        if (!window.confirm('Permanently delete this message? This cannot be undone.')) return;
        try {
            await profileService.permanentDeleteMessage(messageId);
            setMessages(prev => prev.filter(m => m.id !== messageId));
            showToast('Message permanently deleted', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to delete message', 'error');
        }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return messages.filter(m => {
            if (q && !m.name.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q) && !(m.subject || '').toLowerCase().includes(q)) return false;
            return true;
        });
    }, [messages, search]);

    const totalPages = pageSize === 0 ? 1 : Math.ceil(filtered.length / pageSize);
    const paginated = useMemo(() => {
        if (pageSize === 0) return filtered;
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    useEffect(() => { if (page > totalPages) setPage(totalPages || 1); }, [totalPages, page]);

    const formatDate = (dateString: string) => new Date(dateString).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const tableData = useMemo(() => filtered.map((m, i) => [
        String(i + 1), m.name, m.email, m.subject || '—',
        m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—',
    ]), [filtered]);

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, flexShrink: 0 }}>
                    <FaEnvelope style={{ color: 'var(--primary)' }} /> Messages
                </h2>
                <input type="text" className="form-input" placeholder="Search name, email, subject..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 280 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <StatTile icon={<FaTrash />} label="Trashed Messages" value={String(messages.length)} accent="#ef4444" emphasis />
            </div>

            <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Trash ({filtered.length})</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '0.7rem 0.75rem', fontSize: '0.75rem', textAlign: 'left' }}>#</th>
                                <th style={{ padding: '0.7rem 0.75rem', fontSize: '0.75rem', textAlign: 'left' }}>Name</th>
                                <th style={{ padding: '0.7rem 0.75rem', fontSize: '0.75rem', textAlign: 'left' }}>Email</th>
                                <th style={{ padding: '0.7rem 0.75rem', fontSize: '0.75rem', textAlign: 'left' }}>Subject</th>
                                <th style={{ padding: '0.7rem 0.75rem', fontSize: '0.75rem', textAlign: 'left' }}>Deleted</th>
                                <th style={{ padding: '0.7rem 0.75rem', fontSize: '0.75rem', textAlign: 'center', width: 120 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                                    <FaArchive size={32} style={{ marginBottom: '0.75rem', opacity: 0.2 }} />
                                    <p style={{ fontSize: '0.95rem' }}>Trash is empty</p>
                                </td></tr>
                            ) : (
                                paginated.map((m, i) => (
                                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.8rem' }}>{(page - 1) * pageSize + i + 1}</td>
                                        <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}>{m.name}</td>
                                        <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.8rem' }}>{m.email}</td>
                                        <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.subject || '—'}</td>
                                        <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.8rem' }}>{m.deletedAt ? formatDate(m.deletedAt) : '—'}</td>
                                        <td style={{ padding: '0.7rem 0.75rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                                <button className="admin-btn admin-btn--secondary" onClick={() => handleRestore(m.id!)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--primary-teal)' }} title="Restore">
                                                    <FaUndo size={10} />
                                                </button>
                                                <button className="admin-btn admin-btn--secondary" onClick={() => handlePermanentDelete(m.id!)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--primary-red)' }} title="Permanently Delete">
                                                    <FaTrash size={10} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pageSize === 0 ? filtered.length : Math.min(pageSize, filtered.length - (page - 1) * pageSize)} of {filtered.length}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <select className="form-select" style={{ width: 'auto', padding: '0.2rem 1.2rem 0.2rem 0.4rem', fontSize: '0.75rem' }} value={pageSize} onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}>
                            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}<option value={0}>All</option>
                        </select>
                        {pageSize > 0 && totalPages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><FaChevronLeft /></button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button key={p} className={p === page ? 'admin-btn' : 'admin-btn admin-btn--secondary'} style={{ padding: '0.2rem 0.5rem', minWidth: 26, fontSize: '0.75rem' }} onClick={() => setPage(p)}>{p}</button>
                                ))}
                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><FaChevronRight /></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessagesTrash;
