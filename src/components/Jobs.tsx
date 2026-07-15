import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaLinkedin, FaTwitter, FaFacebookF, FaInstagram, FaGlobe } from 'react-icons/fa';
import ProfileFormModal from './ProfileFormModal';
import type { Profile } from '../services/profileService';

const jobs = [
    {
        title: 'Senior Construction Project Manager',
        type: 'Full-time',
        location: 'Kigali, Rwanda',
        description: 'Lead and oversee construction projects from inception to completion. Manage budgets, schedules, subcontractors, and ensure quality standards are met.',
    },
    {
        title: 'Civil Engineer',
        type: 'Full-time',
        location: 'Kigali, Rwanda',
        description: 'Design, plan, and supervise construction projects including roads, buildings, and infrastructure. Ensure structural integrity and regulatory compliance.',
    },
    {
        title: 'Architect',
        type: 'Contract',
        location: 'Kigali, Rwanda',
        description: 'Create innovative architectural designs for residential and commercial projects. Prepare drawings, specifications, and construction documents.',
    },
];

interface JobsProps {
    profile: Profile;
}

const socialIconMap: Record<string, React.ReactNode> = {
    linkedin: <FaLinkedin />,
    twitter: <FaTwitter />,
    facebook: <FaFacebookF />,
    instagram: <FaInstagram />,
    website: <FaGlobe />,
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const Jobs: React.FC<JobsProps> = ({ profile }) => {
    const members = profile.teamMembers || [];
    const [modalOpen, setModalOpen] = useState(false);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        if (searchParams.get('createProfile') === 'true') {
            setModalOpen(true);
            searchParams.delete('createProfile');
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    return (
        <section className="section jobs" id="jobs">
            <div className="container">
                <span className="ark-section__sub" style={{ display: 'inline-block', marginLeft: '30px' }}>
                    Join Our Team
                </span>
                <h2 className="ark-section__heading">Open Positions</h2>

                <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                    <button
                        className="jobs__create-btn"
                        onClick={() => navigate('/login?redirect=/')}
                    >
                        + Create Profile
                    </button>
                </div>

                <motion.div
                    className="jobs__grid"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {jobs.map((item, index) => (
                        <motion.article key={index} className="jobs__card" variants={cardVariants}>
                            <div className="jobs__card-body">
                                <div className="jobs__card-header">
                                    <h3 className="jobs__card-title">{item.title}</h3>
                                    <span className="jobs__tag">{item.type}</span>
                                </div>
                                <span className="jobs__location">{item.location}</span>
                                <p className="jobs__description">{item.description}</p>
                                <a href="#contact" className="jobs__link">
                                    Apply Now
                                </a>
                            </div>
                        </motion.article>
                    ))}
                </motion.div>

                {members.length > 0 && (
                    <>
                        <h3 className="jobs__team-heading">Our Team</h3>
                        <motion.div
                            className="team-cards-grid"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={{
                                hidden: { opacity: 0 },
                                visible: { transition: { staggerChildren: 0.1 } },
                            }}
                        >
                            {members.map((member, i) => {
                                const imgUrl = member.imageUrl ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=8B4513&color=fff&size=300`;
                                return (
                                    <motion.div
                                        key={i}
                                        className="team-card"
                                        variants={{
                                            hidden: { opacity: 0, y: 30 },
                                            visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                                        }}
                                    >
                                        <div className="team-card__img-wrap">
                                            <img src={imgUrl} alt={member.name} className="team-card__img" />
                                        </div>
                                        <h3 className="team-card__name">{member.name}</h3>
                                        <p className="team-card__role">{member.role}</p>
                                        <div className="team-card__socials">
                                            {Object.entries(profile.socialLinks || {}).map(([key, url]) =>
                                                url ? (
                                                    <a
                                                        key={key}
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="team-card__social-link"
                                                    >
                                                        {socialIconMap[key] || <FaGlobe />}
                                                    </a>
                                                ) : null
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </>
                )}
            </div>

            <ProfileFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
        </section>
    );
};

export default Jobs;