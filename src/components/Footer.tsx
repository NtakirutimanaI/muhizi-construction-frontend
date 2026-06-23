import { useState } from 'react';
import { FaLinkedin, FaFacebook, FaInstagram, FaArrowUp, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';
import type { Profile } from '../services/profileService';
import { subscriberService } from '../services/subscriberService';

interface FooterProps {
    profile: Profile;
}

const Footer: React.FC<FooterProps> = ({ profile }) => {
    const [email, setEmail] = useState('');
    const [subscribing, setSubscribing] = useState(false);
    const [subscribeMsg, setSubscribeMsg] = useState('');

    const footerContent = profile.pageContent?.footer;
    const companyDesc = footerContent?.companyDescription || profile.about?.split('.')[0] || 'Construction & Real Estate';
    const copyright = footerContent?.copyrightText || `© ${new Date().getFullYear()}. By ${profile.firstName} ${profile.lastName}`;
    const quickLinks = footerContent?.quickLinks;
    const servicesList = footerContent?.servicesList;

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setSubscribing(true);
        setSubscribeMsg('');
        try {
            await subscriberService.subscribe({ email: email.trim(), source: 'footer' });
            setSubscribeMsg('Subscribed successfully!');
            setEmail('');
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Subscription failed. Try again.';
            setSubscribeMsg(msg);
        } finally {
            setSubscribing(false);
            setTimeout(() => setSubscribeMsg(''), 5000);
        }
    };

    return (
        <footer data-nav-theme="dark" className="ark-footer">
            <div className="container">
                <div className="ark-footer__inner">
                    <div className="ark-footer__grid">
                        {/* Brand / About */}
                        <div className="ark-footer__col">
                            <a href="/"><img src={profile.companyLogo || '/logo.jpeg'} alt={profile.company || 'Logo'} style={{ height: 70, marginBottom: '0.75rem', borderRadius: '50%', background: '#fff', padding: '8px', marginLeft: '40px' }} /></a>
                            {profile.company && <h4 className="ark-footer__col-title">{profile.company}</h4>}
                            <p style={{ fontSize: '0.9rem', color: 'rgba(243,241,241,0.6)', lineHeight: '1.6', margin: '0 0 0.75rem', maxWidth: '22ch' }}>
                                {companyDesc}
                            </p>
                            {footerContent?.showSocialLinks !== false && (
                                <div className="ark-footer__social">
                                    <a href={profile.socialLinks?.linkedin || 'https://linkedin.com/company/muhizi-construction'} target="_blank" rel="noopener noreferrer" className="ark-footer__social-link"><FaLinkedin /></a>
                                    <a href={profile.socialLinks?.facebook || 'https://facebook.com/muhiziconstruction'} target="_blank" rel="noopener noreferrer" className="ark-footer__social-link"><FaFacebook /></a>
                                    <a href={profile.socialLinks?.instagram || 'https://instagram.com/muhizi_construction'} target="_blank" rel="noopener noreferrer" className="ark-footer__social-link"><FaInstagram /></a>
                                </div>
                            )}
                        </div>

                        {/* Quick Links */}
                        <div className="ark-footer__col">
                            <h4 className="ark-footer__col-title">Quick Links</h4>
                            {quickLinks && quickLinks.length > 0 ? quickLinks.map((link, i) => (
                                <a key={i} href={link.url} className="ark-footer__nav-link">{link.label}</a>
                            )) : (
                                <>
                                    <a href="/#home" className="ark-footer__nav-link">Home</a>
                                    <a href="/#resume" className="ark-footer__nav-link">About</a>
                                    <a href="/#offerings" className="ark-footer__nav-link">Services</a>
                                    <a href="/#projects" className="ark-footer__nav-link">Projects</a>
                                    <a href="/#team" className="ark-footer__nav-link">Team</a>
                                    <a href="/#contact" className="ark-footer__nav-link">Contact</a>
                                </>
                            )}
                        </div>

                        {/* Services */}
                        <div className="ark-footer__col">
                            <h4 className="ark-footer__col-title">Services</h4>
                            {servicesList && servicesList.length > 0 ? servicesList.map((s, i) => (
                                <span key={i} className="ark-footer__link">{s.label}</span>
                            )) : (
                                <>
                                    <span className="ark-footer__link">Building Construction</span>
                                    <span className="ark-footer__link">Road Construction</span>
                                    <span className="ark-footer__link">Real Estate</span>
                                    <span className="ark-footer__link">Property Management</span>
                                    <span className="ark-footer__link">Architectural Design</span>
                                </>
                            )}
                        </div>

                        {/* Contact & Map */}
                        <div className="ark-footer__col">
                            <h4 className="ark-footer__col-title">Get in Touch</h4>
                            {footerContent?.showContactInfo !== false && (
                                <>
                                    <a href={`tel:${profile.phone}`} className="ark-footer__phone"><FaPhone size={12} />{profile.phone || '123-456-7890'}</a>
                                    <a href={`mailto:${profile.email}`} className="ark-footer__phone"><FaEnvelope size={12} />{profile.email}</a>
                                    <p className="ark-footer__address"><FaMapMarkerAlt size={12} />{profile.location || 'Kigali, Rwanda'}</p>
                                    <iframe
                                        className="ark-footer__map"
                                        title="Location"
                                        loading="lazy"
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(profile.location || 'Kigali, Rwanda')}&output=embed`}
                                    />
                                </>
                            )}
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
                                <button type="submit" className="ark-footer__subscribe-btn" disabled={subscribing}>{subscribing ? 'Sending...' : 'Subscribe'}</button>
                            </form>
                            {subscribeMsg && (
                                <p style={{
                                    marginTop: '0.5rem',
                                    fontSize: '0.8rem',
                                    color: subscribeMsg.includes('successfully') ? '#22c55e' : '#ef4444',
                                    textAlign: 'center',
                                }}>{subscribeMsg}</p>
                            )}
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="ark-footer__bottom">
                        <p className="ark-footer__copy">{copyright}</p>
                        <p className="ark-footer__copy" style={{ color: 'rgba(243,241,241,0.35)' }}>Powered by <a href="https://mis-frontend-eta.vercel.app" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>MAKE IT SOLUTIONS (MIS)</a></p>
                    </div>
                </div>
            </div>

            {/* Back to Top */}
            <button onClick={scrollToTop} className="back-to-top-ark" aria-label="Back to top">
                <FaArrowUp />
            </button>
        </footer>
    );
};

export default Footer;
