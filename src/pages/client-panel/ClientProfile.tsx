import { useState, useEffect, useRef } from 'react';
import { FaSave, FaCamera } from 'react-icons/fa';
import { profileService } from '../../services/profileService';
import { uploadService } from '../../services/uploadService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { loadPageCache, savePageCache } from '../../utils/pageCache';
import Loading from '../../components/Loading';
import type { Profile } from '../../services/profileService';

const ClientProfile = () => {
  const { updateUser, user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    title: '',
    bio: '',
    avatar: '',
  });

  useEffect(() => {
    const cached = loadPageCache<{ profile: Profile; formData: { firstName: string; lastName: string; email: string; phone: string; location: string; title: string; bio: string; avatar: string } }>('pg_client_profile');
    if (cached) {
      setProfile(cached.profile);
      setFormData(cached.formData);
      updateUser({ firstName: cached.profile.firstName, lastName: cached.profile.lastName, email: cached.profile.email, avatar: cached.profile.avatar });
    }

    profileService.getMyProfile()
      .then(data => {
        setProfile(data);
        const newFormData = {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          location: data.location || '',
          title: data.title || '',
          bio: data.bio || '',
          avatar: data.avatar || '',
        };
        setFormData(newFormData);
        updateUser({ firstName: data.firstName, lastName: data.lastName, email: data.email, avatar: data.avatar });
        savePageCache('pg_client_profile', { profile: data, formData: newFormData });
      })
      .catch(() => showToast('Failed to load profile', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Image must be smaller than 2MB', 'error'); return; }
    setUploading(true);
    try {
      const uploaded = await uploadService.uploadFile(file);
      setFormData(p => ({ ...p, avatar: uploaded.secureUrl }));
      showToast('Avatar uploaded', 'success');
    } catch {
      const reader = new FileReader();
      reader.onload = () => { setFormData(p => ({ ...p, avatar: reader.result as string })); showToast('Avatar set', 'success'); setUploading(false); };
      reader.onerror = () => { showToast('Failed to read image', 'error'); setUploading(false); };
      reader.readAsDataURL(file);
      return;
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await profileService.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        avatar: formData.avatar,
        title: formData.title,
        bio: formData.bio,
        location: formData.location,
      });
      setProfile(updated);
      updateUser({ firstName: updated.firstName, lastName: updated.lastName, email: updated.email, avatar: updated.avatar });
      showToast('Profile updated', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update', 'error');
    }
    setSaving(false);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', alignItems: 'start' }}>
          <div className="content-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
              <div onClick={() => fileInputRef.current?.click()} style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', position: 'relative', flexShrink: 0, border: '2px dashed var(--border-color)' }}>
                {formData.avatar ? (
                  <img src={formData.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'var(--bg-sidebar)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '1.25rem', fontWeight: 700 }}>
                    {user?.firstName?.[0] || 'C'}
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: 2, right: 2, background: 'var(--primary)', color: '#fff', width: 20, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>
                  <FaCamera size={8} />
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{formData.firstName || 'Your'} {formData.lastName || 'Name'}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formData.email}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--primary)', marginTop: '0.15rem', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                  {uploading ? 'Uploading...' : 'Change photo'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input name="firstName" className="form-input" value={formData.firstName} onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))} placeholder="First Name" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input name="lastName" className="form-input" value={formData.lastName} onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))} placeholder="Last Name" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input value={formData.email} disabled placeholder="Email" className="form-input" style={{ background: 'var(--bg-sidebar)', color: 'var(--text-muted)' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input name="phone" className="form-input" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" />
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input name="title" className="form-input" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Title" />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input name="location" className="form-input" value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} placeholder="Location" />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.65rem' }}>
              <label className="form-label">Bio</label>
              <textarea name="bio" className="form-input" placeholder="Write a short bio..." value={formData.bio} onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))} rows={3} style={{ resize: 'vertical' }} />
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={saving} className="admin-btn admin-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FaSave size={12} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ClientProfile;
