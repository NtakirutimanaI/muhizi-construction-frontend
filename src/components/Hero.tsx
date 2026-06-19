import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import type { Profile } from '../services/profileService';
import CountUp from './CountUp';

interface HeroProps {
    profile: Profile;
}

interface SlideContent {
    title: string;
    body: string;
    color: string;
}

const writingLines: SlideContent[] = [
    {
        color: '#7BC043',
        title: 'CONSTRUCTION SERVICES',
        body: 'End-to-end construction services including building, road, and infrastructure development — delivering quality projects that stand the test of time.',
    },
    {
        color: '#ff5252',
        title: 'REAL ESTATE',
        body: 'Comprehensive real estate development and property management services — from land acquisition and planning to leasing and facility management.',
    },
    {
        color: '#4ecdc4',
        title: 'ARCHITECTURAL DESIGN',
        body: 'Innovative architectural and interior design solutions that blend functionality with aesthetics, creating spaces that inspire and endure.',
    },
    {
        color: '#2d2d2d',
        title: 'PROJECT MANAGEMENT',
        body: 'Professional project management for construction and development projects — ensuring timely delivery, budget compliance, and superior quality standards.',
    },
];

const sideSlides: SlideContent[] = [
    {
        color: '#7BC043',
        title: 'ABOUT US',
        body: 'We are a premier construction and real estate company dedicated to building exceptional structures and communities. Our expertise spans residential, commercial, and infrastructure projects across Rwanda.',
    },
    {
        color: '#4ecdc4',
        title: 'OUR MISSION',
        body: 'To transform landscapes and lives through quality construction, innovative design, and sustainable development practices that exceed client expectations.',
    },
    {
        color: '#ff9f43',
        title: 'VISION & VALUES',
        body: 'Integrity, quality, and excellence drive everything we do. We believe in building lasting partnerships through transparency, craftsmanship, and a relentless commitment to delivering the highest standards.',
    },
];

const SlideText: React.FC<{ data: SlideContent }> = ({ data }) => (
    <div className="hero-slide-text">
        <h2 className="hero-slide-title">{data.title}</h2>
        <p className="hero-slide-body">{data.body}</p>
    </div>
);

const slides = [
    { data: writingLines[0], bg: 'https://picsum.photos/seed/heromain1/800/420' },
    { data: writingLines[1], bg: 'https://picsum.photos/seed/heromain2/800/420' },
    { data: writingLines[2], bg: 'https://picsum.photos/seed/heromain3/800/420' },
    { data: writingLines[3], bg: 'https://picsum.photos/seed/heromain4/800/420' },
    { data: sideSlides[0], bg: 'https://picsum.photos/seed/heroside2/800/420' },
    { data: sideSlides[1], bg: 'https://picsum.photos/seed/heroside3/800/420' },
    { data: sideSlides[2], bg: 'https://picsum.photos/seed/heroside4/800/420' },
];


const Hero: React.FC<HeroProps> = ({ profile }) => {
    const [current, setCurrent] = useState(0);
    const [hoveredCard, setHoveredCard] = useState<number | null>(null);
    const [showNav, setShowNav] = useState(false);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const autoTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

    const showNavTemporarily = useCallback(() => {
        setShowNav(true);
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setShowNav(false), 3000);
    }, []);

    const handleMouseLeave = useCallback(() => {
        clearTimeout(hideTimer.current);
        setShowNav(false);
    }, []);

    useEffect(() => {
        return () => clearTimeout(hideTimer.current);
    }, []);

    const next = useCallback(() => {
        setCurrent((prev) => (prev < 3 ? prev + 1 : 0));
    }, []);

    const prev = useCallback(() => {
        setCurrent((prev) => (prev > 0 ? prev - 1 : 3));
    }, []);

    useEffect(() => {
        autoTimer.current = setInterval(next, 12000);
        return () => clearInterval(autoTimer.current);
    }, [next]);

    const sideCardEnter = useCallback((index: number) => {
        setHoveredCard(index);
        clearInterval(autoTimer.current);
    }, []);

    const sideCardLeave = useCallback(() => {
        setHoveredCard(null);
        autoTimer.current = setInterval(next, 12000);
    }, [next]);

    const displayIndex = hoveredCard !== null ? hoveredCard : current;

    const handlePrev = useCallback(() => {
        prev();
        setHoveredCard(null);
        clearInterval(autoTimer.current);
        autoTimer.current = setInterval(next, 12000);
    }, [prev, next]);

    const handleNext = useCallback(() => {
        next();
        setHoveredCard(null);
        clearInterval(autoTimer.current);
        autoTimer.current = setInterval(next, 12000);
    }, [next]);

    return (
        <section
            className={`hero section${showNav ? ' show-nav' : ''}`}
            id="home"
            onMouseMove={showNavTemporarily}
            onMouseLeave={handleMouseLeave}
        >
            <div className="container">
                <div className="hero-grid">
                    {/* Left: Logo */}
                    <div className="hero-left-col">
                        <div className="hero-avatar-container">
                            {profile.avatar ? (
                                <img src={profile.avatar} alt="Profile" className="hero-avatar" />
                            ) : (
                                <div className="hero-avatar hero-avatar-placeholder">
                                    {profile.firstName[0]}{profile.lastName[0]}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats (independent) */}
                    <div className="hero-stats">
                        <div className="hero-stat">
                            <span className="hero-stat__value"><CountUp to={profile.yearsOfExperience || 0} suffix="+" /></span>
                            <span className="hero-stat__label">Years of Experience</span>
                        </div>
                        <div className="hero-stat">
                            <span className="hero-stat__value"><CountUp to={profile.projects?.length || 0} suffix="+" /></span>
                            <span className="hero-stat__label">Projects Completed</span>
                        </div>
                        <div className="hero-stat">
                            <span className="hero-stat__value"><CountUp to={profile.teamMembers?.length || 0} suffix="+" /></span>
                            <span className="hero-stat__label">Team Members</span>
                        </div>
                        <a href="/#offerings" className="hero-get-started">Get Started →</a>
                    </div>

                    {/* Right: Image Slider */}
                    <div className="hero-slider">
                        <div className="hero-slider-inner">
                            <div className="hero-slider-viewport">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={displayIndex}
                                        className="hero-slide"
                                        style={{ backgroundImage: `url(${slides[displayIndex].bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="hero-slide-overlay" />
                                        <SlideText data={slides[displayIndex].data} />
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                            <div
                                className={`hero-side-card ${hoveredCard === 4 ? 'active' : ''}`}
                                style={{ backgroundImage: 'url(https://picsum.photos/seed/heroside2/100/800)', backgroundSize: 'cover', backgroundPosition: 'center' }}
                                onMouseEnter={() => sideCardEnter(4)}
                                onMouseLeave={sideCardLeave}
                            >
                                <span className="hero-side-card__label">About us</span>
                            </div>
                            <div
                                className={`hero-side-card ${hoveredCard === 5 ? 'active' : ''}`}
                                style={{ backgroundImage: 'url(https://picsum.photos/seed/heroside3/100/800)', backgroundSize: 'cover', backgroundPosition: 'center' }}
                                onMouseEnter={() => sideCardEnter(5)}
                                onMouseLeave={sideCardLeave}
                            >
                                <span className="hero-side-card__label">Our Mission</span>
                            </div>
                            <div
                                className={`hero-side-card ${hoveredCard === 6 ? 'active' : ''}`}
                                style={{ backgroundImage: 'url(https://picsum.photos/seed/heroside4/100/800)', backgroundSize: 'cover', backgroundPosition: 'center' }}
                                onMouseEnter={() => sideCardEnter(6)}
                                onMouseLeave={sideCardLeave}
                            >
                                <span className="hero-side-card__label">Vision & Values</span>
                            </div>
                        </div>

                        <div className="hero-slider-nav">
                            <button className="hero-slider-arrow" onClick={handlePrev} aria-label="Previous">
                                <FaChevronLeft />
                            </button>
                            <div className="hero-slider-dots">
                                {slides.slice(0, 4).map((_, i) => (
                                    <span
                                        key={i}
                                        className={`hero-slider-dot ${i === displayIndex ? 'active' : ''}`}
                                        onClick={() => { setCurrent(i); setHoveredCard(null); }}
                                    />
                                ))}
                            </div>
                            <button className="hero-slider-arrow" onClick={handleNext} aria-label="Next">
                                <FaChevronRight />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
