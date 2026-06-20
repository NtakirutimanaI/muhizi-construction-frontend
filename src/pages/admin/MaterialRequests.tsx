import { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaTruck } from 'react-icons/fa';

interface MaterialRequest {
    id: number;
    project: string;
    material: string;
    quantity: number;
    unit: string;
    date: string;
    status: 'pending' | 'approved' | 'delivered' | 'rejected';
    notes: string;
}

const emptyForm: Omit<MaterialRequest, 'id'> = { project: '', material: '', quantity: 0, unit: 'pieces', date: new Date().toISOString().split('T')[0], status: 'pending', notes: '' };

const MaterialRequests = () => {
    const [requests, setRequests] = useState<MaterialRequest[]>([
        { id: 1, project: 'Kigali Heights', material: 'Cement', quantity: 50, unit: 'bags', date: '2026-06-20', status: 'approved', notes: '' },
        { id: 2, project: 'Kimironko Villa', material: 'Steel bars 12mm', quantity: 100, unit: 'pieces', date: '2026-06-19', status: 'pending', notes: 'For foundation' },
    ]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<MaterialRequest | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [search, setSearch] = useState('');

    const filtered = requests.filter(r =>
        !search.trim() || r.project.toLowerCase().includes(search.toLowerCase()) || r.material.toLowerCase().includes(search.toLowerCase())
    );

    const openNew = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
    const openEdit = (r: MaterialRequest) => { setEditing(r); setForm({ ...r }); setShowModal(true); };
    const close = () => { setShowModal(false); setEditing(null); };

    const save = () => {
        if (!form.project || !form.material || !form.quantity) return;
        if (editing) {
            setRequests(prev => prev.map(r => r.id === editing.id ? { ...form, id: editing.id } : r));
        } else {
            setRequests(prev => [...prev, { ...form, id: Date.now() }]);
        }
        close();
    };

    const remove = (id: number) => {
        if (!window.confirm('Delete this request?')) return;
        setRequests(prev => prev.filter(r => r.id !== id));
    };

    const statusColor: Record<string, string> = {
        pending: '#f59e0b', approved: '#3b82f6', delivered: '#22c55e', rejected: '#ef4444',
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>Material Requests</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Request and track construction materials</p>
                </div>
                <button onClick={openNew} className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}><FaPlus /> New Request</button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <input value={search} onChange={e => setSearch(e.target.value)} className="form-input" placeholder="Search by project or material..." style={{ maxWidth: 400 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filtered.map(r => (
                    <div key={r.id} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.3rem' }}>
                                <FaTruck style={{ color: '#8B4513' }} />
                                <span style={{ fontWeight: 700, fontSize: '1rem' }}>{r.material}</span>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{r.quantity} {r.unit}</span>
                                <span style={{
                                    fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '12px',
                                    background: `${statusColor[r.status]}20`, color: statusColor[r.status]
                                }}>{r.status}</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                {r.project} — {r.date} {r.notes && `— ${r.notes}`}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => openEdit(r)} className="admin-icon-btn"><FaEdit /></button>
                            <button onClick={() => remove(r.id)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }}><FaTrash /></button>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No requests found.</p>}
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="content-card" style={{ width: '100%', maxWidth: 500, padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{editing ? 'Edit Request' : 'New Material Request'}</h3>
                            <button onClick={close} style={{ color: 'var(--text-muted)' }}><FaTimes /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Project</label>
                                    <input value={form.project} onChange={e => setForm(p => ({ ...p, project: e.target.value }))} className="form-input" placeholder="Project name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="form-input" />
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <div className="form-group" style={{ flex: '1 1 140px', minWidth: 0 }}>
                                    <label className="form-label">Material</label>
                                    <input value={form.material} onChange={e => setForm(p => ({ ...p, material: e.target.value }))} className="form-input" placeholder="e.g. Cement, Steel" />
                                </div>
                                <div className="form-group" style={{ flex: '1 1 100px', minWidth: 0 }}>
                                    <label className="form-label">Quantity</label>
                                    <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))} className="form-input" />
                                </div>
                                <div className="form-group" style={{ flex: '1 1 100px', minWidth: 0 }}>
                                    <label className="form-label">Unit</label>
                                    <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} className="form-select">
                                        <option value="pieces">Pieces</option>
                                        <option value="bags">Bags</option>
                                        <option value="kg">Kg</option>
                                        <option value="tons">Tons</option>
                                        <option value="liters">Liters</option>
                                        <option value="m2">m²</option>
                                        <option value="m3">m³</option>
                                        <option value="rolls">Rolls</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))} className="form-select">
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
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

export default MaterialRequests;
