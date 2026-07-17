import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { FaShareAlt, FaTwitter, FaLinkedinIn, FaFacebookF, FaInstagram } from 'react-icons/fa';
import type { Profile } from '../../services/profileService';

const Team = () => {
    const { profile } = useOutletContext<{ profile: Profile | null }>();
    const members = profile?.teamMembers || [];
    const brands = profile?.pageContent?.teamSection?.brands || [];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const getImageUrl = (member: { name: string; imageUrl?: string }) => {
        if (member.imageUrl) return member.imageUrl;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=e8e0d8&color=1B2042&size=400&bold=true`;
    };

    const card1 = members[0];
    const card2 = members[1];
    const miniMembers = members.slice(2, 5);
    const displayMembers = members.length > 0 ? members : [];

    return (
        <section className="team-v2">
            <div className="team-v2__inner">

                {/* Left: Photo cards */}
                <div className="team-v2__photos">
                    {card1 && (
                        <motion.div
                            className="team-v2__photo-card"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <img src={getImageUrl(card1)} alt={card1.name} className="team-v2__photo-img" />
                            <div className="team-v2__name-bar">
                                <div>
                                    <h4>{card1.name}</h4>
                                    <p>{card1.role}</p>
                                </div>
                                <div className="team-v2__share"><FaShareAlt /></div>
                            </div>
                        </motion.div>
                    )}
                    {card2 && (
                        <motion.div
                            className="team-v2__photo-card"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <img src={getImageUrl(card2)} alt={card2.name} className="team-v2__photo-img" />
                            <div className="team-v2__name-bar">
                                <div>
                                    <h4>{card2.name}</h4>
                                    <p>{card2.role}</p>
                                </div>
                                <div className="team-v2__share"><FaShareAlt /></div>
                            </div>
                        </motion.div>
                    )}

                    {/* Social rail floating between cards */}
                    {card1 && card2 && (() => {
                        const links = card1.socialLinks || card2.socialLinks || profile?.socialLinks || {};
                        const rail = [
                            { icon: FaTwitter, href: links.twitter, title: 'Twitter' },
                            { icon: FaLinkedinIn, href: links.linkedin, title: 'LinkedIn' },
                            { icon: FaFacebookF, href: links.facebook, title: 'Facebook' },
                            { icon: FaInstagram, href: links.instagram, title: 'Instagram' },
                        ].filter((s): s is { icon: typeof FaTwitter; href: string; title: string } => Boolean(s.href));
                        if (rail.length === 0) return null;
                        return (
                            <div className="team-v2__social-rail">
                                {rail.map(({ icon: Icon, href, title }, i) => (
                                    <a key={title} href={href} target="_blank" rel="noopener noreferrer" className={`team-v2__social-btn${i === 0 ? ' team-v2__social-btn--active' : ''}`} title={title}><Icon /></a>
                                ))}
                            </div>
                        );
                    })()}
                </div>

                {/* Right: Text content */}
                <motion.div
                    className="team-v2__content"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="team-v2__eyebrow">
                        <span className="team-v2__eyebrow-line"></span>
                        OUR EXPERT MEMBER
                        <span className="team-v2__eyebrow-line"></span>
                    </div>
                    <h2 className="team-v2__heading">You Meet<br />Expert Team</h2>
                    <p className="team-v2__text">
                        Our team of skilled professionals brings decades of combined experience in construction, engineering, and project management to deliver exceptional results.
                    </p>

                    {/* Mini photo grid */}
                    <div className="team-v2__mini-grid">
                        {displayMembers.slice(0, 3).map((m, i) => (
                            <img
                                key={i}
                                src={getImageUrl(m)}
                                alt={m.name}
                                className="team-v2__mini-photo"
                            />
                        ))}
                    </div>
                </motion.div>
            </div>

            {brands.length > 0 && (
                <>
                    {/* Client logos row */}
                    <div className="team-v2__logos">
                        <div className="team-v2__logos-track">
                            {brands.map((brand, i) => (
                                <div key={i} className="team-v2__logo team-v2__logo--wordmark">
                                    {brand.logoUrl && (
                                        <span className="team-v2__logo-icon"><img src={brand.logoUrl} alt={brand.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /></span>
                                    )}
                                    <span>{brand.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Badge pill */}
                    <div className="team-v2__badge-wrap">
                        <div className="team-v2__badge">
                            WE'RE PROUD TO PARTNER WITH BEST-IN-CLASS CLIENTS.
                        </div>
                    </div>
                </>
            )}
        </section>
    );
};

export default Team;
