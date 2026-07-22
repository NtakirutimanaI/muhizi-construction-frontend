import { useState, useEffect, useCallback, useRef } from 'react';
import type { Profile } from '../services/profileService';

const ALL_CAROUSEL_IMAGES = [
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1513828583688-c52646db42da?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1486718448742-163732cd1544?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1590725140304-d9f374440a20?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7c55b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
];

const CARD_DATA = [
    {
        title: 'Built for Long-Term Value',
        description: 'Every project we deliver is built with quality materials and vision, designed to last for generations.',
        tags: ['Residential', 'Commercial', 'Apartments'],
    },
    {
        title: 'Client-Focused Delivery',
        description: 'We prioritize clear communication and transparency, making your construction journey smooth and stress-free.',
        tags: ['Residential', 'Commercial', 'Apartments'],
    },
    {
        title: 'Hassle-Free Process',
        description: 'Our project managers guide you through every step with clear timelines, updates, and dedicated support.',
        tags: ['Residential', 'Commercial', 'Apartments'],
    },
    {
        title: 'Quality Craftsmanship',
        description: 'From foundation to finish, our skilled artisans ensure every detail meets the highest standards of excellence.',
        tags: ['Residential', 'Commercial', 'Apartments'],
    },
    {
        title: 'On-Time Completion',
        description: 'We deliver projects on schedule without compromising quality, keeping your investment on track every time.',
        tags: ['Residential', 'Commercial', 'Apartments'],
    },
];

const CommitmentCard: React.FC<{ images: string[]; title: string; description: string; tags: string[]; reversed?: boolean }> = ({ images, title, description, tags, reversed }) => {
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState<'left' | 'right'>('right');
    const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
    const cardRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const node = cardRef.current;
        if (!node) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { threshold: 0.5, rootMargin: '-25% 0px -25% 0px' }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    const next = useCallback(() => {
        const dir = Math.random() > 0.5 ? 'left' : 'right';
        setDirection(dir);
        setCurrent((prev) => (prev + 1) % images.length);
    }, [images.length]);

    useEffect(() => {
        timerRef.current = setInterval(next, 4000);
        return () => clearInterval(timerRef.current);
    }, [next]);

    const imageBlock = (
        <div style={{ flex: '0 0 50%', position: 'relative' }}>
            <div className="commitment-carousel">
                {images.map((src, i) => {
                    let className = 'commitment-carousel__slide';
                    if (i === current) {
                        className += ' commitment-carousel__slide--active';
                    } else {
                        className += direction === 'right'
                            ? ' commitment-carousel__slide--exit-left'
                            : ' commitment-carousel__slide--exit-right';
                    }
                    return (
                        <img
                            key={i}
                            src={src}
                            alt={`Commitment ${i + 1}`}
                            className={className}
                        />
                    );
                })}
                <div className="commitment-carousel__overlay">
                    <p>Quality you can trust<br/>Built to last generations<br/>Delivered with integrity</p>
                </div>
            </div>
        </div>
    );

    const textBlock = (
        <div style={{ flex: '1', padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ fontFamily: 'Poppins', color: '#FFFFFF', fontSize: '22px', fontWeight: 600, fontStyle: 'normal', margin: '0 0 1rem', lineHeight: 1.3, textDecoration: 'none' }}>
                    {title}
                </h3>
                <div style={{ height: '1px', background: '#444', margin: '0 0 1.2rem' }} />
                <p style={{ fontFamily: 'Poppins', color: '#BBBBBB', fontSize: '17px', fontWeight: 400, fontStyle: 'normal', lineHeight: 1.7, margin: '0 0 1.5rem', textDecoration: 'none' }}>
                    {description}
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'nowrap' }}>
                    {tags.map((tag) => (
                        <div key={tag} style={{
                            flex: '1 1 0',
                            minWidth: 0,
                            background: '#31353A',
                            borderRadius: '0',
                            padding: '0.5rem 1rem',
                            textAlign: 'center',
                            border: '4px solid #444',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                            cursor: 'default',
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(15,18,34,0.1)'; e.currentTarget.style.borderColor = '#fff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#444'; }}
                        >
                            <div style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600, color: '#FFFFFF', textDecoration: 'none' }}>{tag}</div>
                        </div>
                    ))}
                </div>
            </div>
    );

    return (
        <div
            ref={cardRef}
            className="commitment-main-card"
            style={{
                display: 'flex',
                maxWidth: '1390px',
                margin: '0 auto 60px',
                background: 'transparent',
                borderRadius: '5px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(15,18,34,0.08)',
                minHeight: '420px',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(60px)',
                transition: 'opacity 0.8s ease, transform 0.8s ease',
            }}
        >
            {reversed ? <>{textBlock}{imageBlock}</> : <>{imageBlock}{textBlock}</>}
        </div>
    );
};

interface CommitmentProps {
    profile?: Profile | null;
}

const Commitment: React.FC<CommitmentProps> = ({ profile }) => {
    return (
        <section data-nav-theme="dark" className="section section-indicator" id="commitment" style={{ background: '#31353A', position: 'relative', overflow: 'hidden', textDecoration: 'none' }}>
            <style>{`
                .commitment-carousel { position: relative; width: 100%; height: 100%; overflow: hidden; cursor: pointer; }
                .commitment-carousel__overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; opacity: 0; transition: opacity 0.4s ease; z-index: 2; padding: 2rem; }
                .commitment-carousel:hover .commitment-carousel__overlay { opacity: 1; }
                .commitment-carousel__overlay p { font-family: 'Poppins'; color: #fff; font-size: 17px; font-weight: 400; font-style: normal; text-align: center; line: 1.55; }
                .commitment-carousel__slide { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s ease-in-out, opacity 0.8s ease-in-out; }
                .commitment-carousel__slide--enter-right { transform: translateX(100%); opacity: 0; }
                .commitment-carousel__slide--enter-left { transform: translateX(-100%); opacity: 0; }
                .commitment-carousel__slide--active { transform: translateX(0); opacity: 1; z-index: 1; }
                .commitment-carousel__slide--exit-right { transform: translateX(100%); opacity: 0; }
                .commitment-carousel__slide--exit-left { transform: translateX(-100%); opacity: 0; }
                #commitment h3, #commitment p, #commitment a { text-decoration: none !important; }
                .commitment-main-card { transition: transform 0.3s ease, border 0.3s ease; border: 4px solid #444; margin-bottom: 20px; }
                .commitment-main-card:last-child { margin-bottom: 0; }
                .commitment-main-card:hover { animation: commitment-bounce 0.5s ease; border: 4px solid #fff; }
                @keyframes commitment-bounce {
                    0% { transform: translateY(0) scale(1); }
                    30% { transform: translateY(-15px) scale(1.02); }
                    50% { transform: translateY(0) scale(1); }
                    70% { transform: translateY(-8px) scale(1.01); }
                    100% { transform: translateY(0) scale(1); }
                }
                .commitment-title-animate {
                    position: relative;
                    display: inline-block;
                    padding-bottom: 6px;
                    animation: commitmentTitlePulse 3s ease-in-out infinite;
                }
                .commitment-title-animate::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 60px;
                    height: 3px;
                    background: #B27340;
                    border-radius: 2px;
                }
                @keyframes commitmentTitlePulse {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    50% { transform: translateY(-6px) scale(1.03); opacity: 0.85; }
                    100% { transform: translateY(0) scale(1); opacity: 1; }
                }
            `}</style>
            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto 3rem' }}>
                    <div style={{ marginBottom: '0.75rem', marginLeft: '-20px' }}>
                        <span className="commitment-title-animate" style={{ fontFamily: 'Poppins', fontSize: '36px', fontWeight: 700, fontStyle: 'normal', color: '#FFFFFF' }}>
                            What We Offer
                        </span>
                    </div>
                    <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto' }}>
                        <h3 style={{ fontFamily: 'Poppins', color: '#FFFFFF', fontSize: '22px', fontWeight: 600, fontStyle: 'normal', margin: '0 0 0.75rem', lineHeight: 1.3, textDecoration: 'none' }}>
                            What Makes Us Different
                        </h3>
                        <p style={{ fontFamily: 'Poppins', color: '#BBBBBB', fontSize: '17px', fontWeight: 400, fontStyle: 'normal', lineHeight: 1.7, margin: 0, textDecoration: 'none' }}>
                            It's not just about constructing buildings; it's about engineering trust, safety, and lasting value into every project we deliver.
                        </p>
                    </div>
                </div>

                {CARD_DATA.map((card, i) => (
                    <CommitmentCard
                        key={i}
                        images={ALL_CAROUSEL_IMAGES.slice(i * 3, i * 3 + 3)}
                        title={card.title}
                        description={card.description}
                        tags={card.tags}
                        reversed={i === 1 || i === 3}
                    />
                ))}
            </div>
        </section>
    );
};

export default Commitment;
