import { useState } from 'react';
import { FaShareAlt, FaTwitter, FaInstagram, FaFacebookF, FaLinkedinIn } from 'react-icons/fa';

interface SocialLinks {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
}

interface TeamMemberCardProps {
    image: string;
    name: string;
    position: string;
    socialLinks?: SocialLinks;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ image, name, position, socialLinks = {} }) => {
    const [isHovered, setIsHovered] = useState(false);

    const socialItems = [
        { icon: <FaTwitter />, url: socialLinks.twitter, label: 'Twitter' },
        { icon: <FaInstagram />, url: socialLinks.instagram, label: 'Instagram' },
        { icon: <FaFacebookF />, url: socialLinks.facebook, label: 'Facebook' },
        { icon: <FaLinkedinIn />, url: socialLinks.linkedin, label: 'LinkedIn' },
    ];

    return (
        <div
            className="tm-card"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="tm-card__image-wrap">
                <img src={image} alt={`${name} — ${position}`} className="tm-card__image" />

                {/* Sliding social panel */}
                <div className={`tm-card__social-panel ${isHovered ? 'tm-card__social-panel--visible' : ''}`}>
                    {socialItems.map((item, i) => (
                        <a
                            key={i}
                            href={item.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tm-card__social-icon"
                            aria-label={item.label}
                            title={item.label}
                            tabIndex={isHovered ? 0 : -1}
                        >
                            {item.icon}
                        </a>
                    ))}
                </div>

                {/* Bottom info panel */}
                <div className="tm-card__info">
                    <div className="tm-card__info-text">
                        <h3 className="tm-card__name">{name}</h3>
                        <p className="tm-card__position">{position}</p>
                    </div>
                    <button className="tm-card__share" aria-label={`Share ${name}'s profile`}>
                        <FaShareAlt />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeamMemberCard;
