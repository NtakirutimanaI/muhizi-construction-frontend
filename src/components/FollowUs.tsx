import { useState, useEffect, useRef, useCallback } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
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

    const mainVideo = videos[0] || null;
    const sideVideos = videos.slice(1, 3);
    const extraVideos = videos.slice(3);
    const mainId = mainVideo ? extractYouTubeId(mainVideo.url) : null;

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

    const renderCard = (video: { url: string; title?: string; description?: string }, i: number, className: string) => {
        const vid = extractYouTubeId(video.url);
        return vid ? (
            <div key={`${vid}-${i}`} className={`follow-us-video-card ${className}`}>
                <iframe
                    src={`https://www.youtube.com/embed/${vid}`}
                    title={video.title || `YouTube video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
                {video.title && (
                    <div className="follow-us-video-info">
                        <h3>{video.title}</h3>
                        {video.description && <p>{video.description}</p>}
                    </div>
                )}
            </div>
        ) : video.url ? (
            <a key={i} href={video.url} target="_blank" rel="noopener noreferrer" className={`follow-us-video-card ${className} follow-us-video-card--placeholder`}>
                <div className="follow-us-placeholder-inner">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
                </div>
                {video.title && (
                    <div className="follow-us-video-info">
                        <h3>{video.title}</h3>
                    </div>
                )}
            </a>
        ) : null;
    };

    return (
        <section data-nav-theme="light" className="section projects-v2" id="follow-us">
            <div className="container">
                <div className="projects-v2__eyebrow">
                    <span className="projects-v2__eyebrow-line" />
                    FOLLOW US
                    <span className="projects-v2__eyebrow-line" />
                </div>
                <h2 className="projects-v2__heading">{heading}</h2>

                {videos.length === 0 ? (
                    <div className="follow-us-empty">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
                        <p>Videos coming soon.</p>
                    </div>
                ) : (
                    <div className="follow-us-grid">
                        <div className="follow-us-main">
                            {mainId ? (
                                <div className="follow-us-video-card follow-us-video-card--main">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${mainId}`}
                                        title={mainVideo!.title || 'YouTube video'}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                    {mainVideo!.title && (
                                        <div className="follow-us-video-info">
                                            <h3>{mainVideo!.title}</h3>
                                            {mainVideo!.description && <p>{mainVideo!.description}</p>}
                                        </div>
                                    )}
                                </div>
                            ) : mainVideo?.url ? (
                                <a href={mainVideo.url} target="_blank" rel="noopener noreferrer" className="follow-us-video-card follow-us-video-card--main follow-us-video-card--placeholder">
                                    <div className="follow-us-placeholder-inner">
                                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
                                        <span>Watch on YouTube</span>
                                    </div>
                                    {mainVideo.title && (
                                        <div className="follow-us-video-info">
                                            <h3>{mainVideo.title}</h3>
                                        </div>
                                    )}
                                </a>
                            ) : null}
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
                    </div>
                )}
            </div>
        </section>
    );
};

export default FollowUs;
