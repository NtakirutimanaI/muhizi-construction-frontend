import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { getRolePath } from '../../config/roles';

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const ranOnce = useRef(false);

    useEffect(() => {
        if (ranOnce.current) return;
        ranOnce.current = true;

        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');

        if (!accessToken) {
            setError('Google sign-in failed. Please try again.');
            return;
        }

        const finish = async () => {
            try {
                localStorage.setItem('accessToken', accessToken);
                const me = await authService.getMe();
                login(accessToken, me, refreshToken || undefined);
                navigate(getRolePath(me?.role || ''), { replace: true });
            } catch {
                setError('Google sign-in failed. Please try again.');
            }
        };
        finish();
    }, [searchParams, login, navigate]);

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(/login.png) center/cover fixed`,
            color: '#fff', flexDirection: 'column', gap: '1rem', textAlign: 'center', padding: '2rem',
        }}>
            {error ? (
                <>
                    <p style={{ color: '#ef4444', fontSize: '0.95rem' }}>{error}</p>
                    <a href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Back to Login</a>
                </>
            ) : (
                <p style={{ fontSize: '0.95rem', opacity: 0.8 }}>Signing you in with Google...</p>
            )}
        </div>
    );
};

export default GoogleCallback;
