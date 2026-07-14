const BACK_WORDS = ['Quality Craftsmanship', 'Home Construction', 'Building Renovation', 'Structural Engineering'];
const FRONT_WORDS = ['Architecture & Building', 'Material Recycling', 'Tools And Equipment', 'Building Construction'];

const Marquee: React.FC = () => {
    const backItems = [...BACK_WORDS, ...BACK_WORDS];
    const frontItems = [...FRONT_WORDS, ...FRONT_WORDS];

    return (
        <div className="marquee-wrap">
            <style>{`
                .marquee-wrap { position: relative; padding: 3rem 0 4.5rem; overflow: hidden; background: #fff; }
                .marquee-row { display: flex; width: max-content; white-space: nowrap; }
                .marquee-item { display: inline-flex; align-items: center; gap: 1.5rem; padding: 0 1.5rem; }

                .marquee-row--back {
                    font-size: clamp(1.6rem, 3.6vw, 2.6rem);
                    font-weight: 800;
                    text-transform: uppercase;
                    font-family: var(--font-display, inherit);
                    margin-bottom: 1.5rem;
                    animation: marquee-scroll 34s linear infinite;
                }
                .marquee-row--back .solid { color: #111827; }
                .marquee-row--back .hollow { color: transparent; -webkit-text-stroke: 1.5px #DCE3EA; text-stroke: 1.5px #DCE3EA; }
                .marquee-row--back .marquee-star { color: #D97706; font-size: 0.6em; }

                .marquee-ribbon {
                    width: 110%;
                    margin: 0 0 0 -5%;
                    transform: rotate(-3deg);
                    background: #D97706;
                    padding: 1.1rem 0;
                    box-shadow: 0 12px 30px rgba(0,0,0,0.18);
                    overflow: hidden;
                }
                .marquee-row--front {
                    font-size: clamp(0.9rem, 1.6vw, 1.15rem);
                    font-weight: 800;
                    letter-spacing: 0.03em;
                    text-transform: uppercase;
                    color: #fff;
                    animation: marquee-scroll-reverse 22s linear infinite;
                }
                .marquee-row--front .marquee-star { color: #fff; opacity: 0.85; }

                @keyframes marquee-scroll {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }

                @keyframes marquee-scroll-reverse {
                    from { transform: translateX(-50%); }
                    to { transform: translateX(0); }
                }

                @media (max-width: 640px) {
                    .marquee-wrap { padding: 2.25rem 0 3.5rem; }
                }
            `}</style>

            <div className="marquee-row marquee-row--back">
                {backItems.map((word, i) => (
                    <span key={i} className="marquee-item">
                        <span className={i % 2 === 0 ? 'solid' : 'hollow'}>{word}</span>
                        <span className="marquee-star">&#10038;</span>
                    </span>
                ))}
            </div>

            <div className="marquee-ribbon">
                <div className="marquee-row marquee-row--front">
                    {frontItems.map((word, i) => (
                        <span key={i} className="marquee-item">
                            {word}
                            <span className="marquee-star">&#10038;</span>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Marquee;
