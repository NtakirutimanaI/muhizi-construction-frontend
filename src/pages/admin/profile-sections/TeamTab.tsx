import { useState, useRef } from 'react';
import { FaPlus, FaTrash, FaEdit, FaTimes, FaSave, FaUsers } from 'react-icons/fa';
import type { Profile } from '../../../services/profileService';
import { profileService } from '../../../services/profileService';

interface TeamTabProps {
    profile: Profile;
    onUpdate: (updatedProfile: Profile) => void;
}

const TeamTab: React.FC<TeamTabProps> = ({ profile, onUpdate }) => {
    const [members, setMembers] = useState(profile.teamMembers || []);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ name: '', role: '', imageUrl: '' });
    const [loading, setLoading] = useState(false);

    const startNew = () => {
        setEditingIndex(-1);
        setEditForm({ name: '', role: '', imageUrl: '' });
    };

    const startEdit = (index: number) => {
        setEditingIndex(index);
        setEditForm({ name: members[index].name, role: members[index].role || '', imageUrl: members[index].imageUrl || '' });
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditForm({ name: '', role: '', imageUrl: '' });
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('Image must be smaller than 2MB');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setEditForm(prev => ({ ...prev, imageUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const saveMember = async () => {
        if (!editForm.name.trim()) {
            alert('Name is required');
            return;
        }
        setLoading(true);
        let updatedMembers = [...members];
        if (editingIndex === -1) {
            updatedMembers.push(editForm);
        } else if (editingIndex !== null) {
            updatedMembers[editingIndex] = editForm;
        }
        try {
            const result = await profileService.updateProfile({ teamMembers: updatedMembers });
            setMembers(result.teamMembers || []);
            onUpdate(result);
            cancelEdit();
            alert('✅ Team member saved');
        } catch (error) {
            console.error('Failed to save team member', error);
            alert('❌ Failed to save');
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
            alert('✅ Team member deleted');
        } catch (error) {
            console.error('Failed to delete', error);
            alert('❌ Failed to delete');
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
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                        <button onClick={cancelEdit} className="admin-icon-btn" style={{ fontSize: '0.9rem', width: 'auto', padding: '0.5rem 1rem' }} disabled={loading}>Cancel</button>
                        <button onClick={saveMember} className="btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : <><FaSave /> Save</>}
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
        </div>
    );
};

export default TeamTab;
