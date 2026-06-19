import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { motion } from 'framer-motion';
import { FaLock, FaEnvelope, FaUser, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';

const Register = () => {
    const [form, setForm] = useState({ firstName: '', lastName: '', username: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await authService.register(form);
            const data = await authService.login({ email: form.email, password: form.password });
            login(data.accessToken, data.user);
            navigate('/admin');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '80px',
            paddingBottom: '3rem',
            background: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #0d0d0d 100%)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-30%',
                width: '600px',
                height: '600px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(123,192,67,0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-40%',
                left: '-20%',
                width: '500px',
                height: '500px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(123,192,67,0.05) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                    width: '100%',
                    maxWidth: '480px',
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
                        background: '#1a1a1a',
                        padding: '2.5rem',
                        borderRadius: '0',
                        border: '1px solid rgba(123,192,67,0.15)',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
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
                            Get Started
                        </div>
                        <h1 style={{
                            fontSize: '1.75rem',
                            fontWeight: 800,
                            color: '#fff',
                            marginBottom: '0.35rem',
                            letterSpacing: '-0.01em',
                        }}>
                            REGISTER
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                            Create a new account
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>
                                    First Name
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <FaUser style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }} />
                                    <input name="firstName" value={form.firstName} onChange={handleChange}
                                        style={{
                                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '10px', padding: '0.85rem 1rem 0.85rem 3rem', width: '100%',
                                            color: '#fff', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
                                            boxSizing: 'border-box',
                                        }}
                                        placeholder="John" required
                                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                </div>
                            </div>
                            <div>
                                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>
                                    Last Name
                                </label>
                                <input name="lastName" value={form.lastName} onChange={handleChange}
                                    style={{
                                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px', padding: '0.85rem 1rem', width: '100%',
                                        color: '#fff', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
                                        boxSizing: 'border-box',
                                    }}
                                    placeholder="Doe" required
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                            </div>
                        </div>

                        <div>
                            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>
                                Username
                            </label>
                            <div style={{ position: 'relative' }}>
                                <FaUser style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }} />
                                <input name="username" value={form.username} onChange={handleChange}
                                    style={{
                                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px', padding: '0.85rem 1rem 0.85rem 3rem', width: '100%',
                                        color: '#fff', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
                                        boxSizing: 'border-box',
                                    }}
                                    placeholder="johndoe" required
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                            </div>
                        </div>

                        <div>
                            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>
                                Email Address
                            </label>
                            <div style={{ position: 'relative' }}>
                                <FaEnvelope style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }} />
                                <input type="email" name="email" value={form.email} onChange={handleChange}
                                    style={{
                                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px', padding: '0.85rem 1rem 0.85rem 3rem', width: '100%',
                                        color: '#fff', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
                                        boxSizing: 'border-box',
                                    }}
                                    placeholder="user@example.com" required
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                            </div>
                        </div>

                        <div>
                            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <FaLock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }} />
                                <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                                    style={{
                                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px', padding: '0.85rem 3rem 0.85rem 3rem', width: '100%',
                                        color: '#fff', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
                                        boxSizing: 'border-box',
                                    }}
                                    placeholder="••••••••" minLength={6} required
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                </button>
                            </div>
                        </div>

                        <motion.button type="submit" disabled={isLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                marginTop: '0.5rem', padding: '0.9rem', fontSize: '1rem', fontWeight: 700,
                                background: 'var(--primary)', color: '#0d0d0d', border: 'none', borderRadius: '10px',
                                cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1,
                                transition: 'opacity 0.2s', letterSpacing: '0.5px',
                            }}>
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </motion.button>
                    </form>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                            Already have an account?{' '}
                            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                                Sign In
                            </Link>
                        </span>
                        <Link to="/" style={{
                            color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textDecoration: 'none',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            transition: 'color 0.2s',
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                            <FaArrowLeft size={11} />
                            Back to Portfolio
                        </Link>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Register;
