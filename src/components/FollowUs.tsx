import { useState, useEffect, useRef, useCallback } from 'react';
import { FaChevronDown, FaChevronUp, FaArrowRight, FaTimes } from 'react-icons/fa';
import type { Profile } from '../services/profileService';

interface FollowUsProps {
    profile: Profile;
}

const extractYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
};

const FollowUs: React.FC<FollowUsProps> = ({ profile }) => {
    const section = profile.pageContent?.followUs;
    const heading = section?.heading || 'We Share Our Work & Vision';
    const videos = section?.videos || [];
    const [showAll, setShowAll] = useState(false);
    const extraRef = useRef<HTMLDivElement>(null);
    const sideRef = useRef<HTMLDivElement>(null);
    const mainRef = useRef<HTMLDivElement>(null);
    const [mainBounce, setMainBounce] = useState(false);
    const [modalVideo, setModalVideo] = useState<{ id: string; title: string } | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const mainVideo = videos[0] || null;
    const sideVideos = videos.slice(1, 3);
    const extraVideos = videos.slice(3);

    const openModal = (videoId: string, title: string) => {
        setModalVideo({ id: videoId, title });
    };

    const closeModal = () => {
        setModalVideo(null);
    };

    useEffect(() => {
        if (!modalVideo) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeModal();
        };
        document.addEventListener('keydown', handleEsc);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [modalVideo]);

    const restartAnimation = useCallback(() => {
        const el = sideRef.current;
        if (!el) return;
        const cards = el.querySelectorAll('.follow-us-video-card--small');
        cards.forEach((card) => {
            const c = card as HTMLElement;
            c.style.animation = 'none';
            void c.offsetHeight;
            c.style.animation = '';
        });
    }, []);

    useEffect(() => {
        const el = sideRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    restartAnimation();
                }
            },
            { threshold: 0.3 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [restartAnimation]);

    useEffect(() => {
        const el = mainRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                setMainBounce(entry.isIntersecting);
            },
            { threshold: 0.4 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const renderCard = (video: { url: string; title?: string; description?: string }, i: number, className: string, extraClass?: string) => {
        const vid = extractYouTubeId(video.url);
        return vid ? (
            <div key={`${vid}-${i}`} className={`follow-us-video-card ${className} ${extraClass || ''}`} onClick={() => openModal(vid, video.title || 'YouTube video')} style={{ cursor: 'pointer' }}>
                <iframe
                    src={`https://www.youtube.com/embed/${vid}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&showinfo=0&disablekb=1&fs=0&iv_load_policy=3&loop=1&playlist=${vid}`}
                    title={video.title || `YouTube video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ pointerEvents: 'none' }}
                />
                <div className="follow-us-video-info">
                    <h3>{video.title || 'YouTube video'}</h3>
                    {video.description && <p>{video.description}</p>}
                </div>
            </div>
        ) : video.url ? (
            <a key={i} href={video.url} target="_blank" rel="noopener noreferrer" className={`follow-us-video-card ${className} follow-us-video-card--placeholder ${extraClass || ''}`}>
                <div className="follow-us-placeholder-inner">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
                </div>
                <div className="follow-us-video-info">
                    <h3>{video.title || 'Watch on YouTube'}</h3>
                </div>
            </a>
        ) : null;
    };

    return (
        <section data-nav-theme="light" className="section projects-v2" id="follow-us">
            <style>{`
                .follow-us-title-animate {
                    position: relative;
                    display: inline-block;
                    padding-bottom: 6px;
                    animation: followUsTitlePulse 3s ease-in-out infinite;
                }
                .follow-us-title-animate::after {
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
                @keyframes followUsTitlePulse {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    50% { transform: translateY(-6px) scale(1.03); opacity: 0.85; }
                    100% { transform: translateY(0) scale(1); opacity: 1; }
                }
            `}</style>
            <div className="container">
                <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                    <span className="follow-us-title-animate" style={{ fontFamily: 'Poppins', fontSize: '36px', fontWeight: 700, color: '#1A1A1A' }}>
                        Follow Us
                    </span>
                </div>
                <h2 className="projects-v2__heading">{heading}</h2>

                {videos.length === 0 ? (
                    <div className="follow-us-empty">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
                        <p>Videos coming soon.</p>
                    </div>
                ) : (
                    <div className="follow-us-grid">
                        <div className="follow-us-main" ref={mainRef}>
                            {mainVideo && renderCard(mainVideo, 0, 'follow-us-video-card--main', mainBounce ? 'follow-us-main-bounce' : '')}
                        </div>

                        <div className="follow-us-side" ref={sideRef}>
                            {sideVideos.map((video, i) => renderCard(video, i, `follow-us-video-card--small bounce-card-${i}`))}
                        </div>

                        {extraVideos.length > 0 && (
                            <button
                                className="follow-us-view-more"
                                onClick={() => setShowAll(prev => !prev)}
                            >
                                {showAll ? <><FaChevronUp /> Show Less</> : <><FaChevronDown /> View More Videos ({extraVideos.length})</>}
                            </button>
                        )}

                        {showAll && extraVideos.length > 0 && (
                            <div className="follow-us-extra" ref={extraRef}>
                                {extraVideos.map((video, i) => renderCard(video, i, 'follow-us-video-card--extra'))}
                            </div>
                        )}

                        {profile.socialLinks?.youtube && (
                            <a
                                href={profile.socialLinks.youtube}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="follow-us-view-more"
                                style={{ textDecoration: 'none', marginTop: '2rem' }}
                            >
                                View More Videos On Our Channel <FaArrowRight size={13} />
                            </a>
                        )}
                    </div>
                )}
            </div>

            {modalVideo && (
                <div className="follow-us-modal-overlay" onClick={closeModal} ref={modalRef}>
                    <div className="follow-us-modal" onClick={e => e.stopPropagation()}>
                        <button className="follow-us-modal-close" onClick={closeModal}>
                            <FaTimes />
                        </button>
                        <div className="follow-us-modal-video">
                            <iframe
                                src={`https://www.youtube.com/embed/${modalVideo.id}?autoplay=1&mute=0&controls=1&modestbranding=1&rel=0&showinfo=0&fs=1&iv_load_policy=3`}
                                title={modalVideo.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                        <div className="follow-us-modal-title">{modalVideo.title}</div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default FollowUs;
