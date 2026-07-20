import { useState, useEffect } from 'react';
import {
    FaCog, FaLock, FaUser, FaShieldAlt, FaBell, FaEyeSlash, FaGlobe
} from 'react-icons/fa';
import { authService } from '../../services/authService';
import { profileService } from '../../services/profileService';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { useToast } from '../../context/ToastContext';
import { loadPageCache, savePageCache } from '../../utils/pageCache';

const Settings = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('general');

    // Password state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Settings state
    const [settings, setSettings] = useState({
        maintenanceMode: false,
        enableNotifications: true,
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const cached = loadPageCache<any>('pg_settings');
        if (cached) {
            setProfile(cached);
            setSettings({
                maintenanceMode: cached.maintenanceMode || false,
                enableNotifications: cached.preferences?.enableNotifications !== false,
            });
        }

        try {
            const data = await profileService.getMyProfile();
            setProfile(data);
            setSettings({
                maintenanceMode: data.maintenanceMode || false,
                enableNotifications: data.preferences?.enableNotifications !== false,
            });
            savePageCache('pg_settings', data);
        } catch (error) {
            if (!cached) {
                console.error('Failed to load profile', error);
                showToast('Failed to load settings', 'error');
            }
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const submitPasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!passwordData.currentPassword) {
            showToast('Current password is required', 'error');
            setLoading(false);
            return;
        }

        if (passwordData.newPassword.length < 6) {
            showToast('New password must be at least 6 characters', 'error');
            setLoading(false);
            return;
        }

        if (passwordData.currentPassword === passwordData.newPassword) {
            showToast('New password must differ from current password', 'error');
            setLoading(false);
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showToast('Passwords do not match', 'error');
            setLoading(false);
            return;
        }

        try {
            await authService.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            showToast('Password changed successfully', 'success');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to change password', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSettingToggle = async (key: 'maintenanceMode' | 'enableNotifications', value: boolean) => {
        // Optimistic update
        setSettings(prev => ({ ...prev, [key]: value }));

        try {
            const updateData: any = key === 'enableNotifications'
                ? { preferences: { ...profile?.preferences, enableNotifications: value } }
                : { maintenanceMode: value };

            const updatedProfile = await profileService.updateProfile(updateData);
            setProfile(updatedProfile);
            window.dispatchEvent(new CustomEvent('profile-updated'));
            showToast('Setting updated successfully', 'success');
        } catch (error) {
            showToast('Failed to update setting', 'error');
            // Revert on error
            setSettings(prev => ({ ...prev, [key]: !value }));
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: <FaCog /> },
        { id: 'security', label: 'Security', icon: <FaLock /> },
        { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
    ];

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Settings</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                        Manage your account security and the public site's availability.
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
                            whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                            background: activeTab === tab.id ? 'var(--text-main)' : 'transparent',
                            color: activeTab === tab.id ? 'var(--bg-body)' : 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', gap: '6px',
                        }}
                    >
                        <span style={{ fontSize: '0.8rem' }}>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* General Tab */}
            {activeTab === 'general' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', maxWidth: '830px', margin: '0 auto' }}
                >
                    {/* Account Information */}
                    <div className="content-card" style={{ padding: '0.6rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FaUser style={{ color: 'var(--primary)' }} /> Account Information
                        </h3>
                        <div style={{ display: 'grid', gap: '0.4rem' }}>
                            <div className="form-group" style={{ width: '100%' }}>
                                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Email</label>
                                <input className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.7 }} />
                            </div>
                            <div className="form-group" style={{ width: '100%' }}>
                                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Role</label>
                                <div style={{
                                    padding: '0.4rem 0.6rem',
                                    background: 'var(--bg-body)',
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    color: 'var(--primary)'
                                }}>
                                    {user?.role?.toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Site Visibility */}
                    <div className="content-card" style={{ padding: '0.6rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FaGlobe style={{ color: 'var(--primary)' }} /> Public Site
                        </h3>
                        <SettingToggle
                            icon={<FaEyeSlash />}
                            label="Maintenance Mode"
                            description="Temporarily hide the public website from visitors while you work on it. Logged-in staff can still browse it and can always reach the login page."
                            checked={settings.maintenanceMode}
                            onChange={(val) => handleSettingToggle('maintenanceMode', val)}
                            color="var(--primary-red)"
                            compact
                        />
                    </div>
                </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', maxWidth: '830px', margin: '0 auto' }}
                >
                    {/* Change Password */}
                    <div className="content-card" style={{ padding: '0.6rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FaLock style={{ color: 'var(--primary)' }} /> Change Password
                        </h3>
                        <form onSubmit={submitPasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <div className="form-group" style={{ width: '100%' }}>
                                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Current Password</label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    className="form-input"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    placeholder="Enter your current password"
                                />
                            </div>
                            <div className="form-group" style={{ width: '100%' }}>
                                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>New Password</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    className="form-input"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    placeholder="Minimum 6 characters"
                                />
                            </div>
                            <div className="form-group" style={{ width: '100%' }}>
                                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Confirm New Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    className="form-input"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    placeholder="Re-enter your new password"
                                />
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', marginTop: '0.2rem', width: '100%' }}>
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', maxWidth: '830px', margin: '0 auto' }}
                >
                    <div className="content-card" style={{ padding: '0.6rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FaShieldAlt style={{ color: 'var(--primary)' }} /> Notification Preferences
                        </h3>
                        <SettingToggle
                            icon={<FaBell />}
                            label="In-App Notifications"
                            description="Receive in-app notifications for activity relevant to your account"
                            checked={settings.enableNotifications}
                            onChange={(val) => handleSettingToggle('enableNotifications', val)}
                            color="var(--primary)"
                            compact
                        />
                    </div>
                </motion.div>
            )}
        </div>
    );
};

// Reusable Toggle Component
const SettingToggle = ({
    icon,
    label,
    description,
    checked,
    onChange,
    color,
    compact
}: {
    icon: React.ReactNode;
    label: string;
    description: string;
    checked: boolean;
    onChange: (value: boolean) => void;
    color: string;
    compact?: boolean;
}) => {
    const c = compact;
    return (
        <div
            onClick={() => onChange(!checked)}
            role="switch"
            aria-checked={checked}
            style={{
                padding: c ? '0.4rem' : '1rem',
                background: 'var(--bg-body)',
                borderRadius: c ? '6px' : '8px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: c ? '0.5rem' : '1rem',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = color}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
            <div style={{ display: 'flex', gap: c ? '0.5rem' : '1rem', alignItems: 'center', flex: 1 }}>
                <div style={{
                    fontSize: c ? '1rem' : '1.5rem',
                    color,
                    width: c ? '28px' : '40px',
                    height: c ? '28px' : '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${color}15`,
                    borderRadius: c ? '6px' : '8px'
                }}>
                    {icon}
                </div>
                <div>
                    <h4 style={{ fontSize: c ? '0.8rem' : '0.95rem', fontWeight: 600, margin: '0 0 0.1rem 0' }}>{label}</h4>
                    <p style={{ fontSize: c ? '0.7rem' : '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{description}</p>
                </div>
            </div>

            <div style={{ position: 'relative', width: c ? '36px' : '50px', height: c ? '20px' : '26px' }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: checked ? color : '#e2e8f0',
                    transition: '0.3s',
                    borderRadius: c ? '20px' : '26px',
                }}>
                    <div style={{
                        position: 'absolute',
                        height: c ? '14px' : '20px',
                        width: c ? '14px' : '20px',
                        left: checked ? (c ? '19px' : '27px') : (c ? '2px' : '3px'),
                        bottom: c ? '3px' : '3px',
                        background: 'white',
                        transition: '0.3s',
                        borderRadius: '50%',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }} />
                </div>
            </div>
        </div>
    );
};

export default Settings;
