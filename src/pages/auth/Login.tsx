import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { motion } from 'framer-motion';
import { FaLock, FaEnvelope, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import { getRolePath } from '../../config/roles';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirect = searchParams.get('redirect') || '/admin';

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const data = await authService.login({ email, password });
            login(data.accessToken, data.user);
            const target = getRolePath(data.user?.role || '');
            navigate(target);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '80px',
            paddingBottom: '3rem',
            background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(/login.png) center/cover fixed`,
            position: 'relative',
            overflow: 'hidden',
        }}>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    padding: '1.5rem',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    style={{
                        background: 'rgba(0,0,0,0.15)',
                        padding: '2.5rem',
                        borderRadius: '0',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{
                            display: 'inline-block',
                            padding: '0.35rem 1rem',
                            border: '1px solid rgba(123,192,67,0.3)',
                            borderRadius: '999px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            color: 'var(--primary)',
                            marginBottom: '1rem',
                        }}>
                            Secure Access
                        </div>
                        <h1 style={{
                            fontSize: '1.75rem',
                            fontWeight: 800,
                            color: '#fff',
                            marginBottom: '0.35rem',
                            letterSpacing: '-0.01em',
                        }}>
                            LOGIN
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                            Sign in to manage your portfolio
                        </p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            style={{
                                background: 'rgba(239,68,68,0.1)',
                                color: '#ef4444',
                                padding: '0.85rem 1rem',
                                borderRadius: '10px',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontSize: '0.85rem',
                                border: '1px solid rgba(239,68,68,0.2)',
                            }}
                        >
                            <span style={{ fontSize: '1rem' }}>⚠️</span>
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>
                                Email Address
                            </label>
                            <div style={{ position: 'relative' }}>
                                <FaEnvelope style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px',
                                        padding: '0.85rem 1rem 0.85rem 3rem',
                                        width: '100%',
                                        color: '#fff',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                        boxSizing: 'border-box',
                                    }}
                                    placeholder="info@makeitsolutions.rw"
                                    required
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <FaLock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px',
                                        padding: '0.85rem 3rem 0.85rem 3rem',
                                        width: '100%',
                                        color: '#fff',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                        boxSizing: 'border-box',
                                    }}
                                    placeholder="••••••••"
                                    required
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                                >
                                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                </button>
                            </div>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                marginTop: '0.5rem',
                                padding: '0.9rem',
                                fontSize: '1rem',
                                fontWeight: 700,
                                background: 'var(--primary)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.7 : 1,
                                transition: 'opacity 0.2s',
                                letterSpacing: '0.5px',
                            }}
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </motion.button>
                    </form>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <Link to="/register" style={{
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            textDecoration: 'none',
                            transition: 'opacity 0.2s',
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                            Don't have an account? <span style={{ color: 'var(--primary)' }}>Register</span>
                        </Link>
                        <Link to="/" style={{
                            color: 'rgba(255,255,255,0.4)',
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'color 0.2s',
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                        >
                            <FaArrowLeft size={11} />
                            Back to Site
                        </Link>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Login;
