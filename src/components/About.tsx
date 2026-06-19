import { motion } from 'framer-motion';
import { FaBuilding, FaHardHat, FaHandshake, FaCheckCircle } from 'react-icons/fa';
import type { Profile } from '../services/profileService';

interface AboutProps {
    profile: Profile;
}

const About: React.FC<AboutProps> = ({ profile }) => {
    const stats = [
        { icon: FaBuilding, value: '50+', label: 'Projects Completed' },
        { icon: FaHardHat, value: `${profile.yearsOfExperience || 6}+`, label: 'Years Experience' },
        { icon: FaHandshake, value: '100+', label: 'Happy Clients' },
        { icon: FaCheckCircle, value: '98%', label: 'Satisfaction Rate' },
    ];

    return (
        <section className="section section-indicator" id="about">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="ark-section__sub" style={{ display: 'inline-block', marginLeft: '30px' }}>
                        About Us
                    </span>
                    <h2 className="ark-section__heading">
                        {profile.firstName} {profile.lastName}
                    </h2>
                </motion.div>

                <div className="about-grid">
                    <motion.div
                        className="about-content"
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <p className="about-bio">{profile.bio}</p>
                        <div className="about-details">
                            {profile.location && (
                                <div className="about-detail-item">
                                    <span className="about-detail-label">Location</span>
                                    <span className="about-detail-value">{profile.location}</span>
                                </div>
                            )}
                            {profile.yearsOfExperience > 0 && (
                                <div className="about-detail-item">
                                    <span className="about-detail-label">Experience</span>
                                    <span className="about-detail-value">{profile.yearsOfExperience} Years</span>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    <motion.div
                        className="about-stats-grid"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        {stats.map((stat, i) => (
                            <div key={i} className="about-stat-card">
                                <stat.icon className="about-stat-icon" />
                                <span className="about-stat-value">{stat.value}</span>
                                <span className="about-stat-label">{stat.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default About;
