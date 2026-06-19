import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import type { Profile } from '../services/profileService';

interface StatsProps {
    profile: Profile;
}

function CountUp({ value, suffix, duration = 2000 }: { value: number; suffix: string; duration?: number }) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });
    const [display, setDisplay] = useState(1);

    useEffect(() => {
        if (!inView) return;
        const start = performance.now();
        let raf: number;

        const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.max(1, Math.floor(progress * (value - 1) + 1));
            setDisplay(current);
            if (progress < 1) {
                raf = requestAnimationFrame(animate);
            } else {
                setDisplay(value);
            }
        };

        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [inView, value, duration]);

    return <span ref={ref}>{display}{suffix}</span>;
}

const Stats: React.FC<StatsProps> = ({ profile }) => {
    const items = [
        { value: profile.projects?.length || 0, suffix: '+', label: 'Projects Completed' },
        { value: profile.yearsOfExperience || 0, suffix: '+', label: 'Years Experience' },
        { value: profile.teamMembers?.length || 0, suffix: '+', label: 'Team Members' },
        { value: 98, suffix: '%', label: 'Satisfaction Rate' },
    ];

    return (
        <div className="stats-grid">
            {items.map((item, i) => (
                <motion.div
                    key={i}
                    className="stat-card"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                    <span className="stat-card-value">
                        <CountUp value={item.value} suffix={item.suffix} />
                    </span>
                    <span className="stat-card-label">{item.label}</span>
                </motion.div>
            ))}
        </div>
    );
};

export default Stats;
