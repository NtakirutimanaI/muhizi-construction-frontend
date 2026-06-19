import { Link } from 'react-router-dom';
import type { Profile } from '../services/profileService';

interface ExperienceProps {
    profile: Profile;
}

const Experience: React.FC<ExperienceProps> = ({ profile }) => {
    return (
        <section className="section section-indicator" id="resume">
            <div className="container">
                {/* Our Technologies */}
                <div style={{ marginBottom: '2rem' }}>
                    <h2 className="ark-section__heading">Our Technologies</h2>
                    <div className="ark-grid-auto">
                        {Object.entries(profile.skills || {}).filter(([category]) =>
                            !['other'].includes(category)
                        ).map(([category, skills]) => (
                            <div key={category} className="ark-card" style={{ padding: '1.5rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', textTransform: 'capitalize', color: 'var(--primary-teal)' }}>
                                    {category.replace(/-/g, ' ')}
                                </h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {(skills || []).map(skill => (
                                        <span key={skill} className="tech-pill">{skill}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {Object.keys(profile.skills || {}).length === 0 && (
                            <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1' }}>No skills added yet.</p>
                        )}
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <Link to="/about" style={{
                        background: 'var(--primary)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '0.65rem 1.5rem',
                        borderRadius: '8px',
                        border: 'none',
                        transition: 'opacity 0.2s',
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                        More About Us &rarr;
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default Experience;
