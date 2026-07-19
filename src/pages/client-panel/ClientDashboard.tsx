import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FaHardHat, FaImage, FaClipboardList, FaProjectDiagram,
    FaArrowRight, FaCheckCircle, FaClock, FaMapMarkerAlt,
} from 'react-icons/fa';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { clientPortalService } from '../../services/clientPortalService';
import type { Project } from '../../services/constructionService';
import type { ProjectEvidence } from '../../services/projectEvidenceService';

const COLORS = ['#6c3096', '#b84c8c', '#0d9488', '#f59e0b', '#3b82f6', '#ef4444'];

const CACHE_TTL = 5 * 60 * 1000;
function loadCache(key: string) {
    try {
        const raw = localStorage.getItem('db_cache_' + key);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL) return null;
        return data;
    } catch { return null; }
}
function saveCache(key: string, data: any) {
    try { localStorage.setItem('db_cache_' + key, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

const ClientDashboard = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [evidence, setEvidence] = useState<ProjectEvidence[]>([]);

    useEffect(() => {
        const cached = loadCache('client');
        if (cached) {
            if (cached.projects) setProjects(cached.projects);
            if (cached.evidence) setEvidence(cached.evidence);
        }

        const fetchFresh = async () => {
            try {
                const projectsRes = await clientPortalService.getMyProjects();
                const projectsData = (projectsRes.data || []) as Project[];
                setProjects(projectsData);
                const evidenceResults = await Promise.all(
                    projectsData.map((p) => clientPortalService.getProjectEvidence(p.id).catch(() => ({ data: [] })))
                );
                const evData = evidenceResults.flatMap((r) => r.data || []);
                setEvidence(evData);
                saveCache('client', { projects: projectsData, evidence: evData });
            } catch {}
        };
        fetchFresh();
    }, []);

    const sites = projects.flatMap((p: any) => p.sites || []);
    const activeProjects = projects.filter(p => p.status === 'in_progress');
    const completedProjects = projects.filter(p => p.status === 'completed');
    const avgProgress = projects.length > 0
        ? Math.round(projects.reduce((s, p) => s + (p.progress || 0), 0) / projects.length)
        : 0;

    const statusData = [
        { name: 'In Progress', value: activeProjects.length },
        { name: 'Completed', value: completedProjects.length },
        { name: 'Planning', value: projects.filter(p => p.status === 'planning').length },
        { name: 'Cancelled', value: projects.filter(p => p.status === 'cancelled').length },
    ].filter(d => d.value > 0);

    const progressData = projects.map(p => ({
        name: p.name.length > 14 ? p.name.slice(0, 14) + '...' : p.name,
        progress: p.progress || 0,
    }));

    const recentEvidence = evidence.slice(0, 5);

    const renderPieLabel = ({ name, percent }: any) => {
        if (percent < 0.05) return null;
        return `${name} ${(percent * 100).toFixed(0)}%`;
    };

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">
                        Welcome{user?.firstName ? `, ${user.firstName}` : ''}
                    </h1>
                    <p className="dashboard-subtitle">
                        Browse sites, track updates, and manage your profile
                    </p>
                </div>
                <div className="dashboard-quick-actions">
                    <Link to="/client-panel/sites" className="dashboard-quick-action">
                        <div className="dashboard-quick-action-icon" style={{ background: '#6c3096' }}><FaHardHat /></div>
                        <div>
                            <div className="dashboard-quick-action-label">My Sites</div>
                            <div className="dashboard-quick-action-sub">{sites.length} sites</div>
                        </div>
                    </Link>
                    <Link to="/client-panel/updates" className="dashboard-quick-action">
                        <div className="dashboard-quick-action-icon" style={{ background: '#b84c8c' }}><FaImage /></div>
                        <div>
                            <div className="dashboard-quick-action-label">Updates</div>
                            <div className="dashboard-quick-action-sub">{evidence.length} items</div>
                        </div>
                    </Link>
                </div>
            </div>

            <div className="dashboard-cards">
                <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #6c3096, #8b5cf6)' }}>
                    <div className="dashboard-card-content">
                        <div className="dashboard-card-top">
                            <span className="dashboard-card-label">My Projects</span>
                            <div className="dashboard-card-icon-box" style={{ background: 'rgba(255,255,255,0.2)' }}><FaProjectDiagram /></div>
                        </div>
                        <div className="dashboard-card-value">{projects.length}</div>
                        <div className="dashboard-card-sub">{activeProjects.length} active</div>
                    </div>
                    <div className="dashboard-card-watermark"><FaProjectDiagram /></div>
                </div>
                <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}>
                    <div className="dashboard-card-content">
                        <div className="dashboard-card-top">
                            <span className="dashboard-card-label">Sites</span>
                            <div className="dashboard-card-icon-box" style={{ background: 'rgba(255,255,255,0.2)' }}><FaHardHat /></div>
                        </div>
                        <div className="dashboard-card-value">{sites.length}</div>
                        <div className="dashboard-card-sub">construction sites</div>
                    </div>
                    <div className="dashboard-card-watermark"><FaHardHat /></div>
                </div>
                <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #b84c8c, #ec4899)' }}>
                    <div className="dashboard-card-content">
                        <div className="dashboard-card-top">
                            <span className="dashboard-card-label">Evidence</span>
                            <div className="dashboard-card-icon-box" style={{ background: 'rgba(255,255,255,0.2)' }}><FaImage /></div>
                        </div>
                        <div className="dashboard-card-value">{evidence.length}</div>
                        <div className="dashboard-card-sub">{evidence.filter(e => e.type === 'image').length} images</div>
                    </div>
                    <div className="dashboard-card-watermark"><FaImage /></div>
                </div>
                <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                    <div className="dashboard-card-content">
                        <div className="dashboard-card-top">
                            <span className="dashboard-card-label">Avg Progress</span>
                            <div className="dashboard-card-icon-box" style={{ background: 'rgba(255,255,255,0.2)' }}><FaCheckCircle /></div>
                        </div>
                        <div className="dashboard-card-value">{avgProgress}%</div>
                        <div className="dashboard-card-sub">overall completion</div>
                    </div>
                    <div className="dashboard-card-watermark"><FaCheckCircle /></div>
                </div>
            </div>

            <div className="dashboard-charts-row">
                <div className="dashboard-chart-card dashboard-chart-wide">
                    <h3 className="dashboard-chart-title">
                        <FaProjectDiagram style={{ color: '#6c3096' }} /> Project Progress
                    </h3>
                    {progressData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={progressData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e5e7eb)" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                                <Tooltip formatter={(value: number) => `${value}%`} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="progress" name="Progress %" fill="#6c3096" radius={[4, 4, 0, 0]}>
                                    {progressData.map((_: any, i: number) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="dashboard-chart-empty">No project data yet</div>
                    )}
                </div>

                <div className="dashboard-chart-card">
                    <h3 className="dashboard-chart-title">
                        <FaCheckCircle style={{ color: '#0d9488' }} /> Project Status
                    </h3>
                    {statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%" cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                    label={renderPieLabel}
                                    labelLine={false}
                                >
                                    {statusData.map((_: any, i: number) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="dashboard-chart-empty">No projects yet</div>
                    )}
                </div>
            </div>

            {recentEvidence.length > 0 && (
                <div className="dashboard-chart-card" style={{ marginBottom: '1rem' }}>
                    <div className="dashboard-chart-header">
                        <h3 className="dashboard-chart-title">
                            <FaImage style={{ color: '#b84c8c' }} /> Recent Updates
                        </h3>
                        <Link to="/client-panel/updates" className="dashboard-view-all">
                            View All <FaArrowRight size={10} />
                        </Link>
                    </div>
                    <div className="dashboard-messages-list">
                        {recentEvidence.map((item, i) => (
                            <div key={item.id || i} className="dashboard-message-item" style={{ borderBottom: i < recentEvidence.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                <div className="dashboard-message-info">
                                    <div className="dashboard-message-name">
                                        {item.title || 'Update'}
                                        <span className="dashboard-message-badge" style={{ background: item.type === 'video' ? '#b84c8c' : '#6c3096' }}>
                                            {item.type === 'video' ? 'VIDEO' : 'IMAGE'}
                                        </span>
                                    </div>
                                    <div className="dashboard-message-subject">{item.project}</div>
                                </div>
                                <div className="dashboard-message-date">
                                    {item.date ? new Date(item.date).toLocaleDateString() : '—'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {projects.length > 0 && (
                <div className="dashboard-chart-card">
                    <div className="dashboard-chart-header">
                        <h3 className="dashboard-chart-title">
                            <FaHardHat style={{ color: '#6c3096' }} /> My Projects
                        </h3>
                        <Link to="/client-panel/sites" className="dashboard-view-all">
                            View Sites <FaArrowRight size={10} />
                        </Link>
                    </div>
                    <div className="dashboard-sites-list">
                        {projects.map(project => (
                            <div key={project.id} className="dashboard-project-item">
                                <div className="dashboard-project-header">
                                    <FaProjectDiagram style={{ color: '#6c3096', fontSize: '0.85rem' }} />
                                    <span className="dashboard-project-name">{project.name}</span>
                                    <span className={`dashboard-project-status dashboard-project-status--${project.status}`}>
                                        {project.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '1.25rem' }}>
                                    <div style={{ flex: 1, height: '5px', background: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${project.progress || 0}%`, height: '100%', background: project.status === 'completed' ? '#0d9488' : '#6c3096', borderRadius: '3px' }} />
                                    </div>
                                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6c3096', minWidth: '28px' }}>{project.progress || 0}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDashboard;
