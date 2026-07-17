import { useState, useMemo, useEffect } from 'react';
import {
    FaClipboardList, FaCheck, FaTimesCircle, FaClock,
    FaTruck, FaDollarSign, FaEye, FaChevronLeft,
    FaChevronRight, FaSpinner, FaSearch, FaFilter,
    FaThumbsUp, FaThumbsDown, FaBoxes, FaMoneyBillWave,
    FaBuilding, FaUser, FaCheckCircle, FaCheckDouble, FaPlus
} from 'react-icons/fa';
import { materialRequestsService } from '../../services/materialRequestsService';
import { approvalsService } from '../../services/approvalsService';
import type { MaterialRequest } from '../../services/materialRequestsService';
import type { Approval } from '../../services/approvalsService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

type UnifiedStatus = 'pending' | 'approved' | 'rejected';

interface UnifiedRequest {
    id: string;
    source: 'material' | 'general';
    title: string;
    requester: string;
    reviewer: string;
    type: 'material' | 'money';
    details: string;
    detailsRaw: string | number;
    date: string;
    status: UnifiedStatus;
    reviewedAt?: string;
    raw: MaterialRequest | Approval;
}

const PAGE_SIZES = [5, 10, 15, 20];

const safeBadge = (status: string) => {
    const map: Record<string, { color: string; bg: string }> = {
        pending: { color: '#f59e0b', bg: '#f59e0b18' },
        approved: { color: '#22c55e', bg: '#22c55e18' },
        rejected: { color: '#ef4444', bg: '#ef444418' },
    };
    return map[status] || { color: '#6b7280', bg: '#6b728018' };
};

const emptyFundForm = () => ({
    title: '',
    description: '',
    amount: undefined as number | undefined,
    requestedAt: new Date().toISOString().split('T')[0],
});

const Requests = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const role = user?.role || '';
    // Admin is the top of the reporting chain (reports only to the Client) and is the sole
    // approver below — it cannot also submit fund requests, or it would be approving itself.
    const canSubmitFundRequest = role === 'managing_director' || role === 'site_engineer';
    const canReviewFundRequest = role === 'admin';
    const [requests, setRequests] = useState<UnifiedRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<UnifiedStatus | 'all'>('pending');
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'material' | 'money'>('all');
    const [viewItem, setViewItem] = useState<UnifiedRequest | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [fundForm, setFundForm] = useState(emptyFundForm());
    const [saving, setSaving] = useState(false);

    const toUnified = (r: MaterialRequest): UnifiedRequest => ({
        id: r.id,
        source: 'material',
        title: `${r.material} — ${r.project}`,
        requester: r.createdByName || 'Unknown',
        reviewer: r.approvedByName || '—',
        type: 'material',
        details: r.totalCost > 0
            ? `RWF ${Number(r.totalCost).toLocaleString()}`
            : `${r.quantity} ${r.unit}`,
        detailsRaw: r.totalCost > 0 ? r.totalCost : r.quantity,
        date: r.date || r.createdAt?.split('T')[0] || '',
        status: r.status === 'delivered' ? 'approved' : r.status as UnifiedStatus,
        reviewedAt: r.approvedAt ? new Date(r.approvedAt).toISOString().split('T')[0] : undefined,
        raw: r,
    });

    const toUnifiedFromApproval = (r: Approval): UnifiedRequest => ({
        id: r.id,
        source: 'general',
        title: r.title,
        requester: r.requester.split('(')[0].trim(),
        reviewer: r.reviewedByName || '—',
        type: r.type,
        details: r.type === 'material'
            ? `${r.items?.reduce((s, i) => s + i.qty, 0) || 0} items`
            : `RWF ${(r.amount || 0).toLocaleString()}`,
        detailsRaw: r.type === 'material' ? (r.items?.reduce((s, i) => s + i.qty, 0) || 0) : (r.amount || 0),
        date: r.requestedAt,
        status: r.status as UnifiedStatus,
        reviewedAt: r.reviewedAt,
        raw: r,
    });

    const load = () => {
        setLoading(true);
        return Promise.all([
            materialRequestsService.getAll().catch(() => ({ data: [] })),
            approvalsService.getAll().catch(() => ({ data: [] })),
        ])
            .then(([matRes, appRes]) => {
                const material = (matRes.data || []).map(toUnified);
                const general = (appRes.data || []).map(toUnifiedFromApproval);
                setRequests([...material, ...general]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const stats = useMemo(() => ({
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
    }), [requests]);

    const filtered = useMemo(() => {
        let arr = requests;
        if (filter !== 'all') arr = arr.filter(r => r.status === filter);
        if (typeFilter !== 'all') arr = arr.filter(r => r.type === typeFilter);
        if (search) {
            const q = search.toLowerCase();
            arr = arr.filter(r =>
                r.title.toLowerCase().includes(q) ||
                r.requester.toLowerCase().includes(q) ||
                r.reviewer.toLowerCase().includes(q) ||
                r.details.toLowerCase().includes(q)
            );
        }
        return arr.sort((a, b) => {
            const da = a.reviewedAt || a.date;
            const db = b.reviewedAt || b.date;
            return new Date(db).getTime() - new Date(da).getTime();
        });
    }, [requests, filter, search, typeFilter]);

    const totalPages = pageSize ? Math.ceil(filtered.length / pageSize) : 1;
    const paginated = pageSize ? filtered.slice((page - 1) * pageSize, page * pageSize) : filtered;

    useEffect(() => {
        const tp = pageSize ? Math.ceil(filtered.length / pageSize) : 1;
        if (page > tp) setPage(tp || 1);
    }, [filtered.length, pageSize]);

    const handleApprove = async (req: UnifiedRequest) => {
        setActionLoading(req.id);
        try {
            if (req.source === 'material') {
                await materialRequestsService.approve(req.id);
            } else {
                await approvalsService.update(req.id, { status: 'approved', reviewedAt: new Date().toISOString().split('T')[0] });
            }
            await load();
            showToast('Request approved', 'success');
        } catch {
            showToast('Failed to approve', 'error');
        }
        setActionLoading(null);
    };

    const handleReject = async (req: UnifiedRequest) => {
        setActionLoading(req.id);
        try {
            if (req.source === 'material') {
                await materialRequestsService.reject(req.id);
            } else {
                await approvalsService.update(req.id, { status: 'rejected', reviewedAt: new Date().toISOString().split('T')[0] });
            }
            await load();
            showToast('Request rejected', 'success');
        } catch {
            showToast('Failed to reject', 'error');
        }
        setActionLoading(null);
    };

    const createFundRequest = () => {
        if (!fundForm.title.trim() || !fundForm.description.trim() || !fundForm.requestedAt) {
            showToast('Fill in title, description and date', 'error');
            return;
        }
        if (!fundForm.amount || fundForm.amount <= 0) {
            showToast('Enter a valid amount', 'error');
            return;
        }
        setSaving(true);
        approvalsService.create({
            type: 'money',
            title: fundForm.title,
            description: fundForm.description,
            amount: fundForm.amount,
            status: 'pending',
            requestedAt: fundForm.requestedAt,
        } as Partial<Approval>)
            .then(async () => {
                showToast('Fund request submitted', 'success');
                setShowCreate(false);
                setFundForm(emptyFundForm());
                await load();
            })
            .catch(() => showToast('Failed to submit request', 'error'))
            .finally(() => setSaving(false));
    };

    if (loading) return (
        <div className="admin-page">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: '#999', fontSize: '1.1rem' }}>
                <FaSpinner className="spin" size={20} /> Loading requests...
            </div>
        </div>
    );

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0, marginBottom: '0.2rem' }}>
                        <FaClipboardList style={{ color: 'var(--primary)' }} /> Requests &amp; Approvals
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: '#999' }}>Material requests and fund/expense requests awaiting or already reviewed</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {canSubmitFundRequest && (
                        <button onClick={() => { setFundForm(emptyFundForm()); setShowCreate(true); }}
                            style={{ padding: '0.5rem 0.9rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <FaPlus size={10} /> New Fund Request
                        </button>
                    )}
                    {([
                        { key: 'pending' as const, label: 'Pending', color: '#f59e0b' },
                        { key: 'approved' as const, label: 'Approved', color: '#22c55e' },
                        { key: 'rejected' as const, label: 'Rejected', color: '#ef4444' },
                        { key: 'all' as const, label: 'Total', color: 'var(--primary)' },
                    ]).map(s => (
                        <div key={s.key} className="admin-card" style={{
                            padding: '0.55rem 2rem', textAlign: 'center',
                            background: s.color, color: '#fff', cursor: 'pointer',
                            opacity: filter === s.key || (s.key === 'all' && filter === 'all') ? 1 : 0.65,
                            transition: 'opacity 0.2s',
                        }} onClick={() => { setFilter(s.key); setPage(1); }}>
                            <div style={{ fontSize: '1rem', fontWeight: 800 }}>{s.key === 'all' ? stats.total : stats[s.key]}</div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 360 }}>
                            <FaSearch size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                            <input type="text" className="form-input" placeholder="Search title, requester, reviewer..." value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                                style={{ padding: '0.4rem 0.5rem 0.4rem 28px', fontSize: '0.8rem', width: '100%' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f5f5f5', borderRadius: 8, padding: 2 }}>
                            {([
                                { key: 'all' as const, label: 'All', icon: null },
                                { key: 'material' as const, label: 'Material', icon: <FaTruck size={10} /> },
                                { key: 'money' as const, label: 'Fund', icon: <FaMoneyBillWave size={10} /> },
                            ]).map(t => (
                                <button key={t.key} onClick={() => { setTypeFilter(t.key); setPage(1); }}
                                    style={{
                                        padding: '0.3rem 0.65rem', borderRadius: 6, border: 'none',
                                        background: typeFilter === t.key ? 'var(--primary)' : 'transparent',
                                        color: typeFilter === t.key ? '#fff' : '#555',
                                        cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
                                        display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s',
                                    }}>
                                    {t.icon}{t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                                style={{
                                    padding: '0.3rem 0.7rem', borderRadius: '14px', border: '1px solid',
                                    borderColor: filter === f ? 'transparent' : '#ddd',
                                    background: filter === f ? 'var(--primary)' : 'transparent',
                                    color: filter === f ? '#fff' : '#555',
                                    cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
                                    textTransform: 'capitalize', transition: 'all 0.2s',
                                }}>
                                {f} ({f === 'all' ? requests.length : requests.filter(r => r.status === f).length})
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: 28 }}><FaFilter size={10} /></th>
                                <th>Request</th>
                                <th>Requester</th>
                                <th>Reviewer</th>
                                <th>Details</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th style={{ width: 180 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(req => {
                                const badge = safeBadge(req.status);
                                const canAct = req.type === 'material' || canReviewFundRequest;
                                return (
                                    <tr key={req.id} style={{ opacity: req.status !== 'pending' ? 0.7 : 1 }}>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                width: 22, height: 22, borderRadius: 6,
                                                background: req.type === 'material' ? '#1B204218' : '#22c55e18',
                                                color: req.type === 'material' ? 'var(--primary)' : '#22c55e',
                                                fontSize: '0.65rem',
                                            }}>
                                                {req.type === 'material' ? <FaTruck /> : <FaDollarSign />}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{req.title}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#999', marginTop: 2 }}>
                                                {req.source === 'material' ? 'Material Request' : 'Fund Request'}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.82rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <FaUser size={10} style={{ color: '#bbb' }} /> {req.requester}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.82rem' }}>
                                            {req.reviewer !== '—' ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <FaCheckDouble size={10} style={{ color: '#22c55e' }} /> {req.reviewer}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#bbb' }}>—</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>
                                            {req.details}
                                        </td>
                                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', color: '#999' }}>{req.reviewedAt || req.date}</td>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                fontSize: '0.7rem', fontWeight: 600,
                                                padding: '0.2rem 0.65rem', borderRadius: 10,
                                                background: badge.bg, color: badge.color,
                                            }}>
                                                {req.status === 'pending' ? <FaClock size={10} /> :
                                                    req.status === 'approved' ? <FaCheckCircle size={10} /> :
                                                        <FaTimesCircle size={10} />}
                                                {req.status === 'pending' ? 'Pending' :
                                                    req.status === 'approved' ? 'Approved' : 'Rejected'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                                <button onClick={() => setViewItem(req)}
                                                    title="View details"
                                                    style={{
                                                        padding: '0.25rem 0.5rem', borderRadius: 5,
                                                        border: '1px solid #ddd', background: 'transparent',
                                                        cursor: 'pointer', color: '#666', fontSize: '0.75rem',
                                                        display: 'flex', alignItems: 'center', gap: 4,
                                                        transition: 'all 0.2s',
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.color = '#666'; }}>
                                                    <FaEye size={11} /> View
                                                </button>
                                                {req.status === 'pending' && canAct && (
                                                    <>
                                                        <button onClick={() => handleApprove(req)}
                                                            disabled={actionLoading === req.id}
                                                            title="Approve"
                                                            style={{
                                                                padding: '0.25rem 0.65rem', borderRadius: 5,
                                                                border: 'none', background: '#22c55e', color: '#fff',
                                                                cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
                                                                display: 'flex', alignItems: 'center', gap: 4,
                                                                opacity: actionLoading === req.id ? 0.7 : 1,
                                                                transition: 'all 0.2s',
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = '#16a34a'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = '#22c55e'; }}>
                                                            {actionLoading === req.id ? <FaSpinner className="spin" size={10} /> : <FaThumbsUp size={10} />} Approve
                                                        </button>
                                                        <button onClick={() => handleReject(req)}
                                                            disabled={actionLoading === req.id}
                                                            title="Reject"
                                                            style={{
                                                                padding: '0.25rem 0.65rem', borderRadius: 5,
                                                                border: 'none', background: '#ef4444', color: '#fff',
                                                                cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
                                                                display: 'flex', alignItems: 'center', gap: 4,
                                                                opacity: actionLoading === req.id ? 0.7 : 1,
                                                                transition: 'all 0.2s',
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = '#ef4444'; }}>
                                                            <FaThumbsDown size={10} /> Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!paginated.length && (
                                <tr>
                                    <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#999' }}>
                                        <FaClipboardList size={36} style={{ opacity: 0.25, marginBottom: 10 }} />
                                        <div style={{ fontSize: '0.95rem' }}>No {filter !== 'all' ? filter : ''} requests found</div>
                                        <span style={{ fontSize: '0.8rem' }}>Material and fund requests will appear here</span>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', padding: '0.4rem 0', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: '0.78rem', color: '#999' }}>
                        Showing {paginated.length} of {filtered.length} request{filtered.length !== 1 ? 's' : ''}
                        {typeFilter !== 'all' ? ` (${typeFilter})` : ''}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: '0.75rem', color: '#999' }}>Per page:</span>
                            <select className="form-select" style={{ width: 'auto', padding: '0.25rem 1.3rem 0.25rem 0.4rem', fontSize: '0.75rem' }}
                                value={pageSize} onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}>
                                {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                <option value={0}>All</option>
                            </select>
                        </div>
                        {pageSize > 0 && totalPages > 1 && (
                            <div style={{ display: 'flex', gap: 2 }}>
                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.45rem', fontSize: '0.7rem' }}
                                    disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><FaChevronLeft size={10} /></button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button key={p} className={p === page ? 'admin-btn' : 'admin-btn admin-btn--secondary'}
                                        style={{ padding: '0.25rem 0.5rem', minWidth: 26, fontSize: '0.72rem' }} onClick={() => setPage(p)}>{p}</button>
                                ))}
                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.45rem', fontSize: '0.7rem' }}
                                    disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><FaChevronRight size={10} /></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {viewItem && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={() => setViewItem(null)}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} />
                    <div onClick={e => e.stopPropagation()} className="admin-modal" style={{
                        position: 'relative', padding: '2rem', maxWidth: '560px', width: '100%', maxHeight: '80vh', overflowY: 'auto',
                        borderRadius: 12,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        width: 28, height: 28, borderRadius: 8,
                                        background: viewItem.type === 'material' ? '#1B204218' : '#22c55e18',
                                        color: viewItem.type === 'material' ? 'var(--primary)' : '#22c55e',
                                    }}>
                                        {viewItem.type === 'material' ? <FaBoxes size={13} /> : <FaMoneyBillWave size={13} />}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {viewItem.source === 'material' ? 'Material Request' : 'Fund Request'}
                                    </span>
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{viewItem.title}</h3>
                                <div style={{ display: 'flex', gap: '1.5rem', marginTop: 6, fontSize: '0.82rem', color: '#999' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FaUser size={10} /> {viewItem.requester}</span>
                                    {viewItem.reviewer !== '—' && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FaCheckDouble size={10} style={{ color: '#22c55e' }} /> {viewItem.reviewer}</span>
                                    )}
                                </div>
                            </div>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                fontSize: '0.75rem', fontWeight: 600,
                                padding: '0.25rem 0.75rem', borderRadius: 12,
                                background: safeBadge(viewItem.status).bg,
                                color: safeBadge(viewItem.status).color, whiteSpace: 'nowrap',
                            }}>
                                {viewItem.status === 'pending' ? <FaClock size={11} /> :
                                    viewItem.status === 'approved' ? <FaCheckCircle size={11} /> :
                                        <FaTimesCircle size={11} />}
                                {viewItem.status.charAt(0).toUpperCase() + viewItem.status.slice(1)}
                            </span>
                        </div>

                        <div style={{ background: '#f9f9f9', borderRadius: 10, padding: '1.25rem', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', marginBottom: 2 }}>Type</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                                        {viewItem.type === 'material' ? <FaTruck size={12} /> : <FaDollarSign size={12} />}
                                        {viewItem.type.charAt(0).toUpperCase() + viewItem.type.slice(1)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', marginBottom: 2 }}>Date</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{viewItem.date}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', marginBottom: 2 }}>Details</div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>{viewItem.details}</div>
                                </div>
                                {viewItem.reviewedAt && (
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', marginBottom: 2 }}>Reviewed</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{viewItem.reviewedAt}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {viewItem.status !== 'pending' && (
                            <div style={{
                                background: viewItem.status === 'approved' ? '#22c55e10' : '#ef444410',
                                borderRadius: 8, padding: '0.7rem 1rem', marginBottom: '1rem',
                                borderLeft: `3px solid ${viewItem.status === 'approved' ? '#22c55e' : '#ef4444'}`,
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                {viewItem.status === 'approved' ? <FaCheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0 }} /> : <FaTimesCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />}
                                <span style={{ fontSize: '0.85rem' }}>
                                    This request was <strong>{viewItem.status}</strong>{viewItem.reviewer !== '—' ? ` by ${viewItem.reviewer}` : ''}{viewItem.reviewedAt ? ` on ${viewItem.reviewedAt}` : ''}
                                </span>
                            </div>
                        )}

                        {viewItem.source === 'material' && (() => {
                            const mr = viewItem.raw as MaterialRequest;
                            const showCost = mr.unitPrice > 0 || mr.totalCost > 0;
                            return (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555', marginBottom: 6 }}>Details</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '0.6rem 0.8rem' }}>
                                            <div style={{ fontSize: '0.65rem', color: '#999' }}>Material</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{mr.material}</div>
                                        </div>
                                        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '0.6rem 0.8rem' }}>
                                            <div style={{ fontSize: '0.65rem', color: '#999' }}>Project</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}><FaBuilding size={10} style={{ marginRight: 4 }} />{mr.project}</div>
                                        </div>
                                        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '0.6rem 0.8rem' }}>
                                            <div style={{ fontSize: '0.65rem', color: '#999' }}>Quantity</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{mr.quantity} {mr.unit}</div>
                                        </div>
                                        {showCost && (
                                            <div style={{ background: '#22c55e10', borderRadius: 8, padding: '0.6rem 0.8rem' }}>
                                                <div style={{ fontSize: '0.65rem', color: '#999' }}>Unit Price</div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>RWF {Number(mr.unitPrice || 0).toLocaleString()}</div>
                                            </div>
                                        )}
                                    </div>
                                    {showCost && (
                                        <div style={{ background: '#1B204210', borderRadius: 8, padding: '0.7rem 1rem', marginTop: '0.5rem', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase' }}>Total Cost</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>RWF {Number(mr.totalCost || 0).toLocaleString()}</div>
                                        </div>
                                    )}
                                    {mr.notes && (
                                        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '0.6rem 0.8rem', marginTop: '0.5rem' }}>
                                            <div style={{ fontSize: '0.65rem', color: '#999', marginBottom: 2 }}>Notes</div>
                                            <div style={{ fontSize: '0.82rem' }}>{mr.notes}</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {viewItem.source === 'general' && (() => {
                            const ga = viewItem.raw as Approval;
                            return (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555', marginBottom: 6 }}>Description</div>
                                    <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '0.7rem 0.8rem', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                        {ga.description}
                                    </div>
                                    {ga.type === 'money' && ga.amount ? (
                                        <div style={{ marginTop: '0.75rem', background: '#22c55e10', borderRadius: 10, padding: '0.8rem 1rem', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Amount</div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#22c55e' }}>RWF {ga.amount.toLocaleString()}</div>
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })()}

                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                            <button onClick={() => setViewItem(null)}
                                style={{
                                    padding: '0.4rem 1.2rem', borderRadius: 7, border: '1px solid #ddd',
                                    background: 'transparent', cursor: 'pointer', fontSize: '0.82rem',
                                }}>Close</button>
                            {viewItem.status === 'pending' && (viewItem.type === 'material' || canReviewFundRequest) && (
                                <>
                                    <button onClick={() => { handleApprove(viewItem); setViewItem(null); }}
                                        style={{
                                            padding: '0.4rem 1.2rem', borderRadius: 7, border: 'none',
                                            background: '#22c55e', color: '#fff', cursor: 'pointer',
                                            fontWeight: 600, fontSize: '0.82rem',
                                            display: 'flex', alignItems: 'center', gap: 6,
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#16a34a'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#22c55e'; }}>
                                        <FaCheck size={11} /> Approve
                                    </button>
                                    <button onClick={() => { handleReject(viewItem); setViewItem(null); }}
                                        style={{
                                            padding: '0.4rem 1.2rem', borderRadius: 7, border: 'none',
                                            background: '#ef4444', color: '#fff', cursor: 'pointer',
                                            fontWeight: 600, fontSize: '0.82rem',
                                            display: 'flex', alignItems: 'center', gap: 6,
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#ef4444'; }}>
                                        <FaTimesCircle size={11} /> Reject
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showCreate && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={() => !saving && setShowCreate(false)}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} />
                    <div onClick={e => e.stopPropagation()} className="admin-modal" style={{ position: 'relative', padding: '2rem', maxWidth: '500px', width: '100%', maxHeight: '85vh', overflowY: 'auto', borderRadius: 12 }}>
                        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}><FaMoneyBillWave style={{ color: 'var(--primary)' }} size={16} /> New Fund Request</h3>
                        <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                            This is submitted to Admin for review. For material requisitions use the dedicated Material Requests page — this form is for fund/expense advances only.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div>
                                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Title</label>
                                <input type="text" className="form-input" value={fundForm.title} onChange={e => setFundForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Worker Transport Advance" style={{ width: '100%', padding: '0.45rem' }} />
                            </div>
                            <div>
                                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Description</label>
                                <textarea className="form-input" value={fundForm.description} onChange={e => setFundForm(p => ({ ...p, description: e.target.value }))} rows={3} style={{ width: '100%', padding: '0.45rem', resize: 'vertical' }} />
                            </div>
                            <div>
                                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Amount (RWF)</label>
                                <input type="number" className="form-input" value={fundForm.amount || ''} onChange={e => setFundForm(p => ({ ...p, amount: e.target.value === '' ? undefined : Number(e.target.value) }))} style={{ width: '100%', padding: '0.45rem' }} />
                            </div>
                            <div>
                                <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Date Needed</label>
                                <input type="date" className="form-input" value={fundForm.requestedAt} onChange={e => setFundForm(p => ({ ...p, requestedAt: e.target.value }))} style={{ width: '100%', padding: '0.45rem' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                            <button onClick={() => setShowCreate(false)} disabled={saving} style={{ padding: '0.4rem 1rem', borderRadius: '6px', border: '1px solid #ddd', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={createFundRequest} disabled={saving} style={{ padding: '0.4rem 1.2rem', borderRadius: '6px', border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                                {saving ? <><FaSpinner className="spin" /> Submitting...</> : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Requests;
