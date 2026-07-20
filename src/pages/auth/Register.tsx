import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { getRolePath } from '../../config/roles';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';

const Register = () => {
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
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
            login(data.accessToken, data.user, data.refreshToken);
            const target = getRolePath(data.user?.role || '');
            navigate(target);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
                className="auth-wrap auth-wrap--wide"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="auth-card"
                >
                    <h1 className="auth-heading">Create Account</h1>
                    <p className="auth-subtext">Register to manage your portfolio</p>

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
                        <div className="auth-form-row">
                            <input name="firstName" value={form.firstName} onChange={handleChange}
                                className="auth-input" placeholder="First Name" required />
                            <input name="lastName" value={form.lastName} onChange={handleChange}
                                className="auth-input" placeholder="Last Name" required />
                        </div>

                        <input type="email" name="email" value={form.email} onChange={handleChange}
                            className="auth-input" placeholder="Email Address" required />

                        <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                            className="auth-input" placeholder="Phone (+250 788 000 000)" />

                        <div className="auth-password-wrap">
                            <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                                className="auth-input" placeholder="Password" minLength={6} required />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="auth-eye-btn">
                                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                            </button>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="auth-submit"
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </motion.button>
                    </form>

                    <div className="auth-footer">
                        <span className="auth-footer-link">
                            Already have an account? <Link to="/login"><span>Sign In</span></Link>
                        </span>
                        <Link to="/" className="auth-back-link">
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
