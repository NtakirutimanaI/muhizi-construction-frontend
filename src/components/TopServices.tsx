import { motion } from 'framer-motion';

interface TopServicesProps {
    heading?: string;
    subtitle?: string;
    imageUrl?: string;
}

const TopServices: React.FC<TopServicesProps> = ({ heading, subtitle, imageUrl }) => {
    if (!heading && !subtitle && !imageUrl) return null;

    return (
        <section className="section section-top-services" id="top-services">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    style={{ textAlign: 'center', marginBottom: imageUrl ? '2.5rem' : 0 }}
                >
                    {heading && <h2 className="ark-section__heading">{heading}</h2>}
                    {subtitle && (
                        <motion.p
                            style={{ maxWidth: '600px', margin: '1rem auto 0', color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.7' }}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            {subtitle}
                        </motion.p>
                    )}
                </motion.div>
                {imageUrl && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 12px 48px rgba(0,0,0,0.1)' }}
                    >
                        <img src={imageUrl} alt={heading || 'Services'} style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'cover', display: 'block' }} />
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default TopServices;
