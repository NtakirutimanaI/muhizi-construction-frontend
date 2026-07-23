import { useState, useMemo, useEffect } from 'react';
import {
    FaMoneyBillWave, FaPlus, FaCheck, FaTimes, FaClock,
    FaEye, FaSpinner, FaSearch, FaFilter, FaTrash,
    FaCheckCircle, FaTimesCircle, FaDollarSign, FaUser, FaCalendarAlt
} from 'react-icons/fa';
import { moneyRequisitionsService } from '../../services/moneyRequisitionsService';
import type { MoneyRequisition } from '../../services/moneyRequisitionsService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { loadPageCache, savePageCache } from '../../utils/pageCache';

const badge = (status: string) => {
    const map: Record<string, { color: string; bg: string }> = {
        pending: { color: '#f59e0b', bg: '#f59e0b18' },
        approved: { color: '#22c55e', bg: '#22c55e18' },
        rejected: { color: '#ef4444', bg: '#ef444418' },
    };
    return map[status] || { color: '#6b7280', bg: '#6b728018' };
};

const btnStyle = (bg: string, border?: string): React.CSSProperties => ({
    padding: '0.5rem 1rem', borderRadius: 7,
    border: border ? `1px solid ${border}` : 'none',
    background: bg, color: bg === 'var(--bg-white)' ? 'var(--text-muted)' : '#fff',
    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
});

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.7rem', borderRadius: 7,
    border: '1px solid var(--border-color)', fontSize: '0.82rem',
    background: 'var(--bg-white)', color: 'var(--text-main)', boxSizing: 'border-box',
};

const MoneyRequisitions = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const role = user?.role || '';
    const isAdmin = role === 'admin';
    const isFD = role === 'finance_director';

    const [items, setItems] = useState<MoneyRequisition[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [viewItem, setViewItem] = useState<MoneyRequisition | null>(null);
    const [reviewItem, setReviewItem] = useState<MoneyRequisition | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [form, setForm] = useState({ title: '', description: '', amount: '', requestedAt: new Date().toISOString().split('T')[0] });
    const [reviewForm, setReviewForm] = useState({ status: 'approved' as 'approved' | 'rejected', notes: '', modifiedAmount: '', modificationReason: '' });

    const load = async () => {
        setLoading(true);
        try {
            const cached = loadPageCache<{ items: MoneyRequisition[] }>('pg_money_req');
            if (cached) setItems(cached.items);
            const res = await moneyRequisitionsService.getAll();
            const data = res.data || [];
            setItems(data);
            savePageCache('pg_money_req', { items: data });
        } catch { showToast('Failed to load requisitions', 'error'); }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const stats = useMemo(() => ({
        total: items.length,
        pending: items.filter(i => i.status === 'pending').length,
        approved: items.filter(i => i.status === 'approved').length,
        rejected: items.filter(i => i.status === 'rejected').length,
        totalAmount: items.reduce((s, i) => s + Number(i.amount), 0),
    }), [items]);

    const filtered = useMemo(() => {
        let arr = items;
        if (filter !== 'all') arr = arr.filter(i => i.status === filter);
        if (search) {
            const q = search.toLowerCase();
            arr = arr.filter(i =>
                i.title.toLowerCase().includes(q) ||
                i.description.toLowerCase().includes(q) ||
                (i.requesterName || '').toLowerCase().includes(q)
            );
        }
        return arr;
    }, [items, filter, search]);

    const handleCreate = async () => {
        if (!form.title.trim() || !form.description.trim() || !form.amount) { showToast('Fill in all required fields', 'error'); return; }
        const amt = parseFloat(form.amount);
        if (isNaN(amt) || amt <= 0) { showToast('Enter a valid amount', 'error'); return; }
        setActionLoading('create');
        try {
            await moneyRequisitionsService.create({ title: form.title, description: form.description, amount: amt, requestedAt: form.requestedAt });
            setShowCreate(false);
            setForm({ title: '', description: '', amount: '', requestedAt: new Date().toISOString().split('T')[0] });
            showToast('Requisition submitted', 'success');
            await load();
        } catch { showToast('Failed to create requisition', 'error'); }
        setActionLoading(null);
    };

    const handleReview = async () => {
        if (!reviewItem) return;
        setActionLoading(reviewItem.id);
        try {
            const payload: any = { status: reviewForm.status, notes: reviewForm.notes || undefined };
            if (reviewForm.modifiedAmount) {
                payload.modifiedAmount = parseFloat(reviewForm.modifiedAmount);
                payload.modificationReason = reviewForm.modificationReason || undefined;
            }
            await moneyRequisitionsService.review(reviewItem.id, payload);
            setReviewItem(null);
            showToast(`Requisition ${reviewForm.status}`, 'success');
            await load();
        } catch { showToast('Failed to review requisition', 'error'); }
        setActionLoading(null);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this requisition?')) return;
        setActionLoading(id);
        try { await moneyRequisitionsService.delete(id); showToast('Requisition deleted', 'success'); await load(); }
        catch { showToast('Failed to delete', 'error'); }
        setActionLoading(null);
    };

    const statCard = (icon: React.ReactNode, label: string, value: string | number, color: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '0.8rem 1rem', flex: '1 1 180px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
            <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{value}</div>
            </div>
        </div>
    );

    return (
        <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                        <FaMoneyBillWave style={{ verticalAlign: 'middle', marginRight: 8, color: '#1a8a6a' }} />Money Requisitions
                    </h1>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                        {isAdmin ? 'Review and manage fund requests from Finance Director' : 'Submit fund requests to Admin for approval'}
                    </p>
                </div>
                {isFD && (
                    <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.55rem 1rem', background: '#1a8a6a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                        <FaPlus /> New Requisition
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
                {statCard(<FaDollarSign />, 'Total Requested', `RWF ${stats.totalAmount.toLocaleString()}`, '#1a8a6a')}
                {statCard(<FaClock />, 'Pending', String(stats.pending), '#f59e0b')}
                {statCard(<FaCheckCircle />, 'Approved', String(stats.approved), '#22c55e')}
                {statCard(<FaTimesCircle />, 'Rejected', String(stats.rejected), '#ef4444')}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '0.4rem 0.7rem', flex: '1 1 200px' }}>
                    <FaSearch size={13} style={{ color: 'var(--text-muted)' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search requisitions..." style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.82rem', width: '100%', color: 'var(--text-main)' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '0.4rem 0.7rem' }}>
                    <FaFilter size={13} style={{ color: 'var(--text-muted)' }} />
                    <select value={filter} onChange={e => setFilter(e.target.value as any)} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.82rem', color: 'var(--text-main)' }}>
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}><FaSpinner className="animate-spin" size={24} /> Loading...</div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}><FaMoneyBillWave size={40} style={{ opacity: 0.3, marginBottom: 12 }} /><p>No money requisitions found.</p></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {filtered.map(item => {
                        const b = badge(item.status);
                        return (
                            <div key={item.id} style={{ background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '0.9rem 1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: '1 1 300px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)' }}>{item.title}</span>
                                            <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: b.bg, color: b.color, textTransform: 'capitalize' }}>{item.status}</span>
                                        </div>
                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 6px' }}>{item.description}</p>
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                            <span><FaUser size={10} style={{ marginRight: 4 }} />{item.requesterName || 'Unknown'}</span>
                                            <span><FaCalendarAlt size={10} style={{ marginRight: 4 }} />{item.requestedAt}</span>
                                            <span style={{ fontWeight: 700, color: '#1a8a6a' }}>RWF {Number(item.amount).toLocaleString()}</span>
                                        </div>
                                        {item.adminNotes && <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Admin: {item.adminNotes}</div>}
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                                        <button onClick={() => setViewItem(item)} title="View" style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid var(--border-color)', background: 'var(--bg-white)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><FaEye size={12} /></button>
                                        {isAdmin && item.status === 'pending' && (
                                            <>
                                                <button onClick={() => { setReviewItem(item); setReviewForm({ status: 'approved', notes: '', modifiedAmount: '', modificationReason: '' }); }} title="Approve" style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid #22c55e', background: '#22c55e18', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}><FaCheck size={12} /></button>
                                                <button onClick={() => { setReviewItem(item); setReviewForm({ status: 'rejected', notes: '', modifiedAmount: '', modificationReason: '' }); }} title="Reject" style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid #ef4444', background: '#ef444418', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}><FaTimes size={12} /></button>
                                            </>
                                        )}
                                        {isFD && item.status === 'pending' && (
                                            <button onClick={() => handleDelete(item.id)} title="Delete" style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid #ef4444', background: '#ef444418', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}><FaTrash size={12} /></button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showCreate && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowCreate(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-white)', borderRadius: 12, padding: '1.5rem', width: '90%', maxWidth: 480, border: '1px solid var(--border-color)', maxHeight: '90vh', overflow: 'auto' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: 'var(--text-main)' }}><FaMoneyBillWave style={{ marginRight: 8, color: '#1a8a6a' }} />New Money Requisition</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Title *</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Q3 Material Budget" style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Description *</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="What is this money for?" style={{ ...inputStyle, resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Amount (RWF) *</label>
                                    <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" min="0" style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Date *</label>
                                    <input type="date" value={form.requestedAt} onChange={e => setForm({ ...form, requestedAt: e.target.value })} style={inputStyle} />
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1.2rem' }}>
                            <button onClick={() => setShowCreate(false)} style={btnStyle('var(--bg-white)', 'var(--border-color)')}>Cancel</button>
                            <button onClick={handleCreate} disabled={actionLoading === 'create'} style={{ ...btnStyle('#1a8a6a'), opacity: actionLoading === 'create' ? 0.6 : 1 }}>
                                {actionLoading === 'create' ? <><FaSpinner className="animate-spin" style={{ marginRight: 6 }} />Submitting...</> : 'Submit Requisition'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewItem && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setViewItem(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-white)', borderRadius: 12, padding: '1.5rem', width: '90%', maxWidth: 500, border: '1px solid var(--border-color)', maxHeight: '90vh', overflow: 'auto' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: 'var(--text-main)' }}>Requisition Details</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.82rem' }}>
                            {[
                                ['Title', viewItem.title],
                                ['Description', viewItem.description],
                                ['Amount', `RWF ${Number(viewItem.amount).toLocaleString()}`],
                                ['Requested By', viewItem.requesterName || 'Unknown'],
                                ['Date', viewItem.requestedAt],
                                ['Status', viewItem.status],
                                ['Reviewed By', viewItem.reviewedByName || '---'],
                                ['Reviewed At', viewItem.reviewedAt || '---'],
                                ['Admin Notes', viewItem.adminNotes || '---'],
                            ].map(([label, val]) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-color)' }}>
                                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
                                    <span style={{ color: 'var(--text-main)', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{val}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.2rem' }}>
                            <button onClick={() => setViewItem(null)} style={btnStyle('var(--bg-white)', 'var(--border-color)')}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {reviewItem && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setReviewItem(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-white)', borderRadius: 12, padding: '1.5rem', width: '90%', maxWidth: 500, border: '1px solid var(--border-color)', maxHeight: '90vh', overflow: 'auto' }}>
                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: 'var(--text-main)' }}>Review: {reviewItem.title}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>Amount: RWF {Number(reviewItem.amount).toLocaleString()}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => setReviewForm({ ...reviewForm, status: 'approved' })} style={{ ...btnStyle(reviewForm.status === 'approved' ? '#22c55e' : 'var(--bg-white)', reviewForm.status === 'approved' ? undefined : 'var(--border-color)'), flex: 1 }}><FaCheck style={{ marginRight: 4 }} />Approve</button>
                                <button onClick={() => setReviewForm({ ...reviewForm, status: 'rejected' })} style={{ ...btnStyle(reviewForm.status === 'rejected' ? '#ef4444' : 'var(--bg-white)', reviewForm.status === 'rejected' ? undefined : 'var(--border-color)'), flex: 1 }}><FaTimes style={{ marginRight: 4 }} />Reject</button>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Modified Amount (RWF) - optional</label>
                                <input type="number" value={reviewForm.modifiedAmount} onChange={e => setReviewForm({ ...reviewForm, modifiedAmount: e.target.value })} placeholder={`Leave blank to keep ${Number(reviewItem.amount).toLocaleString()}`} style={inputStyle} />
                            </div>
                            {reviewForm.modifiedAmount && (
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Modification Reason</label>
                                    <input value={reviewForm.modificationReason} onChange={e => setReviewForm({ ...reviewForm, modificationReason: e.target.value })} placeholder="Why was the amount changed?" style={inputStyle} />
                                </div>
                            )}
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Notes</label>
                                <textarea value={reviewForm.notes} onChange={e => setReviewForm({ ...reviewForm, notes: e.target.value })} rows={2} placeholder="Additional notes..." style={{ ...inputStyle, resize: 'vertical' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1.2rem' }}>
                            <button onClick={() => setReviewItem(null)} style={btnStyle('var(--bg-white)', 'var(--border-color)')}>Cancel</button>
                            <button onClick={handleReview} disabled={actionLoading === reviewItem.id} style={{ ...btnStyle(reviewForm.status === 'approved' ? '#22c55e' : '#ef4444'), opacity: actionLoading === reviewItem.id ? 0.6 : 1 }}>
                                {actionLoading === reviewItem.id ? <><FaSpinner className="animate-spin" style={{ marginRight: 6 }} />Processing...</> : reviewForm.status === 'approved' ? 'Approve & Submit' : 'Reject & Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MoneyRequisitions;
