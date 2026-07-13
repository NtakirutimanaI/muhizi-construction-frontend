import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { FaShareAlt, FaDribbble, FaTwitter, FaFacebookF } from 'react-icons/fa';
import type { Profile } from '../../services/profileService';

const Team = () => {
    const { profile } = useOutletContext<{ profile: Profile | null }>();
    const members = profile?.teamMembers || [];

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
                    {card1 && card2 && (
                        <div className="team-v2__social-rail">
                            <a href="#" className="team-v2__social-btn" title="Dribbble"><FaDribbble /></a>
                            <a href="#" className="team-v2__social-btn" title="Twitter"><FaTwitter /></a>
                            <a href="#" className="team-v2__social-btn team-v2__social-btn--active" title="Share"><FaShareAlt /></a>
                            <a href="#" className="team-v2__social-btn" title="Facebook"><FaFacebookF /></a>
                        </div>
                    )}
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

            {/* Client logos row */}
            <div className="team-v2__logos">
                <div className="team-v2__logos-track">
                    {/* Logo 1: Engineer silhouette */}
                    <div className="team-v2__logo">
                        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="20" cy="14" r="7" stroke="#888" strokeWidth="1.5" />
                            <path d="M8 36c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="#888" strokeWidth="1.5" />
                        </svg>
                    </div>
                    {/* Logo 2: GORMLEY CONSTRUCTION */}
                    <div className="team-v2__logo team-v2__logo--wordmark">
                        <svg viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="team-v2__logo-icon">
                            <path d="M12 2L2 10h20L12 2z" stroke="#888" strokeWidth="1.2" />
                            <rect x="8" y="10" width="8" height="6" stroke="#888" strokeWidth="1.2" />
                        </svg>
                        <span>GORMLEY<br /><small>CONSTRUCTION</small></span>
                    </div>
                    {/* Logo 3: WUTAMALAND */}
                    <div className="team-v2__logo team-v2__logo--wordmark">
                        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="team-v2__logo-icon">
                            <rect x="3" y="6" width="14" height="12" stroke="#888" strokeWidth="1.2" />
                            <path d="M10 2L3 6h14L10 2z" stroke="#888" strokeWidth="1.2" />
                        </svg>
                        <span>WUTAMALAND<br /><small>MODERN & LUXURY LIVING</small></span>
                    </div>
                    {/* Logo 4: Double roof swoosh */}
                    <div className="team-v2__logo">
                        <svg viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 20L14 8l10 12" stroke="#888" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M16 20L26 8l10 12" stroke="#888" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>
                    {/* Logo 5: constructionline */}
                    <div className="team-v2__logo team-v2__logo--wordmark team-v2__logo--lowercase">
                        <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="team-v2__logo-icon">
                            <path d="M9 1l7.5 4.5v7L9 17l-7.5-4.5v-7L9 1z" stroke="#888" strokeWidth="1.2" />
                            <circle cx="9" cy="9" r="2" stroke="#888" strokeWidth="1" />
                        </svg>
                        <span>constructionline</span>
                    </div>
                </div>
            </div>

            {/* Badge pill */}
            <div className="team-v2__badge-wrap">
                <div className="team-v2__badge">
                    WE'RE PROUD TO PARTNER WITH BEST-IN-CLASS CLIENTS.
                </div>
            </div>
        </section>
    );
};

export default Team;
