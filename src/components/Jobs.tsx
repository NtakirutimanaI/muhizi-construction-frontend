import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProfileFormModal from './ProfileFormModal';

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

const Jobs: React.FC = () => {
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
                <span className="ark-section__sub" style={{ display: 'inline-block', marginLeft: '30px', color: '#111' }}>
                    Join Our Team
                </span>
                <h2 className="ark-section__heading" style={{ color: '#111' }}>Open Positions</h2>

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
            </div>

            <ProfileFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
        </section>
    );
};

export default Jobs;
