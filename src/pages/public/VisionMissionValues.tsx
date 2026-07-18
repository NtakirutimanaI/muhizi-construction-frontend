import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEye, FaBullseye, FaHeart, FaStar, FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import type { Profile } from '../../services/profileService';

const ICONS: Record<string, React.ReactNode> = {
    eye: <FaEye />,
    bullseye: <FaBullseye />,
    heart: <FaHeart />,
    star: <FaStar />,
    check: <FaCheckCircle />,
};

const DEFAULT_MISSION = {
    title: 'Our Mission',
    text: 'To deliver exceptional construction services that exceed expectations, build lasting relationships, and contribute positively to the communities we serve.',
    icon: 'bullseye',
};
const DEFAULT_VISION = {
    title: 'Our Vision',
    text: 'To be the leading construction company in East Africa, recognized for innovation, quality craftsmanship, and sustainable building practices.',
    icon: 'eye',
};
const DEFAULT_PHILOSOPHY = {
    title: 'Our Philosophy',
    text: 'We believe that great construction goes beyond bricks and mortar — it is about creating spaces that inspire,功能 that endure, and relationships that last.',
    icon: 'heart',
};
const DEFAULT_VALUES = [
    { title: 'Quality', text: 'We never compromise on quality. Every project is built to the highest standards using premium materials and skilled craftsmanship.', icon: 'star' },
    { title: 'Integrity', text: 'We conduct business with honesty and transparency, earning the trust of our clients through consistent ethical practices.', icon: 'check' },
    { title: 'Innovation', text: 'We embrace modern techniques and sustainable solutions to deliver forward-thinking construction outcomes.', icon: 'bullseye' },
    { title: 'Reliability', text: 'We deliver projects on time and within budget, maintaining clear communication throughout every phase.', icon: 'heart' },
    { title: 'Safety', text: 'The safety of our workers and communities is paramount. We maintain rigorous safety standards on every site.', icon: 'check' },
    { title: 'Excellence', text: 'We strive for excellence in everything we do — from initial planning to the final finishing touches.', icon: 'star' },
];

const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    }),
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: (i: number) => ({
        opacity: 1,
        scale: 1,
        transition: { delay: i * 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    }),
};

const VisionMissionValues: React.FC = () => {
    const { profile } = useOutletContext<{ profile: Profile | null }>();
    const [activeTab, setActiveTab] = useState<'mission' | 'vision' | 'values'>('mission');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const pc = profile?.pageContent;
    const mission = pc?.mission || DEFAULT_MISSION;
    const vision = pc?.vision || DEFAULT_VISION;
    const philosophy = pc?.philosophy || DEFAULT_PHILOSOPHY;
    const values = pc?.coreValues && pc.coreValues.length > 0 ? pc.coreValues : DEFAULT_VALUES;

    const tabs = [
        { key: 'mission' as const, label: 'Mission', icon: <FaBullseye /> },
        { key: 'vision' as const, label: 'Vision', icon: <FaEye /> },
        { key: 'values' as const, label: 'Values', icon: <FaStar /> },
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#F5F7FA' }}>
            {/* Hero */}
            <section data-nav-theme="dark" style={{
                position: 'relative',
                padding: 'clamp(5rem, 12vh, 8rem) 2rem clamp(4rem, 10vh, 6rem)',
                background: 'linear-gradient(135deg, #0F1222 0%, #1a2332 50%, #16324F 100%)',
                overflow: 'hidden',
                textAlign: 'center',
            }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'url(/bg1.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.08,
                    filter: 'grayscale(1)',
                }} />
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto' }}
                >
                    <p style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                        color: 'var(--accent, #D97706)', fontWeight: 700, fontSize: '0.78rem',
                        letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 1.2rem',
                    }}>
                        <span style={{ width: 30, height: 0, borderTop: '2px dashed var(--accent, #D97706)', display: 'inline-block' }} />
                        About Us
                        <span style={{ width: 30, height: 0, borderTop: '2px dashed var(--accent, #D97706)', display: 'inline-block' }} />
                    </p>
                    <h1 style={{
                        fontFamily: 'var(--font-display)', color: '#fff', fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
                        fontWeight: 800, lineHeight: 1.1, margin: '0 0 1.2rem',
                    }}>
                        Our Mission, Vision & Values
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(1rem, 2vw, 1.15rem)', lineHeight: 1.7, maxWidth: '580px', margin: '0 auto' }}>
                        The principles that guide every project we undertake and every relationship we build.
                    </p>
                </motion.div>
            </section>

            {/* Tab Navigation */}
            <section data-nav-theme="light" style={{ background: '#fff', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                padding: '1.2rem 2rem',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === tab.key ? '3px solid var(--accent, #D97706)' : '3px solid transparent',
                                color: activeTab === tab.key ? 'var(--accent, #D97706)' : 'var(--text-muted)',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                transition: 'all 0.3s ease',
                                letterSpacing: '0.02em',
                            }}
                        >
                            <span style={{ fontSize: '1rem' }}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* Content */}
            <section style={{ padding: 'clamp(3rem, 6vh, 5rem) 2rem', maxWidth: '1100px', margin: '0 auto' }}>
                <AnimatePresence mode="wait">
                    {activeTab === 'mission' && (
                        <motion.div
                            key="mission"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
                                <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
                                    <div style={{
                                        width: 72, height: 72, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--accent, #D97706), #b45309)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: '1.5rem', fontSize: '1.6rem', color: '#fff',
                                        boxShadow: '0 8px 24px rgba(217, 119, 6, 0.3)',
                                    }}>
                                        <FaBullseye />
                                    </div>
                                    <h2 style={{
                                        fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                                        fontWeight: 800, color: 'var(--text-main)', margin: '0 0 1.2rem', lineHeight: 1.15,
                                    }}>
                                        {mission.title}
                                    </h2>
                                    <p style={{
                                        color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.8, margin: '0 0 2rem',
                                    }}>
                                        {mission.text}
                                    </p>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <a href="#contact" style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.7rem',
                                            padding: '0.85rem 1.8rem', borderRadius: 0,
                                            background: 'var(--accent, #D97706)', color: '#fff',
                                            fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
                                            transition: 'all 0.3s ease',
                                        }}>
                                            Get In Touch <FaArrowRight />
                                        </a>
                                        <a href="/about" style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.7rem',
                                            padding: '0.85rem 1.8rem', borderRadius: 0,
                                            border: '2px solid var(--border-color)', color: 'var(--text-main)',
                                            fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
                                            transition: 'all 0.3s ease',
                                        }}>
                                            Back to Home
                                        </a>
                                    </div>
                                </motion.div>
                                <motion.div custom={1} variants={scaleIn} initial="hidden" animate="visible" style={{ position: 'relative' }}>
                                    <div style={{
                                        background: 'linear-gradient(135deg, #F5F7FA, #e8edf2)',
                                        padding: '3rem', borderRadius: 0,
                                        border: '1px solid rgba(15,18,34,0.06)',
                                    }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                            {[
                                                { num: '150+', label: 'Projects Completed' },
                                                { num: '12+', label: 'Years Experience' },
                                                { num: '98%', label: 'Client Satisfaction' },
                                                { num: '50+', label: 'Team Members' },
                                            ].map((stat, i) => (
                                                <motion.div key={i} custom={i + 2} variants={fadeUp} initial="hidden" animate="visible"
                                                    style={{ textAlign: 'center', padding: '1rem' }}>
                                                    <div style={{
                                                        fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800,
                                                        color: 'var(--accent, #D97706)', lineHeight: 1,
                                                    }}>{stat.num}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{stat.label}</div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'vision' && (
                        <motion.div
                            key="vision"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
                                <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" style={{ order: 2 }}>
                                    <div style={{
                                        width: 72, height: 72, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #16324F, #1a4a6e)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: '1.5rem', fontSize: '1.6rem', color: '#fff',
                                        boxShadow: '0 8px 24px rgba(22, 50, 79, 0.3)',
                                    }}>
                                        <FaEye />
                                    </div>
                                    <h2 style={{
                                        fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                                        fontWeight: 800, color: 'var(--text-main)', margin: '0 0 1.2rem', lineHeight: 1.15,
                                    }}>
                                        {vision.title}
                                    </h2>
                                    <p style={{
                                        color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.8, margin: '0 0 2rem',
                                    }}>
                                        {vision.text}
                                    </p>
                                    <div style={{
                                        background: '#F5F7FA', padding: '1.5rem', borderRadius: 0,
                                        borderLeft: '4px solid var(--accent, #D97706)',
                                    }}>
                                        <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontStyle: 'italic', lineHeight: 1.7, margin: 0 }}>
                                            "Building not just structures, but legacies that will serve generations to come."
                                        </p>
                                    </div>
                                </motion.div>
                                <motion.div custom={1} variants={scaleIn} initial="hidden" animate="visible" style={{ order: 1 }}>
                                    <div style={{
                                        background: 'linear-gradient(135deg, #16324F, #1a4a6e)',
                                        padding: '3rem', borderRadius: 0,
                                        color: '#fff', position: 'relative', overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            position: 'absolute', top: -30, right: -30,
                                            width: 120, height: 120, borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.05)',
                                        }} />
                                        <div style={{
                                            position: 'absolute', bottom: -40, left: -20,
                                            width: 160, height: 160, borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.03)',
                                        }} />
                                        <div style={{ position: 'relative', zIndex: 1 }}>
                                            <FaEye style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '1.5rem' }} />
                                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1rem' }}>Looking Forward</h3>
                                            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, opacity: 0.85, margin: 0 }}>
                                                Our vision drives us to constantly innovate and push boundaries in the construction industry.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'values' && (
                        <motion.div
                            key="values"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                                <h2 style={{
                                    fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                                    fontWeight: 800, color: 'var(--text-main)', margin: '0 0 1rem',
                                }}>
                                    Our Core Values
                                </h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto' }}>
                                    These fundamental principles guide our team in every decision, every project, and every interaction.
                                </p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                {values.map((val, i) => (
                                    <motion.div
                                        key={i}
                                        custom={i}
                                        variants={scaleIn}
                                        initial="hidden"
                                        animate="visible"
                                        style={{
                                            padding: '2rem', borderRadius: 0,
                                            background: '#fff',
                                            border: '1px solid rgba(15,18,34,0.06)',
                                            boxShadow: '0 4px 20px rgba(15,18,34,0.05)',
                                            transition: 'all 0.3s ease',
                                            cursor: 'default',
                                        }}
                                        whileHover={{ y: -6, boxShadow: '0 12px 32px rgba(15,18,34,0.12)' }}
                                    >
                                        <div style={{
                                            width: 52, height: 52, borderRadius: '50%',
                                            background: i % 2 === 0
                                                ? 'linear-gradient(135deg, var(--accent, #D97706), #b45309)'
                                                : 'linear-gradient(135deg, #16324F, #1a4a6e)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            marginBottom: '1.2rem', fontSize: '1.1rem', color: '#fff',
                                        }}>
                                            {ICONS[val.icon] || <FaStar />}
                                        </div>
                                        <h3 style={{
                                            fontFamily: 'var(--font-display)', fontSize: '1.15rem',
                                            fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.8rem',
                                        }}>
                                            {val.title}
                                        </h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.65, margin: 0 }}>
                                            {val.text}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* CTA */}
            <section style={{
                padding: 'clamp(3rem, 6vh, 5rem) 2rem',
                background: 'linear-gradient(135deg, #0F1222, #16324F)',
                textAlign: 'center',
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 style={{
                        fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                        fontWeight: 800, color: '#fff', margin: '0 0 1rem',
                    }}>
                        Ready to Build Something Great?
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', maxWidth: '500px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
                        Let us bring our values and expertise to your next construction project.
                    </p>
                    <a href="#contact" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.7rem',
                        padding: '0.9rem 2rem', borderRadius: 0,
                        background: 'var(--accent, #D97706)', color: '#fff',
                        fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none',
                    }}>
                        Start Your Project <FaArrowRight />
                    </a>
                </motion.div>
            </section>
        </div>
    );
};

export default VisionMissionValues;
