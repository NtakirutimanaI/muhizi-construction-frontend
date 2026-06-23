import { useState, useMemo, useEffect } from 'react';
import {
    FaCheckDouble, FaCheckCircle, FaTimesCircle, FaClock,
    FaTruck, FaDollarSign, FaEye, FaCheck, FaChevronLeft,
    FaChevronRight, FaSpinner, FaPlus, FaTrash, FaTimes
} from 'react-icons/fa';
import { approvalsService } from '../../services/approvalsService';
import type { Approval } from '../../services/approvalsService';
import { useToast } from '../../context/ToastContext';

const PAGE_SIZES = [5, 10, 15, 20];

const safeBadge = (status: string) => {
    const map: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
        pending: { color: '#f59e0b', bg: '#f59e0b20', icon: <FaClock size={12} /> },
        approved: { color: '#22c55e', bg: '#22c55e20', icon: <FaCheckCircle size={12} /> },
        rejected: { color: '#ef4444', bg: '#ef444420', icon: <FaTimesCircle size={12} /> },
    };
    return map[status] || { color: '#6b7280', bg: '#6b728020', icon: <FaClock size={12} /> };
};

const LOCAL: Approval[] = [
    { id: 's1', type: 'material', title: 'Cement Order — 200 Bags', requester: 'Jean Niyonzima (Site Manager)', items: [{ name: 'Portland Cement', qty: 200, unit: 'bags' }], description: 'Foundation work on Kigali Heights', status: 'pending', requestedAt: '2026-06-18' },
    { id: 's2', type: 'money', title: 'Worker Transport Advance', requester: 'Jean Niyonzima (Site Manager)', amount: 150000, description: 'Monthly transport for 15 workers', status: 'pending', requestedAt: '2026-06-19' },
    { id: 's3', type: 'material', title: 'Steel Reinforcement Bars', requester: 'Patrick Habimana (Site Manager)', items: [{ name: '12mm Rebar', qty: 500, unit: 'units' }, { name: '16mm Rebar', qty: 300, unit: 'units' }], description: 'Structural columns', status: 'approved', requestedAt: '2026-06-15', reviewedAt: '2026-06-16' },
    { id: 's4', type: 'money', title: 'Equipment Repair Fund', requester: 'Patrick Habimana (Site Manager)', amount: 350000, description: 'Mixer machine repair', status: 'rejected', requestedAt: '2026-06-14', reviewedAt: '2026-06-15' },
    { id: 's5', type: 'material', title: 'Sand & Gravel Supply', requester: 'Jean Niyonzima (Site Manager)', items: [{ name: 'Sharp Sand', qty: 10, unit: 'tons' }, { name: 'Gravel 3/4', qty: 8, unit: 'tons' }], description: 'Concreting works', status: 'pending', requestedAt: '2026-06-20' },
];

const emptyF = () => ({ type: 'material' as const, title: '', requester: '', amount: undefined as number | undefined, items: [{ name: '', qty: 1, unit: 'units' }], description: '', status: 'pending' as const, requestedAt: new Date().toISOString().split('T')[0] });

const Approvals = () => {
    const [requests, setRequests] = useState<Approval[]>(LOCAL);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [search, setSearch] = useState('');
    const [viewItem, setViewItem] = useState<Approval | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState(emptyF());
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        approvalsService.getAll()
            .then(res => {
                const d = res.data || [];
                if (d.length) setRequests(d);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const byStatus = useMemo(() => ({
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
    }), [requests]);

    const filtered = useMemo(() => {
        let arr = requests;
        if (filter !== 'all') arr = arr.filter(r => r.status === filter);
        if (search) arr = arr.filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || r.requester.toLowerCase().includes(search.toLowerCase()));
        return arr;
    }, [requests, filter, search]);

    const totalPages = pageSize ? Math.ceil(filtered.length / pageSize) : 1;
    const paginated = pageSize ? filtered.slice((page - 1) * pageSize, page * pageSize) : filtered;

    useEffect(() => {
        const tp = pageSize ? Math.ceil(filtered.length / pageSize) : 1;
        if (page > tp) setPage(tp || 1);
    }, [filtered.length, pageSize]);

    const act = (id: string, action: 'approved' | 'rejected') => {
        const today = new Date().toISOString().split('T')[0];
        if (id.startsWith('s')) {
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action, reviewedAt: today } : r));
            showToast(`${action}`, 'success');
            return;
        }
        approvalsService.update(id, { status: action, reviewedAt: today })
            .then(() => { setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action, reviewedAt: today } : r)); showToast(`${action}`, 'success'); })
            .catch(() => showToast('Failed', 'error'));
    };

    const create = () => {
        if (!form.title || !form.requester || !form.description || !form.requestedAt) { showToast('Fill required fields', 'error'); return; }
        if (form.type === 'money' && (!form.amount || form.amount <= 0)) { showToast('Enter amount', 'error'); return; }
        if (form.type === 'material') {
            const vi = form.items.filter(i => i.name.trim());
            if (!vi.length) { showToast('Add an item', 'error'); return; }
            form.items = vi;
        }
        setSaving(true);
        approvalsService.create(form)
            .then(res => { showToast('Created', 'success'); setShowCreate(false); setForm(emptyF()); setRequests(prev => [res.data, ...prev]); })
            .catch(() => showToast('Failed', 'error'))
            .finally(() => setSaving(false));
    };

    if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'gray', fontSize: '1.2rem' }}><FaSpinner className="spin" /> Loading...</div>;

    const st = (s: string) => safeBadge(s);

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}><FaCheckDouble style={{ color: '#1B2042' }} /> Approvals</h2>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button onClick={() => { setForm(emptyF()); setShowCreate(true); }}
                        style={{ padding: '0.35rem 0.8rem', borderRadius: '6px', border: 'none', background: '#1B2042', color: '#fff', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <FaPlus size={10} /> New
                    </button>
                    {(['total', 'pending', 'approved', 'rejected'] as const).map(k => (
                        <div key={k} className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: k === 'total' ? '#1B2042' : k === 'pending' ? '#f59e0b' : k === 'approved' ? '#22c55e' : '#ef4444', color: '#fff' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{byStatus[k]}</div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.85, textTransform: 'capitalize' }}>{k}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'gray' }}>Requests</span>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input type="text" className="form-input" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 300 }} />
                        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                                style={{ padding: '0.25rem 0.7rem', borderRadius: '12px', border: '1px solid #ddd', background: filter === f ? '#1B2042' : 'transparent', color: filter === f ? '#fff' : '#333', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize' }}>
                                {f} ({f === 'all' ? requests.length : requests.filter(r => r.status === f).length})
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead><tr><th>Title</th><th>Requester</th><th>Type</th><th>Details</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {paginated.map(req => (
                                <tr key={req.id}>
                                    <td><strong>{req.title}</strong></td>
                                    <td>{req.requester.split('(')[0].trim()}</td>
                                    <td><span style={{ fontSize: '0.72rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: req.type === 'material' ? '#1B204220' : '#22c55e20', color: req.type === 'material' ? '#1B2042' : '#22c55e', fontWeight: 600 }}>{req.type === 'material' ? <FaTruck size={10} /> : <FaDollarSign size={10} />} {req.type}</span></td>
                                    <td>{req.type === 'material' ? `${req.items?.reduce((s, i) => s + i.qty, 0) || 0} items` : `RWF ${(req.amount || 0).toLocaleString()}`}</td>
                                    <td>{req.requestedAt}</td>
                                    <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '10px', background: st(req.status).bg, color: st(req.status).color }}>{st(req.status).icon} {req.status}</span></td>
                                    <td><div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button onClick={() => setViewItem(req)} style={{ padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid #ddd', background: 'transparent', cursor: 'pointer' }}><FaEye size={11} /></button>
                                        {req.status === 'pending' && (<><button onClick={() => act(req.id, 'approved')} style={{ padding: '0.2rem 0.4rem', borderRadius: '4px', border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}><FaCheck size={9} /> Approve</button><button onClick={() => act(req.id, 'rejected')} style={{ padding: '0.2rem 0.4rem', borderRadius: '4px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}><FaTimesCircle size={9} /> Reject</button></>)}
                                    </div></td>
                                </tr>
                            ))}
                            {!paginated.length && <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'gray' }}>{search ? 'No match' : 'No requests yet.'}</td></tr>}
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

            {viewItem && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={() => setViewItem(null)}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
                    <div onClick={e => e.stopPropagation()} className="admin-modal" style={{ position: 'relative', padding: '2rem', maxWidth: '550px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div><h3 style={{ margin: 0 }}>{viewItem.title}</h3><span style={{ fontSize: '0.8rem', color: 'gray' }}>{viewItem.requester}</span></div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '12px', background: st(viewItem.status).bg, color: st(viewItem.status).color }}>{st(viewItem.status).icon} {viewItem.status}</span>
                        </div>
                        <div style={{ marginBottom: '1rem' }}><strong>Description</strong><p style={{ color: 'gray' }}>{viewItem.description}</p></div>
                        <div><strong>Type</strong><p style={{ color: 'gray', textTransform: 'capitalize' }}>{viewItem.type}</p></div>
                        {viewItem.type === 'material' && viewItem.items?.length ? <div style={{ margin: '1rem 0' }}><strong>Items</strong>{viewItem.items.map((item, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0.5rem', background: '#f5f5f5', borderRadius: '6px', marginTop: '0.25rem' }}><span>{item.name}</span><span style={{ fontWeight: 600 }}>{item.qty} {item.unit}</span></div>)}</div> : null}
                        {viewItem.type === 'money' && viewItem.amount ? <div style={{ margin: '1rem 0' }}><strong>Amount</strong><p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#22c55e' }}>RWF {viewItem.amount.toLocaleString()}</p></div> : null}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', margin: '1rem 0' }}>
                            <div><strong>Requested</strong><p style={{ color: 'gray' }}>{viewItem.requestedAt}</p></div>
                            {viewItem.reviewedAt ? <div><strong>Reviewed</strong><p style={{ color: 'gray' }}>{viewItem.reviewedAt}</p></div> : null}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setViewItem(null)} style={{ padding: '0.4rem 1rem', borderRadius: '6px', border: '1px solid #ddd', background: 'transparent', cursor: 'pointer' }}>Close</button>
                            {viewItem.status === 'pending' && (<><button onClick={() => { act(viewItem.id, 'approved'); setViewItem(null); }} style={{ padding: '0.4rem 1rem', borderRadius: '6px', border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Approve</button><button onClick={() => { act(viewItem.id, 'rejected'); setViewItem(null); }} style={{ padding: '0.4rem 1rem', borderRadius: '6px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Reject</button></>)}
                        </div>
                    </div>
                </div>
            )}

            {showCreate && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={() => !saving && setShowCreate(false)}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
                    <div onClick={e => e.stopPropagation()} className="admin-modal" style={{ position: 'relative', padding: '2rem', maxWidth: '600px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
                        <h3 style={{ marginTop: 0 }}><FaPlus style={{ color: '#1B2042' }} size={14} /> New Request</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div><label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Type</label><select className="form-select" value={form.type} onChange={e => setForm(prev => ({ ...prev, type: e.target.value as 'material' | 'money' }))} style={{ width: '100%', padding: '0.4rem' }}><option value="material">Material</option><option value="money">Money</option></select></div>
                            <div><label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Title</label><input type="text" className="form-input" value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} style={{ width: '100%', padding: '0.4rem' }} /></div>
                            <div><label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Requester</label><input type="text" className="form-input" value={form.requester} onChange={e => setForm(prev => ({ ...prev, requester: e.target.value }))} style={{ width: '100%', padding: '0.4rem' }} /></div>
                            <div><label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Description</label><textarea className="form-input" value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} rows={3} style={{ width: '100%', padding: '0.4rem', resize: 'vertical' }} /></div>
                            {form.type === 'money' ? <div><label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Amount (RWF)</label><input type="number" className="form-input" value={form.amount || ''} onChange={e => setForm(prev => ({ ...prev, amount: Number(e.target.value) }))} style={{ width: '100%', padding: '0.4rem' }} /></div> : null}
                            {form.type === 'material' && <div><label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Items</label>{form.items.map((item, idx) => <div key={idx} style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem' }}><input type="text" className="form-input" value={item.name} onChange={e => { const items = [...form.items]; items[idx] = { ...items[idx], name: e.target.value }; setForm(prev => ({ ...prev, items })); }} placeholder="Name" style={{ flex: 1, padding: '0.3rem' }} /><input type="number" className="form-input" value={item.qty} onChange={e => { const items = [...form.items]; items[idx] = { ...items[idx], qty: Number(e.target.value) }; setForm(prev => ({ ...prev, items })); }} style={{ width: 60, padding: '0.3rem' }} /><input type="text" className="form-input" value={item.unit} onChange={e => { const items = [...form.items]; items[idx] = { ...items[idx], unit: e.target.value }; setForm(prev => ({ ...prev, items })); }} placeholder="unit" style={{ width: 70, padding: '0.3rem' }} /><button onClick={() => { const items = form.items.filter((_, i) => i !== idx); setForm(prev => ({ ...prev, items: items.length ? items : [{ name: '', qty: 1, unit: 'units' }] })); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><FaTrash size={10} /></button></div>)}<button onClick={() => setForm(prev => ({ ...prev, items: [...prev.items, { name: '', qty: 1, unit: 'units' }] }))} style={{ marginTop: '0.25rem', padding: '0.15rem 0.5rem', border: '1px solid #ddd', borderRadius: '4px', background: 'transparent', cursor: 'pointer', fontSize: '0.7rem' }}><FaPlus size={8} /> Add</button></div>}
                            <div><label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Date</label><input type="date" className="form-input" value={form.requestedAt} onChange={e => setForm(prev => ({ ...prev, requestedAt: e.target.value }))} style={{ width: '100%', padding: '0.4rem' }} /></div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
                            <button onClick={() => setShowCreate(false)} disabled={saving} style={{ padding: '0.4rem 1rem', borderRadius: '6px', border: '1px solid #ddd', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={create} disabled={saving} style={{ padding: '0.4rem 1.2rem', borderRadius: '6px', border: 'none', background: '#1B2042', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>{saving ? <><FaSpinner className="spin" /> Saving...</> : 'Submit'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Approvals;
