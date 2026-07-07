import { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaHardHat, FaSpinner, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { constructionService } from '../../services/constructionService';
import { siteActivitiesService } from '../../services/siteActivitiesService';
import type { SiteActivity } from '../../services/siteActivitiesService';

const PAGE_SIZES = [5, 10, 15, 20];

const emptyForm: Omit<SiteActivity, 'id' | 'isActive' | 'createdAt'> = { project: '', date: new Date().toISOString().split('T')[0], description: '', status: 'planned', workers: 0, notes: '' };

const SiteActivities = () => {
    const [activities, setActivities] = useState<SiteActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
    const [selectedProject, setSelectedProject] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<SiteActivity | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        constructionService.getProjects().then(res => setProjects(res.data || [])).catch(() => {});
        siteActivitiesService.getAllAdmin()
            .then(res => setActivities(res.data || []))
            .catch(() => setActivities([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() =>
        activities.filter(a => {
            if (selectedProject !== 'all' && a.project !== selectedProject) return false;
            return !search.trim() || a.project.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
        }),
        [activities, selectedProject, search],
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
    const openEdit = (a: SiteActivity) => { setEditing(a); setForm({ project: a.project, date: a.date, description: a.description, status: a.status, workers: a.workers, notes: a.notes || '' }); setShowModal(true); };
    const close = () => { setShowModal(false); setEditing(null); };

    const save = () => {
        if (!form.project || !form.date) return;
        if (editing) {
            siteActivitiesService.update(editing.id, form as any)
                .then(res => setActivities(prev => prev.map(a => a.id === editing.id ? res.data : a)))
                .catch(() => {});
        } else {
            siteActivitiesService.create(form as any)
                .then(res => setActivities(prev => [res.data, ...prev]))
                .catch(() => {});
        }
        close();
    };

    const remove = (id: string) => {
        if (!window.confirm('Delete this activity?')) return;
        siteActivitiesService.delete(id)
            .then(() => setActivities(prev => prev.filter(a => a.id !== id)))
            .catch(() => {});
    };

    const statusColor = (s: string) => s === 'completed' ? '#22c55e' : s === 'in_progress' ? '#1B2042' : '#f59e0b';

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: 'var(--text-muted)' }}>
                <FaSpinner className="spin" /> Loading site activities...
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FaHardHat style={{ color: '#1B2042' }} /> Site Activities
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Track daily construction site activities</p>
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
                <input value={search} onChange={e => { setPage(1); setSearch(e.target.value); }} placeholder="Search by project or description..." style={{ flex: 1, minWidth: '200px', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                <button onClick={openNew} style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: 'none', background: '#1B2042', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                    <FaPlus size={12} /> New Activity
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {paginated.map(a => (
                    <div key={a.id} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '160px', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <FaHardHat style={{ color: '#1B2042' }} />
                            <span style={{ fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{a.project}</span>
                            <span style={{ fontSize: '0.6rem', fontWeight: 600, padding: '0.05rem 0.35rem', borderRadius: '4px', background: `${statusColor(a.status)}20`, color: statusColor(a.status), textTransform: 'capitalize' }}>{a.status.replace('_', ' ')}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.date} &mdash; {a.description} {a.workers > 0 && `(${a.workers} workers)`}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button onClick={() => openEdit(a)} className="admin-icon-btn"><FaEdit /></button>
                            <button onClick={() => remove(a.id)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }}><FaTrash /></button>
                        </div>
                    </div>
                ))}
                {paginated.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem', fontSize: '0.85rem' }}>No activities found.</p>}
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
                            <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{editing ? 'Edit Activity' : 'New Activity'}</h3>
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
                                    <label className="form-label">Date</label>
                                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))} className="form-select">
                                        <option value="planned">Planned</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="form-textarea" rows={2} placeholder="What was done?" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Workers On Site</label>
                                <input type="number" value={form.workers || ''} onChange={e => setForm(p => ({ ...p, workers: e.target.value === '' ? '' : parseInt(e.target.value) || '' }))} className="form-input" placeholder="e.g. 15" />
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

export default SiteActivities;
