import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    FaEdit, FaTrash, FaPlus, FaTimes as FaTimesIcon, FaHandshake, FaFileExcel, FaFilePdf,
    FaArrowsAlt, FaChevronLeft, FaChevronRight, FaEye, FaCheck, FaBan, FaExclamationTriangle,
    FaFileUpload, FaFilePdf as FaFileIcon, FaBuilding, FaCoins, FaShieldAlt,
    FaUsers, FaClock, FaCheckCircle, FaTimesCircle,
} from 'react-icons/fa';
import { constructionService } from '../../services/constructionService';
import type { Partnership, Project } from '../../services/constructionService';
import { uploadService } from '../../services/uploadService';
import { useToast } from '../../context/ToastContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadPageCache, savePageCache } from '../../utils/pageCache';

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
            <div style={{ fontSize: emphasis ? '1.1rem' : '0.95rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
        </div>
    </div>
);

interface FormData {
    entityKind: string;
    companyName: string; contactPerson: string; email: string; phone: string; address: string;
    registrationNumber: string; taxId: string;
    partnershipType: string; otherTypeDescription: string; status: string;
    licenseNumber: string; licenseExpiry: string; insuranceExpiry: string;
    investmentAmount: string; equityPercentage: string; projectId: string;
    agreementFile: string;
    startDate: string; endDate: string; notes: string;
}

const emptyForm: FormData = {
    entityKind: 'company',
    companyName: '', contactPerson: '', email: '', phone: '', address: '',
    registrationNumber: '', taxId: '',
    partnershipType: 'supplier', otherTypeDescription: '', status: 'active',
    licenseNumber: '', licenseExpiry: '', insuranceExpiry: '',
    investmentAmount: '', equityPercentage: '', projectId: '',
    agreementFile: '',
    startDate: '', endDate: '', notes: '',
};

const PAGE_SIZES = [5, 10, 15, 20];

const TYPE_LABELS: Record<string, string> = {
    supplier: 'Supplier', subcontractor: 'Subcontractor', investor: 'Investor', joint_venture: 'Joint Venture', other: 'Other',
};

const isVendorType = (t: string) => t === 'supplier' || t === 'subcontractor';
const isCapitalType = (t: string) => t === 'investor' || t === 'joint_venture';

/** NestJS validation errors arrive as string[]; render them as one readable sentence instead of raw concatenated text. */
const extractErrorMessage = (e: any, fallback: string): string => {
    const message = e?.response?.data?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
    return fallback;
};

/** Days until a date; negative means already past. */
const daysUntil = (dateStr?: string): number | null => {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const complianceFlag = (licenseExpiry?: string, insuranceExpiry?: string): { label: string; color: string } | null => {
    const checks = [
        { label: 'License', days: daysUntil(licenseExpiry) },
        { label: 'Insurance', days: daysUntil(insuranceExpiry) },
    ].filter(c => c.days !== null) as { label: string; days: number }[];
    if (!checks.length) return null;
    const expired = checks.filter(c => c.days < 0);
    if (expired.length) return { label: `${expired.map(c => c.label).join(' & ')} expired`, color: '#ef4444' };
    const soon = checks.filter(c => c.days <= 30);
    if (soon.length) return { label: `${soon.map(c => c.label).join(' & ')} expiring soon`, color: '#f59e0b' };
    return { label: 'Compliant', color: '#22c55e' };
};

const Partnerships = () => {
    const { showToast } = useToast();
    const [data, setData] = useState<Partnership[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Partnership | null>(null);
    const [viewItem, setViewItem] = useState<Partnership | null>(null);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'inactive' | 'rejected'>('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [modalPos, setModalPos] = useState<{ x: number; y: number } | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Partnership | null>(null);
    const [deleting, setDeleting] = useState(false);
    const dragging = useRef<{ offsetX: number; offsetY: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetch = async () => {
        const cached = loadPageCache<{ data: Partnership[] }>('pg_partnerships');
        if (cached) {
            setData(cached.data || []);
        }
        try {
            const res = await constructionService.getPartnerships();
            setData(res.data || []);
            savePageCache('pg_partnerships', { data: res.data || [] });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(); }, []);

    useEffect(() => {
        if (showModal && projects.length === 0) {
            constructionService.getProjects().then(res => setProjects(res.data || [])).catch(() => setProjects([]));
        }
    }, [showModal, projects.length]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return data.filter(d => {
            if (statusFilter !== 'all' && d.status !== statusFilter) return false;
            if (q && !d.companyName.toLowerCase().includes(q) && !(d.contactPerson || '').toLowerCase().includes(q) && !d.partnershipType.toLowerCase().includes(q)) return false;
            if (fromDate && new Date(d.createdAt) < new Date(fromDate)) return false;
            if (toDate) { const end = new Date(toDate); end.setHours(23, 59, 59, 999); if (new Date(d.createdAt) > end) return false; }
            return true;
        });
    }, [data, search, statusFilter, fromDate, toDate]);

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
        d.companyName,
        d.entityKind === 'individual' ? 'Individual' : 'Company',
        d.contactPerson || '—',
        d.partnershipType === 'other' && d.otherTypeDescription ? d.otherTypeDescription : (TYPE_LABELS[d.partnershipType] || d.partnershipType),
        d.status,
        d.email || '—',
        d.phone || '—',
        d.startDate ? new Date(d.startDate).toLocaleDateString() : '?',
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
        doc.text('Partnerships Report', 14, titleY);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#666');
        const today = new Date().toLocaleDateString();
        doc.text(`Generated: ${today}${fromDate && toDate ? ` | Period: ${fromDate} to ${toDate}` : ''}`, pageW - 14, titleY, { align: 'right' });

        autoTable(doc, {
            head: [['#', 'Company', 'Entity', 'Contact', 'Type', 'Status', 'Email', 'Phone', 'Start Date']],
            body: tableData,
            startY: 46,
            styles: { fontSize: 8, textColor: '#333' },
            headStyles: { fillColor: [27, 32, 66], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [250, 245, 240] },
            columnStyles: { 0: { cellWidth: 10, halign: 'center' } },
            didDrawPage: () => {
                doc.setDrawColor(brown);
                doc.setLineWidth(0.5);
                doc.line(14, pageH - 20, pageW - 14, pageH - 20);
                doc.setFontSize(8);
                doc.setTextColor(brown);
                doc.setFont('helvetica', 'normal');
                doc.text('Email: info@muhiziconstruction.com  |  Phone: +250 788 000 000  |  Location: Kigali, Rwanda', pageW / 2, pageH - 14, { align: 'center' });
            },
        });

        doc.save('partnerships.pdf');
    };

    const downloadExcel = () => {
        const brown = '#1B2042';
        const today = new Date().toLocaleDateString();
        const period = fromDate && toDate ? `Period: ${fromDate} to ${toDate}` : '';
        const headers = ['#', 'Company', 'Entity', 'Contact', 'Type', 'Status', 'Email', 'Phone', 'Start Date'];
        const rows = tableData.map(r => `<tr>${r.map(c => `<td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${c}</td>`).join('')}</tr>`).join('');

        const html = `
            <html><head><meta charset="UTF-8"></head><body>
            <div style="text-align:center;color:${brown};font-size:20px;font-weight:bold;font-family:Arial">MUHIZI CONSTRUCTION</div>
            <div style="text-align:center;color:${brown};font-size:11px;font-family:Arial;margin-bottom:4px">Building Your Vision, Delivering Excellence</div>
            <hr style="border:1px solid ${brown}" />
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;color:${brown};font-family:Arial;margin:6px 0">
                <span>Partnerships Report</span>
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
        a.href = url; a.download = 'partnerships.xls'; a.click();
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
        total: data.length,
        pending: data.filter(d => d.status === 'pending').length,
        active: data.filter(d => d.status === 'active').length,
        rejected: data.filter(d => d.status === 'rejected').length,
        investors: data.filter(d => d.partnershipType === 'investor' || d.partnershipType === 'joint_venture').length,
    }), [data]);

    const openNew = () => { setEditing(null); setForm(emptyForm); setModalPos(null); setShowModal(true); };

    const openEdit = (item: Partnership) => {
        setEditing(item);
        setForm({
            entityKind: item.entityKind || 'company',
            companyName: item.companyName, contactPerson: item.contactPerson || '',
            email: item.email || '', phone: item.phone || '', address: item.address || '',
            registrationNumber: item.registrationNumber || '', taxId: item.taxId || '',
            partnershipType: item.partnershipType, otherTypeDescription: item.otherTypeDescription || '', status: item.status,
            licenseNumber: item.licenseNumber || '', licenseExpiry: item.licenseExpiry || '',
            insuranceExpiry: item.insuranceExpiry || '',
            investmentAmount: item.investmentAmount ? String(item.investmentAmount) : '',
            equityPercentage: item.equityPercentage ? String(item.equityPercentage) : '',
            projectId: item.projectId || '',
            agreementFile: item.agreementFile || '',
            startDate: item.startDate || '', endDate: item.endDate || '', notes: item.notes || '',
        });
        setModalPos(null);
        setShowModal(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const uploaded = await uploadService.uploadFile(file);
            setForm(p => ({ ...p, agreementFile: uploaded.secureUrl }));
            showToast('Agreement document uploaded', 'success');
        } catch {
            showToast('Failed to upload document', 'error');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const buildPayload = () => ({
        ...form,
        address: form.address || undefined,
        registrationNumber: form.registrationNumber || undefined,
        taxId: form.taxId || undefined,
        otherTypeDescription: form.partnershipType === 'other' ? (form.otherTypeDescription || undefined) : undefined,
        licenseNumber: form.licenseNumber || undefined,
        licenseExpiry: form.licenseExpiry || undefined,
        insuranceExpiry: form.insuranceExpiry || undefined,
        investmentAmount: form.investmentAmount ? Number(form.investmentAmount) : undefined,
        equityPercentage: form.equityPercentage ? Number(form.equityPercentage) : undefined,
        projectId: form.projectId || undefined,
        agreementFile: form.agreementFile || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
    });

    const handleSave = async () => {
        if (!form.companyName.trim()) {
            showToast(form.entityKind === 'individual' ? 'Full name is required' : 'Company name is required', 'error');
            return;
        }
        if (form.partnershipType === 'other' && !form.otherTypeDescription.trim()) {
            showToast('Describe the partnership type', 'error');
            return;
        }
        if (form.startDate && form.endDate && form.endDate < form.startDate) {
            showToast('End date cannot be before start date', 'error');
            return;
        }
        setSaving(true);
        try {
            if (editing) await constructionService.updatePartnership(editing.id, buildPayload());
            else await constructionService.createPartnership({ ...buildPayload(), status: 'active' });
            showToast(editing ? 'Partnership updated' : 'Partner registered', 'success');
            setShowModal(false);
            fetch();
        } catch (e: any) {
            showToast(extractErrorMessage(e, 'Failed to save'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const review = async (item: Partnership, decision: 'active' | 'rejected') => {
        const verb = decision === 'active' ? 'approve' : 'reject';
        if (!window.confirm(`Do you want to ${verb} the record for "${item.companyName}"?`)) return;
        try {
            await constructionService.updatePartnership(item.id, { status: decision });
            showToast(`Application ${decision === 'active' ? 'approved' : 'rejected'}`, 'success');
            fetch();
        } catch {
            showToast('Failed to update status', 'error');
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await constructionService.deletePartnership(deleteTarget.id);
            showToast('Partnership record deleted', 'success');
            setDeleteTarget(null);
            fetch();
        } catch (e) {
            showToast(extractErrorMessage(e, 'Failed to delete partnership record'), 'error');
        } finally {
            setDeleting(false);
        }
    };

    const statusColors: Record<string, string> = {
        active: '#22c55e', inactive: '#6b7280', pending: '#f59e0b', rejected: '#ef4444',
    };

    return (
        <div className="admin-page">
            <div style={{ marginBottom: '0.25rem' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <FaHandshake style={{ color: 'var(--primary)' }} /> Partnerships
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Suppliers, subcontractors, investors and joint-venture partners</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.6rem', marginTop: '0.75rem', marginBottom: '1.25rem' }}>
                    <div onClick={() => { setStatusFilter('all'); setPage(1); }} style={{ cursor: 'pointer', opacity: statusFilter === 'all' ? 1 : 0.6 }}>
                        <StatTile icon={<FaHandshake />} label="Total" value={String(stats.total)} accent="#1B2042" emphasis />
                    </div>
                    <div onClick={() => { setStatusFilter('pending'); setPage(1); }} style={{ cursor: 'pointer', opacity: statusFilter === 'pending' ? 1 : 0.6 }}>
                        <StatTile icon={<FaClock />} label="Pending Review" value={String(stats.pending)} accent="#f59e0b" />
                    </div>
                    <div onClick={() => { setStatusFilter('active'); setPage(1); }} style={{ cursor: 'pointer', opacity: statusFilter === 'active' ? 1 : 0.6 }}>
                        <StatTile icon={<FaCheckCircle />} label="Active" value={String(stats.active)} accent="#22c55e" />
                    </div>
                    <div onClick={() => { setStatusFilter('rejected'); setPage(1); }} style={{ cursor: 'pointer', opacity: statusFilter === 'rejected' ? 1 : 0.6 }}>
                        <StatTile icon={<FaTimesCircle />} label="Rejected" value={String(stats.rejected)} accent="#ef4444" />
                    </div>
                    <div>
                        <StatTile icon={<FaCoins />} label="Investors/JV" value={String(stats.investors)} accent="#8b5cf6" />
                    </div>
                </div>
            </div>

            <div className="admin-card" style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {statusFilter === 'all' ? 'All Partnerships' : `${statusFilter.charAt(0).toUpperCase()}${statusFilter.slice(1)} Partnerships`}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input type="text" className="form-input" placeholder="Search company, contact, type..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 280 }} />
                        <input type="date" className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 140 }} title="From date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} />
                        <input type="date" className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 140 }} title="To date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} />
                        <button className="admin-btn" onClick={downloadExcel} title="Download as Excel — for records, sharing, or uploading elsewhere as evidence" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.6rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, opacity: 1 }}>
                            <FaFileExcel /> Excel
                        </button>
                        <button className="admin-btn" onClick={downloadPDF} title="Download as PDF — for records, sharing, or uploading elsewhere as evidence" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.6rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, opacity: 1 }}>
                            <FaFilePdf /> PDF
                        </button>
                        <button className="admin-btn" onClick={openNew} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.6rem 1.5rem', fontSize: '0.95rem' }}>
                            <FaPlus style={{ marginRight: 6 }} />Register Partner
                        </button>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Company</th><th>Type</th><th>Status</th><th>Contact</th><th>Compliance</th><th>Investment</th><th>Reviewed By</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(item => {
                                const flag = isVendorType(item.partnershipType) ? complianceFlag(item.licenseExpiry, item.insuranceExpiry) : null;
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <strong>{item.companyName}</strong>
                                            {item.entityKind === 'individual' && (
                                                <span style={{ marginLeft: 6, fontSize: '0.68rem', color: 'var(--text-muted)' }}>(Individual)</span>
                                            )}
                                            {item.project && (
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                    <FaBuilding size={9} /> {item.project.name}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ textTransform: 'capitalize' }}>{item.partnershipType === 'other' && item.otherTypeDescription ? item.otherTypeDescription : (TYPE_LABELS[item.partnershipType] || item.partnershipType)}</td>
                                        <td>
                                            <span style={{
                                                display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600,
                                                color: '#fff', background: statusColors[item.status] || '#6b7280', textTransform: 'capitalize',
                                            }}>{item.status}</span>
                                        </td>
                                        <td style={{ fontSize: '0.82rem' }}>
                                            {item.contactPerson && <div>{item.contactPerson}</div>}
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.email || item.phone || '—'}</div>
                                        </td>
                                        <td>
                                            {flag ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 600, color: flag.color }}>
                                                    {flag.color !== '#22c55e' && <FaExclamationTriangle size={10} />} {flag.label}
                                                </span>
                                            ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                        </td>
                                        <td style={{ fontSize: '0.82rem' }}>
                                            {isCapitalType(item.partnershipType) && item.investmentAmount ? (
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>RWF {Number(item.investmentAmount).toLocaleString()}</div>
                                                    {item.equityPercentage ? <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{item.equityPercentage}% equity</div> : null}
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.reviewedByName || '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setViewItem(item)} title="View"><FaEye /></button>
                                                {item.status === 'pending' && (
                                                    <>
                                                        <button className="admin-btn" style={{ padding: '0.3rem 0.6rem', background: '#22c55e', borderColor: '#22c55e' }} onClick={() => review(item, 'active')} title="Approve"><FaCheck /></button>
                                                        <button className="admin-btn" style={{ padding: '0.3rem 0.6rem', background: '#ef4444', borderColor: '#ef4444' }} onClick={() => review(item, 'rejected')} title="Reject"><FaBan /></button>
                                                    </>
                                                )}
                                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => openEdit(item)} title="Edit"><FaEdit /></button>
                                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem', color: 'var(--primary-red)' }} onClick={() => setDeleteTarget(item)} title="Delete"><FaTrash /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {paginated.length === 0 && (
                                <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <FaHandshake size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                                    <div>No partnerships found. Click "Register Partner" to register a new one.</div>
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
                            <select className="form-select" style={{ width: 'auto', padding: '0.3rem 1.5rem 0.3rem 0.5rem', fontSize: '0.8rem' }} value={pageSize} onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}>
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
                <div className="admin-modal-overlay" onClick={() => !saving && setShowModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ left: modalPos?.x ?? '50%', top: modalPos?.y ?? '50%', transform: modalPos ? 'none' : 'translate(-50%, -50%)', maxWidth: 720 }}>
                        <div className="admin-modal-header" onMouseDown={onHeaderMouseDown}>
                            <h3><FaArrowsAlt style={{ fontSize: '0.75rem', marginRight: 8, opacity: 0.5 }} />{editing ? 'Edit Partnership' : 'Register New Partner / Investor'}</h3>
                            <button onClick={() => setShowModal(false)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            {!editing && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 0, marginBottom: '1rem' }}>
                                    Registering saves the partner as <strong>Active</strong> immediately. Set Status to Pending below if this record still needs review before it's active.
                                </p>
                            )}

                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.5rem' }}>Company Information</div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Partner Is</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {(['company', 'individual'] as const).map(kind => (
                                        <button type="button" key={kind}
                                            onClick={() => setForm(p => ({ ...p, entityKind: kind }))}
                                            style={{
                                                padding: '0.4rem 1rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                                                border: form.entityKind === kind ? '1px solid var(--primary)' : '1px solid #ddd',
                                                background: form.entityKind === kind ? 'var(--primary)' : 'transparent',
                                                color: form.entityKind === kind ? '#fff' : 'var(--text-main)',
                                            }}>
                                            {kind === 'company' ? 'Company' : 'Individual'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">{form.entityKind === 'individual' ? 'Full Name' : 'Company Name'}</label>
                                    <input className="form-input" value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))} placeholder={form.entityKind === 'individual' ? 'Full name' : 'Company name'} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Partnership Type</label>
                                    <select className="form-select" value={form.partnershipType} onChange={e => setForm(p => ({ ...p, partnershipType: e.target.value }))}>
                                        <option value="supplier">Supplier</option>
                                        <option value="subcontractor">Subcontractor</option>
                                        <option value="investor">Investor</option>
                                        <option value="joint_venture">Joint Venture</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                {form.partnershipType === 'other' && (
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label">Describe the Partnership Type</label>
                                        <input className="form-input" value={form.otherTypeDescription} onChange={e => setForm(p => ({ ...p, otherTypeDescription: e.target.value }))} placeholder="e.g. Landowner, Consultant, Donor" />
                                    </div>
                                )}
                                <div className="form-group">
                                    <label className="form-label">Contact Person</label>
                                    <input className="form-input" value={form.contactPerson} onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))} placeholder="Full name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="contact@company.com" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+250 788 000 000" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Address</label>
                                    <input className="form-input" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Business address" />
                                </div>
                            </div>

                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '1.25rem 0 0.5rem' }}>Legal &amp; Compliance</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">{form.entityKind === 'individual' ? 'National ID' : 'Registration Number'}</label>
                                    <input className="form-input" value={form.registrationNumber} onChange={e => setForm(p => ({ ...p, registrationNumber: e.target.value }))} placeholder={form.entityKind === 'individual' ? 'National ID number' : 'RDB registration number'} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tax ID (TIN)</label>
                                    <input className="form-input" value={form.taxId} onChange={e => setForm(p => ({ ...p, taxId: e.target.value }))} placeholder="Tax identification number" />
                                </div>
                                {isVendorType(form.partnershipType) && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label"><FaShieldAlt size={10} style={{ marginRight: 4 }} />License Number</label>
                                            <input className="form-input" value={form.licenseNumber} onChange={e => setForm(p => ({ ...p, licenseNumber: e.target.value }))} placeholder="Trade/contractor license" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">License Expiry</label>
                                            <input type="date" className="form-input" value={form.licenseExpiry} onChange={e => setForm(p => ({ ...p, licenseExpiry: e.target.value }))} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Insurance Expiry</label>
                                            <input type="date" className="form-input" value={form.insuranceExpiry} onChange={e => setForm(p => ({ ...p, insuranceExpiry: e.target.value }))} />
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>Liability / workers' comp coverage</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {isCapitalType(form.partnershipType) && (
                                <>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '1.25rem 0 0.5rem' }}><FaCoins size={10} style={{ marginRight: 4 }} />Investment Terms</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Investment Amount (RWF)</label>
                                            <input type="number" className="form-input" value={form.investmentAmount} onChange={e => setForm(p => ({ ...p, investmentAmount: e.target.value }))} placeholder="e.g. 50000000" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Equity Share (%)</label>
                                            <input type="number" step="0.1" className="form-input" value={form.equityPercentage} onChange={e => setForm(p => ({ ...p, equityPercentage: e.target.value }))} placeholder="e.g. 12.5" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Linked Project</label>
                                            <select className="form-select" value={form.projectId} onChange={e => setForm(p => ({ ...p, projectId: e.target.value }))}>
                                                <option value="">— None —</option>
                                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '1.25rem 0 0.5rem' }}>Agreement &amp; Term</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input type="date" className="form-input" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End Date</label>
                                    <input type="date" className="form-input" min={form.startDate || undefined} value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
                                </div>
                                {editing && (
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                                            <option value="pending">Pending</option>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label className="form-label">Agreement Document</label>
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.doc,.docx,image/*" style={{ display: 'none' }} />
                                    <button type="button" className="admin-btn admin-btn--secondary" disabled={uploading} onClick={() => fileInputRef.current?.click()} style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <FaFileUpload /> {uploading ? 'Uploading...' : form.agreementFile ? 'Replace document' : 'Upload document'}
                                    </button>
                                    {form.agreementFile && (
                                        <a href={form.agreementFile} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: '0.35rem', color: 'var(--primary)' }}>
                                            <FaFileIcon size={10} /> View uploaded document
                                        </a>
                                    )}
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="form-label">Notes</label>
                                <textarea className="form-textarea" rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Additional notes..." />
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
                            <button className="admin-btn" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : (editing ? 'Save Changes' : 'Register Partner')}</button>
                        </div>
                    </div>
                </div>
            )}

            {viewItem && (
                <div className="admin-modal-overlay" onClick={() => setViewItem(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: 480, borderRadius: 12 }}>
                        <div className="admin-modal-header" style={{ padding: '0.9rem 1.1rem' }}>
                            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}><FaHandshake style={{ color: 'var(--primary)' }} /> {viewItem.companyName}</h3>
                            <button onClick={() => setViewItem(null)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600, color: '#fff', background: statusColors[viewItem.status] || '#6b7280', textTransform: 'capitalize' }}>{viewItem.status}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{viewItem.partnershipType === 'other' && viewItem.otherTypeDescription ? viewItem.otherTypeDescription : (TYPE_LABELS[viewItem.partnershipType] || viewItem.partnershipType)}</span>
                                {viewItem.entityKind === 'individual' && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>· Individual</span>
                                )}
                            </div>
                            {viewItem.contactPerson && <div style={{ fontSize: '0.85rem' }}>{viewItem.contactPerson} {viewItem.email ? `· ${viewItem.email}` : ''} {viewItem.phone ? `· ${viewItem.phone}` : ''}</div>}
                            {viewItem.address && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{viewItem.address}</div>}
                            {(viewItem.registrationNumber || viewItem.taxId) && (
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {viewItem.registrationNumber && <>Reg. No: {viewItem.registrationNumber}<br /></>}
                                    {viewItem.taxId && <>TIN: {viewItem.taxId}</>}
                                </div>
                            )}
                            {isVendorType(viewItem.partnershipType) && (viewItem.licenseNumber || viewItem.insuranceExpiry) && (
                                <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '0.6rem 0.8rem', fontSize: '0.78rem' }}>
                                    {viewItem.licenseNumber && <div>License: {viewItem.licenseNumber} {viewItem.licenseExpiry ? `(exp. ${new Date(viewItem.licenseExpiry).toLocaleDateString()})` : ''}</div>}
                                    {viewItem.insuranceExpiry && <div>Insurance expiry: {new Date(viewItem.insuranceExpiry).toLocaleDateString()}</div>}
                                    {(() => { const f = complianceFlag(viewItem.licenseExpiry, viewItem.insuranceExpiry); return f ? <div style={{ color: f.color, fontWeight: 600, marginTop: 4 }}>{f.label}</div> : null; })()}
                                </div>
                            )}
                            {isCapitalType(viewItem.partnershipType) && viewItem.investmentAmount && (
                                <div style={{ background: '#8b5cf610', borderRadius: 8, padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}>
                                    <strong>RWF {Number(viewItem.investmentAmount).toLocaleString()}</strong>{viewItem.equityPercentage ? ` for ${viewItem.equityPercentage}% equity` : ''}
                                    {viewItem.project && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Project: {viewItem.project.name}</div>}
                                </div>
                            )}
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {viewItem.startDate ? new Date(viewItem.startDate).toLocaleDateString() : '?'} — {viewItem.endDate ? new Date(viewItem.endDate).toLocaleDateString() : '?'}
                            </div>
                            {viewItem.notes && <div style={{ fontSize: '0.82rem', background: '#f9f9f9', borderRadius: 8, padding: '0.6rem 0.8rem' }}>{viewItem.notes}</div>}
                            {viewItem.agreementFile && (
                                <a href={viewItem.agreementFile} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <FaFileIcon size={11} /> View agreement document
                                </a>
                            )}
                            {viewItem.reviewedByName && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                                    Reviewed by {viewItem.reviewedByName}{viewItem.reviewedAt ? ` on ${new Date(viewItem.reviewedAt).toLocaleDateString()}` : ''}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {deleteTarget && (
                <div className="admin-modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: 420, borderRadius: 12 }}>
                        <div className="admin-modal-header" style={{ padding: '0.9rem 1.1rem' }}>
                            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FaExclamationTriangle style={{ color: 'var(--primary-red)' }} /> Delete Partnership Record
                            </h3>
                            <button onClick={() => !deleting && setDeleteTarget(null)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            <p style={{ fontSize: '0.88rem', margin: 0 }}>
                                Are you sure you want to permanently delete the record for <strong>{deleteTarget.companyName}</strong>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
                            <button
                                className="admin-btn"
                                style={{ background: 'var(--primary-red)', borderColor: 'var(--primary-red)' }}
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? 'Deleting...' : 'Delete Record'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Partnerships;
