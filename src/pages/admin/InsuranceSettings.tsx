import { useState, useEffect } from 'react';
import { FaShieldAlt, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import { insuranceService, type InsuranceSetting } from '../../services/insuranceService';
import { useToast } from '../../context/ToastContext';

const Providers = ['RSSB', 'RAMA', 'Radiant', 'MMI', 'Other'];

const InsuranceSettings = () => {
    const { showToast } = useToast();
    const [items, setItems] = useState<InsuranceSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<InsuranceSetting | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ provider: 'RSSB', label: '', employeeAmount: '', employerAmount: '', description: '', isActive: true });
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const fetch = async () => {
        try {
            const res = await insuranceService.getAll();
            setItems(res.data);
        } catch {
            showToast('Failed to load insurance settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetch(); }, []);

    const openAdd = () => {
        setEditing(null);
        setForm({ provider: 'RSSB', label: 'RSSB Health Insurance', employeeAmount: '59200', employerAmount: '59200', description: 'Company health insurance for all contracted employees', isActive: true });
        setShowModal(true);
    };

    const openEdit = (item: InsuranceSetting) => {
        setEditing(item);
        setForm({
            provider: item.provider,
            label: item.label,
            employeeAmount: String(item.employeeAmount),
            employerAmount: String(item.employerAmount),
            description: item.description || '',
            isActive: item.isActive,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.label || !form.employeeAmount) {
            showToast('Label and employee amount are required', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                provider: form.provider,
                label: form.label,
                employeeAmount: parseFloat(form.employeeAmount),
                employerAmount: parseFloat(form.employerAmount) || 0,
                description: form.description || undefined,
                isActive: form.isActive,
            };
            if (editing) {
                await insuranceService.update(editing.id, payload);
                showToast('Insurance setting updated', 'success');
            } else {
                await insuranceService.create(payload);
                showToast('Insurance setting created', 'success');
            }
            setShowModal(false);
            fetch();
        } catch (e: any) {
            showToast(e?.response?.data?.message || 'Failed to save', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await insuranceService.delete(id);
            showToast('Insurance setting deleted', 'success');
            setConfirmDelete(null);
            fetch();
        } catch (e: any) {
            showToast(e?.response?.data?.message || 'Failed to delete', 'error');
        }
    };

    const formatMoney = (val: number) => Number(val).toLocaleString('en-RW');
    const totalDeduction = items.filter(i => i.isActive).reduce((s, i) => s + Number(i.employeeAmount), 0);

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.3rem 0' }}>
                        <FaShieldAlt style={{ color: 'var(--primary)' }} /> Insurance Settings
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Manage company insurance plans and deduction rules for contracted employees.</p>
                </div>
                <button className="admin-btn" onClick={openAdd} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.6rem 1.5rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FaPlus /> Add Insurance Plan
                </button>
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#1B204212', border: '1px solid #1B204240', borderRadius: 10, padding: '1rem 1.2rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Active Plans</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1B2042' }}>{items.filter(i => i.isActive).length}</div>
                </div>
                <div style={{ background: '#22c55e12', border: '1px solid #22c55e40', borderRadius: 10, padding: '1rem 1.2rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Employee Deduction / Month</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#22c55e' }}>RWF {formatMoney(totalDeduction)}</div>
                </div>
                <div style={{ background: '#3b82f612', border: '1px solid #3b82f640', borderRadius: 10, padding: '1rem 1.2rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Employer Contribution / Month</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#3b82f6' }}>RWF {formatMoney(items.filter(i => i.isActive).reduce((s, i) => s + Number(i.employerAmount), 0))}</div>
                </div>
            </div>

            {/* Table */}
            <div className="admin-card">
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Provider</th>
                                <th>Label</th>
                                <th>Employee Deduction</th>
                                <th>Employer Contribution</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, i) => (
                                <tr key={item.id}>
                                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                                    <td><span style={{ fontWeight: 600 }}>{item.provider}</span></td>
                                    <td>{item.label}</td>
                                    <td style={{ fontWeight: 600, color: '#ef4444' }}>RWF {formatMoney(item.employeeAmount)}</td>
                                    <td style={{ fontWeight: 600, color: '#22c55e' }}>RWF {formatMoney(item.employerAmount)}</td>
                                    <td>
                                        {item.isActive
                                            ? <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600, color: '#fff', background: '#22c55e' }}>Active</span>
                                            : <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600, color: '#fff', background: '#6b7280' }}>Inactive</span>}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => openEdit(item)}><FaEdit /></button>
                                            {confirmDelete === item.id ? (
                                                <div style={{ display: 'flex', gap: 2 }}>
                                                    <button className="admin-btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: '#ef4444', borderColor: '#ef4444', color: '#fff' }} onClick={() => handleDelete(item.id)}>Yes</button>
                                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={() => setConfirmDelete(null)}>No</button>
                                                </div>
                                            ) : (
                                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--primary-red)' }} onClick={() => setConfirmDelete(item.id)}><FaTrash /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && !loading && (
                                <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No insurance plans configured yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                        <div className="admin-modal-header">
                            <h3><FaShieldAlt style={{ marginRight: 8 }} /> {editing ? 'Edit Insurance Plan' : 'New Insurance Plan'}</h3>
                            <button onClick={() => setShowModal(false)}><FaTimes /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Provider</label>
                                    <select className="form-select" value={form.provider} onChange={e => setForm(p => ({ ...p, provider: e.target.value }))}>
                                        {Providers.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Label *</label>
                                    <input className="form-input" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} placeholder="e.g. RSSB Health Insurance" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Employee Deduction (RWF) *</label>
                                    <input type="number" className="form-input" value={form.employeeAmount} onChange={e => setForm(p => ({ ...p, employeeAmount: e.target.value }))} placeholder="e.g. 59200" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Employer Contribution (RWF)</label>
                                    <input type="number" className="form-input" value={form.employerAmount} onChange={e => setForm(p => ({ ...p, employerAmount: e.target.value }))} placeholder="e.g. 59200" />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Description</label>
                                    <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description of this insurance plan" style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} style={{ width: 16, height: 16 }} />
                                        Active (applies deduction to all contracted employees)
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="admin-btn" onClick={handleSave} disabled={saving} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff' }}>
                                {saving ? <><FaSpinner className="animate-spin" style={{ marginRight: 4 }} /> Saving...</> : editing ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InsuranceSettings;
