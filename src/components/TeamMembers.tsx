import { useState } from 'react';
import { FaShareAlt, FaTwitter, FaInstagram, FaFacebookF, FaLinkedinIn, FaYoutube, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import type { Profile } from '../services/profileService';

interface TeamMembersProps {
    profile: Profile;
}

const TeamMembers: React.FC<TeamMembersProps> = ({ profile }) => {
    const members = profile.teamMembers || [];
    const showSection = profile.pageContent?.showTeamSection !== false;
    const brands = profile.pageContent?.teamSection?.brands || [];

    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [miniPage, setMiniPage] = useState(0);
    const MINIS_PER_PAGE = 3;

    if (members.length === 0 || !showSection) return null;

    const getImageUrl = (member: { name: string; imageUrl?: string }) => {
        if (member.imageUrl) return member.imageUrl;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&size=300`;
    };

    const featured = selectedIdx !== null ? [members[selectedIdx]] : members.slice(0, 2);
    const displayPool = selectedIdx !== null
        ? members.filter((_, i) => i !== selectedIdx)
        : members;
    const totalMiniPages = Math.ceil(displayPool.length / MINIS_PER_PAGE);
    const minis = displayPool.slice(miniPage * MINIS_PER_PAGE, miniPage * MINIS_PER_PAGE + MINIS_PER_PAGE);

    const socialsFor = (member: { socialLinks?: { twitter?: string; instagram?: string; facebook?: string; linkedin?: string; youtube?: string } }) => [
        { icon: FaTwitter, href: member.socialLinks?.twitter || profile.socialLinks?.twitter },
        { icon: FaInstagram, href: member.socialLinks?.instagram || profile.socialLinks?.instagram },
        { icon: FaFacebookF, href: member.socialLinks?.facebook || profile.socialLinks?.facebook },
        { icon: FaLinkedinIn, href: member.socialLinks?.linkedin || profile.socialLinks?.linkedin },
        { icon: FaYoutube, href: member.socialLinks?.youtube || profile.socialLinks?.youtube },
    ].filter((s): s is { icon: typeof FaTwitter; href: string } => Boolean(s.href));

    const teamData = profile.pageContent?.teamSection;

    return (
        <section data-nav-theme="light" className="section team-v2" id="team">
            <div className="team-v2__inner">
                {featured.length > 0 && (
                    <div className="team-v2__photos">
                        {featured.map((member, i) => {
                            const socials = socialsFor(member);
                            return (
                            <div key={member.name + i} className="team-v2__photo-card">
                                <div className="team-v2__photo-wrap">
                                    <img src={getImageUrl(member)} alt={member.name} className="team-v2__photo-img" />
                                    {socials.length > 0 && (
                                        <div className="team-v2__social-rail">
                                            {socials.map(({ icon: Icon, href }, si) => (
                                                <a
                                                    key={si}
                                                    href={href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`team-v2__social-btn${si === (i === 0 ? 3 : 2) ? ' team-v2__social-btn--active' : ''}`}
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
                            );
                        })}
                    </div>
                )}

                <div className="team-v2__content">
                    <div className="team-v2__eyebrow">
                        <span className="team-v2__eyebrow-line" />
                        {teamData?.eyebrow || 'OUR EXPERT MEMBER'}
                        <span className="team-v2__eyebrow-line" />
                    </div>
                    <h2 className="team-v2__heading" style={{ fontSize: '15px', fontWeight: 400, color: '#FFFFFF', textAlign: 'left' }}>{teamData?.heading?.replace('\\n', '\n') || 'You Meet\nExpert Team'}</h2>
                    <p className="team-v2__text">
                        {teamData?.description || 'We are driven to improve the lives of our clients, our employees, our community through our commitment to leadership.'}
                    </p>

                    {displayPool.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '1rem' }}>
                            {totalMiniPages > 1 && (
                            <button
                                type="button"
                                onClick={() => { setMiniPage(p => (p - 1 + totalMiniPages) % totalMiniPages); setSelectedIdx(null); }}
                                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'border-color 0.2s, background 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'transparent'; }}
                            >
                                <FaChevronLeft size={14} />
                            </button>
                            )}
                            <div className="team-v2__mini-grid">
                                {minis.map((member, i) => {
                                    const realIdx = members.indexOf(member);
                                    const isSelected = selectedIdx === realIdx;
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            className={`team-v2__mini-photo-btn${isSelected ? ' team-v2__mini-photo-btn--active' : ''}`}
                                            onClick={() => setSelectedIdx(isSelected ? null : realIdx)}
                                            title={member.name}
                                        >
                                            <img
                                                src={getImageUrl(member)}
                                                alt={member.name}
                                                className="team-v2__mini-photo"
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                            {totalMiniPages > 1 && (
                            <button
                                type="button"
                                onClick={() => { setMiniPage(p => (p + 1) % totalMiniPages); setSelectedIdx(null); }}
                                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'border-color 0.2s, background 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'transparent'; }}
                            >
                                <FaChevronRight size={14} />
                            </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {brands.length > 0 && (
                <>
                    <div className="team-v2__badge-wrap">
                        <span className="team-v2__badge">{teamData?.badge || "We're proud to work with best-in-class clients"}</span>
                    </div>

                    <div className="team-v2__logos">
                        <div className="team-v2__logos-track">
                            {brands.map((brand, i) => (
                                <div key={i} className="team-v2__logo">
                                    {brand.logoUrl ? (
                                        <span className="team-v2__logo-icon"><img src={brand.logoUrl} alt={brand.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /></span>
                                    ) : null}
                                    <span className="team-v2__logo-label">{brand.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </section>
    );
};

export default TeamMembers;
