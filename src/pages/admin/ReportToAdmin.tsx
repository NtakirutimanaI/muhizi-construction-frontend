import { useState, useEffect, useMemo } from 'react';
import {
    FaPaperPlane, FaArrowLeft, FaCheckCircle, FaClock, FaSpinner, FaExclamationTriangle,
    FaCheckDouble, FaSearch, FaFilter, FaEnvelope, FaUndo, FaTrash,
} from 'react-icons/fa';
import { engineeringSubmissionsService } from '../../services/engineeringSubmissionsService';
import type { EngineeringSubmission } from '../../services/engineeringSubmissionsService';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const ReportToAdmin = () => {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submissions, setSubmissions] = useState<EngineeringSubmission[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'approved' | 'submitted_to_admin'>('approved');
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [notesText, setNotesText] = useState('');
    const [pendingIds, setPendingIds] = useState<string[]>([]);

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true);
        try {
            const res = await engineeringSubmissionsService.getAll();
            setSubmissions(res.data || []);
        } catch {
            showToast('Failed to load submissions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return submissions.filter(s => {
            if (filter === 'approved' && s.status !== 'approved') return false;
            if (filter === 'submitted_to_admin' && !s.submittedToAdmin) return false;
            if (q && !s.title.toLowerCase().includes(q) && !(s.description || '').toLowerCase().includes(q)) return false;
            return true;
        });
    }, [submissions, search, filter]);

    const toggle = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        const eligible = filtered.filter(s => s.status === 'approved' && !s.submittedToAdmin).map(s => s.id);
        if (eligible.every(id => selected.has(id))) {
            setSelected(new Set());
        } else {
            setSelected(new Set(eligible));
        }
    };

    const openNotesModal = () => {
        const toSubmit = [...selected].filter(id => {
            const s = submissions.find(x => x.id === id);
            return s && s.status === 'approved' && !s.submittedToAdmin;
        });
        if (toSubmit.length === 0) {
            showToast('No eligible submissions selected', 'error');
            return;
        }
        setPendingIds(toSubmit);
        setNotesText('');
        setShowNotesModal(true);
    };

    const undoSubmit = async (id: string) => {
        if (!window.confirm('Undo sending this submission to admin?')) return;
        try {
            await engineeringSubmissionsService.undoSubmitToAdmin(id);
            showToast('Submission removed from admin report', 'success');
            load();
        } catch {
            showToast('Failed to undo', 'error');
        }
    };

    const deleteSubmission = async (id: string) => {
        if (!window.confirm('Delete this submission permanently? This cannot be undone.')) return;
        try {
            await engineeringSubmissionsService.remove(id);
            showToast('Submission deleted', 'success');
            load();
        } catch {
            showToast('Failed to delete', 'error');
        }
    };

    const submitSelected = async () => {
        if (pendingIds.length === 0) return;
        setSubmitting(true);
        let successCount = 0;
        let failCount = 0;
        for (const id of pendingIds) {
            try {
                await engineeringSubmissionsService.submitToAdmin(id, notesText.trim() || undefined);
                successCount++;
            } catch {
                failCount++;
            }
        }
        if (successCount > 0) {
            showToast(`${successCount} submission(s) sent to admin${failCount > 0 ? `, ${failCount} failed` : ''}`, 'success');
        } else {
            showToast('Failed to submit to admin', 'error');
        }
        setSelected(new Set());
        setShowNotesModal(false);
        setPendingIds([]);
        setNotesText('');
        setSubmitting(false);
        load();
    };

    const statusStyle: Record<string, { color: string; bg: string; label: string }> = {
        submitted: { color: '#f59e0b', bg: '#f59e0b18', label: 'Submitted' },
        approved: { color: '#22c55e', bg: '#22c55e18', label: 'Approved' },
        rejected: { color: '#ef4444', bg: '#ef444418', label: 'Rejected' },
        corrections_requested: { color: '#f97316', bg: '#f9731618', label: 'Corrections Needed' },
    };

    const eligibleCount = filtered.filter(s => s.status === 'approved' && !s.submittedToAdmin).length;
    const selectedEligible = [...selected].filter(id => {
        const s = submissions.find(x => x.id === id);
        return s && s.status === 'approved' && !s.submittedToAdmin;
    }).length;

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.2rem' }}>
                    <FaPaperPlane style={{ color: 'var(--primary)' }} /> Report to Admin
                </h2>
                <button
                    onClick={() => navigate('/admin/engineering-studio')}
                    title="Back to Engineering Studio"
                    style={{
                        padding: '0.35rem 0.6rem', borderRadius: 8, border: '1px solid var(--border-color)',
                        background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
                        color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-body)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                    <FaArrowLeft size={11} /> Back
                </button>
            </div>

            <div className="es-summary-cards" style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{
                    flex: '1 1 200px', padding: '1.2rem 1rem', borderRadius: 12, background: 'var(--bg-white)',
                    border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaCheckCircle size={20} color="#16a34a" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Approved</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{submissions.filter(s => s.status === 'approved').length} submission(s)</div>
                    </div>
                </div>
                <div style={{
                    flex: '1 1 200px', padding: '1.2rem 1rem', borderRadius: 12, background: 'var(--bg-white)',
                    border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaEnvelope size={20} color="#2563eb" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Already Sent</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{submissions.filter(s => s.submittedToAdmin).length} submission(s)</div>
                    </div>
                </div>
                <div style={{
                    flex: '1 1 200px', padding: '1.2rem 1rem', borderRadius: 12, background: 'var(--bg-white)',
                    border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaCheckDouble size={20} color="#d97706" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Selected</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{selectedEligible} of {eligibleCount} eligible</div>
                    </div>
                </div>
            </div>

            <div className="es-flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {([
                        { key: 'approved', label: 'Approved' },
                        { key: 'submitted_to_admin', label: 'Sent to Admin' },
                        { key: 'all', label: 'All' },
                    ] as const).map(f => (
                        <button
                            key={f.key}
                            onClick={() => { setFilter(f.key); setSelected(new Set()); }}
                            style={{
                                padding: '0.3rem 0.85rem', borderRadius: 20, border: '1px solid var(--border-color)',
                                background: filter === f.key ? 'var(--primary)' : 'transparent',
                                color: filter === f.key ? '#fff' : 'var(--text-muted)',
                                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                {filter !== 'submitted_to_admin' && selectedEligible > 0 && (
                    <button
                        className="admin-btn"
                        onClick={openNotesModal}
                        disabled={submitting}
                        style={{
                            background: '#16a34a', borderColor: '#16a34a', color: '#fff',
                            borderRadius: 5, padding: '0.4rem 1rem', fontSize: '0.82rem',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}
                    >
                        {submitting ? <FaSpinner className="fa-spin" /> : <FaPaperPlane />}
                        Submit {selectedEligible} to Admin
                    </button>
                )}
            </div>

            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {filter !== 'submitted_to_admin' && (
                            <input
                                type="checkbox"
                                checked={eligibleCount > 0 && eligibleCount === filtered.filter(s => s.status === 'approved' && !s.submittedToAdmin).every(s => selected.has(s.id))}
                                onChange={toggleAll}
                                style={{ cursor: 'pointer' }}
                                title="Select all eligible"
                            />
                        )}
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {filtered.length} submission(s)
                        </span>
                    </div>
                    <input
                        type="text" className="form-input" placeholder="Search submissions..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem', width: 220 }}
                    />
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: 40 }}></th>
                                <th>Title</th>
                                <th>Submitter</th>
                                <th>Status</th>
                                <th>Docs</th>
                                <th>Date</th>
                                <th>Admin Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <FaSpinner className="fa-spin" style={{ fontSize: '1.5rem', opacity: 0.4 }} />
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <FaPaperPlane size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                                    <div>No submissions found</div>
                                </td></tr>
                            ) : filtered.map(sub => {
                                const isEligible = sub.status === 'approved' && !sub.submittedToAdmin;
                                const isSelected = selected.has(sub.id);
                                const ss = statusStyle[sub.status] || { color: '#6b7280', bg: '#6b728018', label: sub.status };
                                return (
                                    <tr
                                        key={sub.id}
                                        style={{
                                            opacity: sub.submittedToAdmin ? 0.65 : 1,
                                            cursor: isEligible ? 'pointer' : 'default',
                                            background: isSelected ? '#f0fdf4' : undefined,
                                        }}
                                        onClick={() => isEligible && toggle(sub.id)}
                                    >
                                        <td>
                                            {isEligible ? (
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggle(sub.id)}
                                                    onClick={e => e.stopPropagation()}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            ) : sub.submittedToAdmin ? (
                                                <FaCheckCircle size={14} color="#22c55e" />
                                            ) : null}
                                        </td>
                                        <td><strong>{sub.title}</strong></td>
                                        <td style={{ fontSize: '0.8rem' }}>
                                            {sub.submitter ? `${sub.submitter.firstName || ''} ${sub.submitter.lastName || ''}`.trim() || sub.submitter.email : '—'}
                                        </td>
                                        <td>
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 10,
                                                background: ss.bg, color: ss.color, textTransform: 'capitalize',
                                            }}>{ss.label}</span>
                                        </td>
                                        <td style={{ fontSize: '0.8rem' }}>{sub.documentUrls?.length || 0}</td>
                                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{new Date(sub.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            {sub.submittedToAdmin ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 10, background: '#dbeafe', color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                        <FaCheckCircle size={10} /> Sent
                                                    </span>
                                                    <button
                                                        className="admin-btn admin-btn--secondary"
                                                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                                                        title="Undo send to admin"
                                                        onClick={(e) => { e.stopPropagation(); undoSubmit(sub.id); }}
                                                    >
                                                        <FaUndo size={10} /> Undo
                                                    </button>
                                                    <button
                                                        className="admin-btn admin-btn--secondary"
                                                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', color: 'var(--primary-red)' }}
                                                        title="Delete submission"
                                                        onClick={(e) => { e.stopPropagation(); deleteSubmission(sub.id); }}
                                                    >
                                                        <FaTrash size={10} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>—</span>
                                                    <button
                                                        className="admin-btn admin-btn--secondary"
                                                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', color: 'var(--primary-red)' }}
                                                        title="Delete submission"
                                                        onClick={(e) => { e.stopPropagation(); deleteSubmission(sub.id); }}
                                                    >
                                                        <FaTrash size={10} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {showNotesModal && (
                <div className="admin-modal-overlay" onClick={() => !submitting && setShowNotesModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 480 }}>
                        <div className="admin-modal-header">
                            <h3><FaPaperPlane style={{ marginRight: 8 }} />Submit to Admin</h3>
                            <button onClick={() => !submitting && setShowNotesModal(false)}><FaExclamationTriangle style={{ display: 'none' }} /></button>
                        </div>
                        <div className="admin-modal-body">
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                Submitting <strong>{pendingIds.length}</strong> approved submission(s) to admin.
                            </p>
                            <div className="form-group">
                                <label className="form-label">Notes (optional)</label>
                                <textarea
                                    className="form-textarea"
                                    rows={4}
                                    value={notesText}
                                    onChange={e => setNotesText(e.target.value)}
                                    placeholder="Add any notes for admin (optional)..."
                                    disabled={submitting}
                                />
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setShowNotesModal(false)} disabled={submitting}>Cancel</button>
                            <button className="admin-btn" onClick={submitSelected} disabled={submitting} style={{ background: '#16a34a', borderColor: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {submitting ? <FaSpinner className="fa-spin" /> : <FaPaperPlane />}
                                {submitting ? 'Sending...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportToAdmin;
