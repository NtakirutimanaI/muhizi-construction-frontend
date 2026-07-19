import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    FaEdit, FaTrash, FaPlus, FaTimes as FaTimesIcon, FaUsers, FaDollarSign,
    FaFileExcel, FaFilePdf, FaArrowsAlt, FaChevronLeft, FaChevronRight, FaEye, FaIdCard, FaLock, FaFileAlt, FaSpinner,
    FaCamera, FaUpload, FaFileSignature, FaExclamationTriangle, FaDownload, FaUserTie, FaHeartbeat, FaGraduationCap,
    FaCheckCircle, FaTimesCircle, FaBan,
} from 'react-icons/fa';
import { hrService } from '../../services/hrService';
import { loadPageCache, savePageCache } from '../../utils/pageCache';
import { contractsService, type Contract } from '../../services/contractsService';
import { uploadService } from '../../services/uploadService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import type { Employee } from '../../services/hrService';
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
            <div style={{ fontSize: emphasis ? '1.1rem' : '0.95rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
        </div>
    </div>
);

const CONTRACT_STATUS_COLORS: Record<string, string> = {
    active: '#22c55e', expiring_soon: '#f59e0b', expired: '#ef4444', draft: '#6b7280',
};

/** NestJS validation errors arrive as string[]; render them as one readable sentence instead of raw concatenated text. */
const extractErrorMessage = (e: any, fallback: string): string => {
    const message = e?.response?.data?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
    return fallback;
};

interface FormData {
    firstName: string; lastName: string; email: string; phone: string;
    gender: string; maritalStatus: string; nationalId: string; educationLevel: string;
    address: string; emergencyContact: string;
    position: string; department: string; hireDate: string; salary: number | ''; status: string;
    avatar: string;
    documents: { name: string; url: string }[];
}

const emptyForm: FormData = {
    firstName: '', lastName: '', email: '', phone: '',
    gender: '', maritalStatus: '', nationalId: '', educationLevel: '',
    address: '', emergencyContact: '',
    position: '', department: 'construction', hireDate: '', salary: '', status: 'active',
    avatar: '', documents: [],
};

const DEPARTMENTS = ['construction', 'engineering', 'design', 'finance', 'hr', 'admin', 'sales', 'marketing', 'logistics', 'safety'];
const GENDERS = ['male', 'female', 'other'];
const MARITAL_STATUSES = ['single', 'married', 'divorced', 'widowed'];
const EDUCATION_LEVELS = ['Primary', 'Secondary', 'Vocational / Trade Certificate', 'Diploma', "Bachelor's Degree", "Master's Degree", 'Doctorate'];
const DOCUMENT_TYPES = ['CV / Resume', 'National ID Copy', 'Certificate / License', 'Academic Transcript', 'Other'];
const CONTRACT_TYPES = ['Permanent', 'Fixed Term', 'Internship', 'Contractor'];
const PAGE_SIZES = [5, 10, 15, 20];

interface ContractFormData {
    title: string; type: string; startDate: string; endDate: string;
}
const emptyContractForm: ContractFormData = { title: '', type: 'Permanent', startDate: '', endDate: '' };

const Employees = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const role = user?.role || '';
    // Matches the backend RolesGuard's effective roles (including the Finance Director →
    // Site Manager alias) — only these roles can actually write, so only these see the
    // manage affordances. Admin's registry view is deliberately read-only.
    const canManage = role === 'site_manager' || role === 'site_engineer' || role === 'finance_director';
    // Contract terms are Finance Director's domain (backend: @Roles(FINANCE_DIRECTOR) on
    // write). Admin sees them as a read-only report on the employee's profile.
    const canSeeContracts = role === 'admin' || role === 'finance_director';
    const canManageContracts = role === 'finance_director';

    const [data, setData] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Employee | null>(null);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [viewItem, setViewItem] = useState<Employee | null>(null);
    const [viewContracts, setViewContracts] = useState<Contract[] | null>(null);
    const [viewContractsLoading, setViewContractsLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [modalPos, setModalPos] = useState<{ x: number; y: number } | null>(null);
    const dragging = useRef<{ offsetX: number; offsetY: number } | null>(null);

    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [docType, setDocType] = useState(DOCUMENT_TYPES[0]);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);

    const [contractModal, setContractModal] = useState(false);
    const [contractForm, setContractForm] = useState<ContractFormData>(emptyContractForm);
    const [contractFile, setContractFile] = useState<File | null>(null);
    const [savingContract, setSavingContract] = useState(false);
    const contractFileInputRef = useRef<HTMLInputElement>(null);

    const fetch = async () => {
        const cached = loadPageCache<{ data: Employee[] }>('pg_employees');
        if (cached) { setData(cached.data); }
        try {
            const res = await hrService.getEmployees();
            setData(res.data || []);
            savePageCache('pg_employees', { data: res.data || [] });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(); }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return data.filter(d => {
            if (q && !(d.firstName + ' ' + d.lastName).toLowerCase().includes(q) && !d.email.toLowerCase().includes(q) && !d.department.toLowerCase().includes(q) && !(d.position || '').toLowerCase().includes(q)) return false;
            if (fromDate && new Date(d.createdAt) < new Date(fromDate)) return false;
            if (toDate) { const end = new Date(toDate); end.setHours(23, 59, 59, 999); if (new Date(d.createdAt) > end) return false; }
            return true;
        });
    }, [data, search, fromDate, toDate]);

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
        `${d.firstName} ${d.lastName}`,
        d.email,
        d.department.replace(/(^\w|\s\w)/g, c => c.toUpperCase()),
        d.position || '—',
        `RWF ${d.salary.toLocaleString()}`,
        d.status,
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
        doc.text('Employees Report', 14, titleY);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#666');
        const today = new Date().toLocaleDateString();
        doc.text(`Generated: ${today}${fromDate && toDate ? ` | Period: ${fromDate} to ${toDate}` : ''}`, pageW - 14, titleY, { align: 'right' });

        autoTable(doc, {
            head: [['#', 'Name', 'Email', 'Department', 'Position', 'Salary', 'Status']],
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

        doc.save('employees.pdf');
    };

    const downloadExcel = () => {
        const brown = '#1B2042';
        const today = new Date().toLocaleDateString();
        const period = fromDate && toDate ? `Period: ${fromDate} to ${toDate}` : '';
        const headers = ['#', 'Name', 'Email', 'Department', 'Position', 'Salary', 'Status'];
        const rows = tableData.map(r => `<tr>${r.map(c => `<td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${c}</td>`).join('')}</tr>`).join('');

        const html = `
            <html><head><meta charset="UTF-8"></head><body>
            <div style="text-align:center;color:${brown};font-size:20px;font-weight:bold;font-family:Arial">MUHIZI CONSTRUCTION</div>
            <div style="text-align:center;color:${brown};font-size:11px;font-family:Arial;margin-bottom:4px">Building Your Vision, Delivering Excellence</div>
            <hr style="border:1px solid ${brown}" />
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;color:${brown};font-family:Arial;margin:6px 0">
                <span>Employees Report</span>
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
        a.href = url; a.download = 'employees.xls'; a.click();
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
        active: data.filter(d => d.status === 'active').length,
        inactive: data.filter(d => d.status === 'inactive').length,
        terminated: data.filter(d => d.status === 'terminated').length,
        totalSalary: data.reduce((s, d) => s + d.salary, 0),
    }), [data]);

    const openNew = () => { setEditing(null); setForm(emptyForm); setModalPos(null); setShowModal(true); };
    const openEdit = (item: Employee) => {
        setEditing(item);
        setForm({
            firstName: item.firstName, lastName: item.lastName, email: item.email,
            phone: item.phone || '', gender: item.gender || '', maritalStatus: item.maritalStatus || '',
            nationalId: item.nationalId || '', educationLevel: item.educationLevel || '',
            address: item.address || '', emergencyContact: item.emergencyContact || '',
            position: item.position || '', department: item.department,
            hireDate: item.hireDate || '', salary: item.salary ? Number(item.salary) : '', status: item.status,
            avatar: item.avatar || '', documents: item.documents || [],
        });
        setModalPos(null);
        setShowModal(true);
    };

    const loadContracts = (employeeId: string) => {
        setViewContractsLoading(true);
        return contractsService.getByEmployee(employeeId)
            .then(res => setViewContracts(res.data || []))
            .catch(() => setViewContracts([]))
            .finally(() => setViewContractsLoading(false));
    };

    const openView = (item: Employee) => {
        setViewItem(item);
        setViewContracts(null);
        if (canSeeContracts) loadContracts(item.id);
    };

    const handleSave = async () => {
        if (!form.firstName.trim() || !form.lastName.trim()) {
            showToast('First and last name are required', 'error');
            return;
        }
        if (!form.email.trim()) {
            showToast('Email is required', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                phone: form.phone || undefined,
                gender: form.gender || undefined,
                maritalStatus: form.maritalStatus || undefined,
                nationalId: form.nationalId || undefined,
                educationLevel: form.educationLevel || undefined,
                address: form.address || undefined,
                emergencyContact: form.emergencyContact || undefined,
                position: form.position || undefined,
                department: form.department,
                hireDate: form.hireDate || null,
                salary: form.salary === '' ? 0 : form.salary,
                status: form.status,
                avatar: form.avatar || undefined,
                documents: form.documents,
            };
            if (editing) {
                await hrService.updateEmployee(editing.id, payload);
                showToast('Employee updated successfully', 'success');
            } else {
                await hrService.createEmployee(payload);
                showToast('Employee registered successfully', 'success');
            }
            setShowModal(false);
            fetch();
        } catch (e: any) {
            showToast(extractErrorMessage(e, 'Failed to save employee'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await hrService.deleteEmployee(deleteTarget.id);
            showToast('Employee removed', 'success');
            setDeleteTarget(null);
            fetch();
        } catch (e) {
            showToast(extractErrorMessage(e, 'Failed to delete employee'), 'error');
        } finally {
            setDeleting(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingAvatar(true);
        try {
            const uploaded = await uploadService.uploadFile(file);
            setForm(p => ({ ...p, avatar: uploaded.secureUrl }));
        } catch {
            showToast('Failed to upload photo', 'error');
        } finally {
            setUploadingAvatar(false);
            if (avatarInputRef.current) avatarInputRef.current.value = '';
        }
    };

    const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingDoc(true);
        try {
            const uploaded = await uploadService.uploadFile(file);
            setForm(p => ({ ...p, documents: [...p.documents, { name: `${docType} — ${uploaded.originalFilename || file.name}`, url: uploaded.secureUrl }] }));
            showToast('Document uploaded', 'success');
        } catch {
            showToast('Failed to upload document', 'error');
        } finally {
            setUploadingDoc(false);
            if (docInputRef.current) docInputRef.current.value = '';
        }
    };

    const removeDoc = (idx: number) => setForm(p => ({ ...p, documents: p.documents.filter((_, i) => i !== idx) }));

    const openContractModal = () => {
        setContractForm(emptyContractForm);
        setContractFile(null);
        setContractModal(true);
    };

    const handleCreateContract = async () => {
        if (!viewItem) return;
        if (!contractForm.title.trim() || !contractForm.startDate) {
            showToast('Contract title and start date are required', 'error');
            return;
        }
        setSavingContract(true);
        try {
            let fileUrl: string | undefined;
            let fileSize: string | undefined;
            if (contractFile) {
                const uploaded = await uploadService.uploadFile(contractFile);
                fileUrl = uploaded.secureUrl;
                fileSize = uploaded.bytes ? `${(uploaded.bytes / 1024).toFixed(1)} KB` : undefined;
            }
            await contractsService.create({
                title: contractForm.title.trim(),
                employeeId: viewItem.id,
                employeeName: `${viewItem.firstName} ${viewItem.lastName}`,
                department: viewItem.department,
                type: contractForm.type.toLowerCase().replace(' ', '_') as Contract['type'],
                startDate: contractForm.startDate,
                endDate: contractForm.endDate || undefined,
                status: 'active',
                fileUrl,
                fileSize,
            });
            showToast('Contract added to employee record', 'success');
            setContractModal(false);
            loadContracts(viewItem.id);
        } catch (e) {
            showToast(extractErrorMessage(e, 'Failed to save contract'), 'error');
        } finally {
            setSavingContract(false);
        }
    };


    const statusColors: Record<string, string> = {
        active: '#22c55e', inactive: '#f59e0b', terminated: '#ef4444',
    };

    return (
        <div className="admin-page">
            <div style={{ marginBottom: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, flexShrink: 0 }}>
                    <FaUsers style={{ color: 'var(--primary)' }} /> Employees
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.6rem', marginTop: '0.75rem', marginBottom: '1.25rem' }}>
                    <StatTile icon={<FaUsers />} label="Total" value={String(stats.total)} accent="#1B2042" emphasis />
                    <StatTile icon={<FaCheckCircle />} label="Active" value={String(stats.active)} accent="#22c55e" />
                    <StatTile icon={<FaTimesCircle />} label="Inactive" value={String(stats.inactive)} accent="#6b7280" />
                    <StatTile icon={<FaBan />} label="Terminated" value={String(stats.terminated)} accent="#ef4444" />
                    <StatTile icon={<FaDollarSign />} label="Total Salary" value={`RWF ${stats.totalSalary.toLocaleString()}`} accent="#f59e0b" />
                </div>
            </div>

            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>All Employees</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input type="text" className="form-input" placeholder="Search name, email, department..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 400 }} />
                        <input type="date" className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 140 }} title="From date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} />
                        <input type="date" className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 140 }} title="To date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} />
                        <button className="admin-btn" onClick={downloadExcel} title="Download as Excel — for records, sharing, or uploading elsewhere as evidence" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.6rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, opacity: 1 }}>
                            <FaFileExcel /> Excel
                        </button>
                        <button className="admin-btn" onClick={downloadPDF} title="Download as PDF — for records, sharing, or uploading elsewhere as evidence" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.6rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, opacity: 1 }}>
                            <FaFilePdf /> PDF
                        </button>
                        {canManage && (
                            <button className="admin-btn" onClick={openNew} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.6rem 1.5rem', fontSize: '0.95rem' }}>
                                <FaPlus style={{ marginRight: 6 }} />Add Employee
                            </button>
                        )}
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th><th>Email</th><th>Department</th><th>Position</th><th>Salary</th><th>Status</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {item.avatar ? (
                                                <img src={item.avatar} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                            ) : (
                                                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>
                                                    {(item.firstName?.[0] || '') + (item.lastName?.[0] || '')}
                                                </div>
                                            )}
                                            <strong style={{ cursor: 'pointer' }} onClick={() => openView(item)}
                                                onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.textDecoration = 'underline'; }}
                                                onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.textDecoration = 'none'; }}>
                                                {item.firstName} {item.lastName}
                                            </strong>
                                        </div>
                                    </td>
                                    <td>{item.email}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{item.department}</td>
                                    <td>{item.position || '—'}</td>
                                    <td>RWF {item.salary?.toLocaleString() || '—'}</td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600,
                                            color: '#fff', background: statusColors[item.status] || '#6b7280',
                                        }}>{item.status}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => openView(item)} title="View full profile"><FaEye /></button>
                                            {canManage && (
                                                <>
                                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => openEdit(item)} title="Edit"><FaEdit /></button>
                                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem', color: 'var(--primary-red)' }} onClick={() => setDeleteTarget(item)} title="Delete"><FaTrash /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <FaUsers size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                                    <div>{canManage ? 'No employees found. Click "Add Employee" to create one.' : 'No employees registered yet.'}</div>
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
                            <select
                                className="form-select"
                                style={{ width: 'auto', padding: '0.3rem 1.5rem 0.3rem 0.5rem', fontSize: '0.8rem' }}
                                value={pageSize}
                                onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}
                            >
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
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ left: modalPos?.x ?? '50%', top: modalPos?.y ?? '50%', transform: modalPos ? 'none' : 'translate(-50%, -50%)', maxWidth: 700, maxHeight: '88vh', overflowY: 'auto' }}>
                        <div className="admin-modal-header" onMouseDown={onHeaderMouseDown}>
                            <h3><FaArrowsAlt style={{ fontSize: '0.75rem', marginRight: 8, opacity: 0.5 }} />{editing ? 'Edit' : 'Register New'} Employee</h3>
                            <button onClick={() => !saving && setShowModal(false)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    {form.avatar ? (
                                        <img src={form.avatar} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }} />
                                    ) : (
                                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 700 }}>
                                            {(form.firstName?.[0] || '') + (form.lastName?.[0] || '') || <FaUsers />}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                                    <button type="button" className="admin-btn admin-btn--secondary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
                                        onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}>
                                        {uploadingAvatar ? <FaSpinner className="spin" size={11} /> : <FaCamera size={11} />} {form.avatar ? 'Change Photo' : 'Upload Photo'}
                                    </button>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>Passport-style photo for the employee ID and profile.</p>
                                </div>
                            </div>

                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '1.1rem 0 0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <FaIdCard size={11} /> Personal Information
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">First Name</label>
                                    <input className="form-input" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} placeholder="First name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name</label>
                                    <input className="form-input" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Last name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Gender</label>
                                    <select className="form-select" value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                                        <option value="">Not specified</option>
                                        {GENDERS.map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Marital Status</label>
                                    <select className="form-select" value={form.maritalStatus} onChange={e => setForm(p => ({ ...p, maritalStatus: e.target.value }))}>
                                        <option value="">Not specified</option>
                                        {MARITAL_STATUSES.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">National ID / Passport No.</label>
                                    <input className="form-input" value={form.nationalId} disabled={!!(editing && editing.nationalId)}
                                        onChange={e => setForm(p => ({ ...p, nationalId: e.target.value }))} placeholder="1198000123456789"
                                        style={editing && editing.nationalId ? { opacity: 0.6, cursor: 'not-allowed' } : undefined} />
                                    {editing && editing.nationalId && (
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.25rem 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <FaLock size={8} /> Locked after registration
                                        </p>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Education Level</label>
                                    <select className="form-select" value={form.educationLevel} onChange={e => setForm(p => ({ ...p, educationLevel: e.target.value }))}>
                                        <option value="">Not specified</option>
                                        {EDUCATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Residential Address</label>
                                    <input className="form-input" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="e.g. Kicukiro, Kigali, Rwanda" />
                                </div>
                            </div>

                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '1.25rem 0 0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <FaHeartbeat size={11} /> Contact &amp; Emergency
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+250 788 000 000" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-input" value={form.email} disabled={!!editing}
                                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@company.com"
                                        style={editing ? { opacity: 0.6, cursor: 'not-allowed' } : undefined} />
                                    {editing && (
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                                            Locked after registration — it's how attendance, payroll and assignment history are matched to this employee.
                                        </p>
                                    )}
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Emergency Contact</label>
                                    <input className="form-input" value={form.emergencyContact} onChange={e => setForm(p => ({ ...p, emergencyContact: e.target.value }))} placeholder="Name — Relationship — Phone number" />
                                </div>
                            </div>

                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '1.25rem 0 0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <FaUserTie size={11} /> Employment Details
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Position / Trade</label>
                                    <input className="form-input" value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} placeholder="e.g. Site Foreman, Mason, Electrician" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Department</label>
                                    <select className="form-select" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Hire Date</label>
                                    <input type="date" className="form-input" value={form.hireDate} onChange={e => setForm(p => ({ ...p, hireDate: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Salary (RWF)</label>
                                    <input type="number" className="form-input" value={form.salary || ''} onChange={e => setForm(p => ({ ...p, salary: e.target.value === '' ? '' : Number(e.target.value) }))} placeholder="e.g. 500000" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="terminated">Terminated</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '1.25rem 0 0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <FaGraduationCap size={11} /> Documents (CV, ID, Certificates)
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <select className="form-select" value={docType} onChange={e => setDocType(e.target.value)} style={{ maxWidth: 220 }}>
                                    {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <input ref={docInputRef} type="file" style={{ display: 'none' }} onChange={handleDocUpload} />
                                <button type="button" className="admin-btn admin-btn--secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
                                    onClick={() => docInputRef.current?.click()} disabled={uploadingDoc}>
                                    {uploadingDoc ? <FaSpinner className="spin" size={11} /> : <FaUpload size={11} />} Upload
                                </button>
                            </div>
                            {form.documents.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: '0.6rem' }}>
                                    {form.documents.map((d, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-body)', borderRadius: 8, padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}>
                                            <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                <FaFileAlt size={11} /> {d.name}
                                            </a>
                                            <button type="button" onClick={() => removeDoc(i)} title="Remove" style={{ background: 'none', border: 'none', color: 'var(--primary-red)', cursor: 'pointer', flexShrink: 0, marginLeft: 8 }}>
                                                <FaTimesIcon size={11} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
                            <button className="admin-btn" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : (editing ? 'Save Changes' : 'Register Employee')}</button>
                        </div>
                    </div>
                </div>
            )}

            {viewItem && (() => {
                const initials = `${viewItem.firstName?.[0] || ''}${viewItem.lastName?.[0] || ''}`.toUpperCase();
                const field = (label: string, value: React.ReactNode, locked?: boolean) => (
                    <div>
                        <div style={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {label} {locked && <FaLock size={8} title="Locked after registration" />}
                        </div>
                        <div style={{ fontSize: '0.85rem' }}>{value || '—'}</div>
                    </div>
                );
                return (
                    <div className="admin-modal-overlay" onClick={() => setViewItem(null)}>
                        <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: 640, maxHeight: '85vh', overflowY: 'auto', borderRadius: 12 }}>
                            <div className="admin-modal-header" style={{ padding: '1rem 1.25rem' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.05rem' }}>
                                    <FaUsers style={{ color: 'var(--primary)' }} /> Employee Profile
                                </h3>
                                <button onClick={() => setViewItem(null)}><FaTimesIcon /></button>
                            </div>
                            <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    {viewItem.avatar ? (
                                        <img src={viewItem.avatar} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-color)' }} />
                                    ) : (
                                        <div style={{
                                            width: 52, height: 52, borderRadius: '50%', background: 'var(--primary)', color: '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', fontWeight: 700, flexShrink: 0,
                                        }}>{initials || <FaUsers />}</div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>{viewItem.firstName} {viewItem.lastName}</div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                            {viewItem.position || 'No position set'} · <span style={{ textTransform: 'capitalize' }}>{viewItem.department}</span>
                                        </div>
                                    </div>
                                    <span style={{
                                        display: 'inline-block', padding: '3px 12px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
                                        color: '#fff', background: statusColors[viewItem.status] || '#6b7280', textTransform: 'capitalize',
                                    }}>{viewItem.status}</span>
                                </div>

                                <div style={{ background: '#1B204210', borderRadius: 10, padding: '0.85rem 1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <FaDollarSign size={12} /> Pay
                                    </span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>RWF {viewItem.salary?.toLocaleString() || '0'}</span>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <FaIdCard size={11} /> Registration Details
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', background: '#f9f9f9', borderRadius: 8, padding: '0.75rem 0.9rem' }}>
                                        {field('Email', viewItem.email, true)}
                                        {field('Phone', viewItem.phone)}
                                        {field('National ID', viewItem.nationalId, !!viewItem.nationalId)}
                                        {field('Address', viewItem.address)}
                                        {field('Gender', viewItem.gender && <span style={{ textTransform: 'capitalize' }}>{viewItem.gender}</span>)}
                                        {field('Marital Status', viewItem.maritalStatus && <span style={{ textTransform: 'capitalize' }}>{viewItem.maritalStatus}</span>)}
                                        {field('Education', viewItem.educationLevel)}
                                        {field('Emergency Contact', viewItem.emergencyContact)}
                                        {field('Hire Date', viewItem.hireDate && new Date(viewItem.hireDate).toLocaleDateString())}
                                        {field('Department', <span style={{ textTransform: 'capitalize' }}>{viewItem.department}</span>)}
                                    </div>
                                </div>

                                {canSeeContracts && (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <FaFileAlt size={11} /> Contracts
                                            </div>
                                            {canManageContracts && (
                                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }} onClick={openContractModal}>
                                                    <FaPlus size={9} /> Add Contract
                                                </button>
                                            )}
                                        </div>
                                        {viewContractsLoading ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem', color: '#999', fontSize: '0.8rem' }}>
                                                <FaSpinner className="spin" /> Loading contracts...
                                            </div>
                                        ) : !viewContracts || viewContracts.length === 0 ? (
                                            <div style={{ fontSize: '0.8rem', color: '#999' }}>No contracts on file for this employee.</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                {viewContracts.map(c => (
                                                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9f9f9', borderRadius: 8, padding: '0.55rem 0.8rem', fontSize: '0.82rem' }}>
                                                        <div>
                                                            <strong>{c.title}</strong>
                                                            <div style={{ fontSize: '0.72rem', color: '#999', textTransform: 'capitalize' }}>
                                                                {c.type.replace('_', ' ')} · {c.startDate}{c.endDate ? ` to ${c.endDate}` : ''}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span style={{
                                                                fontSize: '0.7rem', fontWeight: 600, padding: '2px 10px', borderRadius: 10,
                                                                color: '#fff', background: CONTRACT_STATUS_COLORS[c.status] || '#6b7280', textTransform: 'capitalize',
                                                            }}>{c.status.replace('_', ' ')}</span>
                                                            {c.fileUrl && (
                                                                <a href={c.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }} title="View document">
                                                                    <FaDownload size={12} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {viewItem.documents && viewItem.documents.length > 0 && (
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <FaFileAlt size={11} /> Documents
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            {viewItem.documents.map((d, i) => (
                                                <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{d.name}</a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="admin-modal-footer">
                                <button className="admin-btn admin-btn--secondary" onClick={() => setViewItem(null)}>Close</button>
                                {canManage && (
                                    <button className="admin-btn" onClick={() => { const item = viewItem; setViewItem(null); openEdit(item); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <FaEdit size={11} /> Edit
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {contractModal && viewItem && (
                <div className="admin-modal-overlay" onClick={() => !savingContract && setContractModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: 480, borderRadius: 12 }}>
                        <div className="admin-modal-header" style={{ padding: '0.9rem 1.1rem' }}>
                            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FaFileSignature style={{ color: 'var(--primary)' }} /> Add Contract — {viewItem.firstName} {viewItem.lastName}
                            </h3>
                            <button onClick={() => !savingContract && setContractModal(false)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div className="form-group">
                                <label className="form-label">Contract Title</label>
                                <input className="form-input" placeholder="e.g. Employment Contract — Site Foreman" value={contractForm.title}
                                    onChange={e => setContractForm(p => ({ ...p, title: e.target.value }))} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select className="form-select" value={contractForm.type} onChange={e => setContractForm(p => ({ ...p, type: e.target.value }))}>
                                        {CONTRACT_TYPES.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input type="date" className="form-input" value={contractForm.startDate} onChange={e => setContractForm(p => ({ ...p, startDate: e.target.value }))} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">End Date <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                                <input type="date" className="form-input" min={contractForm.startDate || undefined} value={contractForm.endDate} onChange={e => setContractForm(p => ({ ...p, endDate: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Contract File <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                                <input ref={contractFileInputRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }} onChange={e => setContractFile(e.target.files?.[0] || null)} />
                                <div onClick={() => contractFileInputRef.current?.click()}
                                    style={{ border: '2px dashed var(--border-color)', borderRadius: 10, padding: '0.85rem', textAlign: 'center', cursor: 'pointer' }}>
                                    {contractFile ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                            <FaFilePdf size={16} style={{ color: '#ef4444' }} />
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{contractFile.name}</span>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                            <FaUpload size={12} /> Click to attach a PDF
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setContractModal(false)} disabled={savingContract}>Cancel</button>
                            <button className="admin-btn" onClick={handleCreateContract} disabled={savingContract}>
                                {savingContract ? 'Saving...' : 'Save Contract'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteTarget && (
                <div className="admin-modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: 420, borderRadius: 12 }}>
                        <div className="admin-modal-header" style={{ padding: '0.9rem 1.1rem' }}>
                            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FaExclamationTriangle style={{ color: 'var(--primary-red)' }} /> Remove Employee
                            </h3>
                            <button onClick={() => !deleting && setDeleteTarget(null)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            <p style={{ fontSize: '0.88rem', margin: 0 }}>
                                Permanently delete the record for <strong>{deleteTarget.firstName} {deleteTarget.lastName}</strong>? This cannot be undone.
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
                                {deleting ? 'Deleting...' : 'Delete Employee'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;
