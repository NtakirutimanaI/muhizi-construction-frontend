import { useState, useEffect } from 'react';
import { FaClipboardList, FaClock, FaCheckCircle, FaNewspaper } from 'react-icons/fa';
import { updatesService, type Update } from '../../services/updatesService';

const ClientUpdates = () => {
    const [items, setItems] = useState<Update[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        updatesService.getPublished()
            .then(data => setItems(Array.isArray(data) ? data : []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <div className="content-card" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FaClipboardList size={24} color="var(--primary)" />
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>Latest Updates</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{items.length} published update{items.length !== 1 ? 's' : ''}</div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="content-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
            ) : items.length === 0 ? (
                <div className="content-card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <FaClipboardList size={48} style={{ opacity: 0.2, color: 'var(--primary)', marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>No updates available yet. Check back later.</p>
                </div>
            ) : (
                <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '21px', top: 0, bottom: 0, width: '2px', background: 'rgba(108,48,150,0.15)' }} />
                    {items.map((item, index) => (
                        <div key={item.id} className="content-card" style={{
                            padding: '1.25rem 1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start',
                            marginBottom: '1rem', marginLeft: '2.5rem', position: 'relative',
                        }}>
                            <div style={{
                                position: 'absolute', left: '-2.5rem', top: '1.25rem',
                                width: '12px', height: '12px', borderRadius: '50%',
                                background: index % 2 === 0 ? '#6c3096' : '#b84c8c',
                                border: '3px solid var(--bg-white, #fff)', boxShadow: '0 0 0 2px rgba(108,48,150,0.2)',
                            }} />

                            {item.image && (
                                <img src={item.image} alt="" style={{
                                    width: '80px', height: '80px', borderRadius: '8px',
                                    objectFit: 'cover', flexShrink: 0,
                                }} />
                            )}

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{item.title}</div>
                                    {item.category && (
                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(16,185,129,0.1)', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {item.category}
                                        </span>
                                    )}
                                </div>
                                {item.summary && (
                                    <p style={{ margin: '0.35rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.summary}</p>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem' }}>
                                    {item.author && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>By {item.author}</span>
                                    )}
                                    {item.readTime && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <FaClock size={10} /> {item.readTime}
                                        </span>
                                    )}
                                    {item.publishedAt && (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {new Date(item.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientUpdates;
