import { useState, useMemo, useEffect, useCallback } from 'react';
import {
    FaMoneyBillWave, FaPlus, FaCheck, FaTimes, FaClock,
    FaEye, FaSpinner, FaSearch, FaFilter, FaTrash,
    FaCheckCircle, FaTimesCircle, FaDollarSign, FaUser, FaCalendarAlt,
    FaEdit, FaPaperPlane, FaSave
} from 'react-icons/fa';
import { moneyRequisitionsService } from '../../services/moneyRequisitionsService';
import type { MoneyRequisition } from '../../services/moneyRequisitionsService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { loadPageCache, savePageCache } from '../../utils/pageCache';
import { profileService } from '../../services/profileService';
import type { Profile } from '../../services/profileService';
import MoneyRequestForm from './MoneyRequestForm';
import SignaturePad from '../../components/SignaturePad';

const badge = (status: string) => {
    const map: Record<string, { color: string; bg: string }> = {
        draft: { color: '#6366f1', bg: '#6366f118' },
        pending: { color: '#f59e0b', bg: '#f59e0b18' },
        approved: { color: '#22c55e', bg: '#22c55e18' },
        rejected: { color: '#ef4444', bg: '#ef444418' },
    };
    return map[status] || { color: '#6b7280', bg: '#6b728018' };
};

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
    const [filter, setFilter] = useState<'all' | 'draft' | 'pending' | 'approved' | 'rejected'>('all');
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [profile, setProfile] = useState<Profile | null>(null);
    const [companyLogo, setCompanyLogo] = useState('');

    // Create modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createStep, setCreateStep] = useState<'form' | 'preview'>('form');
    const [form, setForm] = useState({ title: '', description: '', amount: '', requestedAt: new Date().toISOString().split('T')[0], department: 'Accountant', reason: '', requestedDisbursementDate: '' });
    const [fdSignature, setFdSignature] = useState('');

    // View modal
    const [viewItem, setViewItem] = useState<MoneyRequisition | null>(null);

    // Review modal state
    const [reviewItem, setReviewItem] = useState<MoneyRequisition | null>(null);
    const [reviewForm, setReviewForm] = useState({ status: 'approved' as 'approved' | 'rejected', notes: '', modifiedAmount: '', modificationReason: '' });
    const [adminSignature, setAdminSignature] = useState('');
    const [stampUrl, setStampUrl] = useState('');
    const [stampFile, setStampFile] = useState<File | null>(null);

    // Edit modal state
    const [editItem, setEditItem] = useState<MoneyRequisition | null>(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', amount: '', requestedAt: '', department: '', reason: '', requestedDisbursementDate: '' });

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

    const loadProfile = useCallback(async () => {
        try {
            const p = await profileService.getMyProfile();
            const prof = (p as any).data || p;
            setProfile(prof);
            setCompanyLogo(prof.companyLogo || '/logo.jpeg');
            if (prof.digitalSignature) setFdSignature(prof.digitalSignature);
            if (prof.stampUrl) setStampUrl(prof.stampUrl);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { load(); loadProfile(); }, [loadProfile]);

    const stats = useMemo(() => ({
        total: items.length,
        drafts: items.filter(i => i.status === 'draft').length,
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

    const resetForm = () => {
        setForm({ title: '', description: '', amount: '', requestedAt: new Date().toISOString().split('T')[0], department: 'Accountant', reason: '', requestedDisbursementDate: '' });
        setFdSignature(profile?.digitalSignature || '');
        setCreateStep('form');
    };

    const openCreateModal = () => {
        resetForm();
        setShowCreateModal(true);
    };

    const handlePreview = () => {
        if (!form.title.trim() || !form.description.trim() || !form.amount) { showToast('Fill in all required fields', 'error'); return; }
        const amt = parseFloat(form.amount);
        if (isNaN(amt) || amt <= 0) { showToast('Enter a valid amount', 'error'); return; }
        setCreateStep('preview');
    };

    const handleSaveDraft = async () => {
        setActionLoading('create');
        try {
            await moneyRequisitionsService.create({ ...form, amount: parseFloat(form.amount), status: 'draft', requesterSignature: fdSignature });
            setShowCreateModal(false);
            resetForm();
            showToast('Draft saved', 'success');
            await load();
        } catch { showToast('Failed to save draft', 'error'); }
        setActionLoading(null);
    };

    const handleSubmitToAdmin = async () => {
        setActionLoading('create');
        try {
            await moneyRequisitionsService.create({ ...form, amount: parseFloat(form.amount), status: 'pending', requesterSignature: fdSignature });
            setShowCreateModal(false);
            resetForm();
            showToast('Requisition submitted to admin', 'success');
            await load();
        } catch { showToast('Failed to submit', 'error'); }
        setActionLoading(null);
    };

    const handleSubmitDraft = async (id: string) => {
        if (!window.confirm('Submit this draft to admin for review?')) return;
        setActionLoading(id);
        try {
            await moneyRequisitionsService.submit(id);
            showToast('Submitted to admin', 'success');
            await load();
        } catch { showToast('Failed to submit', 'error'); }
        setActionLoading(null);
    };

    const handleReview = async () => {
        if (!reviewItem) return;
        setActionLoading(reviewItem.id);
        try {
            const payload: any = {
                status: reviewForm.status,
                notes: reviewForm.notes || undefined,
                authorizedByName: 'Papias UWIMANA',
                authorizedByPosition: 'CEO/Founder',
                authorizedBySignature: adminSignature || undefined,
                authorizationDate: new Date().toISOString().split('T')[0],
                stampUrl: stampUrl || undefined,
            };
            if (reviewForm.modifiedAmount) {
                payload.modifiedAmount = parseFloat(reviewForm.modifiedAmount);
                payload.modificationReason = reviewForm.modificationReason || undefined;
            }
            await moneyRequisitionsService.review(reviewItem.id, payload);
            setReviewItem(null);
            setAdminSignature('');
            showToast(`Requisition ${reviewForm.status}`, 'success');
            await load();
        } catch { showToast('Failed to review requisition', 'error'); }
        setActionLoading(null);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Move this requisition to trash?')) return;
        setActionLoading(id);
        try { await moneyRequisitionsService.delete(id); showToast('Requisition trashed', 'success'); await load(); }
        catch { showToast('Failed to trash requisition', 'error'); }
        setActionLoading(null);
    };

    const openEditModal = (item: MoneyRequisition) => {
        setEditItem(item);
        setEditForm({
            title: item.title,
            description: item.description,
            amount: String(item.amount),
            requestedAt: item.requestedAt,
            department: item.department || '',
            reason: item.reason || '',
            requestedDisbursementDate: item.requestedDisbursementDate || '',
        });
    };

    const handleEditSubmit = async () => {
        if (!editItem) return;
        if (!editForm.title.trim() || !editForm.description.trim() || !editForm.amount) { showToast('Fill in all required fields', 'error'); return; }
        const amt = parseFloat(editForm.amount);
        if (isNaN(amt) || amt <= 0) { showToast('Enter a valid amount', 'error'); return; }
        setActionLoading(editItem.id);
        try {
            await moneyRequisitionsService.update(editItem.id, { ...editForm, amount: amt });
            setEditItem(null);
            showToast('Requisition updated', 'success');
            await load();
        } catch { showToast('Failed to update requisition', 'error'); }
        setActionLoading(null);
    };

    const openReview = (item: MoneyRequisition) => {
        setReviewItem(item);
        setReviewForm({ status: 'approved', notes: '', modifiedAmount: '', modificationReason: '' });
        setAdminSignature(profile?.digitalSignature || '');
    };

    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const w = windowWidth;
    const isTiny = w < 380;
    const isSmall = w < 640;
    const isMedium = w < 900;
    const padX = isSmall ? '0.75rem' : '1.5rem';
    const padY = isSmall ? '1rem' : '1.5rem';

    const btnStyle = (bg: string, border?: string): React.CSSProperties => ({
        padding: isSmall ? '0.4rem 0.7rem' : '0.5rem 1rem',
        borderRadius: 7,
        border: border ? `1px solid ${border}` : 'none',
        background: bg,
        color: bg === 'var(--bg-white)' ? 'var(--text-muted)' : '#fff',
        cursor: 'pointer',
        fontSize: isTiny ? '0.7rem' : '0.8rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
    });

    const statCard = (icon: React.ReactNode, label: string, value: string | number, color: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: isTiny ? '0.5rem' : '0.75rem', background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 10, padding: isSmall ? '0.5rem 0.65rem' : '0.8rem 1rem', flex: `1 1 ${isTiny ? '130px' : isSmall ? '140px' : '180px'}`, minWidth: 0 }}>
            <div style={{ width: isTiny ? 26 : isSmall ? 30 : 36, height: isTiny ? 26 : isSmall ? 30 : 36, borderRadius: 8, background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: isTiny ? '0.6rem' : isSmall ? '0.65rem' : '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
                <div style={{ fontSize: isTiny ? '0.78rem' : isSmall ? '0.85rem' : '0.95rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
            </div>
        </div>
    );

    const requesterName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'MUTIMUKEYE Odette';

    const modalOverlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' };
    const closeBtn = (onClick: () => void): React.CSSProperties => ({ width: isTiny ? 26 : 30, height: isTiny ? 26 : 30, borderRadius: 7, border: '1px solid var(--border-color)', background: 'var(--bg-white)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 });
    const iconBtnStyle = (borderColor: string, bg: string, color: string): React.CSSProperties => ({
        width: isTiny ? 26 : 28, height: isTiny ? 26 : 28, borderRadius: 6,
        border: `1px solid ${borderColor}`, background: bg, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0,
    });

    return (
        <div style={{ padding: `${padY} ${padX}`, maxWidth: 1100, margin: '0 auto', boxSizing: 'border-box', overflowX: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                    <h1 style={{ fontSize: isTiny ? '0.95rem' : isSmall ? '1.1rem' : '1.4rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <FaMoneyBillWave style={{ color: '#1a8a6a', flexShrink: 0 }} />Money Requisitions
                    </h1>
                    <p style={{ fontSize: isTiny ? '0.68rem' : '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                        {isAdmin ? 'Review and manage fund requests' : 'Submit fund requests to Admin'}
                    </p>
                </div>
                {isFD && (
                    <button onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: isSmall ? '0.45rem 0.75rem' : '0.55rem 1rem', background: '#1a8a6a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: isTiny ? '0.72rem' : '0.82rem', whiteSpace: 'nowrap' }}>
                        <FaPlus /> New
                    </button>
                )}
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: isTiny ? '0.35rem' : '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {statCard(<FaDollarSign />, 'Total', `RWF ${stats.totalAmount.toLocaleString()}`, '#1a8a6a')}
                {statCard(<FaEdit />, 'Drafts', String(stats.drafts), '#6366f1')}
                {statCard(<FaClock />, 'Pending', String(stats.pending), '#f59e0b')}
                {statCard(<FaCheckCircle />, 'Approved', String(stats.approved), '#22c55e')}
                {statCard(<FaTimesCircle />, 'Rejected', String(stats.rejected), '#ef4444')}
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 8, padding: isSmall ? '0.3rem 0.5rem' : '0.4rem 0.7rem', flex: '1 1 160px', minWidth: 0 }}>
                    <FaSearch size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: isTiny ? '0.75rem' : '0.82rem', width: '100%', color: 'var(--text-main)', minWidth: 0 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 8, padding: isSmall ? '0.3rem 0.5rem' : '0.4rem 0.7rem', flexShrink: 0 }}>
                    <FaFilter size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <select value={filter} onChange={e => setFilter(e.target.value as any)} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: isTiny ? '0.75rem' : '0.82rem', color: 'var(--text-main)' }}>
                        <option value="all">All</option>
                        <option value="draft">Drafts</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}><FaSpinner className="animate-spin" size={24} /></div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}><FaMoneyBillWave size={36} style={{ opacity: 0.3, marginBottom: 8 }} /><p style={{ margin: 0, fontSize: '0.82rem' }}>No money requisitions found.</p></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: isTiny ? '0.25rem' : '0.35rem' }}>
                    {filtered.map(item => {
                        const b = badge(item.status);
                        return (
                            <div key={item.id} style={{ background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 8, padding: isTiny ? '0.35rem 0.5rem' : '0.45rem 0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: isTiny ? '0.25rem' : '0.5rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: isTiny ? 4 : 6, flexWrap: 'wrap', lineHeight: 1.3 }}>
                                            <span style={{ fontSize: isTiny ? '0.75rem' : '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{item.title}</span>
                                            <span style={{ fontSize: isTiny ? '0.55rem' : '0.62rem', fontWeight: 600, padding: isTiny ? '0px 4px' : '1px 6px', borderRadius: 8, background: b.bg, color: b.color, textTransform: 'capitalize', lineHeight: 1.5 }}>{item.status}</span>
                                            {!isTiny && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}><FaUser size={9} style={{ marginRight: 2 }} />{item.requesterName || 'Unknown'}</span>}
                                            {!isSmall && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}><FaCalendarAlt size={9} style={{ marginRight: 2 }} />{item.requestedAt}</span>}
                                            <span style={{ fontSize: isTiny ? '0.7rem' : '0.75rem', fontWeight: 700, color: '#1a8a6a' }}>RWF {Number(item.amount).toLocaleString()}</span>
                                        </div>
                                        {item.adminNotes && !isTiny && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 1 }}>Admin: {item.adminNotes}</div>}
                                    </div>
                                    <div style={{ display: 'flex', gap: isTiny ? 3 : 4, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setViewItem(item)} title="View" style={iconBtnStyle('var(--border-color)', 'var(--bg-white)', 'var(--text-muted)')}><FaEye size={isTiny ? 10 : 11} /></button>
                                        {isAdmin && (
                                            <>
                                                <button onClick={() => openEditModal(item)} title="Edit" style={iconBtnStyle('#f59e0b', '#f59e0b18', '#f59e0b')}><FaEdit size={isTiny ? 10 : 11} /></button>
                                                <button onClick={() => handleDelete(item.id)} title="Trash" style={iconBtnStyle('#ef4444', '#ef444418', '#ef4444')}><FaTrash size={isTiny ? 10 : 11} /></button>
                                            </>
                                        )}
                                        {isFD && item.status === 'draft' && (
                                            <button onClick={() => handleSubmitDraft(item.id)} title="Submit" style={iconBtnStyle('#1a8a6a', '#1a8a6a18', '#1a8a6a')}><FaPaperPlane size={isTiny ? 10 : 11} /></button>
                                        )}
                                        {isAdmin && item.status === 'pending' && (
                                            <button onClick={() => openReview(item)} title="Review" style={iconBtnStyle('#22c55e', '#22c55e18', '#22c55e')}><FaCheck size={isTiny ? 10 : 11} /></button>
                                        )}
                                        {isFD && (item.status === 'draft' || item.status === 'pending') && (
                                            <button onClick={() => handleDelete(item.id)} title="Delete" style={iconBtnStyle('#ef4444', '#ef444418', '#ef4444')}><FaTrash size={isTiny ? 10 : 11} /></button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ========== CREATE MODAL ========== */}
            {showCreateModal && (
                <div style={modalOverlay} onClick={() => setShowCreateModal(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-white)', borderRadius: isTiny ? 8 : 12, width: '100%', maxWidth: createStep === 'form' ? (isSmall ? '100%' : 520) : (isSmall ? '100%' : 900), maxHeight: '95vh', overflow: 'auto', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}>
                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isSmall ? '0.75rem 1rem' : '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', gap: 8 }}>
                            <h3 style={{ margin: 0, fontSize: isTiny ? '0.85rem' : '1.05rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                <FaMoneyBillWave color="#1a8a6a" style={{ flexShrink: 0 }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{createStep === 'form' ? 'New Requisition' : 'Preview'}</span>
                            </h3>
                            <button onClick={() => setShowCreateModal(false)} style={closeBtn(() => setShowCreateModal(false))}>
                                <FaTimes size={isTiny ? 10 : 12} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: isSmall ? '1rem' : '1.2rem 1.5rem' }}>
                            {createStep === 'form' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: isTiny ? '0.5rem' : '0.75rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Title *</label>
                                        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Q3 Material Budget" style={{ ...inputStyle, fontSize: isTiny ? '0.75rem' : '0.82rem' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Description *</label>
                                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={isTiny ? 2 : 3} placeholder="What is this money for?" style={{ ...inputStyle, resize: 'vertical', fontSize: isTiny ? '0.75rem' : '0.82rem' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Amount (RWF) *</label>
                                            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" min="0" style={{ ...inputStyle, fontSize: isTiny ? '0.75rem' : '0.82rem' }} />
                                        </div>
                                        <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Date *</label>
                                            <input type="date" value={form.requestedAt} onChange={e => setForm({ ...form, requestedAt: e.target.value })} style={{ ...inputStyle, fontSize: isTiny ? '0.75rem' : '0.82rem' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Department/Position</label>
                                        <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="e.g. Accountant" style={{ ...inputStyle, fontSize: isTiny ? '0.75rem' : '0.82rem' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Reason *</label>
                                        <input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Reason for this request" style={{ ...inputStyle, fontSize: isTiny ? '0.75rem' : '0.82rem' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Requested Disbursement Date</label>
                                        <input type="date" value={form.requestedDisbursementDate} onChange={e => setForm({ ...form, requestedDisbursementDate: e.target.value })} style={{ ...inputStyle, fontSize: isTiny ? '0.75rem' : '0.82rem' }} />
                                    </div>

                                    {/* Signature Section */}
                                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem', marginTop: '0.15rem' }}>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Your Signature (Finance Director)</label>
                                        {fdSignature && (
                                            <div style={{ marginBottom: 8, padding: 8, background: '#f9f9f9', borderRadius: 4, border: '1px solid #eee' }}>
                                                <img src={fdSignature} alt="Your saved signature" style={{ height: 35, objectFit: 'contain' }} />
                                                <div style={{ marginTop: 5, display: 'flex', gap: 8 }}>
                                                    <button type="button" onClick={() => setFdSignature('')} style={{ fontSize: '0.68rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Remove</button>
                                                    {profile?.digitalSignature !== fdSignature && (
                                                        <button type="button" onClick={async () => {
                                                            try {
                                                                await profileService.updateProfile({ digitalSignature: fdSignature });
                                                                setProfile({ ...profile!, digitalSignature: fdSignature });
                                                                showToast('Signature saved to your profile', 'success');
                                                            } catch { showToast('Failed to save signature', 'error'); }
                                                        }} style={{ fontSize: '0.68rem', color: '#1a8a6a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                                            Save to Profile
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {!fdSignature && <SignaturePad onSave={setFdSignature} width={isSmall ? Math.min(340, w - 120) : 400} height={120} />}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ overflow: 'auto' }}>
                                    <MoneyRequestForm data={{
                                        date: form.requestedAt,
                                        requesterName,
                                        department: form.department,
                                        amount: form.amount,
                                        reason: form.reason,
                                        description: form.description,
                                        disbursementDate: form.requestedDisbursementDate,
                                        status: 'pending',
                                        requesterSignature: fdSignature,
                                        authorizedByName: 'Papias UWIMANA',
                                        authorizedByPosition: 'CEO/Founder',
                                        authorizationDate: '',
                                    }} companyLogo={companyLogo} />
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: isSmall ? '0.75rem 1rem' : '1rem 1.5rem', borderTop: '1px solid var(--border-color)', gap: 6, flexWrap: 'wrap' }}>
                            <div>
                                {createStep === 'preview' && (
                                    <button onClick={() => setCreateStep('form')} style={btnStyle('var(--bg-white)', 'var(--border-color)')}>
                                        <FaEdit style={{ marginRight: 4 }} />Edit
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowCreateModal(false)} style={btnStyle('var(--bg-white)', 'var(--border-color)')}>Cancel</button>
                                {createStep === 'form' ? (
                                    <button onClick={handlePreview} style={btnStyle('#1B2042')}>
                                        <FaEye style={{ marginRight: 4 }} />Preview
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={handleSaveDraft} disabled={actionLoading === 'create'} style={{ ...btnStyle('var(--bg-white)', '#6366f1'), color: '#6366f1', opacity: actionLoading === 'create' ? 0.6 : 1 }}>
                                            {actionLoading === 'create' ? <><FaSpinner className="animate-spin" style={{ marginRight: 4 }} /></> : <><FaSave style={{ marginRight: 4 }} />{!isTiny && 'Save as Draft'}</>}
                                        </button>
                                        <button onClick={handleSubmitToAdmin} disabled={actionLoading === 'create'} style={{ ...btnStyle('#1a8a6a'), opacity: actionLoading === 'create' ? 0.6 : 1 }}>
                                            {actionLoading === 'create' ? <><FaSpinner className="animate-spin" style={{ marginRight: 4 }} /></> : <><FaPaperPlane style={{ marginRight: 4 }} />{!isTiny && 'Submit'}</>}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== VIEW MODAL ========== */}
            {viewItem && (
                <div style={modalOverlay} onClick={() => setViewItem(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-white)', borderRadius: isTiny ? 8 : 12, width: '100%', maxWidth: isSmall ? '100%' : 900, maxHeight: '95vh', overflow: 'auto', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isSmall ? '0.75rem 1rem' : '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', gap: 8 }}>
                            <h3 style={{ margin: 0, fontSize: isTiny ? '0.85rem' : '1rem', color: 'var(--text-main)' }}>Money Request Form</h3>
                            <button onClick={() => setViewItem(null)} style={closeBtn(() => setViewItem(null))}>
                                <FaTimes size={isTiny ? 10 : 12} />
                            </button>
                        </div>
                        <div style={{ padding: isSmall ? '0.75rem' : '1.2rem 1.5rem', overflow: 'auto' }}>
                            <MoneyRequestForm data={{
                                date: viewItem.requestedAt,
                                requesterName: viewItem.requesterName || 'MUTIMUKEYE Odette',
                                department: viewItem.department || 'Accountant',
                                amount: String(viewItem.amount),
                                reason: viewItem.reason || viewItem.title,
                                description: viewItem.description,
                                disbursementDate: viewItem.requestedDisbursementDate || '',
                                status: viewItem.status as any,
                                requesterSignature: viewItem.requesterSignature || '',
                                authorizedByName: viewItem.authorizedByName || 'Papias UWIMANA',
                                authorizedByPosition: viewItem.authorizedByPosition || 'CEO/Founder',
                                authorizationDate: viewItem.authorizationDate || viewItem.reviewedAt || '',
                                authorizedBySignature: viewItem.authorizedBySignature || '',
                                stampUrl: viewItem.stampUrl || '',
                            }} companyLogo={companyLogo} />
                        </div>
                    </div>
                </div>
            )}

            {/* ========== REVIEW MODAL (Admin) ========== */}
            {reviewItem && (
                <div style={modalOverlay} onClick={() => setReviewItem(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-white)', borderRadius: isTiny ? 8 : 12, width: '100%', maxWidth: isSmall ? '100%' : 950, maxHeight: '95vh', overflow: 'auto', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isSmall ? '0.75rem 1rem' : '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', gap: 8 }}>
                            <h3 style={{ margin: 0, fontSize: isTiny ? '0.85rem' : '1.05rem', color: 'var(--text-main)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Review: {reviewItem.title}</h3>
                            <button onClick={() => setReviewItem(null)} style={closeBtn(() => setReviewItem(null))}>
                                <FaTimes size={isTiny ? 10 : 12} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: isSmall ? '1rem' : '1.5rem', padding: isSmall ? '0.75rem' : '1.2rem 1.5rem', flexWrap: 'wrap' }}>
                            {/* Left: Live preview of the form */}
                            <div style={{ flex: '1 1 300px', minWidth: 0, overflow: 'auto' }}>
                                <MoneyRequestForm data={{
                                    date: reviewItem.requestedAt,
                                    requesterName: reviewItem.requesterName || 'MUTIMUKEYE Odette',
                                    department: reviewItem.department || 'Accountant',
                                    amount: reviewForm.modifiedAmount || String(reviewItem.amount),
                                    reason: reviewItem.reason || reviewItem.title,
                                    description: reviewItem.description,
                                    disbursementDate: reviewItem.requestedDisbursementDate || '',
                                    status: reviewForm.status,
                                    requesterSignature: reviewItem.requesterSignature || '',
                                    authorizedByName: 'Papias UWIMANA',
                                    authorizedByPosition: 'CEO/Founder',
                                    authorizationDate: new Date().toISOString().split('T')[0],
                                    authorizedBySignature: adminSignature,
                                    stampUrl,
                                }} embedded companyLogo={companyLogo} />
                            </div>

                            {/* Right: Review controls */}
                            <div style={{ flex: isSmall ? '1 1 100%' : '0 0 300px', minWidth: isSmall ? '100%' : 280, display: 'flex', flexDirection: 'column', gap: isTiny ? '0.5rem' : '0.75rem' }}>
                                {/* Amount */}
                                <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 8, padding: isTiny ? '0.5rem' : '0.75rem' }}>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2 }}>Requested Amount</div>
                                    <div style={{ fontSize: isTiny ? '0.95rem' : '1.1rem', fontWeight: 700, color: '#1a8a6a' }}>RWF {Number(reviewItem.amount).toLocaleString()}</div>
                                </div>

                                {/* Approve/Reject */}
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => { setReviewForm({ ...reviewForm, status: 'approved' }); if (!adminSignature && profile?.digitalSignature) setAdminSignature(profile.digitalSignature); }} style={{ ...btnStyle(reviewForm.status === 'approved' ? '#22c55e' : 'var(--bg-white)', reviewForm.status === 'approved' ? undefined : 'var(--border-color)'), flex: 1, color: reviewForm.status === 'approved' ? '#fff' : 'var(--text-main)' }}><FaCheck style={{ marginRight: 3 }} />{!isTiny && 'Approve'}</button>
                                    <button onClick={() => setReviewForm({ ...reviewForm, status: 'rejected' })} style={{ ...btnStyle(reviewForm.status === 'rejected' ? '#ef4444' : 'var(--bg-white)', reviewForm.status === 'rejected' ? undefined : 'var(--border-color)'), flex: 1, color: reviewForm.status === 'rejected' ? '#fff' : 'var(--text-main)' }}><FaTimes style={{ marginRight: 3 }} />{!isTiny && 'Reject'}</button>
                                </div>

                                {/* Modified Amount */}
                                <div>
                                    <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Modified Amount (RWF)</label>
                                    <input type="number" value={reviewForm.modifiedAmount} onChange={e => setReviewForm({ ...reviewForm, modifiedAmount: e.target.value })} placeholder={`Keep ${Number(reviewItem.amount).toLocaleString()}`} style={{ ...inputStyle, fontSize: isTiny ? '0.75rem' : '0.82rem' }} />
                                </div>

                                {reviewForm.modifiedAmount && (
                                    <div>
                                        <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Modification Reason</label>
                                        <input value={reviewForm.modificationReason} onChange={e => setReviewForm({ ...reviewForm, modificationReason: e.target.value })} placeholder="Why changed?" style={{ ...inputStyle, fontSize: isTiny ? '0.75rem' : '0.82rem' }} />
                                    </div>
                                )}

                                {/* Notes */}
                                <div>
                                    <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Notes</label>
                                    <textarea value={reviewForm.notes} onChange={e => setReviewForm({ ...reviewForm, notes: e.target.value })} rows={2} placeholder="Additional notes..." style={{ ...inputStyle, resize: 'vertical', fontSize: isTiny ? '0.75rem' : '0.82rem' }} />
                                </div>

                                {/* Admin Signature */}
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem' }}>
                                    <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Admin Signature</label>
                                    {adminSignature && (
                                        <div style={{ marginBottom: 8, padding: 8, background: '#f9f9f9', borderRadius: 4, border: '1px solid #eee' }}>
                                            <img src={adminSignature} alt="Admin signature" style={{ height: 30, objectFit: 'contain' }} />
                                            <div style={{ marginTop: 4, display: 'flex', gap: 8 }}>
                                                <button type="button" onClick={() => setAdminSignature('')} style={{ fontSize: '0.68rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Remove</button>
                                                {profile?.digitalSignature !== adminSignature && (
                                                    <button type="button" onClick={async () => {
                                                        try {
                                                            await profileService.updateProfile({ digitalSignature: adminSignature });
                                                            setProfile({ ...profile!, digitalSignature: adminSignature });
                                                            showToast('Signature saved', 'success');
                                                        } catch { showToast('Failed to save', 'error'); }
                                                    }} style={{ fontSize: '0.68rem', color: '#1a8a6a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                                        Save
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {!adminSignature && <SignaturePad onSave={setAdminSignature} width={isSmall ? Math.min(260, w - 120) : 280} height={isTiny ? 80 : 100} />}
                                </div>

                                {/* Stamp */}
                                <div>
                                    <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Official Stamp</label>
                                    {stampUrl && (
                                        <div style={{ marginBottom: 6, padding: 6, background: '#f9f9f9', borderRadius: 4, border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <img src={stampUrl} alt="Stamp" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                                            <button type="button" onClick={() => { setStampUrl(''); setStampFile(null); }} style={{ fontSize: '0.68rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Remove</button>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = (ev) => setStampUrl(ev.target?.result as string);
                                        reader.readAsDataURL(file);
                                    }} style={{ fontSize: '0.72rem' }} />
                                </div>

                                {/* Submit buttons */}
                                <div style={{ display: 'flex', gap: 6, marginTop: '0.25rem' }}>
                                    <button onClick={() => setReviewItem(null)} style={{ ...btnStyle('var(--bg-white)', 'var(--border-color)'), flex: 1 }}>Cancel</button>
                                    <button onClick={handleReview} disabled={actionLoading === reviewItem.id} style={{ ...btnStyle(reviewForm.status === 'approved' ? '#22c55e' : '#ef4444'), flex: 1, opacity: actionLoading === reviewItem.id ? 0.6 : 1 }}>
                                        {actionLoading === reviewItem.id ? <FaSpinner className="animate-spin" /> : isTiny ? (reviewForm.status === 'approved' ? 'OK' : 'No') : reviewForm.status === 'approved' ? 'Approve & Send' : 'Reject & Send'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== EDIT MODAL ========== */}
            {editItem && (
                <div style={modalOverlay} onClick={() => setEditItem(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-white)', borderRadius: isTiny ? 8 : 12, width: '100%', maxWidth: isSmall ? '100%' : 520, maxHeight: '95vh', overflow: 'auto', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isSmall ? '0.75rem 1rem' : '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', gap: 8 }}>
                            <h3 style={{ margin: 0, fontSize: isTiny ? '0.85rem' : '1.05rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <FaEdit color="#f59e0b" style={{ flexShrink: 0 }} />
                                Edit Requisition
                            </h3>
                            <button onClick={() => setEditItem(null)} style={closeBtn(() => setEditItem(null))}>
                                <FaTimes size={isTiny ? 10 : 12} />
                            </button>
                        </div>
                        <div style={{ padding: isSmall ? '1rem' : '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: isTiny ? '0.5rem' : '0.75rem' }}>
                            <div>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Title *</label>
                                <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} placeholder="e.g. Q3 Material Budget" style={{ ...inputStyle, fontSize: isTiny ? '0.75rem' : '0.82rem' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Description *</label>
                                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={isTiny ? 2 : 3} placeholder="What is this money for?" style={{ ...inputStyle, resize: 'vertical', fontSize: isTiny ? '0.75rem' : '0.82rem' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Amount (RWF) *</label>
                                    <input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} placeholder="0" min="0" style={{ ...inputStyle, fontSize: isTiny ? '0.75rem' : '0.82rem' }} />
                                </div>
                                <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Date *</label>
                                    <input type="date" value={editForm.requestedAt} onChange={e => setEditForm({ ...editForm, requestedAt: e.target.value })} style={{ ...inputStyle, fontSize: isTiny ? '0.75rem' : '0.82rem' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Department/Position</label>
                                <input value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} placeholder="e.g. Accountant" style={{ ...inputStyle, fontSize: isTiny ? '0.75rem' : '0.82rem' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Reason *</label>
                                <input value={editForm.reason} onChange={e => setEditForm({ ...editForm, reason: e.target.value })} placeholder="Reason for this request" style={{ ...inputStyle, fontSize: isTiny ? '0.75rem' : '0.82rem' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Requested Disbursement Date</label>
                                <input type="date" value={editForm.requestedDisbursementDate} onChange={e => setEditForm({ ...editForm, requestedDisbursementDate: e.target.value })} style={{ ...inputStyle, fontSize: isTiny ? '0.75rem' : '0.82rem' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, padding: isSmall ? '0.75rem 1rem' : '1rem 1.5rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                            <button onClick={() => setEditItem(null)} style={btnStyle('var(--bg-white)', 'var(--border-color)')}>Cancel</button>
                            <button onClick={handleEditSubmit} disabled={actionLoading === editItem.id} style={{ ...btnStyle('#f59e0b'), opacity: actionLoading === editItem.id ? 0.6 : 1 }}>
                                {actionLoading === editItem.id ? <><FaSpinner className="animate-spin" style={{ marginRight: 4 }} /></> : <><FaSave style={{ marginRight: 4 }} />{!isTiny && 'Save Changes'}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MoneyRequisitions;
