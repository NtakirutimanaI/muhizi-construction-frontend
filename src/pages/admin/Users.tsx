import { useState, useEffect } from 'react';
import { FaUsers, FaEnvelope, FaUser, FaCalendarAlt, FaCheck, FaTimes } from 'react-icons/fa';
import { authService } from '../../services/authService';
import Loading from '../../components/Loading';

const Users = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await authService.getAllUsers();
                setUsers(data);
            } catch (e) {
                console.error('Failed to load users', e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) return <Loading />;

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <FaUsers style={{ color: 'var(--primary)' }} />
                    Registered Users
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    {users.length} user{users.length !== 1 ? 's' : ''} registered
                </p>
            </div>

            <div className="content-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>User</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Email</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Username</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Active</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <FaUser size={14} style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700 }}>{u.profile?.firstName || ''} {u.profile?.lastName || ''}</div>
                                        {u.email === 'info@makeitsolutions.rw' && (
                                            <span style={{ fontSize: '0.7rem', background: 'rgba(123,192,67,0.15)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Admin</span>
                                        )}
                                    </div>
                                </td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FaEnvelope size={12} style={{ color: 'var(--text-muted)' }} />
                                        {u.email}
                                    </span>
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{u.username}</td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    {u.isActive
                                        ? <FaCheck style={{ color: 'var(--primary)' }} />
                                        : <FaTimes style={{ color: 'var(--primary-red)' }} />}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FaCalendarAlt size={12} />
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No users registered yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Users;
