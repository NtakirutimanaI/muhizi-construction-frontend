import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import {
    FaUser, FaBriefcase, FaGraduationCap, FaCode, FaProjectDiagram,
    FaCertificate, FaLanguage, FaCog,     FaPlus, FaEdit, FaTrash,
    FaTimes, FaCamera, FaSave, FaUsers
} from 'react-icons/fa';
import { profileService } from '../../services/profileService';
import type { Profile } from '../../services/profileService';
import Loading from '../../components/Loading';
import { useToast } from '../../context/ToastContext';
import TeamTab from './profile-sections/TeamTab';

type SectionId = 'intro' | 'about' | 'education' | 'skills' | 'projects' | 'certifications' | 'languages' | 'team' | 'settings';

const SECTION_COLORS: Record<string, string> = {
    intro: 'var(--primary)', about: 'var(--primary-teal)', education: 'var(--primary)',
    skills: 'var(--primary-red)', projects: 'var(--primary-teal)', certifications: '#764ba2',
    languages: '#f093fb', team: '#ff6b6b', settings: 'var(--primary)',
};

const SECTION_ICONS: Record<string, React.ReactNode> = {
    intro: <FaUser />, about: <FaBriefcase />, education: <FaGraduationCap />,
    skills: <FaCode />, projects: <FaProjectDiagram />, certifications: <FaCertificate />,
    languages: <FaLanguage />, team: <FaUsers />, settings: <FaCog />,
};

const SECTIONS: SectionId[] = ['intro', 'about', 'education', 'skills', 'projects', 'certifications', 'languages', 'team', 'settings'];

const emptyP: Profile = {
    id: '', firstName: '', lastName: '', username: '', email: '', bio: '', greeting: '', aboutMeTitle: '', title: '',
    location: '', phone: '', website: '', avatar: '', cvUrl: '', yearsOfExperience: 0,
    availableForHire: false, isPublic: false, about: '', education: [], experience: [],
    skills: { backend: [], frontend: [], databases: [], tools: [] }, projects: [], certifications: [], languages: [], teamMembers: [], socialLinks: {}, services: [],
    createdAt: '', updatedAt: '', role: '', type: '',
};

const Resources = () => {
    const { searchQuery } = useOutletContext<{ searchQuery: string }>();
    const { showToast } = useToast();
    const [profile, setProfile] = useState<Profile>(emptyP);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState<SectionId>('intro');

    useEffect(() => { loadProfile(); }, []);

    const loadProfile = async () => {
        try { setProfile(await profileService.getMyProfile()); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const saveProfile = async (updates: Partial<Profile>) => {
        setSaving(true);
        try {
            await profileService.updateProfile(updates);
            const fresh = await profileService.getMyProfile();
            setProfile(fresh);
            window.dispatchEvent(new CustomEvent('profile-updated'));
            showToast('Saved successfully!', 'success');
        } catch (e: any) { showToast(e?.response?.data?.message || 'Failed to save', 'error'); }
        finally { setSaving(false); }
    };

    if (loading) return <Loading />;

    const renderSection = () => {
        switch (filter) {
            case 'intro': return <IntroEditor profile={profile} onSave={saveProfile} saving={saving} />;
            case 'about': return <AboutEditor about={profile.about} onSave={saveProfile} saving={saving} />;
            case 'education': return <ArrayEditor title="Education" items={profile.education} color={SECTION_COLORS.education} icon={SECTION_ICONS.education}
                fields={[
                    { key: 'degree', label: 'Degree' }, { key: 'institution', label: 'Institution' }, { key: 'location', label: 'Location' },
                    { key: 'graduationYear', label: 'Graduation Year', type: 'number' },
                ]}
                defaultItem={{ degree: '', institution: '', location: '', graduationYear: new Date().getFullYear(), description: '' }}
                onSave={async (items) => { await saveProfile({ education: items }); }} saving={saving} searchQuery={searchQuery} searchFields={['degree', 'institution', 'location']}
            />;
            case 'skills': return <SkillsEditor skills={profile.skills} onSave={async (s) => { await saveProfile({ skills: s as Profile['skills'] }); }} saving={saving} />;
            case 'projects': return <ProjectsEditor projects={profile.projects} onSave={async (items) => { await saveProfile({ projects: items }); }} saving={saving} searchQuery={searchQuery} />;
            case 'certifications': return <ArrayEditor title="Certifications" items={profile.certifications} color={SECTION_COLORS.certifications} icon={SECTION_ICONS.certifications}
                fields={[
                    { key: 'name', label: 'Name' }, { key: 'issuer', label: 'Issuer' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'credentialUrl', label: 'Credential URL' }, { key: 'imageUrl', label: 'Image', type: 'image' },
                ]}
                defaultItem={{ name: '', issuer: '', date: '', credentialUrl: '', imageUrl: '' }}
                onSave={async (items) => { await saveProfile({ ...profile, certifications: items }); }} saving={saving} searchQuery={searchQuery} searchFields={['name', 'issuer']}
            />;
            case 'languages': return <ArrayEditor title="Languages" items={profile.languages} color={SECTION_COLORS.languages} icon={SECTION_ICONS.languages}
                fields={[
                    { key: 'language', label: 'Language' }, { key: 'proficiency', label: 'Proficiency' },
                ]}
                defaultItem={{ language: '', proficiency: '' }}
                onSave={async (items) => { await saveProfile({ ...profile, languages: items }); }} saving={saving} searchQuery={searchQuery} searchFields={['language', 'proficiency']}
            />;
            case 'team': return <TeamTab profile={profile} onUpdate={(p) => { setProfile(p); window.dispatchEvent(new CustomEvent('profile-updated')); }} />;
            case 'settings': return <SettingsEditor profile={profile} onSave={saveProfile} saving={saving} />;
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Content CMS</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage all portfolio content sections in one place.</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                {SECTIONS.map(t => (
                    <button key={t} onClick={() => setFilter(t)}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
                            whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                            background: filter === t ? 'var(--text-main)' : 'transparent',
                            color: filter === t ? 'var(--bg-body)' : 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            textTransform: 'capitalize',
                        }}
                    >
                        <span style={{ fontSize: '0.8rem' }}>{SECTION_ICONS[t]}</span>
                        {t}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={filter} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }} style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '50%', minWidth: '300px', maxWidth: '100%' }}>
                        {renderSection()}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

/* ───── Intro Editor ───── */
const IntroEditor = ({ profile, onSave, saving }: { profile: Profile; onSave: (u: Partial<Profile>) => Promise<void>; saving: boolean }) => {
    const { showToast } = useToast();
    const [form, setForm] = useState({ greeting: profile.greeting, title: profile.title, aboutMeTitle: profile.aboutMeTitle, bio: profile.bio, avatar: profile.avatar, cvUrl: profile.cvUrl });
    const fileRef = useRef<HTMLInputElement>(null);
    const cvFileRef = useRef<HTMLInputElement>(null);
    const [savingLocal, setSavingLocal] = useState(false);

    useEffect(() => { setForm({ greeting: profile.greeting, title: profile.title, aboutMeTitle: profile.aboutMeTitle, bio: profile.bio, avatar: profile.avatar, cvUrl: profile.cvUrl }); }, [profile]);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        if (file.size > 2 * 1024 * 1024) { showToast('Image must be smaller than 2MB', 'error'); return; }
        const r = new FileReader(); r.onloadend = () => setForm(prev => ({ ...prev, avatar: r.result as string })); r.readAsDataURL(file);
    };

    const handleCV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        if (file.size > 5 * 1024 * 1024) { showToast('CV must be smaller than 5MB', 'error'); return; }
        const r = new FileReader(); r.onloadend = () => setForm(prev => ({ ...prev, cvUrl: r.result as string })); r.readAsDataURL(file);
    };

    const handleSave = async () => {
        setSavingLocal(true);
        await onSave(form);
        setSavingLocal(false);
    };

    return (
        <div className="content-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Hero / Intro</h3>

            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input type="file" ref={fileRef} onChange={handleFile} accept="image/*" style={{ display: 'none' }} />
                <div onClick={() => fileRef.current?.click()} style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                    {form.avatar ? (
                        <img src={form.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=Error'; }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontWeight: 600 }}>No Image</div>
                    )}
                    <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary-teal)', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-white)' }}>
                        <FaCamera size={12} />
                    </div>
                </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Greeting</label>
                <input value={form.greeting || ''} onChange={e => setForm(p => ({ ...p, greeting: e.target.value }))} className="form-input" placeholder="Hello" />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Highlighted Title</label>
                <input value={form.title || ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="form-input" placeholder="Software Engineer|Fullstack Developer" style={{ fontWeight: 700, color: 'var(--primary-teal)' }} />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Section Title</label>
                <input value={form.aboutMeTitle || ''} onChange={e => setForm(p => ({ ...p, aboutMeTitle: e.target.value }))} className="form-input" placeholder="A Bit About Me" style={{ textDecoration: 'underline' }} />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">CV / Resume</label>
                <input type="file" ref={cvFileRef} onChange={handleCV} accept=".pdf,.doc,.docx" style={{ display: 'none' }} />
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button type="button" onClick={() => cvFileRef.current?.click()} className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                        {form.cvUrl ? 'Replace CV' : 'Upload CV'}
                    </button>
                    {form.cvUrl && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>CV uploaded</span>}
                    {form.cvUrl && <button type="button" onClick={() => setForm(p => ({ ...p, cvUrl: '' }))} style={{ background: 'none', border: 'none', color: 'var(--primary-red)', cursor: 'pointer', fontSize: '0.85rem' }}>Remove</button>}
                </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Bio</label>
                <textarea value={form.bio || ''} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} className="form-textarea" rows={5} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleSave} disabled={saving || savingLocal} className="btn-primary">
                    {saving || savingLocal ? 'Saving...' : <><FaSave /> Save Intro</>}
                </button>
            </div>
        </div>
    );
};

/* ───── About Editor ───── */
const AboutEditor = ({ about, onSave, saving }: { about: string; onSave: (u: Partial<Profile>) => Promise<void>; saving: boolean }) => {
    const [text, setText] = useState(about || '');
    const [localSaving, setLocalSaving] = useState(false);

    useEffect(() => { setText(about || ''); }, [about]);

    const handleSave = async () => {
        setLocalSaving(true);
        await onSave({ about: text });
        setLocalSaving(false);
    };

    const isSaving = saving || localSaving;

    return (
        <div className="content-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>About Us</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Write a single paragraph about the company. This will be displayed on the public page.</p>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">About Paragraph</label>
                <textarea value={text} onChange={e => setText(e.target.value)} className="form-textarea" rows={8}
                    placeholder="Tell visitors about your company, mission, and what makes you unique..."
                    style={{ resize: 'vertical' }}
                />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleSave} disabled={isSaving} className="btn-primary">
                    {isSaving ? 'Saving...' : <><FaSave /> Save About</>}
                </button>
            </div>
        </div>
    );
};

/* ───── Array Editor (inline list + modal) ───── */
interface FieldDef { key: string; label: string; type?: 'text' | 'number' | 'date' | 'image'; }
interface ArrayEditorProps {
    title: string; items: any[]; color: string; icon: React.ReactNode;
    fields: FieldDef[]; checkbox?: { key: string; label: string };
    defaultItem: any; onSave: (items: any[]) => Promise<void>; saving: boolean;
    searchQuery?: string; searchFields?: string[];
}

const ArrayEditor: React.FC<ArrayEditorProps> = ({ title, items, color, icon, fields, checkbox, defaultItem, onSave, saving, searchQuery = '', searchFields }) => {
    const [local, setLocal] = useState(items || []);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [form, setForm] = useState<any>(null);
    const [localSaving, setLocalSaving] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setLocal(items || []); }, [items]);

    const q = searchQuery.toLowerCase();
    const filtered = q && searchFields ? local.filter((item: any) => searchFields.some(f => String(item[f] || '').toLowerCase().includes(q))) : local;

    const saveItems = async (updated: any[]) => {
        setLocalSaving(true);
        setLocal(updated);
        await onSave(updated);
        setLocalSaving(false);
    };

    const openNew = () => { setEditingIndex(-1); setForm({ ...defaultItem }); };
    const openEdit = (index: number) => {
        const orig = local.indexOf(filtered[index]);
        setEditingIndex(orig);
        setForm({ ...local[orig] });
    };
    const cancel = () => { setEditingIndex(null); setForm(null); };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type: t } = e.target;
        setForm((prev: any) => ({ ...prev, [name]: t === 'number' ? parseInt(value) || 0 : value }));
    };

    const handleSave = async () => {
        const updated = [...local];
        if (editingIndex === -1) updated.push(form);
        else if (editingIndex !== null) updated[editingIndex] = form;
        await saveItems(updated);
        cancel();
    };

    const handleDelete = async (index: number) => {
        if (!window.confirm(`Delete this ${title.toLowerCase().slice(0, -1)}?`)) return;
        const orig = local.indexOf(filtered[index]);
        await saveItems(local.filter((_: any, i: number) => i !== orig));
    };

    const isSaving = saving || localSaving;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color }}>{icon}</span> {title} ({local.length})
                </h3>
                <button onClick={openNew} disabled={editingIndex !== null || isSaving} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                    <FaPlus /> Add
                </button>
            </div>

            <AnimatePresence>
                {editingIndex !== null && form && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="content-card" style={{ marginBottom: '1.5rem', border: `2px solid ${color}` }}
                    >
                        <h4 style={{ fontWeight: 700, marginBottom: '1rem' }}>{editingIndex === -1 ? `Add ${title.slice(0, -1)}` : `Edit ${title.slice(0, -1)}`}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            {fields.map(f => (
                                <div className="form-group" key={f.key}>
                                    <label className="form-label">{f.label}</label>
                                    {f.type === 'image' ? (
                                        <>
                                            <input type="file" ref={fileRef} onChange={(e) => { const fl = e.target.files?.[0]; if (!fl) return; if (fl.size > 2 * 1024 * 1024) { alert('Image must be smaller than 2MB'); return; } const r = new FileReader(); r.onloadend = () => setForm((prev: any) => ({ ...prev, [f.key]: r.result as string })); r.readAsDataURL(fl); }} accept="image/*" style={{ display: 'none' }} />
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                {form[f.key] && <div style={{ width: '70px', height: '70px', borderRadius: '6px', overflow: 'hidden', border: '2px solid var(--border-color)' }}>
                                                    <img src={form[f.key]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>}
                                                <button type="button" onClick={() => fileRef.current?.click()} className="admin-icon-btn" style={{ width: 'auto', padding: '0.5rem 1rem', gap: '6px', border: '1px solid var(--border-color)', borderRadius: '6px' }}><FaCamera /> {form[f.key] ? 'Replace' : 'Upload'}</button>
                                                {form[f.key] && <button type="button" onClick={() => setForm((prev: any) => ({ ...prev, [f.key]: '' }))} className="admin-icon-btn" style={{ color: 'var(--primary-red)', width: 'auto', padding: '0.5rem 1rem', border: '1px solid var(--primary-red)', borderRadius: '6px' }}><FaTimes /> Remove</button>}
                                            </div>
                                            <input value={form[f.key] || ''} onChange={e => setForm((prev: any) => ({ ...prev, [f.key]: e.target.value }))} className="form-input" placeholder="Or paste URL..." style={{ marginTop: '0.5rem' }} />
                                        </>
                                    ) : (
                                        <input name={f.key} type={f.type || 'text'} value={form[f.key] || ''} onChange={handleFormChange} className="form-input" />
                                    )}
                                </div>
                            ))}
                        </div>
                        {checkbox && (
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    <input type="checkbox" checked={form[checkbox.key]} onChange={e => setForm((prev: any) => ({ ...prev, [checkbox.key]: e.target.checked }))} />
                                    {checkbox.label}
                                </label>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={cancel} className="admin-icon-btn" style={{ fontSize: '0.9rem', width: 'auto', padding: '0.5rem 1rem' }} disabled={isSaving}>Cancel</button>
                            <button onClick={handleSave} className="btn-primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filtered.map((item: any, i: number) => (
                    <div key={i} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {fields[0] ? item[fields[0].key] || '(untitled)' : ''}
                                </div>
                                {fields[1] && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item[fields[1].key] || ''}</div>}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            <button onClick={() => openEdit(i)} className="admin-icon-btn" disabled={isSaving}><FaEdit /></button>
                            <button onClick={() => handleDelete(i)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }} disabled={isSaving}><FaTrash /></button>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)' }}>
                        {q ? `No matches for "${q}"` : `No ${title.toLowerCase()} yet.`}
                    </div>
                )}
            </div>
        </div>
    );
};

/* ───── Skills Editor ───── */
const SkillsEditor = ({ skills, onSave, saving }: { skills: Record<string, string[]>; onSave: (s: Record<string, string[]>) => Promise<void>; saving: boolean }) => {
    const [local, setLocal] = useState<Record<string, string[]>>(JSON.parse(JSON.stringify(skills || {})));
    const [newCat, setNewCat] = useState('');
    const [newSkill, setNewSkill] = useState<Record<string, string>>({});
    const [localSaving, setLocalSaving] = useState(false);
    const isSaving = saving || localSaving;

    const addCategory = () => {
        if (!newCat.trim()) return;
        const key = newCat.toLowerCase().replace(/\s+/g, '-');
        if (local[key]) { alert('Category already exists'); return; }
        setLocal(prev => ({ ...prev, [key]: [] })); setNewCat('');
    };

    const save = async () => { setLocalSaving(true); await onSave(local); setLocalSaving(false); };

    return (
        <div>
            <div className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1 }}>
                    <input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()} placeholder="New category (e.g. DevOps)" className="form-input" style={{ width: '250px' }} />
                    <button onClick={addCategory} className="admin-icon-btn" style={{ padding: '0.5rem 1rem', width: 'auto', fontSize: '0.9rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}><FaPlus /> Add Category</button>
                </div>
                <button onClick={save} disabled={isSaving} className="btn-primary">{isSaving ? 'Saving...' : <><FaSave /> Save Skills</>}</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {Object.entries(local).filter(([category]) => category !== 'other').map(([category, categorySkills]) => (
                    <div key={category} className="content-card" style={{ position: 'relative' }}>
                        <button onClick={() => { if (window.confirm(`Delete "${category}"?`)) setLocal(prev => { const n = { ...prev }; delete n[category]; return n; }); }}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-muted)', opacity: 0.5, cursor: 'pointer' }}><FaTrash /></button>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', textTransform: 'capitalize' }}>{category.replace(/-/g, ' ')}</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', minHeight: '40px' }}>
                            <AnimatePresence>
                                {categorySkills.map(skill => (
                                    <motion.span key={skill} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                                        style={{ background: 'var(--bg-body)', border: '1px solid var(--border-color)', padding: '0.3rem 0.6rem', borderRadius: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        {skill}
                                        <button onClick={() => setLocal(prev => ({ ...prev, [category]: prev[category].filter(s => s !== skill) }))} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
                                            <FaTimes size={10} />
                                        </button>
                                    </motion.span>
                                ))}
                            </AnimatePresence>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input value={newSkill[category] || ''} onChange={e => setNewSkill(prev => ({ ...prev, [category]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && (() => { const s = newSkill[category]?.trim(); if (s) { setLocal(prev => ({ ...prev, [category]: [...(prev[category] || []), s] })); setNewSkill(prev => ({ ...prev, [category]: '' })); } })()} placeholder="Add skill..." className="form-input" style={{ flex: 1, fontSize: '0.9rem', padding: '0.4rem 0.8rem' }} />
                            <button onClick={() => { const s = newSkill[category]?.trim(); if (s) { setLocal(prev => ({ ...prev, [category]: [...(prev[category] || []), s] })); setNewSkill(prev => ({ ...prev, [category]: '' })); } }} className="btn-primary" style={{ padding: '0.4rem 0.8rem', minWidth: 'auto' }}><FaPlus /></button>
                        </div>
                    </div>
                ))}
                {Object.keys(local).length === 0 && (
                    <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)' }}>No skill categories yet.</div>
                )}
            </div>
        </div>
    );
};

/* ───── Projects Editor ───── */
const ProjectsEditor = ({ projects, onSave, saving, searchQuery }: { projects: Profile['projects']; onSave: (items: Profile['projects']) => Promise<void>; saving: boolean; searchQuery?: string }) => {
    const [local, setLocal] = useState(projects);
    const [filter, setFilter] = useState('All');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [form, setForm] = useState<any>(null);
    const [localSaving, setLocalSaving] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const categories = ['Backend', 'Frontend', 'UI/UX', 'Fullstack', 'Other'];

    useEffect(() => { setLocal(projects); }, [projects]);

    const q = searchQuery?.toLowerCase() || '';
    const filtered = local.filter(p => {
        const mc = filter === 'All' || p.category === filter;
        const ms = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || (p.technologies || []).some(t => t.toLowerCase().includes(q));
        return mc && ms;
    });

    const saveProjects = async (updated: Profile['projects']) => {
        setLocalSaving(true); setLocal(updated); await onSave(updated); setLocalSaving(false);
    };

    const openNew = () => { setEditingIndex(-1); setForm({ name: '', description: '', technologies: [], url: '', githubUrl: '', imageUrl: '', featured: false, category: 'Other', effectiveness: 50, published: true, type: '', role: '' }); };
    const openEdit = (index: number) => { const orig = local.indexOf(filtered[index]); setEditingIndex(orig); setForm({ ...local[orig] }); };
    const cancel = () => { setEditingIndex(null); setForm(null); };

    const isSaving = saving || localSaving;

    const handleSave = async () => {
        const updated = [...local];
        if (editingIndex === -1) updated.push(form);
        else if (editingIndex !== null) updated[editingIndex] = form;
        await saveProjects(updated); cancel();
    };

    const handleDelete = async (index: number) => {
        if (!window.confirm('Delete this project?')) return;
        const orig = local.indexOf(filtered[index]);
        await saveProjects(local.filter((_, i) => i !== orig));
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: SECTION_COLORS.projects }}><FaProjectDiagram /></span> Projects ({local.length})
                </h3>
                <button onClick={openNew} disabled={editingIndex !== null || isSaving} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}><FaPlus /> Add</button>
            </div>

            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                {['All', ...categories].map(cat => (
                    <button key={cat} onClick={() => setFilter(cat)}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
                            whiteSpace: 'nowrap', border: 'none', cursor: 'pointer',
                            background: filter === cat ? 'var(--text-main)' : 'transparent',
                            color: filter === cat ? 'var(--bg-body)' : 'var(--text-muted)',
                        }}
                    >{cat}</button>
                ))}
            </div>

            <AnimatePresence>
                {editingIndex !== null && form && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="content-card" style={{ border: '2px solid var(--primary)', marginBottom: '2rem', padding: '1.5rem' }}
                    >
                        <h4 style={{ fontWeight: 800, marginBottom: '1rem' }}>{editingIndex === -1 ? 'New Project' : 'Edit Project'}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group"><label className="form-label">Name</label><input name="name" value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} className="form-input" /></div>
                            <div className="form-group"><label className="form-label">Category</label>
                                <select value={form.category || 'Other'} onChange={e => setForm((p: any) => ({ ...p, category: e.target.value }))} className="form-select">
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Image</label>
                            <input type="file" ref={fileRef} onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 2 * 1024 * 1024) { alert('Image must be smaller than 2MB'); return; } const r = new FileReader(); r.onloadend = () => setForm((prev: any) => ({ ...prev, imageUrl: r.result as string })); r.readAsDataURL(f); }} accept="image/*" style={{ display: 'none' }} />
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                {form.imageUrl && <div style={{ width: '70px', height: '70px', borderRadius: '6px', overflow: 'hidden', border: '2px solid var(--border-color)' }}>
                                    <img src={form.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/70?text=Error'; }} />
                                </div>}
                                <button type="button" onClick={() => fileRef.current?.click()} className="admin-icon-btn" style={{ width: 'auto', padding: '0.5rem 1rem', gap: '6px', border: '1px solid var(--border-color)', borderRadius: '6px' }}><FaCamera /> {form.imageUrl ? 'Replace' : 'Upload'}</button>
                                {form.imageUrl && <button type="button" onClick={() => setForm((p: any) => ({ ...p, imageUrl: '' }))} className="admin-icon-btn" style={{ color: 'var(--primary-red)', width: 'auto', padding: '0.5rem 1rem', border: '1px solid var(--primary-red)', borderRadius: '6px' }}><FaTimes /> Remove</button>}
                            </div>
                            <input value={form.imageUrl || ''} onChange={e => setForm((p: any) => ({ ...p, imageUrl: e.target.value }))} className="form-input" placeholder="Or paste URL..." style={{ marginTop: '0.5rem' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group"><label className="form-label">Live URL</label><input value={form.url || ''} onChange={e => setForm((p: any) => ({ ...p, url: e.target.value }))} className="form-input" /></div>
                            <div className="form-group"><label className="form-label">GitHub URL</label><input value={form.githubUrl || ''} onChange={e => setForm((p: any) => ({ ...p, githubUrl: e.target.value }))} className="form-input" /></div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Description</label>
                            <textarea value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} className="form-textarea" rows={3} />
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Technologies (comma separated)</label>
                            <input value={Array.isArray(form.technologies) ? form.technologies.join(', ') : form.technologies || ''} onChange={e => setForm((p: any) => ({ ...p, technologies: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) }))} className="form-input" />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={cancel} className="admin-icon-btn" style={{ fontSize: '0.9rem', width: 'auto', padding: '0.5rem 1rem' }} disabled={isSaving}>Cancel</button>
                            <button onClick={handleSave} className="btn-primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filtered.map((p, i) => (
                    <div key={i} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                            {p.imageUrl && <div style={{ width: '44px', height: '44px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-color)' }}>
                                <img src={p.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            </div>}
                            <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <strong style={{ fontSize: '0.95rem' }}>{p.name}</strong>
                                    {p.category && <span style={{ fontSize: '0.7rem', background: 'var(--bg-body)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px' }}>{p.category}</span>}
                                    {p.published
                                        ? <span style={{ fontSize: '0.7rem', background: 'rgba(78,205,196,0.15)', color: 'var(--primary-teal)', padding: '2px 6px', borderRadius: '4px' }}>Published</span>
                                        : <span style={{ fontSize: '0.7rem', background: 'var(--bg-body)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: '4px' }}>Draft</span>}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>{p.description}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            <button onClick={() => openEdit(i)} className="admin-icon-btn" disabled={isSaving}><FaEdit /></button>
                            <button onClick={() => handleDelete(i)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }} disabled={isSaving}><FaTrash /></button>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)' }}>{q ? `No matches for "${q}"` : 'No projects yet.'}</div>
                )}
            </div>
        </div>
    );
};

/* ───── Settings Editor ───── */
const SettingsEditor = ({ profile, onSave, saving }: { profile: Profile; onSave: (u: Partial<Profile>) => Promise<void>; saving: boolean }) => {
    const [form, setForm] = useState({ website: profile.website || '', yearsOfExperience: profile.yearsOfExperience || 0, availableForHire: profile.availableForHire, isPublic: profile.isPublic ?? true, socialLinks: { ...(profile.socialLinks || {}) } });
    const [localSaving, setLocalSaving] = useState(false);

    useEffect(() => { setForm({ website: profile.website || '', yearsOfExperience: profile.yearsOfExperience || 0, availableForHire: profile.availableForHire, isPublic: profile.isPublic ?? true, socialLinks: { ...(profile.socialLinks || {}) } }); }, [profile]);

    const handleSave = async () => { setLocalSaving(true); await onSave(form); setLocalSaving(false); };
    const isSaving = saving || localSaving;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="content-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Profile Settings</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group"><label className="form-label">Website</label><input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} className="form-input" /></div>
                    <div className="form-group"><label className="form-label">Years of Experience</label><input type="number" value={form.yearsOfExperience} onChange={e => setForm(p => ({ ...p, yearsOfExperience: parseInt(e.target.value) || 0 }))} className="form-input" /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Available for Hire</label>
                        <select value={String(form.availableForHire)} onChange={e => setForm(p => ({ ...p, availableForHire: e.target.value === 'true' }))} className="form-select">
                            <option value="true">Available</option><option value="false">Not Available</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Profile Visibility</label>
                        <select value={String(form.isPublic)} onChange={e => setForm(p => ({ ...p, isPublic: e.target.value === 'true' }))} className="form-select">
                            <option value="true">Public</option><option value="false">Private</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="content-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Social Links</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    {['github', 'linkedin', 'twitter'].map(k => (
                        <div className="form-group" key={k}><label className="form-label" style={{ textTransform: 'capitalize' }}>{k}</label>
                            <input value={form.socialLinks[k] || ''} onChange={e => setForm(p => ({ ...p, socialLinks: { ...p.socialLinks, [k]: e.target.value } }))} className="form-input" placeholder={`${k.charAt(0).toUpperCase() + k.slice(1)} URL`} />
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSave} disabled={isSaving} className="btn-primary">{isSaving ? 'Saving...' : <><FaSave /> Save Settings</>}</button>
                </div>
            </div>
        </div>
    );
};

export default Resources;
