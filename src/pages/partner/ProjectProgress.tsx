import { useState, useEffect } from 'react';
import { FaImage, FaVideo, FaSpinner, FaTimes, FaHardHat, FaProjectDiagram, FaMoneyBillWave, FaCheckCircle, FaClock, FaChartBar } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { partnerPortalService } from '../../services/partnerPortalService';
import type { ProjectEvidence } from '../../services/projectEvidenceService';
import type { Project } from '../../services/constructionService';

const COLORS = ['#1a8a6a', '#10b981', '#f59e0b', '#6b7280', '#8b5cf6'];

const ProjectProgress = () => {
    const [items, setItems] = useState<ProjectEvidence[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');

    useEffect(() => {
        partnerPortalService.getMyProjects()
            .then(async (projRes) => {
                const projectsData = (projRes.data || []) as Project[];
                setProjects(projectsData);
                const evidenceResults = await Promise.all(
                    projectsData.map((p) => partnerPortalService.getProjectEvidence(p.id).catch(() => ({ data: [] })))
                );
                setItems(evidenceResults.flatMap((r) => r.data || []));
            })
            .catch(() => { setItems([]); setProjects([]); })
            .finally(() => setLoading(false));
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
        name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
        progress: p.progress,
        budget: p.budget ? Math.round((p.budget || 0) / 100000) : 0,
        spent: p.spent ? Math.round((p.spent || 0) / 100000) : 0,
    }));

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: 'var(--text-muted)' }}>
                <FaSpinner className="spin" /> Loading project progress...
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FaHardHat style={{ color: '#1a8a6a' }} /> Project Progress
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Track the latest progress of your construction projects</p>
            </div>

            {/* Summary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div className="content-card" style={{ padding: '1rem', borderLeft: '4px solid #1a8a6a' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Evidence</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1a8a6a' }}>{items.length}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{images.length} images · {videos.length} videos</div>
                </div>
                <div className="content-card" style={{ padding: '1rem', borderLeft: '4px solid #10b981' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active Projects</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{activeProjects.length}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{completedProjects.length} completed</div>
                </div>
                <div className="content-card" style={{ padding: '1rem', borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Progress</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b' }}>{avgProgress}%</div>
                    <div style={{ marginTop: '0.3rem', height: '4px', background: '#eee', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${avgProgress}%`, height: '100%', background: '#10b981', borderRadius: '2px' }} />
                    </div>
                </div>
                <div className="content-card" style={{ padding: '1rem', borderLeft: '4px solid #8b5cf6' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Budget</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#8b5cf6' }}>RWF {totalBudget.toLocaleString()}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>RWF {totalSpent.toLocaleString()} spent</div>
                    {totalBudget > 0 && (
                        <div style={{ marginTop: '0.3rem', height: '4px', background: '#eee', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, Math.round((totalSpent / totalBudget) * 100))}%`, height: '100%', background: totalSpent > totalBudget ? '#ef4444' : '#8b5cf6', borderRadius: '2px' }} />
                        </div>
                    )}
                </div>
            </div>

            {/* Projects Progress Section */}
            {projects.length > 0 && (
                <div className="content-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaProjectDiagram style={{ color: '#1a8a6a' }} /> Projects Overview
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {projects.map(project => (
                            <div key={project.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{project.name}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.1rem 0.5rem', borderRadius: '10px', background: project.status === 'completed' ? '#10b98120' : project.status === 'in_progress' ? '#1a8a6a20' : project.status === 'planning' ? '#f59e0b20' : '#6b728020', color: project.status === 'completed' ? '#10b981' : project.status === 'in_progress' ? '#1a8a6a' : project.status === 'planning' ? '#f59e0b' : '#6b7280', textTransform: 'capitalize' }}>{project.status.replace('_', ' ')}</span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a8a6a' }}>{project.progress || 0}%</span>
                                    </div>
                                </div>
                                <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${project.progress || 0}%`, height: '100%', background: project.status === 'completed' ? '#10b981' : '#1a8a6a', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                                </div>
                                {project.budget && (
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        <span>Budget: RWF {project.budget.toLocaleString()}</span>
                                        {project.spent !== undefined && <span>Spent: RWF {project.spent.toLocaleString()}</span>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                {/* Progress Bar Chart */}
                {progressData.length > 0 && (
                    <div className="content-card" style={{ padding: '1.25rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaChartBar style={{ color: '#1a8a6a' }} /> Project Progress %
                        </h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={progressData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(value: number) => `${value}%`} />
                                <Bar dataKey="progress" fill="#1a8a6a" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Status Distribution Pie Chart */}
                {statusData.length > 0 && (
                    <div className="content-card" style={{ padding: '1.25rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaCheckCircle style={{ color: '#10b981' }} /> Project Status
                        </h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                                    {statusData.map((_, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Budget vs Spent Chart */}
                {progressData.some(p => p.budget > 0 || p.spent > 0) && (
                    <div className="content-card" style={{ padding: '1.25rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaMoneyBillWave style={{ color: '#f59e0b' }} /> Budget vs Spent (RWF 100k)
                        </h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={progressData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(value: number) => `RWF ${(value * 100000).toLocaleString()}`} />
                                <Bar dataKey="budget" fill="#1a8a6a" radius={[4, 4, 0, 0]} name="Budget" />
                                <Bar dataKey="spent" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Spent" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Evidence Section */}
            <div className="content-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaImage style={{ color: '#1a8a6a' }} /> Evidence Gallery
                    </h3>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {(['all', 'image', 'video'] as const).map(t => (
                            <button key={t} onClick={() => setFilterType(t)}
                                style={{
                                    padding: '0.25rem 0.6rem', borderRadius: '6px', border: 'none',
                                    fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
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
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <FaImage size={36} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                        <p style={{ margin: 0 }}>No {filterType !== 'all' ? filterType : ''} evidence available yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {filteredItems.map(item => (
                            <div key={item.id} className="content-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setPreviewUrl(item.url)}>
                                    <img src={item.url} alt={item.title} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
                                    <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem' }}>
                                        {item.type === 'video' ? <FaVideo /> : <FaImage />}
                                    </div>
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '1.5rem 0.75rem 0.5rem' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>{item.title}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>{item.project} &middot; {item.date}</div>
                                    </div>
                                </div>
                                {item.notes && (
                                    <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
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
                    <button onClick={() => setPreviewUrl(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', fontSize: '1.1rem' }}>
                        <FaTimes />
                    </button>
                    <img src={previewUrl} alt="Preview" style={{ maxWidth: '92%', maxHeight: '92%', borderRadius: '8px', objectFit: 'contain' }} />
                </div>
            )}
        </div>
    );
};

export default ProjectProgress;
