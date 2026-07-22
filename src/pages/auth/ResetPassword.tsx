import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';

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
                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <img src="/logo.jpeg" alt="MUHIZI CONSTRUCTION" style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', margin: '0 auto', display: 'block', border: '2px solid rgba(255,255,255,0.1)' }} />
                    </div>
                    <h1 className="auth-heading">Reset Password</h1>
                    <p className="auth-subtext">Enter the code we emailed you and choose a new password</p>

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="auth-input"
                            placeholder="Email Address"
                            required
                        />

                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="auth-input"
                            placeholder="Reset Code (OTP)"
                            required
                        />

                        <div>
                            <div className="auth-password-wrap">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="auth-input"
                                    placeholder="New Password"
                                    minLength={8}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="auth-eye-btn"
                                >
                                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                </button>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.4rem' }}>
                                Min 8 characters, 1 capital letter, 1 lowercase letter, 1 special character.
                            </p>
                        </div>

                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="auth-input"
                            placeholder="Confirm New Password"
                            minLength={8}
                            required
                        />

                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="auth-submit"
                        >
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </motion.button>
                    </form>

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

export default ResetPassword;
