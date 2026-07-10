import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Profile } from '../../services/profileService';
import TeamMemberCard from '../../components/TeamMemberCard';

const Team = () => {
    const { profile } = useOutletContext<{ profile: Profile | null }>();
    const members = profile?.teamMembers || [];
    const socialLinks = profile?.socialLinks || {};

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const getImageUrl = (member: { name: string; imageUrl?: string }) => {
        if (member.imageUrl) return member.imageUrl;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=d4c8b8&color=111111&size=540&bold=true&font-size=0.38`;
    };

    const cardMembers = members.slice(0, 2);
    const miniMembers = members.slice(0, 3);

    return (
        <section className="tm">
            <div className="tm__container">

                {/* Left Column — Photo Cards */}
                <div className="tm__left">
                    {cardMembers.length > 0 ? (
                        cardMembers.map((member, i) => (
                            <TeamMemberCard
                                key={i}
                                image={getImageUrl(member)}
                                name={member.name}
                                position={member.role}
                                socialLinks={{
                                    twitter: socialLinks.twitter,
                                    instagram: socialLinks.instagram,
                                    facebook: socialLinks.facebook,
                                    linkedin: socialLinks.linkedin,
                                }}
                            />
                        ))
                    ) : (
                        <>
                            <TeamMemberCard
                                image="https://ui-avatars.com/api/?name=John+Smith&background=d4c8b8&color=111111&size=540&bold=true&font-size=0.38"
                                name="John Smith"
                                position="Chief Financial Officer"
                                socialLinks={socialLinks}
                            />
                            <TeamMemberCard
                                image="https://ui-avatars.com/api/?name=William+John&background=c8d4d8&color=111111&size=540&bold=true&font-size=0.38"
                                name="William John"
                                position="Chief Financial Officer"
                                socialLinks={socialLinks}
                            />
                        </>
                    )}
                </div>

                {/* Right Column — Text Content */}
                <div className="tm__right">
                    <div className="tm__eyebrow">
                        <span className="tm__eyebrow-line" />
                        OUR EXPERT MEMBER
                        <span className="tm__eyebrow-line" />
                    </div>

                    <h2 className="tm__heading">
                        You Meet<br />Expert Team
                    </h2>

                    <p className="tm__description">
                        Our team of skilled professionals brings decades of combined
                        experience in construction, engineering, and project management
                        to deliver exceptional results on every project.
                    </p>

                    {/* Small team images */}
                    <div className="tm__mini-photos">
                        {miniMembers.length > 0 ? (
                            miniMembers.map((m, i) => (
                                <img
                                    key={i}
                                    src={getImageUrl(m)}
                                    alt={m.name}
                                    className="tm__mini-photo"
                                />
                            ))
                        ) : (
                            <>
                                <img src="https://ui-avatars.com/api/?name=Alice+Brown&background=e8ddd0&color=111111&size=200&bold=true" alt="Team member" className="tm__mini-photo" />
                                <img src="https://ui-avatars.com/api/?name=Carol+White&background=d0d8e0&color=111111&size=200&bold=true" alt="Team member" className="tm__mini-photo" />
                                <img src="https://ui-avatars.com/api/?name=David+Lee&background=d8d0d0&color=111111&size=200&bold=true" alt="Team member" className="tm__mini-photo" />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Client Logos */}
            <div className="tm__logos">
                <div className="tm__logos-row">
                    <div className="tm__logo">
                        <svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="14" r="7" stroke="#999" strokeWidth="1.5"/><path d="M8 36c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="#999" strokeWidth="1.5"/></svg>
                    </div>
                    <div className="tm__logo tm__logo--wordmark">
                        <svg viewBox="0 0 24 20" fill="none"><path d="M12 2L2 10h20L12 2z" stroke="#999" strokeWidth="1.2"/><rect x="8" y="10" width="8" height="8" stroke="#999" strokeWidth="1.2"/></svg>
                        <span>GORMLEY<br /><small>CONSTRUCTION</small></span>
                    </div>
                    <div className="tm__logo tm__logo--wordmark">
                        <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="6" width="14" height="12" stroke="#999" strokeWidth="1.2"/><path d="M10 2L3 6h14L10 2z" stroke="#999" strokeWidth="1.2"/></svg>
                        <span>WUTAMALAND<br /><small>MODERN & LUXURY LIVING</small></span>
                    </div>
                    <div className="tm__logo">
                        <svg viewBox="0 0 44 24" fill="none"><path d="M4 20L14 8l10 12" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/><path d="M18 20L28 8l10 12" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </div>
                    <div className="tm__logo tm__logo--wordmark tm__logo--lower">
                        <svg viewBox="0 0 18 18" fill="none"><path d="M9 1l7.5 4.5v7L9 17l-7.5-4.5v-7L9 1z" stroke="#999" strokeWidth="1.2"/><circle cx="9" cy="9" r="2" stroke="#999" strokeWidth="1"/></svg>
                        <span>constructionline</span>
                    </div>
                </div>
            </div>

            {/* Badge */}
            <div className="tm__badge-wrap">
                <div className="tm__badge">
                    WE'RE PROUD TO WORK WITH BEST-IN-CLASS CLIENTS
                </div>
            </div>
        </section>
    );
};

export default Team;
