import { motion } from 'framer-motion';
import { FaBuilding, FaRoad, FaHome, FaIndustry, FaTools, FaHardHat } from 'react-icons/fa';
import Stats from './Stats';
import type { Profile } from '../services/profileService';

interface AboutProps {
    profile: Profile;
}

const About: React.FC<AboutProps> = ({ profile }) => {
    return (
        <section className="section section-indicator" id="about">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="ark-section__sub" style={{ color: '#000', fontSize: '1.625rem', fontWeight: '700', textTransform: 'none' }}>
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
                    <a href="#about" className="about-btn" style={{ display: 'inline-block', background: 'transparent', color: '#000', padding: '0.75rem 2rem', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 600, border: '1px solid #000', borderRadius: '6px', transition: 'all 0.3s' }}>
                        About Us &rarr;
                    </a>
                </div>
            </div>
        </section>
    );
};

export default About;
