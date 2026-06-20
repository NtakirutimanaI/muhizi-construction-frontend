import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FaEdit, FaTrash, FaPlus, FaTimes as FaTimesIcon, FaDollarSign, FaMoneyBillWave, FaPercentage, FaFileExcel, FaFilePdf, FaArrowsAlt, FaChevronLeft, FaChevronRight, FaCalendarAlt, FaCheckCircle, FaBan, FaHourglassHalf, FaClock } from 'react-icons/fa';
import { hrService } from '../../services/hrService';
import type { Payroll, Employee, Attendance } from '../../services/hrService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FormData {
    employeeId: string; month: number; year: number;
    basicSalary: number; allowances: { label: string; amount: number }[];
    deductions: { label: string; amount: number }[];
    totalAllowances: number; totalDeductions: number; netSalary: number; status: string;
}

const emptyForm: FormData = {
    employeeId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(),
    basicSalary: 0, allowances: [], deductions: [], totalAllowances: 0, totalDeductions: 0, netSalary: 0, status: 'draft',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const PAGE_SIZES = [5, 10, 15, 20];

const PayrollPage = () => {
    const [data, setData] = useState<Payroll[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Payroll | null>(null);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [search, setSearch] = useState('');
    const [filterMonth, setFilterMonth] = useState<number>(0);
    const [filterYear, setFilterYear] = useState<number>(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [modalPos, setModalPos] = useState<{ x: number; y: number } | null>(null);
    const dragging = useRef<{ offsetX: number; offsetY: number } | null>(null);
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [attendanceStats, setAttendanceStats] = useState<{ present: number; absent: number; late: number; halfDay: number; onLeave: number } | null>(null);

    const getEmployeeName = useCallback((id: string) => {
        const emp = employees.find(e => e.id === id);
        return emp ? `${emp.firstName} ${emp.lastName}` : id;
    }, [employees]);

    const fetch = async () => {
        try {
            const [payRes, empRes] = await Promise.all([
                hrService.getPayroll(),
                hrService.getEmployees(),
            ]);
            setData(payRes.data || []);
            setEmployees(empRes.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(); }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return data.filter(d => {
            const name = getEmployeeName(d.employeeId).toLowerCase();
            if (q && !name.includes(q) && !d.status.toLowerCase().includes(q)) return false;
            if (filterMonth && d.month !== filterMonth) return false;
            if (filterYear && d.year !== filterYear) return false;
            return true;
        });
    }, [data, search, filterMonth, filterYear, getEmployeeName]);

    const totalPages = pageSize === 0 ? 1 : Math.ceil(filtered.length / pageSize);
    const paginated = useMemo(() => {
        if (pageSize === 0) return filtered;
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages || 1);
    }, [totalPages, page]);

    const canDownload = filterMonth > 0 || filterYear > 0 || search.trim().length > 0;

    const employeeMap = useMemo(() => {
        const map: Record<string, string> = {};
        employees.forEach(e => { map[e.id] = `${e.firstName} ${e.lastName}`; });
        return map;
    }, [employees]);

    const tableData = useMemo(() => filtered.map((d, i) => [
        String(i + 1),
        employeeMap[d.employeeId] || d.employeeId,
        `${MONTHS[d.month - 1]} ${d.year}`,
        `RWF ${d.basicSalary.toLocaleString()}`,
        `RWF ${(d.totalAllowances || 0).toLocaleString()}`,
        `RWF ${(d.totalDeductions || 0).toLocaleString()}`,
        `RWF ${d.netSalary.toLocaleString()}`,
        d.status,
    ]), [filtered, employeeMap]);

    const downloadPDF = () => {
        const doc = new jsPDF();
        const brown = '#8B4513';
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
        doc.text('Payroll Report', 14, titleY);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#666');
        const today = new Date().toLocaleDateString();
        const periodStr = filterMonth && filterYear ? ` | Period: ${MONTHS[filterMonth - 1]} ${filterYear}` : '';
        doc.text(`Generated: ${today}${periodStr}`, pageW - 14, titleY, { align: 'right' });

        autoTable(doc, {
            head: [['#', 'Employee', 'Period', 'Basic', 'Allowances', 'Deductions', 'Net', 'Status']],
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

        doc.save('payroll.pdf');
    };

    const downloadExcel = () => {
        const brown = '#8B4513';
        const today = new Date().toLocaleDateString();
        const period = filterMonth && filterYear ? `Period: ${MONTHS[filterMonth - 1]} ${filterYear}` : '';
        const headers = ['#', 'Employee', 'Period', 'Basic', 'Allowances', 'Deductions', 'Net', 'Status'];
        const rows = tableData.map(r => `<tr>${r.map(c => `<td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${c}</td>`).join('')}</tr>`).join('');

        const html = `
            <html><head><meta charset="UTF-8"></head><body>
            <div style="text-align:center;color:${brown};font-size:20px;font-weight:bold;font-family:Arial">MUHIZI CONSTRUCTION</div>
            <div style="text-align:center;color:${brown};font-size:11px;font-family:Arial;margin-bottom:4px">Building Your Vision, Delivering Excellence</div>
            <hr style="border:1px solid ${brown}" />
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;color:${brown};font-family:Arial;margin:6px 0">
                <span>Payroll Report</span>
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
        a.href = url; a.download = 'payroll.xls'; a.click();
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

    const loadAttendanceForModal = useCallback(async (employeeId: string, month: number, year: number) => {
        if (!employeeId || !month || !year) { setAttendanceStats(null); return; }
        setAttendanceLoading(true);
        setAttendanceStats(null);
        try {
            const res = await hrService.getAttendanceByEmployee(employeeId);
            const records: Attendance[] = res.data || [];
            const daysInMonth = new Date(year, month, 0).getDate();
            const monthRecords = records.filter(r => {
                const d = new Date(r.date);
                return d.getMonth() + 1 === month && d.getFullYear() === year;
            });
            setAttendanceStats({
                present: monthRecords.filter(r => r.status === 'present').length,
                absent: monthRecords.filter(r => r.status === 'absent').length,
                late: monthRecords.filter(r => r.status === 'late').length,
                halfDay: monthRecords.filter(r => r.status === 'half_day').length,
                onLeave: monthRecords.filter(r => r.status === 'on_leave').length,
            });
            const totalDays = daysInMonth;
            const recordedDays = monthRecords.length;
            if (recordedDays > 0 && monthRecords.some(r => r.status === 'present' || r.status === 'late' || r.status === 'half_day')) {
                const nonAbsent = monthRecords.filter(r => r.status !== 'absent').length;
                const ratio = nonAbsent / recordedDays;
                const emp = employees.find(e => e.id === employeeId);
                if (emp && emp.salary > 0) {
                    const suggestedBasic = Math.round(emp.salary * ratio);
                    setForm(p => ({ ...p, basicSalary: suggestedBasic }));
                }
            } else {
                const emp = employees.find(e => e.id === employeeId);
                if (emp) setForm(p => ({ ...p, basicSalary: emp.salary }));
            }
        } catch (e) { console.error(e); }
        finally { setAttendanceLoading(false); }
    }, [employees]);

    useEffect(() => {
        if (form.employeeId && form.month && form.year && showModal) {
            loadAttendanceForModal(form.employeeId, form.month, form.year);
        }
    }, [form.employeeId, form.month, form.year, showModal, loadAttendanceForModal]);

    const calcNet = useCallback((basic: number, allowances: { label: string; amount: number }[], deductions: { label: string; amount: number }[]) => {
        const ta = allowances.reduce((s, a) => s + (a.amount || 0), 0);
        const td = deductions.reduce((s, d) => s + (d.amount || 0), 0);
        return { totalAllowances: ta, totalDeductions: td, netSalary: basic + ta - td };
    }, []);

    const addAllowance = () => setForm(p => ({ ...p, allowances: [...p.allowances, { label: '', amount: 0 }] }));
    const addDeduction = () => setForm(p => ({ ...p, deductions: [...p.deductions, { label: '', amount: 0 }] }));
    const updateAllowance = (i: number, field: 'label' | 'amount', value: string | number) => {
        setForm(p => {
            const a = [...p.allowances];
            a[i] = { ...a[i], [field]: value };
            const { totalAllowances, totalDeductions, netSalary } = calcNet(p.basicSalary, a, p.deductions);
            return { ...p, allowances: a, totalAllowances, totalDeductions, netSalary };
        });
    };
    const updateDeduction = (i: number, field: 'label' | 'amount', value: string | number) => {
        setForm(p => {
            const d = [...p.deductions];
            d[i] = { ...d[i], [field]: value };
            const { totalAllowances, totalDeductions, netSalary } = calcNet(p.basicSalary, p.allowances, d);
            return { ...p, deductions: d, totalAllowances, totalDeductions, netSalary };
        });
    };
    const removeAllowance = (i: number) => {
        setForm(p => {
            const a = p.allowances.filter((_, idx) => idx !== i);
            const { totalAllowances, totalDeductions, netSalary } = calcNet(p.basicSalary, a, p.deductions);
            return { ...p, allowances: a, totalAllowances, totalDeductions, netSalary };
        });
    };
    const removeDeduction = (i: number) => {
        setForm(p => {
            const d = p.deductions.filter((_, idx) => idx !== i);
            const { totalAllowances, totalDeductions, netSalary } = calcNet(p.basicSalary, p.allowances, d);
            return { ...p, deductions: d, totalAllowances, totalDeductions, netSalary };
        });
    };

    const totals = useMemo(() => ({
        basic: data.reduce((s, r) => s + r.basicSalary, 0),
        allowances: data.reduce((s, r) => s + (r.totalAllowances || 0), 0),
        deductions: data.reduce((s, r) => s + (r.totalDeductions || 0), 0),
        net: data.reduce((s, r) => s + r.netSalary, 0),
        count: data.length,
        paid: data.filter(r => r.status === 'paid').length,
    }), [data]);

    const openNew = () => {
        setEditing(null);
        setForm(emptyForm);
        setAttendanceStats(null);
        setModalPos(null);
        setShowModal(true);
    };

    const openEdit = (item: Payroll) => {
        setEditing(item);
        setForm({
            employeeId: item.employeeId, month: item.month, year: item.year,
            basicSalary: item.basicSalary,
            allowances: item.allowances || [],
            deductions: item.deductions || [],
            totalAllowances: item.totalAllowances || 0,
            totalDeductions: item.totalDeductions || 0,
            netSalary: item.netSalary,
            status: item.status,
        });
        setAttendanceStats(null);
        setModalPos(null);
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                ...form,
                totalAllowances: form.allowances.reduce((s, a) => s + (a.amount || 0), 0),
                totalDeductions: form.deductions.reduce((s, d) => s + (d.amount || 0), 0),
                netSalary: form.basicSalary + form.allowances.reduce((s, a) => s + (a.amount || 0), 0) - form.deductions.reduce((s, d) => s + (d.amount || 0), 0),
            };
            if (editing) await hrService.updatePayroll(editing.id, payload);
            else await hrService.createPayroll(payload);
            setShowModal(false);
            fetch();
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this payroll record?')) return;
        try { await hrService.deletePayroll(id); fetch(); }
        catch (e) { console.error(e); }
    };

    if (loading) return <div className="admin-page"><div className="inline-spinner">Loading payroll...</div></div>;

    const statusColors: Record<string, string> = {
        draft: '#6b7280', paid: '#22c55e', pending: '#f59e0b',
    };

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, flexShrink: 0 }}>
                    <FaDollarSign style={{ color: 'var(--primary)' }} /> Payroll
                </h2>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>RWF {totals.net.toLocaleString()}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Total Payroll</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>RWF {totals.basic.toLocaleString()}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Basic Salary</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>RWF {totals.allowances.toLocaleString()}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Allowances</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>RWF {totals.deductions.toLocaleString()}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Deductions</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{totals.count}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Records</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{totals.paid}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Paid</div>
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>All Payroll Records</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input type="text" className="form-input" placeholder="Search employee, status..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 260 }} />
                        <select className="form-select" style={{ width: 130, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }} value={filterMonth} onChange={e => { setFilterMonth(Number(e.target.value)); setPage(1); }}>
                            <option value={0}>All Months</option>
                            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                        </select>
                        <select className="form-select" style={{ width: 100, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }} value={filterYear} onChange={e => { setFilterYear(Number(e.target.value)); setPage(1); }}>
                            <option value={0}>All Years</option>
                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <button className="admin-btn" onClick={downloadExcel} disabled={!canDownload} style={{ background: '#8B4513', borderColor: '#8B4513', color: '#fff', borderRadius: 5, padding: '0.6rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, opacity: canDownload ? 1 : 0.5 }}>
                            <FaFileExcel /> Excel
                        </button>
                        <button className="admin-btn" onClick={downloadPDF} disabled={!canDownload} style={{ background: '#8B4513', borderColor: '#8B4513', color: '#fff', borderRadius: 5, padding: '0.6rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, opacity: canDownload ? 1 : 0.5 }}>
                            <FaFilePdf /> PDF
                        </button>
                        <button className="admin-btn" onClick={openNew} style={{ background: '#8B4513', borderColor: '#8B4513', color: '#fff', borderRadius: 5, padding: '0.6rem 1.5rem', fontSize: '0.95rem' }}>
                            <FaPlus style={{ marginRight: 6 }} />Add Payroll
                        </button>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Employee</th><th>Period</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net</th><th>Status</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(item => (
                                <tr key={item.id}>
                                    <td><strong>{getEmployeeName(item.employeeId)}</strong></td>
                                    <td style={{ whiteSpace: 'nowrap' }}>{MONTHS[item.month - 1]} {item.year}</td>
                                    <td>RWF {item.basicSalary?.toLocaleString() || '—'}</td>
                                    <td>RWF {(item.totalAllowances || 0).toLocaleString()}</td>
                                    <td>RWF {(item.totalDeductions || 0).toLocaleString()}</td>
                                    <td><strong>RWF {item.netSalary?.toLocaleString() || '—'}</strong></td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600,
                                            color: '#fff', background: statusColors[item.status] || '#6b7280',
                                        }}>{item.status}</span>
                                    </td>
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
                                    <FaDollarSign size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                                    <div>No payroll records found. Click "Add Payroll" to create one.</div>
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
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ left: modalPos?.x ?? '50%', top: modalPos?.y ?? '50%', transform: modalPos ? 'none' : 'translate(-50%, -50%)', width: 700 }}>
                        <div className="admin-modal-header" onMouseDown={onHeaderMouseDown}>
                            <h3><FaArrowsAlt style={{ fontSize: '0.75rem', marginRight: 8, opacity: 0.5 }} />{editing ? 'Edit' : 'Add'} Payroll</h3>
                            <button onClick={() => setShowModal(false)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Employee</label>
                                    <select className="form-select" value={form.employeeId} onChange={e => setForm(p => ({ ...p, employeeId: e.target.value }))}>
                                        <option value="">Select employee...</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                                        <option value="draft">Draft</option>
                                        <option value="paid">Paid</option>
                                        <option value="pending">Pending</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Month</label>
                                    <select className="form-select" value={form.month} onChange={e => setForm(p => ({ ...p, month: Number(e.target.value) }))}>
                                        {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Year</label>
                                    <select className="form-select" value={form.year} onChange={e => setForm(p => ({ ...p, year: Number(e.target.value) }))}>
                                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Basic Salary (RWF)</label>
                                    <input type="number" className="form-input" value={form.basicSalary} onChange={e => {
                                        const basic = Number(e.target.value);
                                        setForm(p => {
                                            const { totalAllowances, totalDeductions, netSalary } = calcNet(basic, p.allowances, p.deductions);
                                            return { ...p, basicSalary: basic, totalAllowances, totalDeductions, netSalary };
                                        });
                                    }} placeholder="0" />
                                </div>
                            </div>

                            {attendanceLoading && (
                                <div style={{ padding: '0.75rem', background: '#f5f5f5', borderRadius: 6, marginTop: '0.75rem', textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>
                                    Loading attendance...
                                </div>
                            )}

                            {attendanceStats && !attendanceLoading && (
                                <div style={{ padding: '0.75rem', background: '#f5f5f5', borderRadius: 6, marginTop: '0.75rem' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <FaCalendarAlt /> Attendance for {MONTHS[form.month - 1]} {form.year}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><FaCheckCircle style={{ color: '#22c55e' }} /> Present: {attendanceStats.present}</span>
                                        <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><FaBan style={{ color: '#ef4444' }} /> Absent: {attendanceStats.absent}</span>
                                        <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><FaHourglassHalf style={{ color: '#f59e0b' }} /> Late: {attendanceStats.late}</span>
                                        <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><FaClock style={{ color: '#8b5cf6' }} /> Half Day: {attendanceStats.halfDay}</span>
                                        <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><FaClock style={{ color: '#3b82f6' }} /> On Leave: {attendanceStats.onLeave}</span>
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>Allowances</label>
                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }} onClick={addAllowance}><FaPlus /> Add</button>
                                </div>
                                {form.allowances.map((a, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', alignItems: 'center' }}>
                                        <input className="form-input" placeholder="Label" value={a.label} onChange={e => updateAllowance(i, 'label', e.target.value)} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', flex: 1 }} />
                                        <input type="number" className="form-input" placeholder="Amount" value={a.amount} onChange={e => updateAllowance(i, 'amount', Number(e.target.value))} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 120 }} />
                                        <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.5rem', color: 'var(--primary-red)' }} onClick={() => removeAllowance(i)}><FaTrash /></button>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>Deductions</label>
                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }} onClick={addDeduction}><FaPlus /> Add</button>
                                </div>
                                {form.deductions.map((d, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', alignItems: 'center' }}>
                                        <input className="form-input" placeholder="Label" value={d.label} onChange={e => updateDeduction(i, 'label', e.target.value)} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', flex: 1 }} />
                                        <input type="number" className="form-input" placeholder="Amount" value={d.amount} onChange={e => updateDeduction(i, 'amount', Number(e.target.value))} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 120 }} />
                                        <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.5rem', color: 'var(--primary-red)' }} onClick={() => removeDeduction(i)}><FaTrash /></button>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#f0fdf4', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.85rem' }}>
                                    <span>Basic: <strong>RWF {form.basicSalary.toLocaleString()}</strong></span>
                                    <span style={{ margin: '0 0.5rem' }}>+</span>
                                    <span>Allowances: <strong>RWF {form.allowances.reduce((s, a) => s + (a.amount || 0), 0).toLocaleString()}</strong></span>
                                    <span style={{ margin: '0 0.5rem' }}>-</span>
                                    <span>Deductions: <strong>RWF {form.deductions.reduce((s, d) => s + (d.amount || 0), 0).toLocaleString()}</strong></span>
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#16a34a' }}>
                                    Net: RWF {(form.basicSalary + form.allowances.reduce((s, a) => s + (a.amount || 0), 0) - form.deductions.reduce((s, d) => s + (d.amount || 0), 0)).toLocaleString()}
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
        </div>
    );
};

export default PayrollPage;
