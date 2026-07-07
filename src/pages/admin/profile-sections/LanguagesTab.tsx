import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaEdit, FaTimes, FaSave, FaLanguage } from 'react-icons/fa';
import type { Profile } from '../../../services/profileService';
import { profileService } from '../../../services/profileService';

interface LanguagesTabProps {
    profile: Profile;
    onUpdate: (updatedProfile: Profile) => void;
    searchQuery?: string;
}

const PROFICIENCIES = ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic', 'Conversational'];

const LanguagesTab: React.FC<LanguagesTabProps> = ({ profile, onUpdate, searchQuery = '' }) => {
    const [languages, setLanguages] = useState(profile.languages || []);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const filtered = languages.filter((l: any) => {
        const q = searchQuery.toLowerCase();
        if (!q) return true;
        return l.language.toLowerCase().includes(q) || l.proficiency.toLowerCase().includes(q);
    });

    const startNew = () => {
        setEditingIndex(-1);
        setEditForm({ language: '', proficiency: 'Intermediate' });
    };

    const startEdit = (index: number) => {
        setEditingIndex(index);
        setEditForm({ ...languages[index] });
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditForm(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setEditForm((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const saveLang = async () => {
        if (!editForm.language.trim()) { alert('Language name is required'); return; }
        setLoading(true);
        let updated = [...languages];
        if (editingIndex === -1) updated.push(editForm);
        else if (editingIndex !== null) updated[editingIndex] = editForm;
        try {
            const result = await profileService.updateProfile({ languages: updated });
            setLanguages(result.languages || []);
            onUpdate(result);
            cancelEdit();
        } catch (error) {
            console.error('Failed to save language', error);
            alert('Failed to save');
        } finally {
            setLoading(false);
        }
    };

    const deleteLang = async (index: number) => {
        if (!window.confirm(`Delete ${languages[index]?.language}?`)) return;
        setLoading(true);
        const updated = languages.filter((_: any, i: number) => i !== index);
        try {
            const result = await profileService.updateProfile({ languages: updated });
            setLanguages(result.languages || []);
            onUpdate(result);
        } catch (error) {
            console.error('Failed to delete', error);
            alert('Failed to delete');
        } finally {
            setLoading(false);
        }
    };

    const getProficiencyColor = (level: string) => {
        const map: Record<string, string> = {
            Native: '#22c55e', Fluent: '#1B2042', Advanced: '#8b5cf6',
            Intermediate: '#f59e0b', Basic: '#ef4444', Conversational: '#ec4899',
        };
        return map[level] || 'var(--text-muted)';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Languages ({languages.length})</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Manage languages you speak and your proficiency levels</p>
                </div>
                <button onClick={startNew} disabled={editingIndex !== null} className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                    <FaPlus /> Add Language
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
                                {editingIndex === -1 ? 'Add Language' : 'Edit Language'}
                            </h4>
                            <button onClick={cancelEdit} style={{ color: 'var(--text-muted)' }}><FaTimes /></button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Language *</label>
                                <input name="language" value={editForm.language} onChange={handleChange} className="form-input" placeholder="e.g., English, French" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Proficiency</label>
                                <select name="proficiency" value={editForm.proficiency} onChange={handleChange} className="form-select">
                                    {PROFICIENCIES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={cancelEdit} className="admin-icon-btn" style={{ fontSize: '0.9rem', width: 'auto', padding: '0.5rem 1rem' }} disabled={loading}>Cancel</button>
                            <button onClick={saveLang} className="btn-primary" disabled={loading}>
                                {loading ? 'Saving...' : <><FaSave /> Save</>}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        <FaLanguage size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                        <p>No languages added yet. Click "Add Language" to add one.</p>
                    </div>
                )}
                {filtered.map((lang: any, index: number) => (
                    <div key={index} className="content-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0, background: `${getProficiencyColor(lang.proficiency)}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: getProficiencyColor(lang.proficiency), fontSize: '1.2rem' }}>
                            <FaLanguage />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>{lang.language}</h4>
                            <span style={{
                                fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '12px',
                                background: `${getProficiencyColor(lang.proficiency)}20`,
                                color: getProficiencyColor(lang.proficiency), display: 'inline-block', marginTop: '2px'
                            }}>
                                {lang.proficiency}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => startEdit(index)} className="admin-icon-btn" title="Edit"><FaEdit /></button>
                            <button onClick={() => deleteLang(index)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }} title="Delete"><FaTrash /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LanguagesTab;
