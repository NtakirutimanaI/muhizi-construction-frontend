import { useState, useMemo, useEffect } from 'react';
import {
    FaClipboardCheck, FaCheckCircle, FaTimesCircle, FaClock,
    FaTruck, FaDollarSign, FaEye, FaChevronLeft,
    FaChevronRight, FaSpinner, FaSearch, FaFilter,
    FaBoxes, FaMoneyBillWave, FaBuilding, FaUser,
    FaCheckDouble
} from 'react-icons/fa';
import { materialRequestsService } from '../../services/materialRequestsService';
import { approvalsService } from '../../services/approvalsService';
import type { MaterialRequest } from '../../services/materialRequestsService';
import type { Approval } from '../../services/approvalsService';

type UnifiedStatus = 'pending' | 'approved' | 'rejected';

interface UnifiedRequest {
    id: string;
    source: 'material' | 'general';
    title: string;
    requester: string;
    reviewer: string;
    type: 'material' | 'money';
    details: string;
    date: string;
    reviewedAt?: string;
    status: UnifiedStatus;
    raw: MaterialRequest | Approval;
}

const PAGE_SIZES = [5, 10, 15, 20];

const safeBadge = (status: string) => {
    const map: Record<string, { color: string; bg: string }> = {
        pending: { color: '#f59e0b', bg: '#f59e0b15' },
        approved: { color: '#22c55e', bg: '#22c55e15' },
        rejected: { color: '#ef4444', bg: '#ef444415' },
    };
    return map[status] || { color: '#6b7280', bg: '#6b728015' };
};

const Approvements = () => {
    const [requests, setRequests] = useState<UnifiedRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<UnifiedStatus | 'all'>('all');
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'material' | 'money'>('all');
    const [viewItem, setViewItem] = useState<UnifiedRequest | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const toUnified = (r: MaterialRequest): UnifiedRequest => ({
        id: r.id,
        source: 'material',
        title: `${r.material} — ${r.project}`.trim(),
        requester: r.createdByName || 'Unknown',
        reviewer: r.approvedByName || '—',
        type: 'material',
        details: r.totalCost > 0
            ? `RWF ${Number(r.totalCost).toLocaleString()}`
            : `${r.quantity} ${r.unit}`,
        date: r.date || r.createdAt?.split('T')[0] || '',
        reviewedAt: r.approvedAt ? new Date(r.approvedAt).toISOString().split('T')[0] : undefined,
        status: r.status === 'delivered' ? 'approved' : r.status as UnifiedStatus,
        raw: r,
    });

    const toUnifiedFromApproval = (r: Approval): UnifiedRequest => ({
        id: r.id,
        source: 'general',
        title: r.title,
        requester: r.requester.split('(')[0].trim(),
        reviewer: '—',
        type: r.type,
        details: r.type === 'material'
            ? `${r.items?.reduce((s, i) => s + i.qty, 0) || 0} items`
            : `RWF ${(r.amount || 0).toLocaleString()}`,
        date: r.requestedAt,
        reviewedAt: r.reviewedAt,
        status: r.status as UnifiedStatus,
        raw: r,
    });

    useEffect(() => {
        setLoading(true);
        Promise.all([
            materialRequestsService.getAll().catch(() => ({ data: [] })),
            approvalsService.getAll().catch(() => ({ data: [] })),
        ])
            .then(([matRes, appRes]) => {
                const material = (matRes.data || []).map(toUnified);
                const general = (appRes.data || []).map(toUnifiedFromApproval);
                const all = [...material, ...general];
                setRequests(all);
            })
            .finally(() => setLoading(false));
    }, []);

    const reviewed = useMemo(() => requests.filter(r => r.status !== 'pending'), [requests]);

    const stats = useMemo(() => ({
        total: reviewed.length,
        approved: reviewed.filter(r => r.status === 'approved').length,
        rejected: reviewed.filter(r => r.status === 'rejected').length,
    }), [reviewed]);

    const filtered = useMemo(() => {
        let arr = reviewed;
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
    }, [reviewed, filter, search, typeFilter]);

    const totalPages = pageSize ? Math.ceil(filtered.length / pageSize) : 1;
    const paginated = pageSize ? filtered.slice((page - 1) * pageSize, page * pageSize) : filtered;

    useEffect(() => {
        const tp = pageSize ? Math.ceil(filtered.length / pageSize) : 1;
        if (page > tp) setPage(tp || 1);
    }, [filtered.length, pageSize]);

    if (loading) return (
        <div className="admin-page">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: '#999', fontSize: '1.1rem' }}>
                <FaSpinner className="spin" size={20} /> Loading approvements...
            </div>
        </div>
    );

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0, marginBottom: '0.2rem' }}>
                        <FaClipboardCheck style={{ color: 'var(--primary)' }} /> Approvements
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: '#999' }}>Review history of all approved and rejected requests</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {([
                        { key: 'total', label: 'Total', color: 'var(--primary)', count: stats.total },
                        { key: 'approved' as const, label: 'Approved', color: '#22c55e', count: stats.approved },
                        { key: 'rejected' as const, label: 'Rejected', color: '#ef4444', count: stats.rejected },
                    ]).map(s => {
                        const isActive = s.key === 'total' ? filter === 'all' : filter === s.key;
                        return (
                            <div key={s.key} className="admin-card" style={{
                                padding: '0.5rem 1.8rem', textAlign: 'center',
                                background: s.color, color: '#fff', cursor: 'pointer',
                                opacity: isActive ? 1 : 0.6,
                                transition: 'opacity 0.2s',
                            }} onClick={() => { setFilter(s.key === 'total' ? 'all' : s.key); setPage(1); }}>
                                <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{s.count}</div>
                                <div style={{ fontSize: '0.6rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                            </div>
                        );
                    })}
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
                                { key: 'money' as const, label: 'Money', icon: <FaMoneyBillWave size={10} /> },
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
                        {(['all', 'approved', 'rejected'] as const).map(f => (
                            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                                style={{
                                    padding: '0.3rem 0.7rem', borderRadius: '14px', border: '1px solid',
                                    borderColor: filter === f ? 'transparent' : '#ddd',
                                    background: filter === f ? 'var(--primary)' : 'transparent',
                                    color: filter === f ? '#fff' : '#555',
                                    cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
                                    textTransform: 'capitalize', transition: 'all 0.2s',
                                }}>
                                {f} ({f === 'all' ? reviewed.length : reviewed.filter(r => r.status === f).length})
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
                                <th>Reviewed By</th>
                                <th>Details</th>
                                <th>Reviewed</th>
                                <th>Status</th>
                                <th style={{ width: 80 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(req => {
                                const badge = safeBadge(req.status);
                                return (
                                    <tr key={req.id}>
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
                                                {req.source === 'material' ? 'Material Request' : 'General Approval'}
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
                                        <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', color: '#999' }}>
                                            {req.reviewedAt || req.date}
                                        </td>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                fontSize: '0.7rem', fontWeight: 600,
                                                padding: '0.2rem 0.65rem', borderRadius: 10,
                                                background: badge.bg, color: badge.color,
                                            }}>
                                                {req.status === 'approved' ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />}
                                                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                            </span>
                                        </td>
                                        <td>
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
                                        </td>
                                    </tr>
                                );
                            })}
                            {!paginated.length && (
                                <tr>
                                    <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#999' }}>
                                        <FaClipboardCheck size={36} style={{ opacity: 0.25, marginBottom: 10 }} />
                                        <div style={{ fontSize: '0.95rem' }}>No {filter !== 'all' ? filter : ''} approvements yet</div>
                                        <span style={{ fontSize: '0.8rem' }}>Approved or rejected requests will appear here</span>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', padding: '0.4rem 0', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: '0.78rem', color: '#999' }}>
                        Showing {paginated.length} of {filtered.length} approval{filtered.length !== 1 ? 's' : ''}
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
                                        {viewItem.source === 'material' ? 'Material Request' : 'General Approval'}
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
                                {viewItem.status === 'approved' ? <FaCheckCircle size={11} /> : <FaTimesCircle size={11} />}
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
                                        <div style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', marginBottom: 2 }}>Reviewed On</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{viewItem.reviewedAt}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {viewItem.status === 'approved' && (
                            <div style={{ background: '#22c55e10', borderRadius: 8, padding: '0.7rem 1rem', marginBottom: '1rem', borderLeft: '3px solid #22c55e', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FaCheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.85rem' }}>This request was <strong>approved</strong>{viewItem.reviewer !== '—' ? ` by ${viewItem.reviewer}` : ''} on {viewItem.reviewedAt}</span>
                            </div>
                        )}
                        {viewItem.status === 'rejected' && (
                            <div style={{ background: '#ef444410', borderRadius: 8, padding: '0.7rem 1rem', marginBottom: '1rem', borderLeft: '3px solid #ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FaTimesCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.85rem' }}>This request was <strong>rejected</strong>{viewItem.reviewer !== '—' ? ` by ${viewItem.reviewer}` : ''} on {viewItem.reviewedAt}</span>
                            </div>
                        )}

                        {viewItem.source === 'material' && (() => {
                            const mr = viewItem.raw as MaterialRequest;
                            const showCost = mr.unitPrice > 0 || mr.totalCost > 0;
                            return (
                                <div>
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
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555', marginBottom: 6 }}>Description</div>
                                    <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '0.7rem 0.8rem', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                        {ga.description}
                                    </div>
                                    {ga.type === 'material' && ga.items?.length ? (
                                        <div style={{ marginTop: '0.75rem' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555', marginBottom: 6 }}>Items</div>
                                            {ga.items.map((item, i) => (
                                                <div key={i} style={{
                                                    display: 'flex', justifyContent: 'space-between',
                                                    padding: '0.45rem 0.7rem', background: '#f5f5f5',
                                                    borderRadius: 8, marginTop: 4,
                                                }}>
                                                    <span style={{ fontSize: '0.85rem' }}>{item.name}</span>
                                                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.qty} {item.unit}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : ga.type === 'money' && ga.amount ? (
                                        <div style={{ marginTop: '0.75rem', background: '#22c55e10', borderRadius: 10, padding: '0.8rem 1rem', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Amount</div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#22c55e' }}>RWF {ga.amount.toLocaleString()}</div>
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })()}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                            <button onClick={() => setViewItem(null)}
                                style={{
                                    padding: '0.4rem 1.2rem', borderRadius: 7, border: '1px solid #ddd',
                                    background: 'transparent', cursor: 'pointer', fontSize: '0.82rem',
                                }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Approvements;
