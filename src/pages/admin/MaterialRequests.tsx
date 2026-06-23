import { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaTruck, FaSpinner, FaChevronLeft, FaChevronRight, FaCheck, FaBan, FaUser, FaClock, FaCheckDouble } from 'react-icons/fa';
import { constructionService } from '../../services/constructionService';
import { materialRequestsService } from '../../services/materialRequestsService';
import type { MaterialRequest } from '../../services/materialRequestsService';
import { useToast } from '../../context/ToastContext';

const PAGE_SIZES = [5, 10, 15, 20];

const emptyForm = { project: '', material: '', quantity: 0, unit: 'pieces', date: new Date().toISOString().split('T')[0], notes: '' };

const MaterialRequests = () => {
    const { showToast } = useToast();
    const [requests, setRequests] = useState<MaterialRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
    const [selectedProject, setSelectedProject] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [rejectNotes, setRejectNotes] = useState('');
    const [editing, setEditing] = useState<MaterialRequest | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [statusFilter, setStatusFilter] = useState('all');

    const load = () => {
        setLoading(true);
        constructionService.getProjects().then(res => setProjects(res.data || [])).catch(() => {});
        materialRequestsService.getAll()
            .then(res => setRequests(res.data || []))
            .catch(() => setRequests([]))
            .finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

    const filtered = useMemo(() =>
        requests.filter(r => {
            if (selectedProject !== 'all' && r.project !== selectedProject) return false;
            if (statusFilter !== 'all' && r.status !== statusFilter) return false;
            return !search.trim() || r.project.toLowerCase().includes(search.toLowerCase()) || r.material.toLowerCase().includes(search.toLowerCase()) || (r.createdByName || '').toLowerCase().includes(search.toLowerCase());
        }),
        [requests, selectedProject, statusFilter, search],
    );

    const totalPages = pageSize === 0 ? 1 : Math.ceil(filtered.length / pageSize);
    const paginated = useMemo(() => {
        if (pageSize === 0) return filtered;
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    useEffect(() => { if (page > totalPages) setPage(totalPages || 1); }, [totalPages, page]);

    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const approvedCount = requests.filter(r => r.status === 'approved').length;
    const rejectedCount = requests.filter(r => r.status === 'rejected').length;

    const openNew = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
    const openEdit = (r: MaterialRequest) => { setEditing(r); setForm({ project: r.project, material: r.material, quantity: r.quantity, unit: r.unit, date: r.date, notes: r.notes || '' }); setShowModal(true); };
    const close = () => { setShowModal(false); setEditing(null); };

    const save = () => {
        if (!form.project || !form.material) { showToast('Project and material are required', 'error'); return; }
        if (editing) {
            materialRequestsService.update(editing.id, form as any)
                .then(() => { showToast('Request updated', 'success'); load(); })
                .catch(() => showToast('Failed to update', 'error'));
        } else {
            materialRequestsService.create(form as any)
                .then(() => { showToast('Request created', 'success'); load(); })
                .catch(() => showToast('Failed to create', 'error'));
        }
        close();
    };

    const remove = (id: string) => {
        if (!window.confirm('Delete this request?')) return;
        materialRequestsService.delete(id)
            .then(() => { showToast('Request deleted', 'success'); load(); })
            .catch(() => showToast('Failed to delete', 'error'));
    };

    const handleApprove = async (id: string) => {
        try {
            await materialRequestsService.approve(id);
            showToast('Request approved', 'success');
            load();
        } catch { showToast('Failed to approve', 'error'); }
    };

    const handleReject = async () => {
        if (!rejectId) return;
        try {
            await materialRequestsService.reject(rejectId, rejectNotes);
            showToast('Request rejected', 'success');
            setShowRejectModal(false);
            setRejectId(null);
            setRejectNotes('');
            load();
        } catch { showToast('Failed to reject', 'error'); }
    };

    const statusColor = (s: string) => s === 'delivered' ? '#22c55e' : s === 'approved' ? '#1B2042' : s === 'rejected' ? '#ef4444' : '#f59e0b';

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: 'var(--text-muted)' }}>
                <FaSpinner className="spin" /> Loading material requests...
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FaTruck style={{ color: '#1B2042' }} /> Material Requests
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Manage material requests submitted by site managers</p>
            </div>

            <div className="admin-summary-cards" style={{ marginBottom: '1rem' }}>
                <div className="admin-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaTruck style={{ color: '#f59e0b', fontSize: '1.1rem' }} />
                    <div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{pendingCount}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pending</div></div>
                </div>
                <div className="admin-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaCheck style={{ color: '#1B2042', fontSize: '1.1rem' }} />
                    <div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{approvedCount}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Approved</div></div>
                </div>
                <div className="admin-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaBan style={{ color: '#ef4444', fontSize: '1.1rem' }} />
                    <div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{rejectedCount}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rejected</div></div>
                </div>
                <div className="admin-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaCheckDouble style={{ color: '#22c55e', fontSize: '1.1rem' }} />
                    <div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{requests.length}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total</div></div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Project:</span>
                    <select value={selectedProject} onChange={e => { setPage(1); setSelectedProject(e.target.value); }}
                        style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.85rem', minWidth: '160px' }}>
                        <option value="all">All Projects</option>
                        {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                </div>
                <select value={statusFilter} onChange={e => { setPage(1); setStatusFilter(e.target.value); }}
                    style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="delivered">Delivered</option>
                </select>
                <input value={search} onChange={e => { setPage(1); setSearch(e.target.value); }} placeholder="Search project, material, or requester..." style={{ flex: 1, minWidth: '200px', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                <button onClick={openNew} style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: 'none', background: '#1B2042', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                    <FaPlus size={12} /> New Request
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {paginated.map(r => (
                    <div key={r.id} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <FaTruck style={{ color: '#1B2042', flexShrink: 0 }} />
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{r.project}</span>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 600, padding: '0.05rem 0.35rem', borderRadius: '4px', background: `${statusColor(r.status)}20`, color: statusColor(r.status), textTransform: 'capitalize' }}>{r.status}</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    <span>{r.material} ({r.quantity} {r.unit})</span>
                                    <span>&middot;</span>
                                    <span>{r.date}</span>
                                    {r.createdByName && <><span>&middot;</span><span><FaUser size={9} /> {r.createdByName}</span></>}
                                    {r.approvedByName && <><span>&middot;</span><span><FaCheck size={9} /> {r.approvedByName}</span></>}
                                    {r.notes && <><span>&middot;</span><span>{r.notes}</span></>}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                            {r.status === 'pending' && (
                                <>
                                    <button onClick={() => handleApprove(r.id)} title="Approve" style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                                        <FaCheck size={10} /> Approve
                                    </button>
                                    <button onClick={() => { setRejectId(r.id); setRejectNotes(''); setShowRejectModal(true); }} title="Reject" style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                                        <FaBan size={10} /> Reject
                                    </button>
                                </>
                            )}
                            <button onClick={() => openEdit(r)} className="admin-icon-btn" title="Edit"><FaEdit /></button>
                            <button onClick={() => remove(r.id)} className="admin-icon-btn" title="Delete" style={{ color: 'var(--primary-red)' }}><FaTrash /></button>
                        </div>
                    </div>
                ))}
                {paginated.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem', fontSize: '0.85rem' }}>No material requests found.</p>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', padding: '0.25rem 0', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Showing {pageSize === 0 ? filtered.length : Math.min(pageSize, filtered.length - (page - 1) * pageSize)} of {filtered.length}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Per page:</span>
                        <select className="form-select" style={{ width: 'auto', padding: '0.3rem 1.5rem 0.3rem 0.5rem', fontSize: '0.8rem' }}
                            value={pageSize} onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}>
                            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                            <option value={0}>All</option>
                        </select>
                    </div>
                    {pageSize > 0 && totalPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><FaChevronLeft /></button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button key={p} className={p === page ? 'admin-btn' : 'admin-btn admin-btn--secondary'} style={{ padding: '0.3rem 0.7rem', minWidth: 32, fontSize: '0.85rem' }} onClick={() => setPage(p)}>{p}</button>
                            ))}
                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><FaChevronRight /></button>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="content-card" style={{ width: '100%', maxWidth: 500, padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{editing ? 'Edit Request' : 'New Request'}</h3>
                            <button onClick={close} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><FaTimes /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div className="form-group">
                                <label className="form-label">Project</label>
                                <select value={form.project} onChange={e => setForm(p => ({ ...p, project: e.target.value }))} className="form-select">
                                    <option value="">Select project</option>
                                    {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Material</label>
                                    <input value={form.material} onChange={e => setForm(p => ({ ...p, material: e.target.value }))} className="form-input" placeholder="e.g. Cement" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Unit</label>
                                    <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} className="form-select">
                                        <option value="pieces">Pieces</option>
                                        <option value="bags">Bags</option>
                                        <option value="tons">Tons</option>
                                        <option value="liters">Liters</option>
                                        <option value="meters">Meters</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Quantity</label>
                                    <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="form-input" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="form-textarea" rows={2} placeholder="Additional notes..." />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                            <button onClick={close} className="admin-icon-btn" style={{ width: 'auto', padding: '0.5rem 1rem' }}>Cancel</button>
                            <button onClick={save} className="btn-primary"><FaSave /> Save</button>
                        </div>
                    </div>
                </div>
            )}

            {showRejectModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="content-card" style={{ width: '100%', maxWidth: 400, padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}><FaBan style={{ color: '#ef4444' }} /> Reject Request</h3>
                            <button onClick={() => setShowRejectModal(false)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><FaTimes /></button>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Reason (optional)</label>
                            <textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} className="form-textarea" rows={3} placeholder="Why is this request rejected?" />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                            <button onClick={() => setShowRejectModal(false)} className="admin-icon-btn" style={{ width: 'auto', padding: '0.5rem 1rem' }}>Cancel</button>
                            <button onClick={handleReject} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <FaBan size={12} /> Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaterialRequests;
