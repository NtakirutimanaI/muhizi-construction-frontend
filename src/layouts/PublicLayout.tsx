import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { FaWhatsapp, FaTools, FaEnvelope, FaPhone } from 'react-icons/fa';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import ChatWidget from '../components/ChatWidget';
import type { Profile } from '../services/profileService';

interface PublicLayoutProps {
    profile: Profile | null;
}

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

const MaintenanceScreen: React.FC<{ profile: Profile }> = ({ profile }) => (
    <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '2rem', background: '#F5F7FA', gap: '1.25rem',
    }}>
        <img src={profile.companyLogo || '/logo.jpeg'} alt={profile.company || 'Logo'} style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }} />
        <FaTools style={{ fontSize: '2rem', color: '#D97706' }} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#111827', margin: 0 }}>
            {profile.company || 'We'}&rsquo;re currently undergoing maintenance
        </h1>
        <p style={{ color: '#64748B', maxWidth: '480px', fontSize: '0.95rem', lineHeight: 1.7 }}>
            We're making some improvements to our site and will be back online shortly. Thank you for your patience.
        </p>
        {(profile.phone || profile.email) && (
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', fontSize: '0.9rem', color: '#111827' }}>
                {profile.phone && <a href={`tel:${profile.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'inherit', textDecoration: 'none' }}><FaPhone /> {profile.phone}</a>}
                {profile.email && <a href={`mailto:${profile.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'inherit', textDecoration: 'none' }}><FaEnvelope /> {profile.email}</a>}
            </div>
        )}
        <Link to="/login" style={{ fontSize: '0.8rem', color: '#94A3B8', textDecoration: 'underline', marginTop: '1rem' }}>Staff Login</Link>
    </div>
);

const PublicLayout: React.FC<PublicLayoutProps> = ({ profile }) => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            setScrollProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isAuthPath = AUTH_PATHS.some(p => location.pathname.startsWith(p));
    const hasToken = !!localStorage.getItem('accessToken');
    if (profile?.maintenanceMode && !hasToken && !isAuthPath) {
        return <MaintenanceScreen profile={profile} />;
    }

    return (
        <div className="flex flex-col min-h-screen public-page">
            <Navbar profile={profile} />
            <div className="scroll-progress">
                <div className="scroll-progress__fill" style={{ transform: `scaleX(${scrollProgress})`, transformOrigin: 'left center' }} />
            </div>
            <main className="flex-grow public-main">
                <Outlet context={{ profile }} />
            </main>
            <a
                href="https://wa.me/250787832490"
                target="_blank"
                rel="noopener noreferrer"
                title="Chat on WhatsApp"
                className="whatsapp-float"
                style={{
                    position: 'fixed',
                    bottom: '6rem',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#25D366',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    zIndex: 999,
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    textDecoration: 'none',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                <FaWhatsapp />
            </a>
            <ChatWidget />
            {profile && <Footer profile={profile} />}
        </div>
    );
};

export default PublicLayout;
