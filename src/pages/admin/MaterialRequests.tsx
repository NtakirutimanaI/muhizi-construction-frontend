import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTimes as FaTimesIcon, FaTruck, FaSpinner, FaChevronLeft, FaChevronRight, FaCheck, FaBan, FaUser, FaClock, FaCheckDouble, FaArrowsAlt, FaFileExcel, FaFilePdf, FaSearch, FaCalendarAlt } from 'react-icons/fa';
import { constructionService } from '../../services/constructionService';
import { materialRequestsService } from '../../services/materialRequestsService';
import { loadPageCache, savePageCache } from '../../utils/pageCache';
import { assignmentService } from '../../services/assignmentService';
import type { MaterialRequest } from '../../services/materialRequestsService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PAGE_SIZES = [5, 10, 15, 20];

const emptyForm = { project: '', material: '', quantity: '' as any, unit: 'pieces', unitPrice: '' as any, date: new Date().toISOString().split('T')[0], notes: '' };

const statusColors: Record<string, string> = {
    pending: '#f59e0b', approved: '#1B2042', rejected: '#ef4444', delivered: '#22c55e',
};

const MaterialRequests = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [requests, setRequests] = useState<MaterialRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
    const [selectedProject, setSelectedProject] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [rejectNotes, setRejectNotes] = useState('');
    const [editing, setEditing] = useState<MaterialRequest | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [statusFilter, setStatusFilter] = useState('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [modalPos, setModalPos] = useState<{ x: number; y: number } | null>(null);
    const dragging = useRef<{ offsetX: number; offsetY: number } | null>(null);
    const [rejectModalPos, setRejectModalPos] = useState<{ x: number; y: number } | null>(null);
    const rejectDragging = useRef<{ offsetX: number; offsetY: number } | null>(null);

    const isSiteMgr = user?.role === 'storekeeper';

    const load = async () => {
        const cached = loadPageCache<{ requests: MaterialRequest[]; projects: { id: string; name: string }[] }>('pg_material_requests');
        if (cached) {
            setRequests(cached.requests || []);
            setProjects(cached.projects || []);
        }
        let assignedProjectNames: string[] = [];

        if (isSiteMgr) {
            try {
                const res = await assignmentService.getMyTeam();
                const assignments = res.data || [];
                assignedProjectNames = [...new Set(assignments.map((a: any) => a.project?.name).filter(Boolean))];
            } catch (e) { console.error(e); }
        }

        try {
            const res = await constructionService.getProjects();
            let allProjects = res.data || [];
            if (isSiteMgr) {
                allProjects = allProjects.filter((p: any) => assignedProjectNames.includes(p.name));
                if (allProjects.length > 0) setSelectedProject(allProjects[0].name);
            }
            setProjects(allProjects);

            const res2 = await materialRequestsService.getAll();
            const data = res2.data || [];
            const filtered = isSiteMgr ? data.filter((r: any) => assignedProjectNames.includes(r.project)) : data;
            setRequests(filtered);
            savePageCache('pg_material_requests', { requests: filtered, projects: allProjects });
        } catch (e) { console.error(e); }
    };
    useEffect(() => { load(); }, []);

    const filtered = useMemo(() =>
        requests.filter(r => {
            if (selectedProject !== 'all' && r.project !== selectedProject) return false;
            if (statusFilter !== 'all' && r.status !== statusFilter) return false;
            if (fromDate && r.date && new Date(r.date) < new Date(fromDate)) return false;
            if (toDate) { const end = new Date(toDate); end.setHours(23, 59, 59, 999); if (r.date && new Date(r.date) > end) return false; }
            return !search.trim() || r.project.toLowerCase().includes(search.toLowerCase()) || r.material.toLowerCase().includes(search.toLowerCase()) || (r.createdByName || '').toLowerCase().includes(search.toLowerCase());
        }),
        [requests, selectedProject, statusFilter, search, fromDate, toDate],
    );

    const totalPages = pageSize === 0 ? 1 : Math.ceil(filtered.length / pageSize);
    const paginated = useMemo(() => {
        if (pageSize === 0) return filtered;
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    useEffect(() => { if (page > totalPages) setPage(totalPages || 1); }, [totalPages, page]);

    const stats = useMemo(() => ({
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
        delivered: requests.filter(r => r.status === 'delivered').length,
    }), [requests]);

    const tableData = useMemo(() => filtered.map((r, i) => [
        String(i + 1),
        r.project,
        r.material,
        `${r.quantity} ${r.unit}`,
        r.totalCost > 0 ? `RWF ${Number(r.totalCost).toLocaleString()}` : '—',
        r.date || '—',
        r.createdByName || '—',
        r.status.replace('_', ' '),
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
        doc.text('Material Requests Report', 14, titleY);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#666');
        const today = new Date().toLocaleDateString();
        doc.text(`Generated: ${today}${fromDate && toDate ? ` | Period: ${fromDate} to ${toDate}` : ''}`, pageW - 14, titleY, { align: 'right' });
        autoTable(doc, {
            head: [['#', 'Project', 'Material', 'Qty', 'Cost', 'Date', 'Requested By', 'Status']],
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
        doc.save('material-requests.pdf');
    };

    const downloadExcel = () => {
        const brown = '#1B2042';
        const today = new Date().toLocaleDateString();
        const period = fromDate && toDate ? `Period: ${fromDate} to ${toDate}` : '';
        const headers = ['#', 'Project', 'Material', 'Qty', 'Cost', 'Date', 'Requested By', 'Status'];
        const rows = tableData.map(r => `<tr>${r.map(c => `<td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${c}</td>`).join('')}</tr>`).join('');
        const html = `
            <html><head><meta charset="UTF-8"></head><body>
            <div style="text-align:center;color:${brown};font-size:20px;font-weight:bold;font-family:Arial">MUHIZI CONSTRUCTION</div>
            <div style="text-align:center;color:${brown};font-size:11px;font-family:Arial;margin-bottom:4px">Building Your Vision, Delivering Excellence</div>
            <hr style="border:1px solid ${brown}" />
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;color:${brown};font-family:Arial;margin:6px 0">
                <span>Material Requests Report</span>
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
        a.href = url; a.download = 'material-requests.xls'; a.click();
        URL.revokeObjectURL(url);
    };

    const openNew = () => { setEditing(null); setForm(emptyForm); setModalPos(null); setShowModal(true); };
    const openEdit = (r: MaterialRequest) => { setEditing(r); setForm({ project: r.project, material: r.material, quantity: r.quantity, unit: r.unit, unitPrice: r.unitPrice, date: r.date, notes: r.notes || '' }); setModalPos(null); setShowModal(true); };

    const save = () => {
        if (!form.project || !form.material) { showToast('Project and material are required', 'error'); return; }
        if (editing) {
            materialRequestsService.update(editing.id, form as any)
                .then(() => { showToast('Request updated', 'success'); load(); })
                .catch(() => showToast('Failed to update', 'error'));
        } else {
            materialRequestsService.create(form as any)
                .then(() => { showToast('Request created', 'success'); load(); })
                .catch(() => showToast('Failed to create', 'error'));
        }
        setShowModal(false);
        setEditing(null);
    };

    const remove = (id: string) => {
        if (!window.confirm('Delete this request?')) return;
        materialRequestsService.delete(id)
            .then(() => { showToast('Request deleted', 'success'); load(); })
            .catch(() => showToast('Failed to delete', 'error'));
    };

    const handleApprove = async (id: string) => {
        try {
            await materialRequestsService.approve(id);
            showToast('Request approved', 'success');
            load();
        } catch { showToast('Failed to approve', 'error'); }
    };

    const handleReject = async () => {
        if (!rejectId) return;
        try {
            await materialRequestsService.reject(rejectId, rejectNotes);
            showToast('Request rejected', 'success');
            setShowRejectModal(false);
            setRejectId(null);
            setRejectNotes('');
            load();
        } catch { showToast('Failed to reject', 'error'); }
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

    const onRejectMouseMove = useCallback((e: MouseEvent) => {
        if (!rejectDragging.current) return;
        setRejectModalPos({ x: e.clientX - rejectDragging.current.offsetX, y: e.clientY - rejectDragging.current.offsetY });
    }, []);

    const onRejectMouseUp = useCallback(() => {
        rejectDragging.current = null;
        document.removeEventListener('mousemove', onRejectMouseMove);
        document.removeEventListener('mouseup', onRejectMouseUp);
    }, [onRejectMouseMove]);

    const onRejectHeaderMouseDown = useCallback((e: React.MouseEvent) => {
        const modal = (e.currentTarget as HTMLElement).closest('.admin-modal') as HTMLElement | null;
        if (!modal) return;
        const rect = modal.getBoundingClientRect();
        setRejectModalPos({ x: rect.left, y: rect.top });
        rejectDragging.current = { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
        document.addEventListener('mousemove', onRejectMouseMove);
        document.addEventListener('mouseup', onRejectMouseUp);
    }, [onRejectMouseMove, onRejectMouseUp]);

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, flexShrink: 0 }}>
                    <FaTruck style={{ color: 'var(--primary)' }} /> Material Requests
                </h2>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <div className="admin-card" style={{ padding: '0.45rem 2.5rem', textAlign: 'center', background: '#f59e0b', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{stats.pending}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Pending</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 2.5rem', textAlign: 'center', background: '#1B2042', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{stats.approved}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Approved</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 2.5rem', textAlign: 'center', background: '#ef4444', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{stats.rejected}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Rejected</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 2.5rem', textAlign: 'center', background: '#22c55e', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{stats.delivered}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Delivered</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 2.5rem', textAlign: 'center', background: '#6b7280', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{stats.total}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Total</div>
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>All Material Requests</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <select value={selectedProject} onChange={e => { setPage(1); setSelectedProject(e.target.value); }}
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', minWidth: '140px' }}>
                            {!isSiteMgr && <option value="all">All Projects</option>}
                            {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                        <select value={statusFilter} onChange={e => { setPage(1); setStatusFilter(e.target.value); }}
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)' }}>
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="delivered">Delivered</option>
                        </select>
                        <input type="text" className="form-input" placeholder="Search project, material..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 250 }} />
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button className="admin-btn" onClick={() => setShowDateFilter(p => !p)} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.3rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FaCalendarAlt size={11} /> Date
                            </button>
                            {showDateFilter && (
                                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#fff', border: '1px solid var(--border-color)', borderRadius: 8, padding: '0.75rem', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 220 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1B2042' }}>Filter by Date</span>
                                        <button onClick={() => setShowDateFilter(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#999', fontSize: '1rem', lineHeight: 1 }}><FaTimesIcon /></button>
                                    </div>
                                    <input type="date" className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: '100%' }} title="From date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} />
                                    <input type="date" className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: '100%' }} title="To date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} />
                                </div>
                            )}
                        </div>
                        <button className="admin-btn" onClick={openNew} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.6rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FaPlus /> New Request
                        </button>
                        <button className="admin-btn" onClick={downloadExcel} title="Download as Excel — for records, sharing, or uploading elsewhere as evidence" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.3rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 3, opacity: 1 }}>
                            <FaFileExcel />
                        </button>
                        <button className="admin-btn" onClick={downloadPDF} title="Download as PDF — for records, sharing, or uploading elsewhere as evidence" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.3rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 3, opacity: 1 }}>
                            <FaFilePdf />
                        </button>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Project</th><th>Material</th><th>Qty</th><th>Cost</th><th>Date</th><th>Requested By</th><th>Status</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(item => (
                                <tr key={item.id}>
                                    <td><strong>{item.project}</strong></td>
                                    <td style={{ fontSize: '0.85rem' }}>{item.material}</td>
                                    <td style={{ fontSize: '0.85rem' }}>{item.quantity} {item.unit}</td>
                                    <td style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>
                                        {item.totalCost > 0 ? `RWF ${Number(item.totalCost).toLocaleString()}` : '—'}
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{item.date || '—'}</td>
                                    <td style={{ fontSize: '0.85rem' }}>
                                        {item.createdByName ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <FaUser size={10} style={{ color: 'var(--text-muted)' }} /> {item.createdByName}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600,
                                            color: '#fff', background: statusColors[item.status] || '#6b7280',
                                        }}>{item.status.replace('_', ' ')}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            {item.status === 'pending' && (
                                                <>
                                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem', color: '#22c55e' }} onClick={() => handleApprove(item.id)} title="Approve"><FaCheck /></button>
                                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem', color: '#ef4444' }} onClick={() => { setRejectId(item.id); setRejectNotes(''); setShowRejectModal(true); }} title="Reject"><FaBan /></button>
                                                </>
                                            )}
                                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => openEdit(item)} title="Edit"><FaEdit /></button>
                                            {user?.role === 'admin' && (
                                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem', color: 'var(--primary-red)' }} onClick={() => remove(item.id)} title="Delete"><FaTrash /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginated.length === 0 && (
                                <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <FaTruck size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                                    <div>No material requests found.</div>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0.5rem 0', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Showing {pageSize === 0 ? filtered.length : Math.min(pageSize, filtered.length - (page - 1) * pageSize)} of {filtered.length}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Per page:</span>
                            <select className="form-select" style={{ width: 'auto', padding: '0.3rem 1.5rem 0.3rem 0.5rem', fontSize: '0.8rem' }}
                                value={pageSize} onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}>
                                {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                <option value={0}>All</option>
                            </select>
                        </div>
                        {pageSize > 0 && totalPages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><FaChevronLeft /></button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button key={p} className={p === page ? 'admin-btn' : 'admin-btn admin-btn--secondary'} style={{ padding: '0.3rem 0.7rem', minWidth: 32, fontSize: '0.85rem' }} onClick={() => setPage(p)}>{p}</button>
                                ))}
                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><FaChevronRight /></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="admin-modal-overlay" onClick={() => { setShowModal(false); setEditing(null); }}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ left: modalPos?.x ?? '50%', top: modalPos?.y ?? '50%', transform: modalPos ? 'none' : 'translate(-50%, -50%)', width: 500 }}>
                        <div className="admin-modal-header" onMouseDown={onHeaderMouseDown}>
                            <h3><FaArrowsAlt style={{ fontSize: '0.75rem', marginRight: 8, opacity: 0.5 }} />{editing ? 'Edit' : 'New'} Material Request</h3>
                            <button onClick={() => { setShowModal(false); setEditing(null); }}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Project</label>
                                    <select value={form.project} onChange={e => setForm(p => ({ ...p, project: e.target.value }))} className="form-select">
                                        <option value="">Select project</option>
                                        {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Material</label>
                                    <input value={form.material} onChange={e => setForm(p => ({ ...p, material: e.target.value }))} className="form-input" placeholder="e.g. Cement" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Quantity</label>
                                    <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value === '' ? '' : parseInt(e.target.value) || '' }))} className="form-input" placeholder="e.g. 100" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Unit Price (RWF)</label>
                                    <input type="number" value={form.unitPrice} onChange={e => setForm(p => ({ ...p, unitPrice: e.target.value === '' ? '' : parseFloat(e.target.value) || '' }))} className="form-input" placeholder="e.g. 15000" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Unit</label>
                                    <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} className="form-select">
                                        <option value="pieces">Pieces</option>
                                        <option value="bags">Bags</option>
                                        <option value="tons">Tons</option>
                                        <option value="liters">Liters</option>
                                        <option value="meters">Meters</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="form-input" placeholder="Optional notes" />
                                </div>
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => { setShowModal(false); setEditing(null); }}>Cancel</button>
                            <button className="admin-btn" onClick={save} disabled={!form.project || !form.material}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {showRejectModal && rejectId && (
                <div className="admin-modal-overlay" onClick={() => setShowRejectModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ left: rejectModalPos?.x ?? '50%', top: rejectModalPos?.y ?? '50%', transform: rejectModalPos ? 'none' : 'translate(-50%, -50%)', width: 400 }}>
                        <div className="admin-modal-header" onMouseDown={onRejectHeaderMouseDown}>
                            <h3><FaArrowsAlt style={{ fontSize: '0.75rem', marginRight: 8, opacity: 0.5 }} /><FaBan style={{ color: '#ef4444', marginRight: 6 }} />Reject Request</h3>
                            <button onClick={() => setShowRejectModal(false)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div className="form-group">
                                <label className="form-label">Reason <span style={{ color: '#999', fontSize: '0.75rem' }}>(optional)</span></label>
                                <textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} className="form-textarea" rows={3} placeholder="Why is this request rejected?" />
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setShowRejectModal(false)}>Cancel</button>
                            <button className="admin-btn" onClick={handleReject} style={{ background: '#ef4444', borderColor: '#ef4444' }}>Reject</button>
                        </div>
                    </div>
                </div>
            )}

                    </div>
    );
};

export default MaterialRequests;
