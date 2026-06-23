import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBuilding, FaRoad, FaHome, FaIndustry, FaTools, FaHardHat } from 'react-icons/fa';
import Stats from './Stats';
import type { Profile } from '../services/profileService';

interface AboutProps {
    profile: Profile;
}

const CARD_ICONS = [FaBuilding, FaRoad, FaIndustry, FaHome, FaHardHat, FaTools];

const defaultCards = [
    { title: 'Building Construction', description: 'Residential and commercial buildings' },
    { title: 'Road Construction', description: 'Highways, roads and pavement' },
    { title: 'Infrastructure', description: 'Water, drainage and utilities' },
    { title: 'Renovation', description: 'Remodeling and restoration' },
    { title: 'Project Management', description: 'Planning and supervision' },
    { title: 'Maintenance', description: 'Ongoing property care' },
];

const About: React.FC<AboutProps> = ({ profile }) => {
    const [hover, setHover] = useState(false);
    const as = profile.pageContent?.aboutSection;
    const heading = as?.heading || 'Overview';
    const subtitle = as?.subtitle || 'Our Products Are Beautiful, Good Quality And Professional';
    const cards = as?.cards?.length ? as.cards : defaultCards;
    const tickerText = as?.tickerText || 'Building Construction \u00B7 Road Construction \u00B7 Infrastructure \u00B7 Renovation \u00B7 Maintenance';
    const bgImage = as?.imageUrl || '/img.png';
    return (
        <section data-nav-theme="light" className="section section-indicator" id="about" style={{
            paddingBottom: '5px',
            background: `linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)), url(${bgImage}) center/cover fixed`,
        }}>
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    {heading && <h2 className="ark-section__heading" style={{ marginBottom: '0.5rem' }}>{heading}</h2>}
                    <span
                        className="ark-section__sub"
                        style={{ color: hover ? '#1B2042' : '#000', fontSize: '1.625rem', fontWeight: '700', textTransform: 'none', transition: 'color 0.3s', cursor: 'default' }}
                        onMouseEnter={() => setHover(true)}
                        onMouseLeave={() => setHover(false)}
                    >
                        {subtitle}
                    </span>
                </motion.div>

                <div className="service-cards">
                    {cards.map((card, i) => {
                        const Icon = CARD_ICONS[i % CARD_ICONS.length];
                        return (
                            <div key={i} className="service-card">
                                <Icon className="service-card-icon" />
                                <h3 className="service-card-title">{card.title}</h3>
                                <p className="service-card-desc">{card.description}</p>
                            </div>
                        );
                    })}
                </div>

                <Stats profile={profile} />

                <div style={{ textAlign: 'left', marginTop: '-60px' }}>
                    <Link to="/about" className="about-btn" style={{ display: 'inline-block', background: 'transparent', color: '#000', padding: '0.75rem 2rem', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 600, border: '1px solid #000', borderRadius: '6px', transition: 'all 0.3s' }}>
                        About Us &rarr;
                    </Link>
                </div>

                <div style={{ width: 'calc(100% + 60px)', marginLeft: '-15px', marginRight: 'auto', marginTop: '5.5rem', padding: '0.75rem 0', background: '#1B2042', borderRadius: '4px', overflow: 'hidden' }}>
                    <span className="slide-bounce" style={{ fontSize: '1rem', fontWeight: 500, color: '#fff', letterSpacing: '0.3em', marginLeft: '20px', paddingRight: '0.5rem' }}>
                        {tickerText}
                    </span>
                </div>
            </div>
        </section>
    );
};

export default About;
