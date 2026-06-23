import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaLaptopCode, FaMobileAlt, FaCloud, FaPaintBrush, FaRocket, FaShieldAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const offerIcons = [FaLaptopCode, FaMobileAlt, FaCloud, FaPaintBrush, FaShieldAlt, FaRocket];

const ImageSlider = ({ color, seed, images }: { color: string; seed: number; images?: string[] }) => {
    const slideImages = images || [];
    const [current, setCurrent] = useState(0);

    const prev = useCallback(() => {
        setCurrent(c => (c === 0 ? slideImages.length - 1 : c - 1));
    }, [slideImages.length]);

    const next = useCallback(() => {
        setCurrent(c => (c === slideImages.length - 1 ? 0 : c + 1));
    }, [slideImages.length]);

    useEffect(() => {
        const timer = setInterval(next, 4000);
        return () => clearInterval(timer);
    }, [next]);

    if (slideImages.length === 0) return null;
    return (
        <div className="offer-card__slider">
            {slideImages.map((src, i) => (
                <div
                    key={i}
                    className="offer-card__slide"
                    style={{
                        backgroundImage: `url(${src}${images && images.length > 0 ? '' : `?random=${seed + i}`})`,
                        opacity: i === current ? 1 : 0,
                        zIndex: i === current ? 1 : 0,
                    }}
                />
            ))}
            <button className="offer-card__slider-btn offer-card__slider-btn--left" onClick={prev} style={{ color }}>
                <FaChevronLeft />
            </button>
            <button className="offer-card__slider-btn offer-card__slider-btn--right" onClick={next} style={{ color }}>
                <FaChevronRight />
            </button>
            <div className="offer-card__slider-dots">
                {slideImages.map((_, i) => (
                    <span
                        key={i}
                        className={`offer-card__slider-dot ${i === current ? 'active' : ''}`}
                        style={i === current ? { background: color } : undefined}
                        onClick={() => setCurrent(i)}
                    />
                ))}
            </div>
        </div>
    );
};

interface WhatWeOfferProps {
    heading?: string;
    subtitle?: string;
    items?: Array<{
        title: string;
        description: string;
        tags: string[];
        color: string;
        images?: string[];
    }>;
}

const WhatWeOffer: React.FC<WhatWeOfferProps> = ({ heading: propHeading, subtitle: propSubtitle, items: propItems }) => {
    const heading = propHeading;
    const subtitle = propSubtitle;
    const offerings = propItems
        ? propItems.map((item, i) => ({ ...item, icon: offerIcons[i % offerIcons.length] }))
        : [];
    if (!offerings.length) return null;
    return (
        <section data-nav-theme="dark" className="section section-indicator section-offer-dark" id="offerings">
            <div className="container">
                    <motion.div
                        style={{ marginBottom: '3rem' }}
                        initial={{ opacity: 0, y: 70 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    >
                        <motion.span
                            className="ark-section__sub"
                            style={{ display: 'inline-block', marginLeft: '90px' }}
                            animate={{ x: [-20, 20, -20] }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            What We Offer
                        </motion.span>
                        <h2 className="ark-section__heading">
                            {heading}
                        </h2>
                        <motion.p
                            style={{
                                maxWidth: '600px', margin: '0 auto', color: '#ffffff',
                                fontSize: '1.05rem', lineHeight: '1.7'
                            }}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                        >
                            {subtitle}
                        </motion.p>
                    </motion.div>

                    <div className="offer-list">
                        {offerings.map((item, index) => {
                            return (
                                <motion.div
                                key={item.title}
                                className={`offer-card offer-card--wide ${index >= 4 ? 'offer-card--centered' : ''} ${index === 1 || index === 2 || index === 5 || index === 6 ? 'offer-card--reverse' : ''}`}
                                initial={{ opacity: 0, x: index % 2 === 0 ? -300 : 300 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ margin: '-80px' }}
                                transition={{ delay: index * 0.12, duration: 0.7, ease: 'easeOut' }}
                                whileHover={{ y: -5, scale: 1.01 }}
                            >
                                <div className="offer-card__split">
                                    <div className="offer-card__image">
                                        <ImageSlider color={item.color} seed={index * 10} images={item.images} />
                                    </div>
                                    <div className="offer-card__content">
                                        <h3 className="offer-card__title">{item.title}</h3>
                                        <p className="offer-card__desc">{item.description}</p>
                                        <a href="#contact" className="offer-card__learn-more">Learn More →</a>
                                        <div className="offer-card__tags">
                                            {item.tags.map(tag => (
                                                <span key={tag} className={`offer-card__tag ${tag === 'Job Portals' ? 'offer-card__tag--jp' : ''}`}>{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                            );
                        })}
                    </div>
            </div>
        </section>
    );
};

export default WhatWeOffer;
