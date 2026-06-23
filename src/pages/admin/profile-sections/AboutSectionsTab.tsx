import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChartBar, FaBullseye, FaEye, FaGem, FaSun, FaHandshake, FaRocket, FaSave, FaPlus, FaEdit, FaTrash, FaHome } from 'react-icons/fa';
import type { Profile } from '../../../services/profileService';
import { useToast } from '../../../context/ToastContext';

type AboutTab = 'about-home' | 'stats' | 'mission' | 'vision' | 'philosophy' | 'core-values' | 'why-choose-us' | 'cta';

interface Props {
    profile: Profile;
    onSave: (u: Partial<Profile>) => Promise<void>;
    saving: boolean;
}

const SUB_TABS: { id: AboutTab; label: string; icon: React.ReactNode }[] = [
    { id: 'about-home', label: 'Home About', icon: <FaHome /> },
    { id: 'stats', label: 'Stats', icon: <FaChartBar /> },
    { id: 'mission', label: 'Mission', icon: <FaBullseye /> },
    { id: 'vision', label: 'Vision', icon: <FaEye /> },
    { id: 'philosophy', label: 'Philosophy', icon: <FaGem /> },
    { id: 'core-values', label: 'Core Values', icon: <FaSun /> },
    { id: 'why-choose-us', label: 'Why Choose Us', icon: <FaHandshake /> },
    { id: 'cta', label: 'CTA', icon: <FaRocket /> },
];

const AboutSectionsTab: React.FC<Props> = ({ profile, onSave, saving }) => {
    const [subTab, setSubTab] = useState<AboutTab>('stats');

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
                    {subTab === 'about-home' && <AboutHomeEditor profile={profile} onSave={onSave} saving={saving} />}
                    {subTab === 'stats' && <StatsEditor profile={profile} onSave={onSave} saving={saving} />}
                    {subTab === 'mission' && <CardEditor profile={profile} onSave={onSave} saving={saving} section="mission" defaultTitle="Our Mission" defaultText="To deliver exceptional construction..." defaultIcon="https://images.icon-icons.com/5904/PNG/96/326365_paper-plane-icon.png" />}
                    {subTab === 'vision' && <CardEditor profile={profile} onSave={onSave} saving={saving} section="vision" defaultTitle="Our Vision" defaultText="To be the most trusted..." defaultIcon="https://images.icon-icons.com/5904/PNG/96/326321_sun-icon.png" />}
                    {subTab === 'philosophy' && <CardEditor profile={profile} onSave={onSave} saving={saving} section="philosophy" defaultTitle="Our Philosophy" defaultText="We believe in building..." defaultIcon="https://images.icon-icons.com/5904/PNG/96/326370_star-icon.png" />}
                    {subTab === 'core-values' && <ArrayCardEditor profile={profile} onSave={onSave} saving={saving} section="coreValues" defaultItems={[
                        { title: 'Excellence', text: 'We strive for the highest standards...', icon: 'https://images.icon-icons.com/5904/PNG/96/326321_sun-icon.png' },
                        { title: 'Integrity', text: 'We conduct business with honesty...', icon: 'https://images.icon-icons.com/5904/PNG/96/326329_heart-icon.png' },
                        { title: 'Innovation', text: 'We embrace modern technology...', icon: 'https://images.icon-icons.com/5904/PNG/96/326323_lightning-bolt-icon.png' },
                    ]} />}
                    {subTab === 'why-choose-us' && <ArrayCardEditor profile={profile} onSave={onSave} saving={saving} section="whyChooseUs" defaultItems={[
                        { title: 'Experienced Team', text: 'Our skilled professionals bring years of expertise...', icon: 'https://images.icon-icons.com/5904/PNG/96/326322_location-pin-icon.png' },
                        { title: 'Client-Centric Approach', text: 'We prioritize your vision and needs...', icon: 'https://images.icon-icons.com/5904/PNG/96/326365_paper-plane-icon.png' },
                        { title: 'Timely Delivery', text: 'We respect your time and budget...', icon: 'https://images.icon-icons.com/5904/PNG/96/326370_star-icon.png' },
                    ]} />}
                    {subTab === 'cta' && <CtaEditor profile={profile} onSave={onSave} saving={saving} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

/* ───── About Home Editor (subtitle, cards, ticker) ───── */
const AboutHomeEditor: React.FC<Props> = ({ profile, onSave, saving }) => {
    const as = profile.pageContent?.aboutSection;
    const [subtitle, setSubtitle] = useState(as?.subtitle || '');
    const [cards, setCards] = useState(as?.cards || []);
    const [tickerText, setTickerText] = useState(as?.tickerText || '');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [form, setForm] = useState<{ title: string; description: string } | null>(null);
    const [localSaving, setLocalSaving] = useState(false);

    useEffect(() => {
        const d = profile.pageContent?.aboutSection;
        setSubtitle(d?.subtitle || '');
        setCards(d?.cards || []);
        setTickerText(d?.tickerText || '');
    }, [profile.pageContent?.aboutSection]);

    const save = async () => {
        setLocalSaving(true);
        const pc = { ...profile.pageContent, aboutSection: { ...(profile.pageContent?.aboutSection || {}), subtitle, cards, tickerText } };
        await onSave({ pageContent: pc });
        setLocalSaving(false);
    };

    const openNew = () => { setEditingIndex(-1); setForm({ title: '', description: '' }); };
    const openEdit = (i: number) => { setEditingIndex(i); setForm({ ...cards[i] }); };
    const cancel = () => { setEditingIndex(null); setForm(null); };

    const handleSaveItem = () => {
        if (!form) return;
        const updated = [...cards];
        if (editingIndex === -1) updated.push(form);
        else if (editingIndex !== null) updated[editingIndex] = form;
        setCards(updated);
        cancel();
    };

    const handleDelete = (i: number) => {
        if (!window.confirm('Delete this card?')) return;
        setCards(cards.filter((_, idx) => idx !== i));
    };

    const isSaving = saving || localSaving;

    return (
        <div>
            <div className="content-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>Home About Section</h3>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">Subtitle</label>
                    <textarea value={subtitle} onChange={e => setSubtitle(e.target.value)} className="form-textarea" rows={2} placeholder="Our Products Are Beautiful, Good Quality And Professional" />
                </div>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">Ticker Text</label>
                    <input value={tickerText} onChange={e => setTickerText(e.target.value)} className="form-input" placeholder="Building Construction \u00B7 Road Construction \u00B7 Infrastructure ..." />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Service Cards ({cards.length})</h3>
                <button onClick={openNew} disabled={editingIndex !== null} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}><FaPlus /> Add Card</button>
            </div>
            <AnimatePresence>
                {editingIndex !== null && form && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="content-card" style={{ marginBottom: '1rem', padding: '1rem', border: '2px solid var(--primary)' }}
                    >
                        <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{editingIndex === -1 ? 'New Card' : 'Edit Card'}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input value={form.title} onChange={e => setForm(p => ({ ...p!, title: e.target.value }))} className="form-input" placeholder="Building Construction" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input value={form.description} onChange={e => setForm(p => ({ ...p!, description: e.target.value }))} className="form-input" placeholder="Residential and commercial buildings" />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={cancel} className="admin-icon-btn" style={{ fontSize: '0.85rem', width: 'auto', padding: '0.4rem 0.8rem' }}>Cancel</button>
                            <button onClick={handleSaveItem} className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}><FaSave /> Save</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {cards.map((c, i) => (
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
                {cards.length === 0 && (
                    <div style={{ padding: '1.5rem', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No cards yet. Default cards will be shown.</div>
                )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={save} disabled={isSaving} className="btn-primary">{isSaving ? 'Saving...' : <><FaSave /> Save About Section</>}</button>
            </div>
        </div>
    );
};

/* ───── Stats Editor ───── */
const StatsEditor: React.FC<Props> = ({ profile, onSave, saving }) => {
    const [items, setItems] = useState(profile.pageContent?.aboutStats || []);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [form, setForm] = useState<any>(null);
    const [localSaving, setLocalSaving] = useState(false);

    useEffect(() => { setItems(profile.pageContent?.aboutStats || []); }, [profile.pageContent?.aboutStats]);

    const save = async (updated: any[]) => {
        setLocalSaving(true);
        const pc = { ...profile.pageContent, aboutStats: updated };
        await onSave({ pageContent: pc });
        setLocalSaving(false);
    };

    const openNew = () => { setEditingIndex(-1); setForm({ value: 0, suffix: '+', label: '' }); };
    const openEdit = (i: number) => { setEditingIndex(i); setForm({ ...items[i] }); };
    const cancel = () => { setEditingIndex(null); };

    const handleSave = async () => {
        const updated = [...items];
        if (editingIndex === -1) updated.push(form);
        else if (editingIndex !== null) updated[editingIndex] = form;
        await save(updated);
        cancel();
    };

    const handleDelete = async (i: number) => {
        if (!window.confirm('Delete this stat?')) return;
        await save(items.filter((_, idx) => idx !== i));
    };

    const isSaving = saving || localSaving;

    return (
        <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Note: Projects Completed, Years Experience, and Team Members are auto-derived from your profile data. Add only custom/static stats below.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Custom Stats ({items.length})</h3>
                <button onClick={openNew} disabled={editingIndex !== null} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}><FaPlus /> Add Stat</button>
            </div>
            <AnimatePresence>
                {editingIndex !== null && form && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="content-card" style={{ marginBottom: '1rem', padding: '1rem', border: '2px solid var(--primary)' }}
                    >
                        <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{editingIndex === -1 ? 'New Stat' : 'Edit Stat'}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div className="form-group">
                                <label className="form-label">Value</label>
                                <input type="number" value={form.value} onChange={e => setForm((p: any) => ({ ...p, value: parseInt(e.target.value) || 0 }))} className="form-input" placeholder="e.g. 150" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Suffix</label>
                                <input value={form.suffix} onChange={e => setForm((p: any) => ({ ...p, suffix: e.target.value }))} className="form-input" placeholder="e.g. +, %, K" />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Label</label>
                            <input value={form.label} onChange={e => setForm((p: any) => ({ ...p, label: e.target.value }))} className="form-input" placeholder="e.g. Projects Completed" />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={cancel} className="admin-icon-btn" style={{ fontSize: '0.85rem', width: 'auto', padding: '0.4rem 0.8rem' }}>Cancel</button>
                            <button onClick={handleSave} className="btn-primary" disabled={isSaving} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>{isSaving ? 'Saving...' : <><FaSave /> Save</>}</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {items.map((s, i) => (
                    <div key={i} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem' }}>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.value}{s.suffix} — {s.label}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => openEdit(i)} className="admin-icon-btn"><FaEdit /></button>
                            <button onClick={() => handleDelete(i)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }}><FaTrash /></button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <div style={{ padding: '1.5rem', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No custom stats yet.</div>
                )}
            </div>
        </div>
    );
};

/* ───── Single Card Editor (Mission/Vision/Philosophy) ───── */
const CardEditor: React.FC<Props & { section: string; defaultTitle: string; defaultText: string; defaultIcon: string }> = ({ profile, onSave, saving, section, defaultTitle, defaultText, defaultIcon }) => {
    const key = section as 'mission' | 'vision' | 'philosophy';
    const data = profile.pageContent?.[key];
    const [title, setTitle] = useState(data?.title || defaultTitle);
    const [text, setText] = useState(data?.text || defaultText);
    const [icon, setIcon] = useState(data?.icon || defaultIcon);
    const [localSaving, setLocalSaving] = useState(false);

    useEffect(() => {
        const d = profile.pageContent?.[key];
        setTitle(d?.title || defaultTitle);
        setText(d?.text || defaultText);
        setIcon(d?.icon || defaultIcon);
    }, [profile.pageContent, key]);

    const handleSave = async () => {
        setLocalSaving(true);
        const pc = { ...profile.pageContent, [key]: { title, text, icon } };
        await onSave({ pageContent: pc });
        setLocalSaving(false);
    };

    const label = section.charAt(0).toUpperCase() + section.slice(1);
    const isSaving = saving || localSaving;

    return (
        <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>{label}</h3>
            <div className="content-card" style={{ padding: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Title</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} className="form-input" placeholder="Section title" />
                </div>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Description</label>
                    <textarea value={text} onChange={e => setText(e.target.value)} className="form-textarea" rows={5} placeholder="Write a brief description..." />
                </div>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Icon URL</label>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {icon && <img src={icon} alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                        <input value={icon} onChange={e => setIcon(e.target.value)} className="form-input" placeholder="https://..." />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSave} disabled={isSaving} className="btn-primary">{isSaving ? 'Saving...' : <><FaSave /> Save {label}</>}</button>
                </div>
            </div>
        </div>
    );
};

/* ───── Array Card Editor (Core Values / Why Choose Us) ───── */
const ArrayCardEditor: React.FC<Props & { section: 'coreValues' | 'whyChooseUs'; defaultItems: Array<{ title: string; text: string; icon: string }> }> = ({ profile, onSave, saving, section, defaultItems }) => {
    const [items, setItems] = useState(profile.pageContent?.[section] || defaultItems);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [form, setForm] = useState<{ title: string; text: string; icon: string } | null>(null);
    const [localSaving, setLocalSaving] = useState(false);

    useEffect(() => { setItems(profile.pageContent?.[section] || defaultItems); }, [profile.pageContent?.[section]]);

    const save = async (updated: any[]) => {
        setLocalSaving(true);
        const pc = { ...profile.pageContent, [section]: updated };
        await onSave({ pageContent: pc });
        setLocalSaving(false);
    };

    const openNew = () => { setEditingIndex(-1); setForm({ title: '', text: '', icon: '' }); };
    const openEdit = (i: number) => { setEditingIndex(i); setForm({ ...items[i] }); };
    const cancel = () => { setEditingIndex(null); };

    const handleSave = async () => {
        if (!form) return;
        const updated = [...items];
        if (editingIndex === -1) updated.push(form);
        else if (editingIndex !== null) updated[editingIndex] = form;
        await save(updated);
        cancel();
    };

    const handleDelete = async (i: number) => {
        if (!window.confirm('Delete this item?')) return;
        await save(items.filter((_, idx) => idx !== i));
    };

    const label = section === 'coreValues' ? 'Core Values' : 'Why Choose Us';
    const isSaving = saving || localSaving;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{label} ({items.length})</h3>
                <button onClick={openNew} disabled={editingIndex !== null} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}><FaPlus /> Add</button>
            </div>
            <AnimatePresence>
                {editingIndex !== null && form && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="content-card" style={{ marginBottom: '1rem', padding: '1rem', border: '2px solid var(--primary)' }}
                    >
                        <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{editingIndex === -1 ? `New ${label.slice(0, -1)}` : `Edit ${label.slice(0, -1)}`}</h4>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Title</label>
                            <input value={form.title} onChange={e => setForm(p => ({ ...p!, title: e.target.value }))} className="form-input" placeholder="Item title" />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Description</label>
                            <textarea value={form.text} onChange={e => setForm(p => ({ ...p!, text: e.target.value }))} className="form-textarea" rows={3} placeholder="Describe this item" />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label">Icon URL</label>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                {form.icon && <img src={form.icon} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                                <input value={form.icon} onChange={e => setForm(p => ({ ...p!, icon: e.target.value }))} className="form-input" placeholder="https://images.icon-icons.com/..." />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={cancel} className="admin-icon-btn" style={{ fontSize: '0.85rem', width: 'auto', padding: '0.4rem 0.8rem' }}>Cancel</button>
                            <button onClick={handleSave} className="btn-primary" disabled={isSaving} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>{isSaving ? 'Saving...' : <><FaSave /> Save</>}</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {items.map((item, i) => (
                    <div key={i} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            {item.icon && <img src={item.icon} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.title}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>{item.text}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => openEdit(i)} className="admin-icon-btn"><FaEdit /></button>
                            <button onClick={() => handleDelete(i)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }}><FaTrash /></button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <div style={{ padding: '1.5rem', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No items yet.</div>
                )}
            </div>
        </div>
    );
};

/* ───── CTA Editor ───── */
const CtaEditor: React.FC<Props> = ({ profile, onSave, saving }) => {
    const cta = profile.pageContent?.cta;
    const [title, setTitle] = useState(cta?.title || 'Ready to Start Your Project?');
    const [subtitle, setSubtitle] = useState(cta?.subtitle || 'Let us bring your vision to life. Contact us today for a consultation and free estimate.');
    const [buttonText, setButtonText] = useState(cta?.buttonText || 'Get In Touch');
    const [buttonLink, setButtonLink] = useState(cta?.buttonLink || '/contact');
    const [secondaryButtonText, setSecondaryButtonText] = useState(cta?.secondaryButtonText || 'Meet Our Team');
    const [secondaryButtonLink, setSecondaryButtonLink] = useState(cta?.secondaryButtonLink || '/team');
    const [localSaving, setLocalSaving] = useState(false);

    useEffect(() => {
        const d = profile.pageContent?.cta;
        setTitle(d?.title || 'Ready to Start Your Project?');
        setSubtitle(d?.subtitle || 'Let us bring your vision to life...');
        setButtonText(d?.buttonText || 'Get In Touch');
        setButtonLink(d?.buttonLink || '/contact');
        setSecondaryButtonText(d?.secondaryButtonText || 'Meet Our Team');
        setSecondaryButtonLink(d?.secondaryButtonLink || '/team');
    }, [profile.pageContent?.cta]);

    const handleSave = async () => {
        setLocalSaving(true);
        const pc = { ...profile.pageContent, cta: { title, subtitle, buttonText, buttonLink, secondaryButtonText, secondaryButtonLink } };
        await onSave({ pageContent: pc });
        setLocalSaving(false);
    };

    const isSaving = saving || localSaving;

    return (
        <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>Call to Action</h3>
            <div className="content-card" style={{ padding: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Title</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} className="form-input" placeholder="Ready to Start Your Project?" />
                </div>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Subtitle</label>
                    <textarea value={subtitle} onChange={e => setSubtitle(e.target.value)} className="form-textarea" rows={3} placeholder="Let us bring your vision to life. Contact us today..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Button Text</label>
                        <input value={buttonText} onChange={e => setButtonText(e.target.value)} className="form-input" placeholder="Get In Touch" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Button Link</label>
                        <input value={buttonLink} onChange={e => setButtonLink(e.target.value)} className="form-input" placeholder="/contact" />
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                        <label className="form-label">Secondary Button Text</label>
                        <input value={secondaryButtonText} onChange={e => setSecondaryButtonText(e.target.value)} className="form-input" placeholder="Meet Our Team" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Secondary Button Link</label>
                        <input value={secondaryButtonLink} onChange={e => setSecondaryButtonLink(e.target.value)} className="form-input" placeholder="/team" />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSave} disabled={isSaving} className="btn-primary">{isSaving ? 'Saving...' : <><FaSave /> Save CTA</>}</button>
                </div>
            </div>
        </div>
    );
};

export default AboutSectionsTab;
