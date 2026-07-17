import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSave, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import type { Profile } from '../../../services/profileService';

interface Props {
    profile: Profile;
    onSave: (u: Partial<Profile>) => Promise<void>;
    saving: boolean;
}

const AboutSectionsTab: React.FC<Props> = ({ profile, onSave, saving }) => {
    const as = profile.pageContent?.aboutSection;
    const [cards, setCards] = useState(as?.cards || []);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [form, setForm] = useState<{ title: string; description: string } | null>(null);
    const [localSaving, setLocalSaving] = useState(false);

    const ap = profile.pageContent?.aboutPage;
    const [apForm, setApForm] = useState({
        statNumber: ap?.statNumber ?? 240,
        statSuffix: ap?.statSuffix ?? '+',
        statTitle: ap?.statTitle || 'Projects, Clients Served',
        statDescription: ap?.statDescription || "Over 500 Projects Completed With Care, Precision, And A Focus On Our Clients' Needs.",
        heading: ap?.heading || 'Turning Your Ideas Into Beautifully Crafted Spaces',
        description: ap?.description || 'We embrace the latest technologies and sustainable practices to create environmentally-friendly and energy-efficient buildings. Our mission is not just to construct structures, but to build communities and spaces where people thrive and prosper.',
        globalReachNumber: ap?.globalReachNumber ?? 85,
        globalReachSuffix: ap?.globalReachSuffix ?? '+',
        globalReachCaption: ap?.globalReachCaption || 'Offices Worldwide',
    });
    const [apSaving, setApSaving] = useState(false);

    useEffect(() => {
        setCards(profile.pageContent?.aboutSection?.cards || []);
    }, [profile.pageContent?.aboutSection]);

    useEffect(() => {
        const p = profile.pageContent?.aboutPage;
        setApForm({
            statNumber: p?.statNumber ?? 240,
            statSuffix: p?.statSuffix ?? '+',
            statTitle: p?.statTitle || 'Projects, Clients Served',
            statDescription: p?.statDescription || "Over 500 Projects Completed With Care, Precision, And A Focus On Our Clients' Needs.",
            heading: p?.heading || 'Turning Your Ideas Into Beautifully Crafted Spaces',
            description: p?.description || 'We embrace the latest technologies and sustainable practices to create environmentally-friendly and energy-efficient buildings. Our mission is not just to construct structures, but to build communities and spaces where people thrive and prosper.',
            globalReachNumber: p?.globalReachNumber ?? 85,
            globalReachSuffix: p?.globalReachSuffix ?? '+',
            globalReachCaption: p?.globalReachCaption || 'Offices Worldwide',
        });
    }, [profile.pageContent?.aboutPage]);

    const saveAboutPage = async () => {
        setApSaving(true);
        const pc = { ...profile.pageContent, aboutPage: apForm };
        await onSave({ pageContent: pc });
        setApSaving(false);
    };

    const save = async (updated: typeof cards) => {
        setLocalSaving(true);
        const pc = { ...profile.pageContent, aboutSection: { ...(profile.pageContent?.aboutSection || {}), cards: updated } };
        await onSave({ pageContent: pc });
        setLocalSaving(false);
    };

    const openNew = () => { setEditingIndex(-1); setForm({ title: '', description: '' }); };
    const openEdit = (i: number) => { setEditingIndex(i); setForm({ ...cards[i] }); };
    const cancel = () => { setEditingIndex(null); setForm(null); };

    const handleSaveItem = async () => {
        if (!form) return;
        const updated = [...cards];
        if (editingIndex === -1) updated.push(form);
        else if (editingIndex !== null) updated[editingIndex] = form;
        setCards(updated);
        await save(updated);
        cancel();
    };

    const handleDelete = async (i: number) => {
        if (!window.confirm('Delete this card?')) return;
        const updated = cards.filter((_, idx) => idx !== i);
        setCards(updated);
        await save(updated);
    };

    const isSaving = saving || localSaving;

    return (
        <div>
            <div className="content-card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.25rem' }}>About Page</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Controls the stat card, heading, description, and "Global Reach" number on the public /about page.
                </p>

                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Stat Card</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Number</label>
                        <input type="number" value={apForm.statNumber} onChange={e => setApForm(p => ({ ...p, statNumber: Number(e.target.value) }))} className="form-input" placeholder="240" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Suffix</label>
                        <input value={apForm.statSuffix} onChange={e => setApForm(p => ({ ...p, statSuffix: e.target.value }))} className="form-input" placeholder="+" />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Title</label>
                        <input value={apForm.statTitle} onChange={e => setApForm(p => ({ ...p, statTitle: e.target.value }))} className="form-input" placeholder="Projects, Clients Served" />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Description</label>
                        <textarea value={apForm.statDescription} onChange={e => setApForm(p => ({ ...p, statDescription: e.target.value }))} className="form-textarea" rows={2} />
                    </div>
                </div>

                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Heading &amp; Description</h4>
                <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Heading</label>
                        <input value={apForm.heading} onChange={e => setApForm(p => ({ ...p, heading: e.target.value }))} className="form-input" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea value={apForm.description} onChange={e => setApForm(p => ({ ...p, description: e.target.value }))} className="form-textarea" rows={3} />
                    </div>
                </div>

                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Global Reach</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Number</label>
                        <input type="number" value={apForm.globalReachNumber} onChange={e => setApForm(p => ({ ...p, globalReachNumber: Number(e.target.value) }))} className="form-input" placeholder="85" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Suffix</label>
                        <input value={apForm.globalReachSuffix} onChange={e => setApForm(p => ({ ...p, globalReachSuffix: e.target.value }))} className="form-input" placeholder="+" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Caption</label>
                        <input value={apForm.globalReachCaption} onChange={e => setApForm(p => ({ ...p, globalReachCaption: e.target.value }))} className="form-input" placeholder="Offices Worldwide" />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={saveAboutPage} disabled={apSaving || saving} className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                        {apSaving ? 'Saving...' : <><FaSave /> Save About Page</>}
                    </button>
                </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                These cards appear in the site footer's services list as a fallback when the Home → Services section is empty.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Cards ({cards.length})</h3>
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
                            <button onClick={handleSaveItem} disabled={isSaving} className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>{isSaving ? 'Saving...' : <><FaSave /> Save</>}</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                    <div style={{ padding: '1.5rem', textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No cards yet.</div>
                )}
            </div>
        </div>
    );
};

export default AboutSectionsTab;
