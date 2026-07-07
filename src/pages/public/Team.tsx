import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import type { Profile } from '../../services/profileService';

const Team = () => {
    const { profile } = useOutletContext<{ profile: Profile | null }>();
    const members = profile?.teamMembers || [];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const getImageUrl = (member: { name: string; imageUrl?: string }) => {
        if (member.imageUrl) return member.imageUrl;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&size=300`;
    };

    return (
        <section className="section" style={{
            padding: '120px 0 60px',
            background: `linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url(/bg-about.png) center/cover fixed`,
        }}>
            <div className="container">
                <motion.span
                    style={{ display: 'inline-block', color: '#111', fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}
                    animate={{ x: [-20, 20, -20] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                >
                    MEET PROFESSIONALS
                </motion.span>
                <motion.h1
                    className="ark-section__heading"
                    style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem' }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    Our Team
                </motion.h1>
                <motion.p
                    style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-main)', maxWidth: 600, marginBottom: '2.5rem' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    Meet the dedicated professionals behind MUHIZI CONSTRUCTION who bring expertise, passion, and innovation to every project.
                </motion.p>

                {members.length === 0 ? (
                    <motion.div
                        className="ark-card"
                        style={{ padding: '3rem', textAlign: 'center' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', margin: 0 }}>Team information will be available soon.</p>
                    </motion.div>
                ) : (
                    <div className="team-cards-grid">
                        {members.map((member, i) => (
                            <motion.div
                                key={i}
                                className="team-card"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
                            >
                                <div className="team-card__img-wrap">
                                    <img
                                        src={getImageUrl(member)}
                                        alt={member.name}
                                        className="team-card__img"
                                    />
                                </div>
                                <h3 className="team-card__name">{member.name}</h3>
                                <p className="team-card__role">{member.role}</p>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default Team;
