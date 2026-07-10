import { useState, useEffect, useRef } from 'react';
import { FaSave, FaCamera, FaUser, FaEnvelope, FaMapMarkerAlt, FaBriefcase } from 'react-icons/fa';
import { profileService } from '../../services/profileService';
import { uploadService } from '../../services/uploadService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Loading from '../../components/Loading';
import type { Profile } from '../../services/profileService';

const ClientProfile = () => {
  const { updateUser, user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
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
    profileService.getMyProfile()
      .then(data => {
        setProfile(data);
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          location: data.location || '',
          title: data.title || '',
          bio: data.bio || '',
          avatar: data.avatar || '',
        });
        updateUser({ firstName: data.firstName, lastName: data.lastName, email: data.email, avatar: data.avatar });
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

  if (loading) return <Loading />;

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', alignItems: 'start' }}>
          {/* Avatar + Profile fields */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem' }}>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
              <div onClick={() => fileInputRef.current?.click()} style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', position: 'relative', flexShrink: 0, border: '2px dashed #e2e8f0' }}>
                {formData.avatar ? (
                  <img src={formData.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '1.25rem', fontWeight: 700 }}>
                    {user?.firstName?.[0] || 'C'}
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: 2, right: 2, background: '#059669', color: '#fff', width: 20, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>
                  <FaCamera size={8} />
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>{formData.firstName || 'Your'} {formData.lastName || 'Name'}</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{formData.email}</div>
                <div style={{ fontSize: '0.65rem', color: '#059669', marginTop: '0.15rem', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                  {uploading ? 'Uploading...' : 'Change photo'}
                </div>
              </div>
            </div>

            {/* Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>First Name</label>
                <input name="firstName" value={formData.firstName} onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))}
                  placeholder="First Name"
                  style={{ width: '100%', padding: '0.45rem 0.55rem', fontSize: '0.78rem', border: '1px solid #e2e8f0', borderRadius: 6, outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Last Name</label>
                <input name="lastName" value={formData.lastName} onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))}
                  placeholder="Last Name"
                  style={{ width: '100%', padding: '0.45rem 0.55rem', fontSize: '0.78rem', border: '1px solid #e2e8f0', borderRadius: 6, outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Email</label>
                <input value={formData.email} disabled placeholder="Email"
                  style={{ width: '100%', padding: '0.45rem 0.55rem', fontSize: '0.78rem', border: '1px solid #e2e8f0', borderRadius: 6, outline: 'none', background: '#f1f5f9', color: '#94a3b8', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Phone</label>
                <input name="phone" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  placeholder="Phone"
                  style={{ width: '100%', padding: '0.45rem 0.55rem', fontSize: '0.78rem', border: '1px solid #e2e8f0', borderRadius: 6, outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Title</label>
                <input name="title" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder="Title"
                  style={{ width: '100%', padding: '0.45rem 0.55rem', fontSize: '0.78rem', border: '1px solid #e2e8f0', borderRadius: 6, outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Location</label>
                <input name="location" value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                  placeholder="Location"
                  style={{ width: '100%', padding: '0.45rem 0.55rem', fontSize: '0.78rem', border: '1px solid #e2e8f0', borderRadius: 6, outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginTop: '0.65rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>Bio</label>
              <textarea name="bio" placeholder="Write a short bio..." value={formData.bio} onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))} rows={3}
                style={{ width: '100%', padding: '0.45rem 0.55rem', fontSize: '0.78rem', border: '1px solid #e2e8f0', borderRadius: 6, outline: 'none', background: '#f8fafc', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 600, background: '#059669', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
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
