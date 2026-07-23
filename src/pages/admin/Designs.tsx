import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FaEdit, FaTrash, FaPlus, FaTimes as FaTimesIcon, FaDraftingCompass, FaFileAlt, FaFileExcel, FaFilePdf, FaArrowsAlt, FaChevronLeft, FaChevronRight, FaClipboardList, FaArrowLeft } from 'react-icons/fa';
import { constructionService } from '../../services/constructionService';
import type { Design, Project } from '../../services/constructionService';
import { engineeringSubmissionsService } from '../../services/engineeringSubmissionsService';
import type { EngineeringSubmission } from '../../services/engineeringSubmissionsService';
import { uploadService } from '../../services/uploadService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadPageCache, savePageCache } from '../../utils/pageCache';

interface FormData {
    title: string; description: string; type: string; status: string; source: string;
    fileUrl: string; thumbnailUrl: string; projectId: string;
}

const emptyForm: FormData = { title: '', description: '', type: 'architectural', status: 'draft', source: 'external', fileUrl: '', thumbnailUrl: '', projectId: '' };
const PAGE_SIZES = [5, 10, 15, 20];

const Designs = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const isSubmitter = user?.role === 'engineering_studio' || user?.role === 'managing_director';
    const [data, setData] = useState<Design[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Design | null>(null);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [modalPos, setModalPos] = useState<{ x: number; y: number } | null>(null);
    const dragging = useRef<{ offsetX: number; offsetY: number } | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadingThumb, setUploadingThumb] = useState(false);
    const [thumbUploadProgress, setThumbUploadProgress] = useState(0);
    const [saving, setSaving] = useState(false);
    const [sourceFilter, setSourceFilter] = useState<'all' | 'submission' | 'external'>('all');

    const [showSubmissions, setShowSubmissions] = useState(false);
    const [mySubmissions, setMySubmissions] = useState<EngineeringSubmission[]>([]);
    const [loadingSubs, setLoadingSubs] = useState(false);

    const fetch = async () => {
        const cached = loadPageCache<{ designs: Design[]; projects: Project[] }>('pg_designs');
        if (cached) {
            setData(cached.designs || []);
            setProjects(cached.projects || []);
        }
        try {
            const [desRes, projRes] = await Promise.all([
                constructionService.getDesigns(),
                constructionService.getProjects(),
            ]);
            setData(desRes.data || []);
            setProjects(projRes.data || []);
            savePageCache('pg_designs', { designs: desRes.data || [], projects: projRes.data || [] });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(); }, []);

    const loadSubmissions = async () => {
        setLoadingSubs(true);
        try {
            const res = await engineeringSubmissionsService.getAll();
            setMySubmissions((res.data || []).filter((s: EngineeringSubmission) => s.status === 'approved' || s.status === 'submitted'));
        } catch {
            showToast('Failed to load submissions', 'error');
        } finally {
            setLoadingSubs(false);
        }
    };

    const saveSubmissionAsDesign = async (sub: EngineeringSubmission) => {
        const exists = data.some(d => d.source === 'submission' && d.title === sub.title);
        if (exists) {
            showToast('This submission is already saved in Designs', 'error');
            return;
        }
        try {
            const firstDoc = sub.documentUrls?.[0];
            await constructionService.createDesign({
                title: sub.title,
                description: sub.description,
                type: 'architectural',
                status: 'draft',
                source: 'submission',
                fileUrl: firstDoc?.url || '',
                thumbnailUrl: '',
                savedBy: user?.id || '',
            });
            showToast('Submission saved to Designs', 'success');
            setShowSubmissions(false);
            fetch();
        } catch (e: any) {
            const msg = e?.response?.data?.message || 'Failed to save submission';
            showToast(Array.isArray(msg) ? msg.join('. ') : msg, 'error');
        }
    };

    const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || '—';

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return data.filter(d => {
            if (sourceFilter !== 'all' && d.source !== sourceFilter) return false;
            if (q && !d.title.toLowerCase().includes(q) && !d.type.toLowerCase().includes(q) && !(d.project?.name || getProjectName(d.projectId || '') || '').toLowerCase().includes(q)) return false;
            if (fromDate && new Date(d.createdAt) < new Date(fromDate)) return false;
            if (toDate) { const end = new Date(toDate); end.setHours(23, 59, 59, 999); if (new Date(d.createdAt) > end) return false; }
            return true;
        });
    }, [data, search, fromDate, toDate, sourceFilter]);

    const totalPages = pageSize === 0 ? 1 : Math.ceil(filtered.length / pageSize);
    const paginated = useMemo(() => {
        if (pageSize === 0) return filtered;
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages || 1);
    }, [totalPages, page]);

    const tableData = useMemo(() => filtered.map((d, i) => [
        String(i + 1),
        d.title,
        d.source === 'submission' ? 'Submission' : 'External',
        d.type,
        d.status,
        d.project?.name || getProjectName(d.projectId || '') || '—',
        d.fileUrl ? 'Yes' : 'No',
        new Date(d.createdAt).toLocaleDateString(),
    ]), [filtered]);

    const downloadPDF = () => {
        const doc = new jsPDF();
        const brown = '#1B2042';
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();

        doc.setFontSize(22);
        doc.setTextColor(brown);
        doc.setFont('helvetica', 'bold');
        doc.text('MUHIZI CONSTRUCTION', pageW / 2, 22, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Building Your Vision, Delivering Excellence', pageW / 2, 30, { align: 'center' });

        doc.setDrawColor(brown);
        doc.setLineWidth(0.8);
        doc.line(14, 34, pageW - 14, 34);

        doc.setFontSize(13);
        doc.setTextColor(brown);
        doc.setFont('helvetica', 'bold');
        const titleY = 40;
        doc.text('Designs Report', 14, titleY);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#666');
        const today = new Date().toLocaleDateString();
        doc.text(`Generated: ${today}${fromDate && toDate ? ` | Period: ${fromDate} to ${toDate}` : ''}`, pageW - 14, titleY, { align: 'right' });

        autoTable(doc, {
            head: [['#', 'Title', 'Source', 'Type', 'Status', 'Project', 'Has File', 'Created']],
            body: tableData,
            startY: 46,
            styles: { fontSize: 8, textColor: '#333' },
            headStyles: { fillColor: [139, 69, 19], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [250, 245, 240] },
            columnStyles: { 0: { cellWidth: 10, halign: 'center' } },
            didDrawPage: (data: any) => {
                doc.setDrawColor(brown);
                doc.setLineWidth(0.5);
                doc.line(14, pageH - 20, pageW - 14, pageH - 20);
                doc.setFontSize(8);
                doc.setTextColor(brown);
                doc.setFont('helvetica', 'normal');
                doc.text('Email: info@muhiziconstruction.com  |  Phone: +250 788 000 000  |  Location: Kigali, Rwanda', pageW / 2, pageH - 14, { align: 'center' });
            },
        });

        doc.save('designs.pdf');
    };

    const downloadExcel = () => {
        const brown = '#1B2042';
        const today = new Date().toLocaleDateString();
        const period = fromDate && toDate ? `Period: ${fromDate} to ${toDate}` : '';
        const headers = ['#', 'Title', 'Source', 'Type', 'Status', 'Project', 'Has File', 'Created'];
        const rows = tableData.map(r => `<tr>${r.map(c => `<td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${c}</td>`).join('')}</tr>`).join('');

        const html = `
            <html><head><meta charset="UTF-8"></head><body>
            <div style="text-align:center;color:${brown};font-size:20px;font-weight:bold;font-family:Arial">MUHIZI CONSTRUCTION</div>
            <div style="text-align:center;color:${brown};font-size:11px;font-family:Arial;margin-bottom:4px">Building Your Vision, Delivering Excellence</div>
            <hr style="border:1px solid ${brown}" />
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;color:${brown};font-family:Arial;margin:6px 0">
                <span>Designs Report</span>
                <span>${today}${period ? ' | ' + period : ''}</span>
            </div>
            <table style="border-collapse:collapse;width:100%;font-family:Arial">
                <tr style="background:${brown};color:#fff">${headers.map(h => `<th style="padding:6px 8px;border:1px solid ${brown};font-size:11px">${h}</th>`).join('')}</tr>
                ${rows}
            </table>
            <hr style="border:0.5px solid ${brown};margin-top:12px" />
            <div style="text-align:center;color:${brown};font-size:10px;font-family:Arial">Email: info@muhiziconstruction.com | Phone: +250 788 000 000 | Location: Kigali, Rwanda</div>
            </body></html>`;

        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'designs.xls'; a.click();
        URL.revokeObjectURL(url);
    };

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!dragging.current) return;
        setModalPos({ x: e.clientX - dragging.current.offsetX, y: e.clientY - dragging.current.offsetY });
    }, []);

    const onMouseUp = useCallback(() => {
        dragging.current = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }, [onMouseMove]);

    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, [onMouseMove, onMouseUp]);

    const onHeaderMouseDown = useCallback((e: React.MouseEvent) => {
        const modal = (e.currentTarget as HTMLElement).closest('.admin-modal') as HTMLElement | null;
        if (!modal) return;
        const rect = modal.getBoundingClientRect();
        setModalPos({ x: rect.left, y: rect.top });
        dragging.current = { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [onMouseMove, onMouseUp]);

    const stats = useMemo(() => ({
        submission: data.filter(d => d.source === 'submission').length,
        external: data.filter(d => d.source === 'external').length,
    }), [data]);

    const openNew = () => { setEditing(null); setForm(emptyForm); setModalPos(null); setShowModal(true); };
    const openEdit = (item: Design) => {
        setEditing(item);
        setForm({ title: item.title, description: item.description || '', type: item.type, status: item.status, source: item.source || 'external', fileUrl: item.fileUrl || '', thumbnailUrl: item.thumbnailUrl || '', projectId: item.projectId || '' });
        setModalPos(null);
        setShowModal(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setUploadProgress(0);
        try {
            const result = await uploadService.uploadFile(file, (pct) => setUploadProgress(pct));
            setForm(p => ({ ...p, fileUrl: result.secureUrl }));
        } catch (err) { console.error('File upload failed', err); }
        setUploading(false);
    };

    const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingThumb(true);
        setThumbUploadProgress(0);
        try {
            const result = await uploadService.uploadFile(file, (pct) => setThumbUploadProgress(pct));
            setForm(p => ({ ...p, thumbnailUrl: result.secureUrl }));
        } catch (err) { console.error('Thumbnail upload failed', err); }
        setUploadingThumb(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editing) {
                await constructionService.updateDesign(editing.id, form);
                showToast('Design updated successfully', 'success');
            } else {
                await constructionService.createDesign({ ...form, savedBy: user?.id || '' });
                showToast('Design created successfully', 'success');
            }
            setShowModal(false);
            fetch();
        } catch (e: any) {
            console.error(e);
            const errMsg = e?.response?.data?.message || e?.message || 'Failed to save design';
            showToast(Array.isArray(errMsg) ? errMsg.join('. ') : errMsg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this design?')) return;
        try { await constructionService.deleteDesign(id); fetch(); }
        catch (e) { console.error(e); }
    };

    const statusColors: Record<string, string> = {
        draft: '#6b7280', approved: '#22c55e', rejected: '#ef4444',
    };
    const typeColors: Record<string, string> = {
        architectural: '#1B2042', structural: '#8b5cf6', interior: '#f59e0b', landscape: '#22c55e',
    };

    return (
        <div className="admin-page">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0', fontSize: '1.2rem' }}>
                <FaDraftingCompass style={{ color: 'var(--primary)' }} /> Designs
            </h2>

            <div className="es-summary-cards" style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{
                    flex: '1 1 200px', padding: '1.2rem 1rem', borderRadius: 12, background: 'var(--bg-white)',
                    border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaClipboardList size={20} color="#6366f1" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>From Submission</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{stats.submission} design{stats.submission !== 1 ? 's' : ''}</div>
                    </div>
                </div>
                <div style={{
                    flex: '1 1 200px', padding: '1.2rem 1rem', borderRadius: 12, background: 'var(--bg-white)',
                    border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaPlus size={20} color="#d97706" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>External Upload</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{stats.external} design{stats.external !== 1 ? 's' : ''}</div>
                    </div>
                </div>
            </div>

            <div className="es-flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {(['all', 'submission', 'external'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => { setSourceFilter(f); setPage(1); }}
                            style={{
                                padding: '0.3rem 0.85rem', borderRadius: 20, border: '1px solid var(--border-color)',
                                background: sourceFilter === f ? 'var(--primary)' : 'transparent',
                                color: sourceFilter === f ? '#fff' : 'var(--text-muted)',
                                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                            }}
                        >
                            {f === 'all' ? 'All' : f === 'submission' ? 'From Submission' : 'External Upload'}
                        </button>
                    ))}
                </div>
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

            <div className="admin-card">
                <div className="design-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>All Designs</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <input type="text" className="form-input" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem', width: 220 }} />
                        <input type="date" className="form-input" style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem', width: 120 }} title="From date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} />
                        <input type="date" className="form-input" style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem', width: 120 }} title="To date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} />
                        <button className="admin-btn" onClick={downloadExcel} title="Download as Excel — for records, sharing, or uploading elsewhere as evidence" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.4rem 0.7rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4, opacity: 1 }}>
                            <FaFileExcel /> Excel
                        </button>
                        <button className="admin-btn" onClick={downloadPDF} title="Download as PDF — for records, sharing, or uploading elsewhere as evidence" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.4rem 0.7rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4, opacity: 1 }}>
                            <FaFilePdf /> PDF
                        </button>
                        <button className="admin-btn" onClick={openNew} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.4rem 1rem', fontSize: '0.82rem' }}>
                            <FaPlus style={{ marginRight: 4 }} />Add Design
                        </button>
                        {isSubmitter && (
                            <button className="admin-btn" onClick={() => { loadSubmissions(); setShowSubmissions(true); }} style={{ background: 'var(--primary)', borderColor: 'var(--primary)', color: '#fff', borderRadius: 5, padding: '0.4rem 1rem', fontSize: '0.82rem' }}>
                                <FaClipboardList style={{ marginRight: 4 }} />Save from Submission
                            </button>
                        )}
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Title</th><th>Source</th><th>Type</th><th>Status</th><th>Project</th><th>File</th><th>Created</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(item => (
                                <tr key={item.id}>
                                    <td><strong>{item.title}</strong></td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600,
                                            color: item.source === 'submission' ? '#6366f1' : '#d97706',
                                            background: item.source === 'submission' ? '#eef2ff' : '#fef3c7',
                                        }}>{item.source === 'submission' ? 'Submission' : 'External'}</span>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600,
                                            color: '#fff', background: typeColors[item.type] || '#6b7280',
                                        }}>{item.type}</span>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600,
                                            color: '#fff', background: statusColors[item.status] || '#6b7280',
                                        }}>{item.status}</span>
                                    </td>
                                    <td>{item.project?.name || getProjectName(item.projectId || '') || '—'}</td>
                                    <td>{item.fileUrl ? <a href={item.fileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-teal)', display: 'flex', alignItems: 'center', gap: 4 }}><FaFileAlt /> View</a> : '—'}</td>
                                    <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{new Date(item.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => openEdit(item)}><FaEdit /></button>
                                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem', color: 'var(--primary-red)' }} onClick={() => handleDelete(item.id)}><FaTrash /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <FaDraftingCompass size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                                    <div>No designs found. Click "Add New" to create one.</div>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '0.25rem 0', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Showing {pageSize === 0 ? filtered.length : Math.min(pageSize, filtered.length - (page - 1) * pageSize)} of {filtered.length}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Per page:</span>
                            <select
                                className="form-select"
                                style={{ width: 'auto', padding: '0.2rem 1.2rem 0.2rem 0.4rem', fontSize: '0.75rem' }}
                                value={pageSize}
                                onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}
                            >
                                {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                <option value={0}>All</option>
                            </select>
                        </div>
                        {pageSize > 0 && totalPages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.5rem' }} disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><FaChevronLeft /></button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button key={p} className={p === page ? 'admin-btn' : 'admin-btn admin-btn--secondary'} style={{ padding: '0.2rem 0.5rem', minWidth: 28, fontSize: '0.78rem' }} onClick={() => setPage(p)}>{p}</button>
                                ))}
                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.5rem' }} disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><FaChevronRight /></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {showModal && (
                <div className="admin-modal-overlay" onClick={() => !saving && setShowModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ left: modalPos?.x ?? '50%', top: modalPos?.y ?? '50%', transform: modalPos ? 'none' : 'translate(-50%, -50%)' }}>
                        <div className="admin-modal-header" onMouseDown={onHeaderMouseDown}>
                            <h3><FaArrowsAlt style={{ fontSize: '0.75rem', marginRight: 8, opacity: 0.5 }} />{editing ? 'Edit' : 'Add'} Design</h3>
                            <button onClick={() => !saving && setShowModal(false)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div className="es-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Title</label>
                                    <input className="form-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Design title" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                                        <option value="architectural">Architectural</option>
                                        <option value="structural">Structural</option>
                                        <option value="interior">Interior</option>
                                        <option value="landscape">Landscape</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                                        <option value="draft">Draft</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Project</label>
                                    <select className="form-select" value={form.projectId} onChange={e => setForm(p => ({ ...p, projectId: e.target.value }))}>
                                        <option value="">No project</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Design File</label>
                                    {form.fileUrl ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <a href={form.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.82rem', color: 'var(--primary-teal)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <FaFileAlt /> View uploaded file
                                            </a>
                                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setForm(p => ({ ...p, fileUrl: '' }))}>
                                                Replace
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleFileUpload} disabled={uploading} style={{ fontSize: '0.82rem', maxWidth: '100%' }} />
                                            {uploading && (
                                                <div style={{ marginTop: 6 }}>
                                                    <div style={{ width: '100%', maxWidth: 300, height: 6, background: '#eee', borderRadius: 3, overflow: 'hidden' }}>
                                                        <div style={{ width: `${uploadProgress}%`, height: 6, background: 'var(--primary-teal)', borderRadius: 3, transition: 'width 0.3s' }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uploading... {uploadProgress}%</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Thumbnail</label>
                                    {form.thumbnailUrl ? (
                                        <div>
                                            <img src={form.thumbnailUrl} alt="Thumbnail" style={{ maxWidth: 120, maxHeight: 80, borderRadius: 4, display: 'block', marginBottom: 4, objectFit: 'cover' }} />
                                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setForm(p => ({ ...p, thumbnailUrl: '' }))}>
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <input type="file" accept="image/*" onChange={handleThumbUpload} disabled={uploadingThumb} style={{ fontSize: '0.82rem', maxWidth: '100%' }} />
                                            {uploadingThumb && (
                                                <div style={{ marginTop: 6 }}>
                                                    <div style={{ width: '100%', maxWidth: 300, height: 6, background: '#eee', borderRadius: 3, overflow: 'hidden' }}>
                                                        <div style={{ width: `${thumbUploadProgress}%`, height: 6, background: 'var(--primary-teal)', borderRadius: 3, transition: 'width 0.3s' }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uploading... {thumbUploadProgress}%</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="form-label">Description</label>
                                <textarea className="form-textarea" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description of the design" />
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
                            <button className="admin-btn" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* SAVE FROM SUBMISSION MODAL */}
            {showSubmissions && (
                <div className="admin-modal-overlay" onClick={() => setShowSubmissions(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="admin-modal-header">
                            <h3><FaClipboardList style={{ marginRight: 8 }} />Save Submission to Designs</h3>
                            <button onClick={() => setShowSubmissions(false)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                            {loadingSubs ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div>
                            ) : mySubmissions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    <FaDraftingCompass size={28} style={{ opacity: 0.2, marginBottom: 8 }} />
                                    <div>No submissions available to save</div>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '0.6rem' }}>
                                    {mySubmissions.map(sub => {
                                        const alreadySaved = data.some(d => d.source === 'submission' && d.title === sub.title);
                                        return (
                                            <div key={sub.id} style={{
                                                padding: '0.7rem', borderRadius: 8, border: '1px solid var(--border-color)',
                                                background: 'var(--bg-body)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem',
                                                opacity: alreadySaved ? 0.55 : 1,
                                            }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.title}</div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.description}</div>
                                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>
                                                        {sub.documentUrls?.length || 0} document(s) — {new Date(sub.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                {alreadySaved ? (
                                                    <span style={{ fontSize: '0.72rem', color: '#22c55e', fontWeight: 600, flexShrink: 0 }}>Saved</span>
                                                ) : (
                                                    <button onClick={() => saveSubmissionAsDesign(sub)} className="admin-btn" style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem', flexShrink: 0 }}>
                                                        <FaPlus size={10} /> Save
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Designs;
