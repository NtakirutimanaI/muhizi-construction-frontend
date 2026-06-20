import { useState } from 'react';
import { FaPlus, FaTrash, FaTimes, FaSave, FaVideo, FaImage } from 'react-icons/fa';

interface Evidence {
    id: number;
    project: string;
    type: 'image' | 'video';
    title: string;
    url: string;
    date: string;
    notes: string;
}

const emptyForm: Omit<Evidence, 'id'> = { project: '', type: 'image', title: '', url: '', date: new Date().toISOString().split('T')[0], notes: '' };

const ProjectEvidence = () => {
    const [evidences, setEvidences] = useState<Evidence[]>([
        { id: 1, project: 'Kigali Heights', type: 'image', title: 'Foundation complete', url: 'https://placehold.co/400x300/8B4513/white?text=Foundation', date: '2026-06-20', notes: '' },
        { id: 2, project: 'Kimironko Villa', type: 'image', title: 'Roof framing', url: 'https://placehold.co/400x300/8B4513/white?text=Roof', date: '2026-06-19', notes: 'Progress 60%' },
    ]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Evidence | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [search, setSearch] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const filtered = evidences.filter(e =>
        !search.trim() || e.project.toLowerCase().includes(search.toLowerCase()) || e.title.toLowerCase().includes(search.toLowerCase())
    );

    const openNew = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
    const openEdit = (e: Evidence) => { setEditing(e); setForm({ ...e }); setShowModal(true); };
    const close = () => { setShowModal(false); setEditing(null); setPreviewUrl(null); };

    const save = () => {
        if (!form.project || !form.title) return;
        if (editing) {
            setEvidences(prev => prev.map(e => e.id === editing.id ? { ...form, id: editing.id } : e));
        } else {
            setEvidences(prev => [...prev, { ...form, id: Date.now() }]);
        }
        close();
    };

    const remove = (id: number) => {
        if (!window.confirm('Delete this evidence?')) return;
        setEvidences(prev => prev.filter(e => e.id !== id));
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>Project Evidence</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Upload and manage project progress images & videos</p>
                </div>
                <button onClick={openNew} className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}><FaPlus /> Add Evidence</button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <input value={search} onChange={e => setSearch(e.target.value)} className="form-input" placeholder="Search by project or title..." style={{ maxWidth: 400 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {filtered.map(e => (
                    <div key={e.id} className="content-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{
                            height: 180, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', overflow: 'hidden', position: 'relative',
                        }} onClick={() => setPreviewUrl(e.url)}>
                            {e.type === 'image' ? (
                                <img src={e.url} alt={e.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                                    <FaVideo size={32} />
                                    <span style={{ fontSize: '0.85rem' }}>Video Preview</span>
                                </div>
                            )}
                            <span style={{
                                position: 'absolute', top: 8, right: 8, fontSize: '0.65rem', fontWeight: 600,
                                padding: '0.15rem 0.4rem', borderRadius: '6px',
                                background: e.type === 'image' ? '#3b82f620' : '#ec489920',
                                color: e.type === 'image' ? '#3b82f6' : '#ec4899',
                            }}>{e.type === 'image' ? <FaImage /> : <FaVideo />} {e.type}</span>
                        </div>
                        <div style={{ padding: '0.75rem' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.2rem' }}>{e.title}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{e.project} — {e.date}</div>
                            {e.notes && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{e.notes}</div>}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
                                <button onClick={() => openEdit(e)} className="admin-icon-btn" style={{ fontSize: '0.75rem' }}>Edit</button>
                                <button onClick={() => remove(e.id)} className="admin-icon-btn" style={{ color: 'var(--primary-red)', fontSize: '0.75rem' }}><FaTrash /></button>
                            </div>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', gridColumn: '1/-1' }}>No evidence added yet.</p>}
            </div>

            {/* Image Preview Modal */}
            {previewUrl && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    onClick={() => setPreviewUrl(null)}>
                    <img src={previewUrl} alt="Preview" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 8 }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="content-card" style={{ width: '100%', maxWidth: 500, padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{editing ? 'Edit Evidence' : 'Add Evidence'}</h3>
                            <button onClick={close} style={{ color: 'var(--text-muted)' }}><FaTimes /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Project</label>
                                    <input value={form.project} onChange={e => setForm(p => ({ ...p, project: e.target.value }))} className="form-input" placeholder="Project name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))} className="form-select">
                                        <option value="image">Image</option>
                                        <option value="video">Video</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="form-input" placeholder="e.g. Foundation pouring complete" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="form-input" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">File URL</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} className="form-input" placeholder="https://example.com/image.jpg" style={{ flex: 1 }} />
                                    {form.url && form.type === 'image' && (
                                        <div style={{ width: 48, height: 48, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                                            <img src={form.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="form-textarea" rows={2} placeholder="Additional notes..." />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                            <button onClick={close} className="admin-icon-btn" style={{ width: 'auto', padding: '0.5rem 1rem' }}>Cancel</button>
                            <button onClick={save} className="btn-primary"><FaSave /> Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectEvidence;
