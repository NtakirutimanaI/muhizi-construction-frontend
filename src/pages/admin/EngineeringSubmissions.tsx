import { useState, useEffect, useMemo, useRef } from 'react';
import {
    FaDraftingCompass, FaPlus, FaTimes, FaSpinner, FaFileAlt, FaUpload,
    FaCheckCircle, FaEye, FaClock, FaThumbsUp, FaThumbsDown,
} from 'react-icons/fa';
import { engineeringSubmissionsService } from '../../services/engineeringSubmissionsService';
import type { EngineeringSubmission, SubmissionStatus } from '../../services/engineeringSubmissionsService';
import { uploadService } from '../../services/uploadService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const STATUS_STYLE: Record<SubmissionStatus, { color: string; bg: string; label: string }> = {
    submitted: { color: '#f59e0b', bg: '#f59e0b18', label: 'Submitted' },
    reviewed: { color: '#3b82f6', bg: '#3b82f618', label: 'Reviewed' },
    approved: { color: '#22c55e', bg: '#22c55e18', label: 'Approved' },
    rejected: { color: '#ef4444', bg: '#ef444418', label: 'Rejected' },
};

const StatusBadge = ({ status }: { status: SubmissionStatus }) => {
    const s = STATUS_STYLE[status];
    return (
        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 10, background: s.bg, color: s.color, textTransform: 'capitalize' }}>
            {s.label}
        </span>
    );
};

const EngineeringSubmissions = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const isReviewer = user?.role === 'managing_director' || user?.role === 'admin';
    const isSubmitter = user?.role === 'engineering_studio';

    const [submissions, setSubmissions] = useState<EngineeringSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | SubmissionStatus>('all');
    const [viewItem, setViewItem] = useState<EngineeringSubmission | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [reviewing, setReviewing] = useState(false);

    const [showNew, setShowNew] = useState(false);
    const [form, setForm] = useState({ title: '', description: '' });
    const [documents, setDocuments] = useState<{ name: string; url: string; type: string }[]>([]);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = isReviewer ? await engineeringSubmissionsService.getAll() : await engineeringSubmissionsService.getMy();
            setSubmissions(res.data || []);
        } catch {
            showToast('Failed to load submissions', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        if (statusFilter === 'all') return submissions;
        return submissions.filter(s => s.status === statusFilter);
    }, [submissions, statusFilter]);

    const counts = useMemo(() => ({
        submitted: submissions.filter(s => s.status === 'submitted').length,
        approved: submissions.filter(s => s.status === 'approved').length,
        rejected: submissions.filter(s => s.status === 'rejected').length,
    }), [submissions]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            const results = await Promise.all(Array.from(files).map(async f => {
                const uploaded = await uploadService.uploadFile(f);
                return { name: f.name, url: uploaded.secureUrl, type: f.type.split('/')[1] || 'file' };
            }));
            setDocuments(prev => [...prev, ...results]);
        } catch {
            showToast('Failed to upload document', 'error');
        } finally {
            setUploading(false);
        }
    };

    const removeDocument = (idx: number) => setDocuments(prev => prev.filter((_, i) => i !== idx));

    const openNew = () => { setForm({ title: '', description: '' }); setDocuments([]); setShowNew(true); };
    const closeNew = () => setShowNew(false);

    const submit = async () => {
        if (!form.title.trim() || !form.description.trim()) {
            showToast('Title and description are required', 'error');
            return;
        }
        setSaving(true);
        try {
            await engineeringSubmissionsService.create({ ...form, documentUrls: documents });
            showToast('Submission sent for review', 'success');
            closeNew();
            load();
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to submit', 'error');
        } finally {
            setSaving(false);
        }
    };

    const review = async (status: SubmissionStatus) => {
        if (!viewItem) return;
        setReviewing(true);
        try {
            await engineeringSubmissionsService.updateStatus(viewItem.id, { status, reviewNotes: reviewNotes.trim() || undefined });
            showToast(`Submission ${status}`, 'success');
            setViewItem(null);
            setReviewNotes('');
            load();
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to update status', 'error');
        } finally {
            setReviewing(false);
        }
    };

    if (loading) return (
        <div className="admin-page">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: '#999', fontSize: '1.1rem' }}>
                <FaSpinner className="spin" size={20} /> Loading submissions...
            </div>
        </div>
    );

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FaDraftingCompass style={{ color: 'var(--primary)' }} /> Engineering Submissions
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        {isReviewer ? 'Review design reports and drawings submitted by the Engineering Studio.' : 'Submit design reports and drawings for review.'}
                    </p>
                </div>
                {isSubmitter && (
                    <button onClick={openNew} className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                        <FaPlus /> New Submission
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {(['all', 'submitted', 'reviewed', 'approved', 'rejected'] as const).map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        style={{
                            padding: '0.35rem 0.85rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
                            border: '1px solid var(--border-color)', cursor: 'pointer', textTransform: 'capitalize',
                            background: statusFilter === s ? 'var(--text-main)' : 'transparent',
                            color: statusFilter === s ? 'var(--bg-body)' : 'var(--text-muted)',
                        }}>
                        {s} {s !== 'all' && s in counts ? `(${(counts as any)[s]})` : ''}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
                {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <FaDraftingCompass size={36} style={{ opacity: 0.2, marginBottom: 10 }} />
                        <div style={{ fontWeight: 600 }}>No submissions{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}</div>
                    </div>
                )}
                {filtered.map(s => (
                    <div key={s.id} className="content-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
                        onClick={() => { setViewItem(s); setReviewNotes(''); }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <h4 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>{s.title}</h4>
                                <StatusBadge status={s.status} />
                            </div>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.description}</p>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 12 }}>
                                <span><FaFileAlt size={9} style={{ marginRight: 3 }} />{s.documentUrls?.length || 0} document(s)</span>
                                <span><FaClock size={9} style={{ marginRight: 3 }} />{new Date(s.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <FaEye style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    </div>
                ))}
            </div>

            {/* NEW SUBMISSION MODAL */}
            {showNew && (
                <div className="admin-modal-overlay" onClick={() => !saving && closeNew()}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 520 }}>
                        <div className="admin-modal-header">
                            <h3><FaDraftingCompass style={{ marginRight: 8 }} />New Submission</h3>
                            <button onClick={() => !saving && closeNew()}><FaTimes /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Title</label>
                                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="form-input" placeholder="e.g., Foundation Design Report - Site B" />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Description</label>
                                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="form-textarea" rows={4} placeholder="Describe the work, key decisions, and what needs review" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Documents</label>
                                <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                                    {documents.map((d, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.4rem 0.6rem', background: 'var(--bg-body)', borderRadius: 6 }}>
                                            <FaFileAlt size={12} style={{ color: 'var(--text-muted)' }} />
                                            <span style={{ fontSize: '0.8rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                                            <button type="button" onClick={() => removeDocument(i)} style={{ color: 'var(--primary-red)' }}><FaTimes size={11} /></button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                                    style={{
                                        padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px dashed var(--primary)',
                                        background: 'transparent', color: 'var(--primary)', cursor: 'pointer',
                                        fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6,
                                    }}>
                                    <FaUpload size={10} /> {uploading ? 'Uploading...' : 'Upload documents'}
                                </button>
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={closeNew} disabled={saving}>Cancel</button>
                            <button className="admin-btn" onClick={submit} disabled={saving || uploading}>
                                {saving ? <><FaSpinner className="spin" /> Submitting...</> : 'Submit for Review'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW / REVIEW MODAL */}
            {viewItem && (
                <div className="admin-modal-overlay" onClick={() => setViewItem(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 560 }}>
                        <div className="admin-modal-header">
                            <h3><FaDraftingCompass style={{ marginRight: 8 }} />{viewItem.title}</h3>
                            <button onClick={() => setViewItem(null)}><FaTimes /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div style={{ marginBottom: '1rem' }}>
                                <StatusBadge status={viewItem.status} />
                            </div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '1rem' }}>{viewItem.description}</p>

                            {viewItem.documentUrls && viewItem.documentUrls.length > 0 && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Documents</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {viewItem.documentUrls.map((d, i) => (
                                            <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.4rem 0.6rem', background: 'var(--bg-body)', borderRadius: 6, textDecoration: 'none', color: 'var(--primary)', fontSize: '0.85rem' }}>
                                                <FaFileAlt size={12} /> {d.name}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {viewItem.reviewNotes && (
                                <div style={{ marginBottom: '1rem', padding: '0.6rem 0.8rem', background: 'var(--bg-body)', borderRadius: 6 }}>
                                    <label className="form-label">Review Notes</label>
                                    <p style={{ fontSize: '0.85rem', margin: 0 }}>{viewItem.reviewNotes}</p>
                                </div>
                            )}

                            {isReviewer && viewItem.status !== 'approved' && viewItem.status !== 'rejected' && (
                                <div className="form-group">
                                    <label className="form-label">Review Notes (optional)</label>
                                    <textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} className="form-textarea" rows={3} placeholder="Add notes for the Engineering Studio" />
                                </div>
                            )}
                        </div>
                        {isReviewer && viewItem.status !== 'approved' && viewItem.status !== 'rejected' && (
                            <div className="admin-modal-footer">
                                <button className="admin-btn admin-btn--secondary" onClick={() => review('rejected')} disabled={reviewing} style={{ color: '#ef4444' }}>
                                    {reviewing ? <FaSpinner className="spin" /> : <FaThumbsDown />} Reject
                                </button>
                                <button className="admin-btn admin-btn--secondary" onClick={() => review('reviewed')} disabled={reviewing}>
                                    {reviewing ? <FaSpinner className="spin" /> : <FaCheckCircle />} Mark Reviewed
                                </button>
                                <button className="admin-btn" onClick={() => review('approved')} disabled={reviewing}>
                                    {reviewing ? <FaSpinner className="spin" /> : <FaThumbsUp />} Approve
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EngineeringSubmissions;
