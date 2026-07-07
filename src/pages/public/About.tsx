import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import Stats from '../../components/Stats';
import type { Profile } from '../../services/profileService';

const About = () => {
    const { profile } = useOutletContext<{ profile: Profile | null }>();
    const pc = profile?.pageContent;

    const mission = pc?.mission || { title: 'Our Mission', text: 'To deliver exceptional construction and real estate solutions that exceed client expectations through innovation, quality craftsmanship, and sustainable practices.', icon: 'https://images.icon-icons.com/5904/PNG/96/326365_paper-plane-icon.png' };
    const vision = pc?.vision || { title: 'Our Vision', text: 'To be the most trusted and innovative construction company in Rwanda, setting benchmarks for quality, safety, and customer satisfaction in the industry.', icon: 'https://images.icon-icons.com/5904/PNG/96/326321_sun-icon.png' };
    const philosophy = pc?.philosophy || { title: 'Our Philosophy', text: 'We believe in building lasting relationships through integrity, transparency, and a relentless commitment to excellence in every project we undertake.', icon: 'https://images.icon-icons.com/5904/PNG/96/326370_star-icon.png' };
    const coreValues = pc?.coreValues || [
        { title: 'Excellence', text: 'We strive for the highest standards in every project, ensuring superior quality, precision, and attention to detail in all our construction and real estate endeavors.', icon: 'https://images.icon-icons.com/5904/PNG/96/326321_sun-icon.png' },
        { title: 'Integrity', text: 'We conduct business with honesty, transparency, and ethical responsibility, building trust with our clients, partners, and communities through every interaction.', icon: 'https://images.icon-icons.com/5904/PNG/96/326329_heart-icon.png' },
        { title: 'Innovation', text: 'We embrace modern technology, creative problem-solving, and forward-thinking approaches to deliver cutting-edge solutions that set new benchmarks in the industry.', icon: 'https://images.icon-icons.com/5904/PNG/96/326323_lightning-bolt-icon.png' },
    ];
    const whyChooseUs = pc?.whyChooseUs || [
        { title: 'Experienced Team', text: 'Our skilled professionals bring years of expertise across diverse construction and real estate projects, ensuring reliable and high-quality results every time.', icon: 'https://images.icon-icons.com/5904/PNG/96/326322_location-pin-icon.png' },
        { title: 'Client-Centric Approach', text: 'We prioritize your vision and needs, offering personalized solutions, transparent communication, and dedicated support from concept to completion.', icon: 'https://images.icon-icons.com/5904/PNG/96/326365_paper-plane-icon.png' },
        { title: 'Timely Delivery', text: 'We respect your time and budget, delivering projects on schedule without compromising quality, thanks to efficient project management and streamlined processes.', icon: 'https://images.icon-icons.com/5904/PNG/96/326370_star-icon.png' },
    ];
    const cta = pc?.cta || { title: 'Ready to Start Your Project?', subtitle: 'Let us bring your vision to life. Contact us today for a consultation and free estimate.', buttonText: 'Get In Touch', buttonLink: '/contact', secondaryButtonText: 'Meet Our Team', secondaryButtonLink: '/team' };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <section className="section about-page" style={{
            padding: '120px 0 60px',
            background: `linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url(/bg-about.png) center/cover fixed`,
        }}>
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

                <div style={{ marginTop: '3rem' }}>
                    {profile && <Stats profile={profile} customStats={pc?.aboutStats} />}
                </div>

                <div className="ark-grid-3" style={{ marginTop: '4rem' }}>
                    {[mission, vision, philosophy].map((item, i) => (
                        <motion.div
                            key={i}
                            className="ark-card"
                            style={{ padding: '2rem', textAlign: 'center', borderTop: '4px solid #1B2042' }}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                        >
                            <img src={item.icon} alt={item.title} style={{ width: 48, height: 48, marginBottom: '0.75rem' }} />
                            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: '#1B2042', margin: '0 0 0.75rem' }}>{item.title}</h3>
                            <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: 'var(--text-main)', margin: 0 }}>{item.text}</p>
                        </motion.div>
                    ))}
                </div>

                <div style={{ marginTop: '4rem' }}>
                    <motion.h2
                        style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: '#1B2042', textAlign: 'center', marginBottom: '2rem' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        Our Core Values
                    </motion.h2>
                    <div className="ark-grid-3">
                        {coreValues.map((item, i) => (
                            <motion.div
                                key={i}
                                className="ark-card"
                                style={{ padding: '2rem', textAlign: 'center', borderTop: '4px solid #1B2042' }}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                            >
                                <img src={item.icon} alt={item.title} style={{ width: 48, height: 48, marginBottom: '0.75rem' }} />
                                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: '#1B2042', margin: '0 0 0.75rem' }}>{item.title}</h3>
                                <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: 'var(--text-main)', margin: 0 }}>{item.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <motion.div
                    style={{ marginTop: '4rem', background: '#1B2042', borderRadius: '12px', padding: '3rem', color: '#fff' }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, textAlign: 'center', margin: '0 0 2.5rem', color: '#fff' }}>
                        Why Choose Us
                    </h2>
                    <div className="ark-grid-3 ark-grid-3--gap-lg">
                        {whyChooseUs.map((item, i) => (
                            <motion.div
                                key={i}
                                style={{ textAlign: 'center' }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                            >
                                <img src={item.icon} alt={item.title} style={{ width: 48, height: 48, marginBottom: '0.75rem', filter: 'brightness(0) invert(1)' }} />
                                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.75rem', color: '#fff' }}>{item.title}</h3>
                                <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: 'rgba(255,255,255,0.85)', margin: 0 }}>{item.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    style={{ marginTop: '4rem', borderRadius: '12px', padding: '3.5rem', textAlign: 'center', border: '2px solid #1B2042' }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                >
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 700, margin: '0 0 1rem', color: '#1B2042' }}>
                        {cta.title}
                    </h2>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-main)', maxWidth: 600, margin: '0 auto 2rem' }}>
                        {cta.subtitle}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <motion.a
                            href={cta.buttonLink}
                            style={{ display: 'inline-block', padding: '1rem 2.5rem', borderRadius: '50px', fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none' }}
                            initial={{ background: '#1B2042', color: '#fff' }}
                            whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(27,32,66,0.3)', background: '#fff', color: '#1B2042' }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {cta.buttonText}
                        </motion.a>
                        <motion.a
                            href={cta.secondaryButtonLink}
                            style={{ display: 'inline-block', padding: '1rem 2.5rem', borderRadius: '50px', fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none', border: '2px solid #1B2042' }}
                            initial={{ background: '#fff', color: '#1B2042' }}
                            whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(27,32,66,0.3)', background: '#1B2042', color: '#fff' }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {cta.secondaryButtonText}
                        </motion.a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default About;
