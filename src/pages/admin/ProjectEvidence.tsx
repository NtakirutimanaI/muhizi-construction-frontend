import { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaTrash, FaTimes, FaSave, FaVideo, FaImage, FaSpinner, FaChevronLeft, FaChevronRight, FaEye, FaEyeSlash, FaUserTie } from 'react-icons/fa';
import { constructionService } from '../../services/constructionService';
import { projectEvidenceService } from '../../services/projectEvidenceService';
import { uploadService } from '../../services/uploadService';
import { loadPageCache, savePageCache } from '../../utils/pageCache';
import { sitesService, type Site } from '../../services/sitesService';
import type { ProjectEvidence } from '../../services/projectEvidenceService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/ConfirmDialog';

const PAGE_SIZES = [5, 10, 15, 20];
const FIELD_ROLES = ['site_engineer', 'site_manager'];

const emptyForm = { project: '', siteId: '', type: 'image' as 'image' | 'video', title: '', url: '', date: new Date().toISOString().split('T')[0], notes: '' };

const ProjectEvidencePage = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    // Only people who are actually on site upload evidence — the admin's view here is read-only reporting.
    const canUpload = FIELD_ROLES.includes(user?.role || '');
    const [evidences, setEvidences] = useState<ProjectEvidence[]>([]);
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [selectedProject, setSelectedProject] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<ProjectEvidence | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [search, setSearch] = useState('');
    const [previewItem, setPreviewItem] = useState<ProjectEvidence | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [saving, setSaving] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        const cached = loadPageCache<{ evidences: ProjectEvidence[]; projects: { id: string; name: string }[]; sites: Site[] }>('pg_project_evidence');
        if (cached) {
            setEvidences(cached.evidences || []);
            setProjects(cached.projects || []);
            setSites(cached.sites || []);
        } else {
            setLoading(true);
        }
        let freshSites: Site[] = cached?.sites || [];
        sitesService.getAll().then(res => { freshSites = res.data || []; setSites(freshSites); }).catch(() => setSites([]));
        constructionService.getProjects().then(res => {
            const freshProjects = res.data || [];
            setProjects(freshProjects);
            projectEvidenceService.getAll()
                .then(res => {
                    const freshEvidences = res.data || [];
                    setEvidences(freshEvidences);
                    savePageCache('pg_project_evidence', { evidences: freshEvidences, projects: freshProjects, sites: freshSites });
                })
                .catch(() => setEvidences([]))
                .finally(() => setLoading(false));
        }).catch(() => {
            projectEvidenceService.getAll()
                .then(res => setEvidences(res.data || []))
                .catch(() => setEvidences([]))
                .finally(() => setLoading(false));
        });
    }, []);

    const siteById = useMemo(() => new Map(sites.map(s => [s.id, s])), [sites]);

    const filtered = useMemo(() =>
        evidences.filter(e => {
            if (selectedProject !== 'all') {
                // Match through the evidence's site rather than the free-text project
                // label, since that's the only reliable link back to a specific project
                // (and to the site engineer assigned to it).
                const site = e.siteId ? siteById.get(e.siteId) : undefined;
                if (!site || site.projectId !== selectedProject) return false;
            }
            return !search.trim() || e.project.toLowerCase().includes(search.toLowerCase()) || e.title.toLowerCase().includes(search.toLowerCase());
        }),
        [evidences, selectedProject, search, siteById],
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
    const openEdit = (e: ProjectEvidence) => { setEditing(e); setForm({ project: e.project, siteId: e.siteId || '', type: e.type, title: e.title, url: e.url, date: e.date, notes: e.notes || '' }); setShowModal(true); };
    const close = () => { setShowModal(false); setEditing(null); setPreviewItem(null); };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setUploadProgress(0);
        try {
            const result = await uploadService.uploadFile(file, (pct) => setUploadProgress(pct));
            // Trust Cloudinary's own detection of the file over whichever toggle
            // happened to be selected — prevents saving a video under type "image" (or vice versa).
            setForm(p => ({ ...p, url: result.secureUrl, type: result.resourceType === 'video' ? 'video' : 'image' }));
        } catch (err: any) {
            const errMsg = err?.response?.data?.message || err?.message || 'File upload failed';
            showToast(errMsg, 'error');
        } finally {
            setUploading(false);
        }
    };

    const save = async () => {
        if (!form.project || !form.title || !form.url || !form.siteId) {
            showToast('Project, site, title, and URL are required.', 'error');
            return;
        }
        setSaving(true);
        try {
            if (editing) {
                const res = await projectEvidenceService.update(editing.id, form as any);
                setEvidences(prev => prev.map(e => e.id === editing.id ? res.data : e));
                showToast('Evidence updated successfully', 'success');
            } else {
                const res = await projectEvidenceService.create(form as any);
                setEvidences(prev => [res.data, ...prev]);
                showToast('Evidence added successfully', 'success');
            }
            close();
        } catch (e: any) {
            const errMsg = e?.response?.data?.message || e?.message || 'Failed to save evidence';
            showToast(Array.isArray(errMsg) ? errMsg.join('. ') : errMsg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id: string) => {
        try {
            await projectEvidenceService.delete(id);
            setEvidences(prev => prev.filter(e => e.id !== id));
            showToast('Evidence deleted', 'success');
        } catch (e: any) {
            const errMsg = e?.response?.data?.message || e?.message || 'Failed to delete evidence';
            showToast(errMsg, 'error');
        }
    };

    const toggleClientVisible = async (e: ProjectEvidence) => {
        try {
            const res = await projectEvidenceService.update(e.id, { approvedForClient: !e.approvedForClient } as any);
            setEvidences(prev => prev.map(item => item.id === e.id ? res.data : item));
        } catch (err: any) {
            const errMsg = err?.response?.data?.message || err?.message || 'Failed to update visibility';
            showToast(errMsg, 'error');
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FaImage style={{ color: '#1B2042' }} /> Project Evidence
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Upload and manage project photos and videos</p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Project:</span>
                    <select value={selectedProject} onChange={e => { setPage(1); setSelectedProject(e.target.value); }}
                        style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.85rem', minWidth: '160px' }}>
                        <option value="all">All Projects</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <input value={search} onChange={e => { setPage(1); setSearch(e.target.value); }} placeholder="Search by project or title..." style={{ flex: 1, minWidth: '200px', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                {canUpload && (
                    <button onClick={openNew} style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: 'none', background: '#1B2042', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                        <FaPlus size={12} /> Add Evidence
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                {paginated.map(e => {
                    const site = e.siteId ? siteById.get(e.siteId) : undefined;
                    return (
                    <div key={e.id} className="content-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setPreviewItem(e)}>
                            {e.type === 'video' ? (
                                <video src={e.url} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block', background: '#000' }} muted />
                            ) : (
                                <img src={e.url} alt={e.title} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
                            )}
                            <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem' }}>
                                {e.type === 'video' ? <FaVideo /> : <FaImage />}
                            </div>
                        </div>
                        <div style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{e.title}</div>
                                <button onClick={() => toggleClientVisible(e)} title={e.approvedForClient ? 'Visible to clients' : 'Hidden from clients'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: e.approvedForClient ? '#22c55e' : 'var(--text-muted)', fontSize: '0.95rem', padding: '2px' }}>
                                    {e.approvedForClient ? <FaEye /> : <FaEyeSlash />}
                                </button>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{e.project} &middot; {e.date}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                <FaUserTie size={9} />
                                {site ? (
                                    <span>{site.name} &middot; Submitted by {site.assignedEngineerName || 'Unassigned engineer'}</span>
                                ) : (
                                    <span>No site linked</span>
                                )}
                            </div>
                            {e.approvedForClient && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#22c55e', color: '#fff', fontWeight: 700, display: 'inline-block', marginTop: '0.25rem' }}>CLIENT VISIBLE</span>}
                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                                {/* Only the field role that actually submits evidence may edit its content —
                                    admin's role here is oversight (view, approve for client, delete), not authorship. */}
                                {canUpload && <button onClick={() => openEdit(e)} className="admin-icon-btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}><FaImage size={11} /> Edit</button>}
                                <button onClick={() => setConfirmDeleteId(e.id)} className="admin-icon-btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', color: 'var(--primary-red)' }}><FaTrash size={11} /></button>
                            </div>
                        </div>
                    </div>
                    );
                })}
                {paginated.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {loading ? (<><FaSpinner className="spin" style={{ marginRight: 6 }} /> Loading evidence...</>) : 'No evidence found.'}
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

            {previewItem && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setPreviewItem(null)}>
                    {previewItem.type === 'video' ? (
                        <video src={previewItem.url} controls autoPlay style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '12px' }} onClick={ev => ev.stopPropagation()} />
                    ) : (
                        <img src={previewItem.url} alt="Preview" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '12px' }} />
                    )}
                </div>
            )}

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="content-card" style={{ width: '100%', maxWidth: 400, padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                            <h3 style={{ fontWeight: 800, fontSize: '0.95rem' }}>{editing ? 'Edit Evidence' : 'Add Evidence'}</h3>
                            <button onClick={close} disabled={saving} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><FaTimes /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Project</label>
                                    <select value={form.project} onChange={e => setForm(p => ({ ...p, project: e.target.value }))} className="form-select" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}>
                                        <option value="">Select</option>
                                        {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Date</label>
                                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Site</label>
                                <select value={form.siteId} onChange={e => setForm(p => ({ ...p, siteId: e.target.value }))} className="form-select" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}>
                                    <option value="">Select site</option>
                                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Type</label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button onClick={() => setForm(p => ({ ...p, type: 'image' }))} style={{ flex: 1, padding: '0.3rem', borderRadius: '6px', border: form.type === 'image' ? '2px solid #1B2042' : '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}><FaImage /> Image</button>
                                    <button onClick={() => setForm(p => ({ ...p, type: 'video' }))} style={{ flex: 1, padding: '0.3rem', borderRadius: '6px', border: form.type === 'video' ? '2px solid #1B2042' : '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}><FaVideo /> Video</button>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Title</label>
                                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="form-input" placeholder="e.g. Foundation pour" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>{form.type === 'video' ? 'Video' : 'Image'}</label>
                                {form.url ? (
                                    <div>
                                        {form.type === 'video' ? (
                                            <video src={form.url} controls style={{ maxWidth: '100%', maxHeight: 140, borderRadius: 6, display: 'block', marginBottom: 4 }} />
                                        ) : (
                                            <img src={form.url} alt="" style={{ maxWidth: '100%', maxHeight: 140, borderRadius: 6, display: 'block', marginBottom: 4, objectFit: 'cover' }} />
                                        )}
                                        <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem' }} onClick={() => setForm(p => ({ ...p, url: '' }))}>
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <input type="file" accept={form.type === 'video' ? 'video/*' : 'image/*'} onChange={handleFileUpload} disabled={uploading} style={{ fontSize: '0.78rem', maxWidth: '100%' }} />
                                        {uploading && (
                                            <div style={{ marginTop: 6 }}>
                                                <div style={{ width: '100%', maxWidth: 260, height: 6, background: '#eee', borderRadius: 3, overflow: 'hidden' }}>
                                                    <div style={{ width: `${uploadProgress}%`, height: 6, background: 'var(--primary-teal)', borderRadius: 3, transition: 'width 0.3s' }} />
                                                </div>
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Uploading... {uploadProgress}%</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Notes</label>
                                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="form-textarea" rows={1} placeholder="Optional notes" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.75rem' }}>
                            <button onClick={close} disabled={saving} className="admin-icon-btn" style={{ width: 'auto', padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>Cancel</button>
                            <button onClick={save} disabled={saving || uploading} className="btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}><FaSave size={11} /> {saving ? 'Saving...' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={!!confirmDeleteId}
                title="Delete evidence?"
                message="This will permanently remove this evidence entry and its media. This can't be undone."
                onConfirm={() => { if (confirmDeleteId) remove(confirmDeleteId); setConfirmDeleteId(null); }}
                onCancel={() => setConfirmDeleteId(null)}
            />
        </div>
    );
};

export default ProjectEvidencePage;
