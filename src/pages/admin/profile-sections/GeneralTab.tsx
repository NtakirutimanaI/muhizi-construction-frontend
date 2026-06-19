import { useState, useRef } from 'react';

import { FaSave, FaCamera } from 'react-icons/fa';
import type { Profile } from '../../../services/profileService';
import { profileService } from '../../../services/profileService';
import { authService } from '../../../services/authService';
import { useToast } from '../../../context/ToastContext';

interface GeneralTabProps {
    profile: Profile;
    onUpdate: (updatedProfile: Profile) => void;
}

const GeneralTab: React.FC<GeneralTabProps> = ({ profile, onUpdate }) => {
    const [formData, setFormData] = useState(profile);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showToast('Image must be smaller than 2MB', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatar: reader.result as string }));
            };
            reader.readAsDataURL(file);
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
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>

            <div className="content-card" style={{ padding: '1.5rem', maxWidth: '500px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Change Password</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Current Password</label>
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="form-input" placeholder="123Rw@nd@" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="form-input" placeholder="Enter new password" />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={handleChangePassword} disabled={changingPassword} className="btn-primary" style={{ background: 'var(--primary-teal)' }}>
                        {changingPassword ? 'Changing...' : 'Change Password'}
                    </button>
                </div>
            </div>

            <div className="content-card" style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', position: 'relative', flexShrink: 0 }}
                    >
                        {formData.avatar ? (
                            <img
                                src={formData.avatar}
                                alt="Profile"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Error'; }}
                            />
                        ) : (
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #aaa', color: '#666', fontWeight: 600 }}>
                                No Image
                            </div>
                        )}
                        <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary-teal)', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', border: '2px solid var(--bg-white)' }}>
                            <FaCamera size={14} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">First Name</label>
                        <input
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Last Name</label>
                        <input
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Professional Title</label>
                        <input
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email (Username)</label>
                        <input value={profile.email || ''} className="form-input" disabled style={{ opacity: 0.6 }} />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Saving...' : <><FaSave /> Save Changes</>}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default GeneralTab;
