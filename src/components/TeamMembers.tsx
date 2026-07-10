import { motion } from 'framer-motion';
import { FaShareAlt, FaTwitter, FaInstagram, FaFacebookF, FaLinkedinIn } from 'react-icons/fa';
import type { Profile } from '../services/profileService';

interface TeamMembersProps {
    profile: Profile;
}

const TICKER_WORDS = [
    'Quality Craftsmanship', 'Home Construction', 'Building Design',
    'Architecture & Building', 'Material Recycling', 'Tools And Equipment', 'Building Construction',
];

const TeamMembers: React.FC<TeamMembersProps> = ({ profile }) => {
    const members = profile.teamMembers || [];
    const showSection = profile.pageContent?.showTeamSection !== false;

    if (members.length === 0 || !showSection) return null;

    const getImageUrl = (member: { name: string; imageUrl?: string }) => {
        if (member.imageUrl) return member.imageUrl;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&size=300`;
    };

    const featured = members.slice(0, 2);
    const minis = members.slice(2, 5);

    const socials = [
        { icon: FaTwitter, href: profile.socialLinks?.twitter },
        { icon: FaInstagram, href: profile.socialLinks?.instagram },
        { icon: FaFacebookF, href: profile.socialLinks?.facebook },
        { icon: FaLinkedinIn, href: profile.socialLinks?.linkedin },
    ].filter((s): s is { icon: typeof FaTwitter; href: string } => Boolean(s.href));

    return (
        <section data-nav-theme="light" className="section team-v2" id="team">
            <div className="team-v2__inner">
                {featured.length > 0 && (
                    <div className="team-v2__photos">
                        {featured.map((member, i) => (
                            <div
                                key={i}
                                className={`team-v2__photo-card${i === 1 ? ' team-v2__photo-card--raised' : ''}`}
                            >
                                <img src={getImageUrl(member)} alt={member.name} className="team-v2__photo-img" />
                                <div className="team-v2__name-bar">
                                    <div>
                                        <h4>{member.name}</h4>
                                        <p>{member.role}</p>
                                    </div>
                                    <span className="team-v2__share">
                                        <FaShareAlt />
                                    </span>
                                </div>
                            </div>
                        ))}

                        {socials.length > 0 && featured.length > 1 && (
                            <div className="team-v2__social-rail">
                                {socials.map(({ icon: Icon, href }, i) => (
                                    <a
                                        key={i}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`team-v2__social-btn${i === 2 ? ' team-v2__social-btn--active' : ''}`}
                                    >
                                        <Icon />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="team-v2__content">
                    <div className="team-v2__eyebrow">
                        <span className="team-v2__eyebrow-line" />
                        OUR EXPERT MEMBER
                        <span className="team-v2__eyebrow-line" />
                    </div>
                    <h2 className="team-v2__heading">You Meet<br />Expert Team</h2>
                    <p className="team-v2__text">
                        We are driven to improve the lives of our clients, our employees,
                        our community through our commitment to leadership.
                    </p>

                    {minis.length > 0 && (
                        <div className="team-v2__mini-grid">
                            {minis.map((member, i) => (
                                <img
                                    key={i}
                                    src={getImageUrl(member)}
                                    alt={member.name}
                                    className="team-v2__mini-photo"
                                    title={member.name}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="team-v2__badge-wrap">
                <span className="team-v2__badge">We're proud to work with best-in-class clients</span>
            </div>

            <div className="team-v2__ticker-wrap">
                <motion.div
                    className="team-v2__ticker"
                    animate={{ rotate: -2 }}
                >
                    <div className="team-v2__ticker-track">
                        {[...TICKER_WORDS, ...TICKER_WORDS].map((word, i) => (
                            <span key={i} className="team-v2__ticker-item">
                                {word} <span className="team-v2__ticker-dot">*</span>
                            </span>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default TeamMembers;
