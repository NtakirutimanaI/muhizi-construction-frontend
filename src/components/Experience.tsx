import { motion } from 'framer-motion';
import { useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Profile } from '../services/profileService';

const Experience: React.FC = () => {
    const constraintsRef = useRef<HTMLDivElement>(null);
    const { profile } = useOutletContext<{ profile: Profile | null }>();
    const fu = profile?.pageContent?.followUs;
    const heading = fu?.heading;
    const subtitle = fu?.subtitle;
    const mainVideoUrl = fu?.youtubeUrl;
    const videos = fu?.videos || [];

    const toEmbedUrl = (url: string | undefined) => {
        if (!url) return '';
        const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return match ? `https://www.youtube.com/embed/${match[1]}` : '';
    };
    const mainEmbedUrl = toEmbedUrl(mainVideoUrl);

    return (
        <section data-nav-theme="light" className="section section-indicator" id="resume">
            <div className="container">
                <div style={{ marginBottom: '2rem' }} ref={constraintsRef}>
                    <motion.span
                        className="ark-section__sub"
                        style={{ display: 'inline-block', marginLeft: '30px' }}
                        animate={{ x: [-20, 20, -20] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        Follow Us
                    </motion.span>
                    <h2 className="ark-section__heading">{heading}</h2>

                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginTop: '2rem', width: '100%',
                    }}>
                        <div style={{
                            position: 'relative', width: '100%', maxWidth: '700px',
                            aspectRatio: '16 / 9', overflow: 'hidden', borderRadius: '14px', background: '#000',
                        }}>
                            {mainEmbedUrl ? (
                                <>
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center',
                                        pointerEvents: 'none', zIndex: 1, padding: '0.75rem 1rem',
                                    }}>
                                        <span style={{
                                            color: '#000', fontSize: '0.95rem', fontWeight: 500,
                                            background: '#fff', padding: '0.4rem 1rem', borderRadius: '6px',
                                            display: 'inline-block',
                                        }}>
                                            {subtitle}
                                        </span>
                                    </div>
                                    <iframe
                                        src={mainEmbedUrl}
                                        title="Company Video"
                                        style={{ width: '100%', height: '100%', border: 'none' }}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </>
                            ) : (
                                <a href={mainVideoUrl} target="_blank" rel="noopener noreferrer"
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        width: '100%', height: '100%', color: '#fff',
                                        background: '#1a1a2e', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 600,
                                    }}>
                                    <span style={{ textAlign: 'center' }}>
                                        {subtitle || 'Visit Our YouTube Channel'}<br />
                                        <span style={{ fontSize: '0.85rem', opacity: 0.7, display: 'block', marginTop: '0.5rem' }}>
                                            Click to watch on YouTube &rarr;
                                        </span>
                                    </span>
                                </a>
                            )}
                        </div>

                        {videos.length > 0 && (
                            <div style={{
                                display: 'flex', flexDirection: 'row', gap: '1rem', justifyContent: 'center',
                                flexWrap: 'wrap', width: '100%', maxWidth: '700px',
                            }}>
                                {videos.map((v, i) => (
                                    <div key={i} style={{
                                        flex: '1 1 200px', maxWidth: '330px', minWidth: '180px',
                                        background: '#fff', borderRadius: '12px', overflow: 'hidden',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                    }}>
                                        <div style={{ width: '100%', aspectRatio: '16 / 9', overflow: 'hidden', background: '#000' }}>
                                            <iframe
                                                src={toEmbedUrl(v.url)}
                                                title={v.title}
                                                style={{ width: '100%', height: '100%', border: 'none' }}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                        <div style={{ padding: '0.5rem' }}>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#111', textAlign: 'center', fontWeight: 700 }}>{v.title}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>



                <div style={{ textAlign: 'center', paddingBottom: '3rem' }}>
                    <a
                        href={mainVideoUrl || 'https://www.youtube.com'}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px',
                            padding: '0.35rem 1rem',
                            borderRadius: '6px',
                            border: '1.5px solid #000',
                            color: '#000',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                            transition: 'background 0.2s, color 0.2s, border-color 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#1B2042'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#1B2042'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000'; e.currentTarget.style.borderColor = '#000'; }}
                    >
                        View More Videos (Channel) <span>&darr;</span>
                    </a>
                </div>
            </div>
        </section>
    );
};

export default Experience;
