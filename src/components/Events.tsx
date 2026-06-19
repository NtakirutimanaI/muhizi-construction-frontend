import { motion } from 'framer-motion';
import { FaCalendarAlt, FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa';

const events = [
    {
        title: 'Rwanda Construction Expo 2026',
        date: '15 Aug 2026',
        location: 'Kigali Convention Centre',
        description: 'Showcasing our latest projects and innovations in sustainable construction.',
    },
    {
        title: 'Open House - New Development',
        date: '10 Sep 2026',
        location: 'KG 123 Ave, Kigali',
        description: 'Tour our newest residential development and meet the design team.',
    },
    {
        title: 'Industry Workshop',
        date: '05 Oct 2026',
        location: 'MUHIZI CONSTRUCTION HQ',
        description: 'Free workshop on modern construction techniques and project management.',
    },
];

const Events: React.FC = () => {
    return (
        <section className="section section-indicator" id="events">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="ark-section__sub" style={{ display: 'inline-block', marginLeft: '30px' }}>
                        Upcoming
                    </span>
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
