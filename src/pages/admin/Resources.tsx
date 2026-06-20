import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
    FaCog, FaHome, FaInfoCircle, FaSave, FaCopyright,
    FaPlus, FaEdit, FaTrash, FaCode,
    FaProjectDiagram, FaUsers, FaUser, FaPhone, FaEnvelope, FaLink, FaUpload,
    FaTag
} from 'react-icons/fa';
import { profileService } from '../../services/profileService';
import type { Profile } from '../../services/profileService';
import { useToast } from '../../context/ToastContext';
import { uploadService } from '../../services/uploadService';
import HomeSectionsTab from './profile-sections/HomeSectionsTab';
import AboutSectionsTab from './profile-sections/AboutSectionsTab';
import ProjectsTab from './profile-sections/ProjectsTab';
import TeamTab from './profile-sections/TeamTab';
import GeneralTab from './profile-sections/GeneralTab';

type SectionId = 'home-sections' | 'about-sections' | 'footer' | 'brand' | 'settings' | 'projects' | 'team' | 'general';

const SECTION_ICONS: Record<string, React.ReactNode> = {
    'home-sections': <FaHome />, 'about-sections': <FaInfoCircle />,
    footer: <FaCopyright />, brand: <FaTag />, settings: <FaCog />, projects: <FaProjectDiagram />,
    team: <FaUsers />, general: <FaUser />,
};

const SECTIONS: SectionId[] = ['home-sections', 'about-sections', 'projects', 'team', 'footer', 'brand', 'settings', 'general'];

const emptyP: Profile = {
    id: '', firstName: '', lastName: '', username: '', email: '', bio: '', greeting: '', aboutMeTitle: '', title: '',
    location: '', phone: '', website: '', avatar: '', cvUrl: '', company: '', yearsOfExperience: 0,
    availableForHire: false, isPublic: false, about: '', education: [], experience: [],
    skills: { backend: [], frontend: [], databases: [], tools: [] }, projects: [], certifications: [], languages: [], teamMembers: [], socialLinks: {}, services: [],
    createdAt: '', updatedAt: '', role: '', type: '',
};

const Resources = () => {
    const { searchQuery } = useOutletContext<{ searchQuery: string }>();
    const { showToast } = useToast();
    const [searchParams] = useSearchParams();
    const [profile, setProfile] = useState<Profile>(emptyP);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const tabParam = searchParams.get('tab') as SectionId | null;
    const [filter, setFilter] = useState<SectionId>(tabParam || 'home-sections');

    useEffect(() => { loadProfile(); }, []);
    useEffect(() => { if (tabParam && SECTIONS.includes(tabParam)) setFilter(tabParam); }, [tabParam]);

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
            case 'about-sections': return <AboutSectionsTab profile={profile} onSave={saveProfile} saving={saving} />;
            case 'footer': return <FooterEditor profile={profile} onSave={saveProfile} saving={saving} />;
            case 'brand': return <BrandEditor profile={profile} onSave={saveProfile} saving={saving} />;
            case 'projects': return <ProjectsTab profile={profile} onUpdate={setProfile} searchQuery={searchQuery} />;
            case 'team': return <TeamTab profile={profile} onUpdate={setProfile} />;
            case 'general': return <GeneralTab profile={profile} onUpdate={setProfile} />;
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

            {loading ? (
                <div className="inline-spinner">Loading content...</div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div key={filter} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }} style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: 'calc(50% + 300px)', minWidth: '300px', maxWidth: '100%' }}>
                            {renderSection()}
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}
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

/* ───── Footer Editor ───── */
const FooterEditor = ({ profile, onSave, saving }: { profile: Profile; onSave: (u: Partial<Profile>) => Promise<void>; saving: boolean }) => {
    const [form, setForm] = useState({
        phone: profile.phone || '',
        email: profile.email || '',
        linkedinUrl: profile.socialLinks?.linkedin || '',
        twitterUrl: profile.socialLinks?.twitter || '',
        githubUrl: profile.socialLinks?.github || '',
        poweredByText: profile.poweredBy || 'Powered and secured by MIS'
    });
    const [localSaving, setLocalSaving] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        setForm({
            phone: profile.phone || '',
            email: profile.email || '',
            linkedinUrl: profile.socialLinks?.linkedin || '',
            twitterUrl: profile.socialLinks?.twitter || '',
            githubUrl: profile.socialLinks?.github || '',
            poweredByText: profile.poweredBy || 'Powered and secured by MIS'
        });
    }, [profile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        setLocalSaving(true);
        await onSave({
            phone: form.phone,
            email: form.email,
            socialLinks: {
                linkedin: form.linkedinUrl,
                twitter: form.twitterUrl,
                github: form.githubUrl
            },
            poweredBy: form.poweredByText
        });
        setLocalSaving(false);
        showToast('Footer settings saved successfully!', 'success');
    };
    const isSaving = saving || localSaving;

    const copyrightText = `© ${new Date().getFullYear()} By ${profile.firstName} ${profile.lastName}`;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Contact */}
            <div className="content-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaPhone style={{ color: 'var(--primary)' }} /> Contact Information
                </h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input type="text" name="phone" className="form-input" value={form.phone} onChange={handleChange} placeholder="+250 788 000 000" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input type="email" name="email" className="form-input" value={form.email} onChange={handleChange} placeholder="your@email.com" />
                    </div>
                </div>
            </div>

            {/* Social Links */}
            <div className="content-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaLink style={{ color: 'var(--primary)' }} /> Social Media Links
                </h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {(['linkedinUrl', 'twitterUrl', 'githubUrl'] as const).map(k => (
                        <div className="form-group" key={k}>
                            <label className="form-label" style={{ textTransform: 'capitalize' }}>{k.replace('Url', '')}</label>
                            <input type="url" name={k} className="form-input" value={form[k]} onChange={handleChange} placeholder={`https://${k.replace('Url', '')}.com/...`} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Branding */}
            <div className="content-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaCopyright style={{ color: 'var(--primary)' }} /> Copyright & Branding
                </h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Copyright Text</label>
                        <input type="text" className="form-input" value={copyrightText} disabled style={{ opacity: 0.7 }} />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Auto-generated from your profile name and current year</p>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Powered By Text</label>
                        <input type="text" name="poweredByText" className="form-input" value={form.poweredByText} onChange={handleChange} placeholder="Powered and secured by..." />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button onClick={handleSave} disabled={isSaving} className="btn-primary">{isSaving ? 'Saving...' : <><FaSave /> Save Footer</>}</button>
                </div>
            </div>

            {/* Preview */}
            <div className="content-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Preview</h3>
                <div style={{ padding: '1rem', background: 'var(--bg-body)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                        <div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Phone</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{form.phone || 'Not set'}</p>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Email</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{form.email || 'Not set'}</p>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Follow Us</h4>
                            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                {form.linkedinUrl && <span>LinkedIn</span>}
                                {form.twitterUrl && <span>Twitter</span>}
                                {form.githubUrl && <span>GitHub</span>}
                                {!form.linkedinUrl && !form.twitterUrl && !form.githubUrl && <span>No social links</span>}
                            </div>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{copyrightText}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{form.poweredByText}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ───── Brand Editor (Logo + Company Name) ───── */
const BrandEditor = ({ profile, onSave, saving }: { profile: Profile; onSave: (u: Partial<Profile>) => Promise<void>; saving: boolean }) => {
    const [companyLogoUrl, setCompanyLogoUrl] = useState(profile.companyLogo || '');
    const [companyName, setCompanyName] = useState(profile.company || '');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [localSaving, setLocalSaving] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();

    useEffect(() => {
        setCompanyLogoUrl(profile.companyLogo || '');
        setCompanyName(profile.company || '');
    }, [profile]);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setUploadProgress(0);
        try {
            const result = await uploadService.uploadFile(file, setUploadProgress);
            const url = result.secureUrl || result.url;
            setCompanyLogoUrl(url);
            await onSave({ companyLogo: url, company: companyName });
            showToast('Logo saved successfully!', 'success');
        } catch {
            showToast('Failed to upload logo', 'error');
        } finally {
            setUploading(false);
            setUploadProgress(0);
            if (logoInputRef.current) logoInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        setLocalSaving(true);
        await onSave({ companyLogo: companyLogoUrl, company: companyName });
        setLocalSaving(false);
        showToast('Brand settings saved successfully!', 'success');
    };
    const isSaving = saving || localSaving;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Company Logo */}
            <div className="content-card" style={{ padding: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaUpload style={{ color: 'var(--primary)' }} /> Company Logo
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Upload your company logo. It will appear in the header navigation bar and footer of the website.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-body)', flexShrink: 0 }}>
                        {companyLogoUrl ? (
                            <img src={companyLogoUrl} alt="Company Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <FaUpload style={{ fontSize: '2rem', color: 'var(--text-muted)', opacity: 0.4 }} />
                        )}
                    </div>
                    <div>
                        <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} hidden />
                        <button onClick={() => logoInputRef.current?.click()} disabled={uploading} className="btn-primary" style={{ fontSize: '0.8rem' }}>
                            {uploading ? `Uploading ${uploadProgress}%` : <><FaUpload /> {companyLogoUrl ? 'Change Logo' : 'Upload Logo'}</>}
                        </button>
                        {companyLogoUrl && (
                            <button onClick={() => setCompanyLogoUrl('')} className="btn-secondary" style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                                Remove
                            </button>
                        )}
                        {uploading && (
                            <div style={{ width: 200, height: 6, background: 'var(--border-color)', borderRadius: 3, marginTop: '0.5rem', overflow: 'hidden' }}>
                                <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--primary)', borderRadius: 3, transition: 'width 0.2s' }} />
                            </div>
                        )}
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                            Recommended: square image, min 200x200px. Supports JPG, PNG, WebP.
                        </p>
                    </div>
                </div>
            </div>

            {/* Company Name */}
            <div className="content-card" style={{ padding: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaTag style={{ color: 'var(--primary)' }} /> Company Name
                </h3>
                <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input type="text" className="form-input" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Muhizi Construction Ltd" />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        This name appears next to the logo in the header and footer.
                    </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem' }}>
                    <button onClick={handleSave} disabled={isSaving} className="btn-primary" style={{ fontSize: '0.8rem' }}>{isSaving ? 'Saving...' : <><FaSave /> Save Brand</>}</button>
                </div>
            </div>

            {/* Preview */}
            <div className="content-card" style={{ padding: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>Preview</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ padding: '0.6rem', background: 'var(--bg-body)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-muted)' }}>Header</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {companyLogoUrl ? (
                                <img src={companyLogoUrl} alt="Logo" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--border-color)' }} />
                            )}
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{companyName || 'Company Name'}</span>
                        </div>
                    </div>
                    <div style={{ padding: '0.6rem', background: '#1a1a2e', borderRadius: '6px' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.3rem', color: 'rgba(255,255,255,0.5)' }}>Footer</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {companyLogoUrl ? (
                                <img src={companyLogoUrl} alt="Logo" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', background: '#fff', padding: '3px' }} />
                            ) : (
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                            )}
                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{companyName || 'Company Name'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Resources;
