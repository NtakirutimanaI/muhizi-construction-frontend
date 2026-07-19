import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaEdit, FaTrash, FaTimes as FaTimesIcon, FaClock, FaFileExcel, FaFilePdf, FaArrowsAlt, FaChevronLeft, FaChevronRight, FaProjectDiagram, FaSave, FaUsers, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaBan, FaUserShield } from 'react-icons/fa';
import { hrService } from '../../services/hrService';
import { loadPageCache, savePageCache } from '../../utils/pageCache';
import { authService } from '../../services/authService';
import { constructionService, type Project } from '../../services/constructionService';
import { assignmentService, type EmployeeAssignment } from '../../services/assignmentService';
import { sitesService } from '../../services/sitesService';
import type { Attendance, Employee } from '../../services/hrService';
import { useToast } from '../../context/ToastContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' | 'permission' | 'suspended';

const PAGE_SIZES = [5, 10, 15, 20];

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
    { value: 'present', label: 'Present', color: '#22c55e' },
    { value: 'absent', label: 'Absent', color: '#ef4444' },
    { value: 'late', label: 'Late', color: '#f59e0b' },
    { value: 'on_leave', label: 'On Leave', color: '#1B2042' },
    { value: 'permission', label: 'Permission', color: '#8b5cf6' },
    { value: 'suspended', label: 'Suspended', color: '#6b7280' },
];

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

const AttendancePage = () => {
    const { showToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const urlSite = searchParams.get('site') || '';

    const [data, setData] = useState<Attendance[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Attendance | null>(null);
    const [search, setSearch] = useState('');
    const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [modalPos, setModalPos] = useState<{ x: number; y: number } | null>(null);
    const dragging = useRef<{ offsetX: number; offsetY: number } | null>(null);

    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [assignments, setAssignments] = useState<EmployeeAssignment[]>([]);
    const [batchData, setBatchData] = useState<{ employeeId: string; firstName: string; lastName: string; checkIn: string; checkOut: string; status: AttendanceStatus; existingId?: string }[]>([]);
    const [siteAttendance, setSiteAttendance] = useState<Attendance[]>([]);
    const [siteProjectId, setSiteProjectId] = useState('');
    const [projectAttendance, setProjectAttendance] = useState<Attendance[]>([]);
    const [projectAttendanceLoading, setProjectAttendanceLoading] = useState(false);
    const [expandedDate, setExpandedDate] = useState<string | null>(null);

    const getEmployeeName = useCallback((id: string) => {
        const emp = employees.find(e => e.id === id);
        return emp ? `${emp.firstName} ${emp.lastName}` : id;
    }, [employees]);

    const fetch = async () => {
        const cached = loadPageCache<{ data: Attendance[]; projects: Project[]; employees: Employee[] }>('pg_attendance');
        if (cached) {
            setData(cached.data);
            setProjects(cached.projects);
            setEmployees(cached.employees);
        }
        try {
            const [attRes, empRes, usersRes, projRes] = await Promise.all([
                hrService.getAttendance(),
                hrService.getEmployees(),
                authService.getAllUsers().catch(() => []),
                constructionService.getProjects().catch(() => ({ data: [] })),
            ]);
            setData(attRes.data || []);
            setProjects(projRes.data || []);
            const empData = empRes.data || [];
            const users = Array.isArray(usersRes) ? usersRes : [];
            const employeeUsers = users.filter((u: any) => u.role === 'engineering_studio');
            const empEmails = new Set(empData.map((e: Employee) => e.email.toLowerCase()));
            const missing = employeeUsers.filter((u: any) => {
                const email = (u.email || '').toLowerCase();
                return email && !empEmails.has(email);
            });
            let finalEmpData: Employee[];
            if (missing.length > 0) {
                const created = await Promise.all(
                    missing.map((u: any) =>
                        hrService.createEmployee({
                            firstName: u.profile?.firstName || u.username || 'Unknown',
                            lastName: u.profile?.lastName || 'User',
                            email: u.email,
                            department: 'other',
                            status: 'active',
                            salary: 0,
                        }).then(r => r.data).catch(() => null)
                    )
                );
                finalEmpData = [...empData, ...created.filter(Boolean) as Employee[]];
            } else {
                finalEmpData = empData;
            }
            setEmployees(finalEmpData);
            savePageCache('pg_attendance', { data: attRes.data || [], projects: projRes.data || [], employees: finalEmpData });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(); }, []);

    useEffect(() => {
        if (urlSite) {
            hrService.getAttendanceBySite(urlSite).then(res => setSiteAttendance(res.data || [])).catch(() => setSiteAttendance([]));
            sitesService.getAll().then(r => {
                const s = (r.data || []).find((s: any) => s.name === urlSite);
                if (s?.projectId) { setSiteProjectId(s.projectId); setSelectedProjectId(s.projectId); }
            }).catch(() => {});
        } else {
            setSiteAttendance([]);
            setSiteProjectId('');
            setSelectedProjectId('');
        }
    }, [urlSite]);

    const fetchAssignments = useCallback(async (projectId: string) => {
        try {
            const res = await assignmentService.getByProject(projectId);
            setAssignments(res.data || []);
        } catch { setAssignments([]); }
    }, []);

    useEffect(() => {
        if (selectedProjectId) {
            fetchAssignments(selectedProjectId);
            setSelectedDate('');
            setBatchData([]);
            setProjectAttendanceLoading(true);
            hrService.getAttendanceByProject(selectedProjectId)
                .then(res => setProjectAttendance(res.data || []))
                .catch(() => setProjectAttendance([]))
                .finally(() => setProjectAttendanceLoading(false));
        } else {
            setAssignments([]);
            setSelectedDate('');
            setBatchData([]);
            setProjectAttendance([]);
        }
    }, [selectedProjectId, fetchAssignments]);

    const groupedByDate = useMemo(() => {
        const groups: Record<string, Attendance[]> = {};
        projectAttendance.forEach(a => {
            if (!groups[a.date]) groups[a.date] = [];
            groups[a.date].push(a);
        });
        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    }, [projectAttendance]);

    useEffect(() => {
        if (selectedProjectId && selectedDate) {
            const existingForDate = data.filter(d => d.date === selectedDate && d.projectId === selectedProjectId);
            const existingMap = new Map(existingForDate.map(d => [d.employeeId, d]));
            const assigned = assignments
                .filter(a => a.employee)
                .map(a => {
                    const existing = existingMap.get(a.employeeId);
                    return {
                        employeeId: a.employeeId,
                        firstName: a.employee!.firstName,
                        lastName: a.employee!.lastName,
                        checkIn: existing?.checkIn || '09:00',
                        checkOut: existing?.checkOut || '17:00',
                        status: (existing?.status || 'present') as AttendanceStatus,
                        existingId: existing?.id,
                    };
                });
            const extraExisting = existingForDate.filter(d => !assignments.some(a => a.employeeId === d.employeeId));
            extraExisting.forEach(d => {
                const emp = employees.find(e => e.id === d.employeeId);
                if (emp && !assigned.some(a => a.employeeId === emp.id)) {
                    assigned.push({
                        employeeId: emp.id,
                        firstName: emp.firstName,
                        lastName: emp.lastName,
                        checkIn: d.checkIn || '09:00',
                        checkOut: d.checkOut || '17:00',
                        status: d.status as AttendanceStatus,
                        existingId: d.id,
                    });
                }
            });
            setBatchData(assigned);
        } else {
            setBatchData([]);
        }
    }, [selectedProjectId, selectedDate, assignments, data, employees]);

    const filtered = useMemo(() => {
        const source = urlSite ? siteAttendance : data;
        const q = search.toLowerCase().trim();
        return source.filter(d => {
            const name = getEmployeeName(d.employeeId).toLowerCase();
            if (q && !name.includes(q) && !d.status.toLowerCase().includes(q)) return false;
            if (d.date !== dailyDate) return false;
            return true;
        });
    }, [data, siteAttendance, urlSite, search, dailyDate, getEmployeeName]);

    const totalPages = pageSize === 0 ? 1 : Math.ceil(filtered.length / pageSize);
    const paginated = useMemo(() => {
        if (pageSize === 0) return filtered;
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages || 1);
    }, [totalPages, page]);

    const employeeMap = useMemo(() => {
        const map: Record<string, string> = {};
        employees.forEach(e => { map[e.id] = `${e.firstName} ${e.lastName}`; });
        return map;
    }, [employees]);

    const tableData = useMemo(() => filtered.map((d, i) => [
        String(i + 1),
        employeeMap[d.employeeId] || d.employeeId,
        new Date(d.date).toLocaleDateString(),
        d.project?.name || '—',
        d.site || '—',
        d.checkIn || '—',
        d.checkOut || '—',
        d.status.replace('_', ' '),
    ]), [filtered, employeeMap]);

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
        doc.text('Attendance Report', 14, titleY);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#666');
        const today = new Date().toLocaleDateString();
        doc.text(`Generated: ${today} | Date: ${new Date(dailyDate).toLocaleDateString()}`, pageW - 14, titleY, { align: 'right' });
        autoTable(doc, {
            head: [['#', 'Employee', 'Date', 'Project', 'Site', 'Check In', 'Check Out', 'Status']],
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
        doc.save('attendance.pdf');
    };

    const downloadExcel = () => {
        const brown = '#1B2042';
        const today = new Date().toLocaleDateString();
        const period = `Date: ${new Date(dailyDate).toLocaleDateString()}`;
        const headers = ['#', 'Employee', 'Date', 'Project', 'Site', 'Check In', 'Check Out', 'Status'];
        const rows = tableData.map(r => `<tr>${r.map(c => `<td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${c}</td>`).join('')}</tr>`).join('');
        const html = `
            <html><head><meta charset="UTF-8"></head><body>
            <div style="text-align:center;color:${brown};font-size:20px;font-weight:bold;font-family:Arial">MUHIZI CONSTRUCTION</div>
            <div style="text-align:center;color:${brown};font-size:11px;font-family:Arial;margin-bottom:4px">Building Your Vision, Delivering Excellence</div>
            <hr style="border:1px solid ${brown}" />
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;color:${brown};font-family:Arial;margin:6px 0">
                <span>Attendance Report</span>
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
        a.href = url; a.download = 'attendance.xls'; a.click();
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

    const stats = useMemo(() => {
        const source = urlSite ? siteAttendance : data;
        const hours = source.reduce((sum, d) => {
            if (d.checkIn && d.checkOut) {
                const [ih, im] = d.checkIn.split(':').map(Number);
                const [oh, om] = d.checkOut.split(':').map(Number);
                return sum + Math.max(0, (oh + om / 60) - (ih + im / 60));
            }
            return sum;
        }, 0);
        return {
            total: source.length,
            present: source.filter(d => d.status === 'present').length,
            absent: source.filter(d => d.status === 'absent').length,
            late: source.filter(d => d.status === 'late').length,
            onLeave: source.filter(d => d.status === 'on_leave').length,
            permission: source.filter(d => d.status === 'permission').length,
            suspended: source.filter(d => d.status === 'suspended').length,
            totalHours: Math.round(hours * 10) / 10,
        };
    }, [data, siteAttendance, urlSite]);

    const openNew = () => { setEditing(null); setModalPos(null); setShowModal(true); };
    const openEdit = (item: Attendance) => {
        setEditing(item);
        setModalPos(null);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this attendance record?')) return;
        try { await hrService.deleteAttendance(id); fetch(); showToast('Attendance deleted', 'success'); }
        catch { showToast('Failed to delete', 'error'); }
    };

    const handleBatchSave = async () => {
        if (!selectedProjectId || !selectedDate) return;
        try {
            const project = projects.find(p => p.id === selectedProjectId);
            await Promise.all(
                batchData.map(item =>
                    item.existingId
                        ? hrService.updateAttendance(item.existingId, {
                            employeeId: item.employeeId,
                            date: selectedDate,
                            projectId: selectedProjectId,
                            site: project?.location || '',
                            checkIn: item.checkIn,
                            checkOut: item.checkOut,
                            status: item.status,
                        })
                        : hrService.createAttendance({
                            employeeId: item.employeeId,
                            date: selectedDate,
                            projectId: selectedProjectId,
                            site: project?.location || '',
                            checkIn: item.checkIn,
                            checkOut: item.checkOut,
                            status: item.status,
                        })
                )
            );
            showToast('Attendance saved successfully', 'success');
            fetch();
        } catch { showToast('Failed to save attendance', 'error'); }
    };

    const handleEditModalSave = async () => {
        if (!editing) return;
        try {
            await hrService.updateAttendance(editing.id, editing);
            showToast('Attendance updated', 'success');
            setShowModal(false);
            fetch();
        } catch { showToast('Failed to update', 'error'); }
    };


    const selectedProject = projects.find(p => p.id === selectedProjectId);

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, flexShrink: 0 }}>
                    <FaClock style={{ color: 'var(--primary)' }} /> Attendance
                    {urlSite && <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>/ {urlSite}</span>}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', flex: 1, maxWidth: 700 }}>
                    <StatTile icon={<FaUsers />} label="Total" value={String(stats.total)} accent="#1B2042" emphasis />
                    <StatTile icon={<FaCheckCircle />} label="Present" value={String(stats.present)} accent="#22c55e" />
                    <StatTile icon={<FaTimesCircle />} label="Absent" value={String(stats.absent)} accent="#ef4444" />
                    <StatTile icon={<FaHourglassHalf />} label="Late" value={String(stats.late)} accent="#f59e0b" />
                    <StatTile icon={<FaBan />} label="On Leave" value={String(stats.onLeave)} accent="#1B2042" />
                    <StatTile icon={<FaUserShield />} label="Permission" value={String(stats.permission)} accent="#8b5cf6" />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                <button className="admin-btn" onClick={downloadExcel} title="Download as Excel — for records, sharing, or uploading elsewhere as evidence" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.6rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, opacity: 1 }}>
                    <FaFileExcel /> Excel
                </button>
                <button className="admin-btn" onClick={downloadPDF} title="Download as PDF — for records, sharing, or uploading elsewhere as evidence" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.6rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, opacity: 1 }}>
                    <FaFilePdf /> PDF
                </button>
            </div>

            <div className="admin-card" style={{ marginBottom: '0.75rem', border: '2px solid var(--primary)', padding: '0.4rem 1rem' }}>
                <h3 style={{ margin: '0 0 0.3rem', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                    <FaProjectDiagram /> Daily Attendance Report
                </h3>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                        <select className="form-select" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} style={{ width: '100%', padding: '0.3rem', fontSize: '0.8rem' }}>
                            <option value="">— Choose a project —</option>
                            {projects.filter(p => !urlSite || p.id === siteProjectId).map(p => (
                                <option key={p.id} value={p.id}>{p.name} {p.location ? `(${p.location})` : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                        <input type="date" className="form-input" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} disabled={!selectedProjectId} style={{ width: '100%', padding: '0.3rem', fontSize: '0.8rem' }} />
                    </div>
                </div>

            </div>

            {batchData.length > 0 && (
                <div className="admin-card" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                            Employees on <strong>{selectedProject?.name}</strong> — {new Date(selectedDate).toLocaleDateString()}
                            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> ({batchData.length} people)</span>
                        </span>
                        <button className="admin-btn" onClick={handleBatchSave} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff' }}>
                            <FaSave style={{ marginRight: 6 }} /> Save All
                        </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Employee</th>
                                    <th style={{ width: 100 }}>Check In</th>
                                    <th style={{ width: 100 }}>Check Out</th>
                                    <th style={{ width: 150 }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batchData.map((item, i) => (
                                    <tr key={item.employeeId}>
                                        <td>{i + 1}</td>
                                        <td><strong>{item.firstName} {item.lastName}</strong></td>
                                        <td>
                                            <input type="time" className="form-input" value={item.checkIn} onChange={e => { const a = [...batchData]; a[i] = { ...a[i], checkIn: e.target.value }; setBatchData(a); }} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 100 }} />
                                        </td>
                                        <td>
                                            <input type="time" className="form-input" value={item.checkOut} onChange={e => { const a = [...batchData]; a[i] = { ...a[i], checkOut: e.target.value }; setBatchData(a); }} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 100 }} />
                                        </td>
                                        <td>
                                            <select className="form-select" value={item.status} onChange={e => { const a = [...batchData]; a[i] = { ...a[i], status: e.target.value as AttendanceStatus }; setBatchData(a); }} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 140 }}>
                                                {STATUS_OPTIONS.map(s => (
                                                    <option key={s.value} value={s.value}>{s.label}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedProjectId ? 'Project Attendance Report' : 'All Attendance Records'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {!selectedProjectId && (
                            <input type="text" className="form-input" placeholder="Search employee, status..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 350 }} />
                        )}
                    </div>
                </div>
                {selectedProjectId && groupedByDate.length > 0 ? (
                    <div>
                        {projectAttendanceLoading ? (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '1rem', textAlign: 'center' }}>Loading attendance records...</div>
                        ) : (
                            <div style={{ border: '1px solid #eee', borderRadius: 4 }}>
                                {groupedByDate.map(([date, records]) => (
                                    <div key={date}>
                                        <div
                                            onClick={() => setExpandedDate(expandedDate === date ? null : date)}
                                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.8rem', borderBottom: '1px solid #f0f0f0', fontSize: '0.85rem', cursor: 'pointer', background: expandedDate === date ? '#f9f6f0' : 'transparent', userSelect: 'none' }}
                                        >
                                            <span>
                                                <strong>{new Date(date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</strong>
                                                <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{records.length} employee(s)</span>
                                                <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: '0.78rem' }}>
                                                    ({records.filter(r => r.status === 'present').length} present, {records.filter(r => r.status === 'absent').length} absent, {records.filter(r => r.status === 'late').length} late)
                                                </span>
                                            </span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{expandedDate === date ? '▲' : '▼'}</span>
                                        </div>
                                        {expandedDate === date && (
                                            <div style={{ padding: '0.5rem 0.8rem', background: '#fafafa', borderBottom: '1px solid #f0f0f0', overflowX: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                                    <thead>
                                                        <tr style={{ background: '#1B2042', color: '#fff' }}>
                                                            <th style={{ padding: '0.35rem 0.5rem', textAlign: 'left' }}>#</th>
                                                            <th style={{ padding: '0.35rem 0.5rem', textAlign: 'left' }}>Employee</th>
                                                            <th style={{ padding: '0.35rem 0.5rem', textAlign: 'left' }}>Check In</th>
                                                            <th style={{ padding: '0.35rem 0.5rem', textAlign: 'left' }}>Check Out</th>
                                                            <th style={{ padding: '0.35rem 0.5rem', textAlign: 'left' }}>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {records.map((r, i) => (
                                                            <tr key={r.id} style={{ borderBottom: '1px solid #eee', background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                                                                <td style={{ padding: '0.35rem 0.5rem' }}>{i + 1}</td>
                                                                <td style={{ padding: '0.35rem 0.5rem' }}><strong>{employeeMap[r.employeeId] || r.employeeId}</strong></td>
                                                                <td style={{ padding: '0.35rem 0.5rem' }}>{r.checkIn || '—'}</td>
                                                                <td style={{ padding: '0.35rem 0.5rem' }}>{r.checkOut || '—'}</td>
                                                                <td style={{ padding: '0.35rem 0.5rem' }}>
                                                                    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600, color: '#fff', background: STATUS_OPTIONS.find(s => s.value === r.status)?.color || '#6b7280' }}>
                                                                        {r.status.replace('_', ' ')}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Employee</th><th>Date</th><th>Project</th><th>Site</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.map(item => (
                                        <tr key={item.id}>
                                            <td><strong>{getEmployeeName(item.employeeId)}</strong></td>
                                            <td style={{ whiteSpace: 'nowrap' }}>{new Date(item.date).toLocaleDateString()}</td>
                                            <td>{item.project?.name || '—'}</td>
                                            <td>{item.site || '—'}</td>
                                            <td>{item.checkIn || '—'}</td>
                                            <td>{item.checkOut || '—'}</td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600,
                                                    color: '#fff', background: STATUS_OPTIONS.find(s => s.value === item.status)?.color || '#6b7280',
                                                }}>{item.status.replace('_', ' ')}</span>
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
                                            <FaClock size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                                            <div>No attendance records found.</div>
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
                    </>
                )}
            </div>

            {showModal && editing && (
                <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ left: modalPos?.x ?? '50%', top: modalPos?.y ?? '50%', transform: modalPos ? 'none' : 'translate(-50%, -50%)' }}>
                        <div className="admin-modal-header" onMouseDown={onHeaderMouseDown}>
                            <h3><FaArrowsAlt style={{ fontSize: '0.75rem', marginRight: 8, opacity: 0.5 }} />Edit Attendance</h3>
                            <button onClick={() => setShowModal(false)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Employee</label>
                                    <input className="form-input" value={getEmployeeName(editing.employeeId)} disabled />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input type="date" className="form-input" value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Check In</label>
                                    <input type="time" className="form-input" value={editing.checkIn || ''} onChange={e => setEditing({ ...editing, checkIn: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Check Out</label>
                                    <input type="time" className="form-input" value={editing.checkOut || ''} onChange={e => setEditing({ ...editing, checkOut: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select className="form-select" value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value as AttendanceStatus })}>
                                        {STATUS_OPTIONS.map(s => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="admin-btn" onClick={handleEditModalSave}>Update</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendancePage;
