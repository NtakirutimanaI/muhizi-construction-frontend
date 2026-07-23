import { useState, useEffect, useMemo, useRef } from 'react';
import {
    FaDraftingCompass, FaPlus, FaTimes, FaSpinner, FaFileAlt, FaUpload,
    FaCheckCircle, FaEye, FaClock, FaThumbsUp, FaThumbsDown, FaEdit, FaTrash, FaExclamationTriangle, FaArrowLeft, FaBookmark, FaPaperPlane,
} from 'react-icons/fa';
import { loadPageCache, savePageCache } from '../../utils/pageCache';
import { engineeringSubmissionsService } from '../../services/engineeringSubmissionsService';
import type { EngineeringSubmission, SubmissionStatus } from '../../services/engineeringSubmissionsService';
import { tasksService, type Task } from '../../services/tasksService';
import { uploadService } from '../../services/uploadService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { constructionService } from '../../services/constructionService';

const STATUS_STYLE: Record<SubmissionStatus, { color: string; bg: string; label: string }> = {
    submitted: { color: '#f59e0b', bg: '#f59e0b18', label: 'Submitted' },
    reviewed: { color: '#3b82f6', bg: '#3b82f618', label: 'Reviewed' },
    approved: { color: '#22c55e', bg: '#22c55e18', label: 'Approved' },
    rejected: { color: '#ef4444', bg: '#ef444418', label: 'Rejected' },
    corrections_requested: { color: '#f97316', bg: '#f9731618', label: 'Corrections Needed' },
};

const StatusBadge = ({ status }: { status: SubmissionStatus }) => {
    const s = STATUS_STYLE[status];
    return (
        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 10, background: s.bg, color: s.color, textTransform: 'capitalize', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {status === 'corrections_requested' && <FaExclamationTriangle size={10} />}
            {s.label}
        </span>
    );
};

const EngineeringSubmissions = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const isReviewer = user?.role === 'managing_director' || user?.role === 'admin';
    const isSubmitter = user?.role === 'engineering_studio';

    const [submissions, setSubmissions] = useState<EngineeringSubmission[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | SubmissionStatus | 'submitted_to_admin'>('all');
    const [memberFilter, setMemberFilter] = useState<string>('all');
    const [viewItem, setViewItem] = useState<EngineeringSubmission | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [reviewing, setReviewing] = useState(false);
    const [savedDesigns, setSavedDesigns] = useState<Set<string>>(new Set());
    const [submittingToAdmin, setSubmittingToAdmin] = useState(false);

    const [showNew, setShowNew] = useState(false);
    const [form, setForm] = useState({ title: '', description: '' });
    const [documents, setDocuments] = useState<{ name: string; url: string; type: string }[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [saving, setSaving] = useState(false);
    const [myTasks, setMyTasks] = useState<Task[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState('');
    const [deleting, setDeleting] = useState(false);

    const [editItem, setEditItem] = useState<EngineeringSubmission | null>(null);
    const [editForm, setEditForm] = useState({ title: '', description: '' });
    const [editDocuments, setEditDocuments] = useState<{ name: string; url: string; type: string }[]>([]);
    const [editSaving, setEditSaving] = useState(false);
    const editFileRef = useRef<HTMLInputElement>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const load = async () => {
        const cached = loadPageCache<EngineeringSubmission[]>('pg_engineering_submissions');
        if (cached) setSubmissions(cached);
        try {
            const [subRes, taskRes, desRes] = await Promise.all([
                (isReviewer ? engineeringSubmissionsService.getAll() : engineeringSubmissionsService.getMy()).catch(() => ({ data: [] })),
                tasksService.getMy().catch(() => ({ data: [] })),
                constructionService.getDesigns().catch(() => ({ data: [] })),
            ]);
            setSubmissions(subRes.data || []);
            setMyTasks((taskRes.data || []).filter((t: Task) => t.status !== 'completed' && t.status !== 'rejected'));
            const savedTitles = new Set(
                (desRes.data || []).filter((d: any) => d.source === 'submission').map((d: any) => d.title)
            );
            const alreadySaved = new Set(
                (subRes.data || []).filter((s: EngineeringSubmission) => savedTitles.has(s.title)).map((s: EngineeringSubmission) => s.id)
            );
            setSavedDesigns(alreadySaved);
            savePageCache('pg_engineering_submissions', subRes.data || []);
        } catch {
            showToast('Failed to load data', 'error');
        }
    };

    useEffect(() => { load(); }, []);

    const saveAsDesign = async (sub: EngineeringSubmission) => {
        try {
            const firstDoc = sub.documentUrls?.[0];
            await constructionService.createDesign({
                title: sub.title,
                description: sub.description,
                type: 'architectural',
                status: 'approved',
                source: 'submission',
                fileUrl: firstDoc?.url || '',
                thumbnailUrl: '',
                savedBy: user?.id || '',
            });
            setSavedDesigns(prev => new Set([...prev, sub.id]));
            showToast('Saved to Designs permanently', 'success');
        } catch {
            showToast('Failed to save to Designs', 'error');
        }
    };

    const handleSubmitToAdmin = async (sub: EngineeringSubmission) => {
        setSubmittingToAdmin(true);
        try {
            await engineeringSubmissionsService.submitToAdmin(sub.id);
            setViewItem(prev => prev?.id === sub.id ? { ...prev, submittedToAdmin: true } as EngineeringSubmission : prev);
            setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, submittedToAdmin: true } : s));
            showToast('Submitted to Admin successfully', 'success');
        } catch {
            showToast('Failed to submit to admin', 'error');
        } finally {
            setSubmittingToAdmin(false);
        }
    };

    const uniqueSubmitters = useMemo(() => {
        const map = new Map<string, { id: string; name: string }>();
        submissions.forEach(s => {
            if (s.submitter && !map.has(s.submittedBy)) {
                const name = s.submitter.firstName || s.submitter.lastName
                    ? `${s.submitter.firstName || ''} ${s.submitter.lastName || ''}`.trim()
                    : s.submitter.email;
                map.set(s.submittedBy, { id: s.submittedBy, name });
            }
        });
        return Array.from(map.values());
    }, [submissions]);

    const filtered = useMemo(() => {
        return submissions.filter(s => {
            if (statusFilter === 'submitted_to_admin' && !s.submittedToAdmin) return false;
            if (statusFilter !== 'all' && statusFilter !== 'submitted_to_admin' && s.status !== statusFilter) return false;
            if (memberFilter !== 'all' && s.submittedBy !== memberFilter) return false;
            return true;
        });
    }, [submissions, statusFilter, memberFilter]);

    const counts = useMemo(() => ({
        submitted: submissions.filter(s => s.status === 'submitted').length,
        approved: submissions.filter(s => s.status === 'approved').length,
        rejected: submissions.filter(s => s.status === 'rejected').length,
        submitted_to_admin: submissions.filter(s => s.submittedToAdmin).length,
    }), [submissions]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploading(true);
        const newProgress: Record<string, number> = {};
        Array.from(files).forEach(f => { newProgress[f.name] = 0; });
        setUploadProgress(prev => ({ ...prev, ...newProgress }));
        try {
            const results = await Promise.all(Array.from(files).map(async f => {
                const uploaded = await uploadService.uploadFile(f, pct => {
                    setUploadProgress(prev => ({ ...prev, [f.name]: pct }));
                });
                setUploadProgress(prev => ({ ...prev, [f.name]: 100 }));
                return { name: f.name, url: uploaded.secureUrl, type: f.type.split('/')[1] || 'file' };
            }));
            setDocuments(prev => [...prev, ...results]);
        } catch {
            showToast('Failed to upload document', 'error');
        } finally {
            setUploading(false);
            setUploadProgress({});
        }
    };

    const removeDocument = (idx: number) => setDocuments(prev => prev.filter((_, i) => i !== idx));

    const openNew = () => { setForm({ title: '', description: '' }); setDocuments([]); setSelectedTaskId(''); setShowNew(true); };
    const closeNew = () => setShowNew(false);

    const submit = async () => {
        if (!form.title.trim() || !form.description.trim()) {
            showToast('Title and description are required', 'error');
            return;
        }
        setSaving(true);
        try {
            await engineeringSubmissionsService.create({ ...form, documentUrls: documents, taskId: selectedTaskId || undefined });
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

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this submission?')) return;
        setDeleting(true);
        try {
            await engineeringSubmissionsService.remove(id);
            showToast('Submission deleted', 'success');
            setViewItem(null);
            load();
        } catch {
            showToast('Failed to delete', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const openEdit = (item: EngineeringSubmission) => {
        setEditItem(item);
        setEditForm({ title: item.title, description: item.description });
        setEditDocuments(item.documentUrls || []);
        setViewItem(null);
    };

    const handleEditUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        try {
            const results = await Promise.all(Array.from(files).map(async f => {
                const uploaded = await uploadService.uploadFile(f);
                return { name: f.name, url: uploaded.secureUrl, type: f.type.split('/')[1] || 'file' };
            }));
            if (editItem?.status === 'corrections_requested') {
                setEditDocuments(results);
            } else {
                setEditDocuments(prev => [...prev, ...results]);
            }
        } catch {
            showToast('Failed to upload document', 'error');
        }
    };

    const handleEdit = async () => {
        if (!editItem || !editForm.title.trim() || !editForm.description.trim()) {
            showToast('Title and description are required', 'error');
            return;
        }
        setEditSaving(true);
        try {
            await engineeringSubmissionsService.update(editItem.id, { ...editForm, documentUrls: editDocuments });
            if (editItem.status === 'corrections_requested') {
                await engineeringSubmissionsService.updateStatus(editItem.id, { status: 'submitted', reviewNotes: undefined });
            }
            showToast('Submission updated', 'success');
            setEditItem(null);
            load();
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to update', 'error');
        } finally {
            setEditSaving(false);
        }
    };

    return (
        <div className="admin-page">
            <div className="es-flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FaDraftingCompass style={{ color: 'var(--primary)' }} /> Engineering Submissions
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        {isReviewer ? 'Review design reports and drawings submitted by the Engineering Studio.' : 'Submit design reports and drawings for review.'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {isSubmitter && (
                        <button onClick={openNew} className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                            <FaPlus /> New Submission
                        </button>
                    )}
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
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {(['all', 'submitted', 'approved', 'rejected'] as const).map(s => (
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
                {isReviewer && (
                    <button onClick={() => setStatusFilter(statusFilter === 'submitted_to_admin' ? 'all' : 'submitted_to_admin')}
                        style={{
                            padding: '0.35rem 0.85rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
                            border: '1px solid var(--border-color)', cursor: 'pointer',
                            background: statusFilter === 'submitted_to_admin' ? '#6366f1' : 'transparent',
                            color: statusFilter === 'submitted_to_admin' ? '#fff' : 'var(--text-muted)',
                        }}>
                        <FaPaperPlane size={10} style={{ marginRight: 4 }} />To Admin {counts.submitted_to_admin ? `(${counts.submitted_to_admin})` : ''}
                    </button>
                )}
                {isReviewer && uniqueSubmitters.length > 0 && (
                    <>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>|</span>
                        <select
                            value={memberFilter}
                            onChange={e => setMemberFilter(e.target.value)}
                            style={{
                                padding: '0.35rem 0.6rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
                                border: '1px solid var(--border-color)', background: 'var(--bg-body)',
                                color: memberFilter !== 'all' ? 'var(--text-main)' : 'var(--text-muted)',
                                cursor: 'pointer', outline: 'none',
                            }}>
                            <option value="all">All Members</option>
                            {uniqueSubmitters.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
                {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                        <FaDraftingCompass size={36} style={{ opacity: 0.2, marginBottom: 10 }} />
                        <div style={{ fontWeight: 600 }}>No submissions{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}</div>
                    </div>
                )}
                {filtered.map(s => (
                    <div key={s.id} className="content-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 0, overflow: 'hidden' }}>
                        {/* Document preview area */}
                        <div style={{ padding: '0.8rem', background: 'var(--bg-body)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minHeight: 52 }}>
                            {s.documentUrls && s.documentUrls.length > 0 ? (
                                s.documentUrls.slice(0, 3).map((d, i) => (
                                    <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.2rem 0.5rem', background: '#8b5cf618', color: '#8b5cf6', borderRadius: 6, fontSize: '0.68rem', fontWeight: 600, textDecoration: 'none' }}>
                                        <FaFileAlt size={9} />{d.name.length > 16 ? d.name.slice(0, 14) + '...' : d.name}
                                    </a>
                                ))
                            ) : (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No documents</span>
                            )}
                            {s.documentUrls && s.documentUrls.length > 3 && (
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>+{s.documentUrls.length - 3} more</span>
                            )}
                        </div>
                        {/* Details */}
                        <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                <h4 style={{ fontWeight: 700, fontSize: '0.88rem', margin: 0, lineHeight: 1.3, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</h4>
                                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                                    {s.submittedToAdmin && (
                                        <span title="Submitted to Admin" style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: '#6366f118', color: '#6366f1', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                            <FaPaperPlane size={8} /> To Admin
                                        </span>
                                    )}
                                    <StatusBadge status={s.status} />
                                </div>
                            </div>
                            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {s.description}
                            </p>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 'auto', display: 'flex', gap: 10, paddingTop: 4, alignItems: 'center' }}>
                                <span><FaFileAlt size={8} style={{ marginRight: 2 }} />{s.documentUrls?.length || 0} doc(s)</span>
                                <span><FaClock size={8} style={{ marginRight: 2 }} />{new Date(s.createdAt).toLocaleDateString()}</span>
                                {s.submitter && (
                                    <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--text-main)' }}>
                                        {s.submitter.firstName || s.submitter.lastName
                                            ? `${s.submitter.firstName || ''} ${s.submitter.lastName || ''}`.trim()
                                            : s.submitter.email}
                                    </span>
                                )}
                            </div>
                        </div>
                        {/* Action buttons */}
                        <div style={{ display: 'flex', borderTop: '1px solid var(--border-color)' }}>
                            <button onClick={() => { setViewItem(s); setReviewNotes(''); }} title="View"
                                style={{ flex: 1, padding: '0.45rem', border: 'none', borderRight: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', transition: 'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#3b82f610'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <FaEye size={13} />
                            </button>
                            {s.status === 'approved' && isReviewer && (
                                <button
                                    onClick={() => saveAsDesign(s)}
                                    title={savedDesigns.has(s.id) ? 'Already saved' : 'Save to Designs'}
                                    disabled={savedDesigns.has(s.id)}
                                    style={{
                                        flex: 1, padding: '0.45rem', border: 'none', borderRight: '1px solid var(--border-color)',
                                        background: 'transparent', cursor: savedDesigns.has(s.id) ? 'default' : 'pointer',
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        color: savedDesigns.has(s.id) ? '#22c55e' : '#8b5cf6',
                                        opacity: savedDesigns.has(s.id) ? 0.6 : 1,
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => { if (!savedDesigns.has(s.id)) e.currentTarget.style.background = '#8b5cf610'; }}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <FaBookmark size={13} />
                                </button>
                            )}
                            {isSubmitter && (
                                <button onClick={() => openEdit(s)} title="Edit"
                                    style={{ flex: 1, padding: '0.45rem', border: 'none', borderRight: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', transition: 'background 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f59e0b10'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <FaEdit size={13} />
                                </button>
                            )}
                            <button onClick={() => handleDelete(s.id)} title="Delete" disabled={deleting}
                                style={{ flex: 1, padding: '0.45rem', border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', transition: 'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#ef444410'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <FaTrash size={13} />
                            </button>
                        </div>
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
                            {myTasks.length > 0 && (
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label className="form-label">Link to Task (optional)</label>
                                    <select className="form-select" value={selectedTaskId} onChange={e => {
                                        const id = e.target.value;
                                        setSelectedTaskId(id);
                                        if (id) {
                                            const task = myTasks.find(t => t.id === id);
                                            if (task) setForm(p => ({ ...p, title: task.title }));
                                        }
                                    }}>
                                        <option value="">— No task —</option>
                                        {myTasks.map(t => (
                                            <option key={t.id} value={t.id}>{t.title}</option>
                                        ))}
                                    </select>
                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                                        Selecting a task will mark it as completed when you submit.
                                    </p>
                                </div>
                            )}
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
                                    {Object.entries(uploadProgress).map(([name, pct]) => (
                                        <div key={name} style={{ padding: '0.4rem 0.6rem', background: 'var(--bg-body)', borderRadius: 6 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <FaUpload size={10} style={{ color: 'var(--primary)' }} />
                                                <span style={{ fontSize: '0.78rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: pct === 100 ? '#22c55e' : 'var(--primary)', minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                                            </div>
                                            <div style={{ height: 4, borderRadius: 2, background: 'var(--border-color)', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: pct === 100 ? '#22c55e' : 'var(--primary)', transition: 'width 0.3s ease' }} />
                                            </div>
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
                            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <StatusBadge status={viewItem.status} />
                                {viewItem.submittedToAdmin && (
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 10, background: '#6366f118', color: '#6366f1', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                        <FaPaperPlane size={9} /> Submitted to Admin
                                    </span>
                                )}
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
                                <div style={{
                                    padding: '0.8rem 1rem', background: viewItem.status === 'corrections_requested' ? '#f9731612' : 'var(--bg-body)',
                                    borderRadius: 8, marginBottom: '1rem',
                                    border: viewItem.status === 'corrections_requested' ? '1px solid #f9731640' : '1px solid var(--border-color)',
                                }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: 6, color: viewItem.status === 'corrections_requested' ? '#f97316' : 'var(--text-main)' }}>
                                        {viewItem.status === 'corrections_requested' ? 'Corrections Requested by Managing Director' : 'Review Feedback'}
                                    </div>
                                    <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.5, color: 'var(--text-main)' }}>{viewItem.reviewNotes}</p>
                                </div>
                            )}

                            {isReviewer && !['approved', 'rejected'].includes(viewItem.status) && (
                                <div className="form-group">
                                    <label className="form-label">Review Notes / Comments</label>
                                    <textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} className="form-textarea" rows={3} placeholder="Add feedback, approval notes, or describe what corrections are needed..." />
                                </div>
                            )}
                        </div>
                        <div className="admin-modal-footer" style={{ flexWrap: 'wrap', gap: 6 }}>
                            {isReviewer && !['approved', 'rejected'].includes(viewItem.status) && (
                                <>
                                    <button className="admin-btn admin-btn--secondary" onClick={() => review('rejected')} disabled={reviewing} style={{ color: '#ef4444' }}>
                                        {reviewing ? <FaSpinner className="spin" /> : <FaThumbsDown />} Reject
                                    </button>
                                    <button className="admin-btn admin-btn--secondary" onClick={() => review('corrections_requested')} disabled={reviewing} style={{ color: '#f97316', borderColor: '#f97316' }}>
                                        {reviewing ? <FaSpinner className="spin" /> : <FaEdit />} Request Corrections
                                    </button>
                                    <button className="admin-btn" onClick={() => review('approved')} disabled={reviewing}>
                                        {reviewing ? <FaSpinner className="spin" /> : <FaThumbsUp />} Approve
                                    </button>
                                </>
                            )}
                            {isSubmitter && viewItem.status === 'corrections_requested' && (
                                <button className="admin-btn" onClick={() => { setViewItem(null); openEdit(viewItem); }}>
                                    <FaEdit /> Resubmit
                                </button>
                            )}
                            {isReviewer && viewItem.status === 'approved' && (
                                <>
                                    <button
                                        className="admin-btn"
                                        onClick={() => saveAsDesign(viewItem)}
                                        disabled={savedDesigns.has(viewItem.id)}
                                        style={{ background: savedDesigns.has(viewItem.id) ? '#22c55e' : undefined }}
                                    >
                                        <FaBookmark /> {savedDesigns.has(viewItem.id) ? 'Saved' : 'Save to Designs'}
                                    </button>
                                    <button
                                        className="admin-btn"
                                        onClick={() => handleSubmitToAdmin(viewItem)}
                                        disabled={viewItem.submittedToAdmin || submittingToAdmin}
                                        style={{ background: viewItem.submittedToAdmin ? '#22c55e' : '#6366f1' }}
                                    >
                                        <FaPaperPlane /> {viewItem.submittedToAdmin ? 'Submitted to Admin' : 'Submit to Admin'}
                                    </button>
                                </>
                            )}
                            <button className="admin-btn admin-btn--secondary" onClick={() => setViewItem(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT SUBMISSION MODAL */}
            {editItem && (
                <div className="admin-modal-overlay" onClick={() => { if (!editSaving) setEditItem(null); }}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 520 }}>
                        <div className="admin-modal-header">
                            <h3><FaEdit style={{ marginRight: 8 }} />Edit Submission</h3>
                            <button onClick={() => { if (!editSaving) setEditItem(null); }}><FaTimes /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Title</label>
                                <input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className="form-input" />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Description</label>
                                <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} className="form-textarea" rows={4} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Documents</label>
                                <input ref={editFileRef} type="file" multiple onChange={handleEditUpload} style={{ display: 'none' }} />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                                    {editDocuments.map((d, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.4rem 0.6rem', background: 'var(--bg-body)', borderRadius: 6 }}>
                                            <FaFileAlt size={12} style={{ color: 'var(--text-muted)' }} />
                                            <span style={{ fontSize: '0.8rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                                            <button type="button" onClick={() => setEditDocuments(prev => prev.filter((_, j) => j !== i))} style={{ color: 'var(--primary-red)' }}><FaTimes size={11} /></button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => editFileRef.current?.click()}
                                    style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px dashed var(--primary)', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <FaUpload size={10} /> Add documents
                                </button>
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setEditItem(null)} disabled={editSaving}>Cancel</button>
                            <button className="admin-btn" onClick={handleEdit} disabled={editSaving || !editForm.title.trim() || !editForm.description.trim()}>
                                {editSaving ? <><FaSpinner className="spin" /> Saving...</> : <><FaEdit /> Save Changes</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EngineeringSubmissions;
