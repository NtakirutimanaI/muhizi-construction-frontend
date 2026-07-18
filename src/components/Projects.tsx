import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaExternalLinkAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import type { Profile } from '../services/profileService';

interface ProjectsProps {
    profile: Profile;
}

const getProjectImages = (project: { imageUrl?: string; images?: string[] }): string[] => {
    if (project.images && project.images.length > 0) return project.images;
    if (project.imageUrl) return [project.imageUrl];
    return [];
};

const ProjectCard: React.FC<{
    project: Profile['projects'][number];
    profileLocation: string;
    index: number;
}> = ({ project, profileLocation, index }) => {
    const images = getProjectImages(project);
    const hasCarousel = images.length > 1;
    const [current, setCurrent] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const next = useCallback(() => {
        setCurrent(c => (c + 1) % images.length);
    }, [images.length]);

    const prev = useCallback(() => {
        setCurrent(c => (c - 1 + images.length) % images.length);
    }, [images.length]);

    useEffect(() => {
        if (!hasCarousel) return;
        timerRef.current = setInterval(next, 3000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [hasCarousel, next, current]);

    const linkUrl = project.url
        ? (project.url.startsWith('http') ? project.url : `https://${project.url}`)
        : (project.githubUrl
            ? (project.githubUrl.startsWith('http') ? project.githubUrl : `https://${project.githubUrl}`)
            : undefined);
    const tiltDir = index % 2 === 0 ? 1 : -1;

    return (
        <motion.div
            className="projects-v2__card"
            initial={{ opacity: 0, y: 50, rotate: tiltDir * 8 }}
            whileInView={{ opacity: 1, y: 0, rotate: tiltDir * 3.5 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: (index % 2) * 0.15, ease: 'easeOut' }}
        >
            <div className="projects-v2__photo-wrap">
                {images.length > 0 ? (
                    <>
                        <div className="projects-v2__carousel">
                            {images.map((img, i) => (
                                <img
                                    key={i}
                                    src={img}
                                    alt={`${project.name} ${i + 1}`}
                                    className={`projects-v2__photo${i === current ? ' projects-v2__photo--active' : ''}`}
                                />
                            ))}
                        </div>
                        {hasCarousel && (
                            <>
                                <button className="projects-v2__carousel-btn projects-v2__carousel-btn--prev" onClick={prev} aria-label="Previous image">
                                    <FaChevronLeft />
                                </button>
                                <button className="projects-v2__carousel-btn projects-v2__carousel-btn--next" onClick={next} aria-label="Next image">
                                    <FaChevronRight />
                                </button>
                                <div className="projects-v2__carousel-dots">
                                    {images.map((_, i) => (
                                        <span key={i} className={`projects-v2__carousel-dot${i === current ? ' projects-v2__carousel-dot--active' : ''}`} />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="projects-v2__photo projects-v2__photo--empty">No Image</div>
                )}
            </div>
            <div className="projects-v2__caption">
                <h3 className="projects-v2__title">{project.name}</h3>
                <div className="projects-v2__location">
                    <FaMapMarkerAlt />
                    <span>{project.location || project.type || project.role || profileLocation}</span>
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
};

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
                        {displayProjects.map((project, index) => (
                            <ProjectCard
                                key={index}
                                project={project}
                                profileLocation={profile.location}
                                index={index}
                            />
                        ))}
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
