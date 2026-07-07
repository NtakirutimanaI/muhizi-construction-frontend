import type { Profile } from '../services/profileService';

interface SkillsProps {
    profile: Profile;
}

const Skills: React.FC<SkillsProps> = ({ profile }) => {
    const categories = Object.keys(profile.skills);

    return (
        <section className="section" id="skills">
            <div className="container">
                <div className="resume-section">
                    <div className="resume-title">Skills</div>
                    <div className="resume-list" style={{ gap: '2rem' }}>
                        {categories.map((cat) => (
                            <div key={cat} className="resume-item">
                                <div className="resume-date" style={{ textTransform: 'capitalize' }}>
                                    {cat}
                                </div>
                                <div className="resume-content">
                                    <p style={{ lineHeight: '1.8' }}>
                                        {profile.skills[cat].join('  •  ')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Skills;
