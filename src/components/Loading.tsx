import { motion } from 'framer-motion';

const Loading = () => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-body)',
            zIndex: 9999
        }}>
            <motion.div
                style={{
                    borderRadius: '50%',
                    padding: '3px',
                    display: 'inline-flex',
                    marginBottom: '0.75rem',
                }}
                animate={{ boxShadow: ['0 0 0 0 rgba(123,192,67,0.4)', '0 0 0 6px rgba(123,192,67,0)', '0 0 0 0 rgba(123,192,67,0)'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
                <motion.div
                    style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        border: '2px solid var(--primary)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <img
                        src="/logo.jpeg"
                        alt="Logo"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                </motion.div>
            </motion.div>
            <motion.div
                style={{
                    width: '120px',
                    height: '3px',
                    background: 'rgba(123,192,67,0.15)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '0.5rem',
                }}
            >
                <motion.div
                    style={{
                        height: '100%',
                        background: 'var(--primary)',
                        borderRadius: '4px',
                    }}
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                />
            </motion.div>
            <motion.p
                style={{
                    color: 'var(--primary)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    margin: 0,
                    textAlign: 'center',
                    lineHeight: '1.5',
                }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
                MUHIZI DESIGNING & CONSTRUCTION<br />Most Welcome!
            </motion.p>
        </div>
    );
};

export default Loading;
