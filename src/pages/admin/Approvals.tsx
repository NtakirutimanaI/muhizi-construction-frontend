import { useState, useMemo, useEffect } from 'react';
import { FaCheckDouble, FaCheckCircle, FaTimesCircle, FaClock, FaTruck, FaDollarSign, FaSearch, FaEye, FaCheck, FaChevronLeft, FaChevronRight, FaSpinner } from 'react-icons/fa';
import { approvalsService } from '../../services/approvalsService';
import type { Approval } from '../../services/approvalsService';

const PAGE_SIZES = [5, 10, 15, 20];

const seedData: Approval[] = [
    { id: '', type: 'material', title: 'Cement Order — 200 Bags', requester: 'Jean Niyonzima (Site Manager)', items: [{ name: 'Portland Cement', qty: 200, unit: 'bags' }], description: 'For foundation work on Kigali Heights project', status: 'pending', requestedAt: '2026-06-18' },
    { id: '', type: 'money', title: 'Site Worker Transport Advance', requester: 'Jean Niyonzima (Site Manager)', amount: 150000, description: 'Monthly transport allowance for 15 workers', status: 'pending', requestedAt: '2026-06-19' },
    { id: '', type: 'material', title: 'Steel Reinforcement Bars', requester: 'Patrick Habimana (Site Manager)', items: [{ name: '12mm Rebar', qty: 500, unit: 'units' }, { name: '16mm Rebar', qty: 300, unit: 'units' }], description: 'For structural columns on Rubavu Commercial Complex', status: 'approved', requestedAt: '2026-06-15', reviewedAt: '2026-06-16' },
    { id: '', type: 'money', title: 'Equipment Repair Fund', requester: 'Patrick Habimana (Site Manager)', amount: 350000, description: 'Mixer machine repair and spare parts', status: 'rejected', requestedAt: '2026-06-14', reviewedAt: '2026-06-15' },
    { id: '', type: 'material', title: 'Sand & Gravel Supply', requester: 'Jean Niyonzima (Site Manager)', items: [{ name: 'Sharp Sand', qty: 10, unit: 'tons' }, { name: 'Gravel 3/4', qty: 8, unit: 'tons' }], description: 'For ongoing concreting works', status: 'pending', requestedAt: '2026-06-20' },
];

const statusBadge: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    pending: { color: '#f59e0b', bg: '#f59e0b20', icon: <FaClock size={12} /> },
    approved: { color: '#22c55e', bg: '#22c55e20', icon: <FaCheckCircle size={12} /> },
    rejected: { color: '#ef4444', bg: '#ef444420', icon: <FaTimesCircle size={12} /> },
};

const Approvals = () => {
    const [requests, setRequests] = useState<Approval[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [search, setSearch] = useState('');
    const [viewItem, setViewItem] = useState<Approval | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        approvalsService.getAll()
            .then(res => {
                const data = res.data || [];
                if (data.length === 0) {
                    return Promise.all(seedData.map(d => approvalsService.create(d)))
                        .then(() => approvalsService.getAll())
                        .then(r2 => setRequests(r2.data || []));
                }
                setRequests(data);
            })
            .catch(() => setRequests([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() =>
        requests
            .filter(r => filter === 'all' || r.status === filter)
            .filter(r => search === '' || r.title.toLowerCase().includes(search.toLowerCase()) || r.requester.toLowerCase().includes(search.toLowerCase())),
        [requests, filter, search],
    );

    const totalPages = pageSize === 0 ? 1 : Math.ceil(filtered.length / pageSize);
    const paginated = useMemo(() => {
        if (pageSize === 0) return filtered;
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages || 1);
    }, [totalPages, page]);

    const handleAction = (id: string, action: 'approved' | 'rejected') => {
        const today = new Date().toISOString().split('T')[0];
        approvalsService.update(id, { status: action, reviewedAt: today } as any)
            .then(() => setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action, reviewedAt: today } : r)))
            .catch(() => {});
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: 'var(--text-muted)' }}>
                <FaSpinner className="spin" /> Loading approvals...
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FaCheckDouble style={{ color: '#8B4513' }} /> Approvals
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    Review and approve material purchases or money requests from site managers
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Total Requests', value: requests.length, color: '#8B4513' },
                    { label: 'Pending', value: requests.filter(r => r.status === 'pending').length, color: '#f59e0b' },
                    { label: 'Approved', value: requests.filter(r => r.status === 'approved').length, color: '#22c55e' },
                    { label: 'Rejected', value: requests.filter(r => r.status === 'rejected').length, color: '#ef4444' },
                ].map((s, i) => (
                    <div key={i} className="content-card" style={{ padding: '0.75rem 1rem', borderLeft: `3px solid ${s.color}` }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }} />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requests..."
                        style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                </div>
                {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        style={{
                            padding: '0.4rem 0.85rem', borderRadius: '20px', border: '1px solid var(--border-color)',
                            background: filter === f ? '#8B4513' : 'transparent',
                            color: filter === f ? '#fff' : 'var(--text-main)',
                            cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize',
                        }}>
                        {f} {f === 'all' ? `(${requests.length})` : `(${requests.filter(r => r.status === f).length})`}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {paginated.map(req => (
                    <div key={req.id} className="content-card" style={{
                        padding: '0.5rem 0.85rem', borderLeft: `3px solid ${statusBadge[req.status].color}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem',
                    }}>
                        <div style={{ flex: 1, minWidth: '160px', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {req.type === 'material' ? <FaTruck size={12} style={{ color: '#3b82f6' }} /> : <FaDollarSign size={12} style={{ color: '#22c55e' }} />}
                            <strong style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{req.title}</strong>
                            <span style={{ fontSize: '0.6rem', padding: '0.05rem 0.35rem', borderRadius: '4px', background: req.type === 'material' ? '#3b82f620' : '#22c55e20', color: req.type === 'material' ? '#3b82f6' : '#22c55e', fontWeight: 600, textTransform: 'capitalize' }}>{req.type}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {req.requester.split('(')[0].trim()} &middot; {req.requestedAt}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {req.type === 'material' ? `${req.items?.reduce((s, i) => s + i.qty, 0) || 0} items` : `RWF ${(req.amount || 0).toLocaleString()}`}
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '10px', background: statusBadge[req.status].bg, color: statusBadge[req.status].color }}>
                                {statusBadge[req.status].icon} {req.status}
                            </span>
                            <button onClick={() => setViewItem(req)}
                                style={{ padding: '0.25rem 0.5rem', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <FaEye size={10} /> View
                            </button>
                            {req.status === 'pending' && (
                                <>
                                    <button onClick={() => handleAction(req.id, 'approved')}
                                        style={{ padding: '0.25rem 0.5rem', borderRadius: '5px', border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                                        <FaCheck size={10} /> Approve
                                    </button>
                                    <button onClick={() => handleAction(req.id, 'rejected')}
                                        style={{ padding: '0.25rem 0.5rem', borderRadius: '5px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                                        <FaTimesCircle size={10} /> Reject
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
                {paginated.length === 0 && (
                    <div className="content-card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No {filter !== 'all' ? filter : ''} requests found.
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', padding: '0.25rem 0', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Showing {pageSize === 0 ? filtered.length : Math.min(pageSize, filtered.length - (page - 1) * pageSize)} of {filtered.length}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Per page:</span>
                        <select
                            className="form-select"
                            style={{ width: 'auto', padding: '0.3rem 1.5rem 0.3rem 0.5rem', fontSize: '0.8rem' }}
                            value={pageSize}
                            onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}
                        >
                            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                            <option value={0}>All</option>
                        </select>
                    </div>
                    {pageSize > 0 && totalPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                                <FaChevronLeft />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button key={p} className={p === page ? 'admin-btn' : 'admin-btn admin-btn--secondary'} style={{ padding: '0.3rem 0.7rem', minWidth: 32, fontSize: '0.85rem' }} onClick={() => setPage(p)}>
                                    {p}
                                </button>
                            ))}
                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                                <FaChevronRight />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {viewItem && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
                    onClick={() => setViewItem(null)}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
                    <div onClick={(e) => e.stopPropagation()} className="content-card" style={{
                        position: 'relative', padding: '2rem', maxWidth: '550px', width: '100%', maxHeight: '80vh', overflowY: 'auto',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{viewItem.title}</h2>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{viewItem.requester}</span>
                            </div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '12px', background: statusBadge[viewItem.status].bg, color: statusBadge[viewItem.status].color }}>
                                {statusBadge[viewItem.status].icon} {viewItem.status}
                            </span>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <strong style={{ fontSize: '0.85rem' }}>Description</strong>
                            <p style={{ fontSize: '0.9rem', margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>{viewItem.description}</p>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <strong style={{ fontSize: '0.85rem' }}>Type</strong>
                            <p style={{ fontSize: '0.9rem', margin: '0.25rem 0 0', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{viewItem.type}</p>
                        </div>

                        {viewItem.type === 'material' && viewItem.items && (
                            <div style={{ marginBottom: '1rem' }}>
                                <strong style={{ fontSize: '0.85rem' }}>Items</strong>
                                <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                    {viewItem.items.map((item, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0.5rem', background: 'var(--bg-body)', borderRadius: '6px', fontSize: '0.85rem' }}>
                                            <span>{item.name}</span>
                                            <span style={{ fontWeight: 600 }}>{item.qty} {item.unit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {viewItem.type === 'money' && viewItem.amount && (
                            <div style={{ marginBottom: '1rem' }}>
                                <strong style={{ fontSize: '0.85rem' }}>Amount</strong>
                                <p style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0.25rem 0 0', color: '#22c55e' }}>RWF {viewItem.amount.toLocaleString()}</p>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <div>
                                <strong style={{ fontSize: '0.85rem' }}>Requested</strong>
                                <p style={{ fontSize: '0.85rem', margin: '0.15rem 0 0', color: 'var(--text-muted)' }}>{viewItem.requestedAt}</p>
                            </div>
                            {viewItem.reviewedAt && (
                                <div>
                                    <strong style={{ fontSize: '0.85rem' }}>Reviewed</strong>
                                    <p style={{ fontSize: '0.85rem', margin: '0.15rem 0 0', color: 'var(--text-muted)' }}>{viewItem.reviewedAt}</p>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setViewItem(null)}
                                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.85rem' }}>
                                Close
                            </button>
                            {viewItem.status === 'pending' && (
                                <>
                                    <button onClick={() => { handleAction(viewItem.id, 'approved'); setViewItem(null); }}
                                        style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                                        Approve
                                    </button>
                                    <button onClick={() => { handleAction(viewItem.id, 'rejected'); setViewItem(null); }}
                                        style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                                        Reject
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Approvals;
