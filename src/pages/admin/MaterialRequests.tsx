import { useState, useEffect, useMemo, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTimes as FaTimesIcon, FaTruck, FaSpinner, FaChevronLeft, FaChevronRight, FaCheck, FaBan, FaUser, FaClock, FaCheckDouble, FaFileExcel, FaFilePdf, FaSearch, FaCalendarAlt, FaWarehouse, FaExclamationTriangle, FaBuilding } from 'react-icons/fa';
import { constructionService } from '../../services/constructionService';
import { materialRequestsService } from '../../services/materialRequestsService';
import { stockService } from '../../services/stockService';
import { sitesService } from '../../services/sitesService';
import type { StockBalance } from '../../services/stockService';
import type { Site } from '../../services/sitesService';
import { loadPageCache, savePageCache } from '../../utils/pageCache';
import { assignmentService } from '../../services/assignmentService';
import type { MaterialRequest } from '../../services/materialRequestsService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PAGE_SIZES = [5, 10, 15, 20];

const emptyForm = { project: '', site: '', material: '', quantity: '' as any, unit: 'pieces', unitPrice: '' as any, date: new Date().toISOString().split('T')[0], notes: '' };

const statusColors: Record<string, string> = {
    pending: '#f59e0b', approved: '#1B2042', rejected: '#ef4444', delivered: '#22c55e',
};

const MaterialRequests = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [requests, setRequests] = useState<MaterialRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
    const [assignedSites, setAssignedSites] = useState<Site[]>([]);
    const [selectedProject, setSelectedProject] = useState('all');
    const [siteFilter, setSiteFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [rejectNotes, setRejectNotes] = useState('');
    const [editing, setEditing] = useState<MaterialRequest | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [statusFilter, setStatusFilter] = useState('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [stockBalance, setStockBalance] = useState<StockBalance[]>([]);
    const [materialSearch, setMaterialSearch] = useState('');
    const [showStockDropdown, setShowStockDropdown] = useState(false);

    const isSiteEngineer = user?.role === 'site_engineer';
    const isStorekeeper = user?.role === 'storekeeper';
    const canApprove = isStorekeeper || user?.role === 'managing_director';

    const load = async () => {
        setLoading(true);

        let assignedProjectNames: string[] = [];

        if (isSiteEngineer) {
            try {
                const res = await assignmentService.getMyTeam();
                const assignments = res.data || [];
                assignedProjectNames = [...new Set(assignments.map((a: any) => a.project?.name).filter(Boolean))];
            } catch (e) { console.error(e); }

            try {
                const siteRes = await sitesService.getMyAssigned();
                const sites = siteRes.data || [];
                setAssignedSites(sites);
                if (sites.length === 1) {
                    setForm(p => ({ ...p, site: sites[0].name, project: sites[0].project?.name || '' }));
                }
            } catch (e) { console.error(e); }
        }

        try {
            const res = await constructionService.getProjects();
            let allProjects = res.data || [];
            if (isSiteEngineer && assignedProjectNames.length > 0) {
                allProjects = allProjects.filter((p: any) => assignedProjectNames.includes(p.name));
                if (allProjects.length > 0) setSelectedProject(allProjects[0].name);
            }
            setProjects(allProjects);

            const res2 = await materialRequestsService.getAll();
            const data = res2.data || [];
            const filtered = isSiteEngineer ? data.filter((r: any) => assignedProjectNames.includes(r.project)) : data;
            setRequests(filtered);
        } catch (e) { console.error(e); }

        try {
            const balRes = await stockService.getBalance();
            setStockBalance(balRes.data || []);
        } catch (e) { console.error(e); }

        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const allSites = useMemo(() => {
        const siteMap = new Map<string, { name: string; projectName: string }>();
        if (assignedSites.length > 0) {
            for (const s of assignedSites) {
                siteMap.set(s.name, { name: s.name, projectName: s.project?.name || '' });
            }
        }
        for (const r of requests) {
            if (r.site && !siteMap.has(r.site)) {
                siteMap.set(r.site, { name: r.site, projectName: r.project });
            }
        }
        return Array.from(siteMap.values());
    }, [assignedSites, requests]);

    const filtered = useMemo(() =>
        requests.filter(r => {
            if (selectedProject !== 'all' && r.project !== selectedProject) return false;
            if (siteFilter !== 'all' && r.site !== siteFilter) return false;
            if (statusFilter !== 'all' && r.status !== statusFilter) return false;
            if (fromDate && r.date && new Date(r.date) < new Date(fromDate)) return false;
            if (toDate) { const end = new Date(toDate); end.setHours(23, 59, 59, 999); if (r.date && new Date(r.date) > end) return false; }
            return !search.trim() || r.project.toLowerCase().includes(search.toLowerCase()) || r.material.toLowerCase().includes(search.toLowerCase()) || (r.site || '').toLowerCase().includes(search.toLowerCase()) || (r.createdByName || '').toLowerCase().includes(search.toLowerCase());
        }),
        [requests, selectedProject, siteFilter, statusFilter, search, fromDate, toDate],
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

    const siteStats = useMemo(() => {
        const map = new Map<string, { site: string; project: string; total: number; pending: number; approved: number }>();
        for (const r of requests) {
            const siteName = r.site || 'Unassigned';
            const existing = map.get(siteName) || { site: siteName, project: r.project, total: 0, pending: 0, approved: 0 };
            existing.total++;
            if (r.status === 'pending') existing.pending++;
            if (r.status === 'approved') existing.approved++;
            map.set(siteName, existing);
        }
        return Array.from(map.values()).sort((a, b) => b.total - a.total);
    }, [requests]);

    const tableData = useMemo(() => filtered.map((r, i) => [
        String(i + 1),
        r.site || '—',
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
            head: [['#', 'Site', 'Project', 'Material', 'Qty', 'Cost', 'Date', 'Requested By', 'Status']],
            body: tableData,
            startY: 46,
            styles: { fontSize: 7, textColor: '#333' },
            headStyles: { fillColor: [139, 69, 19], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [250, 245, 240] },
            columnStyles: { 0: { cellWidth: 8, halign: 'center' } },
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
        const headers = ['#', 'Site', 'Project', 'Material', 'Qty', 'Cost', 'Date', 'Requested By', 'Status'];
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

    const openNew = () => { setEditing(null); setForm({ ...emptyForm, site: assignedSites.length === 1 ? assignedSites[0].name : '', project: assignedSites.length === 1 ? (assignedSites[0].project?.name || '') : '' }); setMaterialSearch(''); setShowModal(true); };
    const openEdit = (r: MaterialRequest) => { setEditing(r); setForm({ project: r.project, site: r.site || '', material: r.material, quantity: r.quantity, unit: r.unit, unitPrice: r.unitPrice, date: r.date, notes: r.notes || '' }); setMaterialSearch(r.material); setShowModal(true); };

    const filteredStock = useMemo(() => {
        if (!materialSearch.trim()) return stockBalance;
        const q = materialSearch.toLowerCase();
        return stockBalance.filter(s => s.item.toLowerCase().includes(q));
    }, [stockBalance, materialSearch]);

    const selectStockItem = (item: StockBalance) => {
        setForm(p => ({ ...p, material: item.item, unit: item.unit }));
        setMaterialSearch(item.item);
        setShowStockDropdown(false);
    };

    const handleSiteChange = (siteName: string) => {
        const site = assignedSites.find(s => s.name === siteName);
        setForm(p => ({
            ...p,
            site: siteName,
            project: site?.project?.name || p.project,
        }));
    };

    const save = async () => {
        if (!form.project || !form.material) { showToast('Please fill in project and material.', 'error'); return; }
        if (isSiteEngineer && !form.site) { showToast('Please select a site.', 'error'); return; }
        if (isSiteEngineer && !form.quantity) { showToast('Please enter a quantity.', 'error'); return; }
        const payload: Record<string, any> = {
            project: form.project,
            material: form.material,
            quantity: Number(form.quantity) || 0,
            unit: form.unit || 'pieces',
            unitPrice: Number(form.unitPrice) || 0,
            date: form.date || new Date().toISOString().split('T')[0],
            notes: form.notes || '',
        };
        if (form.site) payload.site = form.site;
        setSaving(true);
        try {
            if (editing) {
                await materialRequestsService.update(editing.id, payload as any);
                showToast('Request updated successfully', 'success');
            } else {
                await materialRequestsService.create(payload as any);
                showToast('Request created successfully', 'success');
            }
            setShowModal(false);
            setEditing(null);
            load();
        } catch (err: any) {
            console.error('Save error:', err);
            const msg = err?.response?.data?.message;
            const detail = Array.isArray(msg) ? msg.join('. ') : (typeof msg === 'string' ? msg : '');
            showToast(detail || 'Failed to save request. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
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
            showToast('Request approved - stock deducted', 'success');
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

    const [rejectModalPos, setRejectModalPos] = useState<{ x: number; y: number } | null>(null);
    const [dragging, setDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const onRejectHeaderMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setDragging(true);
        setDragOffset({ x: e.clientX, y: e.clientY });
        setRejectModalPos({ x: e.clientX - 200, y: e.clientY - 100 });
    }, []);

    useEffect(() => {
        if (!dragging) return;
        const onMove = (e: MouseEvent) => setRejectModalPos({ x: e.clientX - dragOffset.x + 200, y: e.clientY - dragOffset.y + 100 });
        const onUp = () => setDragging(false);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    }, [dragging, dragOffset]);

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: '40vh', color: 'var(--text-muted)', fontSize: '0.9rem' }}><FaSpinner className="spin" size={24} style={{ color: 'var(--primary)' }} /> Loading data...</div>;

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '0.5rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, flexShrink: 0, fontSize: '1rem' }}>
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
                </div>
            </div>

            {/* Site Breakdown - shows which sites have requests */}
            {siteStats.length > 1 && (
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                    {siteStats.map(s => (
                        <div key={s.site} onClick={() => setSiteFilter(siteFilter === s.site ? 'all' : s.site)}
                            style={{
                                padding: '0.3rem 0.6rem', borderRadius: 8, cursor: 'pointer',
                                background: siteFilter === s.site ? 'var(--primary)' : '#f3f4f6',
                                color: siteFilter === s.site ? '#fff' : '#333',
                                border: `1px solid ${siteFilter === s.site ? 'var(--primary)' : '#e5e7eb'}`,
                                fontSize: '0.72rem', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: 6,
                                transition: 'all 0.15s',
                            }}>
                            <FaBuilding size={10} />
                            <span>{s.site}</span>
                            <span style={{
                                background: siteFilter === s.site ? 'rgba(255,255,255,0.25)' : '#e5e7eb',
                                padding: '1px 6px', borderRadius: 10, fontSize: '0.65rem',
                            }}>{s.total}</span>
                            {s.pending > 0 && <span style={{ background: '#f59e0b', color: '#fff', padding: '1px 5px', borderRadius: 8, fontSize: '0.6rem' }}>{s.pending}p</span>}
                        </div>
                    ))}
                </div>
            )}

            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>All Material Requests</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {!isSiteEngineer && (
                            <>
                                <select value={selectedProject} onChange={e => { setPage(1); setSelectedProject(e.target.value); }}
                                    style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', minWidth: '140px' }}>
                                    <option value="all">All Projects</option>
                                    {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                </select>
                                {allSites.length > 0 && (
                                    <select value={siteFilter} onChange={e => { setPage(1); setSiteFilter(e.target.value); }}
                                        style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', minWidth: '130px' }}>
                                        <option value="all">All Sites</option>
                                        {allSites.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                    </select>
                                )}
                            </>
                        )}
                        <select value={statusFilter} onChange={e => { setPage(1); setStatusFilter(e.target.value); }}
                            style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)' }}>
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="delivered">Delivered</option>
                        </select>
                        <input type="text" className="form-input" placeholder="Search site, project, material..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', width: 250 }} />
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button className="admin-btn" onClick={() => setShowDateFilter(p => !p)} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.25rem 0.4rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FaCalendarAlt size={11} /> Date
                            </button>
                            {showDateFilter && (
                                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#fff', border: '1px solid var(--border-color)', borderRadius: 8, padding: '0.75rem', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 220 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1B2042' }}>Filter by Date</span>
                                        <button onClick={() => setShowDateFilter(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#999', fontSize: '1rem', lineHeight: 1 }}><FaTimesIcon /></button>
                                    </div>
                                    <input type="date" className="form-input" style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', width: '100%' }} title="From date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} />
                                    <input type="date" className="form-input" style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', width: '100%' }} title="To date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} />
                                </div>
                            )}
                        </div>
                        {user?.role !== 'admin' && (
                            <button className="admin-btn" onClick={openNew} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.15rem 0.4rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <FaPlus /> New Request
                            </button>
                        )}
                        <button className="admin-btn" onClick={downloadExcel} title="Download as Excel" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.15rem 0.4rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <FaFileExcel />
                        </button>
                        <button className="admin-btn" onClick={downloadPDF} title="Download as PDF" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.15rem 0.4rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <FaFilePdf />
                        </button>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Site</th><th>Project</th><th>Material</th><th>Qty</th><th>Cost</th><th>Date</th><th>Requested By</th><th>Status</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(item => {
                                const stockItem = stockBalance.find(s => s.item.toLowerCase() === item.material.toLowerCase());
                                const hasStock = stockItem && stockItem.balance >= item.quantity;
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            {item.site ? (
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                                    padding: '2px 8px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600,
                                                    background: '#f0f4ff', color: '#1e40af',
                                                }}>
                                                    <FaBuilding size={9} /> {item.site}
                                                </span>
                                            ) : <span style={{ color: '#bbb', fontSize: '0.78rem' }}>—</span>}
                                        </td>
                                        <td><strong>{item.project}</strong></td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            <div>{item.material}</div>
                                            {stockItem && (
                                                <div style={{ fontSize: '0.7rem', color: hasStock ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                                                    <FaWarehouse size={8} />
                                                    Stock: {stockItem.balance} {stockItem.unit}
                                                    {!hasStock && <FaExclamationTriangle size={8} title="Insufficient stock" />}
                                                </div>
                                            )}
                                        </td>
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
                                                {item.status === 'pending' && canApprove && (
                                                    <>
                                                        <button className="admin-btn admin-btn--secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', color: '#22c55e' }} onClick={() => handleApprove(item.id)} title="Approve - deducts from stock"><FaCheck /></button>
                                                        <button className="admin-btn admin-btn--secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', color: '#ef4444' }} onClick={() => { setRejectId(item.id); setRejectNotes(''); setShowRejectModal(true); }} title="Reject"><FaBan /></button>
                                                    </>
                                                )}
                                                {item.status === 'pending' && !canApprove && (
                                                    <span style={{ fontSize: '0.7rem', color: '#999' }}>Awaiting review</span>
                                                )}
                                                {user?.role !== 'admin' && (
                                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }} onClick={() => openEdit(item)} title="Edit"><FaEdit /></button>
                                                )}
                                                {user?.role === 'admin' && (
                                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', color: 'var(--primary-red)' }} onClick={() => remove(item.id)} title="Delete"><FaTrash /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {paginated.length === 0 && (
                                <tr><td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <FaTruck size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                                    <div>No material requests found.</div>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '0.4rem 0', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Showing {pageSize === 0 ? filtered.length : Math.min(pageSize, filtered.length - (page - 1) * pageSize)} of {filtered.length}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Per page:</span>
                            <select className="form-select" style={{ width: 'auto', padding: '0.2rem 1rem 0.2rem 0.4rem', fontSize: '0.7rem' }}
                                value={pageSize} onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}>
                                {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                <option value={0}>All</option>
                            </select>
                        </div>
                        {pageSize > 0 && totalPages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }} disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><FaChevronLeft /></button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button key={p} className={p === page ? 'admin-btn' : 'admin-btn admin-btn--secondary'} style={{ padding: '0.2rem 0.5rem', minWidth: 26, fontSize: '0.7rem' }} onClick={() => setPage(p)}>{p}</button>
                                ))}
                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }} disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><FaChevronRight /></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* NEW REQUEST MODAL */}
            {showModal && (
                <div className="admin-modal-overlay" onClick={() => { setShowModal(false); setEditing(null); setShowStockDropdown(false); }}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ width: 560 }}>
                        <div className="admin-modal-header">
                            <h3><FaTruck style={{ fontSize: '0.75rem', marginRight: 8, opacity: 0.5 }} />{editing ? 'Edit' : 'New'} Material Request</h3>
                            <button onClick={() => { setShowModal(false); setEditing(null); setShowStockDropdown(false); }}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            {isSiteEngineer && assignedSites.length > 0 && (
                                <div style={{
                                    background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
                                    padding: '0.6rem 0.8rem', marginBottom: '0.8rem',
                                }}>
                                    <div style={{ fontSize: '0.78rem', color: '#1e40af', fontWeight: 600, marginBottom: 4 }}>
                                        <FaBuilding size={10} style={{ marginRight: 4 }} />Your Assigned Site{assignedSites.length > 1 ? 's' : ''}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                        {assignedSites.map(s => (
                                            <span key={s.id} style={{
                                                padding: '2px 8px', borderRadius: 6, fontSize: '0.72rem',
                                                background: form.site === s.name ? '#1e40af' : '#dbeafe',
                                                color: form.site === s.name ? '#fff' : '#1e40af',
                                                fontWeight: 600, cursor: 'pointer',
                                            }} onClick={() => handleSiteChange(s.name)}>
                                                {s.name} ({s.project?.name || 'No project'})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {isSiteEngineer && assignedSites.length > 1 && (
                                    <div className="form-group">
                                        <label className="form-label">Site <span style={{ color: '#ef4444' }}>*</span></label>
                                        <select value={form.site} onChange={e => handleSiteChange(e.target.value)} className="form-select">
                                            <option value="">Select site</option>
                                            {assignedSites.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label className="form-label">Project</label>
                                    <select value={form.project} onChange={e => setForm(p => ({ ...p, project: e.target.value }))} className="form-select"
                                        disabled={isSiteEngineer && assignedSites.length === 1}>
                                        <option value="">Select project</option>
                                        {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group" style={{ position: 'relative' }}>
                                    <label className="form-label">
                                        Material {isSiteEngineer && <span style={{ color: '#999', fontWeight: 400, fontSize: '0.7rem' }}>(from stock)</span>}
                                    </label>
                                    <input
                                        value={materialSearch}
                                        onChange={e => {
                                            setMaterialSearch(e.target.value);
                                            setForm(p => ({ ...p, material: e.target.value }));
                                            setShowStockDropdown(true);
                                        }}
                                        onFocus={() => setShowStockDropdown(true)}
                                        className="form-input"
                                        placeholder={isSiteEngineer ? "Search available materials..." : "e.g. Cement"}
                                    />
                                    {showStockDropdown && filteredStock.length > 0 && (
                                        <div style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                                            background: '#fff', border: '1px solid var(--border-color)', borderRadius: 8,
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxHeight: 200, overflowY: 'auto',
                                        }}>
                                            {filteredStock.slice(0, 10).map(s => (
                                                <div
                                                    key={s.item}
                                                    onClick={() => selectStockItem(s)}
                                                    style={{
                                                        padding: '0.5rem 0.75rem', cursor: 'pointer',
                                                        borderBottom: '1px solid #f3f4f6',
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                                                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                                                >
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{s.item}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#999' }}>{s.category} · {s.unit}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#22c55e' }}>{s.balance}</div>
                                                        <div style={{ fontSize: '0.65rem', color: '#999' }}>available</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Quantity</label>
                                    <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value === '' ? '' : parseInt(e.target.value) || '' }))} className="form-input" placeholder="e.g. 100" />
                                    {isSiteEngineer && form.material && (() => {
                                        const stockItem = stockBalance.find(s => s.item.toLowerCase() === form.material.toLowerCase());
                                        if (stockItem) {
                                            const requested = parseInt(form.quantity) || 0;
                                            const sufficient = requested <= stockItem.balance;
                                            return (
                                                <div style={{ fontSize: '0.7rem', color: sufficient ? '#22c55e' : '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                                                    {sufficient ? <FaCheck size={8} /> : <FaExclamationTriangle size={8} />}
                                                    Available: {stockItem.balance} {stockItem.unit}
                                                    {requested > 0 && !sufficient && ` (need ${requested - stockItem.balance} more)`}
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
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
                                        <option value="kg">Kg</option>
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
                            <button className="admin-btn admin-btn--secondary" onClick={() => { setShowModal(false); setEditing(null); setShowStockDropdown(false); }}>Cancel</button>
                            <button className="admin-btn" onClick={save} disabled={saving || !form.project || !form.material}>
                                {saving ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showRejectModal && rejectId && (
                <div className="admin-modal-overlay" onClick={() => setShowRejectModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={rejectModalPos ? { position: 'fixed', left: rejectModalPos.x, top: rejectModalPos.y, width: 400 } : { width: 400 }}>
                        <div className="admin-modal-header" onMouseDown={onRejectHeaderMouseDown}>
                            <h3><FaBan style={{ color: '#ef4444', marginRight: 6 }} />Reject Request</h3>
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
