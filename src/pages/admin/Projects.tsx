import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaEdit, FaTrash, FaPlus, FaTimes as FaTimesIcon, FaProjectDiagram, FaCheckCircle, FaArrowsAlt, FaChevronLeft, FaChevronRight, FaEye, FaHardHat, FaMapMarkerAlt, FaUser, FaCalendarAlt } from 'react-icons/fa';
import { constructionService } from '../../services/constructionService';
import { sitesService, type Site } from '../../services/sitesService';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import type { Project } from '../../services/constructionService';
import { loadPageCache, savePageCache } from '../../utils/pageCache';

const StatTile = ({ icon, label, value, accent, emphasis }: {
    icon: React.ReactNode; label: string; value: string; accent: string; emphasis?: boolean
}) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0,
        background: emphasis ? `${accent}12` : 'var(--bg-white, #fff)',
        border: `1px solid ${emphasis ? `${accent}40` : 'var(--border-color, #e5e7eb)'}`,
        borderRadius: 10, padding: '0.8rem 1rem',
    }}>
        <div style={{
            width: 36, height: 36, borderRadius: 9, background: `${accent}18`, color: accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.95rem',
        }}>{icon}</div>
        <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #6b7280)' }}>{label}</div>
            <div style={{
                fontSize: emphasis ? '1.1rem' : '0.95rem', fontWeight: 700,
                color: 'var(--text-main, #111)', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis'
            }}>{value}</div>
        </div>
    </div>
);

interface FormData {
    name: string; description: string; type: string; status: string;
    startDate: string; endDate: string; budget: number | ''; location: string;
    clientName: string; clientContact: string; clientUserId: string; partnerUserId: string; progress: number | '';
}

interface PortalUserOption {
    id: string; email: string; role: string;
    profile?: { firstName?: string; lastName?: string };
}

const emptyForm: FormData = {
    name: '', description: '', type: 'construction', status: 'planning',
    startDate: '', endDate: '', budget: '', location: '', clientName: '',
    clientContact: '', clientUserId: '', partnerUserId: '', progress: '',
};

const PAGE_SIZES = [5, 10, 15, 20];

const Projects = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const isAdmin = user?.role === 'admin';
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Project | null>(null);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [modalPos, setModalPos] = useState<{ x: number; y: number } | null>(null);
    const dragging = useRef<{ offsetX: number; offsetY: number } | null>(null);
    const [showCreateSite, setShowCreateSite] = useState(false);
    const [creatingSite, setCreatingSite] = useState(false);
    const [lastCreatedSiteId, setLastCreatedSiteId] = useState<string | null>(null);
    const [creatingProjectForSite, setCreatingProjectForSite] = useState(false);
    const [siteForm, setSiteForm] = useState({
        name: '', location: '', activity: '', assignedEngineerId: ''
    });
    const [editingSiteEngineer, setEditingSiteEngineer] = useState<Site | null>(null);
    const [savingSiteEngineer, setSavingSiteEngineer] = useState(false);
    const [savingProject, setSavingProject] = useState(false);
    const [siteSearch, setSiteSearch] = useState('');
    const [pendingEngineerId, setPendingEngineerId] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const createProjectForSite = searchParams.get('createProject');
    const createProjectSiteId = searchParams.get('siteId');
    const createSite = searchParams.get('createSite');
    const siteFilterId = searchParams.get('siteId');
    const siteFilterName = searchParams.get('siteName') ? decodeURIComponent(searchParams.get('siteName')!) : null;
    const [unlinkedSites, setUnlinkedSites] = useState<Site[]>([]);
    const [selectedSiteId, setSelectedSiteId] = useState<string>('');
    const [allSites, setAllSites] = useState<Site[]>([]);
    const [filterSiteProjectId, setFilterSiteProjectId] = useState<string | null>(null);
    const [viewProject, setViewProject] = useState<Project | null>(null);
    const [portalUsers, setPortalUsers] = useState<PortalUserOption[]>([]);
    const clientUsers = useMemo(() => portalUsers.filter(u => u.role === 'client'), [portalUsers]);
    const partnerUsers = useMemo(() => portalUsers.filter(u => u.role === 'partner'), [portalUsers]);
    const siteEngineerUsers = useMemo(() => portalUsers.filter(u => u.role === 'site_engineer'), [portalUsers]);
    const siteEngineerName = (u: PortalUserOption) => `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim() || u.email;

    useEffect(() => {
        if (createProjectForSite === 'true' && createProjectSiteId) {
            setForm(emptyForm);
            setEditing(null);
            setCreatingProjectForSite(true);
            setLastCreatedSiteId(createProjectSiteId);
            setSelectedSiteId(createProjectSiteId);
            setShowModal(true);
            searchParams.delete('createProject');
            setSearchParams(searchParams, { replace: true });
        }
        if (createSite === 'true') {
            setShowCreateSite(true);
            searchParams.delete('createSite');
            setSearchParams(searchParams, { replace: true });
        }
    }, [createProjectForSite, createProjectSiteId, createSite]);

    // Fetch unlinked sites when modal opens
    useEffect(() => {
        if (showModal && !editing) {
            sitesService.getAll().then(res => {
                const all = res.data || [];
                setUnlinkedSites(all.filter((s: Site) => !s.projectId));
            }).catch(() => setUnlinkedSites([]));
        }
    }, [showModal, editing]);

    // Fetch client/partner/site-engineer accounts once, for the various assignment dropdowns
    useEffect(() => {
        if ((showModal || showCreateSite || editingSiteEngineer) && portalUsers.length === 0) {
            authService.getAllUsers()
                .then((all: any[]) => setPortalUsers(all || []))
                .catch(() => setPortalUsers([]));
        }
    }, [showModal, showCreateSite, editingSiteEngineer, portalUsers.length]);

    const fetch = async () => {
        const cached = loadPageCache<{ projects: Project[]; allSites: Site[] }>('pg_projects');
        if (cached) {
            setProjects(cached.projects);
            setAllSites(cached.allSites);
        }
        try {
            const [projRes, sitesRes] = await Promise.all([
                constructionService.getProjects(),
                sitesService.getAll(),
            ]);
            const projects = projRes.data || [];
            const allSites = sitesRes.data || [];
            setProjects(projects);
            setAllSites(allSites);
            savePageCache('pg_projects', { projects, allSites });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(); }, []);

    useEffect(() => {
        if (siteFilterId && allSites.length > 0) {
            const site = allSites.find(s => s.id === siteFilterId);
            setFilterSiteProjectId(site?.projectId || null);
        } else {
            setFilterSiteProjectId(null);
        }
    }, [siteFilterId, allSites]);

    const siteLabel = siteFilterId && allSites.length > 0
        ? allSites.find(s => s.id === siteFilterId)?.name || siteFilterName
        : null;

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return projects.filter(p => {
            if (filterSiteProjectId && p.id !== filterSiteProjectId) return false;
            if (q && !p.name.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [projects, search, filterSiteProjectId]);

    const totalPages = pageSize === 0 ? 1 : Math.ceil(filtered.length / pageSize);
    const paginated = useMemo(() => {
        if (pageSize === 0) return filtered;
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages || 1);
    }, [totalPages, page]);

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!dragging.current) return;
        setModalPos({ x: e.clientX - dragging.current.offsetX, y: e.clientY - dragging.current.offsetY });
    }, []);

    const onMouseUp = useCallback(() => {
        dragging.current = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }, [onMouseMove]);

    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, [onMouseMove, onMouseUp]);

    const onHeaderMouseDown = useCallback((e: React.MouseEvent) => {
        const modal = (e.currentTarget as HTMLElement).closest('.admin-modal') as HTMLElement | null;
        if (!modal) return;
        const rect = modal.getBoundingClientRect();
        setModalPos({ x: rect.left, y: rect.top });
        dragging.current = { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [onMouseMove, onMouseUp]);

    const stats = useMemo(() => ({
        total: projects.length,
        active: projects.filter(p => p.status === 'in_progress').length,
        completed: projects.filter(p => p.status === 'completed').length,
    }), [projects]);

    const filteredStats = useMemo(() => ({
        total: filtered.length,
        active: filtered.filter(p => p.status === 'in_progress').length,
        completed: filtered.filter(p => p.status === 'completed').length,
    }), [filtered]);

    const handleSave = async () => {
        if (!editing && !selectedSiteId) {
            showToast('Please select a site to link this project to.', 'error');
            return;
        }
        setSavingProject(true);
        try {
            const payload = {
                ...form,
                startDate: form.startDate || null,
                endDate: form.endDate || null,
                clientUserId: form.clientUserId || null,
                partnerUserId: form.partnerUserId || null,
            };
            if (editing) {
                await constructionService.updateProject(editing.id, payload);
                showToast('Project updated successfully', 'success');
            } else {
                const res = await constructionService.createProject(payload);
                const newProject = res.data || res;
                if (selectedSiteId && newProject?.id) {
                    await sitesService.update(selectedSiteId, { projectId: newProject.id });
                }
                showToast('Project created successfully', 'success');
            }
            setShowModal(false);
            setSelectedSiteId('');
            setCreatingProjectForSite(false);
            setLastCreatedSiteId(null);
            fetch();
            window.dispatchEvent(new CustomEvent('projects-updated'));
        } catch (e: any) {
            console.error('SAVE ERROR', e);
            const errData = e?.response?.data;
            const errMsg = errData ? JSON.stringify(errData) : (e?.message || 'Unknown error');
            showToast(errMsg, 'error');
        } finally {
            setSavingProject(false);
        }
    };

    const handleCreateSite = async () => {
        if (!siteForm.name.trim()) { showToast('Site name is required', 'error'); return; }
        try {
            setCreatingSite(true);
            const assignedEngineer = siteEngineerUsers.find(u => u.id === siteForm.assignedEngineerId);
            const res = await sitesService.create({
                name: siteForm.name,
                location: siteForm.location || undefined,
                description: siteForm.activity || undefined,
                assignedEngineerId: siteForm.assignedEngineerId || undefined,
                assignedEngineerName: assignedEngineer ? siteEngineerName(assignedEngineer) : undefined,
            });
            const createdSite = res.data || res;
            setLastCreatedSiteId(createdSite.id);
            showToast('Site created successfully!', 'success');
            setShowCreateSite(false);
            setSiteForm({ name: '', location: '', activity: '', assignedEngineerId: '' });
            window.dispatchEvent(new CustomEvent('sites-updated', { detail: { projectId: 'all' } }));
            fetch();
        } catch (e: any) {
            const errMsg = e?.response?.data ? JSON.stringify(e.response.data) : (e?.message || 'Failed to create site');
            showToast(errMsg, 'error');
        } finally {
            setCreatingSite(false);
        }
    };

    const openEditSiteEngineer = (site: Site) => {
        setEditingSiteEngineer(site);
        setPendingEngineerId(site.assignedEngineerId || '');
    };

    const openEditProject = (item: Project) => {
        setEditing(item);
        setForm({
            name: item.name,
            description: item.description || '',
            type: item.type || 'construction',
            status: item.status,
            startDate: item.startDate || '',
            endDate: item.endDate || '',
            budget: item.budget || '',
            location: item.location || '',
            clientName: (item as any).clientName || '',
            clientContact: (item as any).clientContact || '',
            clientUserId: (item as any).clientUserId || '',
            partnerUserId: (item as any).partnerUserId || '',
            progress: item.progress || '',
        });
        setModalPos(null);
        setShowModal(true);
    };

    const handleSaveSiteEngineer = async () => {
        if (!editingSiteEngineer) return;
        setSavingSiteEngineer(true);
        try {
            const assignedEngineer = siteEngineerUsers.find(u => u.id === pendingEngineerId);
            await sitesService.update(editingSiteEngineer.id, {
                assignedEngineerId: (pendingEngineerId || null) as unknown as string,
                assignedEngineerName: (assignedEngineer ? siteEngineerName(assignedEngineer) : null) as unknown as string,
            });
            showToast('Site engineer updated', 'success');
            setEditingSiteEngineer(null);
            window.dispatchEvent(new CustomEvent('sites-updated', { detail: { projectId: 'all' } }));
            fetch();
        } catch (e: any) {
            const errMsg = e?.response?.data?.message || e?.message || 'Failed to update site engineer';
            showToast(Array.isArray(errMsg) ? errMsg.join('. ') : errMsg, 'error');
        } finally {
            setSavingSiteEngineer(false);
        }
    };

    const statusColors: Record<string, string> = {
        planning: '#8b5cf6', in_progress: '#f59e0b', completed: '#22c55e', cancelled: '#ef4444',
    };

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {siteLabel ? (
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.2rem' }}>
                            <FaHardHat style={{ color: '#8B5CF6' }} /> {siteLabel}
                        </h2>
                    ) : (
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.2rem' }}>
                            <FaHardHat style={{ color: 'var(--text-muted)' }} /> Sites
                        </h2>
                    )}
                    {siteLabel && isAdmin && <button className="admin-btn" onClick={() => { setForm(emptyForm); setEditing(null); setCreatingProjectForSite(false); setLastCreatedSiteId(null); setSelectedSiteId(''); setShowModal(true); }} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.3rem 0.8rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <FaProjectDiagram size={11} /> Create Project
                    </button>}
                    {siteLabel && (
                        <button className="admin-btn admin-btn--secondary" onClick={() => setSearchParams({})} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FaTimesIcon size={10} /> Clear
                        </button>
                    )}
                </div>
                {siteLabel && (
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, 1fr)`, gap: '0.6rem', marginBottom: '1rem' }}>
                        <StatTile icon={<FaProjectDiagram />} label="Total Sites" value={String(filteredStats.total)} accent="#1B2042" emphasis />
                        <StatTile icon={<FaHardHat />} label="In Progress" value={String(filteredStats.active)} accent="#f59e0b" />
                        <StatTile icon={<FaCheckCircle />} label="Completed" value={String(filteredStats.completed)} accent="#22c55e" />
                    </div>
                )}
            </div>

            {lastCreatedSiteId && (
                <div style={{ padding: '0.75rem 1rem', marginBottom: '0.75rem', background: '#22c55e15', border: '1px solid #22c55e', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <FaCheckCircle size={16} /> Site created successfully!
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button className="admin-btn" onClick={() => { setShowModal(true); setEditing(null); setForm(emptyForm); setCreatingProjectForSite(false); setSelectedSiteId(lastCreatedSiteId || ''); setModalPos(null); }}
                            style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.4rem 1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <FaPlus /> Create Project
                        </button>
                        <button className="admin-btn admin-btn--secondary" onClick={() => setLastCreatedSiteId(null)}
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}>
                            <FaTimesIcon />
                        </button>
                    </div>
                </div>
            )}

            {siteLabel ? (
                <div className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Projects in this site</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                            <input type="text" className="form-input" placeholder="Search projects..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem', width: 220 }} />
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th><th>Type</th><th>Status</th><th>Budget</th><th>Progress</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map(item => (
                                <tr key={item.id}>
                                    <td><Link to={`/admin/sites/${item.id}`} style={{ fontWeight: 700, textDecoration: 'none', color: 'inherit' }}>{item.name}</Link></td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{item.type || 'construction'}</td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600,
                                            color: '#fff', background: statusColors[item.status] || '#6b7280',
                                        }}>{item.status.replace(/_/g, ' ')}</span>
                                    </td>
                                    <td style={{ fontSize: '0.85rem' }}>{item.budget ? `${Number(item.budget).toLocaleString()} RWF` : '—'}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <div style={{ width: 60, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                                                <div style={{ width: `${item.progress || 0}%`, height: '100%', background: item.progress >= 100 ? '#22c55e' : '#1B2042', borderRadius: 3 }} />
                                            </div>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{item.progress || 0}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setViewProject(item)} title="View Details"><FaEye /></button>
                                            {isAdmin && (<><button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => openEditProject(item)} title="Edit"><FaEdit /></button>
                                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem', color: 'var(--primary-red)' }} onClick={async () => {
                                                if (!window.confirm('Delete this project?')) return;
                                                try { await constructionService.deleteProject(item.id); fetch(); window.dispatchEvent(new CustomEvent('projects-updated')); showToast('Project deleted', 'success'); } catch { showToast('Failed to delete', 'error'); }
                                            }}><FaTrash /></button></>)}
                                        </div>
                                    </td>
                                </tr>
                                ))}
                                {paginated.length === 0 && (
                                    <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <><FaHardHat size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><div>No projects in this site.</div></>
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '0.25rem 0', flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Showing {pageSize === 0 ? filtered.length : Math.min(pageSize, filtered.length - (page - 1) * pageSize)} of {filtered.length}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Per page:</span>
                                <select
                                    className="form-select"
                                    style={{ width: 'auto', padding: '0.2rem 1.2rem 0.2rem 0.4rem', fontSize: '0.75rem' }}
                                    value={pageSize}
                                    onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}
                                >
                                    {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                    <option value={0}>All</option>
                                </select>
                            </div>
                            {pageSize > 0 && totalPages > 1 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.5rem' }} disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><FaChevronLeft /></button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                        <button key={p} className={p === page ? 'admin-btn' : 'admin-btn admin-btn--secondary'} style={{ padding: '0.2rem 0.5rem', minWidth: 28, fontSize: '0.78rem' }} onClick={() => setPage(p)}>{p}</button>
                                    ))}
                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.5rem' }} disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><FaChevronRight /></button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : allSites.length === 0 ? (
                <div className="admin-card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <FaHardHat size={48} style={{ opacity: 0.2, marginBottom: 12, color: 'var(--text-muted)' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-muted)' }}>No Sites Yet</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Create a site first to link it to a project.</p>
                    {isAdmin && <Link to="#"
                        onClick={() => setShowCreateSite(true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1.25rem', borderRadius: '8px', background: '#1B2042', color: '#fff', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                        <FaPlus size={12} /> Create Site
                    </Link>}
                </div>
            ) : (
                <div className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>All Sites ({allSites.length})</span>
                        <input type="text" className="form-input" placeholder="Search sites..." value={siteSearch} onChange={e => setSiteSearch(e.target.value)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem', width: 220 }} />
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Site Name</th><th>Location</th><th>Site Engineer</th><th>Linked Project</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allSites
                                    .filter(s => {
                                        const q = siteSearch.trim().toLowerCase();
                                        if (!q) return true;
                                        return s.name.toLowerCase().includes(q) || (s.location || '').toLowerCase().includes(q) || (s.project?.name || '').toLowerCase().includes(q);
                                    })
                                    .map(site => {
                                        const fullProject = site.project ? projects.find(p => p.id === site.project!.id) : undefined;
                                        return (
                                            <tr key={site.id}>
                                                <td>
                                                    <button
                                                        onClick={() => setSearchParams({ siteId: site.id, siteName: site.name })}
                                                        style={{ background: 'none', border: 'none', padding: 0, fontWeight: 700, color: 'inherit', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
                                                        title="View projects in this site"
                                                    >
                                                        {site.name}
                                                    </button>
                                                </td>
                                                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{site.location || '—'}</td>
                                                <td style={{ fontSize: '0.85rem' }}>
                                                    {site.assignedEngineerName || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                                                </td>
                                                <td>
                                                    {site.project ? (
                                                        <Link to={`/admin/sites/${site.project.id}`} style={{ fontWeight: 600, color: '#1B2042', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                                            <FaProjectDiagram size={10} />{site.project.name}
                                                        </Link>
                                                    ) : (
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>— Not linked —</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                        {site.project && fullProject && isAdmin && (
                                                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => openEditProject(fullProject)} title="Edit linked project"><FaEdit /></button>
                                                        )}
                                                        {!site.project && isAdmin && (
                                                            <button className="admin-btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: '#1B2042', borderColor: '#1B2042' }}
                                                                onClick={() => { setForm(emptyForm); setEditing(null); setSelectedSiteId(site.id); setModalPos(null); setShowModal(true); }}
                                                            >
                                                                <FaPlus size={9} style={{ marginRight: 4 }} />Link Project
                                                            </button>
                                                        )}
                                                        {isAdmin && (
                                                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => openEditSiteEngineer(site)} title="Assign Site Engineer"><FaUser /></button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                {allSites.filter(s => {
                                    const q = siteSearch.trim().toLowerCase();
                                    if (!q) return true;
                                    return s.name.toLowerCase().includes(q) || (s.location || '').toLowerCase().includes(q) || (s.project?.name || '').toLowerCase().includes(q);
                                }).length === 0 && (
                                    <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No sites match your search.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {showModal && (
                <div className="admin-modal-overlay" onClick={() => !savingProject && setShowModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ left: modalPos?.x ?? '50%', top: modalPos?.y ?? '50%', transform: modalPos ? 'none' : 'translate(-50%, -50%)' }}>
                        <div className="admin-modal-header" onMouseDown={onHeaderMouseDown}>
                            <h3><FaArrowsAlt style={{ fontSize: '0.75rem', marginRight: 8, opacity: 0.5 }} />{editing ? 'Edit' : 'Add'} Project</h3>
                            <button onClick={() => setShowModal(false)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Project name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Link to Site</label>
                                    <select className="form-select" value={selectedSiteId} onChange={e => setSelectedSiteId(e.target.value)}>
                                        <option value="">— None —</option>
                                        {unlinkedSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                                        <option value="construction">Construction</option>
                                        <option value="renovation">Renovation</option>
                                        <option value="design">Design</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                                        <option value="planning">Planning</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Budget (RWF)</label>
                                    <input type="number" className="form-input" value={form.budget || ''} onChange={e => setForm(p => ({ ...p, budget: e.target.value === '' ? '' : Number(e.target.value) }))} placeholder="e.g. 50000000" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input type="date" className="form-input" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End Date</label>
                                    <input type="date" className="form-input" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Location</label>
                                    <input className="form-input" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="City, Country" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Progress (0-100)</label>
                                    <input type="number" min={0} max={100} className="form-input" value={form.progress || ''} onChange={e => setForm(p => ({ ...p, progress: e.target.value === '' ? '' : Number(e.target.value) }))} placeholder="e.g. 75" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Client Name</label>
                                    <input className="form-input" value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} placeholder="Client name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Client Contact</label>
                                    <input className="form-input" value={form.clientContact} onChange={e => setForm(p => ({ ...p, clientContact: e.target.value }))} placeholder="Phone or email" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Link to Client Account</label>
                                    <select className="form-select" value={form.clientUserId} onChange={e => setForm(p => ({ ...p, clientUserId: e.target.value }))}>
                                        <option value="">— Not linked —</option>
                                        {clientUsers.map(u => {
                                            const label = `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim() || u.email;
                                            return <option key={u.id} value={u.id}>{label} ({u.email})</option>;
                                        })}
                                    </select>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>
                                        Required for the client to see this project in their client portal dashboard.
                                    </p>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Link to Partner Account</label>
                                    <select className="form-select" value={form.partnerUserId} onChange={e => setForm(p => ({ ...p, partnerUserId: e.target.value }))}>
                                        <option value="">— Not linked —</option>
                                        {partnerUsers.map(u => {
                                            const label = `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim() || u.email;
                                            return <option key={u.id} value={u.id}>{label} ({u.email})</option>;
                                        })}
                                    </select>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>
                                        Required for the partner to see this project in their partner portal dashboard.
                                    </p>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="form-label">Description</label>
                                <textarea className="form-textarea" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Project description" />
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setShowModal(false)} disabled={savingProject}>Cancel</button>
                            <button className="admin-btn" onClick={handleSave} disabled={savingProject}>{savingProject ? 'Saving...' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}

            {showCreateSite && (
                <div className="admin-modal-overlay" onClick={() => setShowCreateSite(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', top: '100px', left: '50%', transform: 'translateX(-50%)', maxHeight: 'calc(100vh - 160px)' }}>
                        <div className="admin-modal-header">
                            <h3><FaHardHat style={{ marginRight: 8 }} />Create Site</h3>
                            <button onClick={() => setShowCreateSite(false)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Site Name *</label>
                                    <input className="form-input" value={siteForm.name} onChange={e => setSiteForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Main Building Site" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Location</label>
                                    <input className="form-input" value={siteForm.location} onChange={e => setSiteForm(p => ({ ...p, location: e.target.value }))} placeholder="Site location" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Activity</label>
                                    <textarea className="form-textarea" rows={2} value={siteForm.activity} onChange={e => setSiteForm(p => ({ ...p, activity: e.target.value }))} placeholder="What activity is happening at this site?" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Site Engineer</label>
                                    <select className="form-select" value={siteForm.assignedEngineerId} onChange={e => setSiteForm(p => ({ ...p, assignedEngineerId: e.target.value }))}>
                                        <option value="">— Unassigned —</option>
                                        {siteEngineerUsers.map(u => <option key={u.id} value={u.id}>{siteEngineerName(u)}</option>)}
                                    </select>
                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>The engineer assigned here will only see this site and its data — attendance, activities, evidence — once logged in.</p>
                                </div>
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setShowCreateSite(false)}>Cancel</button>
                            <button className="admin-btn" onClick={handleCreateSite} disabled={creatingSite} style={{ background: '#8B5CF6', borderColor: '#8B5CF6' }}>
                                {creatingSite ? 'Creating...' : 'Create Site'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingSiteEngineer && (
                <div className="admin-modal-overlay" onClick={() => !savingSiteEngineer && setEditingSiteEngineer(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', borderRadius: 12 }}>
                        <div className="admin-modal-header">
                            <h3 style={{ fontSize: '1rem' }}><FaHardHat style={{ marginRight: 8, color: '#8B5CF6' }} />Assign Site Engineer</h3>
                            <button onClick={() => !savingSiteEngineer && setEditingSiteEngineer(null)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            <p style={{ fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
                                Which Site Engineer should see and manage <strong>{editingSiteEngineer.name}</strong>?
                            </p>
                            <div className="form-group">
                                <label className="form-label">Site Engineer</label>
                                <select className="form-select" value={pendingEngineerId} onChange={e => setPendingEngineerId(e.target.value)}>
                                    <option value="">— Unassigned —</option>
                                    {siteEngineerUsers.map(u => <option key={u.id} value={u.id}>{siteEngineerName(u)}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setEditingSiteEngineer(null)} disabled={savingSiteEngineer}>Cancel</button>
                            <button className="admin-btn" onClick={handleSaveSiteEngineer} disabled={savingSiteEngineer} style={{ background: '#8B5CF6', borderColor: '#8B5CF6' }}>
                                {savingSiteEngineer ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewProject && (
                <div className="admin-modal-overlay" onClick={() => setViewProject(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '380px', width: '100%', borderRadius: '12px', top: 'auto', left: 'auto', transform: 'none' }}>
                        <div className="admin-modal-header" style={{ padding: '0.75rem 1rem' }}>
                            <h3 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <FaProjectDiagram style={{ color: '#1B2042' }} /> {viewProject.name}
                            </h3>
                            <button onClick={() => setViewProject(null)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', fontSize: '1rem' }}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body" style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Type</div>
                                <div>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.1rem 0.5rem', borderRadius: '8px', color: '#fff', background: statusColors[viewProject.status] || '#6b7280' }}>
                                        {viewProject.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize' }}>{viewProject.type || 'construction'}</div>
                            </div>
                            {viewProject.budget ? (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '0.3rem 0', borderTop: '1px solid var(--border-color)' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Budget</span>
                                    <span style={{ fontWeight: 700 }}>RWF {Number(viewProject.budget).toLocaleString()}</span>
                                </div>
                            ) : null}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', padding: '0.3rem 0', borderTop: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                                <div style={{ flex: 1, height: '5px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${viewProject.progress || 0}%`, height: '100%', background: '#1B2042', borderRadius: '3px' }} />
                                </div>
                                <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>{viewProject.progress || 0}%</span>
                            </div>
                            {viewProject.location && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0.25rem 0' }}>
                                    <FaMapMarkerAlt size={10} /> {viewProject.location}
                                </div>
                            )}
                            {viewProject.clientName && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0.15rem 0' }}>
                                    <FaUser size={10} /> {viewProject.clientName}{viewProject.clientContact ? ` — ${viewProject.clientContact}` : ''}
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', padding: '0.15rem 0', color: viewProject.clientUserId ? '#22c55e' : '#f59e0b' }}>
                                <FaUser size={10} />
                                {viewProject.clientUserId
                                    ? 'Linked to a client portal account'
                                    : 'Not linked to a client account — won\'t appear in any client portal'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', padding: '0.15rem 0', color: viewProject.partnerUserId ? '#22c55e' : '#f59e0b' }}>
                                <FaUser size={10} />
                                {viewProject.partnerUserId
                                    ? 'Linked to a partner portal account'
                                    : 'Not linked to a partner account — won\'t appear in any partner portal'}
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {viewProject.startDate && <span><FaCalendarAlt size={9} style={{ marginRight: 3 }} />{new Date(viewProject.startDate).toLocaleDateString()}</span>}
                                {viewProject.endDate && <span>→ {new Date(viewProject.endDate).toLocaleDateString()}</span>}
                            </div>
                            {viewProject.description && (
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, padding: '0.3rem 0', borderTop: '1px solid var(--border-color)', lineHeight: 1.4 }}>{viewProject.description}</p>
                            )}
                            {(() => {
                                const linkedSites = allSites.filter(s => s.projectId === viewProject.id);
                                if (linkedSites.length === 0) return null;
                                return (
                                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Linked Sites ({linkedSites.length})</div>
                                        {linkedSites.map(s => (
                                            <div key={s.id} style={{ padding: '0.25rem 0' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}>
                                                    <FaHardHat size={10} style={{ color: '#8B5CF6' }} />
                                                    <span style={{ fontWeight: 600 }}>{s.name}</span>
                                                    {s.location && <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>— {s.location}</span>}
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.05rem 0.35rem', borderRadius: '6px', background: s.status === 'active' ? '#22c55e20' : '#f59e0b20', color: s.status === 'active' ? '#22c55e' : '#f59e0b', marginLeft: 'auto', textTransform: 'capitalize' }}>{s.status}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: '1.05rem', marginTop: '0.1rem' }}>
                                                    <FaUser size={9} />
                                                    {s.assignedEngineerName ? `Engineer: ${s.assignedEngineerName}` : 'No Site Engineer assigned'}
                                                    {isAdmin && (
                                                        <button className="admin-btn admin-btn--secondary" onClick={() => openEditSiteEngineer(s)} style={{ padding: '0.05rem 0.4rem', fontSize: '0.65rem', marginLeft: '0.3rem' }}>
                                                            {s.assignedEngineerName ? 'Reassign' : 'Assign'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
