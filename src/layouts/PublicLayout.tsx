import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { FaWhatsapp } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ChatWidget from '../components/ChatWidget';
import type { Profile } from '../services/profileService';

interface PublicLayoutProps {
    profile: Profile | null;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ profile }) => {
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            setScrollProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="flex flex-col min-h-screen">
            <div className="scroll-progress">
                <div className="scroll-progress__fill" style={{ transform: `scaleX(${scrollProgress})`, transformOrigin: 'left center' }} />
            </div>
            <Navbar />
            <main className="flex-grow">
                <Outlet context={{ profile }} />
            </main>
            <a
                href="https://wa.me/250787832490"
                target="_blank"
                rel="noopener noreferrer"
                title="Chat on WhatsApp"
                style={{
                    position: 'fixed',
                    bottom: '6rem',
                    right: '2rem',
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
