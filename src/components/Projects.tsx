import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaExternalLinkAlt } from 'react-icons/fa';
import type { Profile } from '../services/profileService';

interface ProjectsProps {
    profile: Profile;
}

const Projects: React.FC<ProjectsProps> = ({ profile }) => {
    const displayProjects = profile.projects || [];
    const ps = profile.pageContent?.projectsSection;

    return (
        <section data-nav-theme="light" className="section projects-v2" id="projects">
            <div className="container">
                <div className="projects-v2__eyebrow">
                    <span className="projects-v2__eyebrow-line" />
                    OUR PROJECTS
                    <span className="projects-v2__eyebrow-line" />
                </div>
                <h2 className="projects-v2__heading">{ps?.heading || 'We Provide Effective Solution in Construction'}</h2>

                {displayProjects.length > 0 && (
                    <div className="projects-v2__grid">
                        {displayProjects.map((project, index) => {
                            const linkUrl = project.url
                                ? (project.url.startsWith('http') ? project.url : `https://${project.url}`)
                                : (project.githubUrl
                                    ? (project.githubUrl.startsWith('http') ? project.githubUrl : `https://${project.githubUrl}`)
                                    : undefined);
                            const tiltDir = index % 2 === 0 ? 1 : -1;

                            return (
                                <motion.div
                                    key={index}
                                    className="projects-v2__card"
                                    initial={{ opacity: 0, y: 50, rotate: tiltDir * 8 }}
                                    whileInView={{ opacity: 1, y: 0, rotate: tiltDir * 3.5 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: (index % 2) * 0.15, ease: 'easeOut' }}
                                >
                                    <div className="projects-v2__photo-wrap">
                                        {project.imageUrl ? (
                                            <img src={project.imageUrl} alt={project.name} className="projects-v2__photo" />
                                        ) : (
                                            <div className="projects-v2__photo projects-v2__photo--empty">No Image</div>
                                        )}
                                    </div>
                                    <div className="projects-v2__caption">
                                        <h3 className="projects-v2__title">{project.name}</h3>
                                        <div className="projects-v2__location">
                                            <FaMapMarkerAlt />
                                            <span>{project.type || project.role || profile.location}</span>
                                        </div>
                                        {linkUrl && (
                                            <a
                                                href={linkUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="projects-v2__arrow"
                                                aria-label={`View ${project.name}`}
                                            >
                                                <FaExternalLinkAlt />
                                            </a>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {displayProjects.length > 0 && (
                    <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                        <a href="#contact" className="projects-v2__view-all">
                            View All Projects ({displayProjects.length})
                        </a>
                    </div>
                )}
                {displayProjects.length === 0 && (
                    <p className="projects-v2__empty">No projects added yet.</p>
                )}
            </div>
        </section>
    );
};

export default Projects;
