import { useState, useEffect, useCallback, useRef } from 'react';
import type { Profile } from '../services/profileService';

const CAROUSEL_IMAGES = [
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1513828583688-c52646db42da?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1486718448742-163732cd1544?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
];

interface CommitmentProps {
    profile?: Profile | null;
}

const Commitment: React.FC<CommitmentProps> = ({ profile }) => {
    const c = profile?.pageContent?.commitment;
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState<'left' | 'right'>('right');
    const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

    const next = useCallback(() => {
        const dir = Math.random() > 0.5 ? 'left' : 'right';
        setDirection(dir);
        setCurrent((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, []);

    useEffect(() => {
        timerRef.current = setInterval(next, 4000);
        return () => clearInterval(timerRef.current);
    }, [next]);

    return (
        <section data-nav-theme="light" className="section section-indicator" id="commitment" style={{ background: '#F5F7FA', position: 'relative', overflow: 'hidden' }}>
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
                .commitment-main-card { transition: transform 0.3s ease, border 0.3s ease; border: 1px solid rgba(15,18,34,0.06); }
                .commitment-main-card:hover { animation: commitment-bounce 0.5s ease; border: 3px solid #fff; }
                @keyframes commitment-bounce {
                    0% { transform: translateY(0) scale(1); }
                    30% { transform: translateY(-15px) scale(1.02); }
                    50% { transform: translateY(0) scale(1); }
                    70% { transform: translateY(-8px) scale(1.01); }
                    100% { transform: translateY(0) scale(1); }
                }
            `}</style>
            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto 3rem' }}>
                    <div style={{ marginBottom: '0.75rem', marginLeft: '-20px' }}>
                        <span style={{ fontFamily: 'Poppins', fontSize: '28px', fontWeight: 700, fontStyle: 'normal', color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span style={{ color: '#999', fontWeight: 400 }}>---</span> Our Commitment <span style={{ color: '#999', fontWeight: 400 }}>---</span>
                        </span>
                    </div>
                    <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto' }}>
                        <h3 style={{ fontFamily: 'Poppins', color: '#1A1A1A', fontSize: '22px', fontWeight: 600, fontStyle: 'normal', margin: '0 0 0.75rem', lineHeight: 1.3 }}>
                            What Makes Us Different
                        </h3>
                        <p style={{ fontFamily: 'Poppins', color: '#555', fontSize: '17px', fontWeight: 400, fontStyle: 'normal', lineHeight: 1.7, margin: 0 }}>
                            It's not just about constructing buildings; it's about engineering trust, safety, and lasting value into every project we deliver.
                        </p>
                    </div>
                </div>

                <div className="commitment-main-card" style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', background: 'transparent', borderRadius: '5px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(15,18,34,0.08)', minHeight: '420px' }}>
                    <div style={{ flex: '0 0 50%', position: 'relative' }}>
                        <div className="commitment-carousel">
                            {CAROUSEL_IMAGES.map((src, i) => {
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
                    <div style={{ flex: '1', padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h3 style={{ fontFamily: 'Poppins', color: '#1A1A1A', fontSize: '22px', fontWeight: 600, fontStyle: 'normal', margin: '0 0 1rem', lineHeight: 1.3 }}>
                            {c?.anchorTitle || 'Client-Focused Delivery'}
                        </h3>
                        <div style={{ height: '1px', background: '#e0e0e0', margin: '0 0 1.2rem' }} />
                        <p style={{ fontFamily: 'Poppins', color: '#555', fontSize: '17px', fontWeight: 400, fontStyle: 'normal', lineHeight: 1.7, margin: 0 }}>
                            {c?.anchorDescription || 'We prioritize clear communication and transparency, making your construction journey smooth and stress-free. Our team is dedicated to delivering projects on time, within budget, and to the highest standards of quality.'}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Commitment;
