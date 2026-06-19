import { useState, useEffect } from 'react';
import { FaGlobe, FaSave } from 'react-icons/fa';
import { profileService } from '../../services/profileService';
import { useToast } from '../../context/ToastContext';
import Loading from '../../components/Loading';

const FooterSettings = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [footerData, setFooterData] = useState({
        phone: '',
        email: '',
        linkedinUrl: '',
        twitterUrl: '',
        githubUrl: '',
        copyrightText: '',
        poweredByText: 'Powered and secured by MIS'
    });

    useEffect(() => {
        loadFooterData();
    }, []);

    const loadFooterData = async () => {
        try {
            const profile = await profileService.getMyProfile();
            setFooterData({
                phone: profile.phone || '',
                email: profile.email || '',
                linkedinUrl: profile.socialLinks?.linkedin || '',
                twitterUrl: profile.socialLinks?.twitter || '',
                githubUrl: profile.socialLinks?.github || '',
                copyrightText: `© ${new Date().getFullYear()} By ${profile.firstName} ${profile.lastName}`,
                poweredByText: profile.poweredBy || 'Powered and secured by MIS'
            });
        } catch (error) {
            console.error('Failed to load footer data', error);
            showToast('Failed to load footer data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFooterData({ ...footerData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await profileService.updateProfile({
                phone: footerData.phone,
                email: footerData.email,
                socialLinks: {
                    linkedin: footerData.linkedinUrl,
                    twitter: footerData.twitterUrl,
                    github: footerData.githubUrl
                },
                poweredBy: footerData.poweredByText
            });
            await profileService.getMyProfile();
            window.dispatchEvent(new CustomEvent('profile-updated'));
            showToast('Footer settings saved successfully!', 'success');
        } catch (error) {
            console.error('Failed to save footer settings', error);
            showToast('Failed to save footer settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <FaGlobe style={{ color: 'var(--primary-teal)' }} />
                    Footer Settings
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    Manage your website footer information displayed on the landing page.
                </p>
            </div>

            {/* Main Content */}
            <div className="content-card" style={{ padding: '2rem' }}>
                {/* Contact Information */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border-color)' }}>
                        Contact Information
                    </h3>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input
                                type="text"
                                name="phone"
                                className="form-input"
                                value={footerData.phone}
                                onChange={handleChange}
                                placeholder="+250 788 000 000"
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                This phone number will be displayed in the footer
                            </p>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                value={footerData.email}
                                onChange={handleChange}
                                placeholder="your@email.com"
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                Primary contact email displayed in the footer
                            </p>
                        </div>
                    </div>
                </div>

                {/* Social Media Links */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border-color)' }}>
                        Social Media Links
                    </h3>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label">LinkedIn URL</label>
                            <input
                                type="url"
                                name="linkedinUrl"
                                className="form-input"
                                value={footerData.linkedinUrl}
                                onChange={handleChange}
                                placeholder="https://linkedin.com/in/yourprofile"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Twitter URL</label>
                            <input
                                type="url"
                                name="twitterUrl"
                                className="form-input"
                                value={footerData.twitterUrl}
                                onChange={handleChange}
                                placeholder="https://twitter.com/yourusername"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">GitHub URL</label>
                            <input
                                type="url"
                                name="githubUrl"
                                className="form-input"
                                value={footerData.githubUrl}
                                onChange={handleChange}
                                placeholder="https://github.com/yourusername"
                            />
                        </div>
                    </div>
                </div>

                {/* Copyright & Branding */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border-color)' }}>
                        Copyright & Branding
                    </h3>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label">Copyright Text</label>
                            <input
                                type="text"
                                name="copyrightText"
                                className="form-input"
                                value={footerData.copyrightText}
                                onChange={handleChange}
                                placeholder="© 2026 By Your Name"
                                disabled
                                style={{ opacity: 0.7 }}
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                Auto-generated from your profile name and current year
                            </p>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Powered By Text</label>
                            <input
                                type="text"
                                name="poweredByText"
                                className="form-input"
                                value={footerData.poweredByText}
                                onChange={handleChange}
                                placeholder="Powered and secured by..."
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                Optional branding text shown below copyright
                            </p>
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div style={{
                    padding: '1.5rem',
                    background: 'var(--bg-body)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    marginBottom: '2rem'
                }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-muted)' }}>
                        PREVIEW
                    </h4>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1.5rem',
                        padding: '1rem',
                        background: 'var(--bg-white)',
                        borderRadius: '8px'
                    }}>
                        <div>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Phone</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{footerData.phone || 'Not set'}</p>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Email</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{footerData.email || 'Not set'}</p>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Follow Us</h4>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {footerData.linkedinUrl && <span style={{ fontSize: '0.85rem' }}>LinkedIn</span>}
                                {footerData.twitterUrl && <span style={{ fontSize: '0.85rem' }}>Twitter</span>}
                                {footerData.githubUrl && <span style={{ fontSize: '0.85rem' }}>GitHub</span>}
                                {!footerData.linkedinUrl && !footerData.twitterUrl && !footerData.githubUrl && (
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No social links</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{footerData.copyrightText}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{footerData.poweredByText}</p>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary"
                    style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <FaSave />
                    {saving ? 'Saving...' : 'Save Footer Settings'}
                </button>
            </div>
        </div>
    );
};

export default FooterSettings;
