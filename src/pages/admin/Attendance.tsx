import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaEdit, FaTrash, FaTimes as FaTimesIcon, FaClock, FaFileExcel, FaFilePdf, FaArrowsAlt, FaChevronLeft, FaChevronRight, FaProjectDiagram, FaSave, FaUsers, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaBan, FaUserShield, FaCalendarDay, FaExclamationTriangle, FaClipboardList } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { hrService } from '../../services/hrService';
import { loadPageCache, savePageCache } from '../../utils/pageCache';
import { authService } from '../../services/authService';
import { constructionService, type Project } from '../../services/constructionService';
import { assignmentService, type EmployeeAssignment } from '../../services/assignmentService';
import { sitesService } from '../../services/sitesService';
import { useAuth } from '../../context/AuthContext';
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
        display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0,
        background: emphasis ? `${accent}12` : 'var(--bg-white)',
        border: `1px solid ${emphasis ? `${accent}40` : 'var(--border-color)'}`,
        borderRadius: 10, padding: '0.5rem 0.65rem',
    }}>
        <div style={{
            width: 30, height: 30, borderRadius: 8, background: `${accent}18`, color: accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.82rem',
        }}>{icon}</div>
        <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{label}</div>
            <div style={{ fontSize: emphasis ? '0.95rem' : '0.85rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
        </div>
    </div>
);

const AttendancePage = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const role = user?.role || '';
    const isSiteEngineer = role === 'site_engineer';
    const [searchParams, setSearchParams] = useSearchParams();
    const urlSite = searchParams.get('site') || '';

    const [data, setData] = useState<Attendance[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
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
    const [batchData, setBatchData] = useState<{ employeeId: string; firstName: string; lastName: string; checkIn: string; checkOut: string; status: AttendanceStatus; existingId?: string; notes?: string; isSelf?: boolean }[]>([]);
    const [siteAttendance, setSiteAttendance] = useState<Attendance[]>([]);
    const [siteProjectId, setSiteProjectId] = useState('');
    const [projectAttendance, setProjectAttendance] = useState<Attendance[]>([]);
    const [projectAttendanceLoading, setProjectAttendanceLoading] = useState(false);
    const [expandedDate, setExpandedDate] = useState<string | null>(null);
    const [showReport, setShowReport] = useState(false);
    const [expandedYear, setExpandedYear] = useState<string | null>(null);
    const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

    const [engineerSites, setEngineerSites] = useState<any[]>([]);
    const [engineerProjects, setEngineerProjects] = useState<Project[]>([]);

    const getEmployeeName = useCallback((id: string) => {
        const emp = employees.find(e => e.id === id);
        return emp ? `${emp.firstName} ${emp.lastName}` : id;
    }, [employees]);

    const fetch = async () => {
        setLoading(true);
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
                            firstName: u.profile?.firstName || u.email || 'Unknown',
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
        if (!isSiteEngineer) return;
        sitesService.getMyAssigned().then(res => {
            const sites = res.data || [];
            setEngineerSites(sites);
            const uniqueProjects = new Map<string, Project>();
            sites.forEach((s: any) => {
                if (s.project && !uniqueProjects.has(s.project.id)) {
                    uniqueProjects.set(s.project.id, s.project);
                }
            });
            const projList = Array.from(uniqueProjects.values());
            setEngineerProjects(projList);
            if (projList.length === 1 && !selectedProjectId) {
                setSelectedProjectId(projList[0].id);
            } else if (projList.length > 1 && !selectedProjectId) {
                setSelectedProjectId(projList[0].id);
            }
        }).catch(() => {});
    }, [isSiteEngineer]);

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
            if (isSiteEngineer && !selectedDate) {
                setSelectedDate(new Date().toISOString().split('T')[0]);
            } else {
                setSelectedDate('');
            }
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

    const reportHierarchy = useMemo(() => {
        const source = projectAttendance.length > 0 ? projectAttendance : data;
        const years: Record<string, Record<string, Record<string, Attendance[]>>> = {};
        source.forEach(a => {
            if (!a.date) return;
            const d = new Date(a.date);
            const yr = String(d.getFullYear());
            const mo = String(d.getMonth() + 1).padStart(2, '0');
            if (!years[yr]) years[yr] = {};
            if (!years[yr][mo]) years[yr][mo] = {};
            if (!years[yr][mo][a.date]) years[yr][mo][a.date] = [];
            years[yr][mo][a.date].push(a);
        });
        return Object.keys(years).sort((a, b) => Number(b) - Number(a)).map(yr => {
            const allYearRecords = Object.keys(years[yr]).flatMap(mo =>
                Object.keys(years[yr][mo]).flatMap(dt => years[yr][mo][dt])
            );
            return {
                year: yr,
                months: Object.keys(years[yr]).sort((a, b) => Number(b) - Number(a)).map(mo => {
                    const monthName = new Date(Number(yr), Number(mo) - 1).toLocaleString('en', { month: 'long' });
                    const dates = Object.keys(years[yr][mo]).sort((a, b) => b.localeCompare(a));
                    const allRecords = dates.flatMap(dt => years[yr][mo][dt]);
                    return {
                        key: `${yr}-${mo}`,
                        monthName,
                        dates: dates.map(dt => ({
                            date: dt,
                            records: years[yr][mo][dt],
                        })),
                        totalRecords: allRecords.length,
                        present: allRecords.filter(r => r.status === 'present').length,
                        absent: allRecords.filter(r => r.status === 'absent').length,
                        late: allRecords.filter(r => r.status === 'late').length,
                    };
                }),
                totalRecords: allYearRecords.length,
            };
        });
    }, [data, projectAttendance]);

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
                        notes: existing?.notes || '',
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
                        notes: d.notes || '',
                    });
                }
            });
            if (isSiteEngineer && user) {
                const selfEmp = employees.find(e => e.email && e.email.toLowerCase() === (user.email || '').toLowerCase());
                if (selfEmp) {
                    const selfExisting = existingMap.get(selfEmp.id);
                    const selfEntry = {
                        employeeId: selfEmp.id,
                        firstName: selfEmp.firstName || user.profile?.firstName || 'You',
                        lastName: selfEmp.lastName || user.profile?.lastName || '',
                        checkIn: selfExisting?.checkIn || '09:00',
                        checkOut: selfExisting?.checkOut || '17:00',
                        status: (selfExisting?.status || 'present') as AttendanceStatus,
                        existingId: selfExisting?.id,
                        notes: selfExisting?.notes || '',
                        isSelf: true,
                    };
                    setBatchData([selfEntry, ...assigned.filter(a => a.employeeId !== selfEntry.employeeId)]);
                    return;
                }
            }
            setBatchData(assigned);
        } else {
            setBatchData([]);
        }
    }, [selectedProjectId, selectedDate, assignments, data, employees, isSiteEngineer, user]);

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
        const source = projectAttendance.length > 0 ? projectAttendance : data;
        if (source.length === 0) { showToast('No attendance data to export', 'error'); return; }
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
        doc.text(`Attendance Report — ${selectedProject?.name || 'All Projects'}`, 14, titleY);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#666');
        const genDate = new Date().toLocaleDateString();
        doc.text(`Generated: ${genDate} | Records: ${source.length}`, pageW - 14, titleY, { align: 'right' });
        const rows = source
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((d, i) => [
                String(i + 1),
                employeeMap[d.employeeId] || d.employeeId,
                new Date(d.date).toLocaleDateString(),
                d.project?.name || '—',
                d.site || '—',
                d.checkIn || '—',
                d.checkOut || '—',
                d.status.replace('_', ' '),
            ]);
        autoTable(doc, {
            head: [['#', 'Employee', 'Date', 'Project', 'Site', 'Check In', 'Check Out', 'Status']],
            body: rows,
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
        doc.save(`attendance-${selectedProject?.name || 'all'}.pdf`);
    };

    const downloadExcel = () => {
        const source = projectAttendance.length > 0 ? projectAttendance : data;
        if (source.length === 0) { showToast('No attendance data to export', 'error'); return; }
        const wb = XLSX.utils.book_new();
        const grouped: Record<string, Attendance[]> = {};
        source.forEach(a => {
            if (!a.date) return;
            const d = new Date(a.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(a);
        });
        const sortedKeys = Object.keys(grouped).sort();
        sortedKeys.forEach(key => {
            const [yr, mo] = key.split('-');
            const monthName = new Date(Number(yr), Number(mo) - 1).toLocaleString('en', { month: 'long' });
            const sheetName = `${yr}-${monthName}`;
            const sorted = grouped[key].sort((a, b) => a.date.localeCompare(b.date) || (a.checkIn || '').localeCompare(b.checkIn || ''));
            const ws = XLSX.utils.json_to_sheet([
                ['MUHIZI CONSTRUCTION — Attendance Report'],
                [`${monthName} ${yr}  |  Generated: ${new Date().toLocaleDateString()}`],
                [],
                ['#', 'Employee', 'Date', 'Project', 'Site', 'Check In', 'Check Out', 'Status', 'Notes'],
                ...sorted.map((a, i) => [
                    i + 1,
                    employeeMap[a.employeeId] || a.employeeId,
                    new Date(a.date).toLocaleDateString(),
                    a.project?.name || '—',
                    a.site || '—',
                    a.checkIn || '—',
                    a.checkOut || '—',
                    a.status.replace('_', ' '),
                    a.notes || '',
                ]),
            ]);
            ws['!cols'] = [
                { wch: 5 }, { wch: 22 }, { wch: 12 }, { wch: 20 }, { wch: 18 },
                { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 25 },
            ];
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });
        const projectName = selectedProject?.name || 'All';
        XLSX.writeFile(wb, `attendance-${projectName}.xlsx`);
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
                            notes: item.notes || '',
                        })
                        : hrService.createAttendance({
                            employeeId: item.employeeId,
                            date: selectedDate,
                            projectId: selectedProjectId,
                            site: project?.location || '',
                            checkIn: item.checkIn,
                            checkOut: item.checkOut,
                            status: item.status,
                            notes: item.notes || '',
                        })
                )
            );
            showToast('Attendance saved successfully', 'success');
            fetch();
        } catch { showToast('Failed to save attendance', 'error'); }
    };

    const saveSingleRow = async (idx: number) => {
        if (!selectedProjectId || !selectedDate) return;
        const item = batchData[idx];
        if (!item) return;
        try {
            const project = projects.find(p => p.id === selectedProjectId);
            const payload = {
                employeeId: item.employeeId,
                date: selectedDate,
                projectId: selectedProjectId,
                site: project?.location || '',
                checkIn: item.checkIn,
                checkOut: item.checkOut,
                status: item.status,
                notes: item.notes || '',
            };
            if (item.existingId) {
                await hrService.updateAttendance(item.existingId, payload);
            } else {
                const created = await hrService.createAttendance(payload);
                setBatchData(prev => prev.map((r, i) => i === idx ? { ...r, existingId: created.id } : r));
            }
        } catch { /* silent */ }
    };

    const handleStatusChange = (idx: number, newStatus: AttendanceStatus) => {
        setBatchData(prev => prev.map((r, i) => i === idx ? { ...r, status: newStatus } : r));
        saveSingleRow(idx);
    };

    const handleNotesChange = (idx: number, value: string) => {
        setBatchData(prev => prev.map((r, i) => i === idx ? { ...r, notes: value } : r));
    };

    const handleNotesBlur = (idx: number) => {
        saveSingleRow(idx);
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

    if (loading) {
        return (
            <div className="admin-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
                <div style={{ display: 'inline-block', width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: '#1B2042', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ marginLeft: '0.75rem', fontSize: '0.9rem' }}>Loading...</span>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem', flexShrink: 0 }}>
                <FaClock style={{ color: 'var(--primary)' }} /> Attendance
                {urlSite && <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>/ {urlSite}</span>}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                <StatTile icon={<FaUsers />} label="Total" value={String(stats.total)} accent="#1B2042" emphasis />
                <StatTile icon={<FaCheckCircle />} label="Present" value={String(stats.present)} accent="#22c55e" />
                <StatTile icon={<FaTimesCircle />} label="Absent" value={String(stats.absent)} accent="#ef4444" />
                <StatTile icon={<FaHourglassHalf />} label="Late" value={String(stats.late)} accent="#f59e0b" />
                <StatTile icon={<FaBan />} label="On Leave" value={String(stats.onLeave)} accent="#1B2042" />
                <StatTile icon={<FaUserShield />} label="Permission" value={String(stats.permission)} accent="#8b5cf6" />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div className="admin-card" style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '0.4rem', border: '2px solid var(--primary)', padding: '0.25rem 0.6rem', marginBottom: 0, flexShrink: 0 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FaProjectDiagram size={11} /> Daily Report
                    </span>
                    <div>
                        <select className="form-select" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}
                            disabled={isSiteEngineer && engineerProjects.length <= 1}
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.78rem', maxWidth: 200, opacity: isSiteEngineer && engineerProjects.length <= 1 ? 0.7 : 1 }}>
                            {isSiteEngineer ? (
                                engineerProjects.length > 0 ? (
                                    engineerProjects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} {p.location ? `(${p.location})` : ''}</option>
                                    ))
                                ) : (
                                    <option value="">No assigned projects</option>
                                )
                            ) : (
                                <>
                                    <option value="">— Project —</option>
                                    {projects.filter(p => !urlSite || p.id === siteProjectId).map(p => (
                                        <option key={p.id} value={p.id}>{p.name} {p.location ? `(${p.location})` : ''}</option>
                                    ))}
                                </>
                            )}
                        </select>
                    </div>
                    <div>
                        <input type="date" className="form-input" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} disabled={!selectedProjectId} style={{ padding: '0.2rem 0.4rem', fontSize: '0.78rem', maxWidth: 150 }} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button className="admin-btn" onClick={() => setShowReport(!showReport)} style={{ background: showReport ? '#b45309' : '#1B2042', borderColor: showReport ? '#b45309' : '#1B2042', color: '#fff', borderRadius: 5, padding: '0.3rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4, opacity: 1 }}>
                        <FaClipboardList size={12} /> Attendance Report
                    </button>
                    <button className="admin-btn" onClick={downloadExcel} title="Download as Excel" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.3rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4, opacity: 1 }}>
                        <FaFileExcel size={12} /> Excel
                    </button>
                    <button className="admin-btn" onClick={downloadPDF} title="Download as PDF" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.3rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4, opacity: 1 }}>
                        <FaFilePdf size={12} /> PDF
                    </button>
                </div>
            </div>

            {selectedProjectId && !selectedDate && assignments.length > 0 && (
                <div className="admin-card" style={{ marginBottom: '0.75rem', border: '2px solid #f59e0b', background: '#fffbeb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                        <FaExclamationTriangle style={{ color: '#f59e0b', fontSize: '1rem' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400e' }}>
                            Select today&apos;s date above to mark attendance for <strong>{selectedProject?.name}</strong>
                        </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#78716c', marginBottom: '0.6rem' }}>
                        {assignments.filter(a => a.employee).length} team member(s) assigned to this project:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.4rem' }}>
                        {assignments.filter(a => a.employee).map(a => (
                            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', background: '#fff', borderRadius: 8, border: '1px solid #e5e5e5' }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1B2042', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                                    {(a.employee!.firstName || '')[0]}{(a.employee!.lastName || '')[0]}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {a.employee!.firstName} {a.employee!.lastName}
                                    </div>
                                    <div style={{ fontSize: '0.68rem', color: '#a8a29e' }}>{a.role || 'Team Member'}</div>
                                </div>
                            </div>
                        ))}
                        {isSiteEngineer && (
                            <div key="self" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#22c55e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>ME</div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                                        {user?.profile?.firstName || user?.email?.split('@')[0]} {user?.profile?.lastName || ''}
                                        <span style={{ marginLeft: 4, fontSize: '0.65rem', background: '#22c55e', color: '#fff', padding: '1px 5px', borderRadius: 6 }}>You</span>
                                    </div>
                                    <div style={{ fontSize: '0.68rem', color: '#a8a29e' }}>Site Engineer</div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaCalendarDay style={{ color: '#f59e0b', fontSize: '0.8rem' }} />
                        <span style={{ fontSize: '0.78rem', color: '#92400e' }}>
                            Pick a date from the picker above — attendance will be saved as a sheet for this month and year.
                        </span>
                    </div>
                </div>
            )}

            {batchData.length > 0 && (
                <div className="admin-card" style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            {isSiteEngineer && engineerSites.length > 0 && (
                                <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem', display: 'block', marginBottom: 1 }}>
                                    Site: {engineerSites.map(s => s.name).join(', ')}
                                </span>
                            )}
                            Employees on <strong>{selectedProject?.name}</strong> — {new Date(selectedDate).toLocaleDateString()}
                            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> ({batchData.length} people)</span>
                        </span>
                        <button className="admin-btn" onClick={handleBatchSave} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                            <FaSave style={{ marginRight: 4 }} /> Save All
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
                                    <th>Notes / Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batchData.map((item, i) => (
                                    <tr key={item.employeeId}>
                                        <td>{i + 1}</td>
                                        <td>
                                            <strong>{item.firstName} {item.lastName}</strong>
                                            {item.isSelf && <span style={{ marginLeft: 6, fontSize: '0.7rem', background: '#1B2042', color: '#fff', padding: '1px 6px', borderRadius: 8 }}>You</span>}
                                        </td>
                                        <td>
                                            <input type="time" className="form-input" value={item.checkIn} onChange={e => { const a = [...batchData]; a[i] = { ...a[i], checkIn: e.target.value }; setBatchData(a); }} style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem', width: 90 }} />
                                        </td>
                                        <td>
                                            <input type="time" className="form-input" value={item.checkOut} onChange={e => { const a = [...batchData]; a[i] = { ...a[i], checkOut: e.target.value }; setBatchData(a); }} style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem', width: 90 }} />
                                        </td>
                                        <td>
                                            <select className="form-select" value={item.status} onChange={e => handleStatusChange(i, e.target.value as AttendanceStatus)} style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem', width: 130 }}>
                                                {STATUS_OPTIONS.map(s => (
                                                    <option key={s.value} value={s.value}>{s.label}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <input type="text" className="form-input" value={item.notes || ''} onChange={e => handleNotesChange(i, e.target.value)} onBlur={() => handleNotesBlur(i)} placeholder="Optional reason..." style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem', width: '100%', minWidth: 120 }} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showReport && (
                <div className="admin-card" style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FaClipboardList style={{ color: 'var(--primary)' }} /> Attendance Report
                            <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                ({reportHierarchy.reduce((s, y) => s + y.months.reduce((s2, m) => s2 + m.totalRecords, 0), 0)} records)
                            </span>
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button className="admin-btn" onClick={downloadExcel} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', padding: '0.3rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FaFileExcel size={12} /> Excel
                            </button>
                            <button className="admin-btn" onClick={downloadPDF} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', padding: '0.3rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FaFilePdf size={12} /> PDF
                            </button>
                        </div>
                    </div>
                    {reportHierarchy.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <FaClock size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                            <div>No attendance records saved yet.</div>
                            <div style={{ fontSize: '0.78rem', marginTop: 4 }}>Select a project, pick a date, mark attendance and save — records will appear here grouped by year and month.</div>
                        </div>
                    ) : (
                        <div style={{ border: '1px solid #e5e5e5', borderRadius: 6, overflow: 'hidden' }}>
                            {reportHierarchy.map(yrBlock => {
                                const isYearOpen = expandedYear === yrBlock.year;
                                return (
                                    <div key={yrBlock.year}>
                                        <div
                                            onClick={() => { setExpandedYear(isYearOpen ? null : yrBlock.year); setExpandedMonth(null); setExpandedDate(null); }}
                                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.8rem', borderBottom: '1px solid #e5e5e5', background: isYearOpen ? '#f9f6f0' : '#fafafa', cursor: 'pointer', userSelect: 'none' }}
                                        >
                                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1B2042' }}>
                                                <FaCalendarDay style={{ marginRight: 6, fontSize: '0.75rem' }} />{yrBlock.year}
                                                <span style={{ marginLeft: 8, fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                                                    {yrBlock.months.reduce((s, m) => s + m.totalRecords, 0)} records
                                                </span>
                                            </span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{isYearOpen ? '▲' : '▼'}</span>
                                        </div>
                                        {isYearOpen && yrBlock.months.map(moBlock => {
                                            const monthKey = moBlock.key;
                                            const isMonthOpen = expandedMonth === monthKey;
                                            return (
                                                <div key={monthKey} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                    <div
                                                        onClick={() => setExpandedMonth(isMonthOpen ? null : monthKey)}
                                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.8rem 0.45rem 1.8rem', borderBottom: isMonthOpen ? '1px solid #f0f0f0' : 'none', background: isMonthOpen ? '#fef3c7' : '#fff', cursor: 'pointer', userSelect: 'none' }}
                                                    >
                                                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#92400e' }}>
                                                            {moBlock.monthName}
                                                            <span style={{ marginLeft: 6, fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                                                                {moBlock.totalRecords} records
                                                                <span style={{ marginLeft: 6, color: '#22c55e' }}>{moBlock.present}P</span>
                                                                <span style={{ marginLeft: 3, color: '#ef4444' }}>{moBlock.absent}A</span>
                                                                <span style={{ marginLeft: 3, color: '#f59e0b' }}>{moBlock.late}L</span>
                                                            </span>
                                                        </span>
                                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{isMonthOpen ? '▲' : '▼'}</span>
                                                    </div>
                                                    {isMonthOpen && moBlock.dates.map(dayBlock => {
                                                        const isDayOpen = expandedDate === dayBlock.date;
                                                        const dayPresent = dayBlock.records.filter(r => r.status === 'present').length;
                                                        const dayAbsent = dayBlock.records.filter(r => r.status === 'absent').length;
                                                        const dayLate = dayBlock.records.filter(r => r.status === 'late').length;
                                                        return (
                                                            <div key={dayBlock.date} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                                                <div
                                                                    onClick={() => setExpandedDate(isDayOpen ? null : dayBlock.date)}
                                                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.8rem 0.4rem 3.2rem', background: isDayOpen ? '#fef9ee' : '#fff', cursor: 'pointer', userSelect: 'none' }}
                                                                >
                                                                    <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                                                                        <strong>{new Date(dayBlock.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</strong>
                                                                        <span style={{ marginLeft: 8, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                                            {dayBlock.records.length} people
                                                                            <span style={{ marginLeft: 5, color: '#22c55e' }}>{dayPresent}P</span>
                                                                            <span style={{ marginLeft: 2, color: '#ef4444' }}>{dayAbsent}A</span>
                                                                            <span style={{ marginLeft: 2, color: '#f59e0b' }}>{dayLate}L</span>
                                                                        </span>
                                                                    </span>
                                                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{isDayOpen ? '▲' : '▼'}</span>
                                                                </div>
                                                                {isDayOpen && (
                                                                    <div style={{ padding: '0.4rem 0.8rem 0.4rem 3.2rem', background: '#fafafa' }}>
                                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                                                                            <thead>
                                                                                <tr style={{ background: '#1B2042', color: '#fff' }}>
                                                                                    <th style={{ padding: '0.3rem 0.5rem', textAlign: 'left' }}>#</th>
                                                                                    <th style={{ padding: '0.3rem 0.5rem', textAlign: 'left' }}>Employee</th>
                                                                                    <th style={{ padding: '0.3rem 0.5rem', textAlign: 'left' }}>Project</th>
                                                                                    <th style={{ padding: '0.3rem 0.5rem', textAlign: 'left' }}>Check In</th>
                                                                                    <th style={{ padding: '0.3rem 0.5rem', textAlign: 'left' }}>Check Out</th>
                                                                                    <th style={{ padding: '0.3rem 0.5rem', textAlign: 'left' }}>Status</th>
                                                                                    <th style={{ padding: '0.3rem 0.5rem', textAlign: 'left' }}>Notes</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {dayBlock.records.sort((a, b) => (a.checkIn || '').localeCompare(b.checkIn || '')).map((r, i) => (
                                                                                    <tr key={r.id} style={{ borderBottom: '1px solid #eee', background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                                                                                        <td style={{ padding: '0.3rem 0.5rem' }}>{i + 1}</td>
                                                                                        <td style={{ padding: '0.3rem 0.5rem' }}><strong>{employeeMap[r.employeeId] || r.employeeId}</strong></td>
                                                                                        <td style={{ padding: '0.3rem 0.5rem' }}>{r.project?.name || '—'}</td>
                                                                                        <td style={{ padding: '0.3rem 0.5rem' }}>{r.checkIn || '—'}</td>
                                                                                        <td style={{ padding: '0.3rem 0.5rem' }}>{r.checkOut || '—'}</td>
                                                                                        <td style={{ padding: '0.3rem 0.5rem' }}>
                                                                                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 600, color: '#fff', background: STATUS_OPTIONS.find(s => s.value === r.status)?.color || '#6b7280' }}>
                                                                                                {r.status.replace('_', ' ')}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.notes || '—'}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {showModal && editing && (
                <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={modalPos ? { position: 'fixed', left: modalPos.x, top: modalPos.y } : {}}>
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
