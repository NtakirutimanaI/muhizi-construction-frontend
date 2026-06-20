import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import {
    FaCog, FaHome, FaInfoCircle, FaSave, FaCopyright,
    FaPlus, FaEdit, FaTrash
} from 'react-icons/fa';
import { profileService } from '../../services/profileService';
import type { Profile } from '../../services/profileService';
import { useToast } from '../../context/ToastContext';
import HomeSectionsTab from './profile-sections/HomeSectionsTab';
import AboutSectionsTab from './profile-sections/AboutSectionsTab';

type SectionId = 'home-sections' | 'about-sections' | 'footer' | 'settings';

const SECTION_COLORS: Record<string, string> = {
    'home-sections': '#e67e22', 'about-sections': '#8B4513',
    footer: '#2d2d2d', settings: 'var(--primary)',
};

const SECTION_ICONS: Record<string, React.ReactNode> = {
    'home-sections': <FaHome />, 'about-sections': <FaInfoCircle />,
    footer: <FaCopyright />, settings: <FaCog />,
};

const SECTIONS: SectionId[] = ['home-sections', 'about-sections', 'footer', 'settings'];

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
    const [filter, setFilter] = useState<SectionId>('home-sections');

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

    const renderSection = () => {
        switch (filter) {
            case 'settings': return <SettingsEditor profile={profile} onSave={saveProfile} saving={saving} />;
            case 'home-sections': return <HomeSectionsTab profile={profile} onSave={saveProfile} saving={saving} />;
            case 'footer': return <FooterEditor profile={profile} onSave={saveProfile} saving={saving} />;
            case 'about-sections': return <AboutSectionsTab profile={profile} onSave={saveProfile} saving={saving} />;
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

            {loading ? (
                <div className="inline-spinner">Loading content...</div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div key={filter} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }} style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: '50%', minWidth: '300px', maxWidth: '100%' }}>
                            {renderSection()}
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
};

/* ───── Footer Editor ───── */
const FooterEditor = ({ profile, onSave, saving }: { profile: Profile; onSave: (u: Partial<Profile>) => Promise<void>; saving: boolean }) => {
    const footer = profile.pageContent?.footer;
    const [companyDescription, setCompanyDescription] = useState(footer?.companyDescription || 'MUHIZI CONSTRUCTION is a leading construction and real estate company in Rwanda.');
    const [copyrightText, setCopyrightText] = useState(footer?.copyrightText || `© ${new Date().getFullYear()} MUHIZI CONSTRUCTION. All rights reserved.`);
    const [showSocialLinks, setShowSocialLinks] = useState(footer?.showSocialLinks ?? true);
    const [showContactInfo, setShowContactInfo] = useState(footer?.showContactInfo ?? true);
    const [quickLinks, setQuickLinks] = useState(footer?.quickLinks || [
        { label: 'Home', url: '/' },
        { label: 'About', url: '/about' },
        { label: 'Services', url: '/#offerings' },
        { label: 'Contact', url: '/#contact' },
    ]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [form, setForm] = useState<any>(null);
    const [localSaving, setLocalSaving] = useState(false);
    const [phone, setPhone] = useState(profile.phone || '');
    const [contactEmail, setContactEmail] = useState(profile.email || '');
    const [linkedinUrl, setLinkedinUrl] = useState(profile.socialLinks?.linkedin || '');
    const [twitterUrl, setTwitterUrl] = useState(profile.socialLinks?.twitter || '');
    const [githubUrl, setGithubUrl] = useState(profile.socialLinks?.github || '');
    const [poweredByText, setPoweredByText] = useState(profile.poweredBy || 'Powered and secured by MIS');

    useEffect(() => {
        const d = profile.pageContent?.footer;
        setCompanyDescription(d?.companyDescription || 'MUHIZI CONSTRUCTION is a leading construction and real estate company in Rwanda.');
        setCopyrightText(d?.copyrightText || `© ${new Date().getFullYear()} MUHIZI CONSTRUCTION. All rights reserved.`);
        setShowSocialLinks(d?.showSocialLinks ?? true);
        setShowContactInfo(d?.showContactInfo ?? true);
        setQuickLinks(d?.quickLinks || [
            { label: 'Home', url: '/' },
            { label: 'About', url: '/about' },
            { label: 'Services', url: '/#offerings' },
            { label: 'Contact', url: '/#contact' },
        ]);
        setPhone(profile.phone || '');
        setContactEmail(profile.email || '');
        setLinkedinUrl(profile.socialLinks?.linkedin || '');
        setTwitterUrl(profile.socialLinks?.twitter || '');
        setGithubUrl(profile.socialLinks?.github || '');
        setPoweredByText(profile.poweredBy || 'Powered and secured by MIS');
    }, [profile]);

    const save = async () => {
        setLocalSaving(true);
        const pc = { ...profile.pageContent, footer: { companyDescription, copyrightText, showSocialLinks, showContactInfo, quickLinks } };
        await onSave({
            pageContent: pc,
            phone,
            email: contactEmail,
            socialLinks: { linkedin: linkedinUrl, twitter: twitterUrl, github: githubUrl },
            poweredBy: poweredByText,
        });
        setLocalSaving(false);
    };

    const openNew = () => { setEditingIndex(-1); setForm({ label: '', url: '' }); };
    const openEdit = (i: number) => { setEditingIndex(i); setForm({ ...quickLinks[i] }); };
    const cancel = () => { setEditingIndex(null); };

    const handleSaveLink = () => {
        if (!form) return;
        const updated = [...quickLinks];
        if (editingIndex === -1) updated.push(form);
        else if (editingIndex !== null) updated[editingIndex] = form;
        setQuickLinks(updated);
        cancel();
    };

    const handleDeleteLink = (i: number) => {
        if (!window.confirm('Delete this link?')) return;
        setQuickLinks(quickLinks.filter((_, idx) => idx !== i));
    };

    const isSaving = saving || localSaving;

    return (
        <div>
            <div className="content-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>Footer Content</h3>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">Company Description</label>
                    <textarea value={companyDescription} onChange={e => setCompanyDescription(e.target.value)} className="form-textarea" rows={3} placeholder="Describe your company, mission, and values..." />
                </div>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">Copyright Text</label>
                    <input value={copyrightText} onChange={e => setCopyrightText(e.target.value)} className="form-input" placeholder="© 2026 MUHIZI CONSTRUCTION. All rights reserved." />
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={showSocialLinks} onChange={e => setShowSocialLinks(e.target.checked)} />
                        Show Social Links
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={showContactInfo} onChange={e => setShowContactInfo(e.target.checked)} />
                        Show Contact Info
                    </label>
                </div>
            </div>

            <div className="content-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>Contact Information</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input value={phone} onChange={e => setPhone(e.target.value)} className="form-input" placeholder="+250 788 000 000" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="form-input" placeholder="info@example.com" />
                    </div>
                </div>
            </div>

            <div className="content-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>Social Media Links</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">LinkedIn URL</label>
                        <input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} className="form-input" placeholder="https://linkedin.com/in/..." />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Twitter URL</label>
                        <input value={twitterUrl} onChange={e => setTwitterUrl(e.target.value)} className="form-input" placeholder="https://twitter.com/..." />
                    </div>
                    <div className="form-group">
                        <label className="form-label">GitHub URL</label>
                        <input value={githubUrl} onChange={e => setGithubUrl(e.target.value)} className="form-input" placeholder="https://github.com/..." />
                    </div>
                </div>
            </div>

            <div className="content-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>Copyright & Branding</h3>
                <div className="form-group">
                    <label className="form-label">Powered By Text</label>
                    <input value={poweredByText} onChange={e => setPoweredByText(e.target.value)} className="form-input" placeholder="Powered and secured by..." />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Optional branding text shown below copyright</p>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Quick Links ({quickLinks.length})</h3>
                <button onClick={openNew} disabled={editingIndex !== null} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}><FaPlus /> Add Link</button>
            </div>

            {editingIndex !== null && form && (
                <div className="content-card" style={{ padding: '1rem', marginBottom: '1rem', border: '2px solid var(--primary)' }}>
                    <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{editingIndex === -1 ? 'New Link' : 'Edit Link'}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div className="form-group">
                            <label className="form-label">Label</label>
                            <input value={form.label} onChange={e => setForm((p: any) => ({ ...p, label: e.target.value }))} className="form-input" placeholder="e.g. Home" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">URL</label>
                            <input value={form.url} onChange={e => setForm((p: any) => ({ ...p, url: e.target.value }))} className="form-input" placeholder="e.g. /" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button onClick={cancel} className="admin-icon-btn" style={{ fontSize: '0.85rem', width: 'auto', padding: '0.4rem 0.8rem' }}>Cancel</button>
                        <button onClick={handleSaveLink} className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}><FaSave /> Save</button>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {quickLinks.map((link, i) => (
                    <div key={i} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem' }}>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{link.label}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{link.url}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => openEdit(i)} className="admin-icon-btn"><FaEdit /></button>
                            <button onClick={() => handleDeleteLink(i)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }}><FaTrash /></button>
                        </div>
                    </div>
                ))}
                {quickLinks.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)' }}>No quick links yet.</div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={save} disabled={isSaving} className="btn-primary">{isSaving ? 'Saving...' : <><FaSave /> Save Footer</>}</button>
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
                    <div className="form-group"><label className="form-label">Website</label><input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} className="form-input" placeholder="https://example.com" /></div>
                    <div className="form-group"><label className="form-label">Years of Experience</label><input type="number" value={form.yearsOfExperience} onChange={e => setForm(p => ({ ...p, yearsOfExperience: parseInt(e.target.value) || 0 }))} className="form-input" placeholder="e.g. 10" /></div>
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
