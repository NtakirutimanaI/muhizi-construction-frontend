import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBuilding, FaRoad, FaHome, FaIndustry, FaTools, FaHardHat } from 'react-icons/fa';
import Stats from './Stats';
import type { Profile } from '../services/profileService';

interface AboutProps {
    profile: Profile;
}

const About: React.FC<AboutProps> = ({ profile }) => {
    const [hover, setHover] = useState(false);
    return (
        <section className="section section-indicator" id="about" style={{
            paddingBottom: '5px',
            background: `linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)), url(/img.png) center/cover fixed`,
        }}>
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <span
                        className="ark-section__sub"
                        style={{ color: hover ? '#8B4513' : '#000', fontSize: '1.625rem', fontWeight: '700', textTransform: 'none', transition: 'color 0.3s', cursor: 'default' }}
                        onMouseEnter={() => setHover(true)}
                        onMouseLeave={() => setHover(false)}
                    >
                        Our Products Are Beautiful, Good Quality And Professional
                    </span>
                </motion.div>

                <div className="service-cards">
                    <div className="service-card">
                        <FaBuilding className="service-card-icon" />
                        <h3 className="service-card-title">Building Construction</h3>
                        <p className="service-card-desc">Residential and commercial buildings</p>
                    </div>
                    <div className="service-card">
                        <FaRoad className="service-card-icon" />
                        <h3 className="service-card-title">Road Construction</h3>
                        <p className="service-card-desc">Highways, roads and pavement</p>
                    </div>
                    <div className="service-card">
                        <FaIndustry className="service-card-icon" />
                        <h3 className="service-card-title">Infrastructure</h3>
                        <p className="service-card-desc">Water, drainage and utilities</p>
                    </div>
                    <div className="service-card">
                        <FaHome className="service-card-icon" />
                        <h3 className="service-card-title">Renovation</h3>
                        <p className="service-card-desc">Remodeling and restoration</p>
                    </div>
                    <div className="service-card">
                        <FaHardHat className="service-card-icon" />
                        <h3 className="service-card-title">Project Management</h3>
                        <p className="service-card-desc">Planning and supervision</p>
                    </div>
                    <div className="service-card">
                        <FaTools className="service-card-icon" />
                        <h3 className="service-card-title">Maintenance</h3>
                        <p className="service-card-desc">Ongoing property care</p>
                    </div>
                </div>

                <Stats profile={profile} />

                <div style={{ textAlign: 'left', marginTop: '-60px' }}>
                    <Link to="/about" className="about-btn" style={{ display: 'inline-block', background: 'transparent', color: '#000', padding: '0.75rem 2rem', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 600, border: '1px solid #000', borderRadius: '6px', transition: 'all 0.3s' }}>
                        About Us &rarr;
                    </Link>
                </div>

                <div style={{ width: 'calc(100% + 60px)', marginLeft: '-15px', marginRight: 'auto', marginTop: '5.5rem', padding: '0.75rem 0', background: '#8B4513', borderRadius: '4px', overflow: 'hidden' }}>
                    <span className="slide-bounce" style={{ fontSize: '1rem', fontWeight: 500, color: '#fff', letterSpacing: '0.3em', marginLeft: '20px', paddingRight: '0.5rem' }}>
                        Building Construction &middot; Road Construction &middot; Infrastructure &middot; Renovation &middot; Maintenance
                    </span>
                </div>
            </div>
        </section>
    );
};

export default About;
