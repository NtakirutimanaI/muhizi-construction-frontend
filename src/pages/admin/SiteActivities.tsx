import { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaHardHat } from 'react-icons/fa';

interface SiteActivity {
    id: number;
    project: string;
    date: string;
    description: string;
    status: 'planned' | 'in_progress' | 'completed';
    workers: number;
    notes: string;
}

const emptyForm: Omit<SiteActivity, 'id'> = { project: '', date: new Date().toISOString().split('T')[0], description: '', status: 'planned', workers: 0, notes: '' };

const SiteActivities = () => {
    const [activities, setActivities] = useState<SiteActivity[]>([
        { id: 1, project: 'Kigali Heights', date: '2026-06-20', description: 'Foundation pouring', status: 'in_progress', workers: 12, notes: 'Using grade 30 concrete' },
        { id: 2, project: 'Kimironko Villa', date: '2026-06-19', description: 'Wall framing', status: 'completed', workers: 8, notes: '' },
    ]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<SiteActivity | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [search, setSearch] = useState('');

    const filtered = activities.filter(a =>
        !search.trim() || a.project.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase())
    );

    const openNew = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
    const openEdit = (a: SiteActivity) => { setEditing(a); setForm({ ...a }); setShowModal(true); };
    const close = () => { setShowModal(false); setEditing(null); };

    const save = () => {
        if (!form.project || !form.date) return;
        if (editing) {
            setActivities(prev => prev.map(a => a.id === editing.id ? { ...form, id: editing.id } : a));
        } else {
            setActivities(prev => [...prev, { ...form, id: Date.now() }]);
        }
        close();
    };

    const remove = (id: number) => {
        if (!window.confirm('Delete this activity?')) return;
        setActivities(prev => prev.filter(a => a.id !== id));
    };

    const statusColor = (s: string) => s === 'completed' ? '#22c55e' : s === 'in_progress' ? '#3b82f6' : '#f59e0b';

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>Site Activities</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Track daily construction site activities</p>
                </div>
                <button onClick={openNew} className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}><FaPlus /> New Activity</button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <input value={search} onChange={e => setSearch(e.target.value)} className="form-input" placeholder="Search by project or description..." style={{ maxWidth: 400 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filtered.map(a => (
                    <div key={a.id} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.3rem' }}>
                                <FaHardHat style={{ color: '#8B4513' }} />
                                <span style={{ fontWeight: 700, fontSize: '1rem' }}>{a.project}</span>
                                <span style={{
                                    fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '12px',
                                    background: `${statusColor(a.status)}20`, color: statusColor(a.status)
                                }}>{a.status.replace('_', ' ')}</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                {a.date} — {a.description} {a.workers > 0 && `(${a.workers} workers)`}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => openEdit(a)} className="admin-icon-btn"><FaEdit /></button>
                            <button onClick={() => remove(a.id)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }}><FaTrash /></button>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No activities found.</p>}
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="content-card" style={{ width: '100%', maxWidth: 500, padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{editing ? 'Edit Activity' : 'New Activity'}</h3>
                            <button onClick={close} style={{ color: 'var(--text-muted)' }}><FaTimes /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div className="form-group">
                                <label className="form-label">Project</label>
                                <input value={form.project} onChange={e => setForm(p => ({ ...p, project: e.target.value }))} className="form-input" placeholder="Project name" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))} className="form-select">
                                        <option value="planned">Planned</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="form-textarea" rows={2} placeholder="What was done?" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Workers On Site</label>
                                    <input type="number" value={form.workers} onChange={e => setForm(p => ({ ...p, workers: parseInt(e.target.value) || 0 }))} className="form-input" />
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

export default SiteActivities;
