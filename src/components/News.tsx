import { motion } from 'framer-motion';
import { FaCalendarAlt, FaNewspaper } from 'react-icons/fa';

interface NewsItem {
    title: string;
    date: string;
    summary: string;
}

interface NewsProps {
    news?: NewsItem[];
}

const News: React.FC<NewsProps> = ({ news }) => {
    return (
        <section data-nav-theme="light" className="section section-indicator" id="news">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.span
                        className="ark-section__sub"
                        style={{ display: 'inline-block', marginLeft: '30px' }}
                        animate={{ x: [-20, 20, -20] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        Latest
                    </motion.span>
                    <h2 className="ark-section__heading">News</h2>
                </motion.div>

                {news && news.length > 0 ? (
                    <div className="events-grid">
                        {news.map((item, i) => (
                            <motion.div
                                key={i}
                                className="event-card"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                            >
                                <div className="event-card-header">
                                    <span className="event-date">
                                        <FaCalendarAlt size={14} />
                                        {item.date}
                                    </span>
                                    <span className="event-location">
                                        <FaNewspaper size={14} />
                                        News
                                    </span>
                                </div>
                                <h3 className="event-card-title">{item.title}</h3>
                                <p className="event-card-desc">{item.summary}</p>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <p style={{ textAlign: 'center', color: '#64748B', fontSize: '1.1rem', marginTop: '2rem' }}>
                        No news articles at the moment. Check back later.
                    </p>
                )}
            </div>
        </section>
    );
};

export default News;
