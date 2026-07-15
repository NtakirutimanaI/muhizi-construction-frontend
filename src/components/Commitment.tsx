import { LuKeyRound, LuHandshake, LuGem, LuWorkflow } from 'react-icons/lu';

const TEXT_CARDS = [
    { title: 'Expertise You Can Trust', description: 'Our licensed engineers and skilled crews bring decades of hands-on experience to every site.', icon: LuHandshake, gridColumn: '2', gridRow: '1', tiltClass: 'commitment-card--tilt-a' },
    { title: 'Built for Long-Term Value', description: 'Every project we deliver is built with quality materials and vision, designed to last for generations.', icon: LuGem, gridColumn: '3', gridRow: '1', tiltClass: 'commitment-card--tilt-b' },
    { title: 'Hassle-Free Process', description: 'Our project managers guide you through every step with clear timelines, updates, and dedicated support.', icon: LuWorkflow, gridColumn: '2', gridRow: '2', tiltClass: 'commitment-card--tilt-c' },
];

const Commitment: React.FC = () => {
    return (
        <section data-nav-theme="light" className="section section-indicator" id="commitment" style={{ background: '#F5F7FA', position: 'relative', overflow: 'hidden' }}>
            <style>{`
                .commitment-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
                .commitment-card:hover { transform: rotate(0deg) translateY(0) scale(1.03) !important; box-shadow: 0 16px 40px rgba(15,18,34,0.16) !important; z-index: 5; }
                .commitment-card--anchor { transform: rotate(-1deg); }
                .commitment-card--tilt-a { transform: rotate(-2deg); }
                .commitment-card--tilt-b { transform: rotate(2deg) translateY(16px); }
                .commitment-card--tilt-c { transform: rotate(-2deg) translateY(-6px); }
                .commitment-card--tilt-d { transform: rotate(2deg) translateY(-16px); }
            `}</style>
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'url(/bg1.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'bottom',
                backgroundRepeat: 'no-repeat',
                filter: 'grayscale(1)',
                opacity: 0.12,
                pointerEvents: 'none',
            }} />

            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 3rem' }}>
                    <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--accent, #D97706)', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 1rem' }}>
                        <span style={{ width: '30px', height: '2px', background: 'var(--accent, #D97706)', display: 'inline-block' }} />
                        Our Commitment
                        <span style={{ width: '30px', height: '2px', background: 'var(--accent, #D97706)', display: 'inline-block' }} />
                    </p>
                    <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-main)', fontSize: 'clamp(1.9rem, 4vw, 2.6rem)', fontWeight: 800, margin: '0 0 1rem', lineHeight: 1.15 }}>
                        What Makes Us Different
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.7, margin: 0 }}>
                        It's not just about constructing buildings; it's about engineering trust, safety, and lasting value into every project we deliver.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr 1fr', gridTemplateRows: 'auto auto', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto', alignItems: 'start' }}>
                    {/* Tall image + caption card */}
                    <div className="commitment-card commitment-card--anchor" style={{ gridColumn: '1', gridRow: '1 / 3', borderRadius: '16px', overflow: 'hidden', background: '#fff', border: '1px solid rgba(15,18,34,0.06)', boxShadow: '0 10px 30px rgba(15,18,34,0.08)', display: 'flex', flexDirection: 'column' }}>
                        <img
                            src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                            alt="Modern residential development"
                            style={{ width: '100%', height: '260px', objectFit: 'cover', display: 'block' }}
                        />
                        <div style={{ padding: '1.5rem 1.6rem 1.7rem' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.1rem' }}>
                                <LuKeyRound style={{ color: '#fff', fontSize: '1.3rem' }} />
                            </div>
                            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-main)', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.9rem' }}>Client-Focused Delivery</h3>
                            <div style={{ height: '1px', background: 'var(--border-color)', margin: '0 0 1rem' }} />
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.65, margin: 0 }}>
                                We prioritize clear communication and transparency, making your construction journey smooth and stress-free.
                            </p>
                        </div>
                    </div>

                    {TEXT_CARDS.map((card, i) => (
                        <div
                            key={i}
                            className={`commitment-card ${card.tiltClass}`}
                            style={{
                                gridColumn: card.gridColumn,
                                gridRow: card.gridRow,
                                borderRadius: '16px',
                                background: '#fff',
                                border: '1px solid rgba(15,18,34,0.06)',
                                boxShadow: '0 10px 30px rgba(15,18,34,0.08)',
                                padding: '1.6rem 1.7rem 1.8rem',
                            }}
                        >
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.1rem' }}>
                                <card.icon style={{ color: '#fff', fontSize: '1.3rem' }} />
                            </div>
                            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-main)', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.9rem', lineHeight: 1.3 }}>{card.title}</h3>
                            <div style={{ height: '1px', background: 'var(--border-color)', margin: '0 0 1rem' }} />
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.65, margin: 0 }}>{card.description}</p>
                        </div>
                    ))}

                    {/* Image-only card */}
                    <div className="commitment-card commitment-card--tilt-d" style={{ gridColumn: '3', gridRow: '2', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(15,18,34,0.06)', boxShadow: '0 10px 30px rgba(15,18,34,0.08)' }}>
                        <img
                            src="https://images.unsplash.com/photo-1486718448742-163732cd1544?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                            alt="Contemporary building exterior"
                            style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block' }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Commitment;
