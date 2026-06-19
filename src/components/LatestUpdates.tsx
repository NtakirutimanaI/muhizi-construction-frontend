import { motion } from 'framer-motion';

const updates = [
    {
        title: 'New Residential Development Completed',
        excerpt: 'MUHIZI CONSTRUCTION has completed a modern residential estate in Kigali featuring 50 luxury homes with modern infrastructure and green spaces.',
        date: 'June 12, 2026',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000',
    },
    {
        title: 'Major Road Infrastructure Project Launch',
        excerpt: 'We have been awarded a major contract for the construction of 25 km of urban roads, including drainage systems, street lighting, and pedestrian walkways.',
        date: 'May 28, 2026',
        image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=1000',
    },
    {
        title: 'Commercial Complex Grand Opening',
        excerpt: 'Our latest commercial plaza development in downtown Kigali is now open, featuring retail spaces, offices, and a modern food court.',
        date: 'May 15, 2026',
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000',
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const LatestUpdates: React.FC = () => {
    return (
        <section className="section latest-updates" id="updates">
            <div className="container">
                <span className="ark-section__sub" style={{ display: 'inline-block', marginLeft: '30px', color: '#111' }}>
                    Stay Informed
                </span>
                <h2 className="ark-section__heading" style={{ color: '#111' }}>Latest Updates</h2>

                <motion.div
                    className="latest-updates__grid"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {updates.map((item, index) => (
                        <motion.article key={index} className="latest-updates__card" variants={cardVariants}>
                            <div className="latest-updates__card-image">
                                <img src={item.image} alt={item.title} loading="lazy" />
                            </div>
                            <div className="latest-updates__card-body">
                                <span className="latest-updates__date">{item.date}</span>
                                <h3 className="latest-updates__card-title">{item.title}</h3>
                                <p className="latest-updates__excerpt">{item.excerpt}</p>
                                <a href="#contact" className="latest-updates__link">
                                    Read More
                                </a>
                            </div>
                        </motion.article>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default LatestUpdates;
