import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaEdit, FaTimes, FaSave, FaCertificate, FaUpload } from 'react-icons/fa';
import type { Profile } from '../../../services/profileService';
import { profileService } from '../../../services/profileService';
import { uploadService } from '../../../services/uploadService';

interface CertificationsTabProps {
    profile: Profile;
    onUpdate: (updatedProfile: Profile) => void;
    searchQuery?: string;
}

const CertificationsTab: React.FC<CertificationsTabProps> = ({ profile, onUpdate, searchQuery = '' }) => {
    const [certs, setCerts] = useState(profile.certifications || []);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredCerts = certs.filter((c: any) => {
        const q = searchQuery.toLowerCase();
        if (!q) return true;
        return c.name.toLowerCase().includes(q) || c.issuer.toLowerCase().includes(q);
    });

    const startNew = () => {
        setEditingIndex(-1);
        setEditForm({ name: '', issuer: '', date: '', credentialUrl: '', imageUrl: '' });
    };

    const startEdit = (index: number) => {
        setEditingIndex(index);
        setEditForm({ ...certs[index] });
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditForm(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditForm((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('Image must be smaller than 2MB');
            return;
        }
        setUploading(true);
        try {
            const uploaded = await uploadService.uploadFile(file);
            setEditForm((prev: any) => ({ ...prev, imageUrl: uploaded.secureUrl }));
        } catch {
            alert('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const saveCert = async () => {
        if (!editForm.name.trim()) { alert('Certification name is required'); return; }
        setLoading(true);
        let updated = [...certs];
        if (editingIndex === -1) updated.push(editForm);
        else if (editingIndex !== null) updated[editingIndex] = editForm;
        try {
            const result = await profileService.updateProfile({ certifications: updated });
            setCerts(result.certifications || []);
            onUpdate(result);
            cancelEdit();
        } catch (error) {
            console.error('Failed to save certification', error);
            alert('Failed to save');
        } finally {
            setLoading(false);
        }
    };

    const deleteCert = async (index: number) => {
        if (!window.confirm('Delete this certification?')) return;
        setLoading(true);
        const updated = certs.filter((_: any, i: number) => i !== index);
        try {
            const result = await profileService.updateProfile({ certifications: updated });
            setCerts(result.certifications || []);
            onUpdate(result);
        } catch (error) {
            console.error('Failed to delete', error);
            alert('Failed to delete');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Certifications ({certs.length})</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Manage professional certifications and credentials</p>
                </div>
                <button onClick={startNew} disabled={editingIndex !== null} className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                    <FaPlus /> Add Certification
                </button>
            </div>

            <AnimatePresence>
                {editingIndex !== null && editForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="content-card"
                        style={{ border: '2px solid var(--primary)', padding: '1.5rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                                {editingIndex === -1 ? 'New Certification' : 'Edit Certification'}
                            </h4>
                            <button onClick={cancelEdit} style={{ color: 'var(--text-muted)' }}><FaTimes /></button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Certification Name *</label>
                                <input name="name" value={editForm.name} onChange={handleChange} className="form-input" placeholder="e.g., AWS Solutions Architect" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Issuer</label>
                                <input name="issuer" value={editForm.issuer} onChange={handleChange} className="form-input" placeholder="e.g., Amazon Web Services" />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Date Earned</label>
                                <input type="date" name="date" value={editForm.date ? editForm.date.split('T')[0] : ''} onChange={handleChange} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Credential URL</label>
                                <input name="credentialUrl" value={editForm.credentialUrl || ''} onChange={handleChange} className="form-input" placeholder="https://verify.certificate.com/..." />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Badge Image</label>
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
                                    <FaUpload /> {editForm.imageUrl ? 'Replace' : 'Upload'}
                                </button>
                                {editForm.imageUrl && (
                                    <button type="button" onClick={() => setEditForm((prev: any) => ({ ...prev, imageUrl: '' }))} className="admin-icon-btn" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                                        <FaTimes /> Remove
                                    </button>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                            <button onClick={cancelEdit} className="admin-icon-btn" style={{ fontSize: '0.9rem', width: 'auto', padding: '0.5rem 1rem' }} disabled={loading}>Cancel</button>
                            <button onClick={saveCert} className="btn-primary" disabled={loading || uploading}>
                                {loading || uploading ? 'Saving...' : <><FaSave /> Save</>}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {filteredCerts.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        <FaCertificate size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                        <p>No certifications yet. Click "Add Certification" to add one.</p>
                    </div>
                )}
                {filteredCerts.map((cert: any, index: number) => (
                    <div key={index} className="content-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                        {cert.imageUrl ? (
                            <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--border-color)' }}>
                                <img src={cert.imageUrl} alt={cert.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        ) : (
                            <div style={{ width: '56px', height: '56px', borderRadius: '8px', flexShrink: 0, background: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '1.3rem' }}>
                                <FaCertificate />
                            </div>
                        )}
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>{cert.name}</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                                {cert.issuer}{cert.date ? ` · ${new Date(cert.date).getFullYear()}` : ''}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => startEdit(index)} className="admin-icon-btn" title="Edit"><FaEdit /></button>
                            <button onClick={() => deleteCert(index)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }} title="Delete"><FaTrash /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CertificationsTab;
