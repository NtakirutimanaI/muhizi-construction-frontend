import { motion } from 'framer-motion';
import { FaCalendarAlt, FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa';

interface EventsProps {
    events?: Array<{ title: string; date: string; location: string; description: string }>;
}

const Events: React.FC<EventsProps> = ({ events: propEvents }) => {
    const events = propEvents;
    if (!events?.length) return null;
    return (
        <section data-nav-theme="light" className="section section-indicator" id="events">
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
                        Upcoming
                    </motion.span>
                    <h2 className="ark-section__heading">Events</h2>
                </motion.div>

                <div className="events-grid">
                    {events.map((event, i) => (
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
                                    {event.date}
                                </span>
                                <span className="event-location">
                                    <FaMapMarkerAlt size={14} />
                                    {event.location}
                                </span>
                            </div>
                            <h3 className="event-card-title">{event.title}</h3>
                            <p className="event-card-desc">{event.description}</p>
                            <a href="/#contact" className="event-card-cta">
                                Register <FaArrowRight size={12} />
                            </a>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Events;
