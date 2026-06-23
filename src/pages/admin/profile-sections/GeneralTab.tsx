import { useState, useRef } from 'react';

import { FaSave, FaCamera } from 'react-icons/fa';
import type { Profile } from '../../../services/profileService';
import { profileService } from '../../../services/profileService';
import { authService } from '../../../services/authService';
import { uploadService } from '../../../services/uploadService';
import { useToast } from '../../../context/ToastContext';

interface GeneralTabProps {
    profile: Profile;
    onUpdate: (updatedProfile: Profile) => void;
}

const GeneralTab: React.FC<GeneralTabProps> = ({ profile, onUpdate }) => {
    const [formData, setFormData] = useState(profile);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showToast('Image must be smaller than 2MB', 'error');
                return;
            }
            setUploading(true);
            try {
                const uploaded = await uploadService.uploadFile(file);
                setFormData(prev => ({ ...prev, avatar: uploaded.secureUrl }));
                showToast('Avatar uploaded', 'success');
                setUploading(false);
            } catch (err: any) {
                console.error('Cloudinary upload failed, falling back to base64:', err);
                // Fallback: convert to base64 data URL
                const reader = new FileReader();
                reader.onload = () => {
                    setFormData(prev => ({ ...prev, avatar: reader.result as string }));
                    showToast('Avatar set (base64 fallback)', 'success');
                    setUploading(false);
                };
                reader.onerror = () => {
                    showToast('Failed to read image file', 'error');
                    setUploading(false);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const updateData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                avatar: formData.avatar,
                title: formData.title,
                bio: formData.bio,
                about: formData.about,
                greeting: formData.greeting,
                aboutMeTitle: formData.aboutMeTitle,
                location: formData.location,
                role: formData.role,
            };

            const updated = await profileService.updateProfile(updateData);
            onUpdate(updated);
            showToast('Profile updated successfully!', 'success');
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to update profile. Please try again.';
            showToast(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) { showToast('Fill both password fields', 'error'); return; }
        if (newPassword.length < 6) { showToast('New password must be at least 6 characters', 'error'); return; }
        setChangingPassword(true);
        try {
            await authService.changePassword({ currentPassword, newPassword });
            showToast('Password changed successfully', 'success');
            setCurrentPassword('');
            setNewPassword('');
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to change password';
            showToast(errorMsg, 'error');
        } finally {
            setChangingPassword(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>

            <div className="admin-card" style={{ padding: '0.75rem', maxWidth: '320px', width: '100%' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Change Password</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Current Password</label>
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }} placeholder="Current password" />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>New Password</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }} placeholder="New password" />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={handleChangePassword} disabled={changingPassword} className="admin-btn" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
                        {changingPassword ? 'Changing...' : 'Change Password'}
                    </button>
                </div>
            </div>

            <div className="admin-card" style={{ padding: '0.75rem', maxWidth: '320px', width: '100%' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', alignItems: 'center', justifyContent: 'center' }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{ width: '70px', height: '70px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', position: 'relative', flexShrink: 0 }}
                    >
                        {formData.avatar ? (
                            <img
                                src={formData.avatar}
                                alt="Profile"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Error'; }}
                            />
                        ) : (
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #aaa', color: '#666', fontWeight: 600, fontSize: '0.65rem' }}>
                                No Image
                            </div>
                        )}
                        <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#1B2042', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', border: '2px solid var(--bg-white)' }}>
                            <FaCamera size={9} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>First Name</label>
                        <input
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="form-input"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                            placeholder="First name"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Last Name</label>
                        <input
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="form-input"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                            placeholder="Last name"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Title</label>
                        <input
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="form-input"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                            placeholder="e.g. Developer"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Role</label>
                        <input
                            name="role"
                            value={formData.role || ''}
                            onChange={handleChange}
                            className="form-input"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                            placeholder="e.g. CEO"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Location</label>
                        <input
                            name="location"
                            value={formData.location || ''}
                            onChange={handleChange}
                            className="form-input"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                            placeholder="Kigali, Rwanda"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Greeting</label>
                        <input
                            name="greeting"
                            value={formData.greeting || ''}
                            onChange={handleChange}
                            className="form-input"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                            placeholder="Hi, I'm"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>About Me Title</label>
                        <input
                            name="aboutMeTitle"
                            value={formData.aboutMeTitle || ''}
                            onChange={handleChange}
                            className="form-input"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                            placeholder="About Me"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio || ''}
                            onChange={handleChange}
                            className="form-textarea"
                            rows={3}
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                            placeholder="Short bio / tagline"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>About</label>
                        <textarea
                            name="about"
                            value={formData.about || ''}
                            onChange={handleChange}
                            className="form-textarea"
                            rows={5}
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                            placeholder="Full about description"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Email (Username)</label>
                        <input value={profile.email || ''} className="form-input" disabled style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', opacity: 0.6 }} />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        type="submit"
                        disabled={loading}
                        className="admin-btn"
                        style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                    >
                        {loading ? 'Saving...' : <><FaSave style={{ marginRight: 6 }} /> Save</>}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default GeneralTab;
