import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { API_BASE_URL } from '../../services/api';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaArrowLeft, FaGoogle } from 'react-icons/fa';
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
            login(data.accessToken, data.user, data.refreshToken);
            const target = getRolePath(data.user?.role || '');
            navigate(target);
        } catch (err: any) {
            const errMsg = err.response?.data?.message;
            setError(Array.isArray(errMsg) ? errMsg.join('. ') : (errMsg || 'Failed to login. Please check your credentials.'));
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
                    <h1 className="auth-heading">Welcome Back</h1>
                    <p className="auth-subtext">Sign in to manage your portfolio</p>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="auth-error"
                        >
                            <span>⚠️</span>
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="auth-input"
                            placeholder="Email Address"
                            required
                        />

                        <div>
                            <div className="auth-password-wrap">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="auth-input"
                                    placeholder="Password"
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
                            <div className="auth-forgot" style={{ marginTop: '0.5rem' }}>
                                <Link to="/forgot-password">Forgot password?</Link>
                            </div>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="auth-submit"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </motion.button>
                    </form>

                    <div className="auth-divider">
                        <div className="auth-divider-line" />
                        <span>OR</span>
                        <div className="auth-divider-line" />
                    </div>

                    <a href={`${API_BASE_URL}/auth/google`} className="auth-google-btn">
                        <FaGoogle size={15} /> Sign in with Google
                    </a>

                    <div className="auth-footer">
                        <Link to="/register" className="auth-footer-link">
                            Don't have an account? <span>Register</span>
                        </Link>
                        <Link to="/" className="auth-back-link">
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
