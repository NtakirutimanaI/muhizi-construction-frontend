import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await authService.forgotPassword(email);
            setSent(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send reset code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page" data-nav-theme="dark" style={{
            marginTop: 'calc(-1 * var(--nav-offset))',
            paddingTop: 'calc(var(--nav-offset) + 40px)',
        }}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="auth-wrap"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="auth-card"
                >
                    <div className="auth-eyebrow">
                        <span className="auth-eyebrow-line" />
                        PASSWORD RESET
                    </div>
                    <h1 className="auth-heading">Forgot Password</h1>
                    <p className="auth-subtext">
                        {sent ? 'Check your email for a reset code' : "We'll send you a reset code by email"}
                    </p>

                    {error && <div className="auth-error">{error}</div>}

                    {sent ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                If an account exists for <strong style={{ color: 'var(--text-main)' }}>{email}</strong>, an OTP code has been sent. Enter it on the next screen to set a new password.
                            </p>
                            <button
                                onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
                                className="auth-submit"
                            >
                                Enter Reset Code
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="auth-form">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="auth-input"
                                placeholder="Email Address"
                                required
                            />

                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="auth-submit"
                            >
                                {isLoading ? 'Sending...' : 'Send Reset Code'}
                            </motion.button>
                        </form>
                    )}

                    <div className="auth-footer">
                        <Link to="/login" className="auth-back-link">
                            <FaArrowLeft size={11} /> Back to Login
                        </Link>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
