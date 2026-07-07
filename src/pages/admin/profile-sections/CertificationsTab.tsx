import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaUpload } from 'react-icons/fa';
import type { Profile } from '../../../services/profileService';
import { profileService } from '../../../services/profileService';
import { uploadService } from '../../../services/uploadService';

interface CertificationsTabProps {
    profile: Profile;
    onUpdate: (updatedProfile: Profile) => void;
}

const CertificationsTab: React.FC<CertificationsTabProps> = ({ profile, onUpdate }) => {
    const [certs, setCerts] = useState(profile.certifications || []);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [form, setForm] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const startNew = () => {
        setEditingIndex(-1);
        setForm({ name: '', issuer: '', date: '', credentialUrl: '', imageUrl: '' });
    };

    const startEdit = (i: number) => {
        setEditingIndex(i);
        setForm({ ...certs[i] });
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setForm(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((p: any) => ({ ...p, [name]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const uploaded = await uploadService.uploadFile(file);
            setForm((p: any) => ({ ...p, imageUrl: uploaded.secureUrl }));
        } catch {
            alert('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const saveCert = async () => {
        if (!form?.name || !form?.issuer) { alert('Name and Issuer are required'); return; }
        setLoading(true);
        const updated = [...certs];
        if (editingIndex === -1) updated.push(form);
        else if (editingIndex !== null) updated[editingIndex] = form;
        try {
            const result = await profileService.updateProfile({ certifications: updated });
            setCerts(result.certifications);
            onUpdate(result);
            cancelEdit();
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Failed to save');
        } finally {
            setLoading(false);
        }
    };

    const deleteCert = async (i: number) => {
        if (!window.confirm('Delete this certification?')) return;
        setLoading(true);
        const updated = certs.filter((_, idx) => idx !== i);
        try {
            const result = await profileService.updateProfile({ certifications: updated });
            setCerts(result.certifications);
            onUpdate(result);
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Failed to delete');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Certifications ({certs.length})</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Manage your certifications and licenses</p>
                </div>
                <button onClick={startNew} disabled={editingIndex !== null} className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                    <FaPlus /> Add Certification
                </button>
            </div>

            <AnimatePresence>
                {editingIndex !== null && form && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="content-card" style={{ border: '2px solid var(--primary)', marginBottom: '2rem', padding: '1.5rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            <h4 style={{ fontWeight: 800 }}>{editingIndex === -1 ? 'New Certification' : 'Edit Certification'}</h4>
                            <button onClick={cancelEdit} style={{ color: 'var(--text-muted)' }}><FaTimes /></button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Name *</label>
                                <input name="name" value={form.name} onChange={handleChange} className="form-input" placeholder="e.g. PMP Certification" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Issuer *</label>
                                <input name="issuer" value={form.issuer} onChange={handleChange} className="form-input" placeholder="e.g. PMI" />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Date</label>
                                <input type="date" name="date" value={form.date || ''} onChange={handleChange} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Credential URL</label>
                                <input name="credentialUrl" value={form.credentialUrl || ''} onChange={handleChange} className="form-input" placeholder="https://verify.certification.com/..." />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Certificate Image</label>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                {form.imageUrl && (
                                    <div style={{ width: 100, height: 70, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                                        <img src={form.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="admin-icon-btn" style={{ width: 'auto', padding: '0.5rem 1rem', gap: '8px' }}>
                                    <FaUpload /> {uploading ? 'Uploading...' : form.imageUrl ? 'Replace Image' : 'Upload Image'}
                                </button>
                                {form.imageUrl && (
                                    <button type="button" onClick={() => setForm((p: any) => ({ ...p, imageUrl: '' }))} className="admin-icon-btn" style={{ width: 'auto', padding: '0.5rem 1rem', color: 'var(--primary-red)' }}>Remove</button>
                                )}
                            </div>
                            <input name="imageUrl" value={form.imageUrl || ''} onChange={handleChange} className="form-input" style={{ marginTop: '0.5rem' }} placeholder="Or paste image URL directly" />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={cancelEdit} className="admin-icon-btn" style={{ fontSize: '0.9rem', width: 'auto', padding: '0.5rem 1rem' }} disabled={loading}>Cancel</button>
                            <button onClick={saveCert} className="btn-primary" disabled={loading || uploading}>
                                {loading ? 'Saving...' : <><FaSave /> Save</>}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                {certs.map((cert, i) => (
                    <div key={i} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                            {cert.imageUrl ? (
                                <img src={cert.imageUrl} alt={cert.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                                <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--bg-body)', flexShrink: 0 }} />
                            )}
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{cert.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cert.issuer}{cert.date ? ` \u2022 ${new Date(cert.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}` : ''}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => startEdit(i)} className="admin-icon-btn"><FaEdit /></button>
                            <button onClick={() => deleteCert(i)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }}><FaTrash /></button>
                        </div>
                    </div>
                ))}
                {certs.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)' }}>No certifications yet.</div>
                )}
            </div>
        </div>
    );
};

export default CertificationsTab;
