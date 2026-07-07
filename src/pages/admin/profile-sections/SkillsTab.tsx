import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTimes, FaSave, FaTrash } from 'react-icons/fa';
import type { Profile } from '../../../services/profileService';
import { profileService } from '../../../services/profileService';

interface SkillsTabProps {
    profile: Profile;
    onUpdate: (updatedProfile: Profile) => void;
    searchQuery?: string;
}

const SkillsTab: React.FC<SkillsTabProps> = ({ profile, onUpdate, searchQuery = '' }) => {
    // Deep copy skills to avoid mutation issues
    const [skills, setSkills] = useState<Record<string, string[]>>(JSON.parse(JSON.stringify(profile.skills || {})));
    const [newCategory, setNewCategory] = useState('');
    const [newSkillInput, setNewSkillInput] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const filteredSkills = Object.entries(skills).filter(([category, categorySkills]) => {
        const query = searchQuery.toLowerCase();
        if (!query) return true;
        return category.toLowerCase().includes(query) || categorySkills.some(s => s.toLowerCase().includes(query));
    });

    const handleAddCategory = () => {
        if (!newCategory.trim()) return;
        const key = newCategory.toLowerCase().replace(/\s+/g, '-');
        if (skills[key]) {
            alert('Category already exists');
            return;
        }
        setSkills(prev => ({ ...prev, [key]: [] }));
        setNewCategory('');
    };

    const deleteCategory = (category: string) => {
        if (!window.confirm(`Delete category "${category}" and all its skills?`)) return;
        setSkills(prev => {
            const next = { ...prev };
            delete next[category];
            return next;
        });
    };

    const addSkill = (category: string) => {
        const skill = newSkillInput[category]?.trim();
        if (!skill) return;

        setSkills(prev => ({
            ...prev,
            [category]: [...(prev[category] || []), skill]
        }));

        setNewSkillInput(prev => ({ ...prev, [category]: '' }));
    };

    const removeSkill = (category: string, skillToRemove: string) => {
        setSkills(prev => ({
            ...prev,
            [category]: prev[category].filter(s => s !== skillToRemove)
        }));
    };

    const handleSkillInputChange = (category: string, value: string) => {
        setNewSkillInput(prev => ({ ...prev, [category]: value }));
    };

    const saveSkills = async () => {
        setLoading(true);
        try {
            const updatedProfile = { ...profile, skills: skills as any };
            const result = await profileService.updateProfile(updatedProfile);
            onUpdate(result);
            alert('Skills updated successfully!');
        } catch (error) {
            console.error('Failed to save skills', error);
            alert('Failed to save skills');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Top Bar: Add Category & Save */}
            <div className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1 }}>
                    <input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="New Category (e.g. 'DevOps')"
                        className="form-input"
                        style={{ width: '250px' }}
                    />
                    <button onClick={handleAddCategory} className="admin-icon-btn" style={{ padding: '0.5rem 1rem', width: 'auto', fontSize: '0.9rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                        <FaPlus /> Add Category
                    </button>
                </div>
                <button onClick={saveSkills} disabled={loading} className="btn-primary">
                    {loading ? 'Saving...' : <><FaSave /> Save Changes</>}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {filteredSkills.map(([category, categorySkills]) => (
                    <motion.div
                        key={category}
                        layout
                        className="content-card"
                        style={{ position: 'relative' }}
                    >
                        <button
                            onClick={() => deleteCategory(category)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-muted)', opacity: 0.5, cursor: 'pointer' }}
                            title="Delete Category"
                            className="hover-trigger"
                        >
                            <FaTrash />
                        </button>

                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', textTransform: 'capitalize' }}>
                            {category.replace(/-/g, ' ')}
                        </h3>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', minHeight: '40px' }}>
                            <AnimatePresence>
                                {categorySkills.map((skill) => (
                                    <motion.span
                                        key={skill}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        style={{
                                            background: 'var(--bg-body)',
                                            border: '1px solid var(--border-color)',
                                            padding: '0.3rem 0.6rem',
                                            borderRadius: '20px',
                                            fontSize: '0.85rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        {skill}
                                        <button
                                            onClick={() => removeSkill(category, skill)}
                                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
                                        >
                                            <FaTimes size={10} />
                                        </button>
                                    </motion.span>
                                ))}
                            </AnimatePresence>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                value={newSkillInput[category] || ''}
                                onChange={(e) => handleSkillInputChange(category, e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addSkill(category)}
                                placeholder="Add skill..."
                                className="form-input"
                                style={{ flex: 1, fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                            />
                            <button onClick={() => addSkill(category)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', minWidth: 'auto' }}>
                                <FaPlus />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default SkillsTab;
