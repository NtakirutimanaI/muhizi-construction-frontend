import { useState, useEffect } from 'react';
import { FaImage, FaVideo, FaSpinner, FaTimes, FaHardHat } from 'react-icons/fa';
import { projectEvidenceService } from '../../services/projectEvidenceService';
import type { ProjectEvidence } from '../../services/projectEvidenceService';

const ProjectProgress = () => {
    const [items, setItems] = useState<ProjectEvidence[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        projectEvidenceService.getClientVisible()
            .then(res => setItems(res.data || []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

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
                    <FaHardHat style={{ color: '#8B4513' }} /> Project Progress
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Track the latest progress of your construction projects</p>
            </div>

            {items.length === 0 ? (
                <div className="content-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <FaImage size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p>No project updates available yet. Check back later.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                    {items.map(item => (
                        <div key={item.id} className="content-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setPreviewUrl(item.url)}>
                                <img src={item.url} alt={item.title} style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} />
                                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                    {item.type === 'video' ? <FaVideo /> : <FaImage />}
                                </div>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '2rem 1rem 0.75rem' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>{item.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{item.project} &middot; {item.date}</div>
                                </div>
                            </div>
                            {item.notes && (
                                <div style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
                                    {item.notes}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

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
