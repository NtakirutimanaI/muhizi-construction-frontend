import { motion } from 'framer-motion';
import type { Profile } from '../services/profileService';

interface ProjectsProps {
    profile: Profile;
}

const Projects: React.FC<ProjectsProps> = ({ profile }) => {
    const displayProjects = profile.projects || [];

    return (
        <section data-nav-theme="dark" className="section projects" id="projects">
            <div className="container">
                <motion.span
                    className="ark-section__sub"
                    style={{ display: 'inline-block', marginLeft: '30px', color: '#fff' }}
                    animate={{ x: [-20, 20, -20] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                >
                    What We Do
                </motion.span>
                <h2 className="ark-section__heading">Projects</h2>
                <motion.p
                    style={{
                        maxWidth: '600px', margin: '0 auto 3rem', color: '#ffffff',
                        fontSize: '1.05rem', lineHeight: '1.7'
                    }}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                >
                    All our construction projects are delivered with the highest quality standards, on time and within budget. From residential buildings to major infrastructure, each project reflects our commitment to excellence and client satisfaction. Some of our successful projects showcase
                </motion.p>
                <div className="projects__grid">
                    {displayProjects.map((project, index) => {
                        const projectUrl = project.url && !project.url.startsWith('http://') && !project.url.startsWith('https://')
                            ? `https://${project.url}`
                            : project.url;
                        const githubUrl = project.githubUrl && !project.githubUrl.startsWith('http://') && !project.githubUrl.startsWith('https://')
                            ? `https://${project.githubUrl}`
                            : project.githubUrl;

                        return (
                            <div key={index} className="project-card">
                                <div className="project-card__img">
                                    <div className="project-card__img-rotate">
                                        {project.imageUrl ? (
                                            <img src={project.imageUrl} alt={project.name} />
                                        ) : (
                                            <div className="project-card__placeholder">No Image</div>
                                        )}
                                    </div>
                                    <div className="project-card__overlay">
                                        <span>{project.name}</span>
                                    </div>
                                </div>
                                <div className="project-card__body">
                                    <h3 className="project-card__title">{project.name}</h3>

                                    {(project.type || project.role) && (
                                        <div className="project-card__meta">
                                            {project.type && <span>{project.type}</span>}
                                            {project.role && <span>{project.role}</span>}
                                        </div>
                                    )}

                                    {project.technologies && project.technologies.length > 0 && (
                                        <div className="project-card__techs">
                                            {project.technologies.map((tech: string) => (
                                                <span key={tech} className="tech-pill">{tech}</span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="project-card__actions">
                                        {projectUrl && (
                                            <a href={projectUrl} target="_blank" rel="noopener noreferrer" className="project-card__link">
                                                View Project
                                            </a>
                                        )}
                                        {githubUrl && (
                                            <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="project-card__link">
                                                GitHub
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {displayProjects.length > 0 && (
                    <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                        <a href="#contact" className="projects__view-all">
                            View All Projects ({displayProjects.length})
                        </a>
                    </div>
                )}
                {displayProjects.length === 0 && (
                    <p className="projects__empty">No projects added yet.</p>
                )}
            </div>
        </section>
    );
};

export default Projects;
