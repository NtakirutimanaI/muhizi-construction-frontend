import { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaTruck, FaSpinner, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { constructionService } from '../../services/constructionService';
import { materialRequestsService } from '../../services/materialRequestsService';
import type { MaterialRequest } from '../../services/materialRequestsService';

const PAGE_SIZES = [5, 10, 15, 20];

const emptyForm = { project: '', material: '', quantity: 0, unit: 'pieces', date: new Date().toISOString().split('T')[0], notes: '' };

const MaterialRequests = () => {
    const [requests, setRequests] = useState<MaterialRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
    const [selectedProject, setSelectedProject] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<MaterialRequest | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        constructionService.getProjects().then(res => setProjects(res.data || [])).catch(() => {});
        materialRequestsService.getAll()
            .then(res => setRequests(res.data || []))
            .catch(() => setRequests([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() =>
        requests.filter(r => {
            if (selectedProject !== 'all' && r.project !== selectedProject) return false;
            return !search.trim() || r.project.toLowerCase().includes(search.toLowerCase()) || r.material.toLowerCase().includes(search.toLowerCase());
        }),
        [requests, selectedProject, search],
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

    const openNew = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
    const openEdit = (r: MaterialRequest) => { setEditing(r); setForm({ project: r.project, material: r.material, quantity: r.quantity, unit: r.unit, date: r.date, notes: r.notes || '' }); setShowModal(true); };
    const close = () => { setShowModal(false); setEditing(null); };

    const save = () => {
        if (!form.project || !form.material) return;
        if (editing) {
            materialRequestsService.update(editing.id, form as any)
                .then(res => setRequests(prev => prev.map(r => r.id === editing.id ? res.data : r)))
                .catch(() => {});
        } else {
            materialRequestsService.create(form as any)
                .then(res => setRequests(prev => [res.data, ...prev]))
                .catch(() => {});
        }
        close();
    };

    const remove = (id: string) => {
        if (!window.confirm('Delete this request?')) return;
        materialRequestsService.delete(id)
            .then(() => setRequests(prev => prev.filter(r => r.id !== id)))
            .catch(() => {});
    };

    const statusColor = (s: string) => s === 'delivered' ? '#22c55e' : s === 'approved' ? '#3b82f6' : s === 'rejected' ? '#ef4444' : '#f59e0b';

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
                    <FaTruck style={{ color: '#8B4513' }} /> Material Requests
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Manage material requests for construction projects</p>
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
                <input value={search} onChange={e => { setPage(1); setSearch(e.target.value); }} placeholder="Search by project or material..." style={{ flex: 1, minWidth: '200px', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                <button onClick={openNew} style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: 'none', background: '#8B4513', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                    <FaPlus size={12} /> New Request
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {paginated.map(r => (
                    <div key={r.id} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '160px', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <FaTruck style={{ color: '#8B4513' }} />
                            <span style={{ fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{r.project}</span>
                            <span style={{ fontSize: '0.6rem', fontWeight: 600, padding: '0.05rem 0.35rem', borderRadius: '4px', background: `${statusColor(r.status)}20`, color: statusColor(r.status), textTransform: 'capitalize' }}>{r.status}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.date} &mdash; {r.material} ({r.quantity} {r.unit}){r.notes ? ` &mdash; ${r.notes}` : ''}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button onClick={() => openEdit(r)} className="admin-icon-btn"><FaEdit /></button>
                            <button onClick={() => remove(r.id)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }}><FaTrash /></button>
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
                            <button onClick={close} style={{ color: 'var(--text-muted)' }}><FaTimes /></button>
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
        </div>
    );
};

export default MaterialRequests;
