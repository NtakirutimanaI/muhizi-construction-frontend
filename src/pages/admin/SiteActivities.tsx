import { useState, useEffect, useMemo, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaHardHat, FaSpinner, FaChevronLeft, FaChevronRight, FaUserTie, FaCheckCircle, FaCalendarAlt, FaImage, FaVideo, FaExpand } from 'react-icons/fa';
import { constructionService } from '../../services/constructionService';
import { siteActivitiesService } from '../../services/siteActivitiesService';
import { projectEvidenceService } from '../../services/projectEvidenceService';
import { uploadService } from '../../services/uploadService';
import { loadPageCache, savePageCache } from '../../utils/pageCache';
import { sitesService, type Site } from '../../services/sitesService';
import type { SiteActivity } from '../../services/siteActivitiesService';
import type { ProjectEvidence } from '../../services/projectEvidenceService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/ConfirmDialog';

const PAGE_SIZES = [5, 10, 15, 20];
const FIELD_ROLES = ['site_engineer'];

const mediaTypeFromUrl = (url: string): 'image' | 'video' => {
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || '';
    return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'wmv', 'flv'].includes(ext) ? 'video' : 'image';
};

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

const emptyActivityForm: Omit<SiteActivity, 'id' | 'isActive' | 'createdAt'> = {
    project: '', siteId: '', date: new Date().toISOString().split('T')[0],
    description: '', status: 'planned', workers: 0, notes: ''
};

const emptyEvidenceForm = {
    project: '', siteId: '', type: 'image' as 'image' | 'video',
    title: '', url: '', date: new Date().toISOString().split('T')[0], notes: ''
};

const SiteActivities = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const canLog = FIELD_ROLES.includes(user?.role || '');

    const [activeTab, setActiveTab] = useState<'activities' | 'evidence'>('activities');

    // Shared data
    const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
    const [sites, setSites] = useState<Site[]>([]);

    // Activities state
    const [activities, setActivities] = useState<SiteActivity[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [selectedProject, setSelectedProject] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [editingActivity, setEditingActivity] = useState<SiteActivity | null>(null);
    const [activityForm, setActivityForm] = useState(emptyActivityForm);
    const [savingActivity, setSavingActivity] = useState(false);
    const [confirmDeleteActivityId, setConfirmDeleteActivityId] = useState<string | null>(null);

    // Evidence state
    const [evidences, setEvidences] = useState<ProjectEvidence[]>([]);
    const [loadingEvidence, setLoadingEvidence] = useState(false);
    const [evidenceSearch, setEvidenceSearch] = useState('');
    const [evidencePage, setEvidencePage] = useState(1);
    const [evidencePageSize, setEvidencePageSize] = useState(10);
    const [showEvidenceModal, setShowEvidenceModal] = useState(false);
    const [editingEvidence, setEditingEvidence] = useState<ProjectEvidence | null>(null);
    const [evidenceForm, setEvidenceForm] = useState(emptyEvidenceForm);
    const [mediaFiles, setMediaFiles] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
    const [savingEvidence, setSavingEvidence] = useState(false);
    const [previewItem, setPreviewItem] = useState<ProjectEvidence | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [confirmDeleteEvidenceId, setConfirmDeleteEvidenceId] = useState<string | null>(null);

    useEffect(() => {
        const cached = loadPageCache<{ projects: { id: string; name: string }[]; sites: Site[] }>('pg_site_hub');
        if (cached) {
            setProjects(cached.projects || []);
            setSites(cached.sites || []);
        }
        sitesService.getAll().then(res => {
            const freshSites = res.data || [];
            setSites(freshSites);
            constructionService.getProjects().then(resp => {
                const freshProjects = resp.data || [];
                setProjects(freshProjects);
                savePageCache('pg_site_hub', { projects: freshProjects, sites: freshSites });
            }).catch(() => {});
        }).catch(() => {});
    }, []);

    useEffect(() => {
        if (activeTab === 'activities') {
            const cached = loadPageCache<{ activities: SiteActivity[] }>('pg_site_activities');
            if (cached) {
                setActivities(cached.activities || []);
            } else {
                setLoadingActivities(true);
            }
            siteActivitiesService.getAllAdmin()
                .then(res => {
                    const data = res.data || [];
                    setActivities(data);
                    savePageCache('pg_site_activities', { activities: data });
                })
                .catch(() => setActivities([]))
                .finally(() => setLoadingActivities(false));
        } else {
            const cached = loadPageCache<{ evidences: ProjectEvidence[] }>('pg_project_evidence');
            if (cached) {
                setEvidences(cached.evidences || []);
            } else {
                setLoadingEvidence(true);
            }
            projectEvidenceService.getAll()
                .then(res => {
                    const data = res.data || [];
                    setEvidences(data);
                    savePageCache('pg_project_evidence', { evidences: data });
                })
                .catch(() => setEvidences([]))
                .finally(() => setLoadingEvidence(false));
        }
    }, [activeTab]);

    const siteById = useMemo(() => new Map(sites.map(s => [s.id, s])), [sites]);

    // --- Activities logic ---

    const filteredActivities = useMemo(() =>
        activities.filter(a => {
            if (selectedProject !== 'all') {
                const site = a.siteId ? siteById.get(a.siteId) : undefined;
                if (!site || site.projectId !== selectedProject) return false;
            }
            return !search.trim() || a.project.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
        }),
        [activities, selectedProject, search, siteById],
    );

    const totalActivityPages = pageSize === 0 ? 1 : Math.ceil(filteredActivities.length / pageSize);
    const paginatedActivities = useMemo(() => {
        if (pageSize === 0) return filteredActivities;
        const start = (page - 1) * pageSize;
        return filteredActivities.slice(start, start + pageSize);
    }, [filteredActivities, page, pageSize]);

    useEffect(() => { if (page > totalActivityPages) setPage(totalActivityPages || 1); }, [totalActivityPages, page]);

    const openNewActivity = () => { setEditingActivity(null); setActivityForm(emptyActivityForm); setShowActivityModal(true); };
    const openEditActivity = (a: SiteActivity) => {
        setEditingActivity(a);
        setActivityForm({ project: a.project, siteId: a.siteId || '', date: a.date, description: a.description, status: a.status, workers: a.workers, notes: a.notes || '' });
        setShowActivityModal(true);
    };
    const closeActivityModal = () => { setShowActivityModal(false); setEditingActivity(null); };

    const saveActivity = async () => {
        if (!activityForm.project || !activityForm.date || !activityForm.siteId) {
            showToast('Project, site, and date are required.', 'error');
            return;
        }
        setSavingActivity(true);
        try {
            if (editingActivity) {
                const res = await siteActivitiesService.update(editingActivity.id, activityForm as any);
                setActivities(prev => prev.map(a => a.id === editingActivity.id ? res.data : a));
                showToast('Activity updated successfully', 'success');
            } else {
                const res = await siteActivitiesService.create(activityForm as any);
                setActivities(prev => [res.data, ...prev]);
                showToast('Activity logged successfully', 'success');
            }
            closeActivityModal();
        } catch (e: any) {
            showToast(e?.response?.data?.message || e?.message || 'Failed to save activity', 'error');
        } finally {
            setSavingActivity(false);
        }
    };

    const deleteActivity = async (id: string) => {
        try {
            await siteActivitiesService.delete(id);
            setActivities(prev => prev.filter(a => a.id !== id));
            showToast('Activity deleted', 'success');
        } catch (e: any) {
            showToast(e?.response?.data?.message || e?.message || 'Failed to delete activity', 'error');
        }
    };

    const statusColor = (s: string) => s === 'completed' ? '#22c55e' : s === 'in_progress' ? '#1B2042' : '#f59e0b';

    // --- Evidence logic ---

    const filteredEvidence = useMemo(() =>
        evidences.filter(e => {
            if (selectedProject !== 'all') {
                const site = e.siteId ? siteById.get(e.siteId) : undefined;
                if (!site || site.projectId !== selectedProject) return false;
            }
            return !evidenceSearch.trim() || e.project.toLowerCase().includes(evidenceSearch.toLowerCase()) || e.title.toLowerCase().includes(evidenceSearch.toLowerCase());
        }),
        [evidences, selectedProject, evidenceSearch, siteById],
    );

    const totalEvidencePages = evidencePageSize === 0 ? 1 : Math.ceil(filteredEvidence.length / evidencePageSize);
    const paginatedEvidence = useMemo(() => {
        if (evidencePageSize === 0) return filteredEvidence;
        const start = (evidencePage - 1) * evidencePageSize;
        return filteredEvidence.slice(start, start + evidencePageSize);
    }, [filteredEvidence, evidencePage, evidencePageSize]);

    useEffect(() => { if (evidencePage > totalEvidencePages) setEvidencePage(totalEvidencePages || 1); }, [totalEvidencePages, evidencePage]);

    const openNewEvidence = () => { setEditingEvidence(null); setEvidenceForm(emptyEvidenceForm); setMediaFiles([]); setShowEvidenceModal(true); };
    const openEditEvidence = (e: ProjectEvidence) => {
        setEditingEvidence(e);
        setEvidenceForm({ project: e.project, siteId: e.siteId || '', type: e.type, title: e.title, url: e.url, date: e.date, notes: e.notes || '' });
        setMediaFiles(e.url ? [{ url: e.url, type: e.type as 'image' | 'video' }] : []);
        setShowEvidenceModal(true);
    };
    const closeEvidenceModal = () => { setShowEvidenceModal(false); setEditingEvidence(null); setMediaFiles([]); };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploading(true);
        setUploadProgress(0);
        let completed = 0;
        const results: { url: string; type: 'image' | 'video' }[] = [];
        for (const file of Array.from(files)) {
            try {
                const detectedType = file.type.startsWith('video/') ? 'video' : 'image';
                const result = await uploadService.uploadFile(file, (pct) => setUploadProgress(pct));
                results.push({ url: result.secureUrl, type: detectedType });
            } catch (err: any) {
                showToast(`Failed to upload ${file.name}: ${err?.response?.data?.message || err?.message || 'Upload error'}`, 'error');
            }
            completed++;
            setUploadProgress(Math.round((completed / files.length) * 100));
        }
        if (results.length > 0) {
            setMediaFiles(prev => [...prev, ...results]);
        }
        setUploading(false);
        e.target.value = '';
    };

    const saveEvidence = async () => {
        if (!evidenceForm.project || !evidenceForm.title || !evidenceForm.siteId) {
            showToast('Project, site, and title are required.', 'error');
            return;
        }
        if (mediaFiles.length === 0 && !evidenceForm.url) {
            showToast('At least one media file is required.', 'error');
            return;
        }
        setSavingEvidence(true);
        try {
            if (editingEvidence) {
                const payload = { ...evidenceForm, url: mediaFiles[0]?.url || evidenceForm.url, type: mediaFiles[0]?.type || evidenceForm.type };
                const res = await projectEvidenceService.update(editingEvidence.id, payload as any);
                setEvidences(prev => prev.map(e => e.id === editingEvidence.id ? res.data : e));
                showToast('Evidence updated successfully', 'success');
                closeEvidenceModal();
            } else {
                const base = { project: evidenceForm.project, siteId: evidenceForm.siteId, date: evidenceForm.date, title: evidenceForm.title, notes: evidenceForm.notes };
                const created: ProjectEvidence[] = [];
                for (const file of mediaFiles) {
                    const payload = { ...base, url: file.url, type: file.type };
                    const res = await projectEvidenceService.create(payload as any);
                    created.push(res.data);
                }
                setEvidences(prev => [...created, ...prev]);
                showToast(`${created.length} evidence file(s) added successfully`, 'success');
                closeEvidenceModal();
            }
        } catch (e: any) {
            showToast(e?.response?.data?.message || e?.message || 'Failed to save evidence', 'error');
        } finally {
            setSavingEvidence(false);
        }
    };

    const deleteEvidence = async (id: string) => {
        try {
            await projectEvidenceService.delete(id);
            setEvidences(prev => prev.filter(e => e.id !== id));
            showToast('Evidence deleted', 'success');
        } catch (e: any) {
            showToast(e?.response?.data?.message || e?.message || 'Failed to delete evidence', 'error');
        }
    };

    const tabStyle = (tab: typeof activeTab) => ({
        padding: '0.35rem 1rem', borderRadius: '8px', border: 'none',
        cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem',
        background: activeTab === tab ? '#1B2042' : 'transparent',
        color: activeTab === tab ? '#fff' : 'var(--text-muted)',
        transition: 'all 0.15s',
    });

    return (
        <div>
            <div style={{ marginBottom: '0.75rem' }}>
                <h1 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FaHardHat style={{ color: '#1B2042' }} /> Site Activities
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Log daily activities and manage project evidence</p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button style={tabStyle('activities')} onClick={() => { setActiveTab('activities'); setPage(1); }}>
                    <FaHardHat size={11} style={{ marginRight: 6 }} />Activities
                </button>
                <button style={tabStyle('evidence')} onClick={() => { setActiveTab('evidence'); setEvidencePage(1); }}>
                    <FaImage size={11} style={{ marginRight: 6 }} />Evidence
                </button>
            </div>

            {/* ===== ACTIVITIES TAB ===== */}
            {activeTab === 'activities' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1rem' }}>
                        <StatTile icon={<FaHardHat />} label="Total" value={String(activities.length)} accent="#1B2042" emphasis />
                        <StatTile icon={<FaCheckCircle />} label="Completed" value={String(activities.filter(a => a.status === 'completed').length)} accent="#22c55e" />
                        <StatTile icon={<FaSpinner />} label="In Progress" value={String(activities.filter(a => a.status === 'in_progress').length)} accent="#f59e0b" />
                        <StatTile icon={<FaCalendarAlt />} label="Planned" value={String(activities.filter(a => a.status === 'planned').length)} accent="#8b5cf6" />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Project:</span>
                            <select value={selectedProject} onChange={e => { setPage(1); setSelectedProject(e.target.value); }}
                                style={{ padding: '0.25rem 0.4rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.75rem', minWidth: '160px' }}>
                                <option value="all">All Projects</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <input value={search} onChange={e => { setPage(1); setSearch(e.target.value); }}
                            placeholder="Search by project or description..."
                            style={{ flex: 1, minWidth: '200px', padding: '0.25rem 0.4rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.75rem' }} />
                        {canLog && (
                            <button onClick={openNewActivity}
                                style={{ padding: '0.15rem 0.4rem', borderRadius: '8px', border: 'none', background: '#1B2042', color: '#fff', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                                <FaPlus size={12} /> New Activity
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {paginatedActivities.map(a => {
                            const site = a.siteId ? siteById.get(a.siteId) : undefined;
                            return (
                                <div key={a.id} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <FaHardHat style={{ color: '#1B2042' }} />
                                            <span style={{ fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{a.project}</span>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 600, padding: '0.05rem 0.35rem', borderRadius: '4px', background: `${statusColor(a.status)}20`, color: statusColor(a.status), textTransform: 'capitalize' }}>{a.status.replace('_', ' ')}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.date} &mdash; {a.description} {a.workers > 0 && `(${a.workers} workers)`}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            <FaUserTie size={10} />
                                            {site ? (
                                                <span>Site: {site.name} &middot; {site.assignedEngineerName || 'Unassigned engineer'}</span>
                                            ) : (
                                                <span>No site linked</span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                                        {canLog && <button onClick={() => openEditActivity(a)} className="admin-icon-btn"><FaEdit /></button>}
                                        <button onClick={() => setConfirmDeleteActivityId(a.id)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }}><FaTrash /></button>
                                    </div>
                                </div>
                            );
                        })}
                        {paginatedActivities.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem', fontSize: '0.85rem' }}>
                                {loadingActivities ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: '20vh', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        <FaSpinner className="spin" size={24} style={{ color: 'var(--primary)' }} /> Loading...
                                    </span>
                                ) : 'No activities found.'}
                            </p>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '0.25rem 0', flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Showing {pageSize === 0 ? filteredActivities.length : Math.min(pageSize, filteredActivities.length - (page - 1) * pageSize)} of {filteredActivities.length}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Per page:</span>
                                <select className="form-select" style={{ width: 'auto', padding: '0.2rem 1rem 0.2rem 0.4rem', fontSize: '0.7rem' }}
                                    value={pageSize} onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}>
                                    {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                    <option value={0}>All</option>
                                </select>
                            </div>
                            {pageSize > 0 && totalActivityPages > 1 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.4rem' }} disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><FaChevronLeft /></button>
                                    {Array.from({ length: totalActivityPages }, (_, i) => i + 1).map(p => (
                                        <button key={p} className={p === page ? 'admin-btn' : 'admin-btn admin-btn--secondary'} style={{ padding: '0.2rem 0.5rem', minWidth: 28, fontSize: '0.75rem' }} onClick={() => setPage(p)}>{p}</button>
                                    ))}
                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.4rem' }} disabled={page >= totalActivityPages} onClick={() => setPage(p => Math.min(totalActivityPages, p + 1))}><FaChevronRight /></button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ===== EVIDENCE TAB ===== */}
            {activeTab === 'evidence' && (
                <>
                    <div className="admin-cards-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                        <StatTile icon={<FaImage />} label="Total" value={evidences.length.toString()} accent="#1B2042" emphasis />
                        <StatTile icon={<FaImage />} label="Images" value={evidences.filter(e => e.type === 'image').length.toString()} accent="#22c55e" />
                        <StatTile icon={<FaVideo />} label="Videos" value={evidences.filter(e => e.type === 'video').length.toString()} accent="#f59e0b" />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input value={evidenceSearch} onChange={e => { setEvidencePage(1); setEvidenceSearch(e.target.value); }}
                            placeholder="Search by project or title..."
                            style={{ flex: 1, minWidth: '200px', padding: '0.25rem 0.4rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.75rem' }} />
                        {canLog && (
                            <button onClick={openNewEvidence}
                                style={{ padding: '0.15rem 0.4rem', borderRadius: '8px', border: 'none', background: '#1B2042', color: '#fff', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                                <FaPlus size={12} /> Add Evidence
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {paginatedEvidence.map(e => {
                            const site = e.siteId ? siteById.get(e.siteId) : undefined;
                            const displayType = mediaTypeFromUrl(e.url);
                            return (
                                <div key={e.id} className="content-card" style={{
                                    padding: 0, overflow: 'hidden', borderRadius: 12,
                                    background: '#fff', border: '1px solid var(--border-color)',
                                    transition: 'box-shadow 0.2s, transform 0.2s',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                }}
                                    onMouseEnter={el => { el.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; el.currentTarget.style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={el => { el.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; el.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    <div
                                        onClick={() => setPreviewItem(e)}
                                        style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden', background: '#f0f0f0', aspectRatio: '16/10' }}
                                    >
                                        {displayType === 'video' ? (
                                            <>
                                                <video src={e.url} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', background: '#000' }} muted />
                                                <div style={{
                                                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: 'rgba(0,0,0,0.25)', transition: 'background 0.2s',
                                                }}>
                                                    <div style={{
                                                        width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.9)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                                                        color: '#1B2042',
                                                    }}>
                                                        <FaVideo />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <img src={e.url} alt={e.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                        )}
                                        <div style={{
                                            position: 'absolute', top: 8, right: 8,
                                            background: 'rgba(0,0,0,0.55)', borderRadius: 6,
                                            padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700,
                                            color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px',
                                        }}>
                                            {displayType}
                                        </div>
                                    </div>
                                    <div style={{ padding: '0.75rem 0.85rem' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.15rem', color: 'var(--text-main)' }}>
                                            {e.title}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                            {e.project} &middot; {e.date}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                            <FaUserTie size={9} />
                                            {site ? (
                                                <span>{site.name} &middot; {site.assignedEngineerName || 'Unassigned engineer'}</span>
                                            ) : (
                                                <span>No site linked</span>
                                            )}
                                        </div>
                                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                                            <button onClick={() => setPreviewItem(e)} className="admin-icon-btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }} title="View"><FaExpand size={11} /> View</button>
                                            {canLog && <button onClick={() => openEditEvidence(e)} className="admin-icon-btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }} title="Edit"><FaEdit size={11} /> Edit</button>}
                                            <button onClick={() => setConfirmDeleteEvidenceId(e.id)} className="admin-icon-btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', color: 'var(--primary-red)' }} title="Delete"><FaTrash size={11} /></button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {paginatedEvidence.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                {loadingEvidence ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: '20vh', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        <FaSpinner className="spin" size={24} style={{ color: 'var(--primary)' }} /> Loading...
                                    </span>
                                ) : 'No evidence found.'}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', padding: '0.25rem 0', flexWrap: 'wrap', gap: 4 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Showing {evidencePageSize === 0 ? filteredEvidence.length : Math.min(evidencePageSize, filteredEvidence.length - (evidencePage - 1) * evidencePageSize)} of {filteredEvidence.length}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Per page:</span>
                                <select className="form-select" style={{ width: 'auto', padding: '0.2rem 1rem 0.2rem 0.4rem', fontSize: '0.7rem' }}
                                    value={evidencePageSize} onChange={e => { setEvidencePage(1); setEvidencePageSize(Number(e.target.value)); }}>
                                    {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                    <option value={0}>All</option>
                                </select>
                            </div>
                            {evidencePageSize > 0 && totalEvidencePages > 1 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.4rem' }} disabled={evidencePage <= 1} onClick={() => setEvidencePage(p => Math.max(1, p - 1))}><FaChevronLeft /></button>
                                    {Array.from({ length: totalEvidencePages }, (_, i) => i + 1).map(p => (
                                        <button key={p} className={p === evidencePage ? 'admin-btn' : 'admin-btn admin-btn--secondary'} style={{ padding: '0.2rem 0.5rem', minWidth: 26, fontSize: '0.75rem' }} onClick={() => setEvidencePage(p)}>{p}</button>
                                    ))}
                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.4rem' }} disabled={evidencePage >= totalEvidencePages} onClick={() => setEvidencePage(p => Math.min(totalEvidencePages, p + 1))}><FaChevronRight /></button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ===== ACTIVITY MODAL ===== */}
            {showActivityModal && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal" style={{ width: '100%', maxWidth: 500, padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <h3 style={{ fontWeight: 800, fontSize: '0.9rem' }}>{editingActivity ? 'Edit Activity' : 'New Activity'}</h3>
                            <button onClick={closeActivityModal} disabled={savingActivity} style={{ color: 'var(--text-muted)' }}><FaTimes /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div className="form-group">
                                <label className="form-label">Project</label>
                                <select value={activityForm.project} onChange={e => setActivityForm(p => ({ ...p, project: e.target.value }))} className="form-select">
                                    <option value="">Select project</option>
                                    {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Site</label>
                                <select value={activityForm.siteId} onChange={e => setActivityForm(p => ({ ...p, siteId: e.target.value }))} className="form-select">
                                    <option value="">Select site</option>
                                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input type="date" value={activityForm.date} onChange={e => setActivityForm(p => ({ ...p, date: e.target.value }))} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select value={activityForm.status} onChange={e => setActivityForm(p => ({ ...p, status: e.target.value as any }))} className="form-select">
                                        <option value="planned">Planned</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea value={activityForm.description} onChange={e => setActivityForm(p => ({ ...p, description: e.target.value }))} className="form-textarea" rows={2} placeholder="What was done?" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Workers On Site</label>
                                <input type="number" value={activityForm.workers || ''} onChange={e => setActivityForm(p => ({ ...p, workers: e.target.value === '' ? '' : parseInt(e.target.value) || '' }))} className="form-input" placeholder="e.g. 15" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <textarea value={activityForm.notes} onChange={e => setActivityForm(p => ({ ...p, notes: e.target.value }))} className="form-textarea" rows={2} placeholder="Additional notes..." />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1rem' }}>
                            <button onClick={closeActivityModal} disabled={savingActivity} className="admin-icon-btn" style={{ width: 'auto', padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}>Cancel</button>
                            <button onClick={saveActivity} disabled={savingActivity} className="btn-primary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}><FaSave /> {savingActivity ? 'Saving...' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== EVIDENCE MODAL ===== */}
            {showEvidenceModal && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', borderRadius: 0 }}>
                        <div className="admin-modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem' }}>
                                <FaImage style={{ color: 'var(--primary)' }} /> {editingEvidence ? 'Edit Evidence' : 'Add Evidence'}
                            </h3>
                            <button onClick={closeEvidenceModal} disabled={savingEvidence} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><FaTimes /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Project</label>
                                    <select value={evidenceForm.project} onChange={e => setEvidenceForm(p => ({ ...p, project: e.target.value }))} className="form-select" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: '100%', maxWidth: '250px' }}>
                                        <option value="">Select</option>
                                        {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Date</label>
                                    <input type="date" value={evidenceForm.date} onChange={e => setEvidenceForm(p => ({ ...p, date: e.target.value }))} className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Site</label>
                                <select value={evidenceForm.siteId} onChange={e => setEvidenceForm(p => ({ ...p, siteId: e.target.value }))} className="form-select" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: '100%', maxWidth: '250px' }}>
                                    <option value="">Select site</option>
                                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Title</label>
                                <input value={evidenceForm.title} onChange={e => setEvidenceForm(p => ({ ...p, title: e.target.value }))} className="form-input" placeholder="e.g. Foundation pour" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: '100%', maxWidth: '250px' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Media Files</label>
                                {mediaFiles.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.5rem' }}>
                                        {mediaFiles.map((f, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.5rem', background: 'var(--bg-body)', borderRadius: 6, border: '1px solid var(--border-color)' }}>
                                                <div style={{ width: 48, height: 36, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: '#000' }}>
                                                    {f.type === 'video' ? (
                                                        <video src={f.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                                                    ) : (
                                                        <img src={f.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    )}
                                                </div>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', flexShrink: 0 }}>{f.type}</span>
                                                <span style={{ flex: 1, fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.url.split('/').pop()}</span>
                                                <button onClick={() => setMediaFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--primary-red)', cursor: 'pointer', fontSize: '0.75rem', padding: 2 }}><FaTrash size={10} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="file" accept="image/*,video/*" multiple onChange={handleFileUpload} disabled={uploading} style={{ fontSize: '0.78rem', flex: 1 }} />
                                </div>
                                {uploading && (
                                    <div style={{ marginTop: 6 }}>
                                        <div style={{ width: '100%', maxWidth: 260, height: 6, background: '#eee', borderRadius: 3, overflow: 'hidden' }}>
                                            <div style={{ width: `${uploadProgress}%`, height: 6, background: 'var(--primary-teal)', borderRadius: 3, transition: 'width 0.3s' }} />
                                        </div>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Uploading... {uploadProgress}%</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Notes</label>
                                <textarea value={evidenceForm.notes} onChange={e => setEvidenceForm(p => ({ ...p, notes: e.target.value }))} className="form-textarea" rows={1} placeholder="Optional notes" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: '100%', maxWidth: '250px', height: '100px' }} />
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button onClick={closeEvidenceModal} disabled={savingEvidence} className="admin-btn admin-btn--secondary">Cancel</button>
                            <button onClick={saveEvidence} disabled={savingEvidence || uploading} className="admin-btn"><FaSave size={11} /> {savingEvidence ? 'Saving...' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview overlay */}
            {previewItem && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setPreviewItem(null)}>
                    <button onClick={() => setPreviewItem(null)}
                        style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.1rem', cursor: 'pointer', zIndex: 1 }}>
                        <FaTimes />
                    </button>
                    {mediaTypeFromUrl(previewItem.url) === 'video' ? (
                        <video src={previewItem.url} controls autoPlay style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '12px' }} onClick={ev => ev.stopPropagation()} />
                    ) : (
                        <img src={previewItem.url} alt="Preview" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '12px', objectFit: 'contain' }} onClick={ev => ev.stopPropagation()} />
                    )}
                </div>
            )}

            {/* Delete confirmations */}
            <ConfirmDialog
                open={!!confirmDeleteActivityId}
                title="Delete activity?"
                message="This will permanently remove this site activity entry. This can't be undone."
                onConfirm={() => { if (confirmDeleteActivityId) deleteActivity(confirmDeleteActivityId); setConfirmDeleteActivityId(null); }}
                onCancel={() => setConfirmDeleteActivityId(null)}
            />
            <ConfirmDialog
                open={!!confirmDeleteEvidenceId}
                title="Delete evidence?"
                message="This will permanently remove this evidence entry and its media. This can't be undone."
                onConfirm={() => { if (confirmDeleteEvidenceId) deleteEvidence(confirmDeleteEvidenceId); setConfirmDeleteEvidenceId(null); }}
                onCancel={() => setConfirmDeleteEvidenceId(null)}
            />
        </div>
    );
};

export default SiteActivities;
