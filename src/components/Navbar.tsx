import { useState, useEffect, useRef, useCallback } from 'react';
import type { Profile } from '../services/profileService';

interface NavbarProps {
    profile?: Profile | null;
}

const Navbar: React.FC<NavbarProps> = ({ profile }) => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const navRef = useRef<HTMLElement>(null);

    const closeMenu = useCallback(() => setMenuOpen(false), []);

    const scrollToSection = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        const href = e.currentTarget.getAttribute('href');
        if (!href || !href.startsWith('/#')) return;
        const id = href.slice(2);
        const el = document.getElementById(id);
        if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: 'smooth' });
            closeMenu();
        }
    }, [closeMenu]);

    const companyName = profile?.company || '';

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = '';
        }
    }, [menuOpen]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuOpen && navRef.current && !navRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [menuOpen]);

    return (
        <nav ref={navRef} className={`navbar ${scrolled ? 'scrolled' : ''}`}
            onMouseLeave={() => setMenuOpen(false)}
        >
            <div className="container">
                <div className="navbar-content">
                    <a href="/" className="nav-brand-tag">
                        <img src={profile?.companyLogo || profile?.avatar || '/logo.jpeg'} alt={profile?.company || 'Logo'} className="nav-logo" />
                        {companyName && <span className="brand-name">{companyName}</span>}
                    </a>
                    <div className="nav-links-desktop">
                        <a href="/#about" className="nav-links-desktop-link" onClick={scrollToSection}>About Us</a>
                        <a href="/#projects" className="nav-links-desktop-link" onClick={scrollToSection}>Projects</a>
                        <a href="/#news" className="nav-links-desktop-link" onClick={scrollToSection}>News</a>
                        <a href="/#events" className="nav-links-desktop-link" onClick={scrollToSection}>Events</a>
                        <a href="/#team" className="nav-links-desktop-link" onClick={scrollToSection}>Our Team</a>
                    </div>
                    <div className="nav-actions">
                        <a href="/login" className="nav-login-link" onClick={closeMenu}>Log in</a>
                        <a href="/#contact" className="nav-signup-btn" onClick={scrollToSection}>Get in Touch</a>
                        <button className="nav-mobile-toggle" onClick={() => setMenuOpen(true)} aria-label="Toggle menu">
                            {menuOpen ? (
                                <span className="hamburger-close">&times;</span>
                            ) : (
                                <span className="hamburger-lines">
                                    <span></span>
                                    <span></span>
                                </span>
                            )}
                        </button>
                    </div>
                </div>
                {menuOpen && (
                    <div
                        className="nav-mobile-menu"
                        onMouseEnter={() => setMenuOpen(true)}
                        onMouseLeave={() => setMenuOpen(false)}
                    >
                        <a href="/#home" className="nav-mobile-link" onClick={scrollToSection}>Home</a>
                        <a href="/#about" className="nav-mobile-link" onClick={scrollToSection}>About Us</a>
                        <a href="/#projects" className="nav-mobile-link" onClick={scrollToSection}>Projects</a>
                        <a href="/#news" className="nav-mobile-link" onClick={scrollToSection}>News</a>
                        <a href="/#events" className="nav-mobile-link" onClick={scrollToSection}>Events</a>
                        <a href="/#team" className="nav-mobile-link" onClick={scrollToSection}>Our Team</a>
                        <a href="/#contact" className="nav-mobile-link nav-mobile-link--btn" onClick={scrollToSection}>Contact Us</a>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
