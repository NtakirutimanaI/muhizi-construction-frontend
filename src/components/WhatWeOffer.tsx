import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaLaptopCode, FaMobileAlt, FaCloud, FaPaintBrush, FaHeadset, FaRocket, FaShieldAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const offerings = [
    {
        icon: FaLaptopCode,
        title: 'Building Construction',
        description: 'High-quality residential, commercial, and industrial building construction using modern techniques and premium materials — delivered on time and within budget.',
        color: '#7BC043',
        tags: ['Residential', 'Commercial', 'Industrial', 'Infrastructure', 'Government', 'Project Management', 'Consultation'],
    },
    {
        icon: FaMobileAlt,
        title: 'Road Construction',
        description: 'Comprehensive road and highway construction services including asphalt paving, earthworks, drainage systems, and bridge construction for public and private sectors.',
        color: '#4ecdc4',
        tags: ['Highways', 'Bridges', 'Asphalt Paving', 'Earthworks', 'Drainage', 'Urban Roads', 'Rural Roads'],
    },
    {
        icon: FaCloud,
        title: 'Real Estate Development',
        description: 'End-to-end real estate development from land acquisition and feasibility studies to design, construction, and property marketing — creating value at every stage.',
        color: '#ff5252',
        tags: ['Land Acquisition', 'Feasibility Studies', 'Design & Build', 'Property Marketing', 'Mixed-Use', 'Residential Estates', 'Commercial Plazas'],
    },
    {
        icon: FaPaintBrush,
        title: 'Property Management',
        description: 'Professional property management services including tenant sourcing, rent collection, maintenance coordination, and 24/7 emergency response for residential and commercial properties.',
        color: '#ff9f43',
        tags: ['Tenant Sourcing', 'Rent Collection', 'Maintenance', 'Emergency Response', 'Commercial Leasing', 'Residential Leasing', 'Facility Management'],
    },
    {
        icon: FaShieldAlt,
        title: 'Architectural Design',
        description: 'Innovative architectural design services from concept to completion — creating functional, sustainable, and aesthetically outstanding buildings and spaces.',
        color: '#fd79a8',
        tags: ['Concept Design', 'Sustainable Architecture', '3D Visualization', 'Structural Planning', 'Interior Design', 'Urban Design', 'Landscaping'],
    },
    {
        icon: FaRocket,
        title: 'Interior & Exterior Finishing',
        description: 'Premium interior and exterior finishing services including painting, flooring, tiling, ceiling installation, façade cladding, and landscaping — adding the perfect final touch.',
        color: '#fdcb6e',
        tags: ['Painting', 'Flooring', 'Tiling', 'Ceiling', 'Façade Cladding', 'Landscaping', 'Joinery'],
    },
    {
        icon: FaHeadset,
        title: 'Renovation & Remodeling',
        description: 'Complete renovation and remodeling solutions for homes, offices, and commercial spaces — transforming outdated structures into modern, functional environments.',
        color: '#74b9ff',
        tags: ['Home Renovation', 'Office Remodeling', 'Commercial Renovation', 'Space Planning', 'Structural Repairs', 'Kitchen & Bathroom', 'Extension'],
    },
];

const slides = [
    'https://picsum.photos/seed/web1/600/400',
    'https://picsum.photos/seed/web2/600/400',
    'https://picsum.photos/seed/web3/600/400',
    'https://picsum.photos/seed/web4/600/400',
];

const ImageSlider = ({ color, seed }: { color: string; seed: number }) => {
    const [current, setCurrent] = useState(0);

    const prev = useCallback(() => {
        setCurrent(c => (c === 0 ? slides.length - 1 : c - 1));
    }, []);

    const next = useCallback(() => {
        setCurrent(c => (c === slides.length - 1 ? 0 : c + 1));
    }, []);

    useEffect(() => {
        const timer = setInterval(next, 4000);
        return () => clearInterval(timer);
    }, [next]);

    return (
        <div className="offer-card__slider">
            {slides.map((base, i) => (
                <div
                    key={i}
                    className="offer-card__slide"
                    style={{
                        backgroundImage: `url(${base}?random=${seed + i})`,
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
                {slides.map((_, i) => (
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

const WhatWeOffer = () => {
    return (
        <section className="section section-indicator section-offer-dark" id="offerings">
            <div className="container">
                    <motion.div
                        style={{ marginBottom: '3rem' }}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    >
                        <span className="ark-section__sub" style={{ display: 'inline-block', marginLeft: '90px' }}>
                            What We Offer
                        </span>
                        <h2 className="ark-section__heading">
                            Core Services
                        </h2>
                        <motion.p
                            style={{
                                maxWidth: '600px', margin: '0 auto', color: 'var(--text-muted)',
                                fontSize: '1.05rem', lineHeight: '1.7'
                            }}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                        >
                            We deliver end-to-end construction and real estate solutions tailored to your needs —
                            from planning and design to execution and project handover.
                        </motion.p>
                    </motion.div>

                    <div className="offer-list">
                        {offerings.map((item, index) => {
                            return (
                                <motion.div
                                key={item.title}
                                className={`offer-card offer-card--wide ${index >= 4 ? 'offer-card--centered' : ''} ${index === 1 || index === 2 || index === 5 || index === 6 ? 'offer-card--reverse' : ''}`}
                                initial={{ opacity: 0, scale: 0.7, y: 40 }}
                                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                viewport={{ margin: '-80px' }}
                                transition={{ delay: index * 0.12, duration: 0.7, ease: 'easeOut' }}
                                whileHover={{ y: -5, scale: 1.01 }}
                            >
                                <div className="offer-card__split">
                                    <div className="offer-card__image">
                                        <ImageSlider color={item.color} seed={index * 10} />
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
