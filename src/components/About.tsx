import { motion } from 'framer-motion';
import { FaBuilding, FaRoad, FaHome, FaIndustry, FaTools, FaHardHat } from 'react-icons/fa';
import Stats from './Stats';
import type { Profile } from '../services/profileService';

interface AboutProps {
    profile: Profile;
}

const CARD_ICONS = [FaBuilding, FaRoad, FaIndustry, FaHome, FaHardHat, FaTools];
const DESIGN_ICONS = [FaBuilding, FaHome, FaIndustry, FaTools];

const DEFAULT_SERVICE_ITEMS = [
    { title: 'Building Construction', description: 'We deliver high-quality residential and commercial building construction with precision and excellence.', images: ['https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'], tags: ['Construction'], color: '#1B2042' },
    { title: 'Road Infrastructure', description: 'Design and construction of roads, drainage systems, and large-scale infrastructure projects.', images: ['https://images.unsplash.com/photo-1513828583688-c52646db42da?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'], tags: ['Infrastructure'], color: '#1B2042' },
    { title: 'Architectural Design', description: 'Modern architectural design, 3D modeling, and sustainable building design for contemporary spaces.', images: ['https://images.unsplash.com/photo-1486718448742-163732cd1544?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'], tags: ['Design'], color: '#1B2042' },
    { title: 'Real Estate Development', description: 'Property development, land acquisition, and real estate marketing for sustainable communities.', images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'], tags: ['Real Estate'], color: '#1B2042' },
];

const VALUE_CARDS = [
    { title: 'Values', description: 'Integrity, transparency, and accountability form the foundation of everything we do. We uphold the highest ethical standards in every project we undertake.' },
    { title: 'Mission', description: 'To deliver exceptional construction and real estate solutions that exceed client expectations through innovation, quality craftsmanship, and sustainable practices.' },
    { title: 'Vision', description: 'To be Rwanda\'s most trusted construction company, shaping communities and building a better future through excellence in infrastructure and property development.' },
];

const About: React.FC<AboutProps> = ({ profile }) => {
    const as = profile.pageContent?.aboutSection;
    const heading = as?.heading;
    const subtitle = as?.subtitle;
    const tickerText = as?.tickerText;
    const serviceItems = profile.pageContent?.services?.items || [];
    const firstFour = serviceItems.length >= 4 ? serviceItems.slice(0, 4) : DEFAULT_SERVICE_ITEMS;
    const mergedFirstFour = firstFour.map((item, idx) => ({
        ...item,
        images: item.images?.length ? item.images : (DEFAULT_SERVICE_ITEMS[idx]?.images || []),
    }));

    return (
        <section data-nav-theme="light" className="section section-indicator" id="about" style={{
            paddingBottom: '5px',
            background: `linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)), url(/bg1.png) center/cover fixed`,
        }}>
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.span
                        className="ark-section__sub"
                        style={{ display: 'inline-block', marginLeft: '30px' }}
                        animate={{ x: [-20, 20, -20] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        What We Offer
                    </motion.span>
                    <h2 className="ark-section__heading" style={{ marginBottom: 0 }}>
                        Our Services
                    </h2>
                    <style>{`.ark-section__heading::after { margin-top: 0 !important; }`}</style>
                </motion.div>

                {/* Highlighted Text + Design Cards Row */}
                <div style={{ width: '100vw', margin: '3rem calc(-50vw + 50%)', padding: '0 1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '220px repeat(4, 1fr)', gap: '1rem', maxWidth: '1600px', margin: '0 auto' }}>
                        <div style={{ background: '#1B2042', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <p style={{ color: '#fff', fontSize: '1.9rem', fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
                                Driven By<br />
                                <span style={{ color: '#4ecdc4' }}>Quality</span><br />
                                Defined By<br />
                                <span style={{ color: '#4ecdc4' }}>Results</span>
                            </p>
                            <div style={{ marginTop: '1.5rem' }}>
                                <a href="#services" className="learn-more" style={{ background: '#f97316', borderColor: '#f97316', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '0 0 0 1.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.025em', textDecoration: 'none', transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    VIEW ALL SERVICES
                                    <span className="learn-more-circle" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: '#000', flexShrink: 0 }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(295deg)' }}>
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                            <polyline points="12 5 19 12 12 19"></polyline>
                                        </svg>
                                    </span>
                                </a>
                            </div>
                        </div>
                        {mergedFirstFour.map((item, idx) => {
                            const Icon = DESIGN_ICONS[idx % DESIGN_ICONS.length];
                            const imgSrc = item.images?.[0] || 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                            return (
                                <div key={idx} style={{ borderRadius: '12px', overflow: 'hidden', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                                    <div style={{ position: 'relative' }}>
                                        <img
                                            src={imgSrc}
                                            alt={item.title}
                                            style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
                                            onError={e => {
                                                const t = e.target as HTMLImageElement;
                                                t.style.display = 'none';
                                                const parent = t.parentElement!;
                                                parent.style.background = '#f97316';
                                                parent.style.minHeight = '200px';
                                                const fallbackTxt = document.createElement('div');
                                                fallbackTxt.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1.8rem;font-weight:700;color:#fff;';
                                                fallbackTxt.textContent = item.title.charAt(0);
                                                parent.style.position = 'relative';
                                                parent.appendChild(fallbackTxt);
                                            }}
                                        />
                                        <div style={{ position: 'absolute', bottom: '15px', right: '15px', width: '40px', height: '40px', borderRadius: '50%', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                                            <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700, transform: 'rotate(290deg)', display: 'inline-block' }}>&rarr;</span>
                                        </div>
                                    </div>
                                    <div style={{ padding: '1.2rem 1.5rem', minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        <h3 style={{ color: '#1B2042', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem', paddingBottom: '50px', borderBottom: '1px solid #1B2042', display: 'inline-block' }}><Icon style={{ marginRight: '8px', color: '#f97316' }} />{item.title}</h3>
                                        <p style={{ color: '#555', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>{item.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="service-cards" style={{ marginTop: '2rem' }}>
                    {VALUE_CARDS.map((card, i) => {
                        const Icon = CARD_ICONS[i % CARD_ICONS.length];
                        return (
                            <div key={i} className="service-card">
                                <Icon className="service-card-icon" />
                                <h3 className="service-card-title">{card.title}</h3>
                                {card.description && <p className="service-card-desc">{card.description}</p>}
                            </div>
                        );
                    })}
                </div>

                <Stats profile={profile} />

                <div style={{ marginTop: '1.5rem', padding: '6px 0 0.1rem', textAlign: 'center', background: '#1B2042' }}>
                    <p style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
                        Call Us On Phone: +250780620735 or Email: muhizidesigningacademy@gmail.com
                    </p>
                </div>

                {tickerText && (
                <div className="ticker-bar" style={{ width: '100%', marginTop: '3rem', padding: '0.75rem 0', background: '#1B2042', borderRadius: '4px', overflow: 'hidden' }}>
                    <span className="slide-bounce" style={{ fontSize: '1rem', fontWeight: 500, color: '#fff', letterSpacing: '0.3em', marginLeft: '20px', paddingRight: '0.5rem' }}>
                        {tickerText}
                    </span>
                </div>
                )}
            </div>
        </section>
    );
};

export default About;
