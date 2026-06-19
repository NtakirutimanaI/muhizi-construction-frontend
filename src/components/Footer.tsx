import { useState, useEffect } from 'react';
import { FaLinkedin, FaTwitter, FaGithub, FaArrowUp, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';
import type { Profile } from '../services/profileService';

interface FooterProps {
    profile: Profile;
}

const Footer: React.FC<FooterProps> = ({ profile }) => {
    const [showScroll, setShowScroll] = useState(false);
    const [email, setEmail] = useState('');

    useEffect(() => {
        const checkScroll = () => {
            if (!showScroll && window.pageYOffset > 400) {
                setShowScroll(true);
            } else if (showScroll && window.pageYOffset <= 400) {
                setShowScroll(false);
            }
        };
        window.addEventListener('scroll', checkScroll);
        return () => window.removeEventListener('scroll', checkScroll);
    }, [showScroll]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) {
            alert('Thank you for subscribing!');
            setEmail('');
        }
    };

    return (
        <footer className="ark-footer">
            <div className="container">
                <div className="ark-footer__inner">
                    <div className="ark-footer__grid">
                        {/* Brand / About */}
                        <div className="ark-footer__col">
                            <a href="/"><img src="/logo.png" alt="MUHIZI CONSTRUCTION" style={{ height: 70, marginBottom: '0.75rem', borderRadius: '50%', background: '#fff', padding: '8px', marginLeft: '40px' }} /></a>
                            <h4 className="ark-footer__col-title">MUHIZI CONSTRUCTION</h4>
                            <p style={{ fontSize: '0.9rem', color: 'rgba(243,241,241,0.6)', lineHeight: '1.6', margin: '0 0 0.75rem', maxWidth: '22ch' }}>
                                {profile.about?.split('.')[0] || 'Construction & Real Estate'}
                            </p>
                            <div className="ark-footer__social">
                                {profile.socialLinks?.linkedin && (
                                    <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="ark-footer__social-link"><FaLinkedin /></a>
                                )}
                                {profile.socialLinks?.twitter && (
                                    <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="ark-footer__social-link"><FaTwitter /></a>
                                )}
                                {profile.socialLinks?.github && (
                                    <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="ark-footer__social-link"><FaGithub /></a>
                                )}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="ark-footer__col">
                            <h4 className="ark-footer__col-title">Quick Links</h4>
                            <a href="/#home" className="ark-footer__nav-link">Home</a>
                            <a href="/#resume" className="ark-footer__nav-link">About</a>
                            <a href="/#offerings" className="ark-footer__nav-link">Services</a>
                            <a href="/#projects" className="ark-footer__nav-link">Projects</a>
                            <a href="/#team" className="ark-footer__nav-link">Team</a>
                            <a href="/#contact" className="ark-footer__nav-link">Contact</a>
                        </div>

                        {/* Services */}
                        <div className="ark-footer__col">
                            <h4 className="ark-footer__col-title">Services</h4>
                            <span className="ark-footer__link">Building Construction</span>
                            <span className="ark-footer__link">Road Construction</span>
                            <span className="ark-footer__link">Real Estate</span>
                            <span className="ark-footer__link">Property Management</span>
                            <span className="ark-footer__link">Architectural Design</span>
                        </div>

                        {/* Contact & Map */}
                        <div className="ark-footer__col">
                            <h4 className="ark-footer__col-title">Get in Touch</h4>
                            <a href={`tel:${profile.phone}`} className="ark-footer__phone"><FaPhone size={12} style={{ marginRight: '6px' }} />{profile.phone || '123-456-7890'}</a>
                            <a href={`mailto:${profile.email}`} className="ark-footer__phone"><FaEnvelope size={12} style={{ marginRight: '6px' }} />{profile.email}</a>
                            {profile.location && (
                                <p className="ark-footer__address"><FaMapMarkerAlt size={12} style={{ marginRight: '6px' }} />{profile.location}</p>
                            )}
                            <iframe
                                className="ark-footer__map"
                                title="Location"
                                loading="lazy"
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(profile.location || 'Kigali, Rwanda')}&output=embed`}
                            />
                        </div>
                    </div>

                    {/* Subscribe */}
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <div className="ark-footer__subscribe" style={{ maxWidth: '28rem', width: '100%' }}>
                            <span className="ark-footer__subscribe-label">Subscribe to our newsletter</span>
                            <form onSubmit={handleSubscribe} className="ark-footer__subscribe-form">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    required
                                    className="ark-footer__subscribe-input"
                                />
                                <button type="submit" className="ark-footer__subscribe-btn">Subscribe</button>
                            </form>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="ark-footer__bottom">
                        <p className="ark-footer__copy">© {new Date().getFullYear()}. By {profile.firstName} {profile.lastName}</p>
                        <p className="ark-footer__copy" style={{ color: 'rgba(243,241,241,0.35)' }}>Powered by <a href="https://mis-frontend-eta.vercel.app" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>MAKE IT SOLUTIONS (MIS)</a></p>
                    </div>
                </div>
            </div>

            {/* Back to Top */}
            {showScroll && (
                <button onClick={scrollToTop} className="back-to-top-ark" aria-label="Back to top">
                    <FaArrowUp />
                </button>
            )}
        </footer>
    );
};

export default Footer;
