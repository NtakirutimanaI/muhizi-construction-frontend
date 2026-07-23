import { useState, useMemo, useEffect } from 'react';
import {
    FaFileAlt, FaPlus, FaEdit, FaTrash, FaSpinner, FaSearch, FaFilter,
    FaCheckCircle, FaEyeSlash, FaEye, FaProjectDiagram, FaUser, FaImage, FaVideo, FaTimes,
} from 'react-icons/fa';
import { clientReportsService, type ClientReport, type ClientReportMedia } from '../../services/clientReportsService';
import { constructionService, type Project } from '../../services/constructionService';
import { authService } from '../../services/authService';
import { uploadService } from '../../services/uploadService';
import { useToast } from '../../context/ToastContext';
import { loadPageCache, savePageCache } from '../../utils/pageCache';
import ConfirmDialog from '../../components/ConfirmDialog';

interface PortalUserOption {
    id: string; email: string; role: string;
    profile?: { firstName?: string; lastName?: string };
}

const btnStyle = (bg: string, border?: string): React.CSSProperties => ({
    padding: '0.5rem 1rem', borderRadius: 7,
    border: border ? `1px solid ${border}` : 'none',
    background: bg, color: bg === 'var(--bg-white)' ? 'var(--text-muted)' : '#fff',
    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
});

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.7rem', borderRadius: 7,
    border: '1px solid var(--border-color)', fontSize: '0.82rem',
    background: 'var(--bg-white)', color: 'var(--text-main)', boxSizing: 'border-box',
};

const clientLabel = (u: PortalUserOption) => `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim() || u.email;

const emptyForm = { clientUserId: '', projectId: '', title: '', description: '', progressPercentage: '', media: [] as ClientReportMedia[] };

const ClientReports = () => {
    const { showToast } = useToast();

    const [reports, setReports] = useState<ClientReport[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [portalUsers, setPortalUsers] = useState<PortalUserOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');
    const [projectFilter, setProjectFilter] = useState('all');
    const [search, setSearch] = useState('');

    const [showModal, setShowModal] = useState<'create' | 'edit' | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewMedia, setPreviewMedia] = useState<ClientReportMedia | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const cached = loadPageCache<{ reports: ClientReport[]; projects: Project[]; portalUsers: PortalUserOption[] }>('pg_client_reports');
            if (cached) { setReports(cached.reports); setProjects(cached.projects); setPortalUsers(cached.portalUsers || []); }
            const [reportsRes, projectsRes, usersRes] = await Promise.all([
                clientReportsService.getAll(),
                constructionService.getProjects(),
                authService.getAllUsers().catch(() => []),
            ]);
            const reportsData = reportsRes.data || [];
            const projectsData = (projectsRes.data || []) as Project[];
            const usersData = (usersRes || []) as PortalUserOption[];
            setReports(reportsData);
            setProjects(projectsData);
            setPortalUsers(usersData);
            savePageCache('pg_client_reports', { reports: reportsData, projects: projectsData, portalUsers: usersData });
        } catch { showToast('Failed to load client reports', 'error'); }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    // Only projects with a client assigned can have a client-facing report.
    const clientProjects = useMemo(() => projects.filter(p => (p as any).clientUserId), [projects]);

    const clientUsers = useMemo(() => portalUsers.filter(u => u.role === 'client'), [portalUsers]);

    // Only clients who actually have a project to report on can be picked in the form.
    const reportableClients = useMemo(
        () => clientUsers.filter(u => clientProjects.some(p => (p as any).clientUserId === u.id)),
        [clientUsers, clientProjects]
    );

    const projectsForClient = (clientUserId: string) => clientProjects.filter(p => (p as any).clientUserId === clientUserId);

    const clientNameForProject = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        const client = project ? portalUsers.find(u => u.id === (project as any).clientUserId) : undefined;
        return client ? clientLabel(client) : null;
    };

    const stats = useMemo(() => ({
        total: reports.length,
        published: reports.filter(r => r.status === 'published').length,
        draft: reports.filter(r => r.status === 'draft').length,
    }), [reports]);

    const filtered = useMemo(() => {
        let arr = reports;
        if (filter !== 'all') arr = arr.filter(r => r.status === filter);
        if (projectFilter !== 'all') arr = arr.filter(r => r.projectId === projectFilter);
        if (search) {
            const q = search.toLowerCase();
            arr = arr.filter(r => r.title.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q));
        }
        return arr;
    }, [reports, filter, projectFilter, search]);

    const openCreate = () => {
        // Client/project left blank on purpose — force an explicit choice of who this goes to.
        setForm(emptyForm);
        setMediaType('image');
        setEditingId(null);
        setShowModal('create');
    };

    const openEdit = (r: ClientReport) => {
        const project = projects.find(p => p.id === r.projectId);
        setForm({
            clientUserId: (project as any)?.clientUserId || '',
            projectId: r.projectId,
            title: r.title,
            description: r.description || '',
            progressPercentage: String(r.progressPercentage ?? ''),
            media: r.media || [],
        });
        setMediaType('image');
        setEditingId(r.id);
        setShowModal('edit');
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setUploadProgress(0);
        try {
            const result = await uploadService.uploadFile(file, (pct) => setUploadProgress(pct));
            const type: 'image' | 'video' = result.resourceType === 'video' ? 'video' : 'image';
            setForm(p => ({ ...p, media: [...p.media, { url: result.secureUrl, type }] }));
        } catch (err: any) {
            showToast(err?.response?.data?.message || err?.message || 'File upload failed', 'error');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const removeMedia = (index: number) => {
        setForm(p => ({ ...p, media: p.media.filter((_, i) => i !== index) }));
    };

    const handleSave = async (publish: boolean) => {
        if (!form.clientUserId) { showToast('Choose which client this report is for', 'error'); return; }
        if (!form.projectId) { showToast('Select a project', 'error'); return; }
        if (!form.title.trim()) { showToast('Title is required', 'error'); return; }
        const pct = form.progressPercentage === '' ? undefined : Number(form.progressPercentage);
        if (pct !== undefined && (isNaN(pct) || pct < 0 || pct > 100)) { showToast('Progress must be between 0 and 100', 'error'); return; }

        setActionLoading('save');
        try {
            if (showModal === 'edit' && editingId) {
                await clientReportsService.update(editingId, {
                    title: form.title,
                    description: form.description || undefined,
                    progressPercentage: pct,
                    status: publish ? 'published' : undefined,
                    media: form.media,
                });
                showToast(publish ? 'Report published' : 'Report updated', 'success');
            } else {
                await clientReportsService.create({
                    projectId: form.projectId,
                    title: form.title,
                    description: form.description || undefined,
                    progressPercentage: pct,
                    status: publish ? 'published' : 'draft',
                    media: form.media,
                });
                showToast(publish ? 'Report published to client' : 'Draft saved', 'success');
            }
            setShowModal(null);
            await load();
        } catch { showToast('Failed to save report', 'error'); }
        setActionLoading(null);
    };

    const toggleStatus = async (r: ClientReport) => {
        setActionLoading(r.id);
        try {
            await clientReportsService.update(r.id, { status: r.status === 'published' ? 'draft' : 'published' });
            showToast(r.status === 'published' ? 'Report unpublished' : 'Report published to client', 'success');
            await load();
        } catch { showToast('Failed to update status', 'error'); }
        setActionLoading(null);
    };

    const handleDelete = async (id: string) => {
        setActionLoading(id);
        try { await clientReportsService.delete(id); showToast('Report deleted', 'success'); await load(); }
        catch { showToast('Failed to delete', 'error'); }
        setActionLoading(null);
    };

    const statCard = (icon: React.ReactNode, label: string, value: string | number, color: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '0.8rem 1rem', flex: '1 1 180px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
            <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{value}</div>
            </div>
        </div>
    );

    return (
        <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                        <FaFileAlt style={{ verticalAlign: 'middle', marginRight: 8, color: '#6c3096' }} />Client Reports
                    </h1>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                        Write progress reports for clients. Only published reports are visible to them.
                    </p>
                </div>
                <button onClick={openCreate} disabled={clientProjects.length === 0} style={{ ...btnStyle('#6c3096'), display: 'flex', alignItems: 'center', gap: 6, opacity: clientProjects.length === 0 ? 0.5 : 1 }}>
                    <FaPlus /> New Report
                </button>
            </div>

            {clientProjects.length === 0 && !loading && (
                <div style={{ background: '#f59e0b18', border: '1px solid #f59e0b', borderRadius: 10, padding: '0.8rem 1rem', marginBottom: '1.2rem', fontSize: '0.8rem', color: '#b45309' }}>
                    No projects have a client assigned yet. Assign a client to a project in Sites before writing a report.
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
                {statCard(<FaFileAlt />, 'Total Reports', stats.total, '#6c3096')}
                {statCard(<FaCheckCircle />, 'Published', stats.published, '#22c55e')}
                {statCard(<FaEyeSlash />, 'Drafts', stats.draft, '#f59e0b')}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '0.4rem 0.7rem', flex: '1 1 200px' }}>
                    <FaSearch size={13} style={{ color: 'var(--text-muted)' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports..." style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.82rem', width: '100%', color: 'var(--text-main)' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '0.4rem 0.7rem' }}>
                    <FaFilter size={13} style={{ color: 'var(--text-muted)' }} />
                    <select value={filter} onChange={e => setFilter(e.target.value as any)} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.82rem', color: 'var(--text-main)' }}>
                        <option value="all">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '0.4rem 0.7rem' }}>
                    <FaProjectDiagram size={13} style={{ color: 'var(--text-muted)' }} />
                    <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.82rem', color: 'var(--text-main)' }}>
                        <option value="all">All Projects</option>
                        {clientProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}><FaSpinner className="animate-spin" size={24} /> Loading...</div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}><FaFileAlt size={40} style={{ opacity: 0.3, marginBottom: 12 }} /><p>No client reports found.</p></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {filtered.map(r => (
                        <div key={r.id} style={{ background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '0.9rem 1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 300px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)' }}>{r.title}</span>
                                        <span style={{
                                            fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 12, textTransform: 'capitalize',
                                            background: r.status === 'published' ? '#22c55e18' : '#f59e0b18',
                                            color: r.status === 'published' ? '#22c55e' : '#f59e0b',
                                        }}>{r.status}</span>
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, marginBottom: 2 }}>
                                        <FaProjectDiagram size={10} style={{ marginRight: 4 }} />{r.project?.name || projects.find(p => p.id === r.projectId)?.name || 'Unknown project'}
                                    </div>
                                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                                        <FaUser size={9} style={{ marginRight: 4 }} />Submitted to: {clientNameForProject(r.projectId) || 'Unknown client'}
                                    </div>
                                    {r.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 6px' }}>{r.description}</p>}
                                    {r.media && r.media.length > 0 && (
                                        <div style={{ display: 'flex', gap: 5, marginBottom: 6, flexWrap: 'wrap' }}>
                                            {r.media.slice(0, 5).map((m, i) => (
                                                <div key={i} onClick={() => setPreviewMedia(m)} style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-color)', cursor: 'pointer', position: 'relative', background: '#000' }}>
                                                    {m.type === 'video' ? <video src={m.url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                                </div>
                                            ))}
                                            {r.media.length > 5 && (
                                                <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                                    +{r.media.length - 5}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: 100, height: 5, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                                            <div style={{ width: `${r.progressPercentage || 0}%`, height: '100%', background: '#6c3096', borderRadius: 3 }} />
                                        </div>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6c3096' }}>{r.progressPercentage || 0}%</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                                    <button onClick={() => toggleStatus(r)} disabled={actionLoading === r.id} title={r.status === 'published' ? 'Unpublish' : 'Publish to client'}
                                        style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${r.status === 'published' ? '#f59e0b' : '#22c55e'}`, background: r.status === 'published' ? '#f59e0b18' : '#22c55e18', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.status === 'published' ? '#f59e0b' : '#22c55e' }}>
                                        {actionLoading === r.id ? <FaSpinner className="animate-spin" size={12} /> : r.status === 'published' ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                                    </button>
                                    <button onClick={() => openEdit(r)} title="Edit" style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid var(--border-color)', background: 'var(--bg-white)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><FaEdit size={12} /></button>
                                    <button onClick={() => setConfirmDeleteId(r.id)} title="Delete" style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid #ef4444', background: '#ef444418', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}><FaTrash size={12} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-white)', borderRadius: 12, padding: '1.5rem', width: '90%', maxWidth: 520, border: '1px solid var(--border-color)', maxHeight: '90vh', overflow: 'auto' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                            <FaFileAlt style={{ marginRight: 8, color: '#6c3096' }} />{showModal === 'edit' ? 'Edit Report' : 'New Client Report'}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                                    <FaUser size={10} style={{ marginRight: 4 }} />Submit to (Client) *
                                </label>
                                <select
                                    value={form.clientUserId}
                                    disabled={showModal === 'edit'}
                                    onChange={e => {
                                        const clientUserId = e.target.value;
                                        const clientsProjects = projectsForClient(clientUserId);
                                        setForm(p => ({ ...p, clientUserId, projectId: clientsProjects.length === 1 ? clientsProjects[0].id : '' }));
                                    }}
                                    style={{ ...inputStyle, opacity: showModal === 'edit' ? 0.6 : 1 }}
                                >
                                    <option value="">Select client...</option>
                                    {reportableClients.map(u => <option key={u.id} value={u.id}>{clientLabel(u)} ({u.email})</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Project *</label>
                                <select
                                    value={form.projectId}
                                    onChange={e => setForm({ ...form, projectId: e.target.value })}
                                    disabled={showModal === 'edit' || !form.clientUserId}
                                    style={{ ...inputStyle, opacity: (showModal === 'edit' || !form.clientUserId) ? 0.6 : 1 }}
                                >
                                    <option value="">{form.clientUserId ? 'Select project...' : 'Select a client first'}</option>
                                    {projectsForClient(form.clientUserId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            {form.clientUserId && form.projectId && (
                                <div style={{ fontSize: '0.76rem', color: '#22c55e', background: '#22c55e14', border: '1px solid #22c55e40', borderRadius: 7, padding: '0.45rem 0.7rem' }}>
                                    This report will be sent to <strong>{clientLabel(reportableClients.find(u => u.id === form.clientUserId)!)}</strong> once published.
                                </div>
                            )}
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Title *</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Monthly Progress Report - January" style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} placeholder="What progress was made, what's next..." style={{ ...inputStyle, resize: 'vertical' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Overall Progress (%)</label>
                                <input type="number" min="0" max="100" value={form.progressPercentage} onChange={e => setForm({ ...form, progressPercentage: e.target.value })} placeholder="0-100" style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Photos / Videos</label>
                                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                                    <button type="button" onClick={() => setMediaType('image')} style={{ flex: 1, padding: '0.35rem', borderRadius: 6, border: mediaType === 'image' ? '2px solid #6c3096' : '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-main)' }}><FaImage /> Photo</button>
                                    <button type="button" onClick={() => setMediaType('video')} style={{ flex: 1, padding: '0.35rem', borderRadius: 6, border: mediaType === 'video' ? '2px solid #6c3096' : '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-main)' }}><FaVideo /> Video</button>
                                </div>
                                <input type="file" accept={mediaType === 'video' ? 'video/*' : 'image/*'} onChange={handleMediaUpload} disabled={uploading} style={{ fontSize: '0.78rem', maxWidth: '100%' }} />
                                {uploading && (
                                    <div style={{ marginTop: 6 }}>
                                        <div style={{ width: '100%', height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                                            <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#6c3096', borderRadius: 3, transition: 'width 0.3s' }} />
                                        </div>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Uploading... {uploadProgress}%</span>
                                    </div>
                                )}
                                {form.media.length > 0 && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 6, marginTop: 8 }}>
                                        {form.media.map((m, i) => (
                                            <div key={i} style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-color)', aspectRatio: '1', background: '#000' }}>
                                                {m.type === 'video' ? (
                                                    <video src={m.url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                )}
                                                <button type="button" onClick={() => removeMedia(i)} title="Remove"
                                                    style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <FaTimes size={9} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1.2rem', flexWrap: 'wrap' }}>
                            <button onClick={() => setShowModal(null)} style={btnStyle('var(--bg-white)', 'var(--border-color)')}>Cancel</button>
                            <button onClick={() => handleSave(false)} disabled={actionLoading === 'save' || uploading} style={{ ...btnStyle('var(--bg-white)', 'var(--border-color)'), opacity: (actionLoading === 'save' || uploading) ? 0.6 : 1 }}>
                                Save as Draft
                            </button>
                            <button onClick={() => handleSave(true)} disabled={actionLoading === 'save' || uploading} style={{ ...btnStyle('#6c3096'), opacity: (actionLoading === 'save' || uploading) ? 0.6 : 1 }}>
                                {actionLoading === 'save' ? <><FaSpinner className="animate-spin" style={{ marginRight: 6 }} />Saving...</> : 'Publish to Client'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={!!confirmDeleteId}
                title="Delete report?"
                message="Clients will no longer see this report. This can't be undone."
                onConfirm={() => { if (confirmDeleteId) handleDelete(confirmDeleteId); setConfirmDeleteId(null); }}
                onCancel={() => setConfirmDeleteId(null)}
            />

            {previewMedia && (
                <div onClick={() => setPreviewMedia(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, cursor: 'pointer' }}>
                    {previewMedia.type === 'video' ? (
                        <video src={previewMedia.url} controls autoPlay style={{ maxWidth: '90%', maxHeight: '90%' }} />
                    ) : (
                        <img src={previewMedia.url} alt="" style={{ maxWidth: '90%', maxHeight: '90%' }} />
                    )}
                </div>
            )}
        </div>
    );
};

export default ClientReports;
