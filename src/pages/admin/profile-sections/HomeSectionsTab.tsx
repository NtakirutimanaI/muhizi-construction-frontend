import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHome, FaConciergeBell, FaCalendarAlt, FaSave, FaPlus, FaEdit, FaTrash, FaTimes, FaYoutube, FaProjectDiagram, FaUsers, FaEnvelope, FaQuestionCircle, FaUpload, FaVideo } from 'react-icons/fa';
import type { Profile } from '../../../services/profileService';
import { useToast } from '../../../context/ToastContext';
import { uploadService } from '../../../services/uploadService';

type HomeTab = 'hero-slides' | 'services' | 'events' | 'follow-us' | 'projects' | 'our-team' | 'get-in-touch' | 'faq';

interface Props {
    profile: Profile;
    onSave: (u: Partial<Profile>) => Promise<void>;
    saving: boolean;
}

const SUB_TABS: { id: HomeTab; label: string; icon: React.ReactNode }[] = [
    { id: 'hero-slides', label: 'Hero Slides', icon: <FaHome /> },
    { id: 'services', label: 'Services', icon: <FaConciergeBell /> },
    { id: 'follow-us', label: 'Follow Us', icon: <FaYoutube /> },
    { id: 'projects', label: 'Projects', icon: <FaProjectDiagram /> },
    { id: 'events', label: 'Events', icon: <FaCalendarAlt /> },
    { id: 'our-team', label: 'Our Team', icon: <FaUsers /> },
    { id: 'get-in-touch', label: 'Get in Touch', icon: <FaEnvelope /> },
    { id: 'faq', label: 'FAQ', icon: <FaQuestionCircle /> },
];

const HomeSectionsTab: React.FC<Props> = ({ profile, onSave, saving }) => {
    const [subTab, setSubTab] = useState<HomeTab>('hero-slides');
    const { showToast } = useToast();

    return (
        <div>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                {SUB_TABS.map(t => (
                    <button key={t.id} onClick={() => setSubTab(t.id)}
                        style={{
                            padding: '0.4rem 0.8rem', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600,
                            whiteSpace: 'nowrap', border: 'none', cursor: 'pointer',
                            background: subTab === t.id ? 'var(--text-main)' : 'transparent',
                            color: subTab === t.id ? 'var(--bg-body)' : 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', gap: '5px',
                        }}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>
            <AnimatePresence mode="wait">
                <motion.div key={subTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>
                    {subTab === 'hero-slides' && <HeroSlidesEditor profile={profile} onSave={onSave} saving={saving} />}
                    {subTab === 'services' && <ServicesSection profile={profile} onSave={onSave} saving={saving} />}
                    {subTab === 'events' && <EventsEditor profile={profile} onSave={onSave} saving={saving} />}
                    {subTab === 'follow-us' && <FollowUsEditor profile={profile} onSave={onSave} saving={saving} />}
                    {subTab === 'projects' && <ProjectsEditor profile={profile} onSave={onSave} saving={saving} />}
                    {subTab === 'our-team' && <OurTeamEditor profile={profile} onSave={onSave} saving={saving} />}
                    {subTab === 'get-in-touch' && <GetInTouchEditor profile={profile} onSave={onSave} saving={saving} />}
                    {subTab === 'faq' && <FaqEditor profile={profile} onSave={onSave} saving={saving} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

/* ───── Hero Slides Editor ───── */
const HeroSlidesEditor: React.FC<Props> = ({ profile, onSave, saving }) => {
    const { showToast } = useToast();
    const [slides, setSlides] = useState(profile.pageContent?.heroSlides || []);
    const [videoData, setVideoData] = useState(profile.pageContent?.heroVideoUrl || '');
    const [videoFileName, setVideoFileName] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [form, setForm] = useState<any>(null);
    const [localSaving, setLocalSaving] = useState(false);
    const videoFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setSlides(profile.pageContent?.heroSlides || []);
        setVideoData(profile.pageContent?.heroVideoUrl || '');
    }, [profile.pageContent?.heroSlides, profile.pageContent?.heroVideoUrl]);

    const handleVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            showToast('Video must be smaller than 50MB', 'error');
            return;
        }
        setVideoFileName(file.name);
        try {
            const uploaded = await uploadService.uploadFile(file);
            setVideoData(uploaded.secureUrl);
            saveSlides(slides, uploaded.secureUrl);
        } catch {
            showToast('Failed to upload video', 'error');
        }
    };

    const removeVideo = () => {
        setVideoData('');
        setVideoFileName('');
        saveSlides(slides, '');
    };

    const save = async (updated: any[]) => {
        setLocalSaving(true);
        const pc = { ...profile.pageContent, heroSlides: updated, heroVideoUrl: videoData };
        await onSave({ pageContent: pc });
        setLocalSaving(false);
    };

    const saveSlides = async (updated: any[], vData: string) => {
        setLocalSaving(true);
        const pc = { ...profile.pageContent, heroSlides: updated, heroVideoUrl: vData };
        await onSave({ pageContent: pc });
        setLocalSaving(false);
    };

    const openNew = () => { setEditingIndex(-1); setForm({ title: '', body: '', color: '#1B2042' }); };
    const openEdit = (i: number) => { setEditingIndex(i); setForm({ ...slides[i] }); };
    const cancel = () => { setEditingIndex(null); };

    const handleSave = async () => {
        const updated = [...slides];
        if (editingIndex === -1) updated.push(form);
        else if (editingIndex !== null) updated[editingIndex] = form;
        await save(updated);
        cancel();
    };

    const handleDelete = async (i: number) => {
        if (!window.confirm('Delete this slide?')) return;
        await save(slides.filter((_, idx) => idx !== i));
    };

    const isSaving = saving || localSaving;

    return (
        <div>
            <div className="content-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}><FaVideo /> Background Video</h4>
                <input type="file" ref={videoFileRef} onChange={handleVideoFile} accept="video/mp4,video/webm,video/ogg" style={{ display: 'none' }} />
                {videoData ? (
                    <div>
                        <video src={videoData} style={{ width: '100%', maxHeight: '200px', borderRadius: '8px', marginBottom: '0.5rem' }} controls />
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{videoFileName || 'Custom video'}</p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="button" onClick={() => videoFileRef.current?.click()} className="admin-icon-btn" style={{ width: 'auto', padding: '0.4rem 0.8rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem' }}><FaUpload /> Replace</button>
                            <button type="button" onClick={removeVideo} className="admin-icon-btn" style={{ color: 'var(--primary-red)', width: 'auto', padding: '0.4rem 0.8rem', border: '1px solid var(--primary-red)', borderRadius: '6px', fontSize: '0.85rem' }}><FaTimes /> Remove</button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <button type="button" onClick={() => videoFileRef.current?.click()} className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}><FaUpload /> Upload Video</button>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Max 50MB. Supports MP4, WebM, Ogg.</p>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Hero Slides ({slides.length})</h3>
                <button onClick={openNew} disabled={editingIndex !== null} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}><FaPlus /> Add Slide</button>
            </div>
            <AnimatePresence>
                {editingIndex !== null && form && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="content-card" style={{ marginBottom: '1rem', padding: '1rem', border: '2px solid var(--primary)' }}
                    >
                        <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{editingIndex === -1 ? 'New Slide' : 'Edit Slide'}</h4>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Title</label>
                            <input value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))} className="form-input" placeholder="Hero slide title" />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Body</label>
                            <input value={form.body} onChange={e => setForm((p: any) => ({ ...p, body: e.target.value }))} className="form-input" placeholder="Hero slide body text" />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Color</label>
                            <input type="color" value={form.color} onChange={e => setForm((p: any) => ({ ...p, color: e.target.value }))} className="form-input" style={{ width: '80px', height: '40px', padding: '2px' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={cancel} className="admin-icon-btn" style={{ fontSize: '0.85rem', width: 'auto', padding: '0.4rem 0.8rem' }}>Cancel</button>
                            <button onClick={handleSave} className="btn-primary" disabled={isSaving} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>{isSaving ? 'Saving...' : <><FaSave /> Save</>}</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {slides.map((s, i) => (
                    <div key={i} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: s.color, flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.title}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.body}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => openEdit(i)} className="admin-icon-btn" disabled={isSaving}><FaEdit /></button>
                            <button onClick={() => handleDelete(i)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }}><FaTrash /></button>
                        </div>
                    </div>
                ))}
                {slides.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)' }}>No slides yet.</div>
                )}
            </div>
        </div>
    );
};

/* ───── Services Section (Top / Bottom sub-tabs) ───── */
type ServicesSubTab = 'top-service' | 'bottom-services';

const SERVICES_SUB_TABS: { id: ServicesSubTab; label: string }[] = [
    { id: 'top-service', label: 'Top - Service' },
    { id: 'bottom-services', label: 'Bottom - Services' },
];

const ServicesSection: React.FC<Props> = (props) => {
    const [svcTab, setSvcTab] = useState<ServicesSubTab>('top-service');

    return (
        <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                {SERVICES_SUB_TABS.map(t => (
                    <button key={t.id} onClick={() => setSvcTab(t.id)}
                        style={{
                            padding: '0.3rem 0.7rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600,
                            whiteSpace: 'nowrap', border: 'none', cursor: 'pointer',
                            background: svcTab === t.id ? 'var(--text-main)' : 'transparent',
                            color: svcTab === t.id ? 'var(--bg-body)' : 'var(--text-muted)',
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            {svcTab === 'top-service' && <TopServiceEditor {...props} />}
            {svcTab === 'bottom-services' && <ServicesEditor {...props} />}
        </div>
    );
};

/* ───── Top Service Editor ───── */
const TopServiceEditor: React.FC<Props> = ({ profile, onSave, saving }) => {
    const { showToast } = useToast();
    const allCards = profile.pageContent?.aboutSection?.cards || [];
    const firstCard = allCards[0] || { title: 'Building Construction', description: 'Residential and Commercial buildings' };
    const [heading, setHeading] = useState(firstCard.title);
    const [subtitle, setSubtitle] = useState(firstCard.description);
    const [extraCards, setExtraCards] = useState(allCards.slice(1));
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [form, setForm] = useState<{ title: string; description: string } | null>(null);
    const [localSaving, setLocalSaving] = useState(false);

    useEffect(() => {
        const c = profile.pageContent?.aboutSection?.cards || [];
        const fc = c[0] || { title: 'Building Construction', description: 'Residential and Commercial buildings' };
        setHeading(fc.title);
        setSubtitle(fc.description);
        setExtraCards(c.slice(1));
    }, [profile.pageContent?.aboutSection?.cards]);

    const save = async (updatedCards: typeof allCards) => {
        setLocalSaving(true);
        try {
            const pc = {
                ...profile.pageContent,
                aboutSection: {
                    ...(profile.pageContent?.aboutSection || {}),
                    cards: updatedCards,
                },
            };
            await onSave({ pageContent: pc });
            showToast('Top service saved successfully!', 'success');
        } catch (e: any) {
            showToast(e?.message || 'Failed to save', 'error');
        } finally {
            setLocalSaving(false);
        }
    };

    const handleSaveFirst = async () => {
        const updated = [{ title: heading, description: subtitle }, ...extraCards];
        await save(updated);
    };

    const openNew = () => { setEditingIndex(-1); setForm({ title: '', description: '' }); };
    const openEdit = (i: number) => { setEditingIndex(i); setForm({ ...extraCards[i] }); };
    const cancel = () => { setEditingIndex(null); setForm(null); };

    const handleSaveItem = async () => {
        if (!form) return;
        let updated = [...extraCards];
        if (editingIndex === -1) updated.push(form);
        else if (editingIndex !== null) updated[editingIndex] = form;
        setExtraCards(updated);
        cancel();
        await save([{ title: heading, description: subtitle }, ...updated]);
    };

    const handleDelete = async (i: number) => {
        if (!window.confirm('Delete this service card?')) return;
        const updated = extraCards.filter((_, idx) => idx !== i);
        setExtraCards(updated);
        await save([{ title: heading, description: subtitle }, ...updated]);
    };

    const isSaving = saving || localSaving;

    return (
        <div>
            <div className="content-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>First Service Card</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>This updates the first card in the Overview section on the home page.</p>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">Heading</label>
                    <input value={heading} onChange={e => setHeading(e.target.value)} className="form-input" placeholder="Building Construction" />
                </div>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">Subtitle</label>
                    <textarea value={subtitle} onChange={e => setSubtitle(e.target.value)} className="form-textarea" rows={2} placeholder="Residential and Commercial buildings" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSaveFirst} disabled={isSaving} className="btn-primary">{isSaving ? 'Saving...' : <><FaSave /> Save First Card</>}</button>
                </div>
            </div>

            <div className="content-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Additional Service Cards ({extraCards.length})</h3>
                    <button onClick={openNew} disabled={editingIndex !== null} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}><FaPlus /> Add New Service</button>
                </div>

                <AnimatePresence>
                    {editingIndex !== null && form && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="content-card" style={{ marginBottom: '1rem', padding: '1rem', border: '2px solid var(--primary)' }}
                        >
                            <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{editingIndex === -1 ? 'New Service' : 'Edit Service'}</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Title</label>
                                    <input value={form.title} onChange={e => setForm(p => ({ ...p!, title: e.target.value }))} className="form-input" placeholder="Service title" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <input value={form.description} onChange={e => setForm(p => ({ ...p!, description: e.target.value }))} className="form-input" placeholder="Service description" />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button onClick={cancel} className="admin-icon-btn" style={{ fontSize: '0.85rem', width: 'auto', padding: '0.4rem 0.8rem' }}>Cancel</button>
                                <button onClick={handleSaveItem} disabled={isSaving} className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}><FaSave /> Save</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {extraCards.map((c, i) => (
                        <div key={i} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem' }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.title}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.description}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => openEdit(i)} className="admin-icon-btn"><FaEdit /></button>
                                <button onClick={() => handleDelete(i)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }}><FaTrash /></button>
                            </div>
                        </div>
                    ))}
                    {extraCards.length === 0 && (
                        <div style={{ padding: '1.5rem', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No additional cards yet. Click "Add New Service" above.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ───── Services Editor (Bottom Services) ───── */
interface ServiceItemForm { title: string; description: string; tags: string; color: string; images: string[]; }

const defaultServiceItems = [
    { title: 'Building Construction', description: 'High-quality residential, commercial, and industrial building construction using modern techniques and premium materials — delivered on time and within budget.', color: '#7BC043', tags: ['Residential', 'Commercial', 'Industrial', 'Infrastructure', 'Government', 'Project Management', 'Consultation'], images: [] },
    { title: 'Road Construction', description: 'Comprehensive road and highway construction services including asphalt paving, earthworks, drainage systems, and bridge construction for public and private sectors.', color: '#4ecdc4', tags: ['Highways', 'Bridges', 'Asphalt Paving', 'Earthworks', 'Drainage', 'Urban Roads', 'Rural Roads'], images: [] },
    { title: 'Real Estate Development', description: 'End-to-end real estate development from land acquisition and feasibility studies to design, construction, and property marketing — creating value at every stage.', color: '#ff5252', tags: ['Land Acquisition', 'Feasibility Studies', 'Design & Build', 'Property Marketing', 'Mixed-Use', 'Residential Estates', 'Commercial Plazas'], images: [] },
    { title: 'Property Management', description: 'Professional property management services including tenant sourcing, rent collection, maintenance coordination, and 24/7 emergency response for residential and commercial properties.', color: '#ff9f43', tags: ['Tenant Sourcing', 'Rent Collection', 'Maintenance', 'Emergency Response', 'Commercial Leasing', 'Residential Leasing', 'Facility Management'], images: [] },
    { title: 'Architectural Design', description: 'Innovative architectural design services from concept to completion — creating functional, sustainable, and aesthetically outstanding buildings and spaces.', color: '#fd79a8', tags: ['Concept Design', 'Sustainable Architecture', '3D Visualization', 'Structural Planning', 'Interior Design', 'Urban Design', 'Landscaping'], images: [] },
    { title: 'Interior & Exterior Finishing', description: 'Premium interior and exterior finishing services including painting, flooring, tiling, ceiling installation, façade cladding, and landscaping — adding the perfect final touch.', color: '#fdcb6e', tags: ['Painting', 'Flooring', 'Tiling', 'Ceiling', 'Façade Cladding', 'Landscaping', 'Joinery'], images: [] },
];

const ServicesEditor: React.FC<Props> = ({ profile, onSave, saving }) => {
    const { showToast } = useToast();
    const [heading, setHeading] = useState(profile.pageContent?.services?.heading || 'Core Services');
    const [subtitle, setSubtitle] = useState(profile.pageContent?.services?.subtitle || 'We deliver end-to-end construction and real estate solutions tailored to your needs — from planning and design to execution and project handover.');
    const [items, setItems] = useState(profile.pageContent?.services?.items?.length ? profile.pageContent.services.items : defaultServiceItems);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [form, setForm] = useState<ServiceItemForm | null>(null);
    const [localSaving, setLocalSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const pc = profile.pageContent;
        setHeading(pc?.services?.heading || 'Core Services');
        setSubtitle(pc?.services?.subtitle || 'We deliver end-to-end construction and real estate solutions tailored to your needs — from planning and design to execution and project handover.');
        setItems(pc?.services?.items?.length ? pc.services.items : defaultServiceItems);
    }, [profile.pageContent]);

    const save = async () => {
        setLocalSaving(true);
        try {
            let finalItems = items;
            if (form) {
                finalItems = [...items];
                const newItem = { title: form.title, description: form.description, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), color: form.color, images: form.images };
                if (editingIndex === -1) finalItems.push(newItem);
                else if (editingIndex !== null) finalItems[editingIndex] = newItem;
            }
            const pc = { ...profile.pageContent, services: { heading, subtitle, items: finalItems } };
            console.log('Services save: sending', JSON.stringify(pc.services).slice(0, 200));
            await onSave({ pageContent: pc });
            showToast('Services saved successfully!', 'success');
            if (form) cancel();
        } catch (e: any) {
            console.error('Services save error:', e);
            const msg = e?.response?.data?.message || e?.message || 'Failed to save services';
            showToast(msg, 'error');
        } finally {
            setLocalSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploading(true);
        setUploadProgress(10);
        try {
            const fileArray = Array.from(files);
            const results = await Promise.all(fileArray.map((f) =>
                uploadService.uploadFile(f).then(r => r.secureUrl)
            ));
            setForm(p => ({ ...p!, images: [...(p?.images || []), ...results] }));
            setUploadProgress(100);
            setTimeout(() => setUploadProgress(0), 1500);
        } catch (e: any) {
            alert('Upload failed: ' + (e?.response?.data?.message || e?.message || 'unknown error'));
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (idx: number) => {
        setForm(p => ({ ...p!, images: p!.images.filter((_, i) => i !== idx) }));
    };

    const openNew = () => { setEditingIndex(-1); setForm({ title: '', description: '', tags: '', color: '#1B2042', images: [] }); };
    const openEdit = (i: number) => {
        const item = items[i];
        setEditingIndex(i);
        setForm({ title: item.title, description: item.description, tags: item.tags.join(', '), color: item.color, images: item.images || [] });
    };
    const cancel = () => { setEditingIndex(null); setForm(null); };

    const handleSaveItem = async () => {
        if (!form) return;
        const updated = [...items];
        const newItem = { title: form.title, description: form.description, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), color: form.color, images: form.images };
        if (editingIndex === -1) updated.push(newItem);
        else if (editingIndex !== null) updated[editingIndex] = newItem;
        setItems(updated);
        cancel();
    };

    const handleDelete = (i: number) => {
        if (!window.confirm('Delete this service?')) return;
        setItems(items.filter((_, idx) => idx !== i));
    };

    const isSaving = saving || localSaving;

    return (
        <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="form-group">
                    <label className="form-label">Section Heading</label>
                    <input value={heading} onChange={e => setHeading(e.target.value)} className="form-input" placeholder="Core Services" />
                </div>
                <div className="form-group">
                    <label className="form-label">Section Subtitle</label>
                    <textarea value={subtitle} onChange={e => setSubtitle(e.target.value)} className="form-textarea" rows={2} placeholder="What we offer subtitle" />
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Service Items ({items.length})</h3>
                <button onClick={openNew} disabled={editingIndex !== null} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}><FaPlus /> Add Service</button>
            </div>
            <AnimatePresence>
                {editingIndex !== null && form && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="content-card" style={{ marginBottom: '1rem', padding: '1rem', border: '2px solid var(--primary)' }}
                    >
                        <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{editingIndex === -1 ? 'New Service' : 'Edit Service'}</h4>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Title</label>
                            <input value={form.title} onChange={e => setForm(p => ({ ...p!, title: e.target.value }))} className="form-input" placeholder="Service name" />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Description</label>
                            <textarea value={form.description} onChange={e => setForm(p => ({ ...p!, description: e.target.value }))} className="form-textarea" rows={3} placeholder="Describe this service" />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Tags (comma separated)</label>
                            <input value={form.tags} onChange={e => setForm(p => ({ ...p!, tags: e.target.value }))} className="form-input" placeholder="e.g. Construction, Design, Planning" />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Accent Color</label>
                            <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p!, color: e.target.value }))} className="form-input" style={{ width: '80px', height: '40px', padding: '2px' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Slider Images</label>
                            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                                {form.images.map((img, idx) => (
                                    <div key={idx} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                        <img src={img} alt={`slide ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button type="button" onClick={() => removeImage(idx)} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>{uploading ? 'Uploading...' : <><FaUpload /> Add Image</>}</button>
                                {uploading && (
                                    <div style={{ flex: 1, minWidth: 100 }}>
                                        <div style={{ height: 8, background: 'var(--border-color)', borderRadius: 4, overflow: 'hidden' }}>
                                            <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--primary)', borderRadius: 4, transition: 'width 0.3s' }} />
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, textAlign: 'center' }}>{uploadProgress}%</div>
                                    </div>
                                )}
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Upload images that will appear as a slideshow on the service card</p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={cancel} className="admin-icon-btn" style={{ fontSize: '0.85rem', width: 'auto', padding: '0.4rem 0.8rem' }}>Cancel</button>
                            <button onClick={handleSaveItem} className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}><FaSave /> Save Item</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {items.map((s, i) => (
                    <div key={i} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: s.color, flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.title}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>{s.description}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => openEdit(i)} className="admin-icon-btn"><FaEdit /></button>
                            <button onClick={() => handleDelete(i)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }}><FaTrash /></button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <div style={{ padding: '1.5rem', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No services yet.</div>
                )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={save} disabled={isSaving} className="btn-primary">{isSaving ? 'Saving...' : <><FaSave /> Save Services</>}</button>
            </div>
        </div>
    );
};

/* ───── Events Editor ───── */
const EventsEditor: React.FC<Props> = ({ profile, onSave, saving }) => {
    const [events, setEvents] = useState(profile.pageContent?.events || []);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [form, setForm] = useState<any>(null);
    const [localSaving, setLocalSaving] = useState(false);

    useEffect(() => { setEvents(profile.pageContent?.events || []); }, [profile.pageContent?.events]);

    const save = async (updated: any[]) => {
        setLocalSaving(true);
        const pc = { ...profile.pageContent, events: updated };
        await onSave({ pageContent: pc });
        setLocalSaving(false);
    };

    const openNew = () => { setEditingIndex(-1); setForm({ title: '', date: '', location: '', description: '' }); };
    const openEdit = (i: number) => { setEditingIndex(i); setForm({ ...events[i] }); };
    const cancel = () => { setEditingIndex(null); };

    const handleSave = async () => {
        const updated = [...events];
        if (editingIndex === -1) updated.push(form);
        else if (editingIndex !== null) updated[editingIndex] = form;
        await save(updated);
        cancel();
    };

    const handleDelete = async (i: number) => {
        if (!window.confirm('Delete this event?')) return;
        await save(events.filter((_, idx) => idx !== i));
    };

    const isSaving = saving || localSaving;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Events ({events.length})</h3>
                <button onClick={openNew} disabled={editingIndex !== null} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}><FaPlus /> Add Event</button>
            </div>
            <AnimatePresence>
                {editingIndex !== null && form && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="content-card" style={{ marginBottom: '1rem', padding: '1rem', border: '2px solid var(--primary)' }}
                    >
                        <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{editingIndex === -1 ? 'New Event' : 'Edit Event'}</h4>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Title</label>
                            <input value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))} className="form-input" placeholder="Event title" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div className="form-group">
                                <label className="form-label">Date</label>
                                <input value={form.date} onChange={e => setForm((p: any) => ({ ...p, date: e.target.value }))} className="form-input" placeholder="e.g. 15 Aug 2026" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Location</label>
                                <input value={form.location} onChange={e => setForm((p: any) => ({ ...p, location: e.target.value }))} className="form-input" placeholder="e.g. Kigali, Rwanda" />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Description</label>
                            <textarea value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} className="form-textarea" rows={2} placeholder="Event description" />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={cancel} className="admin-icon-btn" style={{ fontSize: '0.85rem', width: 'auto', padding: '0.4rem 0.8rem' }}>Cancel</button>
                            <button onClick={handleSave} className="btn-primary" disabled={isSaving} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>{isSaving ? 'Saving...' : <><FaSave /> Save</>}</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {events.map((e, i) => (
                    <div key={i} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem' }}>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{e.title}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{e.date} — {e.location}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => openEdit(i)} className="admin-icon-btn"><FaEdit /></button>
                            <button onClick={() => handleDelete(i)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }}><FaTrash /></button>
                        </div>
                    </div>
                ))}
                {events.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)' }}>No events yet.</div>
                )}
            </div>
        </div>
    );
};

/* ───── Follow Us / Experience Editor ───── */
const FollowUsEditor: React.FC<Props> = ({ profile, onSave, saving }) => {
    const fu = profile.pageContent?.followUs;
    const [heading, setHeading] = useState(fu?.heading || 'Follow Us');
    const [subtitle, setSubtitle] = useState(fu?.subtitle || 'Watch our latest projects and company updates');
    const [youtubeUrl, setYoutubeUrl] = useState(fu?.youtubeUrl || 'https://www.youtube.com/embed/CJtOOX23Ofo');
    const [yearsOfExperience, setYearsOfExperience] = useState(profile.yearsOfExperience || 0);
    const [viewMoreText, setViewMoreText] = useState(fu?.viewMoreText || 'View More Videos');
    const [viewMoreUrl, setViewMoreUrl] = useState(fu?.viewMoreUrl || '/about');
    const [videos, setVideos] = useState(fu?.videos || [
        { url: 'https://www.youtube.com/embed/CJtOOX23Ofo', title: 'Construction project timelapse', description: '' },
        { url: 'https://www.youtube.com/embed/CJtOOX23Ofo', title: 'Behind the scenes showcase', description: '' },
    ]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [form, setForm] = useState<any>(null);
    const [localSaving, setLocalSaving] = useState(false);

    useEffect(() => {
        const d = profile.pageContent?.followUs;
        setHeading(d?.heading || 'Follow Us');
        setSubtitle(d?.subtitle || 'Watch our latest projects and company updates');
        setYoutubeUrl(d?.youtubeUrl || 'https://www.youtube.com/embed/CJtOOX23Ofo');
        setViewMoreText(d?.viewMoreText || 'View More Videos');
        setViewMoreUrl(d?.viewMoreUrl || '/about');
        setYearsOfExperience(profile.yearsOfExperience || 0);
        setVideos(d?.videos || [
            { url: 'https://www.youtube.com/embed/CJtOOX23Ofo', title: 'Construction project timelapse', description: '' },
            { url: 'https://www.youtube.com/embed/CJtOOX23Ofo', title: 'Behind the scenes showcase', description: '' },
        ]);
    }, [profile.pageContent?.followUs, profile.yearsOfExperience]);

    const save = async () => {
        setLocalSaving(true);
        const pc = { ...profile.pageContent, followUs: { heading, subtitle, youtubeUrl, videos, viewMoreText, viewMoreUrl } };
        await onSave({ pageContent: pc, yearsOfExperience } as any);
        setLocalSaving(false);
    };

    const openNew = () => { setEditingIndex(-1); setForm({ url: '', title: '', description: '' }); };
    const openEdit = (i: number) => { setEditingIndex(i); setForm({ ...videos[i] }); };
    const cancel = () => { setEditingIndex(null); };

    const handleSaveVideo = async () => {
        if (!form) return;
        const updated = [...videos];
        if (editingIndex === -1) updated.push(form);
        else if (editingIndex !== null) updated[editingIndex] = form;
        setVideos(updated);
        cancel();
    };

    const handleDeleteVideo = (i: number) => {
        if (!window.confirm('Delete this video?')) return;
        setVideos(videos.filter((_, idx) => idx !== i));
    };

    const isSaving = saving || localSaving;

    return (
        <div>
            <div className="content-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>Follow Us / Experience</h3>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">Section Heading</label>
                    <input value={heading} onChange={e => setHeading(e.target.value)} className="form-input" placeholder="Follow Us" />
                </div>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">Subtitle</label>
                    <input value={subtitle} onChange={e => setSubtitle(e.target.value)} className="form-input" placeholder="Watch our latest projects" />
                </div>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">Years of Experience</label>
                    <input type="number" value={yearsOfExperience} onChange={e => setYearsOfExperience(parseInt(e.target.value) || 0)} className="form-input" placeholder="e.g. 10" />
                </div>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">Main YouTube URL</label>
                    <input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} className="form-input" placeholder="https://www.youtube.com/embed/..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                        <label className="form-label">View More Text</label>
                        <input value={viewMoreText} onChange={e => setViewMoreText(e.target.value)} className="form-input" placeholder="View More Videos" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">View More URL</label>
                        <input value={viewMoreUrl} onChange={e => setViewMoreUrl(e.target.value)} className="form-input" placeholder="/about" />
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Videos ({videos.length})</h3>
                <button onClick={openNew} disabled={editingIndex !== null} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}><FaPlus /> Add Video</button>
            </div>
            <AnimatePresence>
                {editingIndex !== null && form && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="content-card" style={{ marginBottom: '1rem', padding: '1rem', border: '2px solid var(--primary)' }}
                    >
                        <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{editingIndex === -1 ? 'New Video' : 'Edit Video'}</h4>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">YouTube Embed URL</label>
                            <input value={form.url} onChange={e => setForm((p: any) => ({ ...p, url: e.target.value }))} className="form-input" placeholder="https://www.youtube.com/embed/..." />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Title</label>
                            <input value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))} className="form-input" placeholder="Video title" />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Description</label>
                            <input value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} className="form-input" placeholder="Short video description" />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={cancel} className="admin-icon-btn" style={{ fontSize: '0.85rem', width: 'auto', padding: '0.4rem 0.8rem' }}>Cancel</button>
                            <button onClick={handleSaveVideo} className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}><FaSave /> Save</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {videos.map((v, i) => (
                    <div key={i} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem' }}>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{v.title}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>{v.url}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => openEdit(i)} className="admin-icon-btn"><FaEdit /></button>
                            <button onClick={() => handleDeleteVideo(i)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }}><FaTrash /></button>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={save} disabled={isSaving} className="btn-primary">{isSaving ? 'Saving...' : <><FaSave /> Save Follow Us</>}</button>
            </div>
        </div>
    );
};

/* ───── Projects Editor (inline) ───── */
const ProjectsEditor: React.FC<Props> = ({ profile, onSave, saving }) => {
    const [projects, setProjects] = useState(profile.projects || []);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [form, setForm] = useState<any>(null);
    const [localSaving, setLocalSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setProjects(profile.projects || []); }, [profile.projects]);

    const save = async (updated: any[]) => {
        setLocalSaving(true);
        await onSave({ projects: updated } as any);
        setLocalSaving(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setUploadProgress(0);
        try {
            const uploaded = await uploadService.uploadFile(file, (pct) => setUploadProgress(pct));
            setForm((p: any) => ({ ...p, imageUrl: uploaded.secureUrl }));
        } catch {
            alert('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const openNew = () => { setEditingIndex(-1); setForm({ name: '', description: '', technologies: [], url: '', imageUrl: '', featured: false }); };
    const openEdit = (i: number) => { setEditingIndex(i); setForm({ ...projects[i], technologies: [...(projects[i].technologies || [])] }); };
    const cancel = () => { setEditingIndex(null); };

    const handleSave = async () => {
        const updated = [...projects];
        if (editingIndex === -1) updated.push(form);
        else if (editingIndex !== null) updated[editingIndex] = form;
        await save(updated);
        cancel();
    };

    const handleDelete = async (i: number) => {
        if (!window.confirm('Delete this project?')) return;
        await save(projects.filter((_, idx) => idx !== i));
    };

    const isSaving = saving || localSaving;

    const ps = profile.pageContent?.projectsSection;
    const [sectionHeading, setSectionHeading] = useState(ps?.heading || 'Featured Projects');
    const [sectionSubtitle, setSectionSubtitle] = useState(ps?.subtitle || 'Some of our recent work');

    useEffect(() => {
        const d = profile.pageContent?.projectsSection;
        setSectionHeading(d?.heading || 'Featured Projects');
        setSectionSubtitle(d?.subtitle || 'Some of our recent work');
    }, [profile.pageContent?.projectsSection]);

    const saveSection = async () => {
        setLocalSaving(true);
        const pc = { ...profile.pageContent, projectsSection: { heading: sectionHeading, subtitle: sectionSubtitle } };
        await onSave({ pageContent: pc } as any);
        setLocalSaving(false);
    };

    return (
        <div>
            <div className="content-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>Projects Section Settings</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                        <label className="form-label">Heading</label>
                        <input value={sectionHeading} onChange={e => setSectionHeading(e.target.value)} className="form-input" placeholder="Featured Projects" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Subtitle</label>
                        <input value={sectionSubtitle} onChange={e => setSectionSubtitle(e.target.value)} className="form-input" placeholder="Some of our recent work" />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                    <button onClick={saveSection} disabled={isSaving} className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>{isSaving ? 'Saving...' : <><FaSave /> Save Section</>}</button>
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Project Items ({projects.length})</h3>
                <button onClick={openNew} disabled={editingIndex !== null} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}><FaPlus /> Add</button>
            </div>
            <AnimatePresence>
                {editingIndex !== null && form && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="content-card" style={{ marginBottom: '1rem', padding: '1rem', border: '2px solid var(--primary)' }}
                    >
                        <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{editingIndex === -1 ? 'New Project' : 'Edit Project'}</h4>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Name</label>
                            <input value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} className="form-input" placeholder="Project name" />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Description</label>
                            <textarea value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} className="form-textarea" rows={3} placeholder="Project description" />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Image</label>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                {form.imageUrl && (
                                    <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                                        <img src={form.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button type="button" onClick={() => setForm((p: any) => ({ ...p, imageUrl: '' }))} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                                    </div>
                                )}
                                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                                    {uploading ? 'Uploading...' : <><FaUpload /> {form.imageUrl ? 'Replace Image' : 'Upload Image'}</>}
                                </button>
                                {uploading && (
                                    <div style={{ flex: 1, minWidth: 120 }}>
                                        <div style={{ height: 8, background: 'var(--border-color)', borderRadius: 4, overflow: 'hidden' }}>
                                            <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--primary)', borderRadius: 4, transition: 'width 0.3s' }} />
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, textAlign: 'center' }}>{uploadProgress}%</div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Live URL</label>
                            <input value={form.url || ''} onChange={e => setForm((p: any) => ({ ...p, url: e.target.value }))} className="form-input" placeholder="https://example.com" />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Technologies (comma separated)</label>
                            <input value={Array.isArray(form.technologies) ? form.technologies.join(', ') : form.technologies || ''} onChange={e => setForm((p: any) => ({ ...p, technologies: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) }))} className="form-input" placeholder="e.g. React, TypeScript, Node.js" />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={cancel} className="admin-icon-btn" style={{ fontSize: '0.85rem', width: 'auto', padding: '0.4rem 0.8rem' }}>Cancel</button>
                            <button onClick={handleSave} className="btn-primary" disabled={isSaving} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>{isSaving ? 'Saving...' : <><FaSave /> Save</>}</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {projects.map((p, i) => (
                    <div key={i} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem' }}>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>{p.description}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => openEdit(i)} className="admin-icon-btn"><FaEdit /></button>
                            <button onClick={() => handleDelete(i)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }}><FaTrash /></button>
                        </div>
                    </div>
                ))}
                {projects.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)' }}>No projects yet.</div>
                )}
            </div>
        </div>
    );
};

/* ───── Our Team Editor (inline) ───── */
const OurTeamEditor: React.FC<Props> = ({ profile, onSave, saving }) => {
    const [members, setMembers] = useState(profile.teamMembers || []);
    const [visible, setVisible] = useState(profile.pageContent?.showTeamSection !== false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [form, setForm] = useState<any>(null);
    const [localSaving, setLocalSaving] = useState(false);

    useEffect(() => {
        setMembers(profile.teamMembers || []);
        setVisible(profile.pageContent?.showTeamSection !== false);
    }, [profile.teamMembers, profile.pageContent?.showTeamSection]);

    const save = async (updated: any[]) => {
        setLocalSaving(true);
        const pc = { ...profile.pageContent, showTeamSection: visible };
        await onSave({ teamMembers: updated, pageContent: pc } as any);
        setLocalSaving(false);
    };

    const toggleVisibility = async () => {
        const next = !visible;
        setVisible(next);
        setLocalSaving(true);
        const pc = { ...profile.pageContent, showTeamSection: next };
        await onSave({ pageContent: pc } as any);
        setLocalSaving(false);
    };

    const openNew = () => { setEditingIndex(-1); setForm({ name: '', role: '', imageUrl: '' }); };
    const openEdit = (i: number) => { setEditingIndex(i); setForm({ ...members[i] }); };
    const cancel = () => { setEditingIndex(null); };

    const handleSave = async () => {
        const updated = [...members];
        if (editingIndex === -1) updated.push(form);
        else if (editingIndex !== null) updated[editingIndex] = form;
        await save(updated);
        cancel();
    };

    const handleDelete = async (i: number) => {
        if (!window.confirm('Delete this member?')) return;
        await save(members.filter((_, idx) => idx !== i));
    };

    const isSaving = saving || localSaving;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Team Members ({members.length})</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <input type="checkbox" checked={visible} onChange={toggleVisibility} disabled={saving || localSaving} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                        Visible on website
                    </label>
                    <button onClick={openNew} disabled={editingIndex !== null} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}><FaPlus /> Add</button>
                </div>
            </div>
            <AnimatePresence>
                {editingIndex !== null && form && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="content-card" style={{ marginBottom: '1rem', padding: '1rem', border: '2px solid var(--primary)' }}
                    >
                        <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{editingIndex === -1 ? 'New Member' : 'Edit Member'}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} className="form-input" placeholder="Full name" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <input value={form.role} onChange={e => setForm((p: any) => ({ ...p, role: e.target.value }))} className="form-input" placeholder="e.g. Project Manager" />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Image URL</label>
                            <input value={form.imageUrl || ''} onChange={e => setForm((p: any) => ({ ...p, imageUrl: e.target.value }))} className="form-input" placeholder="https://example.com/photo.jpg" />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={cancel} className="admin-icon-btn" style={{ fontSize: '0.85rem', width: 'auto', padding: '0.4rem 0.8rem' }}>Cancel</button>
                            <button onClick={handleSave} className="btn-primary" disabled={isSaving} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>{isSaving ? 'Saving...' : <><FaSave /> Save</>}</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {members.map((m, i) => (
                    <div key={i} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {m.imageUrl && <img src={m.imageUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{m.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.role}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => openEdit(i)} className="admin-icon-btn"><FaEdit /></button>
                            <button onClick={() => handleDelete(i)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }}><FaTrash /></button>
                        </div>
                    </div>
                ))}
                {members.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)' }}>No team members yet.</div>
                )}
            </div>
        </div>
    );
};

/* ───── Get in Touch / Contact Editor ───── */
const GetInTouchEditor: React.FC<Props> = ({ profile, onSave, saving }) => {
    const cs = profile.pageContent?.contactSection;
    const [heading, setHeading] = useState(cs?.heading || 'Get In Touch');
    const [subtitle, setSubtitle] = useState(cs?.subtitle || 'Have a project in mind? Reach out to us today.');
    const [phone, setPhone] = useState(profile.phone || '');
    const [email, setEmail] = useState(profile.email || '');
    const [address, setAddress] = useState(profile.address || '');
    const [localSaving, setLocalSaving] = useState(false);

    useEffect(() => {
        const d = profile.pageContent?.contactSection;
        setHeading(d?.heading || 'Get In Touch');
        setSubtitle(d?.subtitle || 'Have a project in mind? Reach out to us today.');
        setPhone(profile.phone || '');
        setEmail(profile.email || '');
        setAddress(profile.address || '');
    }, [profile.pageContent?.contactSection, profile.phone, profile.email, profile.address]);

    const save = async () => {
        setLocalSaving(true);
        const pc = { ...profile.pageContent, contactSection: { heading, subtitle } };
        await onSave({ pageContent: pc, phone, email, address } as any);
        setLocalSaving(false);
    };

    const isSaving = saving || localSaving;

    return (
        <div className="content-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>Get in Touch</h3>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label">Section Heading</label>
                <input value={heading} onChange={e => setHeading(e.target.value)} className="form-input" placeholder="Get In Touch" />
            </div>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label">Section Subtitle</label>
                <textarea value={subtitle} onChange={e => setSubtitle(e.target.value)} className="form-textarea" rows={2} placeholder="Have a project in mind? Reach out to us today." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)} className="form-input" placeholder="+250 788 000 000" />
                </div>
                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} className="form-input" placeholder="info@example.com" />
                </div>
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Address</label>
                <input value={address} onChange={e => setAddress(e.target.value)} className="form-input" placeholder="Kigali, Rwanda" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={save} disabled={isSaving} className="btn-primary">{isSaving ? 'Saving...' : <><FaSave /> Save Contact Info</>}</button>
            </div>
        </div>
    );
};

/* ───── FAQ Editor ───── */
const FaqEditor: React.FC<Props> = ({ profile, onSave, saving }) => {
    const faq = profile.pageContent?.faq;
    const [heading, setHeading] = useState(faq?.heading || 'Frequently Asked Questions');
    const [items, setItems] = useState(faq?.items || [
        { question: 'What types of construction projects do you handle?', answer: 'We handle residential, commercial, and industrial construction projects.' },
        { question: 'How can I get a quote?', answer: 'Contact us through our website or call us for a free consultation and estimate.' },
    ]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [form, setForm] = useState<any>(null);
    const [localSaving, setLocalSaving] = useState(false);

    useEffect(() => {
        const d = profile.pageContent?.faq;
        setHeading(d?.heading || 'Frequently Asked Questions');
        setItems(d?.items || [
            { question: 'What types of construction projects do you handle?', answer: 'We handle residential, commercial, and industrial construction projects.' },
            { question: 'How can I get a quote?', answer: 'Contact us through our website or call us for a free consultation and estimate.' },
        ]);
    }, [profile.pageContent?.faq]);

    const save = async () => {
        setLocalSaving(true);
        const pc = { ...profile.pageContent, faq: { heading, items } };
        await onSave({ pageContent: pc });
        setLocalSaving(false);
    };

    const openNew = () => { setEditingIndex(-1); setForm({ question: '', answer: '' }); };
    const openEdit = (i: number) => { setEditingIndex(i); setForm({ ...items[i] }); };
    const cancel = () => { setEditingIndex(null); };

    const handleSaveItem = async () => {
        if (!form) return;
        const updated = [...items];
        if (editingIndex === -1) updated.push(form);
        else if (editingIndex !== null) updated[editingIndex] = form;
        setItems(updated);
        cancel();
    };

    const handleDelete = (i: number) => {
        if (!window.confirm('Delete this FAQ item?')) return;
        setItems(items.filter((_, idx) => idx !== i));
    };

    const isSaving = saving || localSaving;

    return (
        <div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Section Heading</label>
                <input value={heading} onChange={e => setHeading(e.target.value)} className="form-input" placeholder="Frequently Asked Questions" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>FAQ Items ({items.length})</h3>
                <button onClick={openNew} disabled={editingIndex !== null} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}><FaPlus /> Add Q&A</button>
            </div>
            <AnimatePresence>
                {editingIndex !== null && form && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="content-card" style={{ marginBottom: '1rem', padding: '1rem', border: '2px solid var(--primary)' }}
                    >
                        <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{editingIndex === -1 ? 'New Q&A' : 'Edit Q&A'}</h4>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Question</label>
                            <input value={form.question} onChange={e => setForm((p: any) => ({ ...p, question: e.target.value }))} className="form-input" placeholder="Enter a common question" />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Answer</label>
                            <textarea value={form.answer} onChange={e => setForm((p: any) => ({ ...p, answer: e.target.value }))} className="form-textarea" rows={3} placeholder="Provide a clear answer" />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={cancel} className="admin-icon-btn" style={{ fontSize: '0.85rem', width: 'auto', padding: '0.4rem 0.8rem' }}>Cancel</button>
                            <button onClick={handleSaveItem} className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}><FaSave /> Save</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {items.map((item, i) => (
                    <div key={i} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem' }}>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.question}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '350px' }}>{item.answer}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => openEdit(i)} className="admin-icon-btn"><FaEdit /></button>
                            <button onClick={() => handleDelete(i)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }}><FaTrash /></button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)' }}>No FAQ items yet.</div>
                )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={save} disabled={isSaving} className="btn-primary">{isSaving ? 'Saving...' : <><FaSave /> Save FAQ</>}</button>
            </div>
        </div>
    );
};

export default HomeSectionsTab;
