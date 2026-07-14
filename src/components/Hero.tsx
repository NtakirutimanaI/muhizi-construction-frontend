import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SlideContent {
    title: string;
    body: string;
    color: string;
}

const SlideText: React.FC<{ data: SlideContent }> = ({ data }) => (
    <div className="hero-slide-text">
        <h2 className="hero-slide-title">{data.title}</h2>
        <p className="hero-slide-body">{data.body}</p>
    </div>
);

interface HeroProps {
    slides?: SlideContent[];
    videoUrl?: string;
}

const Hero: React.FC<HeroProps> = ({ slides: propSlides, videoUrl }) => {
    const slides = propSlides || [];
    const [current, setCurrent] = useState(0);
    const autoTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

    const heroBackgrounds = [
        { src: videoUrl || 'https://res.cloudinary.com/dh8e4duii/video/upload/v1783433566/muhizi/hero-construction.mp4' },
        { src: 'https://res.cloudinary.com/dh8e4duii/video/upload/v1783433570/muhizi/hero-architecture.mp4' },
        { src: 'https://res.cloudinary.com/dh8e4duii/video/upload/v1783433574/muhizi/hero-design.mp4' },
    ];
    const [activeVideo, setActiveVideo] = useState(0);

    const next = useCallback(() => {
        setCurrent((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
    }, [slides.length]);

    useEffect(() => {
        if (!slides.length) return;
        autoTimer.current = setInterval(next, 20000);
        return () => clearInterval(autoTimer.current);
    }, [next, slides.length]);

    useEffect(() => {
        const id = setInterval(() => {
            setActiveVideo((prev) => (prev + 1) % heroBackgrounds.length);
        }, 8000);
        return () => clearInterval(id);
    }, [heroBackgrounds.length]);

    return (
        <section data-nav-theme="dark" className="hero" id="home">
            <div className="hero-video-wrap">
                {heroBackgrounds.map((bg, i) => (
                    <video
                        key={bg.src}
                        className={`hero-video-bg ${i === activeVideo ? 'is-active' : ''}`}
                        autoPlay
                        muted
                        loop
                        playsInline
                        poster={i === 0 ? 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80' : undefined}
                    >
                        <source src={bg.src} type="video/mp4" />
                    </video>
                ))}
                <div className="hero-overlay" />
                <div className="container hero-content">
                    <AnimatePresence mode="wait">
                        {slides.length > 0 && <motion.div
                            key={current}
                            className="hero-slide"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <SlideText data={slides[current]} />
                        </motion.div>}
                    </AnimatePresence>
                </div>
            </div>

            <div className="hero-spacer">
            </div>
        </section>
    );
};

export default Hero;
