const WORDS = ['Quality Craftsmanship', 'Home Construction', 'Building Renovation', 'Structural Engineering', 'Architecture And Building', 'Material Recycling', 'Tools And Equipment', 'Building Construction'];

const Marquee: React.FC = () => {
    return (
        <div className="marquee-wrap">
            <style>{`
                .marquee-wrap { overflow: hidden; background: #000; padding: 1rem 0; }
                .marquee-row { display: flex; width: max-content; white-space: nowrap; animation: marquee-bounce 80s ease-in-out infinite alternate; }
                .marquee-item { display: inline-flex; align-items: center; gap: 1.5rem; padding: 0 1.5rem; font-size: 17px; font-weight: 600; font-family: 'Poppins', sans-serif; font-style: normal; color: #fff; letter-spacing: 0.02em; }
                .marquee-dash { color: #D97706; font-size: 1em; }
                @keyframes marquee-bounce {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(calc(-100% + 100vw)); }
                }
            `}</style>
            <div className="marquee-row">
                {WORDS.map((word, i) => (
                    <span key={i} className="marquee-item">
                        {word}
                        <span className="marquee-dash">—</span>
                    </span>
                ))}
            </div>
        </div>
    );
};

export default Marquee;
