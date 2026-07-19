import { useState, useEffect } from 'react';
import { FaClipboardList, FaCheckCircle, FaClock, FaHardHat, FaImage, FaVideo, FaCalendarAlt } from 'react-icons/fa';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { partnerPortalService } from '../../services/partnerPortalService';
import type { ProjectEvidence } from '../../services/projectEvidenceService';
import type { Site } from '../../services/sitesService';
import type { Project } from '../../services/constructionService';
import { loadPageCache, savePageCache } from '../../utils/pageCache';

const COLORS = ['#1a8a6a', '#10b981', '#f59e0b', '#8b5cf6'];

interface EvidenceWithSite extends ProjectEvidence {
    siteName?: string;
}

const PartnerUpdates = () => {
    const [items, setItems] = useState<EvidenceWithSite[]>([]);

    useEffect(() => {
        const cached = loadPageCache('partner-updates');
        if (cached) {
            if (cached.items) setItems(cached.items);
        }

        const fetchFresh = async () => {
            try {
                const projectsRes = await partnerPortalService.getMyProjects();
                const projects = (projectsRes.data || []) as Project[];
                const sitesData = projects.flatMap((p) => (p as any).sites || []) as Site[];
                const siteMap = new Map(sitesData.map(s => [s.id, s.name]));
                const evidenceResults = await Promise.all(
                    projects.map((p) => partnerPortalService.getProjectEvidence(p.id).catch(() => ({ data: [] })))
                );
                const evData = evidenceResults.flatMap((r) => (r.data || [])) as EvidenceWithSite[];
                evData.forEach(e => { e.siteName = siteMap.get(e.siteId || e.project) || e.project; });
                evData.sort((a, b) => {
                    if (!a.date && !b.date) return 0;
                    if (!a.date) return 1;
                    if (!b.date) return -1;
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                });
                setItems(evData);
                savePageCache('partner-updates', { items: evData });
            } catch {}
        };
        fetchFresh();
    }, []);

    const images = items.filter(i => i.type === 'image');
    const videos = items.filter(i => i.type === 'video');
    const latestDate = items.length > 0 && items[0].date ? items[0].date : null;
    const siteNames = [...new Set(items.map(i => i.siteName).filter(Boolean))];

    const typeData = [
        { name: 'Images', value: images.length },
        { name: 'Videos', value: videos.length },
    ].filter(d => d.value > 0);

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">
                        <FaClipboardList style={{ color: '#1a8a6a' }} /> Project Updates
                    </h1>
                    <p className="dashboard-subtitle">{items.length} update{items.length !== 1 ? 's' : ''} available</p>
                </div>
            </div>

            <div className="dashboard-cards">
                <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #1a8a6a, #0d4f3c)' }}>
                    <div className="dashboard-card-content">
                        <div className="dashboard-card-top">
                            <span className="dashboard-card-label">Images</span>
                            <div className="dashboard-card-icon-box" style={{ background: 'rgba(255,255,255,0.2)' }}><FaImage /></div>
                        </div>
                        <div className="dashboard-card-value">{images.length}</div>
                        <div className="dashboard-card-sub">photo updates</div>
                    </div>
                    <div className="dashboard-card-watermark"><FaImage /></div>
                </div>
                <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    <div className="dashboard-card-content">
                        <div className="dashboard-card-top">
                            <span className="dashboard-card-label">Videos</span>
                            <div className="dashboard-card-icon-box" style={{ background: 'rgba(255,255,255,0.2)' }}><FaVideo /></div>
                        </div>
                        <div className="dashboard-card-value">{videos.length}</div>
                        <div className="dashboard-card-sub">video updates</div>
                    </div>
                    <div className="dashboard-card-watermark"><FaVideo /></div>
                </div>
                <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                    <div className="dashboard-card-content">
                        <div className="dashboard-card-top">
                            <span className="dashboard-card-label">Latest</span>
                            <div className="dashboard-card-icon-box" style={{ background: 'rgba(255,255,255,0.2)' }}><FaCalendarAlt /></div>
                        </div>
                        <div className="dashboard-card-value" style={{ fontSize: '1rem' }}>
                            {latestDate ? new Date(latestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                        </div>
                        <div className="dashboard-card-sub">last update</div>
                    </div>
                    <div className="dashboard-card-watermark"><FaCalendarAlt /></div>
                </div>
                <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                    <div className="dashboard-card-content">
                        <div className="dashboard-card-top">
                            <span className="dashboard-card-label">Sites</span>
                            <div className="dashboard-card-icon-box" style={{ background: 'rgba(255,255,255,0.2)' }}><FaHardHat /></div>
                        </div>
                        <div className="dashboard-card-value">{siteNames.length}</div>
                        <div className="dashboard-card-sub">active sites</div>
                    </div>
                    <div className="dashboard-card-watermark"><FaHardHat /></div>
                </div>
            </div>

            {typeData.length > 0 && (
                <div className="dashboard-charts-row" style={{ marginBottom: '1rem' }}>
                    <div className="dashboard-chart-card" style={{ maxWidth: '320px' }}>
                        <h3 className="dashboard-chart-title">
                            <FaImage style={{ color: '#1a8a6a' }} /> Updates by Type
                        </h3>
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                    {typeData.map((_: any, index: number) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {items.length === 0 ? (
                <div className="dashboard-chart-card">
                    <div className="dashboard-chart-empty">
                        <FaClipboardList size={32} style={{ opacity: 0.2, color: '#1a8a6a' }} />
                        <p>No updates available yet. Check back later.</p>
                    </div>
                </div>
            ) : (
                <div className="dashboard-chart-card">
                    <h3 className="dashboard-chart-title">
                        <FaClipboardList style={{ color: '#1a8a6a' }} /> Timeline
                    </h3>
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            position: 'absolute', left: '18px', top: 0, bottom: 0, width: '2px',
                            background: 'rgba(26,138,106,0.15)',
                        }} />
                        {items.map((item, index) => (
                            <div key={item.id} style={{
                                padding: '0.6rem 0.75rem 0.6rem 2.8rem',
                                display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                                transition: 'all 0.2s', position: 'relative',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-body)'; e.currentTarget.style.borderRadius = '6px'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderRadius = '0'; }}
                            >
                                <div style={{
                                    position: 'absolute', left: '13px', top: '0.8rem',
                                    width: '10px', height: '10px', borderRadius: '50%',
                                    background: index % 2 === 0 ? '#1a8a6a' : '#10b981',
                                    border: '2px solid var(--bg-card)',
                                }} />

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                            {item.title || 'Update'}
                                        </div>
                                        {item.date && (
                                            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                                {new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                    {item.siteName && (
                                        <div style={{ fontSize: '0.7rem', color: '#1a8a6a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <FaHardHat size={9} />
                                            {item.siteName}
                                        </div>
                                    )}
                                    {item.notes && (
                                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                            {item.notes}
                                        </p>
                                    )}
                                </div>
                                {item.url && (
                                    <img src={item.url} alt="" style={{
                                        width: '56px', height: '56px', borderRadius: '6px',
                                        objectFit: 'cover', flexShrink: 0, cursor: 'pointer',
                                    }} onClick={() => window.open(item.url, '_blank')}
                                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerUpdates;
