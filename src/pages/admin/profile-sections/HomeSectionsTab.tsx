import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHome, FaConciergeBell, FaSave, FaPlus, FaEdit, FaTrash, FaTimes, FaEnvelope, FaQuestionCircle, FaUpload, FaVideo, FaGem, FaEye, FaBullseye, FaStar } from 'react-icons/fa';
import type { Profile } from '../../../services/profileService';
import { profileService } from '../../../services/profileService';
import { useToast } from '../../../context/ToastContext';
import { uploadService } from '../../../services/uploadService';

// Projects and Team each have their own dedicated top-level CMS tab already
// (ProjectsTab.tsx / TeamTab.tsx) — no nested duplicate here, so there's only
// ever one place that writes profile.projects / profile.teamMembers.
type HomeTab = 'hero-slides' | 'services' | 'commitment' | 'vmv' | 'follow-us' | 'get-in-touch' | 'faq';

interface Props {
    profile: Profile;
    onSave: (u: Partial<Profile>) => Promise<void>;
    saving: boolean;
}

const SUB_TABS: { id: HomeTab; label: string; icon: React.ReactNode }[] = [
    { id: 'hero-slides', label: 'Hero Slides', icon: <FaHome /> },
    { id: 'services', label: 'Services', icon: <FaConciergeBell /> },
    { id: 'commitment', label: 'What Makes Us Different', icon: <FaGem /> },
    { id: 'vmv', label: 'Vision / Mission / Values', icon: <FaEye /> },
    { id: 'follow-us', label: 'Follow Us (Videos)', icon: <FaVideo /> },
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
                    {subTab === 'services' && <ServicesEditor profile={profile} onSave={onSave} saving={saving} />}
                    {subTab === 'commitment' && <CommitmentEditor profile={profile} onSave={onSave} saving={saving} />}
                    {subTab === 'vmv' && <VMVEditor profile={profile} onSave={onSave} saving={saving} />}
                    {subTab === 'follow-us' && <FollowUsEditor profile={profile} onSave={onSave} saving={saving} />}
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
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [form, setForm] = useState<any>(null);
    const [localSaving, setLocalSaving] = useState(false);
    const videoFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setSlides(profile.pageContent?.heroSlides || []);
        setVideoData(profile.pageContent?.heroVideoUrl || '');
    }, [profile.pageContent?.heroSlides, profile.pageContent?.heroVideoUrl]);

    const triggerVideoPicker = () => {
        if (videoFileRef.current) {
            videoFileRef.current.click();
        }
    };

    const handleVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            showToast('Video must be smaller than 50MB', 'error');
            return;
        }
        setVideoFileName(file.name);
        setUploading(true);
        setUploadProgress(0);
        try {
            const uploaded = await uploadService.uploadFile(file, (pct) => setUploadProgress(pct));
            setVideoData(uploaded.secureUrl);
            await saveSlides(slides, uploaded.secureUrl);
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || 'Failed to upload video';
            showToast(msg, 'error');
        } finally {
            setUploading(false);
            setUploadProgress(0);
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
                            <button type="button" onClick={triggerVideoPicker} disabled={uploading} className="admin-icon-btn" style={{ width: 'auto', padding: '0.4rem 0.8rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem' }}><FaUpload /> {uploading ? 'Uploading...' : 'Replace'}</button>
                            <button type="button" onClick={removeVideo} className="admin-icon-btn" style={{ color: 'var(--primary-red)', width: 'auto', padding: '0.4rem 0.8rem', border: '1px solid var(--primary-red)', borderRadius: '6px', fontSize: '0.85rem' }}><FaTimes /> Remove</button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <button type="button" onClick={triggerVideoPicker} disabled={uploading} className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}><FaUpload /> {uploading ? 'Uploading...' : 'Upload Video'}</button>
                        {uploading && (
                            <div style={{ marginTop: '8px' }}>
                                <div style={{ height: 8, background: 'var(--border-color)', borderRadius: 4, overflow: 'hidden' }}>
                                    <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--primary)', borderRadius: 4, transition: 'width 0.3s' }} />
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, textAlign: 'center' }}>{uploadProgress}%</div>
                            </div>
                        )}
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

/* ───── Services Editor (Bottom Services) ───── */
interface ServiceItemForm { title: string; description: string; tags: string; color: string; images: string[]; }



const ServicesEditor: React.FC<Props> = ({ profile, onSave, saving }) => {
    const { showToast } = useToast();
    const [heading, setHeading] = useState(profile.pageContent?.services?.heading || '');
    const [subtitle, setSubtitle] = useState(profile.pageContent?.services?.subtitle || '');
    const [items, setItems] = useState(profile.pageContent?.services?.items || []);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [form, setForm] = useState<ServiceItemForm | null>(null);
    const [localSaving, setLocalSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const pc = profile.pageContent;
        setHeading(pc?.services?.heading || '');
        setSubtitle(pc?.services?.subtitle || '');
        setItems(pc?.services?.items || []);
    }, [profile.pageContent]);

    const save = async () => {
        setLocalSaving(true);
        setSaveMessage(null);
        try {
            let finalItems = items;
            if (form) {
                finalItems = [...items];
                const tags = (form.tags || '').split(',').map(t => t.trim()).filter(Boolean);
                const newItem = { title: form.title || '', description: form.description || '', tags, color: form.color || '#1B2042', images: form.images || [] };
                if (editingIndex === -1) finalItems.push(newItem);
                else if (editingIndex !== null) finalItems[editingIndex] = newItem;
            }
            const pc = { ...(profile.pageContent || {}), services: { heading, subtitle, items: finalItems } };
            const updated = await profileService.updateProfile({ pageContent: pc });
            window.dispatchEvent(new CustomEvent('profile-updated'));
            setSaveMessage('Services saved successfully!');
            setTimeout(() => setSaveMessage(null), 4000);
            showToast('Services saved successfully!', 'success');
            if (form) cancel();
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || 'Failed to save services';
            setSaveMessage('Error: ' + msg);
            setTimeout(() => setSaveMessage(null), 6000);
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
                {saveMessage && (
                    <span style={{
                        fontSize: '0.85rem', fontWeight: 600,
                        color: saveMessage.startsWith('Error') ? '#d32f2f' : '#2e7d32',
                        background: saveMessage.startsWith('Error') ? '#ffebee' : '#e8f5e9',
                        padding: '6px 14px', borderRadius: '8px',
                    }}>{saveMessage}</span>
                )}
                <button onClick={save} disabled={isSaving} className="btn-primary">{isSaving ? 'Saving...' : <><FaSave /> Save Services</>}</button>
            </div>
        </div>
    );
};


/* ───── "What Makes Us Different" (Commitment) Editor ───── */
interface CommitmentForm {
    anchorImage: string;
    anchorTitle: string;
    anchorDescription: string;
    cards: { title: string; description: string }[];
    imageCardImage: string;
}

const CommitmentEditor: React.FC<Props> = ({ profile, onSave, saving }) => {
    const { showToast } = useToast();
    const buildForm = (p: Profile): CommitmentForm => {
        const c = p.pageContent?.commitment;
        const cards = [0, 1, 2].map(i => c?.cards?.[i] || { title: '', description: '' });
        return {
            anchorImage: c?.anchorImage || '',
            anchorTitle: c?.anchorTitle || '',
            anchorDescription: c?.anchorDescription || '',
            cards,
            imageCardImage: c?.imageCardImage || '',
        };
    };
    const [form, setForm] = useState<CommitmentForm>(buildForm(profile));
    const [localSaving, setLocalSaving] = useState(false);
    const [uploadingAnchor, setUploadingAnchor] = useState(false);
    const [uploadingImageCard, setUploadingImageCard] = useState(false);
    const anchorFileRef = useRef<HTMLInputElement>(null);
    const imageCardFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setForm(buildForm(profile));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile.pageContent?.commitment]);

    const uploadTo = async (file: File, key: 'anchorImage' | 'imageCardImage', setUploading: (b: boolean) => void) => {
        if (file.size > 2 * 1024 * 1024) { showToast('Image must be smaller than 2MB', 'error'); return; }
        setUploading(true);
        try {
            const uploaded = await uploadService.uploadFile(file);
            setForm(p => ({ ...p, [key]: uploaded.secureUrl }));
        } catch (e: any) {
            showToast(e?.response?.data?.message || e?.message || 'Failed to upload image', 'error');
        } finally {
            setUploading(false);
        }
    };

    const updateCard = (i: number, field: 'title' | 'description', value: string) => {
        setForm(p => ({ ...p, cards: p.cards.map((c, idx) => idx === i ? { ...c, [field]: value } : c) }));
    };

    const save = async () => {
        setLocalSaving(true);
        try {
            const pc = { ...(profile.pageContent || {}), commitment: form };
            await onSave({ pageContent: pc });
            showToast('"What Makes Us Different" section saved!', 'success');
        } catch (e: any) {
            showToast(e?.response?.data?.message || e?.message || 'Failed to save', 'error');
        } finally {
            setLocalSaving(false);
        }
    };

    const isSaving = saving || localSaving;

    return (
        <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Controls the "What Makes Us Different" section on the homepage — the large image card, the two image-backed cards, and the image-only card.
            </p>

            <div className="content-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Large Card (with photo)</h4>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">Image</label>
                    <input ref={anchorFileRef} type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadTo(f, 'anchorImage', setUploadingAnchor); }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {form.anchorImage ? (
                            <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '2px solid var(--border-color)', flexShrink: 0 }}>
                                <img src={form.anchorImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        ) : (
                            <div style={{ width: 80, height: 80, borderRadius: 8, border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0 }}>Default</div>
                        )}
                        <button type="button" onClick={() => anchorFileRef.current?.click()} disabled={uploadingAnchor} className="admin-icon-btn" style={{ width: 'auto', padding: '0.5rem 1rem', gap: '8px', border: '1px solid var(--border-color)' }}>
                            <FaUpload /> {uploadingAnchor ? 'Uploading...' : form.anchorImage ? 'Replace' : 'Upload'}
                        </button>
                        {form.anchorImage && (
                            <button type="button" onClick={() => setForm(p => ({ ...p, anchorImage: '' }))} className="admin-icon-btn" style={{ width: 'auto', padding: '0.5rem 1rem' }}><FaTimes /> Remove</button>
                        )}
                    </div>
                </div>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">Title</label>
                    <input value={form.anchorTitle} onChange={e => setForm(p => ({ ...p, anchorTitle: e.target.value }))} className="form-input" placeholder="Client-Focused Delivery" />
                </div>
                <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea value={form.anchorDescription} onChange={e => setForm(p => ({ ...p, anchorDescription: e.target.value }))} className="form-textarea" rows={2} placeholder="We prioritize clear communication..." />
                </div>
            </div>

            <div className="content-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Three Text Cards</h4>
                {form.cards.map((card, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: i < 2 ? '0.75rem' : 0, paddingBottom: i < 2 ? '0.75rem' : 0, borderBottom: i < 2 ? '1px solid var(--border-color)' : 'none' }}>
                        <div className="form-group">
                            <label className="form-label">Card {i + 1} Title</label>
                            <input value={card.title} onChange={e => updateCard(i, 'title', e.target.value)} className="form-input" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Card {i + 1} Description</label>
                            <input value={card.description} onChange={e => updateCard(i, 'description', e.target.value)} className="form-input" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="content-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Image-Only Card</h4>
                <input ref={imageCardFileRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadTo(f, 'imageCardImage', setUploadingImageCard); }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {form.imageCardImage ? (
                        <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '2px solid var(--border-color)', flexShrink: 0 }}>
                            <img src={form.imageCardImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    ) : (
                        <div style={{ width: 80, height: 80, borderRadius: 8, border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0 }}>Default</div>
                    )}
                    <button type="button" onClick={() => imageCardFileRef.current?.click()} disabled={uploadingImageCard} className="admin-icon-btn" style={{ width: 'auto', padding: '0.5rem 1rem', gap: '8px', border: '1px solid var(--border-color)' }}>
                        <FaUpload /> {uploadingImageCard ? 'Uploading...' : form.imageCardImage ? 'Replace' : 'Upload'}
                    </button>
                    {form.imageCardImage && (
                        <button type="button" onClick={() => setForm(p => ({ ...p, imageCardImage: '' }))} className="admin-icon-btn" style={{ width: 'auto', padding: '0.5rem 1rem' }}><FaTimes /> Remove</button>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={save} disabled={isSaving || uploadingAnchor || uploadingImageCard} className="btn-primary">{isSaving ? 'Saving...' : <><FaSave /> Save</>}</button>
            </div>
        </div>
    );
};

/* ───── Vision / Mission / Values Editor ───── */
interface VMVForm {
    mission: { title: string; text: string; icon: string };
    vision: { title: string; text: string; icon: string };
    philosophy: { title: string; text: string; icon: string };
    coreValues: Array<{ title: string; text: string; icon: string }>;
}

const VMVEditor: React.FC<Props> = ({ profile, onSave, saving }) => {
    const { showToast } = useToast();
    const pc = profile.pageContent;
    const [localSaving, setLocalSaving] = useState(false);
    const [form, setForm] = useState<VMVForm>({
        mission: pc?.mission || { title: 'Our Mission', text: '', icon: 'bullseye' },
        vision: pc?.vision || { title: 'Our Vision', text: '', icon: 'eye' },
        philosophy: pc?.philosophy || { title: 'Our Philosophy', text: '', icon: 'heart' },
        coreValues: pc?.coreValues && pc.coreValues.length > 0
            ? pc.coreValues
            : [
                { title: 'Quality', text: '', icon: 'star' },
                { title: 'Integrity', text: '', icon: 'check' },
                { title: 'Innovation', text: '', icon: 'bullseye' },
                { title: 'Reliability', text: '', icon: 'heart' },
                { title: 'Safety', text: '', icon: 'check' },
                { title: 'Excellence', text: '', icon: 'star' },
            ],
    });

    useEffect(() => {
        const c = profile.pageContent;
        setForm({
            mission: c?.mission || { title: 'Our Mission', text: '', icon: 'bullseye' },
            vision: c?.vision || { title: 'Our Vision', text: '', icon: 'eye' },
            philosophy: c?.philosophy || { title: 'Our Philosophy', text: '', icon: 'heart' },
            coreValues: c?.coreValues && c.coreValues.length > 0
                ? c.coreValues
                : [
                    { title: 'Quality', text: '', icon: 'star' },
                    { title: 'Integrity', text: '', icon: 'check' },
                    { title: 'Innovation', text: '', icon: 'bullseye' },
                    { title: 'Reliability', text: '', icon: 'heart' },
                    { title: 'Safety', text: '', icon: 'check' },
                    { title: 'Excellence', text: '', icon: 'star' },
                ],
        });
    }, [profile.pageContent]);

    const updateMissionVision = (field: 'mission' | 'vision' | 'philosophy', key: 'title' | 'text', value: string) => {
        setForm(p => ({ ...p, [field]: { ...p[field], [key]: value } }));
    };

    const updateCoreValue = (i: number, key: 'title' | 'text', value: string) => {
        setForm(p => {
            const values = [...p.coreValues];
            values[i] = { ...values[i], [key]: value };
            return { ...p, coreValues: values };
        });
    };

    const addCoreValue = () => {
        setForm(p => ({ ...p, coreValues: [...p.coreValues, { title: '', text: '', icon: 'star' }] }));
    };

    const removeCoreValue = (i: number) => {
        setForm(p => ({ ...p, coreValues: p.coreValues.filter((_, idx) => idx !== i) }));
    };

    const save = async () => {
        setLocalSaving(true);
        try {
            const pc = { ...(profile.pageContent || {}), mission: form.mission, vision: form.vision, philosophy: form.philosophy, coreValues: form.coreValues };
            await onSave({ pageContent: pc });
            showToast('Vision / Mission / Values saved!', 'success');
        } catch (e: any) {
            showToast(e?.response?.data?.message || e?.message || 'Failed to save', 'error');
        } finally {
            setLocalSaving(false);
        }
    };

    const isSaving = saving || localSaving;

    const cardStyle: React.CSSProperties = { padding: '1rem', marginBottom: '1rem', border: '1px solid var(--border-color)', borderRadius: 8 };
    const inputStyle: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.85rem', background: 'var(--bg-white)', color: 'var(--text-main)' };
    const labelStyle: React.CSSProperties = { fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' };

    return (
        <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Edit the Vision, Mission, Values, and Philosophy sections displayed on the <strong>/vision-mission-values</strong> page.
            </p>

            {/* Mission */}
            <div style={cardStyle}>
                <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaBullseye style={{ color: 'var(--accent, #D97706)' }} /> Mission
                </h4>
                <div style={{ marginBottom: '0.75rem' }}>
                    <label style={labelStyle}>Title</label>
                    <input value={form.mission.title} onChange={e => updateMissionVision('mission', 'title', e.target.value)} style={inputStyle} placeholder="Our Mission" />
                </div>
                <div>
                    <label style={labelStyle}>Description</label>
                    <textarea value={form.mission.text} onChange={e => updateMissionVision('mission', 'text', e.target.value)} style={{ ...inputStyle, minHeight: 80 }} rows={3} placeholder="Describe your mission..." />
                </div>
            </div>

            {/* Vision */}
            <div style={cardStyle}>
                <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaEye style={{ color: '#16324F' }} /> Vision
                </h4>
                <div style={{ marginBottom: '0.75rem' }}>
                    <label style={labelStyle}>Title</label>
                    <input value={form.vision.title} onChange={e => updateMissionVision('vision', 'title', e.target.value)} style={inputStyle} placeholder="Our Vision" />
                </div>
                <div>
                    <label style={labelStyle}>Description</label>
                    <textarea value={form.vision.text} onChange={e => updateMissionVision('vision', 'text', e.target.value)} style={{ ...inputStyle, minHeight: 80 }} rows={3} placeholder="Describe your vision..." />
                </div>
            </div>

            {/* Philosophy */}
            <div style={cardStyle}>
                <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaStar style={{ color: 'var(--accent, #D97706)' }} /> Philosophy
                </h4>
                <div style={{ marginBottom: '0.75rem' }}>
                    <label style={labelStyle}>Title</label>
                    <input value={form.philosophy.title} onChange={e => updateMissionVision('philosophy', 'title', e.target.value)} style={inputStyle} placeholder="Our Philosophy" />
                </div>
                <div>
                    <label style={labelStyle}>Description</label>
                    <textarea value={form.philosophy.text} onChange={e => updateMissionVision('philosophy', 'text', e.target.value)} style={{ ...inputStyle, minHeight: 80 }} rows={3} placeholder="Describe your philosophy..." />
                </div>
            </div>

            {/* Core Values */}
            <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <FaStar style={{ color: 'var(--accent, #D97706)' }} /> Core Values ({form.coreValues.length})
                    </h4>
                    <button onClick={addCoreValue} style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 6, background: 'var(--bg-white)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-main)' }}>
                        <FaPlus /> Add Value
                    </button>
                </div>
                {form.coreValues.map((val, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.5rem', alignItems: 'start', marginBottom: i < form.coreValues.length - 1 ? '0.75rem' : 0, paddingBottom: i < form.coreValues.length - 1 ? '0.75rem' : 0, borderBottom: i < form.coreValues.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                        <input value={val.title} onChange={e => updateCoreValue(i, 'title', e.target.value)} style={inputStyle} placeholder="Value title" />
                        <input value={val.text} onChange={e => updateCoreValue(i, 'text', e.target.value)} style={inputStyle} placeholder="Short description" />
                        <button onClick={() => removeCoreValue(i)} style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: 'rgba(220,38,38,0.1)', color: 'var(--primary-red)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FaTrash size={12} />
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={save} disabled={isSaving} className="btn-primary">{isSaving ? 'Saving...' : <><FaSave /> Save</>}</button>
            </div>
        </div>
    );
};

/* ───── Follow Us (Videos) Editor ───── */
interface FollowUsVideoForm {
    url: string;
    title: string;
    description: string;
}

const FollowUsEditor: React.FC<Props> = ({ profile, onSave, saving }) => {
    const { showToast } = useToast();
    const section = profile.pageContent?.followUs;
    const [subtitle, setSubtitle] = useState(section?.subtitle || '');
    const [videos, setVideos] = useState<FollowUsVideoForm[]>(
        (section?.videos || []).map(v => ({ url: v.url || '', title: v.title || '', description: v.description || '' }))
    );
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [form, setForm] = useState<FollowUsVideoForm | null>(null);
    const [localSaving, setLocalSaving] = useState(false);

    useEffect(() => {
        const s = profile.pageContent?.followUs;
        setSubtitle(s?.subtitle || '');
        setVideos((s?.videos || []).map(v => ({ url: v.url || '', title: v.title || '', description: v.description || '' })));
    }, [profile.pageContent?.followUs]);

    const save = async () => {
        setLocalSaving(true);
        try {
            const pc = {
                ...(profile.pageContent || {}),
                followUs: {
                    subtitle,
                    videos: videos.map(v => ({ url: v.url, title: v.title, description: v.description })),
                },
            };
            await onSave({ pageContent: pc });
            showToast('Follow Us section saved!', 'success');
        } catch (e: any) {
            showToast(e?.response?.data?.message || e?.message || 'Failed to save', 'error');
        } finally {
            setLocalSaving(false);
        }
    };

    const openNew = () => { setEditingIndex(-1); setForm({ url: '', title: '', description: '' }); };
    const openEdit = (i: number) => { setEditingIndex(i); setForm({ ...videos[i] }); };
    const cancel = () => { setEditingIndex(null); setForm(null); };

    const handleSaveItem = () => {
        if (!form) return;
        const updated = [...videos];
        if (editingIndex === -1) updated.push(form);
        else if (editingIndex !== null) updated[editingIndex] = form;
        setVideos(updated);
        cancel();
    };

    const handleDelete = (i: number) => {
        if (!window.confirm('Delete this video?')) return;
        setVideos(videos.filter((_, idx) => idx !== i));
    };

    const isSaving = saving || localSaving;

    return (
        <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Manage the "Follow Us" video section on the homepage. Paste YouTube video URLs. The first video will be displayed larger.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                    <label className="form-label">Section Subtitle</label>
                    <textarea value={subtitle} onChange={e => setSubtitle(e.target.value)} className="form-textarea" rows={2} placeholder="Optional subtitle text" />
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
                            <label className="form-label">YouTube URL</label>
                            <input value={form.url} onChange={e => setForm(p => ({ ...p!, url: e.target.value }))} className="form-input" placeholder="https://www.youtube.com/watch?v=..." />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Title</label>
                            <input value={form.title} onChange={e => setForm(p => ({ ...p!, title: e.target.value }))} className="form-input" placeholder="Video title" />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Description (optional)</label>
                            <input value={form.description} onChange={e => setForm(p => ({ ...p!, description: e.target.value }))} className="form-input" placeholder="Short description" />
                        </div>
                        {form.url && (
                            <div style={{ marginTop: '0.5rem' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Preview:</p>
                                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                                    <iframe
                                        src={`https://www.youtube.com/embed/${(() => {
                                            const m = form.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
                                            return m ? m[1] : '';
                                        })()}`}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                        allowFullScreen
                                    />
                                </div>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.75rem' }}>
                            <button onClick={cancel} className="admin-icon-btn" style={{ fontSize: '0.85rem', width: 'auto', padding: '0.4rem 0.8rem' }}>Cancel</button>
                            <button onClick={handleSaveItem} className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}><FaSave /> Save</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {videos.map((v, i) => (
                    <div key={i} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <FaVideo style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{v.title || `Video ${i + 1}`}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '350px' }}>{v.url}</div>
                            </div>
                            {i === 0 && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', background: 'rgba(217,119,6,0.1)', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>FEATURED</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => openEdit(i)} className="admin-icon-btn"><FaEdit /></button>
                            <button onClick={() => handleDelete(i)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }}><FaTrash /></button>
                        </div>
                    </div>
                ))}
                {videos.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)' }}>
                        No videos yet. Click "Add Video" to get started.
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={save} disabled={isSaving} className="btn-primary">{isSaving ? 'Saving...' : <><FaSave /> Save Follow Us</>}</button>
            </div>
        </div>
    );
};

/* ───── Get in Touch / Contact Editor ───── */
const GetInTouchEditor: React.FC<Props> = ({ profile, onSave, saving }) => {
    const cs = profile.pageContent?.contactSection;
    const [heading, setHeading] = useState(cs?.heading || '');
    const [phone, setPhone] = useState(profile.phone || '');
    const [email, setEmail] = useState(profile.email || '');
    const [location, setLocation] = useState(profile.location || '');
    const [localSaving, setLocalSaving] = useState(false);

    useEffect(() => {
        const d = profile.pageContent?.contactSection;
        setHeading(d?.heading || '');
        setPhone(profile.phone || '');
        setEmail(profile.email || '');
        setLocation(profile.location || '');
    }, [profile.pageContent?.contactSection, profile.phone, profile.email, profile.location]);

    const save = async () => {
        setLocalSaving(true);
        const pc = { ...profile.pageContent, contactSection: { heading } };
        await onSave({ pageContent: pc, phone, email, location } as any);
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
                <label className="form-label">Location</label>
                <input value={location} onChange={e => setLocation(e.target.value)} className="form-input" placeholder="Kigali, Rwanda" />
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
    const [heading, setHeading] = useState(faq?.heading || '');
    const [items, setItems] = useState(faq?.items || []);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [form, setForm] = useState<any>(null);
    const [localSaving, setLocalSaving] = useState(false);

    useEffect(() => {
        const d = profile.pageContent?.faq;
        setHeading(d?.heading || '');
        setItems(d?.items || []);
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
