import { useState, useEffect } from 'react';
import { FaFileAlt, FaProjectDiagram, FaClock } from 'react-icons/fa';
import { clientPortalService, type ClientReport, type Project } from '../../services/clientPortalService';
import { loadPageCache, savePageCache } from '../../utils/pageCache';

const ClientProgressReports = () => {
    const [reports, setReports] = useState<ClientReport[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [projectFilter, setProjectFilter] = useState('all');
    const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

    useEffect(() => {
        const cached = loadPageCache<{ reports: ClientReport[]; projects: Project[] }>('pg_client_progress_reports');
        if (cached) { setReports(cached.reports); setProjects(cached.projects); }

        Promise.all([
            clientPortalService.getMyReports(),
            clientPortalService.getMyProjects(),
        ])
            .then(([reportsRes, projectsRes]) => {
                const reportsData = (reportsRes.data || []) as ClientReport[];
                const projectsData = (projectsRes.data || []) as Project[];
                setReports(reportsData);
                setProjects(projectsData);
                savePageCache('pg_client_progress_reports', { reports: reportsData, projects: projectsData });
            })
            .catch(() => { setReports([]); setProjects([]); })
            .finally(() => setLoading(false));
    }, []);

    const filtered = projectFilter === 'all' ? reports : reports.filter(r => r.projectId === projectFilter);

    return (
        <div>
            <div className="content-card" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <FaFileAlt size={24} color="var(--primary)" />
                    <div style={{ flex: '1 1 auto' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>Progress Reports</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {reports.length} report{reports.length !== 1 ? 's' : ''} from your project team
                        </div>
                    </div>
                    {projects.length > 1 && (
                        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} style={{
                            padding: '0.4rem 0.7rem', borderRadius: 8, border: '1px solid var(--border-color)',
                            background: 'var(--bg-white)', color: 'var(--text-main)', fontSize: '0.82rem',
                        }}>
                            <option value="all">All Projects</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="content-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
            ) : filtered.length === 0 ? (
                <div className="content-card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <FaFileAlt size={48} style={{ opacity: 0.2, color: 'var(--primary)', marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>No progress reports published yet. Check back soon.</p>
                </div>
            ) : (
                <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '21px', top: 0, bottom: 0, width: '2px', background: 'rgba(108,48,150,0.15)' }} />
                    {filtered.map((report, index) => (
                        <div key={report.id} className="content-card" style={{
                            padding: '1.25rem 1.5rem', marginBottom: '1rem', marginLeft: '2.5rem', position: 'relative',
                        }}>
                            <div style={{
                                position: 'absolute', left: '-2.5rem', top: '1.25rem',
                                width: '12px', height: '12px', borderRadius: '50%',
                                background: index % 2 === 0 ? '#6c3096' : '#b84c8c',
                                border: '3px solid var(--bg-white, #fff)', boxShadow: '0 0 0 2px rgba(108,48,150,0.2)',
                            }} />

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{report.title}</div>
                                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(108,48,150,0.1)', color: '#6c3096', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <FaProjectDiagram size={9} /> {report.project?.name || projects.find(p => p.id === report.projectId)?.name || 'Project'}
                                </span>
                            </div>

                            {report.description && (
                                <p style={{ margin: '0.35rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{report.description}</p>
                            )}

                            {report.media && report.media.length > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 6, margin: '0.5rem 0' }}>
                                    {report.media.map((m, i) => (
                                        <div key={i} onClick={() => setPreviewMedia(m)} style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)', aspectRatio: '1', cursor: 'pointer', background: '#000' }}>
                                            {m.type === 'video' ? (
                                                <video src={m.url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.6rem' }}>
                                <div style={{ flex: '0 1 160px', height: '6px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${report.progressPercentage || 0}%`, height: '100%', background: '#6c3096', borderRadius: '4px' }} />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6c3096' }}>{report.progressPercentage || 0}% complete</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.6rem' }}>
                                {report.createdBy && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        By {report.createdBy.firstName} {report.createdBy.lastName}
                                    </span>
                                )}
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <FaClock size={10} /> {new Date(report.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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

export default ClientProgressReports;
