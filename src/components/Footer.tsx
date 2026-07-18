import { useState } from 'react';
import { FaLinkedin, FaFacebook, FaInstagram, FaTwitter, FaArrowUp, FaMapMarkerAlt, FaPhone, FaEnvelope, FaYoutube } from 'react-icons/fa';
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
    const companyDesc = footerContent?.companyDescription || profile.about?.split('.')[0];
    const copyright = footerContent?.copyrightText || `Copyright © ${new Date().getFullYear()} ${profile.company || 'Muhizi Construction'}. All Rights Reserved`;
    const poweredBy = profile.poweredBy;
    const quickLinks = footerContent?.quickLinks;
    const pageServices = profile.pageContent?.services?.items;
    const aboutCards = profile.pageContent?.aboutSection?.cards;
    const footerServices = footerContent?.servicesList;
    const servicesList = (pageServices && pageServices.length > 0)
        ? pageServices.map(s => ({ label: s.title }))
        : (aboutCards && aboutCards.length > 0)
            ? aboutCards.map(c => ({ label: c.title }))
            : footerServices;

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setSubscribing(true);
        setSubscribeMsg('');
        try {
            await subscriberService.subscribe({ email: email.trim() });
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
            <div className="ark-footer__bg" />
            <span className="ark-footer__watermark">{profile.company || 'MUHIZI'}</span>

            <div className="container ark-footer__container">
                {/* Newsletter */}
                <div className="ark-footer__newsletter">
                    <div className="ark-footer__newsletter-text">
                        <h3 className="ark-footer__newsletter-title">Subscribe Newsletter</h3>
                        <p className="ark-footer__newsletter-sub">Sign up today to get the latest updates &amp; insights</p>
                    </div>
                    <div>
                        <form onSubmit={handleSubscribe} className="ark-footer__subscribe-form">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter Your Email Address..."
                                required
                                className="ark-footer__subscribe-input"
                            />
                            <button type="submit" className="ark-footer__subscribe-btn" disabled={subscribing}>
                                <span className="ark-footer__subscribe-btn-text">{subscribing ? 'Sending...' : 'Subscribe'}</span>
                            </button>
                        </form>
                        {subscribeMsg && (
                            <p className="ark-footer__subscribe-msg" style={{ color: subscribeMsg.includes('successfully') ? '#16A34A' : '#DC2626' }}>
                                {subscribeMsg}
                            </p>
                        )}
                    </div>
                </div>

                <div className="ark-footer__divider" />

                <div className="ark-footer__grid">
                    {/* Brand / About */}
                    <div className="ark-footer__col ark-footer__col--brand">
                        <a href="/" className="ark-footer__brand-link">
                            <img src={profile.companyLogo || '/logo.jpeg'} alt={profile.company || 'Logo'} className="ark-footer__logo" />
                            {profile.company && <span className="ark-footer__brand-name">{profile.company}</span>}
                        </a>
                        <p className="ark-footer__desc">{companyDesc}</p>
                        {footerContent?.showSocialLinks !== false && (
                            <div className="ark-footer__social">
                                <span className="ark-footer__social-label">Follow Us:</span>
                                {profile.socialLinks?.facebook && <a href={profile.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="ark-footer__social-link"><FaFacebook /></a>}
                                {profile.socialLinks?.twitter && <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="ark-footer__social-link"><FaTwitter /></a>}
                                {profile.socialLinks?.instagram && <a href={profile.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="ark-footer__social-link"><FaInstagram /></a>}
                                {profile.socialLinks?.linkedin && <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="ark-footer__social-link"><FaLinkedin /></a>}
                                {profile.socialLinks?.youtube && <a href={profile.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="ark-footer__social-link"><FaYoutube /></a>}
                            </div>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div className="ark-footer__col">
                        {quickLinks && quickLinks.length > 0 ? quickLinks.map((link, i) => (
                            <a key={i} href={link.url} className="ark-footer__nav-link">{link.label}</a>
                        )) : null}
                    </div>

                    {/* Services */}
                    <div className="ark-footer__col">
                        {servicesList && servicesList.length > 0 ? servicesList.map((s, i) => (
                            <span key={i} className="ark-footer__link">{s.label}</span>
                        )) : null}
                    </div>

                    {/* Contact */}
                    <div className="ark-footer__col">
                        {footerContent?.showContactInfo !== false && (
                            <>
                                <a href={`tel:${profile.phone}`} className="ark-footer__nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <FaPhone size={11} />
                                    </span>
                                    {profile.phone}
                                </a>
                                <a href={`mailto:${profile.email}`} className="ark-footer__nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <FaEnvelope size={11} />
                                    </span>
                                    {profile.email}
                                </a>
                                <div style={{ marginTop: '0.75rem', borderRadius: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '220px' }}>
                                    <iframe
                                        src="https://maps.google.com/maps?q=COSMOS+Nyamirambo+Nyarugenge+Kigali+Rwanda&t=&z=15&ie=UTF8&iwloc=&output=embed"
                                        width="100%"
                                        height="130"
                                        style={{ border: 0, display: 'block' }}
                                        allowFullScreen={false}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        title="Our Location"
                                    />
                                </div>
                                <a
                                    href="https://www.google.com/maps/dir/?api=1&destination=COSMOS+Nyamirambo+Nyarugenge+Kigali+Rwanda"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ark-footer__nav-link"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.5rem' }}
                                >
                                    <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <FaMapMarkerAlt size={11} />
                                    </span>
                                    Kigali, Nyamirambo
                                </a>
                            </>
                        )}
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="ark-footer__bottom">
                    <p className="ark-footer__copy">{copyright}</p>
                    <p className="ark-footer__copy ark-footer__copy--muted">
                        Powered by <a href="https://mis-frontend-eta.vercel.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent, #D97706)', textDecoration: 'none' }}>MIS</a>
                    </p>
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
