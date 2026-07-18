import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Profile } from '../services/profileService';

interface NavbarProps {
    profile?: Profile | null;
}

const DARK_BG_ROUTES = ['/vision-mission-values'];

const Navbar: React.FC<NavbarProps> = ({ profile }) => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [navTheme, setNavTheme] = useState<'light' | 'dark'>('dark');
    const navRef = useRef<HTMLElement>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const isDarkBgRoute = DARK_BG_ROUTES.includes(location.pathname);

    const closeMenu = useCallback(() => setMenuOpen(false), []);

    const scrollToSection = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        const href = e.currentTarget.getAttribute('href');
        if (!href || !href.startsWith('/#')) return;
        const id = href.slice(2);
        const el = document.getElementById(id);
        closeMenu();
        if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: 'smooth' });
        } else if (location.pathname !== '/') {
            e.preventDefault();
            navigate('/');
            const tryScroll = (attempts = 0) => {
                const target = document.getElementById(id);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                } else if (attempts < 20) {
                    setTimeout(() => tryScroll(attempts + 1), 100);
                }
            };
            setTimeout(() => tryScroll(), 200);
        }
    }, [closeMenu, location.pathname, navigate]);

    const companyName = profile?.company || '';

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        let ticking = false;
        let probeY = 100;

        // Recomputed only on mount/resize (not per scroll frame) so the hot
        // scroll path avoids an extra forced style recalculation.
        const computeProbeY = () => {
            const navOffset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-offset')) || 90;
            probeY = navOffset + 10;
        };

        const updateTheme = () => {
            ticking = false;
            const sections = document.querySelectorAll<HTMLElement>('[data-nav-theme]');
            let matched: 'light' | 'dark' | null = null;
            sections.forEach((section) => {
                const rect = section.getBoundingClientRect();
                if (rect.top <= probeY && rect.bottom > probeY) {
                    matched = section.getAttribute('data-nav-theme') === 'light' ? 'light' : 'dark';
                }
            });
            // Between sections (e.g. a margin gap) probeY may not overlap anything;
            // keep the previous theme rather than snapping back to a default.
            if (matched) setNavTheme(matched);
        };

        const onScroll = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(updateTheme);
            }
        };

        const onResize = () => {
            computeProbeY();
            updateTheme();
        };

        computeProbeY();
        updateTheme();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
        };
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
        <nav ref={navRef} className={`navbar ${scrolled ? 'scrolled' : ''} navbar--${navTheme} ${isDarkBgRoute && navTheme === 'dark' ? 'navbar--dark-bg' : ''}`}
            onMouseLeave={() => setMenuOpen(false)}
        >
            <div className="container">
                <div className="navbar-content">
                    <a href="/" className="nav-brand-tag">
                        <img src={profile?.companyLogo || '/logo.jpeg'} alt={profile?.company || 'Logo'} className="nav-logo" />
                        {companyName && <span className="brand-name">{companyName}</span>}
                    </a>
                    <div className="nav-links-desktop">
                        <a href="/#about" className="nav-links-desktop-link" onClick={scrollToSection}>About Us</a>
                        <a href="/#projects" className="nav-links-desktop-link" onClick={scrollToSection}>Projects</a>
                        <a href="/#news" className="nav-links-desktop-link" onClick={scrollToSection}>News</a>
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
                        <a href="/#team" className="nav-mobile-link" onClick={scrollToSection}>Our Team</a>
                        <a href="/#contact" className="nav-mobile-link nav-mobile-link--btn" onClick={scrollToSection}>Contact Us</a>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
