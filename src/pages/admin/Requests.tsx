import { useState, useMemo, useEffect, useCallback } from 'react';
import {
    FaClipboardList, FaCheck, FaTimesCircle, FaClock,
    FaTruck, FaDollarSign, FaEye, FaChevronLeft,
    FaChevronRight, FaSpinner, FaSearch, FaFilter,
    FaThumbsUp, FaThumbsDown, FaMoneyBillWave,
    FaBuilding, FaUser, FaCheckCircle, FaCheckDouble, FaPlus, FaBan, FaEdit, FaTrash, FaFileExcel, FaFilePdf, FaCalendarAlt, FaWarehouse, FaExclamationTriangle, FaTimes as FaTimesIcon
} from 'react-icons/fa';
import { materialRequestsService } from '../../services/materialRequestsService';
import { approvalsService } from '../../services/approvalsService';
import { constructionService } from '../../services/constructionService';
import { stockService } from '../../services/stockService';
import type { MaterialRequest } from '../../services/materialRequestsService';
import type { Approval } from '../../services/approvalsService';
import type { StockBalance } from '../../services/stockService';
import type { Site } from '../../services/sitesService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { loadPageCache, savePageCache } from '../../utils/pageCache';
import { assignmentService } from '../../services/assignmentService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const StatTile = ({ icon, label, value, accent, emphasis }: { icon: React.ReactNode; label: string; value: string; accent: string; emphasis?: boolean }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0,
        background: emphasis ? `${accent}12` : 'var(--bg-white)',
        border: `1px solid ${emphasis ? `${accent}40` : 'var(--border-color)'}`,
        borderRadius: 10, padding: '0.8rem 1rem',
    }}>
        <div style={{
            width: 36, height: 36, borderRadius: 9, background: `${accent}18`, color: accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.95rem',
        }}>{icon}</div>
        <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
            <div style={{ fontSize: emphasis ? '1.1rem' : '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{value}</div>
        </div>
    </div>
);

type UnifiedStatus = 'pending' | 'approved' | 'rejected';
const PAGE_SIZES = [5, 10, 15, 20];

interface UnifiedRequest {
    id: string; source: 'material' | 'general'; title: string; requester: string;
    reviewer: string; type: 'material' | 'money'; details: string; detailsRaw: string | number;
    date: string; status: UnifiedStatus; reviewedAt?: string; raw: MaterialRequest | Approval; site?: string;
}

const safeBadge = (status: string) => {
    const map: Record<string, { color: string; bg: string }> = {
        pending: { color: '#f59e0b', bg: '#f59e0b18' }, approved: { color: '#22c55e', bg: '#22c55e18' }, rejected: { color: '#ef4444', bg: '#ef444418' },
    };
    return map[status] || { color: '#6b7280', bg: '#6b728018' };
};

const emptyMatForm = { project: '', site: '', material: '', quantity: '' as any, unit: 'pieces', unitPrice: '' as any, date: new Date().toISOString().split('T')[0], notes: '' };

const statusColors: Record<string, string> = { pending: '#f59e0b', approved: '#1B2042', rejected: '#ef4444', delivered: '#22c55e' };

const Requests = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const role = user?.role || '';
    const isSiteEngineer = role === 'site_engineer';
    const isStorekeeper = role === 'storekeeper';
    const canReviewMaterialRequest = role === 'managing_director' || isStorekeeper;

    const [activeTab, setActiveTab] = useState<'review' | 'material'>('review');

    // Review tab state
    const [requests, setRequests] = useState<UnifiedRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<UnifiedStatus | 'all'>('pending');
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'material'>('all');
    const [viewItem, setViewItem] = useState<UnifiedRequest | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // My Requests tab state
    const [matRequests, setMatRequests] = useState<MaterialRequest[]>([]);
    const [loadingMat, setLoadingMat] = useState(false);
    const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
    const [assignedSites, setAssignedSites] = useState<Site[]>([]);
    const [selectedProject, setSelectedProject] = useState('all');
    const [siteFilter, setSiteFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [matSearch, setMatSearch] = useState('');
    const [matPage, setMatPage] = useState(1);
    const [matPageSize, setMatPageSize] = useState(10);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [stockBalance, setStockBalance] = useState<StockBalance[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [rejectNotes, setRejectNotes] = useState('');
    const [editing, setEditing] = useState<MaterialRequest | null>(null);
    const [matForm, setMatForm] = useState(emptyMatForm);
    const [savingMat, setSavingMat] = useState(false);
    const [materialSearch, setMaterialSearch] = useState('');
    const [showStockDropdown, setShowStockDropdown] = useState(false);

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

    // --- Review tab ---

    const toUnified = (r: MaterialRequest): UnifiedRequest => ({
        id: r.id, source: 'material',
        title: `${r.material} — ${r.project}`,
        requester: r.createdByName || 'Unknown',
        reviewer: r.approvedByName || '—',
        type: 'material',
        details: r.totalCost > 0 ? `RWF ${Number(r.totalCost).toLocaleString()}` : `${r.quantity} ${r.unit}`,
        detailsRaw: r.totalCost > 0 ? r.totalCost : r.quantity,
        date: r.date || r.createdAt?.split('T')[0] || '',
        status: r.status === 'delivered' ? 'approved' : r.status as UnifiedStatus,
        reviewedAt: r.approvedAt ? new Date(r.approvedAt).toISOString().split('T')[0] : undefined,
        raw: r, site: (r as any).site || undefined,
    });

    const toUnifiedFromApproval = (r: Approval): UnifiedRequest => ({
        id: r.id, source: 'general',
        title: r.title,
        requester: r.requester.split('(')[0].trim(),
        reviewer: r.reviewedByName || '—',
        type: r.type,
        details: r.type === 'material'
            ? `${r.items?.reduce((s, i) => s + i.qty, 0) || 0} items`
            : `RWF ${(r.amount || 0).toLocaleString()}`,
        detailsRaw: r.type === 'material' ? (r.items?.reduce((s, i) => s + i.qty, 0) || 0) : (r.amount || 0),
        date: r.requestedAt, status: r.status as UnifiedStatus,
        reviewedAt: r.reviewedAt, raw: r,
    });

    const loadReview = async () => {
        const cached = loadPageCache<{ requests: UnifiedRequest[] }>('pg_requests');
        if (cached) setRequests(cached.requests);
        try {
            const [matRes, appRes] = await Promise.all([
                materialRequestsService.getAll().catch(() => ({ data: [] })),
                approvalsService.getAll().catch(() => ({ data: [] })),
            ]);
            const material = (matRes.data || []).map(toUnified);
            const general = (appRes.data || []).map(toUnifiedFromApproval);
            const allRequests = [...material, ...general];
            setRequests(allRequests);
            savePageCache('pg_requests', { requests: allRequests });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { if (activeTab === 'review') loadReview(); }, [activeTab]);

    const reviewStats = useMemo(() => ({
        total: requests.length, pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
    }), [requests]);

    const filteredReview = useMemo(() => {
        let arr = requests;
        if (filter !== 'all') arr = arr.filter(r => r.status === filter);
        if (typeFilter !== 'all') arr = arr.filter(r => r.type === typeFilter);
        if (search) {
            const q = search.toLowerCase();
            arr = arr.filter(r => r.title.toLowerCase().includes(q) || r.requester.toLowerCase().includes(q) || r.reviewer.toLowerCase().includes(q) || r.details.toLowerCase().includes(q));
        }
        return arr.sort((a, b) => new Date(b.reviewedAt || b.date).getTime() - new Date(a.reviewedAt || a.date).getTime());
    }, [requests, filter, search, typeFilter]);

    const reviewTotalPages = pageSize ? Math.ceil(filteredReview.length / pageSize) : 1;
    const paginatedReview = pageSize ? filteredReview.slice((page - 1) * pageSize, page * pageSize) : filteredReview;

    useEffect(() => { if (page > reviewTotalPages) setPage(reviewTotalPages || 1); }, [reviewTotalPages, page]);

    const handleApprove = async (req: UnifiedRequest) => {
        setActionLoading(req.id);
        try {
            if (req.source === 'material') await materialRequestsService.approve(req.id);
            else await approvalsService.update(req.id, { status: 'approved', reviewedAt: new Date().toISOString().split('T')[0] });
            await loadReview();
            showToast('Request approved', 'success');
        } catch { showToast('Failed to approve', 'error'); }
        setActionLoading(null);
    };

    const handleReject = async (req: UnifiedRequest) => {
        setActionLoading(req.id);
        try {
            if (req.source === 'material') await materialRequestsService.reject(req.id);
            else await approvalsService.update(req.id, { status: 'rejected', reviewedAt: new Date().toISOString().split('T')[0] });
            await loadReview();
            showToast('Request rejected', 'success');
        } catch { showToast('Failed to reject', 'error'); }
        setActionLoading(null);
    };

    // --- My Requests tab ---

    const loadMatRequests = async () => {
        setLoadingMat(true);
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
                if (sites.length === 1) setMatForm(p => ({ ...p, site: sites[0].name, project: sites[0].project?.name || '' }));
            } catch (e) { console.error(e); }
        }
        try {
            const res = await constructionService.getProjects();
            let allProjects = res.data || [];
            if (isSiteEngineer && assignedProjectNames.length > 0) allProjects = allProjects.filter((p: any) => assignedProjectNames.includes(p.name));
            setProjects(allProjects);
            const res2 = await materialRequestsService.getAll();
            const data = res2.data || [];
            const filtered = isSiteEngineer ? data.filter((r: any) => assignedProjectNames.includes(r.project)) : data;
            setMatRequests(filtered);
        } catch (e) { console.error(e); }
        try { const balRes = await stockService.getBalance(); setStockBalance(balRes.data || []); } catch (e) { console.error(e); }
        setLoadingMat(false);
    };

    useEffect(() => { if (activeTab === 'material') loadMatRequests(); }, [activeTab]);

    const allSites = useMemo(() => {
        const siteMap = new Map<string, { name: string; projectName: string }>();
        if (assignedSites.length > 0) for (const s of assignedSites) siteMap.set(s.name, { name: s.name, projectName: s.project?.name || '' });
        for (const r of matRequests) if (r.site && !siteMap.has(r.site)) siteMap.set(r.site, { name: r.site, projectName: r.project });
        return Array.from(siteMap.values());
    }, [assignedSites, matRequests]);

    const filteredMatRequests = useMemo(() =>
        matRequests.filter(r => {
            if (selectedProject !== 'all' && r.project !== selectedProject) return false;
            if (siteFilter !== 'all' && r.site !== siteFilter) return false;
            if (statusFilter !== 'all' && r.status !== statusFilter) return false;
            if (fromDate && r.date && new Date(r.date) < new Date(fromDate)) return false;
            if (toDate) { const end = new Date(toDate); end.setHours(23, 59, 59, 999); if (r.date && new Date(r.date) > end) return false; }
            return !matSearch.trim() || r.project.toLowerCase().includes(matSearch.toLowerCase()) || r.material.toLowerCase().includes(matSearch.toLowerCase()) || (r.site || '').toLowerCase().includes(matSearch.toLowerCase()) || (r.createdByName || '').toLowerCase().includes(matSearch.toLowerCase());
        }), [matRequests, selectedProject, siteFilter, statusFilter, matSearch, fromDate, toDate]);

    const matTotalPages = matPageSize === 0 ? 1 : Math.ceil(filteredMatRequests.length / matPageSize);
    const paginatedMat = useMemo(() => {
        if (matPageSize === 0) return filteredMatRequests;
        return filteredMatRequests.slice((matPage - 1) * matPageSize, matPage * matPageSize);
    }, [filteredMatRequests, matPage, matPageSize]);

    useEffect(() => { if (matPage > matTotalPages) setMatPage(matTotalPages || 1); }, [matTotalPages, matPage]);

    const matStats = useMemo(() => ({
        total: matRequests.length, pending: matRequests.filter(r => r.status === 'pending').length,
        approved: matRequests.filter(r => r.status === 'approved').length,
        rejected: matRequests.filter(r => r.status === 'rejected').length,
        delivered: matRequests.filter(r => r.status === 'delivered').length,
    }), [matRequests]);

    const siteStats = useMemo(() => {
        const map = new Map<string, { site: string; project: string; total: number; pending: number; approved: number }>();
        for (const r of matRequests) {
            const siteName = r.site || 'Unassigned';
            const existing = map.get(siteName) || { site: siteName, project: r.project, total: 0, pending: 0, approved: 0 };
            existing.total++; if (r.status === 'pending') existing.pending++; if (r.status === 'approved') existing.approved++;
            map.set(siteName, existing);
        }
        return Array.from(map.values()).sort((a, b) => b.total - a.total);
    }, [matRequests]);

    const tableData = useMemo(() => filteredMatRequests.map((r, i) => [
        String(i + 1), r.site || '—', r.project, r.material, `${r.quantity} ${r.unit}`,
        r.totalCost > 0 ? `RWF ${Number(r.totalCost).toLocaleString()}` : '—',
        r.date || '—', r.createdByName || '—', r.status.replace('_', ' '),
    ]), [filteredMatRequests]);

    const downloadPDF = () => {
        const doc = new jsPDF();
        const brown = '#1B2042'; const pageW = doc.internal.pageSize.getWidth(); const pageH = doc.internal.pageSize.getHeight();
        doc.setFontSize(22); doc.setTextColor(brown); doc.setFont('helvetica', 'bold'); doc.text('MUHIZI CONSTRUCTION', pageW / 2, 22, { align: 'center' });
        doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text('Building Your Vision, Delivering Excellence', pageW / 2, 30, { align: 'center' });
        doc.setDrawColor(brown); doc.setLineWidth(0.8); doc.line(14, 34, pageW - 14, 34);
        doc.setFontSize(13); doc.setTextColor(brown); doc.setFont('helvetica', 'bold');
        doc.text('Material Requests Report', 14, 40); doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor('#666');
        const today = new Date().toLocaleDateString();
        doc.text(`Generated: ${today}${fromDate && toDate ? ` | Period: ${fromDate} to ${toDate}` : ''}`, pageW - 14, 40, { align: 'right' });
        autoTable(doc, {
            head: [['#', 'Site', 'Project', 'Material', 'Qty', 'Cost', 'Date', 'Requested By', 'Status']], body: tableData,
            startY: 46, styles: { fontSize: 7, textColor: '#333' },
            headStyles: { fillColor: [139, 69, 19], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [250, 245, 240] }, columnStyles: { 0: { cellWidth: 8, halign: 'center' } },
            didDrawPage: () => { doc.setDrawColor(brown); doc.setLineWidth(0.5); doc.line(14, pageH - 20, pageW - 14, pageH - 20); doc.setFontSize(8); doc.setTextColor(brown); doc.setFont('helvetica', 'normal'); doc.text('Email: info@muhiziconstruction.com  |  Phone: +250 788 000 000  |  Location: Kigali, Rwanda', pageW / 2, pageH - 14, { align: 'center' }); },
        });
        doc.save('material-requests.pdf');
    };

    const downloadExcel = () => {
        const brown = '#1B2042'; const today = new Date().toLocaleDateString(); const period = fromDate && toDate ? `Period: ${fromDate} to ${toDate}` : '';
        const headers = ['#', 'Site', 'Project', 'Material', 'Qty', 'Cost', 'Date', 'Requested By', 'Status'];
        const rows = tableData.map(r => `<tr>${r.map(c => `<td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${c}</td>`).join('')}</tr>`).join('');
        const html = `<html><head><meta charset="UTF-8"></head><body><div style="text-align:center;color:${brown};font-size:20px;font-weight:bold;font-family:Arial">MUHIZI CONSTRUCTION</div><div style="text-align:center;color:${brown};font-size:11px;font-family:Arial;margin-bottom:4px">Building Your Vision, Delivering Excellence</div><hr style="border:1px solid ${brown}" /><div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;color:${brown};font-family:Arial;margin:6px 0"><span>Material Requests Report</span><span>${today}${period ? ' | ' + period : ''}</span></div><table style="border-collapse:collapse;width:100%;font-family:Arial"><tr style="background:${brown};color:#fff">${headers.map(h => `<th style="padding:6px 8px;border:1px solid ${brown};font-size:11px">${h}</th>`).join('')}</tr>${rows}</table><hr style="border:0.5px solid ${brown};margin-top:12px" /><div style="text-align:center;color:${brown};font-size:10px;font-family:Arial">Email: info@muhiziconstruction.com | Phone: +250 788 000 000 | Location: Kigali, Rwanda</div></body></html>`;
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'material-requests.xls'; a.click(); URL.revokeObjectURL(url);
    };

    const openNewMat = () => { setEditing(null); setMatForm({ ...emptyMatForm, site: assignedSites.length === 1 ? assignedSites[0].name : '', project: assignedSites.length === 1 ? (assignedSites[0].project?.name || '') : '' }); setMaterialSearch(''); setShowModal(true); };
    const openEditMat = (r: MaterialRequest) => { setEditing(r); setMatForm({ project: r.project, site: r.site || '', material: r.material, quantity: r.quantity, unit: r.unit, unitPrice: r.unitPrice, date: r.date, notes: r.notes || '' }); setMaterialSearch(r.material); setShowModal(true); };

    const filteredStock = useMemo(() => {
        if (!materialSearch.trim()) return stockBalance;
        return stockBalance.filter(s => s.item.toLowerCase().includes(materialSearch.toLowerCase()));
    }, [stockBalance, materialSearch]);

    const selectStockItem = (item: StockBalance) => { setMatForm(p => ({ ...p, material: item.item, unit: item.unit })); setMaterialSearch(item.item); setShowStockDropdown(false); };

    const handleSiteChange = (siteName: string) => { const site = assignedSites.find(s => s.name === siteName); setMatForm(p => ({ ...p, site: siteName, project: site?.project?.name || p.project })); };

    const saveMat = async () => {
        if (!matForm.project || !matForm.material) { showToast('Please fill in project and material.', 'error'); return; }
        const payload: Record<string, any> = { project: matForm.project, material: matForm.material, quantity: Number(matForm.quantity) || 0, unit: matForm.unit || 'pieces', unitPrice: Number(matForm.unitPrice) || 0, date: matForm.date || new Date().toISOString().split('T')[0], notes: matForm.notes || '' };
        if (matForm.site) payload.site = matForm.site;
        setSavingMat(true);
        try {
            if (editing) { await materialRequestsService.update(editing.id, payload as any); showToast('Request updated successfully', 'success'); }
            else { await materialRequestsService.create(payload as any); showToast('Request created successfully', 'success'); }
            setShowModal(false); setEditing(null); loadMatRequests();
        } catch (err: any) { showToast(err?.response?.data?.message || 'Failed to save request.', 'error'); }
        finally { setSavingMat(false); }
    };

    const removeMat = (id: string) => {
        if (!window.confirm('Delete this request?')) return;
        materialRequestsService.delete(id).then(() => { showToast('Request deleted', 'success'); loadMatRequests(); }).catch(() => showToast('Failed to delete', 'error'));
    };

    const handleApproveMat = async (id: string) => {
        try { await materialRequestsService.approve(id); showToast('Request approved - stock deducted', 'success'); loadMatRequests(); } catch { showToast('Failed to approve', 'error'); }
    };

    const handleRejectMat = async () => {
        if (!rejectId) return;
        try { await materialRequestsService.reject(rejectId, rejectNotes); showToast('Request rejected', 'success'); setShowRejectModal(false); setRejectId(null); setRejectNotes(''); loadMatRequests(); } catch { showToast('Failed to reject', 'error'); }
    };

    const tabStyle = (tab: typeof activeTab) => ({
        padding: '0.35rem 1rem', borderRadius: '8px', border: 'none',
        cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem',
        background: activeTab === tab ? '#1B2042' : 'transparent',
        color: activeTab === tab ? '#fff' : 'var(--text-muted)',
        transition: 'all 0.15s',
    });

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0, fontSize: '1rem' }}>
                        <FaClipboardList style={{ color: 'var(--primary)' }} /> Requisitions
                    </h2>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button style={tabStyle('review')} onClick={() => setActiveTab('review')}>
                    <FaClipboardList size={11} style={{ marginRight: 6 }} />Review
                </button>
                <button style={tabStyle('material')} onClick={() => setActiveTab('material')}>
                    <FaTruck size={11} style={{ marginRight: 6 }} />Material
                </button>
            </div>

            {/* ===== REVIEW TAB ===== */}
            {activeTab === 'review' && (
                <>
                    {loading && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: '30vh', color: 'var(--text-muted)', fontSize: '0.9rem' }}><FaSpinner className="spin" size={24} style={{ color: 'var(--primary)' }} /> Loading data...</div>}
                    {!loading && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.6rem', marginBottom: '1rem' }}>
                                <StatTile icon={<FaClipboardList />} label="Total" value={String(reviewStats.total)} accent="#1B2042" emphasis />
                                <StatTile icon={<FaClock />} label="Pending" value={String(reviewStats.pending)} accent="#f59e0b" />
                                <StatTile icon={<FaCheckCircle />} label="Approved" value={String(reviewStats.approved)} accent="#22c55e" />
                                <StatTile icon={<FaTimesCircle />} label="Rejected" value={String(reviewStats.rejected)} accent="#ef4444" />
                                <StatTile icon={<FaTruck />} label="Material" value={String(requests.filter(r => r.source === 'material').length)} accent="#3b82f6" />
                                <StatTile icon={<FaMoneyBillWave />} label="Fund" value={String(requests.filter(r => r.source === 'general').length)} accent="#06b6d4" />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
                                    <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
                                        <FaSearch size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                                        <input type="text" className="form-input" placeholder="Search title, requester..." value={search}
                                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                                            style={{ padding: '0.25rem 0.4rem 0.25rem 28px', fontSize: '0.75rem', width: '100%' }} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f5f5f5', borderRadius: 8, padding: 2 }}>
                                        {([
                                            { key: 'all' as const, label: 'All', icon: null },
                                            { key: 'material' as const, label: 'Material', icon: <FaTruck size={10} /> },
                                        ]).map(t => (
                                            <button key={t.key} onClick={() => { setTypeFilter(t.key); setPage(1); }}
                                                style={{ padding: '0.15rem 0.4rem', borderRadius: 6, border: 'none', background: typeFilter === t.key ? 'var(--primary)' : 'transparent', color: typeFilter === t.key ? '#fff' : '#555', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                {t.icon}{t.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: 3 }}>
                                        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                                            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                                                style={{ padding: '0.15rem 0.5rem', borderRadius: '14px', border: '1px solid', borderColor: filter === f ? 'transparent' : '#ddd', background: filter === f ? 'var(--primary)' : 'transparent', color: filter === f ? '#fff' : '#555', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize' }}>
                                                {f} ({f === 'all' ? requests.length : requests.filter(r => r.status === f).length})
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="admin-card">
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: 28 }}><FaFilter size={10} /></th>
                                                <th>Request</th><th>Site</th><th>Requester</th><th>Reviewer</th><th>Details</th><th>Date</th><th>Status</th>
                                                <th style={{ width: 180 }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedReview.map(req => {
                                                const badge = safeBadge(req.status);
                                                const canAct = canReviewMaterialRequest && req.type === 'material';
                                                return (
                                                    <tr key={req.id} style={{ opacity: req.status !== 'pending' ? 0.7 : 1 }}>
                                                        <td><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 6, background: req.type === 'material' ? '#1B204218' : '#22c55e18', color: req.type === 'material' ? 'var(--primary)' : '#22c55e', fontSize: '0.65rem' }}>{req.type === 'material' ? <FaTruck /> : <FaDollarSign />}</span></td>
                                                        <td><div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{req.title}</div><div style={{ fontSize: '0.7rem', color: '#999', marginTop: 2 }}>{req.source === 'material' ? 'Material Request' : 'Fund Request'}</div></td>
                                                        <td style={{ fontSize: '0.82rem' }}>{req.site ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, background: '#f0f4ff', color: '#1e40af' }}><FaBuilding size={9} /> {req.site}</span> : <span style={{ color: '#bbb' }}>—</span>}</td>
                                                        <td style={{ fontSize: '0.82rem' }}><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FaUser size={10} style={{ color: '#bbb' }} /> {req.requester}</span></td>
                                                        <td style={{ fontSize: '0.82rem' }}>{req.reviewer !== '—' ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FaCheckDouble size={10} style={{ color: '#22c55e' }} /> {req.reviewer}</span> : <span style={{ color: '#bbb' }}>—</span>}</td>
                                                        <td style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>{req.details}</td>
                                                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', color: '#999' }}>{req.reviewedAt || req.date}</td>
                                                        <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.65rem', borderRadius: 10, background: badge.bg, color: badge.color }}>{req.status === 'pending' ? <FaClock size={10} /> : req.status === 'approved' ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />}{req.status === 'pending' ? 'Pending' : req.status === 'approved' ? 'Approved' : 'Rejected'}</span></td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                                                <button onClick={() => setViewItem(req)} title="View details" style={{ padding: '0.15rem 0.4rem', borderRadius: 5, border: '1px solid #ddd', background: 'transparent', cursor: 'pointer', color: '#666', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}><FaEye size={10} /> View</button>
                                                                {req.status === 'pending' && canAct && (
                                                                    <>
                                                                        <button onClick={() => handleApprove(req)} disabled={actionLoading === req.id} title="Approve" style={{ padding: '0.15rem 0.4rem', borderRadius: 5, border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, opacity: actionLoading === req.id ? 0.7 : 1 }}>{actionLoading === req.id ? <FaSpinner className="spin" size={10} /> : <FaThumbsUp size={10} />} Approve</button>
                                                                        <button onClick={() => handleReject(req)} disabled={actionLoading === req.id} title="Reject" style={{ padding: '0.15rem 0.4rem', borderRadius: 5, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, opacity: actionLoading === req.id ? 0.7 : 1 }}><FaThumbsDown size={10} /> Reject</button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {!paginatedReview.length && (
                                                <tr><td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#999' }}><FaClipboardList size={36} style={{ opacity: 0.25, marginBottom: 10 }} /><div style={{ fontSize: '0.95rem' }}>No {filter !== 'all' ? filter : ''} requests found</div><span style={{ fontSize: '0.8rem' }}>Material requests will appear here</span></td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '0.3rem 0', flexWrap: 'wrap', gap: 6 }}>
                                    <span style={{ fontSize: '0.7rem', color: '#999' }}>Showing {paginatedReview.length} of {filteredReview.length} request{filteredReview.length !== 1 ? 's' : ''}{typeFilter !== 'all' ? ` (${typeFilter})` : ''}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <span style={{ fontSize: '0.7rem', color: '#999' }}>Per page:</span>
                                            <select className="form-select" style={{ width: 'auto', padding: '0.2rem 1.2rem 0.2rem 0.3rem', fontSize: '0.7rem' }}
                                                value={pageSize} onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}>
                                                {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                                <option value={0}>All</option>
                                            </select>
                                        </div>
                                        {pageSize > 0 && reviewTotalPages > 1 && (
                                            <div style={{ display: 'flex', gap: 2 }}>
                                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><FaChevronLeft size={9} /></button>
                                                {Array.from({ length: reviewTotalPages }, (_, i) => i + 1).map(p => (
                                                    <button key={p} className={p === page ? 'admin-btn' : 'admin-btn admin-btn--secondary'} style={{ padding: '0.2rem 0.45rem', minWidth: 24, fontSize: '0.68rem' }} onClick={() => setPage(p)}>{p}</button>
                                                ))}
                                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} disabled={page >= reviewTotalPages} onClick={() => setPage(p => Math.min(reviewTotalPages, p + 1))}><FaChevronRight size={9} /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ===== MY REQUESTS TAB ===== */}
            {activeTab === 'material' && (
                <>
                    {loadingMat && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: '30vh', color: 'var(--text-muted)', fontSize: '0.9rem' }}><FaSpinner className="spin" size={24} style={{ color: 'var(--primary)' }} /> Loading data...</div>}
                    {!loadingMat && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.6rem', marginBottom: '1rem' }}>
                                <StatTile icon={<FaTruck />} label="Total" value={String(matStats.total)} accent="#1B2042" emphasis />
                                <StatTile icon={<FaClock />} label="Pending" value={String(matStats.pending)} accent="#f59e0b" />
                                <StatTile icon={<FaCheckCircle />} label="Approved" value={String(matStats.approved)} accent="#1B2042" />
                                <StatTile icon={<FaTimesCircle />} label="Rejected" value={String(matStats.rejected)} accent="#ef4444" />
                                <StatTile icon={<FaCheckDouble />} label="Delivered" value={String(matStats.delivered)} accent="#22c55e" />
                            </div>
                            {siteStats.length > 1 && (
                                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                                    {siteStats.map(s => (
                                        <div key={s.site} onClick={() => setSiteFilter(siteFilter === s.site ? 'all' : s.site)}
                                            style={{ padding: '0.3rem 0.6rem', borderRadius: 8, cursor: 'pointer', background: siteFilter === s.site ? 'var(--primary)' : '#f3f4f6', color: siteFilter === s.site ? '#fff' : '#333', border: `1px solid ${siteFilter === s.site ? 'var(--primary)' : '#e5e7eb'}`, fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <FaBuilding size={10} />
                                            <span>{s.site}</span>
                                            <span style={{ background: siteFilter === s.site ? 'rgba(255,255,255,0.25)' : '#e5e7eb', padding: '1px 6px', borderRadius: 10, fontSize: '0.65rem' }}>{s.total}</span>
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
                                                <select value={selectedProject} onChange={e => { setMatPage(1); setSelectedProject(e.target.value); }}
                                                    style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', minWidth: '140px' }}>
                                                    <option value="all">All Projects</option>
                                                    {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                                </select>
                                                {allSites.length > 0 && (
                                                    <select value={siteFilter} onChange={e => { setMatPage(1); setSiteFilter(e.target.value); }}
                                                        style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', minWidth: '130px' }}>
                                                        <option value="all">All Sites</option>
                                                        {allSites.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                                    </select>
                                                )}
                                            </>
                                        )}
                                        <select value={statusFilter} onChange={e => { setMatPage(1); setStatusFilter(e.target.value); }}
                                            style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)' }}>
                                            <option value="all">All Status</option>
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                            <option value="delivered">Delivered</option>
                                        </select>
                                        <input type="text" className="form-input" placeholder="Search..." value={matSearch} onChange={e => { setMatSearch(e.target.value); setMatPage(1); }} style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', width: 180 }} />
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <button className="admin-btn" onClick={() => setShowDateFilter(p => !p)} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.25rem 0.4rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}><FaCalendarAlt size={11} /> Date</button>
                                            {showDateFilter && (
                                                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#fff', border: '1px solid var(--border-color)', borderRadius: 8, padding: '0.75rem', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 220 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1B2042' }}>Filter by Date</span><button onClick={() => setShowDateFilter(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#999', fontSize: '1rem', lineHeight: 1 }}><FaTimesIcon /></button></div>
                                                    <input type="date" className="form-input" style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', width: '100%' }} title="From date" value={fromDate} onChange={e => { setFromDate(e.target.value); setMatPage(1); }} />
                                                    <input type="date" className="form-input" style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', width: '100%' }} title="To date" value={toDate} onChange={e => { setToDate(e.target.value); setMatPage(1); }} />
                                                </div>
                                            )}
                                        </div>
                                        {user?.role !== 'admin' && (
                                            <button className="admin-btn" onClick={openNewMat} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.15rem 0.4rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 6 }}><FaPlus /> New</button>
                                        )}
                                        <button className="admin-btn" onClick={downloadExcel} title="Download as Excel" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.15rem 0.4rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 3 }}><FaFileExcel /></button>
                                        <button className="admin-btn" onClick={downloadPDF} title="Download as PDF" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.15rem 0.4rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 3 }}><FaFilePdf /></button>
                                    </div>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="admin-table">
                                        <thead>
                                            <tr><th>Site</th><th>Project</th><th>Material</th><th>Qty</th><th>Cost</th><th>Date</th><th>Requested By</th><th>Status</th><th>Actions</th></tr>
                                        </thead>
                                        <tbody>
                                            {paginatedMat.map(item => {
                                                const stockItem = stockBalance.find(s => s.item.toLowerCase() === item.material.toLowerCase());
                                                const hasStock = stockItem && stockItem.balance >= item.quantity;
                                                return (
                                                    <tr key={item.id}>
                                                        <td>{item.site ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, background: '#f0f4ff', color: '#1e40af' }}><FaBuilding size={9} /> {item.site}</span> : <span style={{ color: '#bbb', fontSize: '0.78rem' }}>—</span>}</td>
                                                        <td><strong>{item.project}</strong></td>
                                                        <td style={{ fontSize: '0.85rem' }}>
                                                            <div>{item.material}</div>
                                                            {stockItem && <div style={{ fontSize: '0.7rem', color: hasStock ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}><FaWarehouse size={8} /> Stock: {stockItem.balance} {stockItem.unit}{!hasStock && <FaExclamationTriangle size={8} title="Insufficient stock" />}</div>}
                                                        </td>
                                                        <td style={{ fontSize: '0.85rem' }}>{item.quantity} {item.unit}</td>
                                                        <td style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>{item.totalCost > 0 ? `RWF ${Number(item.totalCost).toLocaleString()}` : '—'}</td>
                                                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{item.date || '—'}</td>
                                                        <td style={{ fontSize: '0.85rem' }}>{item.createdByName ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FaUser size={10} style={{ color: 'var(--text-muted)' }} /> {item.createdByName}</span> : '—'}</td>
                                                        <td><span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600, color: '#fff', background: statusColors[item.status] || '#6b7280' }}>{item.status.replace('_', ' ')}</span></td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                                {item.status === 'pending' && canReviewMaterialRequest && (
                                                                    <>
                                                                        <button className="admin-btn admin-btn--secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', color: '#22c55e' }} onClick={() => handleApproveMat(item.id)} title="Approve"><FaCheck /></button>
                                                                        <button className="admin-btn admin-btn--secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', color: '#ef4444' }} onClick={() => { setRejectId(item.id); setRejectNotes(''); setShowRejectModal(true); }} title="Reject"><FaBan /></button>
                                                                    </>
                                                                )}
                                                                {item.status === 'pending' && !canReviewMaterialRequest && <span style={{ fontSize: '0.7rem', color: '#999' }}>Awaiting review</span>}
                                                                {user?.role !== 'admin' && <button className="admin-btn admin-btn--secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }} onClick={() => openEditMat(item)} title="Edit"><FaEdit /></button>}
                                                                {user?.role === 'admin' && <button className="admin-btn admin-btn--secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', color: 'var(--primary-red)' }} onClick={() => removeMat(item.id)} title="Delete"><FaTrash /></button>}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {paginatedMat.length === 0 && (
                                                <tr><td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}><FaTruck size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><div>No material requests found.</div></td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '0.4rem 0', flexWrap: 'wrap', gap: 6 }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Showing {matPageSize === 0 ? filteredMatRequests.length : Math.min(matPageSize, filteredMatRequests.length - (matPage - 1) * matPageSize)} of {filteredMatRequests.length}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Per page:</span>
                                            <select className="form-select" style={{ width: 'auto', padding: '0.2rem 1rem 0.2rem 0.4rem', fontSize: '0.7rem' }}
                                                value={matPageSize} onChange={e => { setMatPage(1); setMatPageSize(Number(e.target.value)); }}>
                                                {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                                <option value={0}>All</option>
                                            </select>
                                        </div>
                                        {matPageSize > 0 && matTotalPages > 1 && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }} disabled={matPage <= 1} onClick={() => setMatPage(p => Math.max(1, p - 1))}><FaChevronLeft /></button>
                                                {Array.from({ length: matTotalPages }, (_, i) => i + 1).map(p => (
                                                    <button key={p} className={p === matPage ? 'admin-btn' : 'admin-btn admin-btn--secondary'} style={{ padding: '0.2rem 0.5rem', minWidth: 26, fontSize: '0.7rem' }} onClick={() => setMatPage(p)}>{p}</button>
                                                ))}
                                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }} disabled={matPage >= matTotalPages} onClick={() => setMatPage(p => Math.min(matTotalPages, p + 1))}><FaChevronRight /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ===== VIEW DETAILS MODAL ===== */}
            {viewItem && (
                <div className="admin-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={() => setViewItem(null)}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} />
                    <div onClick={e => e.stopPropagation()} className="admin-modal" style={{ position: 'relative', padding: '1.5rem', maxWidth: '560px', width: '100%', maxHeight: '80vh', overflowY: 'auto', borderRadius: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: viewItem.type === 'material' ? '#1B204218' : '#22c55e18', color: viewItem.type === 'material' ? 'var(--primary)' : '#22c55e' }}>{viewItem.type === 'material' ? <FaTruck size={13} /> : <FaMoneyBillWave size={13} />}</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{viewItem.source === 'material' ? 'Material Request' : 'Fund Request'}</span>
                                </div>
                                <h3 style={{ margin: 0, fontSize: '0.95rem' }}>{viewItem.title}</h3>
                                <div style={{ display: 'flex', gap: '1.5rem', marginTop: 6, fontSize: '0.82rem', color: '#999' }}><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FaUser size={10} /> {viewItem.requester}</span>{viewItem.reviewer !== '—' && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FaCheckDouble size={10} style={{ color: '#22c55e' }} /> {viewItem.reviewer}</span>}</div>
                            </div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: 12, background: safeBadge(viewItem.status).bg, color: safeBadge(viewItem.status).color, whiteSpace: 'nowrap' }}>
                                {viewItem.status === 'pending' ? <FaClock size={11} /> : viewItem.status === 'approved' ? <FaCheckCircle size={11} /> : <FaTimesCircle size={11} />}{viewItem.status.charAt(0).toUpperCase() + viewItem.status.slice(1)}
                            </span>
                        </div>
                        <div style={{ background: '#f9f9f9', borderRadius: 10, padding: '1.25rem', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><div style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', marginBottom: 2 }}>Type</div><div style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>{viewItem.type === 'material' ? <FaTruck size={12} /> : <FaDollarSign size={12} />}{viewItem.type.charAt(0).toUpperCase() + viewItem.type.slice(1)}</div></div>
                                <div><div style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', marginBottom: 2 }}>Date</div><div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{viewItem.date}</div></div>
                                <div><div style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', marginBottom: 2 }}>Details</div><div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>{viewItem.details}</div></div>
                                {viewItem.reviewedAt && <div><div style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', marginBottom: 2 }}>Reviewed</div><div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{viewItem.reviewedAt}</div></div>}
                            </div>
                        </div>
                        {viewItem.status !== 'pending' && (
                            <div style={{ background: viewItem.status === 'approved' ? '#22c55e10' : '#ef444410', borderRadius: 8, padding: '0.7rem 1rem', marginBottom: '1rem', borderLeft: `3px solid ${viewItem.status === 'approved' ? '#22c55e' : '#ef4444'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                                {viewItem.status === 'approved' ? <FaCheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0 }} /> : <FaTimesCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />}
                                <span style={{ fontSize: '0.85rem' }}>This request was <strong>{viewItem.status}</strong>{viewItem.reviewer !== '—' ? ` by ${viewItem.reviewer}` : ''}{viewItem.reviewedAt ? ` on ${viewItem.reviewedAt}` : ''}</span>
                            </div>
                        )}
                        {viewItem.source === 'material' && (() => {
                            const mr = viewItem.raw as MaterialRequest;
                            const showCost = mr.unitPrice > 0 || mr.totalCost > 0;
                            return (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555', marginBottom: 6 }}>Details</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '0.6rem 0.8rem' }}><div style={{ fontSize: '0.65rem', color: '#999' }}>Material</div><div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{mr.material}</div></div>
                                        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '0.6rem 0.8rem' }}><div style={{ fontSize: '0.65rem', color: '#999' }}>Project</div><div style={{ fontSize: '0.9rem', fontWeight: 600 }}><FaBuilding size={10} style={{ marginRight: 4 }} />{mr.project}</div></div>
                                        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '0.6rem 0.8rem' }}><div style={{ fontSize: '0.65rem', color: '#999' }}>Quantity</div><div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{mr.quantity} {mr.unit}</div></div>
                                        {showCost && <div style={{ background: '#22c55e10', borderRadius: 8, padding: '0.6rem 0.8rem' }}><div style={{ fontSize: '0.65rem', color: '#999' }}>Unit Price</div><div style={{ fontSize: '0.9rem', fontWeight: 600 }}>RWF {Number(mr.unitPrice || 0).toLocaleString()}</div></div>}
                                    </div>
                                    {showCost && <div style={{ background: '#1B204210', borderRadius: 8, padding: '0.7rem 1rem', marginTop: '0.5rem', textAlign: 'center' }}><div style={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase' }}>Total Cost</div><div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>RWF {Number(mr.totalCost || 0).toLocaleString()}</div></div>}
                                    {mr.notes && <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '0.6rem 0.8rem', marginTop: '0.5rem' }}><div style={{ fontSize: '0.65rem', color: '#999', marginBottom: 2 }}>Notes</div><div style={{ fontSize: '0.82rem' }}>{mr.notes}</div></div>}
                                </div>
                            );
                        })()}
                        {viewItem.source === 'general' && (() => {
                            const ga = viewItem.raw as Approval;
                            return (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555', marginBottom: 6 }}>Description</div>
                                    <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '0.7rem 0.8rem', fontSize: '0.85rem', lineHeight: 1.5 }}>{ga.description}</div>
                                    {ga.type === 'money' && ga.amount ? <div style={{ marginTop: '0.75rem', background: '#22c55e10', borderRadius: 10, padding: '0.8rem 1rem', textAlign: 'center' }}><div style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Amount</div><div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#22c55e' }}>RWF {ga.amount.toLocaleString()}</div></div> : null}
                                </div>
                            );
                        })()}
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #eee' }}>
                            <button onClick={() => setViewItem(null)} style={{ padding: '0.15rem 0.8rem', borderRadius: 7, border: '1px solid #ddd', background: 'transparent', cursor: 'pointer', fontSize: '0.75rem' }}>Close</button>
                            {viewItem.status === 'pending' && viewItem.type === 'material' && canReviewMaterialRequest && (
                                <>
                                    <button onClick={() => { handleApprove(viewItem); setViewItem(null); }} style={{ padding: '0.15rem 0.8rem', borderRadius: 7, border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 5 }}><FaCheck size={10} /> Approve</button>
                                    <button onClick={() => { handleReject(viewItem); setViewItem(null); }} style={{ padding: '0.15rem 0.8rem', borderRadius: 7, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 5 }}><FaTimesCircle size={10} /> Reject</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MATERIAL REQUEST MODAL ===== */}
            {showModal && (
                <div className="admin-modal-overlay" onClick={() => { setShowModal(false); setEditing(null); setShowStockDropdown(false); }}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ width: 560 }}>
                        <div className="admin-modal-header">
                            <h3><FaTruck style={{ fontSize: '0.75rem', marginRight: 8, opacity: 0.5 }} />{editing ? 'Edit' : 'New'} Material Request</h3>
                            <button onClick={() => { setShowModal(false); setEditing(null); setShowStockDropdown(false); }}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            {isSiteEngineer && assignedSites.length > 0 && (
                                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '0.6rem 0.8rem', marginBottom: '0.8rem' }}>
                                    <div style={{ fontSize: '0.78rem', color: '#1e40af', fontWeight: 600, marginBottom: 4 }}><FaBuilding size={10} style={{ marginRight: 4 }} />Your Assigned Site{assignedSites.length > 1 ? 's' : ''}</div>
                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                        {assignedSites.map(s => (
                                            <span key={s.id} style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.72rem', background: matForm.site === s.name ? '#1e40af' : '#dbeafe', color: matForm.site === s.name ? '#fff' : '#1e40af', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleSiteChange(s.name)}>
                                                {s.name} ({s.project?.name || 'No project'})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {isSiteEngineer && assignedSites.length > 1 && (
                                    <div className="form-group"><label className="form-label">Site <span style={{ color: '#ef4444' }}>*</span></label><select value={matForm.site} onChange={e => handleSiteChange(e.target.value)} className="form-select"><option value="">Select site</option>{assignedSites.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
                                )}
                                <div className="form-group"><label className="form-label">Project</label><select value={matForm.project} onChange={e => setMatForm(p => ({ ...p, project: e.target.value }))} className="form-select" disabled={isSiteEngineer && assignedSites.length === 1}><option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
                                <div className="form-group" style={{ position: 'relative' }}>
                                    <label className="form-label">Material {isSiteEngineer && <span style={{ color: '#999', fontWeight: 400, fontSize: '0.7rem' }}>(from stock)</span>}</label>
                                    <input value={materialSearch} onChange={e => { setMaterialSearch(e.target.value); setMatForm(p => ({ ...p, material: e.target.value })); setShowStockDropdown(true); }} onFocus={() => setShowStockDropdown(true)} className="form-input" placeholder={isSiteEngineer ? "Search available materials..." : "e.g. Cement"} />
                                    {showStockDropdown && filteredStock.length > 0 && (
                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#fff', border: '1px solid var(--border-color)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxHeight: 200, overflowY: 'auto' }}>
                                            {filteredStock.slice(0, 10).map(s => (
                                                <div key={s.item} onClick={() => selectStockItem(s)} style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                                    <div><div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{s.item}</div><div style={{ fontSize: '0.7rem', color: '#999' }}>{s.category} · {s.unit}</div></div>
                                                    <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#22c55e' }}>{s.balance}</div><div style={{ fontSize: '0.65rem', color: '#999' }}>available</div></div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Quantity</label>
                                    <input type="number" value={matForm.quantity} onChange={e => setMatForm(p => ({ ...p, quantity: e.target.value === '' ? '' : parseInt(e.target.value) || '' }))} className="form-input" placeholder="e.g. 100" />
                                    {isSiteEngineer && matForm.material && (() => {
                                        const stockItem = stockBalance.find(s => s.item.toLowerCase() === matForm.material.toLowerCase());
                                        if (stockItem) {
                                            const requested = parseInt(matForm.quantity) || 0;
                                            const sufficient = requested <= stockItem.balance;
                                            return <div style={{ fontSize: '0.7rem', color: sufficient ? '#22c55e' : '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>{sufficient ? <FaCheck size={8} /> : <FaExclamationTriangle size={8} />} Available: {stockItem.balance} {stockItem.unit}{requested > 0 && !sufficient && ` (need ${requested - stockItem.balance} more)`}</div>;
                                        }
                                        return null;
                                    })()}
                                </div>
                                <div className="form-group"><label className="form-label">Unit Price (RWF)</label><input type="number" value={matForm.unitPrice} onChange={e => setMatForm(p => ({ ...p, unitPrice: e.target.value === '' ? '' : parseFloat(e.target.value) || '' }))} className="form-input" placeholder="e.g. 15000" /></div>
                                <div className="form-group"><label className="form-label">Unit</label><select value={matForm.unit} onChange={e => setMatForm(p => ({ ...p, unit: e.target.value }))} className="form-select"><option value="pieces">Pieces</option><option value="bags">Bags</option><option value="tons">Tons</option><option value="kg">Kg</option><option value="liters">Liters</option><option value="meters">Meters</option></select></div>
                                <div className="form-group"><label className="form-label">Date</label><input type="date" value={matForm.date} onChange={e => setMatForm(p => ({ ...p, date: e.target.value }))} className="form-input" /></div>
                                <div className="form-group"><label className="form-label">Notes</label><input value={matForm.notes} onChange={e => setMatForm(p => ({ ...p, notes: e.target.value }))} className="form-input" placeholder="Optional notes" /></div>
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => { setShowModal(false); setEditing(null); setShowStockDropdown(false); }}>Cancel</button>
                            <button className="admin-btn" onClick={saveMat} disabled={savingMat || !matForm.project || !matForm.material}>{savingMat ? 'Submitting...' : 'Submit Request'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== REJECT MODAL ===== */}
            {showRejectModal && rejectId && (
                <div className="admin-modal-overlay" onClick={() => setShowRejectModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={rejectModalPos ? { position: 'fixed', left: rejectModalPos.x, top: rejectModalPos.y, width: 400 } : { width: 400 }}>
                        <div className="admin-modal-header" onMouseDown={onRejectHeaderMouseDown}>
                            <h3><FaBan style={{ color: '#ef4444', marginRight: 6 }} />Reject Request</h3>
                            <button onClick={() => setShowRejectModal(false)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div className="form-group"><label className="form-label">Reason <span style={{ color: '#999', fontSize: '0.75rem' }}>(optional)</span></label><textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} className="form-textarea" rows={3} placeholder="Why is this request rejected?" /></div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setShowRejectModal(false)}>Cancel</button>
                            <button className="admin-btn" onClick={handleRejectMat} style={{ background: '#ef4444', borderColor: '#ef4444' }}>Reject</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Requests;
