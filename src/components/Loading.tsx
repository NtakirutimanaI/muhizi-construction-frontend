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
                    padding: '4px',
                    display: 'inline-flex',
                    marginBottom: '2rem',
                }}
                animate={{ boxShadow: ['0 0 0 0 rgba(123,192,67,0.4)', '0 0 0 12px rgba(123,192,67,0)', '0 0 0 0 rgba(123,192,67,0)'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
                <motion.div
                    style={{
                        width: '160px',
                        height: '160px',
                        borderRadius: '50%',
                        border: '4px solid var(--primary)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <img
                        src="/logo.png"
                        alt="Logo"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            padding: '4px',
                            boxSizing: 'border-box',
                        }}
                    />
                </motion.div>
            </motion.div>
            <motion.div
                style={{
                    width: '220px',
                    height: '4px',
                    background: 'rgba(123,192,67,0.15)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '1rem',
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
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    margin: 0,
                }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
                Welcome to MIS
            </motion.p>
        </div>
    );
};

export default Loading;
