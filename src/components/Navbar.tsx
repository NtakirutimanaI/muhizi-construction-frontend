import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';

const Navbar: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const closeMobile = () => setMobileOpen(false);

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="container">
                <div className="navbar-content">
                    {/* Left: Brand Tag */}
                    <span className="nav-brand-tag">
                        <span style={{
                            width: '10px', height: '10px', background: 'var(--primary)',
                            borderRadius: '50%', display: 'inline-block', flexShrink: 0,
                        }} />
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.05em', color: 'var(--primary)' }}>
                            Build. Design. Construct.
                        </span>
                    </span>
                    {/* Desktop Navigation Links */}
                    <div className="navbar-links">
                        <a href="/#resume" className="nav-link" onClick={closeMobile}>Company</a>
                        <span className="nav-separator">|</span>
                        <a href="/#offerings" className="nav-link" onClick={closeMobile}>Services</a>
                        <span className="nav-separator">|</span>
                        <a href="/#projects" className="nav-link" onClick={closeMobile}>Projects</a>
                        <span className="nav-separator">|</span>
                        <a href="/#jobs" className="nav-link" onClick={closeMobile}>Careers</a>
                        <span className="nav-separator">|</span>
                        <a href="/#contact" className="nav-btn" onClick={closeMobile}>Get in touch</a>
                        <span className="nav-separator">|</span>
                        <Link to="/login" className="nav-link" onClick={closeMobile} style={{ color: '#7BC043', fontWeight: 600 }}>Login</Link>
                    </div>
                    {/* Mobile Menu Toggle */}
                    <button className="nav-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
                        {mobileOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>
                {/* Mobile Navigation Drawer */}
                {mobileOpen && (
                    <div className="nav-mobile-menu">
                        <a href="/#resume" className="nav-mobile-link" onClick={closeMobile}>Company</a>
                        <a href="/#offerings" className="nav-mobile-link" onClick={closeMobile}>Services</a>
                        <a href="/#projects" className="nav-mobile-link" onClick={closeMobile}>Projects</a>
                        <a href="/#jobs" className="nav-mobile-link" onClick={closeMobile}>Careers</a>
                        <a href="/#contact" className="nav-mobile-link nav-mobile-link--btn" onClick={closeMobile}>Get in touch</a>
                        <Link to="/login" className="nav-mobile-link" onClick={closeMobile} style={{ color: '#7BC043', fontWeight: 600 }}>Login</Link>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
