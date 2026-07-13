import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaKey, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setIsLoading(true);
        try {
            await authService.resetPassword({ email, otp, newPassword });
            navigate('/login', { state: { resetSuccess: true } });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password. Please check your code and try again.');
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
                style={{ width: '100%', maxWidth: '420px', padding: '1.5rem', position: 'relative', zIndex: 1 }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    style={{
                        background: 'rgba(0,0,0,0.15)',
                        padding: '2.5rem',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem', letterSpacing: '-0.01em' }}>
                            RESET PASSWORD
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                            Enter the code we emailed you and choose a new password
                        </p>
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.85rem 1rem',
                            borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.85rem',
                            border: '1px solid rgba(239,68,68,0.2)',
                        }}>
                            {error}
                        </div>
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
                                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px', padding: '0.85rem 1rem 0.85rem 3rem', width: '100%',
                                        color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                                    }}
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>
                                Reset Code (OTP)
                            </label>
                            <div style={{ position: 'relative' }}>
                                <FaKey style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }} />
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    style={{
                                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px', padding: '0.85rem 1rem 0.85rem 3rem', width: '100%',
                                        color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                                    }}
                                    placeholder="123456"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>
                                New Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <FaLock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    style={{
                                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px', padding: '0.85rem 3rem 0.85rem 3rem', width: '100%',
                                        color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                                    }}
                                    placeholder="••••••••"
                                    minLength={8}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                                >
                                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                </button>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', marginTop: '0.35rem' }}>
                                Min 8 characters, 1 capital letter, 1 lowercase letter, 1 special character.
                            </p>
                        </div>

                        <div>
                            <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>
                                Confirm New Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <FaLock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    style={{
                                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px', padding: '0.85rem 1rem 0.85rem 3rem', width: '100%',
                                        color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                                    }}
                                    placeholder="••••••••"
                                    minLength={8}
                                    required
                                />
                            </div>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                marginTop: '0.5rem', padding: '0.9rem', fontSize: '1rem', fontWeight: 700,
                                background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '10px',
                                cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, letterSpacing: '0.5px',
                            }}
                        >
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </motion.button>
                    </form>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <Link to="/login" style={{
                            color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textDecoration: 'none',
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                        }}>
                            <FaArrowLeft size={11} /> Back to Login
                        </Link>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
