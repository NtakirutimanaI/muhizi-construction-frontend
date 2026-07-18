import { useState, useRef } from 'react';
import { FaPlus, FaTrash, FaEdit, FaTimes, FaSave, FaUsers, FaTwitter, FaLinkedin, FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa';
import type { Profile } from '../../../services/profileService';
import { profileService } from '../../../services/profileService';
import { uploadService } from '../../../services/uploadService';
import { useToast } from '../../../context/ToastContext';

interface TeamTabProps {
    profile: Profile;
    onUpdate: (updatedProfile: Profile) => void;
}

const EMPTY_FORM = { name: '', role: '', imageUrl: '', socialLinks: { twitter: '', linkedin: '', facebook: '', instagram: '', youtube: '' } };

const TeamTab: React.FC<TeamTabProps> = ({ profile, onUpdate }) => {
    const { showToast } = useToast();
    const [members, setMembers] = useState(profile.teamMembers || []);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editForm, setEditForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const startNew = () => {
        setEditingIndex(-1);
        setEditForm(EMPTY_FORM);
    };

    const startEdit = (index: number) => {
        setEditingIndex(index);
        const m = members[index];
        setEditForm({
            name: m.name,
            role: m.role || '',
            imageUrl: m.imageUrl || '',
            socialLinks: {
                twitter: m.socialLinks?.twitter || '',
                linkedin: m.socialLinks?.linkedin || '',
                facebook: m.socialLinks?.facebook || '',
                instagram: m.socialLinks?.instagram || '',
                youtube: m.socialLinks?.youtube || '',
            },
        });
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditForm(EMPTY_FORM);
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleSocialChange = (platform: keyof typeof EMPTY_FORM.socialLinks, value: string) => {
        setEditForm(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, [platform]: value } }));
    };

    const [brands, setBrands] = useState(profile.pageContent?.teamSection?.brands || []);
    const [editingBrandIndex, setEditingBrandIndex] = useState<number | null>(null);
    const [brandForm, setBrandForm] = useState({ name: '', logoUrl: '' });
    const [brandSaving, setBrandSaving] = useState(false);
    const [brandUploading, setBrandUploading] = useState(false);
    const brandFileRef = useRef<HTMLInputElement>(null);

    const startNewBrand = () => { setEditingBrandIndex(-1); setBrandForm({ name: '', logoUrl: '' }); };
    const startEditBrand = (i: number) => { setEditingBrandIndex(i); setBrandForm({ ...brands[i] }); };
    const cancelBrandEdit = () => { setEditingBrandIndex(null); setBrandForm({ name: '', logoUrl: '' }); };

    const handleBrandLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { showToast('Image must be smaller than 2MB', 'error'); return; }
        setBrandUploading(true);
        try {
            const uploaded = await uploadService.uploadFile(file);
            setBrandForm(prev => ({ ...prev, logoUrl: uploaded.secureUrl }));
        } catch {
            showToast('Failed to upload logo', 'error');
        } finally {
            setBrandUploading(false);
        }
    };

    const saveBrands = async (updated: typeof brands) => {
        setBrandSaving(true);
        try {
            const pc = { ...(profile.pageContent || {}), teamSection: { ...(profile.pageContent?.teamSection || {}), brands: updated } };
            const result = await profileService.updateProfile({ pageContent: pc });
            setBrands(result.pageContent?.teamSection?.brands || []);
            onUpdate(result);
            showToast('Client brands saved', 'success');
        } catch (error: any) {
            console.error('Failed to save brands', error);
            showToast(error?.response?.data?.message || error?.message || 'Failed to save', 'error');
        } finally {
            setBrandSaving(false);
        }
    };

    const saveBrandItem = async () => {
        if (!brandForm.name.trim()) { showToast('Brand name is required', 'error'); return; }
        const updated = [...brands];
        if (editingBrandIndex === -1) updated.push(brandForm);
        else if (editingBrandIndex !== null) updated[editingBrandIndex] = brandForm;
        setBrands(updated);
        await saveBrands(updated);
        cancelBrandEdit();
    };

    const deleteBrand = async (i: number) => {
        if (!window.confirm('Remove this brand?')) return;
        const updated = brands.filter((_, idx) => idx !== i);
        setBrands(updated);
        await saveBrands(updated);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            showToast('Image must be smaller than 2MB', 'error');
            return;
        }
        setUploading(true);
        try {
            const uploaded = await uploadService.uploadFile(file);
            setEditForm(prev => ({ ...prev, imageUrl: uploaded.secureUrl }));
        } catch {
            showToast('Failed to upload image', 'error');
        } finally {
            setUploading(false);
        }
    };

    const saveMember = async () => {
        if (!editForm.name.trim()) {
            showToast('Name is required', 'error');
            return;
        }
        setLoading(true);
        const socialLinks = Object.fromEntries(Object.entries(editForm.socialLinks).filter(([, v]) => v.trim())) as Record<string, string>;
        const memberToSave = {
            name: editForm.name,
            role: editForm.role,
            imageUrl: editForm.imageUrl,
            ...(Object.keys(socialLinks).length > 0 ? { socialLinks } : {}),
        };
        let updatedMembers = [...members];
        if (editingIndex === -1) {
            updatedMembers.push(memberToSave);
        } else if (editingIndex !== null) {
            updatedMembers[editingIndex] = memberToSave;
        }
        try {
            const result = await profileService.updateProfile({ teamMembers: updatedMembers });
            setMembers(result.teamMembers || []);
            onUpdate(result);
            cancelEdit();
            showToast('Team member saved', 'success');
        } catch (error: any) {
            console.error('Failed to save team member', error);
            showToast(error?.response?.data?.message || error?.message || 'Failed to save', 'error');
        } finally {
            setLoading(false);
        }
    };

    const deleteMember = async (index: number) => {
        if (!window.confirm('Delete this team member?')) return;
        setLoading(true);
        const updatedMembers = members.filter((_, i) => i !== index);
        try {
            const result = await profileService.updateProfile({ teamMembers: updatedMembers });
            setMembers(result.teamMembers || []);
            onUpdate(result);
            showToast('Team member deleted', 'success');
        } catch (error: any) {
            console.error('Failed to delete', error);
            showToast(error?.response?.data?.message || error?.message || 'Failed to delete', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Team Members ({members.length})</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Manage your team displayed on the landing page</p>
                </div>
                <button onClick={startNew} disabled={editingIndex !== null} className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                    <FaPlus /> Add Member
                </button>
            </div>

            {/* Editor */}
            {editingIndex !== null && (
                <div className="content-card" style={{ border: '2px solid var(--primary)', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                            {editingIndex === -1 ? 'New Team Member' : 'Edit Team Member'}
                        </h4>
                        <button onClick={cancelEdit} style={{ color: 'var(--text-muted)' }}><FaTimes /></button>
                    </div>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Name *</label>
                            <input name="name" value={editForm.name} onChange={handleChange} className="form-input" placeholder="e.g., Alice Mugisha" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Role / Position</label>
                            <input name="role" value={editForm.role} onChange={handleChange} className="form-input" placeholder="e.g., Founder & CEO" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Photo</label>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {editForm.imageUrl ? (
                                    <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--border-color)', flexShrink: 0 }}>
                                        <img src={editForm.imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ) : (
                                    <div style={{ width: '80px', height: '80px', borderRadius: '8px', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', flexShrink: 0 }}>
                                        No image
                                    </div>
                                )}
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                                    Choose File
                                </button>
                                {editForm.imageUrl && (
                                    <button type="button" onClick={() => setEditForm(prev => ({ ...prev, imageUrl: '' }))} className="admin-icon-btn" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                                        <FaTimes /> Remove
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Social Media</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FaTwitter style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                    <input value={editForm.socialLinks.twitter} onChange={e => handleSocialChange('twitter', e.target.value)} className="form-input" placeholder="Twitter / X URL" />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FaLinkedin style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                    <input value={editForm.socialLinks.linkedin} onChange={e => handleSocialChange('linkedin', e.target.value)} className="form-input" placeholder="LinkedIn URL" />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FaFacebook style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                    <input value={editForm.socialLinks.facebook} onChange={e => handleSocialChange('facebook', e.target.value)} className="form-input" placeholder="Facebook URL" />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FaInstagram style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                    <input value={editForm.socialLinks.instagram} onChange={e => handleSocialChange('instagram', e.target.value)} className="form-input" placeholder="Instagram URL" />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FaYoutube style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                    <input value={editForm.socialLinks.youtube} onChange={e => handleSocialChange('youtube', e.target.value)} className="form-input" placeholder="YouTube URL" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                        <button onClick={cancelEdit} className="admin-icon-btn" style={{ fontSize: '0.9rem', width: 'auto', padding: '0.5rem 1rem' }} disabled={loading}>Cancel</button>
                        <button onClick={saveMember} className="btn-primary" disabled={loading || uploading}>
                            {loading || uploading ? 'Saving...' : <><FaSave /> Save</>}
                        </button>
                    </div>
                </div>
            )}

            {/* Members List */}
            <div style={{ display: 'grid', gap: '1rem' }}>
                {members.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        <FaUsers size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                        <p>No team members yet. Click "Add Member" to create one.</p>
                    </div>
                )}
                {members.map((member, index) => (
                    <div key={index} className="content-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--border-color)' }}>
                            {member.imageUrl ? (
                                <img src={member.imageUrl} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 700 }}>
                                    {member.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>{member.name}</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{member.role || '—'}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => startEdit(index)} className="admin-icon-btn" title="Edit"><FaEdit /></button>
                            <button onClick={() => deleteMember(index)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }} title="Delete"><FaTrash /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Client Brands */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Client Brands ({brands.length})</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>The "we're proud to work with best-in-class clients" logo strip shown under the team section.</p>
                    </div>
                    <button onClick={startNewBrand} disabled={editingBrandIndex !== null} className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                        <FaPlus /> Add Brand
                    </button>
                </div>

                {editingBrandIndex !== null && (
                    <div className="content-card" style={{ border: '2px solid var(--primary)', padding: '1rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <h4 style={{ fontWeight: 700 }}>{editingBrandIndex === -1 ? 'New Brand' : 'Edit Brand'}</h4>
                            <button onClick={cancelBrandEdit} style={{ color: 'var(--text-muted)' }}><FaTimes /></button>
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Brand Name</label>
                            <input value={brandForm.name} onChange={e => setBrandForm(p => ({ ...p, name: e.target.value }))} className="form-input" placeholder="e.g., Meridian Group" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Logo (optional — shown as text if left empty)</label>
                            <input ref={brandFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBrandLogoUpload} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {brandForm.logoUrl ? (
                                    <div style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', border: '2px solid var(--border-color)', flexShrink: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img src={brandForm.logoUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    </div>
                                ) : (
                                    <div style={{ width: 60, height: 60, borderRadius: 8, border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.7rem', flexShrink: 0 }}>No logo</div>
                                )}
                                <button type="button" onClick={() => brandFileRef.current?.click()} disabled={brandUploading} className="admin-icon-btn" style={{ width: 'auto', padding: '0.5rem 1rem', gap: '8px', border: '1px solid var(--border-color)' }}>
                                    {brandUploading ? 'Uploading...' : brandForm.logoUrl ? 'Replace Logo' : 'Upload Logo'}
                                </button>
                                {brandForm.logoUrl && (
                                    <button type="button" onClick={() => setBrandForm(p => ({ ...p, logoUrl: '' }))} className="admin-icon-btn" style={{ width: 'auto', padding: '0.5rem 1rem' }}><FaTimes /> Remove</button>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                            <button onClick={cancelBrandEdit} className="admin-icon-btn" style={{ fontSize: '0.85rem', width: 'auto', padding: '0.4rem 0.8rem' }}>Cancel</button>
                            <button onClick={saveBrandItem} disabled={brandSaving || brandUploading} className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                                {brandSaving ? 'Saving...' : <><FaSave /> Save Brand</>}
                            </button>
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {brands.length === 0 && (
                        <div style={{ padding: '1.25rem', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No client brands yet.</div>
                    )}
                    {brands.map((brand, i) => (
                        <div key={i} className="content-card" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem 0.8rem' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                {brand.logoUrl ? <img src={brand.logoUrl} alt={brand.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : brand.name.charAt(0)}
                            </div>
                            <div style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem' }}>{brand.name}</div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => startEditBrand(i)} className="admin-icon-btn" title="Edit"><FaEdit /></button>
                                <button onClick={() => deleteBrand(i)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }} title="Delete"><FaTrash /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TeamTab;
