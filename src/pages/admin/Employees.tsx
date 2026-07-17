import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    FaEdit, FaTrash, FaPlus, FaTimes as FaTimesIcon, FaUsers, FaUserCheck, FaUserTimes, FaDollarSign,
    FaFileExcel, FaFilePdf, FaArrowsAlt, FaChevronLeft, FaChevronRight, FaEye, FaIdCard, FaLock, FaFileAlt, FaSpinner,
} from 'react-icons/fa';
import { hrService } from '../../services/hrService';
import { contractsService, type Contract } from '../../services/contractsService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import type { Employee } from '../../services/hrService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CONTRACT_STATUS_COLORS: Record<string, string> = {
    active: '#22c55e', expiring_soon: '#f59e0b', expired: '#ef4444', draft: '#6b7280',
};

interface FormData {
    firstName: string; lastName: string; email: string; phone: string;
    position: string; department: string; hireDate: string; salary: number | ''; status: string;
}

const emptyForm: FormData = {
    firstName: '', lastName: '', email: '', phone: '',
    position: '', department: 'construction', hireDate: '', salary: '', status: 'active',
};

const DEPARTMENTS = ['construction', 'engineering', 'design', 'finance', 'hr', 'admin', 'sales', 'marketing', 'logistics', 'safety'];
const PAGE_SIZES = [5, 10, 15, 20];

const Employees = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    // Admin views the employee registry read-only — registration and edits belong to
    // the field/HR roles (Site Manager, Site Engineer) who actually onboard workers.
    const canManage = user?.role !== 'admin';
    // Contract terms are Finance Director's domain — Admin sees them as a
    // read-only report on the employee's profile, matching the backend guard.
    const canSeeContracts = user?.role === 'admin' || user?.role === 'finance_director';
    const [data, setData] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Employee | null>(null);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [viewItem, setViewItem] = useState<Employee | null>(null);
    const [viewContracts, setViewContracts] = useState<Contract[] | null>(null);
    const [viewContractsLoading, setViewContractsLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [modalPos, setModalPos] = useState<{ x: number; y: number } | null>(null);
    const dragging = useRef<{ offsetX: number; offsetY: number } | null>(null);

    const fetch = async () => {
        try {
            const res = await hrService.getEmployees();
            setData(res.data || []);
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
            phone: item.phone || '', position: item.position || '', department: item.department,
            hireDate: item.hireDate || '', salary: item.salary ? Number(item.salary) : '', status: item.status,
        });
        setModalPos(null);
        setShowModal(true);
    };

    const openView = (item: Employee) => {
        setViewItem(item);
        setViewContracts(null);
        if (canSeeContracts) {
            setViewContractsLoading(true);
            contractsService.getByEmployee(item.id)
                .then(res => setViewContracts(res.data || []))
                .catch(() => setViewContracts([]))
                .finally(() => setViewContractsLoading(false));
        }
    };

    const handleSave = async () => {
        try {
            const payload = {
                ...form,
                hireDate: form.hireDate || null,
                salary: form.salary === '' ? 0 : form.salary,
            };
            if (editing) {
                await hrService.updateEmployee(editing.id, payload);
                showToast('Employee updated successfully', 'success');
            } else {
                await hrService.createEmployee(payload);
                showToast('Employee created successfully', 'success');
            }
            setShowModal(false);
            fetch();
        } catch (e: any) {
            const message = e?.response?.data?.message;
            const errMsg = Array.isArray(message) ? message.join('. ') : (typeof message === 'string' ? message : 'Failed to save employee');
            showToast(errMsg, 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this employee?')) return;
        try { await hrService.deleteEmployee(id); fetch(); }
        catch (e) { console.error(e); }
    };

    if (loading) return <div className="admin-page"><div className="inline-spinner">Loading employees...</div></div>;

    const statusColors: Record<string, string> = {
        active: '#22c55e', inactive: '#f59e0b', terminated: '#ef4444',
    };

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, flexShrink: 0 }}>
                    <FaUsers style={{ color: 'var(--primary)' }} /> Employees
                </h2>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#1B2042', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{stats.total}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Total</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#1B2042', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{stats.active}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Active</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#1B2042', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{stats.inactive}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Inactive</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#1B2042', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{stats.terminated}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Terminated</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#1B2042', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>RWF {stats.totalSalary.toLocaleString()}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Total Salary</div>
                    </div>
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
                                        <strong style={{ cursor: 'pointer' }} onClick={() => openView(item)}
                                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.textDecoration = 'underline'; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.textDecoration = 'none'; }}>
                                            {item.firstName} {item.lastName}
                                        </strong>
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
                                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem', color: 'var(--primary-red)' }} onClick={() => handleDelete(item.id)} title="Delete"><FaTrash /></button>
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
                <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ left: modalPos?.x ?? '50%', top: modalPos?.y ?? '50%', transform: modalPos ? 'none' : 'translate(-50%, -50%)' }}>
                        <div className="admin-modal-header" onMouseDown={onHeaderMouseDown}>
                            <h3><FaArrowsAlt style={{ fontSize: '0.75rem', marginRight: 8, opacity: 0.5 }} />{editing ? 'Edit' : 'Add'} Employee</h3>
                            <button onClick={() => setShowModal(false)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
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
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+250 788 000 000" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Position</label>
                                    <input className="form-input" value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} placeholder="Job title" />
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
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="admin-btn" onClick={handleSave}>Save</button>
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
                        <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: 620, maxHeight: '85vh', overflowY: 'auto', borderRadius: 12 }}>
                            <div className="admin-modal-header" style={{ padding: '1rem 1.25rem' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.05rem' }}>
                                    <FaUsers style={{ color: 'var(--primary)' }} /> Employee Profile
                                </h3>
                                <button onClick={() => setViewItem(null)}><FaTimesIcon /></button>
                            </div>
                            <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{
                                        width: 52, height: 52, borderRadius: '50%', background: 'var(--primary)', color: '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', fontWeight: 700, flexShrink: 0,
                                    }}>{initials || <FaUsers />}</div>
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
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <FaFileAlt size={11} /> Contracts
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
                                                                    <FaFileAlt size={12} />
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
        </div>
    );
};

export default Employees;
