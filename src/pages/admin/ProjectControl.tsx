import { useState, useEffect, useMemo, useCallback } from 'react';
import { FaHardHat, FaProjectDiagram, FaUserCog, FaSave, FaTimes, FaCheckCircle, FaSearch, FaBuilding, FaExclamationTriangle } from 'react-icons/fa';
import { sitesService, type Site } from '../../services/sitesService';
import { constructionService, type Project } from '../../services/constructionService';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';

interface SiteEngineerUser {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    profile?: { firstName?: string; lastName?: string; avatar?: string };
}

interface SiteWithProject extends Site {
    project?: { id: string; name: string; status?: string; progress?: number };
}

const ProjectControl = () => {
    const { showToast } = useToast();
    const [sites, setSites] = useState<SiteWithProject[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [siteEngineers, setSiteEngineers] = useState<SiteEngineerUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingSiteId, setSavingSiteId] = useState<string | null>(null);
    const [pendingAssignments, setPendingAssignments] = useState<Record<string, string>>({});
    const [search, setSearch] = useState('');

    const engineerName = (u: SiteEngineerUser) => {
        const fn = u.profile?.firstName || u.firstName || '';
        const ln = u.profile?.lastName || u.lastName || '';
        return `${fn} ${ln}`.trim() || u.email;
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [sitesRes, projectsRes, usersRes] = await Promise.all([
                sitesService.getAll(),
                constructionService.getProjects(),
                authService.getAllUsers(),
            ]);
            const allSites = (sitesRes.data || []) as SiteWithProject[];
            const allProjects = (projectsRes.data || []) as Project[];
            const allUsers = (usersRes || []) as any[];
            setSites(allSites);
            setProjects(allProjects);
            setSiteEngineers(
                allUsers.filter((u: any) => u.role === 'site_engineer' && u.employmentStatus === 'employed')
            );
        } catch (err) {
            console.error(err);
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredSites = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return sites;
        return sites.filter(s =>
            s.name.toLowerCase().includes(q) ||
            (s.location || '').toLowerCase().includes(q) ||
            (s.project?.name || '').toLowerCase().includes(q) ||
            (s.assignedEngineerName || '').toLowerCase().includes(q)
        );
    }, [sites, search]);

    const handleAssignChange = (siteId: string, engineerId: string) => {
        setPendingAssignments(prev => ({ ...prev, [siteId]: engineerId }));
    };

    const handleSave = async (site: SiteWithProject) => {
        const pendingId = pendingAssignments[site.id];
        if (pendingId === undefined) return;

        setSavingSiteId(site.id);
        try {
            const engineer = pendingId ? siteEngineers.find(e => e.id === pendingId) : null;
            await sitesService.update(site.id, {
                assignedEngineerId: (pendingId || null) as any,
                assignedEngineerName: (engineer ? engineerName(engineer) : null) as any,
            });
            showToast(
                pendingId ? `Assigned ${engineerName(engineer!)} to ${site.name}` : `Removed engineer from ${site.name}`,
                'success'
            );
            setPendingAssignments(prev => {
                const next = { ...prev };
                delete next[site.id];
                return next;
            });
            fetchData();
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to update';
            showToast(Array.isArray(msg) ? msg.join('. ') : msg, 'error');
        } finally {
            setSavingSiteId(null);
        }
    };

    const handleCancel = (siteId: string) => {
        setPendingAssignments(prev => {
            const next = { ...prev };
            delete next[siteId];
            return next;
        });
    };

    const assignedCount = sites.filter(s => s.assignedEngineerId).length;
    const unassignedCount = sites.length - assignedCount;
    const withProject = sites.filter(s => s.projectId).length;

    return (
        <div className="admin-page" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f0f0ff 100%)', minHeight: '100vh', borderRadius: 12, padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.2rem' }}>
                        <FaUserCog style={{ color: '#8B5CF6' }} /> Project Control
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>
                        Assign site engineers to projects. Only employed site engineers are available.
                    </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem' }}>
                    <StatTile icon={<FaBuilding />} label="Total Sites" value={String(sites.length)} accent="#1B2042" />
                    <StatTile icon={<FaProjectDiagram />} label="With Project" value={String(withProject)} accent="#22c55e" />
                    <StatTile icon={<FaCheckCircle />} label="Assigned" value={String(assignedCount)} accent="#8B5CF6" />
                    <StatTile icon={<FaExclamationTriangle />} label="Unassigned" value={String(unassignedCount)} accent={unassignedCount > 0 ? '#f59e0b' : '#22c55e'} />
                </div>
            </div>

            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Sites & Projects ({filteredSites.length})
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ position: 'relative' }}>
                            <FaSearch style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search sites..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ padding: '0.35rem 0.6rem 0.35rem 1.8rem', fontSize: '0.78rem', width: 220 }}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500" style={{ margin: '0 auto 0.75rem' }} />
                        Loading sites and engineers...
                    </div>
                ) : filteredSites.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <FaHardHat size={36} style={{ opacity: 0.2, marginBottom: 10 }} />
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>No sites found</div>
                        <div style={{ fontSize: '0.8rem' }}>Create sites first to assign engineers.</div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{ minWidth: 150 }}>Site</th>
                                    <th style={{ minWidth: 130 }}>Project</th>
                                    <th style={{ minWidth: 130 }}>Assigned Engineer</th>
                                    <th style={{ minWidth: 200 }}>Change Engineer</th>
                                    <th style={{ minWidth: 80 }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSites.map(site => {
                                    const currentPending = pendingAssignments[site.id];
                                    const hasPending = currentPending !== undefined;
                                    const currentEngineerId = site.assignedEngineerId || '';
                                    const displayEngineerId = hasPending ? currentPending : currentEngineerId;
                                    const isSaving = savingSiteId === site.id;
                                    const matchedEngineer = displayEngineerId
                                        ? siteEngineers.find(e => e.id === displayEngineerId)
                                        : null;

                                    return (
                                        <tr key={site.id} style={{ background: hasPending ? '#f0fdf4' : undefined }}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <FaHardHat size={12} style={{ color: '#8B5CF6', flexShrink: 0 }} />
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{site.name}</div>
                                                        {site.location && (
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{site.location}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {site.project ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                        <FaProjectDiagram size={10} style={{ color: '#1B2042', flexShrink: 0 }} />
                                                        <div>
                                                            <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{site.project.name}</span>
                                                            {site.project.status && (
                                                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                                                    {site.project.status.replace(/_/g, ' ')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No project linked</span>
                                                )}
                                            </td>
                                            <td>
                                                {site.assignedEngineerName ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                        <div style={{
                                                            width: 28, height: 28, borderRadius: '50%', background: '#8B5CF620',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '0.65rem', fontWeight: 700, color: '#8B5CF6', flexShrink: 0,
                                                        }}>
                                                            {site.assignedEngineerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{site.assignedEngineerName}</span>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                    <select
                                                        className="form-select"
                                                        value={displayEngineerId}
                                                        onChange={e => handleAssignChange(site.id, e.target.value)}
                                                        disabled={isSaving}
                                                        style={{ fontSize: '0.78rem', padding: '0.3rem 0.5rem', flex: 1, minWidth: 140 }}
                                                    >
                                                        <option value="">— Unassigned —</option>
                                                        {siteEngineers.map(eng => (
                                                            <option key={eng.id} value={eng.id}>{engineerName(eng)}</option>
                                                        ))}
                                                    </select>
                                                    {hasPending && (
                                                        <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
                                                            <button
                                                                className="admin-btn"
                                                                onClick={() => handleSave(site)}
                                                                disabled={isSaving}
                                                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', background: '#22c55e', borderColor: '#22c55e' }}
                                                                title="Save"
                                                            >
                                                                {isSaving ? '...' : <FaSave size={10} />}
                                                            </button>
                                                            <button
                                                                className="admin-btn admin-btn--secondary"
                                                                onClick={() => handleCancel(site.id)}
                                                                disabled={isSaving}
                                                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem' }}
                                                                title="Cancel"
                                                            >
                                                                <FaTimes size={10} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                {matchedEngineer ? (
                                                    <span style={{
                                                        display: 'inline-block', padding: '2px 8px', borderRadius: 12,
                                                        fontSize: '0.72rem', fontWeight: 600, background: '#22c55e20', color: '#22c55e',
                                                    }}>
                                                        Employed
                                                    </span>
                                                ) : displayEngineerId ? (
                                                    <span style={{
                                                        display: 'inline-block', padding: '2px 8px', borderRadius: 12,
                                                        fontSize: '0.72rem', fontWeight: 600, background: '#f59e0b20', color: '#f59e0b',
                                                    }}>
                                                        Not Available
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        display: 'inline-block', padding: '2px 8px', borderRadius: 12,
                                                        fontSize: '0.72rem', fontWeight: 600, background: '#ef444420', color: '#ef4444',
                                                    }}>
                                                        No Engineer
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {siteEngineers.length === 0 && !loading && (
                <div style={{
                    marginTop: '1rem', padding: '0.75rem 1rem', background: '#f59e0b15',
                    border: '1px solid #f59e0b40', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                    <FaExclamationTriangle style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8rem', color: '#f59e0b' }}>
                        No employed site engineers found. Create site engineer accounts with "Employed" status first.
                    </span>
                </div>
            )}
        </div>
    );
};

const StatTile = ({ icon, label, value, accent }: {
    icon: React.ReactNode; label: string; value: string; accent: string;
}) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0,
        background: 'var(--bg-white, #fff)',
        border: '1px solid var(--border-color, #e5e7eb)',
        borderRadius: 10, padding: '0.6rem 0.8rem',
    }}>
        <div style={{
            width: 32, height: 32, borderRadius: 8, background: `${accent}15`, color: accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.85rem',
        }}>{icon}</div>
        <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #6b7280)' }}>{label}</div>
            <div style={{
                fontSize: '0.9rem', fontWeight: 700,
                color: 'var(--text-main, #111)', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis'
            }}>{value}</div>
        </div>
    </div>
);

export default ProjectControl;
