import { useState, useEffect } from 'react';
import { FaImage, FaVideo, FaSpinner, FaTimes, FaHardHat, FaProjectDiagram, FaMoneyBillWave, FaCheckCircle, FaChartBar } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { partnerPortalService } from '../../services/partnerPortalService';
import type { ProjectEvidence } from '../../services/projectEvidenceService';
import type { Project } from '../../services/constructionService';
import { loadPageCache, savePageCache } from '../../utils/pageCache';

const COLORS = ['#1a8a6a', '#10b981', '#f59e0b', '#6b7280', '#8b5cf6'];

const ProjectProgress = () => {
    const [items, setItems] = useState<ProjectEvidence[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');

    useEffect(() => {
        const cached = loadPageCache('partner-progress');
        if (cached) {
            if (cached.projects) setProjects(cached.projects);
            if (cached.items) setItems(cached.items);
        }

        const fetchFresh = async () => {
            try {
                const projRes = await partnerPortalService.getMyProjects();
                const projectsData = (projRes.data || []) as Project[];
                setProjects(projectsData);
                const evidenceResults = await Promise.all(
                    projectsData.map((p) => partnerPortalService.getProjectEvidence(p.id).catch(() => ({ data: [] })))
                );
                const evData = evidenceResults.flatMap((r) => r.data || []);
                setItems(evData);
                savePageCache('partner-progress', { projects: projectsData, items: evData });
            } catch {}
        };
        fetchFresh();
    }, []);

    const images = items.filter(i => i.type === 'image');
    const videos = items.filter(i => i.type === 'video');
    const filteredItems = filterType === 'all' ? items : items.filter(i => i.type === filterType);
    const activeProjects = projects.filter(p => p.status === 'in_progress');
    const completedProjects = projects.filter(p => p.status === 'completed');
    const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
    const totalSpent = projects.reduce((s, p) => s + (p.spent || 0), 0);
    const avgProgress = projects.length > 0 ? Math.round(projects.reduce((s, p) => s + (p.progress || 0), 0) / projects.length) : 0;

    const statusData = [
        { name: 'In Progress', value: activeProjects.length },
        { name: 'Completed', value: completedProjects.length },
        { name: 'Planning', value: projects.filter(p => p.status === 'planning').length },
        { name: 'Cancelled', value: projects.filter(p => p.status === 'cancelled').length },
    ].filter(d => d.value > 0);

    const progressData = projects.filter(p => p.progress > 0).map(p => ({
        name: p.name.length > 12 ? p.name.slice(0, 12) + '...' : p.name,
        progress: p.progress,
    }));

    const budgetData = projects.filter(p => (p.budget || 0) > 0).map(p => ({
        name: p.name.length > 12 ? p.name.slice(0, 12) + '...' : p.name,
        budget: Math.round((p.budget || 0) / 100000),
        spent: Math.round((p.spent || 0) / 100000),
    }));

    const moneyShort = (n: number) => {
        if (n >= 1_000_000) return `RWF ${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `RWF ${(n / 1_000).toFixed(0)}K`;
        return `RWF ${Math.round(n).toLocaleString()}`;
    };

    const renderPieLabel = ({ name, percent }: any) => {
        if (percent < 0.05) return null;
        return `${name} ${(percent * 100).toFixed(0)}%`;
    };

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">
                        <FaHardHat style={{ color: '#1a8a6a' }} /> Project Progress
                    </h1>
                    <p className="dashboard-subtitle">Track the latest progress of your construction projects</p>
                </div>
            </div>

            <div className="dashboard-cards">
                <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #1a8a6a, #0d4f3c)' }}>
                    <div className="dashboard-card-content">
                        <div className="dashboard-card-top">
                            <span className="dashboard-card-label">Total Evidence</span>
                            <div className="dashboard-card-icon-box" style={{ background: 'rgba(255,255,255,0.2)' }}><FaImage /></div>
                        </div>
                        <div className="dashboard-card-value">{items.length}</div>
                        <div className="dashboard-card-sub">{images.length} images · {videos.length} videos</div>
                    </div>
                    <div className="dashboard-card-watermark"><FaImage /></div>
                </div>
                <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    <div className="dashboard-card-content">
                        <div className="dashboard-card-top">
                            <span className="dashboard-card-label">Active Projects</span>
                            <div className="dashboard-card-icon-box" style={{ background: 'rgba(255,255,255,0.2)' }}><FaProjectDiagram /></div>
                        </div>
                        <div className="dashboard-card-value">{activeProjects.length}</div>
                        <div className="dashboard-card-sub">{completedProjects.length} completed</div>
                    </div>
                    <div className="dashboard-card-watermark"><FaProjectDiagram /></div>
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
                <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                    <div className="dashboard-card-content">
                        <div className="dashboard-card-top">
                            <span className="dashboard-card-label">Budget</span>
                            <div className="dashboard-card-icon-box" style={{ background: 'rgba(255,255,255,0.2)' }}><FaMoneyBillWave /></div>
                        </div>
                        <div className="dashboard-card-value" style={{ fontSize: '1rem' }}>{moneyShort(totalBudget)}</div>
                        <div className="dashboard-card-sub">{moneyShort(totalSpent)} spent</div>
                    </div>
                    <div className="dashboard-card-watermark"><FaMoneyBillWave /></div>
                </div>
            </div>

            {projects.length > 0 && (
                <div className="dashboard-chart-card" style={{ marginBottom: '1rem' }}>
                    <div className="dashboard-chart-header">
                        <h3 className="dashboard-chart-title">
                            <FaProjectDiagram style={{ color: '#1a8a6a' }} /> Projects Overview
                        </h3>
                    </div>
                    <div className="dashboard-sites-list">
                        {projects.map(project => (
                            <div key={project.id} className="dashboard-project-item">
                                <div className="dashboard-project-header">
                                    <FaProjectDiagram style={{ color: '#1a8a6a', fontSize: '0.85rem' }} />
                                    <span className="dashboard-project-name">{project.name}</span>
                                    <span className={`dashboard-project-status dashboard-project-status--${project.status}`}>
                                        {project.status.replace('_', ' ')}
                                    </span>
                                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1a8a6a' }}>{project.progress || 0}%</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '1.25rem' }}>
                                    <div style={{ flex: 1, height: '5px', background: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${project.progress || 0}%`, height: '100%', background: project.status === 'completed' ? '#10b981' : '#1a8a6a', borderRadius: '3px' }} />
                                    </div>
                                    {project.budget && (
                                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                                            {moneyShort(project.budget || 0)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="dashboard-charts-row">
                {progressData.length > 0 && (
                    <div className="dashboard-chart-card dashboard-chart-wide">
                        <h3 className="dashboard-chart-title">
                            <FaChartBar style={{ color: '#1a8a6a' }} /> Project Progress %
                        </h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={progressData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e5e7eb)" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                                <Tooltip formatter={(value: number) => `${value}%`} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="progress" fill="#1a8a6a" radius={[4, 4, 0, 0]}>
                                    {progressData.map((_: any, i: number) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {statusData.length > 0 && (
                    <div className="dashboard-chart-card">
                        <h3 className="dashboard-chart-title">
                            <FaCheckCircle style={{ color: '#10b981' }} /> Project Status
                        </h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={renderPieLabel} labelLine={false}>
                                    {statusData.map((_: any, index: number) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {budgetData.length > 0 && (
                <div className="dashboard-chart-card" style={{ marginBottom: '1rem' }}>
                    <h3 className="dashboard-chart-title">
                        <FaMoneyBillWave style={{ color: '#f59e0b' }} /> Budget vs Spent (RWF 100k)
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={budgetData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e5e7eb)" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 9 }} />
                            <Tooltip formatter={(value: number) => `RWF ${(value * 100000).toLocaleString()}`} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Legend />
                            <Bar dataKey="budget" name="Budget" fill="#1a8a6a" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="spent" name="Spent" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className="dashboard-chart-card">
                <div className="dashboard-chart-header">
                    <h3 className="dashboard-chart-title">
                        <FaImage style={{ color: '#1a8a6a' }} /> Evidence Gallery
                    </h3>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                        {(['all', 'image', 'video'] as const).map(t => (
                            <button key={t} onClick={() => setFilterType(t)}
                                style={{
                                    padding: '0.2rem 0.5rem', borderRadius: '5px', border: 'none',
                                    fontSize: '0.62rem', fontWeight: 600, cursor: 'pointer',
                                    background: filterType === t ? '#1a8a6a' : '#f0f0f0',
                                    color: filterType === t ? '#fff' : '#666',
                                    textTransform: 'capitalize',
                                }}>
                                {t === 'all' ? `All (${items.length})` : t === 'image' ? `Images (${images.length})` : `Videos (${videos.length})`}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredItems.length === 0 ? (
                    <div className="dashboard-chart-empty">
                        <FaImage size={28} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                        <p>No {filterType !== 'all' ? filterType : ''} evidence available yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.6rem' }}>
                        {filteredItems.map(item => (
                            <div key={item.id} className="dashboard-project-item" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setPreviewUrl(item.url)}>
                                    <img src={item.url} alt={item.title} style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} />
                                    <div style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.6rem' }}>
                                        {item.type === 'video' ? <FaVideo /> : <FaImage />}
                                    </div>
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '1.25rem 0.6rem 0.4rem' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.72rem', color: '#fff' }}>{item.title}</div>
                                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.7)' }}>{item.project} · {item.date}</div>
                                    </div>
                                </div>
                                {item.notes && (
                                    <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.68rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
                                        {item.notes}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {previewUrl && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setPreviewUrl(null)}>
                    <button onClick={() => setPreviewUrl(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', fontSize: '1rem' }}>
                        <FaTimes />
                    </button>
                    <img src={previewUrl} alt="Preview" style={{ maxWidth: '92%', maxHeight: '92%', borderRadius: '8px', objectFit: 'contain' }} />
                </div>
            )}
        </div>
    );
};

export default ProjectProgress;
