import { motion } from 'framer-motion';
import { FaBuilding, FaHardHat, FaHandshake, FaCheckCircle } from 'react-icons/fa';
import type { Profile } from '../services/profileService';

interface StatsProps {
    profile: Profile;
}

const Stats: React.FC<StatsProps> = ({ profile }) => {
    const items = [
        { icon: FaBuilding, value: profile.projects?.length || 0, suffix: '+', label: 'Projects Completed' },
        { icon: FaHardHat, value: profile.yearsOfExperience || 0, suffix: '+', label: 'Years Experience' },
        { icon: FaHandshake, value: profile.teamMembers?.length || 0, suffix: '+', label: 'Team Members' },
        { icon: FaCheckCircle, value: 98, suffix: '%', label: 'Satisfaction Rate' },
    ];

    return (
        <section className="stats-section">
            <div className="container">
                <div className="stats-grid">
                    {items.map((item, i) => (
                        <motion.div
                            key={i}
                            className="stat-card"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: i * 0.1 }}
                        >
                            <item.icon className="stat-card-icon" />
                            <span className="stat-card-value">{item.value}{item.suffix}</span>
                            <span className="stat-card-label">{item.label}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Stats;
