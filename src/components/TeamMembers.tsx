import { FaShareAlt, FaTwitter, FaInstagram, FaFacebookF, FaLinkedinIn } from 'react-icons/fa';
import type { Profile } from '../services/profileService';

interface TeamMembersProps {
    profile: Profile;
}

// Placeholder partner marks — swap for real client logos when available.
const PARTNER_LOGOS = [
    {
        name: 'Meridian Group',
        variant: '',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 0 0 18 9 9 0 0 1 0-18Z" fill="currentColor" stroke="none" opacity="0.5" /></svg>
        ),
    },
    {
        name: 'Gormley & Co',
        variant: '',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 12 12 5l9 7" /><path d="M5 11v8h14v-8" /><path d="M9 19v-5h6v5" /></svg>
        ),
    },
    {
        name: 'Urban Land Co',
        subtitle: 'MODERN & LUXURY LIVING',
        variant: 'wordmark',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3 4 21h5l3-7 3 7h5L12 3Z" /></svg>
        ),
    },
    {
        name: 'Horizon Homes',
        variant: '',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 20c2-3 4-3 6 0s4 3 6 0 4-3 6 0" /><path d="M6 13 12 7l6 6" /><path d="M8 20v-6h8v6" /></svg>
        ),
    },
    {
        name: 'constructline',
        variant: 'lowercase',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" /></svg>
        ),
    },
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
                            <div key={i} className="team-v2__photo-card">
                                <div className="team-v2__photo-wrap">
                                    <img src={getImageUrl(member)} alt={member.name} className="team-v2__photo-img" />
                                    {i === 1 && socials.length > 0 && (
                                        <div className="team-v2__social-rail">
                                            {socials.map(({ icon: Icon, href }, si) => (
                                                <a
                                                    key={si}
                                                    href={href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`team-v2__social-btn${si === 2 ? ' team-v2__social-btn--active' : ''}`}
                                                >
                                                    <Icon />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
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

            <div className="team-v2__logos">
                <div className="team-v2__logos-track">
                    {PARTNER_LOGOS.map((logo, i) => (
                        <div
                            key={i}
                            className={`team-v2__logo${logo.variant ? ` team-v2__logo--${logo.variant}` : ''}`}
                        >
                            <span className="team-v2__logo-icon">{logo.icon}</span>
                            <span className="team-v2__logo-label">
                                {logo.name}
                                {logo.subtitle && <small>{logo.subtitle}</small>}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TeamMembers;
