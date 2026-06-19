import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useRef } from 'react';

const Experience: React.FC = () => {
    const constraintsRef = useRef<HTMLDivElement>(null);

    return (
        <section className="section section-indicator" id="resume">
            <div className="container">
                {/* Our Technologies */}
                <div style={{ marginBottom: '2rem' }} ref={constraintsRef}>
                    <h2 className="ark-section__heading">Follow Us</h2>

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
                                Watch our latest projects and company updates
                            </span>
                        </div>
                        <iframe
                            src="https://www.youtube.com/embed/CJtOOX23Ofo?autoplay=1&mute=1&rel=0"
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
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <motion.div
                                drag
                                dragConstraints={constraintsRef}
                                initial={{ opacity: 0, x: -200 }}
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
                                    src="https://www.youtube.com/embed/CJtOOX23Ofo?autoplay=1&mute=1&rel=0"
                                    title="Company Video"
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </motion.div>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', fontWeight: 700 }}>
                                Construction project timelapse
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <motion.div
                                drag
                                dragConstraints={constraintsRef}
                                initial={{ opacity: 0, x: 200 }}
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
                                    src="https://www.youtube.com/embed/CJtOOX23Ofo?autoplay=1&mute=1&rel=0"
                                    title="Company Video"
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </motion.div>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', fontWeight: 700 }}>
                                Behind the scenes showcase
                            </p>
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <Link to="/about" style={{
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
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#8B4513'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#8B4513'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000'; e.currentTarget.style.borderColor = '#000'; }}
                    >
                        View More Videos &rarr;
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default Experience;
