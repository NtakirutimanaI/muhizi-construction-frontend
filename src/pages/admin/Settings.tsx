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
    const [deleting, setDeleting] = useState(false);
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
            showToast('Failed to load profile settings', 'error');
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
        const userData = localStorage.getItem('user');

        localStorage.clear();
        sessionStorage.clear();

        if (token) localStorage.setItem('accessToken', token);
        if (userData) localStorage.setItem('user', userData);

        showToast('Local cache cleared successfully', 'success');
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
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', maxWidth: '830px', margin: '0 auto' }}
                >
                    {/* Account Information */}
                    <div className="content-card" style={{ padding: '0.6rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FaUser style={{ color: 'var(--primary)' }} /> Account Information
                        </h3>
                        <div style={{ display: 'grid', gap: '0.4rem' }}>
                            <div className="form-group" style={{ width: '100%' }}>
                                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Username</label>
                                <input className="form-input" value={user?.username || ''} disabled style={{ opacity: 0.7 }} />
                            </div>
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

                    {/* Portfolio Settings */}
                    <div className="content-card" style={{ padding: '0.6rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FaGlobe style={{ color: 'var(--primary)' }} /> Portfolio Settings
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <SettingToggle
                                icon={settings.isPublic ? <FaEye /> : <FaEyeSlash />}
                                label="Portfolio Visibility"
                                description="Make your portfolio visible"
                                checked={settings.isPublic}
                                onChange={(val) => handleSettingToggle('isPublic', val)}
                                color="var(--primary-teal)"
                                compact
                            />
                            <SettingToggle
                                icon={<FaEnvelope />}
                                label="Allow Contact Messages"
                                description="Enable visitors to message you"
                                checked={settings.allowMessages}
                                onChange={(val) => handleSettingToggle('allowMessages', val)}
                                color="var(--primary)"
                                compact
                            />
                            <SettingToggle
                                icon={<FaEye />}
                                label="Show View Count"
                                description="Display profile view count"
                                checked={settings.showViews}
                                onChange={(val) => handleSettingToggle('showViews', val)}
                                color="#667eea"
                                compact
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

                    {/* Session Management */}
                    <div className="content-card" style={{ padding: '0.6rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FaKey style={{ color: 'var(--primary)' }} /> Session Management
                        </h3>
                        <div style={{ padding: '0.5rem', background: 'var(--bg-body)', borderRadius: '6px' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                                Current session started: <strong>{new Date().toLocaleString()}</strong>
                            </p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
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
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', maxWidth: '830px', margin: '0 auto' }}
                >
                    <div className="content-card" style={{ padding: '0.6rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FaShieldAlt style={{ color: 'var(--primary)' }} /> Privacy Controls
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <SettingToggle
                                icon={<FaBell />}
                                label="Email Notifications"
                                description="Receive email notifications"
                                checked={settings.enableNotifications}
                                onChange={(val) => handleSettingToggle('enableNotifications', val)}
                                color="var(--primary)"
                                compact
                            />
                            <div style={{ padding: '0.5rem', background: 'rgba(139,69,19,0.04)', border: '1px solid var(--primary)', borderRadius: '6px' }}>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--primary)' }}>
                                    Data Management
                                </h4>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                    Export or delete your data. This action cannot be undone.
                                </p>
                                <button
                                    className="btn-primary"
                                    style={{ background: 'var(--primary)', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                    onClick={() => showToast('Export functionality coming soon', 'info')}
                                >
                                    <FaDownload /> Export Data
                                </button>
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
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', maxWidth: '830px', margin: '0 auto' }}
                >
                    <div className="content-card" style={{ padding: '0.6rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FaPaintBrush style={{ color: 'var(--primary)' }} /> UI Preferences
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <SettingToggle
                                icon={<FaCheckCircle />}
                                label="Enable Animations"
                                description="Show smooth transitions"
                                checked={settings.enableAnimations}
                                onChange={(val) => handleSettingToggle('enableAnimations', val)}
                                color="var(--primary-teal)"
                                compact
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
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', maxWidth: '830px', margin: '0 auto' }}
                >
                    <div className="content-card" style={{ padding: '0.6rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FaServer style={{ color: 'var(--primary)' }} /> System Configuration
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <SettingToggle
                                icon={<FaUser />}
                                label="Available for Hire"
                                description="Show 'Available for hire' badge"
                                checked={settings.availableForHire}
                                onChange={(val) => handleSettingToggle('availableForHire', val)}
                                color="var(--primary)"
                                compact
                            />
                            <SettingToggle
                                icon={<FaCog />}
                                label="Maintenance Mode"
                                description="Hide portfolio from public"
                                checked={settings.maintenanceMode}
                                onChange={(val) => handleSettingToggle('maintenanceMode', val)}
                                color="var(--primary-red)"
                                compact
                            />

                            <div style={{ padding: '0.5rem', background: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '6px', marginTop: '0.3rem' }}>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.3rem' }}>System Actions</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <button
                                        className="btn-primary"
                                        style={{ background: 'var(--primary)', width: '100%', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                        onClick={clearCache}
                                    >
                                        <FaSync /> Clear Local Cache
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="content-card" style={{ padding: '0.6rem', border: '1.5px solid var(--primary-red)' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary-red)' }}>
                            <FaTrash /> Danger Zone
                        </h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                            Irreversible actions. Please be careful.
                        </p>
                        <button
                            className="btn-primary"
                            style={{ background: 'var(--primary-red)', width: '100%', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                            disabled={deleting}
                            onClick={async () => {
                                if (deleting) return;
                                if (!confirm('Are you sure you want to delete all messages? This cannot be undone.')) return;
                                setDeleting(true);
                                try {
                                    await profileService.deleteAllMessages();
                                    showToast('All messages deleted', 'success');
                                } catch (error) {
                                    showToast('Failed to delete messages', 'error');
                                } finally {
                                    setDeleting(false);
                                }
                            }}
                        >
                            {deleting ? 'Deleting...' : <><FaTrash /> Delete All Messages</>}
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
