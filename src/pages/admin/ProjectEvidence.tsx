import { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaTrash, FaTimes, FaSave, FaVideo, FaImage, FaSpinner, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { constructionService } from '../../services/constructionService';
import { projectEvidenceService } from '../../services/projectEvidenceService';
import type { ProjectEvidence } from '../../services/projectEvidenceService';

const PAGE_SIZES = [5, 10, 15, 20];

const emptyForm = { project: '', type: 'image' as 'image' | 'video', title: '', url: '', date: new Date().toISOString().split('T')[0], notes: '' };

const ProjectEvidencePage = () => {
    const [evidences, setEvidences] = useState<ProjectEvidence[]>([]);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
    const [selectedProject, setSelectedProject] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<ProjectEvidence | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [search, setSearch] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        constructionService.getProjects().then(res => setProjects(res.data || [])).catch(() => {});
        projectEvidenceService.getAll()
            .then(res => setEvidences(res.data || []))
            .catch(() => setEvidences([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() =>
        evidences.filter(e => {
            if (selectedProject !== 'all' && e.project !== selectedProject) return false;
            return !search.trim() || e.project.toLowerCase().includes(search.toLowerCase()) || e.title.toLowerCase().includes(search.toLowerCase());
        }),
        [evidences, selectedProject, search],
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
    const openEdit = (e: ProjectEvidence) => { setEditing(e); setForm({ project: e.project, type: e.type, title: e.title, url: e.url, date: e.date, notes: e.notes || '' }); setShowModal(true); };
    const close = () => { setShowModal(false); setEditing(null); setPreviewUrl(null); };

    const save = () => {
        if (!form.project || !form.title || !form.url) return;
        if (editing) {
            projectEvidenceService.update(editing.id, form as any)
                .then(res => setEvidences(prev => prev.map(e => e.id === editing.id ? res.data : e)))
                .catch(() => {});
        } else {
            projectEvidenceService.create(form as any)
                .then(res => setEvidences(prev => [res.data, ...prev]))
                .catch(() => {});
        }
        close();
    };

    const remove = (id: string) => {
        if (!window.confirm('Delete this evidence?')) return;
        projectEvidenceService.delete(id)
            .then(() => setEvidences(prev => prev.filter(e => e.id !== id)))
            .catch(() => {});
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: 'var(--text-muted)' }}>
                <FaSpinner className="spin" /> Loading project evidence...
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FaImage style={{ color: '#8B4513' }} /> Project Evidence
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Upload and manage project photos and videos</p>
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
                <input value={search} onChange={e => { setPage(1); setSearch(e.target.value); }} placeholder="Search by project or title..." style={{ flex: 1, minWidth: '200px', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                <button onClick={openNew} style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: 'none', background: '#8B4513', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                    <FaPlus size={12} /> Add Evidence
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                {paginated.map(e => (
                    <div key={e.id} className="content-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setPreviewUrl(e.url)}>
                            <img src={e.url} alt={e.title} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
                            <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem' }}>
                                {e.type === 'video' ? <FaVideo /> : <FaImage />}
                            </div>
                        </div>
                        <div style={{ padding: '0.75rem' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{e.title}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{e.project} &middot; {e.date}</div>
                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                                <button onClick={() => openEdit(e)} className="admin-icon-btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}><FaImage size={11} /> Edit</button>
                                <button onClick={() => remove(e.id)} className="admin-icon-btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', color: 'var(--primary-red)' }}><FaTrash size={11} /></button>
                            </div>
                        </div>
                    </div>
                ))}
                {paginated.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No evidence found.
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

            {previewUrl && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setPreviewUrl(null)}>
                    <img src={previewUrl} alt="Preview" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '12px' }} />
                </div>
            )}

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="content-card" style={{ width: '100%', maxWidth: 500, padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{editing ? 'Edit Evidence' : 'Add Evidence'}</h3>
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
                                    <label className="form-label">Type</label>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                        <button onClick={() => setForm(p => ({ ...p, type: 'image' }))} style={{ flex: 1, padding: '0.4rem', borderRadius: '6px', border: form.type === 'image' ? '2px solid #8B4513' : '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><FaImage /> Image</button>
                                        <button onClick={() => setForm(p => ({ ...p, type: 'video' }))} style={{ flex: 1, padding: '0.4rem', borderRadius: '6px', border: form.type === 'video' ? '2px solid #8B4513' : '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><FaVideo /> Video</button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="form-input" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="form-input" placeholder="e.g. Foundation pouring complete" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Image URL</label>
                                <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} className="form-input" placeholder="https://example.com/photo.jpg" />
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

export default ProjectEvidencePage;
