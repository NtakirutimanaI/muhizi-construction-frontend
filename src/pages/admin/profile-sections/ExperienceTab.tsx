import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaEdit, FaBriefcase, FaGraduationCap } from 'react-icons/fa';
import type { Profile } from '../../../services/profileService';
import { profileService } from '../../../services/profileService';

interface ExperienceTabProps {
    profile: Profile;
    onUpdate: (updatedProfile: Profile) => void;
    searchQuery?: string;
}

const ExperienceTab: React.FC<ExperienceTabProps> = ({ profile, onUpdate, searchQuery = '' }) => {
    const [experience, setExperience] = useState(profile.experience || []);
    const [education, setEducation] = useState(profile.education || []);
    const [loading, setLoading] = useState(false);

    // Experience State
    const [editExpIndex, setEditExpIndex] = useState<number | null>(null);
    const [expForm, setExpForm] = useState<any>(null);

    // Education State
    const [editEduIndex, setEditEduIndex] = useState<number | null>(null);
    const [eduForm, setEduForm] = useState<any>(null);

    const filteredExperience = experience.filter((exp: any) => {
        const query = searchQuery.toLowerCase();
        if (!query) return true;
        return exp.title.toLowerCase().includes(query) ||
            exp.company.toLowerCase().includes(query) ||
            exp.location.toLowerCase().includes(query) ||
            (exp.responsibilities && exp.responsibilities.some((r: string) => r.toLowerCase().includes(query)));
    });

    const filteredEducation = education.filter((edu: any) => {
        const query = searchQuery.toLowerCase();
        if (!query) return true;
        return edu.degree.toLowerCase().includes(query) ||
            edu.institution.toLowerCase().includes(query) ||
            edu.location.toLowerCase().includes(query);
    });

    // --- Handlers for Experience ---
    const startExpEdit = (index: number) => {
        setEditExpIndex(index);
        setExpForm({ ...experience[index] });
    };
    const startNewExp = () => {
        setEditExpIndex(-1);
        setExpForm({ title: '', company: '', location: '', startDate: '', endDate: '', current: false, responsibilities: [], technologies: [] });
    };
    const cancelExp = () => { setEditExpIndex(null); setExpForm(null); };

    const saveExperience = async () => {
        setLoading(true);
        const updatedExp = [...experience];
        if (editExpIndex === -1) updatedExp.push(expForm);
        else if (editExpIndex !== null) updatedExp[editExpIndex] = expForm;

        try {
            const result = await profileService.updateProfile({ ...profile, experience: updatedExp });
            setExperience(result.experience);
            onUpdate(result);
            cancelExp();
        } catch (e) { console.error(e); alert('Failed to save'); }
        finally { setLoading(false); }
    };

    const deleteExperience = async (index: number) => {
        if (!window.confirm('Delete this experience?')) return;
        setLoading(true);
        const updatedExp = experience.filter((_: any, i: number) => i !== index);
        try {
            const result = await profileService.updateProfile({ ...profile, experience: updatedExp });
            setExperience(result.experience);
            onUpdate(result);
        } catch (e) { console.error(e); alert('Failed to delete'); }
        finally { setLoading(false); }
    };

    // --- Handlers for Education ---
    const startEduEdit = (index: number) => {
        setEditEduIndex(index);
        setEduForm({ ...education[index] });
    };
    const startNewEdu = () => {
        setEditEduIndex(-1);
        setEduForm({ degree: '', institution: '', location: '', graduationYear: new Date().getFullYear(), description: '' });
    };
    const cancelEdu = () => { setEditEduIndex(null); setEduForm(null); };

    const saveEducation = async () => {
        setLoading(true);
        const updatedEdu = [...education];
        if (editEduIndex === -1) updatedEdu.push(eduForm);
        else if (editEduIndex !== null) updatedEdu[editEduIndex] = eduForm;

        try {
            const result = await profileService.updateProfile({ ...profile, education: updatedEdu });
            setEducation(result.education);
            onUpdate(result);
            cancelEdu();
        } catch (e) { console.error(e); alert('Failed to save'); }
        finally { setLoading(false); }
    };

    const deleteEducation = async (index: number) => {
        if (!window.confirm('Delete this education?')) return;
        setLoading(true);
        const updatedEdu = education.filter((_: any, i: number) => i !== index);
        try {
            const result = await profileService.updateProfile({ ...profile, education: updatedEdu });
            setEducation(result.education);
            onUpdate(result);
        } catch (e) { console.error(e); alert('Failed to delete'); }
        finally { setLoading(false); }
    };

    const ResponsibilitiesInput = ({ value, onChange }: { value: string[], onChange: (v: string[]) => void }) => (
        <textarea
            className="form-textarea"
            value={value.join('\n')}
            onChange={e => onChange(e.target.value.split('\n').filter(x => x.trim()))}
            placeholder="One responsibility per line"
            rows={4}
            style={{ width: '100%' }}
        />
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {/* WORK EXPERIENCE SECTION */}
            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaBriefcase style={{ color: 'var(--primary-teal)' }} /> Work Experience
                    </h3>
                    <button onClick={startNewExp} disabled={editExpIndex !== null || loading} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                        <FaPlus /> Add
                    </button>
                </div>

                {/* EXP EDITOR */}
                <AnimatePresence>
                    {editExpIndex !== null && expForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="content-card"
                            style={{ marginBottom: '1.5rem', border: '1px solid var(--primary-teal)' }}
                        >
                            <h4 style={{ fontWeight: 700, marginBottom: '1rem' }}>{editExpIndex === -1 ? 'Add Job' : 'Edit Job'}</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Title</label>
                                    <input className="form-input" value={expForm.title} onChange={e => setExpForm({ ...expForm, title: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Company</label>
                                    <input className="form-input" value={expForm.company} onChange={e => setExpForm({ ...expForm, company: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Location</label>
                                    <input className="form-input" value={expForm.location} onChange={e => setExpForm({ ...expForm, location: e.target.value })} />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Start Date</label>
                                        <input type="date" className="form-input" value={expForm.startDate.split('T')[0]} onChange={e => setExpForm({ ...expForm, startDate: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">End Date</label>
                                        <input type="date" disabled={expForm.current} className="form-input" value={expForm.endDate ? expForm.endDate.split('T')[0] : ''} onChange={e => setExpForm({ ...expForm, endDate: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    <input type="checkbox" checked={expForm.current} onChange={e => setExpForm({ ...expForm, current: e.target.checked })} />
                                    I currently work here
                                </label>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Responsibilities (One per line)</label>
                                <ResponsibilitiesInput value={expForm.responsibilities || []} onChange={v => setExpForm({ ...expForm, responsibilities: v })} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button onClick={cancelExp} className="admin-icon-btn" style={{ fontSize: '0.9rem', width: 'auto', padding: '0.5rem 1rem' }} disabled={loading}>Cancel</button>
                                <button onClick={saveExperience} className="btn-primary" disabled={loading}>Save</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredExperience.map((exp: any, i: number) => (
                        <div key={i} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h4 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.2rem' }}>{exp.title}</h4>
                                <div style={{ color: 'var(--primary-teal)', fontWeight: 500, marginBottom: '0.2rem' }}>{exp.company}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(exp.startDate).getFullYear()} - {exp.current ? 'Present' : new Date(exp.endDate || '').getFullYear()}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => startExpEdit(i)} disabled={loading} className="admin-icon-btn" title="Edit"><FaEdit /></button>
                                <button onClick={() => deleteExperience(i)} disabled={loading} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }} title="Delete"><FaTrash /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* EDUCATION SECTION */}
            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaGraduationCap style={{ color: 'var(--primary)' }} /> Education
                    </h3>
                    <button onClick={startNewEdu} disabled={editEduIndex !== null || loading} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                        <FaPlus /> Add
                    </button>
                </div>

                {/* EDU EDITOR */}
                <AnimatePresence>
                    {editEduIndex !== null && eduForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="content-card"
                            style={{ marginBottom: '1.5rem', border: '1px solid var(--primary)' }}
                        >
                            <h4 style={{ fontWeight: 700, marginBottom: '1rem' }}>{editEduIndex === -1 ? 'Add Education' : 'Edit Education'}</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Degree</label>
                                    <input className="form-input" value={eduForm.degree} onChange={e => setEduForm({ ...eduForm, degree: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Institution</label>
                                    <input className="form-input" value={eduForm.institution} onChange={e => setEduForm({ ...eduForm, institution: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Location</label>
                                    <input className="form-input" value={eduForm.location} onChange={e => setEduForm({ ...eduForm, location: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Graduation Year</label>
                                    <input type="number" className="form-input" value={eduForm.graduationYear} onChange={e => setEduForm({ ...eduForm, graduationYear: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description (Optional)</label>
                                <textarea className="form-textarea" rows={3} value={eduForm.description || ''} onChange={e => setEduForm({ ...eduForm, description: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button onClick={cancelEdu} className="admin-icon-btn" style={{ fontSize: '0.9rem', width: 'auto', padding: '0.5rem 1rem' }} disabled={loading}>Cancel</button>
                                <button onClick={saveEducation} className="btn-primary" disabled={loading}>Save</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredEducation.map((edu: any, i: number) => (
                        <div key={i} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h4 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.2rem' }}>{edu.degree}</h4>
                                <div style={{ color: 'var(--primary)', fontWeight: 500, marginBottom: '0.2rem' }}>{edu.institution}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{edu.graduationYear}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => startEduEdit(i)} disabled={loading} className="admin-icon-btn" title="Edit"><FaEdit /></button>
                                <button onClick={() => deleteEducation(i)} disabled={loading} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }} title="Delete"><FaTrash /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default ExperienceTab;
