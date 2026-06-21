import { useState, useMemo, useEffect } from 'react';
import { FaEnvelope, FaTrash, FaChevronLeft, FaChevronRight, FaSpinner, FaPaperPlane, FaTimes } from 'react-icons/fa';
import { subscriberService } from '../../services/subscriberService';
import type { Subscriber } from '../../services/subscriberService';
import { useToast } from '../../context/ToastContext';

const PAGE_SIZES = [5, 10, 15, 20];

const Subscribers = () => {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [showSendUpdate, setShowSendUpdate] = useState(false);
    const [updateSubject, setUpdateSubject] = useState('');
    const [updateMessage, setUpdateMessage] = useState('');
    const [sending, setSending] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        subscriberService.getAll()
            .then(setSubscribers)
            .catch(() => showToast('Failed to load subscribers', 'error'))
            .finally(() => setLoading(false));
    }, []);

    const counts = useMemo(() => ({
        total: subscribers.length,
        active: subscribers.filter(s => s.isActive).length,
        inactive: subscribers.filter(s => !s.isActive).length,
    }), [subscribers]);

    const filtered = useMemo(() => {
        let arr = subscribers;
        if (filter === 'active') arr = arr.filter(s => s.isActive);
        if (filter === 'inactive') arr = arr.filter(s => !s.isActive);
        if (search) arr = arr.filter(s => s.email.toLowerCase().includes(search.toLowerCase()));
        return arr;
    }, [subscribers, filter, search]);

    const totalPages = pageSize ? Math.ceil(filtered.length / pageSize) : 1;
    const paginated = pageSize ? filtered.slice((page - 1) * pageSize, page * pageSize) : filtered;

    useEffect(() => {
        const tp = pageSize ? Math.ceil(filtered.length / pageSize) : 1;
        if (page > tp) setPage(tp || 1);
    }, [filtered.length, pageSize]);

    const handleToggle = async (s: Subscriber) => {
        try {
            const updated = await subscriberService.update(s.id, { isActive: !s.isActive });
            setSubscribers(prev => prev.map(p => p.id === s.id ? updated : p));
            showToast(`${updated.email} ${updated.isActive ? 'activated' : 'deactivated'}`, 'success');
        } catch {
            showToast('Failed to update', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this subscriber?')) return;
        try {
            await subscriberService.remove(id);
            setSubscribers(prev => prev.filter(s => s.id !== id));
            showToast('Subscriber deleted', 'success');
        } catch {
            showToast('Failed to delete', 'error');
        }
    };

    const scoreColor = (score: number) => {
        if (score >= 60) return '#22c55e';
        if (score >= 20) return '#f59e0b';
        return '#ef4444';
    };

    const handleSendUpdate = async () => {
        if (!updateSubject.trim() || !updateMessage.trim()) {
            showToast('Subject and message are required', 'error');
            return;
        }
        setSending(true);
        try {
            const result = await subscriberService.sendUpdate({
                subject: updateSubject.trim(),
                message: updateMessage.trim(),
            });
            showToast(`Update sent to ${result.sent}/${result.total} subscribers`, 'success');
            setShowSendUpdate(false);
            setUpdateSubject('');
            setUpdateMessage('');
        } catch {
            showToast('Failed to send update', 'error');
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'gray', fontSize: '1.2rem' }}><FaSpinner className="spin" /> Loading...</div>;

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}><FaEnvelope style={{ color: '#8B4513' }} /> Subscribers</h2>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={() => setShowSendUpdate(true)}
                        style={{ padding: '0.35rem 0.8rem', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <FaPaperPlane size={10} /> Send Update
                    </button>
                    {(['total', 'active', 'inactive'] as const).map(k => (
                        <div key={k} className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: k === 'total' ? '#8B4513' : k === 'active' ? '#22c55e' : '#6b7280', color: '#fff' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{counts[k]}</div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.85, textTransform: 'capitalize' }}>{k}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'gray' }}>Newsletter Subscribers</span>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input type="text" className="form-input" placeholder="Search email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 250 }} />
                        {(['all', 'active', 'inactive'] as const).map(f => (
                            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                                style={{ padding: '0.25rem 0.7rem', borderRadius: '12px', border: '1px solid #ddd', background: filter === f ? '#8B4513' : 'transparent', color: filter === f ? '#fff' : '#333', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize' }}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead><tr><th>Email</th><th>Status</th><th>ML Score</th><th>Category</th><th>Source</th><th>Subscribed</th><th>Actions</th></tr></thead>
                        <tbody>
                            {paginated.map(s => (
                                <tr key={s.id}>
                                    <td><strong>{s.email}</strong></td>
                                    <td><span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '10px', background: s.isActive ? '#22c55e20' : '#6b728020', color: s.isActive ? '#22c55e' : '#6b7280' }}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                                    <td><span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '10px', background: `${scoreColor(s.mlScore)}20`, color: scoreColor(s.mlScore) }}>{s.mlScore}</span></td>
                                    <td style={{ textTransform: 'capitalize' }}>{s.mlCategory || '-'}</td>
                                    <td>{s.source || '-'}</td>
                                    <td>{new Date(s.subscribedAt).toLocaleDateString()}</td>
                                    <td><div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button onClick={() => handleToggle(s)}
                                            style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', border: 'none', background: s.isActive ? '#6b7280' : '#22c55e', color: '#fff', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 600 }}>
                                            {s.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button onClick={() => handleDelete(s.id)}
                                            style={{ padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid #ddd', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}>
                                            <FaTrash size={11} />
                                        </button>
                                    </div></td>
                                </tr>
                            ))}
                            {!paginated.length && <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'gray' }}>{search ? 'No match' : 'No subscribers yet.'}</td></tr>}
                        </tbody>
                    </table>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '0.3rem 0', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', color: 'gray' }}>Showing {paginated.length} of {filtered.length}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: '0.72rem', color: 'gray' }}>Per page:</span>
                            <select className="form-select" style={{ width: 'auto', padding: '0.2rem 1.2rem 0.2rem 0.4rem', fontSize: '0.72rem' }} value={pageSize} onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}>
                                {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                <option value={0}>All</option>
                            </select>
                        </div>
                        {pageSize > 0 && totalPages > 1 && (
                            <div style={{ display: 'flex', gap: 2 }}>
                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }} disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><FaChevronLeft size={10} /></button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button key={p} className={p === page ? 'admin-btn' : 'admin-btn admin-btn--secondary'} style={{ padding: '0.2rem 0.5rem', minWidth: 26, fontSize: '0.72rem' }} onClick={() => setPage(p)}>{p}</button>
                                ))}
                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }} disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><FaChevronRight size={10} /></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showSendUpdate && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={() => !sending && setShowSendUpdate(false)}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
                    <div onClick={e => e.stopPropagation()} className="admin-modal" style={{ position: 'relative', padding: '2rem', maxWidth: '550px', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaPaperPlane style={{ color: '#2563eb' }} size={16} /> Send Update to Subscribers</h3>
                            <button onClick={() => setShowSendUpdate(false)} disabled={sending} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1.2rem' }}><FaTimes /></button>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'gray', marginBottom: '1rem' }}>
                            This will send an email to all <strong>{counts.active} active</strong> subscribers.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Subject</label>
                                <input type="text" className="form-input" value={updateSubject} onChange={e => setUpdateSubject(e.target.value)} placeholder="e.g. New Project Announcement" style={{ width: '100%', padding: '0.4rem' }} />
                            </div>
                            <div>
                                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Message</label>
                                <textarea className="form-input" value={updateMessage} onChange={e => setUpdateMessage(e.target.value)} placeholder="Write your message here..." rows={6} style={{ width: '100%', padding: '0.4rem', resize: 'vertical' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
                            <button onClick={() => setShowSendUpdate(false)} disabled={sending} style={{ padding: '0.4rem 1rem', borderRadius: '6px', border: '1px solid #ddd', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleSendUpdate} disabled={sending} style={{ padding: '0.4rem 1.2rem', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                                {sending ? <><FaSpinner className="spin" /> Sending...</> : <><FaPaperPlane /> Send to All</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Subscribers;
