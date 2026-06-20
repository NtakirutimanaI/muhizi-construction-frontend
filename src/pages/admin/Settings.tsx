import { useState, useEffect } from 'react';
import {
    FaCog, FaPaintBrush, FaLock, FaEye, FaEyeSlash, FaBell,
    FaUser, FaGlobe, FaShieldAlt, FaTrash, FaDownload, FaSync, FaCheckCircle,
    FaServer, FaEnvelope, FaKey
} from 'react-icons/fa';
import { authService } from '../../services/authService';
import { profileService } from '../../services/profileService';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { useToast } from '../../context/ToastContext';

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
        siteTitle: 'MIS - Make It Solutions',
        enableAnimations: true,
        enableNotifications: true,
        isPublic: true,
        allowMessages: true,
        showViews: true,
        maintenanceMode: false,
        availableForHire: true
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await profileService.getMyProfile();
            setProfile(data);
            setSettings(prev => ({
                ...prev,
                isPublic: data.isPublic !== false,
                allowMessages: data.allowMessages !== false,
                showViews: data.showViews !== false,
                maintenanceMode: data.maintenanceMode || false,
                availableForHire: data.availableForHire !== false,
                enableAnimations: data.preferences?.enableAnimations !== false,
                enableNotifications: data.preferences?.enableNotifications !== false,
            }));
        } catch (error) {
            console.error('Failed to load profile', error);
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const submitPasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (passwordData.newPassword.length < 6) {
            showToast('New password must be at least 6 characters', 'error');
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

    const handleSettingToggle = async (key: string, value: boolean) => {
        // Optimistic update
        setSettings(prev => ({ ...prev, [key]: value }));

        try {
            const updateData: any = {};

            // Map simple boolean fields
            if (['isPublic', 'allowMessages', 'showViews', 'maintenanceMode', 'availableForHire'].includes(key)) {
                updateData[key] = value;
            }
            // Map preferences fields
            else if (['enableAnimations', 'enableNotifications'].includes(key)) {
                updateData.preferences = {
                    ...profile?.preferences,
                    [key]: value
                };
            }

            if (Object.keys(updateData).length > 0) {
                const updatedProfile = await profileService.updateProfile(updateData);
                setProfile(updatedProfile);
                window.dispatchEvent(new CustomEvent('profile-updated'));
                showToast('Setting updated successfully', 'success');
            }
        } catch (error) {
            showToast('Failed to update setting', 'error');
            // Revert on error
            setSettings(prev => ({ ...prev, [key]: !value }));
        }
    };

    const clearCache = () => {
        const token = localStorage.getItem('accessToken');
        const user = localStorage.getItem('user');

        localStorage.clear();
        sessionStorage.clear();

        if (token) localStorage.setItem('accessToken', token);
        if (user) localStorage.setItem('user', user);

        showToast('Cache cleared successfully', 'success');
    };

    const tabs = [
        { id: 'general', label: 'General', icon: <FaCog /> },
        { id: 'security', label: 'Security', icon: <FaLock /> },
        { id: 'privacy', label: 'Privacy', icon: <FaShieldAlt /> },
        { id: 'appearance', label: 'Appearance', icon: <FaPaintBrush /> },
        { id: 'advanced', label: 'Advanced', icon: <FaServer /> },
    ];

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Settings</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                        Manage your portfolio settings, security, and preferences.
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
                    style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                >
                    {/* Account Information */}
                    <div className="content-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaUser style={{ color: 'var(--primary-teal)' }} /> Account Information
                        </h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Username</label>
                                <input className="form-input" value={user?.username || ''} disabled style={{ opacity: 0.7 }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.7 }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <div style={{
                                    padding: '0.8rem',
                                    background: 'var(--bg-body)',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    color: 'var(--primary-teal)'
                                }}>
                                    {user?.role?.toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Portfolio Settings */}
                    <div className="content-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaGlobe style={{ color: 'var(--primary)' }} /> Portfolio Settings
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <SettingToggle
                                icon={settings.isPublic ? <FaEye /> : <FaEyeSlash />}
                                label="Portfolio Visibility"
                                description="Make your portfolio visible to the public"
                                checked={settings.isPublic}
                                onChange={(val) => handleSettingToggle('isPublic', val)}
                                color="var(--primary-teal)"
                            />
                            <SettingToggle
                                icon={<FaEnvelope />}
                                label="Allow Contact Messages"
                                description="Enable visitors to send you messages"
                                checked={settings.allowMessages}
                                onChange={(val) => handleSettingToggle('allowMessages', val)}
                                color="var(--primary)"
                            />
                            <SettingToggle
                                icon={<FaEye />}
                                label="Show View Count"
                                description="Display profile view count on dashboard"
                                checked={settings.showViews}
                                onChange={(val) => handleSettingToggle('showViews', val)}
                                color="#667eea"
                            />
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                >
                    {/* Change Password */}
                    <div className="content-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaLock style={{ color: 'var(--primary-red)' }} /> Change Password
                        </h3>
                        <form onSubmit={submitPasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Current Password</label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    className="form-input"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
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
                            <div className="form-group">
                                <label className="form-label">Confirm New Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    className="form-input"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>

                    {/* Session Management */}
                    <div className="content-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaKey style={{ color: 'var(--primary)' }} /> Session Management
                        </h3>
                        <div style={{ padding: '1rem', background: 'var(--bg-body)', borderRadius: '8px', marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                Last login: <strong>{new Date().toLocaleString()}</strong>
                            </p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                Active sessions: <strong>1</strong>
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                >
                    <div className="content-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaShieldAlt style={{ color: 'var(--primary-teal)' }} /> Privacy Controls
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <SettingToggle
                                icon={<FaBell />}
                                label="Email Notifications"
                                description="Receive email notifications for new messages"
                                checked={settings.enableNotifications}
                                onChange={(val) => handleSettingToggle('enableNotifications', val)}
                                color="var(--primary)"
                            />
                            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid var(--primary-red)', borderRadius: '8px', marginTop: '1rem' }}>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary-red)' }}>
                                    Data Management
                                </h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                    Export or delete your data. This action cannot be undone.
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="btn-primary"
                                        style={{ background: 'var(--primary-teal)', flex: 1 }}
                                        onClick={() => showToast('Export functionality coming soon', 'info')}
                                    >
                                        <FaDownload /> Export Data
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                >
                    <div className="content-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaPaintBrush style={{ color: 'var(--primary)' }} /> UI Preferences
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <SettingToggle
                                icon={<FaCheckCircle />}
                                label="Enable Animations"
                                description="Show smooth transitions and animations"
                                checked={settings.enableAnimations}
                                onChange={(val) => handleSettingToggle('enableAnimations', val)}
                                color="var(--primary-teal)"
                            />
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                >
                    <div className="content-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaServer style={{ color: 'var(--primary-teal)' }} /> System Configuration
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <SettingToggle
                                icon={<FaUser />}
                                label="Available for Hire"
                                description="Show 'Available for hire' badge on your portfolio"
                                checked={settings.availableForHire}
                                onChange={(val) => handleSettingToggle('availableForHire', val)}
                                color="var(--primary-teal)"
                            />
                            <SettingToggle
                                icon={<FaCog />}
                                label="Maintenance Mode"
                                description="Hide portfolio from public (shows maintenance page)"
                                checked={settings.maintenanceMode}
                                onChange={(val) => handleSettingToggle('maintenanceMode', val)}
                                color="var(--primary-red)"
                            />

                            <div style={{ padding: '1rem', background: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '8px', marginTop: '1rem' }}>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>System Actions</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <button
                                        className="btn-primary"
                                        style={{ background: 'var(--primary-teal)', width: '100%' }}
                                        onClick={clearCache}
                                    >
                                        <FaSync /> Clear Local Cache
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="content-card" style={{ padding: '1.5rem', border: '2px solid var(--primary-red)' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-red)' }}>
                            <FaTrash /> Danger Zone
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            Irreversible actions. Please be careful.
                        </p>
                        <button
                            className="btn-primary"
                            style={{ background: 'var(--primary-red)', width: '100%' }}
                            onClick={async () => {
                                if (confirm('Are you sure you want to delete all messages? This cannot be undone.')) {
                                    try {
                                        await profileService.deleteAllMessages();
                                        showToast('All messages deleted', 'success');
                                    } catch (error) {
                                        showToast('Failed to delete messages', 'error');
                                    }
                                }
                            }}
                        >
                            <FaTrash /> Delete All Messages
                        </button>
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
    color
}: {
    icon: React.ReactNode;
    label: string;
    description: string;
    checked: boolean;
    onChange: (value: boolean) => void;
    color: string;
}) => {
    return (
        <div
            onClick={() => onChange(!checked)}
            role="switch"
            aria-checked={checked}
            style={{
                padding: '1rem',
                background: 'var(--bg-body)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = color}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1 }}>
                <div style={{
                    fontSize: '1.5rem',
                    color,
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${color}15`,
                    borderRadius: '8px'
                }}>
                    {icon}
                </div>
                <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 0.3rem 0' }}>{label}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{description}</p>
                </div>
            </div>

            <div style={{ position: 'relative', width: '50px', height: '26px' }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: checked ? color : '#e2e8f0',
                    transition: '0.3s',
                    borderRadius: '26px',
                }}>
                    <div style={{
                        position: 'absolute',
                        height: '20px',
                        width: '20px',
                        left: checked ? '27px' : '3px',
                        bottom: '3px',
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
