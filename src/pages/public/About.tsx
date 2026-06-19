import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import type { Profile } from '../../services/profileService';

const About = () => {
    const { profile } = useOutletContext<{ profile: Profile | null }>();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <section className="section" style={{ padding: '120px 0 60px' }}>
            <div className="container">
                <motion.span
                    style={{ display: 'inline-block', color: '#111', fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}
                    animate={{ x: [-20, 20, -20] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                >
                    WHO WE ARE
                </motion.span>
                <motion.h1
                    className="ark-section__heading"
                    style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '2rem' }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    About Us
                </motion.h1>
                <motion.div
                    className="ark-card"
                    style={{ padding: '2.5rem' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                >
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.9', color: 'var(--text-main)', margin: 0 }}>
                        {profile?.about || profile?.bio || "MUHIZI CONSTRUCTION is a leading construction and real estate company in Rwanda specializing in building construction, road construction, real estate development, and property management."}
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

export default About;
