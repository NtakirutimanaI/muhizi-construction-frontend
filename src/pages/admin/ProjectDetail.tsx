import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { constructionService } from '../../services/constructionService';
import { sitesService, type Site, type SiteActivity, type SiteRule, type ProjectEvidence, type Approval, type Contract } from '../../services/sitesService';
import { useToast } from '../../context/ToastContext';
import { FaArrowLeft, FaProjectDiagram, FaHardHat, FaTruck, FaCamera, FaCheckDouble, FaFileAlt, FaGavel, FaMapMarkerAlt, FaUser, FaCalendarAlt, FaCheckCircle, FaSpinner, FaClock, FaTimesCircle, FaCheck, FaBullhorn, FaLock, FaListAlt, FaExclamationTriangle, FaMoneyCheckAlt, FaPlus, FaTimes as FaTimesIcon } from 'react-icons/fa';
import { loadPageCache, savePageCache } from '../../utils/pageCache';

type Tab = 'overview' | 'sites' | 'approvals' | 'contracts' | 'rules';

const iconMap: Record<string, React.ReactNode> = {
    FaClock: <FaClock size={16} />, FaHardHat: <FaHardHat size={16} />,
    FaMoneyCheckAlt: <FaMoneyCheckAlt size={16} />, FaLock: <FaLock size={16} />,
    FaListAlt: <FaListAlt size={16} />, FaExclamationTriangle: <FaExclamationTriangle size={16} />,
    FaBullhorn: <FaBullhorn size={16} />,
};

const statusStyles: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    planning: { color: '#6b7280', bg: '#6b728020', icon: <FaClock size={12} /> },
    in_progress: { color: '#1B2042', bg: '#1B204220', icon: <FaSpinner size={12} /> },
    completed: { color: '#22c55e', bg: '#22c55e20', icon: <FaCheckCircle size={12} /> },
    cancelled: { color: '#ef4444', bg: '#ef444420', icon: <FaTimesCircle size={12} /> },
};

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <FaProjectDiagram size={14} /> },
    { key: 'sites', label: 'Sites & Activities', icon: <FaHardHat size={14} /> },
    { key: 'approvals', label: 'Approvals', icon: <FaCheckDouble size={14} /> },
    { key: 'contracts', label: 'Contracts', icon: <FaFileAlt size={14} /> },
    { key: 'rules', label: 'Site Rules', icon: <FaGavel size={14} /> },
];

interface SiteFormData {
    name: string; description: string; location: string;
    status: 'active' | 'inactive' | 'completed';
    budget: number; startDate: string; endDate: string;
}

const emptySiteForm: SiteFormData = {
    name: '', description: '', location: '', status: 'active',
    budget: 0, startDate: '', endDate: '',
};

const ProjectDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [project, setProject] = useState<any>(null);
    const [sites, setSites] = useState<Site[]>([]);
    const [approvals, setApprovals] = useState<Approval[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [loading, setLoading] = useState(false);
    const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
    const [selectedRule, setSelectedRule] = useState<SiteRule | null>(null);
    const [showCreateSite, setShowCreateSite] = useState(false);
    const [siteForm, setSiteForm] = useState<SiteFormData>(emptySiteForm);
    const [creatingSite, setCreatingSite] = useState(false);

    useEffect(() => {
        if (!id) return;
        const cacheKey = 'pg_project_detail';
        const cached = loadPageCache<any>(cacheKey);
        if (cached) {
            if (cached.project) setProject(cached.project);
            if (cached.sites) setSites(cached.sites);
            if (cached.approvals) setApprovals(cached.approvals);
            if (cached.contracts) setContracts(cached.contracts);
        }

        const fetch = async () => {
            try {
                const [projRes, sitesRes, approvalsRes, contractsRes] = await Promise.all([
                    constructionService.getProject(id!),
                    sitesService.getByProject(id!),
                    api.get('/approvals').catch(() => ({ data: [] })),
                    api.get('/contracts').catch(() => ({ data: [] })),
                ]);
                const projData = projRes.data;
                const sitesData = sitesRes.data || [];
                const approvalsData = (approvalsRes.data || []) as Approval[];
                const contractsData = (contractsRes.data || []) as Contract[];
                setProject(projData);
                setSites(sitesData);
                setApprovals(approvalsData);
                setContracts(contractsData);
                savePageCache(cacheKey, { project: projData, sites: sitesData, approvals: approvalsData, contracts: contractsData });
            } catch {
                setProject(null);
            }
        };
        fetch();
    }, [id]);

    const handleCreateSite = async () => {
        if (!siteForm.name.trim()) { showToast('Site name is required', 'error'); return; }
        try {
            setCreatingSite(true);
            await sitesService.create({
                name: siteForm.name,
                description: siteForm.description || undefined,
                location: siteForm.location || undefined,
                status: siteForm.status,
                budget: siteForm.budget || undefined,
                startDate: siteForm.startDate || undefined,
                endDate: siteForm.endDate || undefined,
                projectId: id!,
            });
            showToast('Site created successfully', 'success');
            setShowCreateSite(false);
            setSiteForm(emptySiteForm);
            const sitesRes = await sitesService.getByProject(id!);
            setSites(sitesRes.data || []);
            window.dispatchEvent(new CustomEvent('sites-updated', { detail: { projectId: id } }));
        } catch (e: any) {
            const errMsg = e?.response?.data ? JSON.stringify(e.response.data) : (e?.message || 'Failed to create site');
            showToast(errMsg, 'error');
        } finally {
            setCreatingSite(false);
        }
    };

    if (!project) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Project not found.</div>;

    const allActivities = sites.flatMap(s => (s.activities || []).map(a => ({ ...a, siteName: s.name })));
    const allEvidence = sites.flatMap(s => (s.evidence || []).map(e => ({ ...e, siteName: s.name })));
    const allRules = sites.flatMap(s => (s.rules || []).map(r => ({ ...r, siteName: s.name })));
    const totalSites = sites.length;
    const totalMaterials = allActivities.filter(a => a.description.toLowerCase().includes('material') || a.description.toLowerCase().includes('deliver')).length;

    return (
        <div>
            <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/admin/sites')}
                    style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FaArrowLeft size={12} /> Back
                </button>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaProjectDiagram style={{ color: '#1B2042' }} /> {project.name}
                    </h1>
                    {project.location && <p style={{ margin: '0.15rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <FaMapMarkerAlt size={12} /> {project.location}
                    </p>}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', borderBottom: '2px solid var(--border-color)', paddingBottom: 0 }}>
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)}
                        style={{
                            padding: '0.5rem 1rem', border: 'none', background: 'none',
                            color: activeTab === t.key ? '#1B2042' : 'var(--text-muted)',
                            cursor: 'pointer', fontSize: '0.82rem', fontWeight: activeTab === t.key ? 700 : 500,
                            borderBottom: activeTab === t.key ? '2px solid #1B2042' : '2px solid transparent',
                            marginBottom: '-2px', display: 'flex', alignItems: 'center', gap: '0.35rem',
                            transition: 'all 0.15s',
                        }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div className="content-card" style={{ padding: '0.75rem 1rem', borderLeft: '3px solid #1B2042' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Status</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                {statusStyles[project.status]?.icon} <span style={{ textTransform: 'capitalize' }}>{project.status.replace('_', ' ')}</span>
                            </div>
                        </div>
                        <div className="content-card" style={{ padding: '0.75rem 1rem', borderLeft: '3px solid #22c55e' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Budget</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.15rem' }}>RWF {(project.budget || 0).toLocaleString()}</div>
                        </div>
                        <div className="content-card" style={{ padding: '0.75rem 1rem', borderLeft: '3px solid #1B2042' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Progress</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.15rem' }}>{project.progress || 0}%</div>
                            <div style={{ marginTop: '0.3rem', height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: `${project.progress || 0}%`, height: '100%', background: '#1B2042', borderRadius: '2px' }} />
                            </div>
                        </div>
                        <div className="content-card" style={{ padding: '0.75rem 1rem', borderLeft: '3px solid #1B2042' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Type</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.15rem', textTransform: 'capitalize' }}>{project.type || '—'}</div>
                        </div>
                    </div>

                    {project.description && (
                        <div className="content-card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.35rem' }}>Description</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>{project.description}</p>
                        </div>
                    )}

                    <div className="content-card" style={{ padding: '1rem 1.25rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Project Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                            {project.clientName && <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Client</span><div style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><FaUser size={12} /> {project.clientName}</div></div>}
                            {project.startDate && <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Start Date</span><div style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><FaCalendarAlt size={12} /> {new Date(project.startDate).toLocaleDateString()}</div></div>}
                            {project.endDate && <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>End Date</span><div style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><FaCalendarAlt size={12} /> {new Date(project.endDate).toLocaleDateString()}</div></div>}
                            <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created</span><div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{new Date(project.createdAt).toLocaleDateString()}</div></div>
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                        {[
                            { icon: <FaHardHat />, label: 'Sites', count: totalSites, tab: 'sites' as Tab },
                            { icon: <FaTruck />, label: 'Material Activities', count: totalMaterials, tab: 'sites' as Tab },
                            { icon: <FaCheckDouble />, label: 'Pending Approvals', count: approvals.filter(a => a.status === 'pending').length, tab: 'approvals' as Tab },
                            { icon: <FaFileAlt />, label: 'Contracts', count: contracts.length, tab: 'contracts' as Tab },
                            { icon: <FaGavel />, label: 'Site Rules', count: allRules.length, tab: 'rules' as Tab },
                        ].map((s, i) => (
                            <div key={i} className="content-card" style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderLeft: '3px solid #1B2042' }}
                                onClick={() => setActiveTab(s.tab)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.icon} {s.label}</div>
                                <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.1rem' }}>{s.count}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'sites' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{sites.length} site{sites.length !== 1 ? 's' : ''}</span>
                        <button className="admin-btn" onClick={() => setShowCreateSite(true)}
                            style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.4rem 1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <FaPlus /> Create Site
                        </button>
                    </div>
                    {sites.length === 0 ? (
                        <div className="content-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No sites created for this project yet.
                        </div>
                    ) : (
                        sites.map(site => (
                            <div key={site.id} id={`site-${site.id}`} className="content-card" style={{ padding: '1rem 1.25rem', marginBottom: '0.75rem' }}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <FaHardHat /> {site.name}
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.1rem 0.5rem', borderRadius: '10px', background: site.status === 'active' ? '#22c55e20' : site.status === 'completed' ? '#1B204220' : '#f59e0b20', color: site.status === 'active' ? '#22c55e' : site.status === 'completed' ? '#1B2042' : '#f59e0b', textTransform: 'capitalize', marginLeft: '0.5rem' }}>{site.status}</span>
                                </h3>
                                {site.location && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><FaMapMarkerAlt size={10} /> {site.location}</p>}

                                {site.activities && site.activities.length > 0 && (
                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <h4 style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>Activities</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                            {site.activities.slice(0, 5).map(a => (
                                                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.25rem' }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{a.description}</div>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.date}{a.workers ? ` · ${a.workers} workers` : ''}</div>
                                                    </div>
                                                    <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.1rem 0.45rem', borderRadius: '10px', background: a.status === 'completed' ? '#22c55e20' : a.status === 'in_progress' ? '#1B204220' : '#f59e0b20', color: a.status === 'completed' ? '#22c55e' : a.status === 'in_progress' ? '#1B2042' : '#f59e0b', textTransform: 'capitalize' }}>{a.status.replace('_', ' ')}</span>
                                                </div>
                                            ))}
                                            {site.activities.length > 5 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>+{site.activities.length - 5} more</span>}
                                        </div>
                                    </div>
                                )}

                                {site.evidence && site.evidence.length > 0 && (
                                    <div>
                                        <h4 style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>Evidence</h4>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {site.evidence.slice(0, 4).map(e => (
                                                <div key={e.id} style={{ padding: '0.4rem 0.6rem', background: 'var(--bg-body)', borderRadius: '8px', textAlign: 'center', fontSize: '0.72rem', border: '1px solid var(--border-color)', minWidth: '100px' }}>
                                                    <div style={{ fontSize: '1.1rem', marginBottom: '0.15rem' }}>{e.type === 'image' ? '📷' : '🎥'}</div>
                                                    <div style={{ fontWeight: 600 }}>{e.title}</div>
                                                    <div style={{ color: 'var(--text-muted)' }}>{e.date}</div>
                                                </div>
                                            ))}
                                            {site.evidence.length > 4 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>+{site.evidence.length - 4} more</span>}
                                        </div>
                                    </div>
                                )}

                                {(!site.activities || site.activities.length === 0) && (!site.evidence || site.evidence.length === 0) && (
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No activities or evidence recorded for this site.</p>
                                )}
                            </div>
                        ))
                    )}

                    {showCreateSite && (
                        <div className="admin-modal-overlay" onClick={() => setShowCreateSite(false)}>
                            <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                                <div className="admin-modal-header">
                                    <h3><FaHardHat style={{ marginRight: 8 }} />Create Site</h3>
                                    <button onClick={() => setShowCreateSite(false)}><FaTimesIcon /></button>
                                </div>
                                <div className="admin-modal-body">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label className="form-label">Site Name *</label>
                                            <input className="form-input" value={siteForm.name} onChange={e => setSiteForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Main Building Site" />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label className="form-label">Description</label>
                                            <textarea className="form-textarea" rows={2} value={siteForm.description} onChange={e => setSiteForm(p => ({ ...p, description: e.target.value }))} placeholder="Site description" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Location</label>
                                            <input className="form-input" value={siteForm.location} onChange={e => setSiteForm(p => ({ ...p, location: e.target.value }))} placeholder="Site location" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Status</label>
                                            <select className="form-select" value={siteForm.status} onChange={e => setSiteForm(p => ({ ...p, status: e.target.value as any }))}>
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Budget (RWF)</label>
                                            <input type="number" className="form-input" value={siteForm.budget} onChange={e => setSiteForm(p => ({ ...p, budget: Number(e.target.value) }))} placeholder="0" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Start Date</label>
                                            <input type="date" className="form-input" value={siteForm.startDate} onChange={e => setSiteForm(p => ({ ...p, startDate: e.target.value }))} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">End Date</label>
                                            <input type="date" className="form-input" value={siteForm.endDate} onChange={e => setSiteForm(p => ({ ...p, endDate: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>
                                <div className="admin-modal-footer">
                                    <button className="admin-btn admin-btn--secondary" onClick={() => setShowCreateSite(false)}>Cancel</button>
                                    <button className="admin-btn" onClick={handleCreateSite} disabled={creatingSite}>
                                        {creatingSite ? 'Creating...' : 'Create Site'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'approvals' && (
                <div>
                    {approvals.length === 0 ? (
                        <div className="content-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No approvals found.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {approvals.map(a => (
                                <div key={a.id} className="content-card" style={{
                                    padding: '0.85rem 1.1rem',
                                    borderLeft: `4px solid ${a.status === 'approved' ? '#22c55e' : a.status === 'rejected' ? '#ef4444' : '#f59e0b'}`,
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', cursor: 'pointer',
                                }} onClick={() => setSelectedApproval(a)}>
                                    <div style={{ flex: 1, minWidth: '180px' }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{a.title}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{a.requester} &middot; {a.date}{a.amount ? ` · RWF ${a.amount.toLocaleString()}` : ''}</div>
                                    </div>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '12px', background: a.status === 'approved' ? '#22c55e20' : a.status === 'rejected' ? '#ef444420' : '#f59e0b20', color: a.status === 'approved' ? '#22c55e' : a.status === 'rejected' ? '#ef4444' : '#f59e0b' }}>
                                        {a.status === 'approved' ? <FaCheckCircle size={11} /> : a.status === 'rejected' ? <FaTimesCircle size={11} /> : <FaClock size={11} />} {a.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'contracts' && (
                <div>
                    {contracts.length === 0 ? (
                        <div className="content-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No contracts found.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '600px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-body)' }}>
                                        <th style={{ textAlign: 'left', padding: '0.65rem 1rem' }}>Contract</th>
                                        <th style={{ textAlign: 'left', padding: '0.65rem 1rem' }}>Employee</th>
                                        <th style={{ textAlign: 'left', padding: '0.65rem 1rem' }}>Type</th>
                                        <th style={{ textAlign: 'left', padding: '0.65rem 1rem' }}>Period</th>
                                        <th style={{ textAlign: 'center', padding: '0.65rem 1rem' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contracts.map(c => (
                                        <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '0.65rem 1rem', fontWeight: 600, fontSize: '0.82rem' }}>{c.title}</td>
                                            <td style={{ padding: '0.65rem 1rem' }}>{c.employee}</td>
                                            <td style={{ padding: '0.65rem 1rem', textTransform: 'capitalize', fontSize: '0.8rem' }}>{c.type.replace('_', ' ')}</td>
                                            <td style={{ padding: '0.65rem 1rem', fontSize: '0.8rem' }}>{c.period}</td>
                                            <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '12px', background: c.status === 'active' ? '#22c55e20' : c.status === 'expiring_soon' ? '#f59e0b20' : c.status === 'expired' ? '#ef444420' : '#6b728020', color: c.status === 'active' ? '#22c55e' : c.status === 'expiring_soon' ? '#f59e0b' : c.status === 'expired' ? '#ef4444' : '#6b7280' }}>
                                                    {c.status === 'active' ? <FaCheckCircle size={11} /> : c.status === 'expiring_soon' ? <FaClock size={11} /> : c.status === 'expired' ? <FaTimesCircle size={11} /> : <FaFileAlt size={11} />} {c.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'rules' && (
                <div>
                    {allRules.length === 0 ? (
                        <div className="content-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No site rules defined.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
                            {allRules.map((r, i) => (
                                <div key={r.id || i} className="content-card" style={{
                                    padding: '1rem 1.15rem', borderLeft: `4px solid ${r.pinColor || '#1B2042'}`, cursor: 'pointer',
                                }} onClick={() => setSelectedRule(r)}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: `${r.pinColor || '#1B2042'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.pinColor || '#1B2042' }}>
                                            {iconMap[r.iconName] || <FaBullhorn size={14} />}
                                        </div>
                                        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{r.title}</h3>
                                        {r.siteName && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>({r.siteName})</span>}
                                    </div>
                                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        {r.items.slice(0, 2).map((item, j) => (
                                            <li key={j} style={{ fontSize: '0.78rem', lineHeight: 1.4, color: 'var(--text-muted)', paddingLeft: '0.75rem', position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: 0, top: '6px', width: '4px', height: '4px', borderRadius: '50%', background: r.pinColor || '#1B2042' }} />
                                                {item}
                                            </li>
                                        ))}
                                        {r.items.length > 2 && <li style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>+{r.items.length - 2} more</li>}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {selectedApproval && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
                    onClick={() => setSelectedApproval(null)}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
                    <div onClick={(e) => e.stopPropagation()} className="content-card" style={{ position: 'relative', padding: '1.5rem 2rem', maxWidth: '500px', width: '100%' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>{selectedApproval.title}</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{selectedApproval.requester} &middot; {selectedApproval.date}</p>
                        {selectedApproval.amount && <p style={{ fontSize: '1rem', fontWeight: 700, color: '#22c55e' }}>RWF {selectedApproval.amount.toLocaleString()}</p>}
                        {selectedApproval.items && selectedApproval.items.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', fontSize: '0.85rem' }}>
                                <span>{item.name}</span><span style={{ fontWeight: 600 }}>{item.qty} {item.unit}</span>
                            </div>
                        ))}
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setApprovals(prev => prev.map(a => a.id === selectedApproval.id ? { ...a, status: 'approved' } : a)); setSelectedApproval(null); }}
                                style={{ padding: '0.4rem 1rem', borderRadius: '6px', border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                                <FaCheck size={11} /> Approve
                            </button>
                            <button onClick={() => { setApprovals(prev => prev.map(a => a.id === selectedApproval.id ? { ...a, status: 'rejected' } : a)); setSelectedApproval(null); }}
                                style={{ padding: '0.4rem 1rem', borderRadius: '6px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedRule && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
                    onClick={() => setSelectedRule(null)}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
                    <div onClick={(e) => e.stopPropagation()} style={{
                        position: 'relative', background: 'linear-gradient(145deg, #1B2042, #1B2042)', borderRadius: '16px',
                        padding: '1.5rem 2rem', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto', color: '#fff',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {iconMap[selectedRule.iconName] || <FaBullhorn size={16} />}
                            </div>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{selectedRule.title}</h2>
                        </div>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {selectedRule.items.map((item, i) => (
                                <li key={i} style={{ fontSize: '0.95rem', lineHeight: 1.5, paddingLeft: '1.25rem', position: 'relative', opacity: 0.95 }}>
                                    <span style={{ position: 'absolute', left: 0, top: '8px', width: '6px', height: '6px', borderRadius: '50%', background: selectedRule.pinColor || '#1B2042' }} />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => setSelectedRule(null)} style={{ marginTop: '1rem', padding: '0.4rem 1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetail;
