import { useState, useEffect, useRef, useMemo } from 'react';

const splitChars = (text: string) =>
    text.split('').map((ch, i) => (
        <span key={i} className="nav-char" style={{ animationDelay: `${i * 0.06}s` }}>{ch}</span>
    ));

const Navbar: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [phase, setPhase] = useState(0);
    const navRef = useRef<HTMLElement>(null);

    const thinkChars = useMemo(() => splitChars('Think, Design'), []);
    const buildChars = useMemo(() => splitChars('We Build'), []);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const timers: ReturnType<typeof setTimeout>[] = [];
        const cycle = () => {
            timers.push(setTimeout(() => setPhase(1), 7000));
            timers.push(setTimeout(() => setPhase(2), 9000));
            timers.push(setTimeout(() => setPhase(1), 16000));
            timers.push(setTimeout(() => setPhase(0), 18000));
        };
        cycle();
        const repeat = setInterval(cycle, 18000);
        return () => {
            timers.forEach(clearTimeout);
            clearInterval(repeat);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuOpen && navRef.current && !navRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [menuOpen]);

    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = '';
        }
    }, [menuOpen]);

    const closeMenu = () => setMenuOpen(false);

    return (
        <nav ref={navRef} className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="container">
                <div className="navbar-content">
                    <a href="/" className="nav-brand-tag">
                        <img src="/logo.png" alt="MUHIZI CONSTRUCTION" className="nav-logo" />
                    </a>
                    <span className="nav-center-title">
                        <span className={`nav-title-text ${phase === 0 ? 'fade-in' : 'fade-out'}`}>{thinkChars}</span>
                        <span className={`nav-title-text ${phase === 2 ? 'fade-in' : 'fade-out'}`}>{buildChars}</span>
                    </span>
                    <div className="nav-actions">
                        <a href="/#contact" className="nav-get-in-touch" onClick={closeMenu}>Get in Touch &rarr;</a>
                        <button className="nav-mobile-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
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
                    <div className="nav-mobile-menu">
                        <a href="/#home" className="nav-mobile-link" onClick={closeMenu}>Home</a>
                        <a href="/#about" className="nav-mobile-link" onClick={closeMenu}>About Us</a>
                        <a href="/#projects" className="nav-mobile-link" onClick={closeMenu}>Projects</a>
                        <a href="/#updates" className="nav-mobile-link" onClick={closeMenu}>News</a>
                        <a href="/#events" className="nav-mobile-link" onClick={closeMenu}>Events</a>
                        <a href="/#team" className="nav-mobile-link" onClick={closeMenu}>Our Team</a>
                        <a href="/#contact" className="nav-mobile-link nav-mobile-link--btn" onClick={closeMenu}>Contact Us</a>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
