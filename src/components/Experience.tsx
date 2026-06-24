import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
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

                    <motion.div
                        drag
                        dragConstraints={constraintsRef}
                        initial={{ opacity: 0, x: 0 }}
                        whileInView={{ opacity: 1, x: [0, -120, 120, 0] }}
                        viewport={{ once: false }}
                        transition={{ duration: 1.2, times: [0, 0.3, 0.6, 1], ease: 'easeInOut' }}
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '800px',
                            margin: '2rem auto 0',
                            aspectRatio: '16 / 9',
                            overflow: 'hidden',
                            borderRadius: '12px',
                            background: '#000',
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            textAlign: 'center',
                            pointerEvents: 'none',
                            zIndex: 1,
                            padding: '0.75rem 1rem',
                        }}>
                            <span style={{
                                color: '#000',
                                fontSize: '0.95rem',
                                fontWeight: 500,
                                background: '#fff',
                                padding: '0.4rem 1rem',
                                borderRadius: '6px',
                                display: 'inline-block',
                            }}>
                                {subtitle}
                            </span>
                        </div>
                        <iframe
                            src={mainVideoUrl}
                            title="Company Video"
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                            }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </motion.div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
                        {videos.length > 0 ? videos.map((v, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <motion.div
                                    drag
                                    dragConstraints={constraintsRef}
                                    initial={{ opacity: 0, x: i === 0 ? -200 : 200 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: false }}
                                    transition={{ duration: 0.8, type: 'spring', stiffness: 200, damping: 10 }}
                                    style={{
                                        position: 'relative',
                                        width: '100%',
                                        maxWidth: '380px',
                                        aspectRatio: '16 / 9',
                                        overflow: 'hidden',
                                        borderRadius: '10px',
                                        background: '#000',
                                    }}
                                >
                                    <iframe
                                        src={v.url}
                                        title={v.title}
                                        style={{ width: '100%', height: '100%', border: 'none' }}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </motion.div>
                                <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', fontWeight: 700 }}>
                                    {v.title}
                                </p>
                            </div>
                        )) : null}
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    {fu?.viewMoreUrl && <Link to={fu?.viewMoreUrl} style={{
                        background: 'transparent',
                        color: '#000',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '0.65rem 1.5rem',
                        borderRadius: '8px',
                        border: '2px solid #000',
                        transition: 'background 0.2s, color 0.2s, border-color 0.2s',
                    }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#1B2042'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#1B2042'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000'; e.currentTarget.style.borderColor = '#000'; }}
                    >
                        {fu?.viewMoreText} &rarr;
                    </Link>}
                </div>
            </div>
        </section>
    );
};

export default Experience;
