import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { FaEdit, FaTrash, FaTimes as FaTimesIcon, FaClock, FaChevronLeft, FaChevronRight, FaProjectDiagram, FaSave, FaUsers, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaBan, FaUserShield, FaSpinner, FaClipboardList, FaCalendarAlt } from 'react-icons/fa';
import { hrService } from '../../services/hrService';
import { loadPageCache, savePageCache } from '../../utils/pageCache';
import { authService } from '../../services/authService';
import { constructionService, type Project } from '../../services/constructionService';
import { assignmentService, type EmployeeAssignment } from '../../services/assignmentService';
import { sitesService } from '../../services/sitesService';
import { useAuth } from '../../context/AuthContext';
import type { Attendance, Employee } from '../../services/hrService';
import { useToast } from '../../context/ToastContext';

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

const deduplicateAttendanceRecords = (records: Attendance[]) => {
    const unique = new Map<string, Attendance>();
    records.forEach((record) => {
        if (!record.employeeId || !record.date) return;
        unique.set(`${record.employeeId}:${record.date}`, record);
    });
    return Array.from(unique.values());
};

const StatTile = ({ icon, label, value, accent, emphasis }: { icon: React.ReactNode; label: string; value: string; accent: string; emphasis?: boolean }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0,
        background: emphasis ? `${accent}12` : 'var(--bg-white)',
        border: `1px solid ${emphasis ? `${accent}40` : 'var(--border-color)'}`,
        borderRadius: 7, padding: '0.4rem 0.6rem',
    }}>
        <div style={{
            width: 26, height: 26, borderRadius: 6, background: `${accent}18`, color: accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem',
        }}>{icon}</div>
        <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{label}</div>
            <div style={{ fontSize: emphasis ? '0.85rem' : '0.78rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
        </div>
    </div>
);

const AttendancePage = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const location = useLocation();
    const role = user?.role || '';
    const basePath = location.pathname.split('/').slice(0, 2).join('/') || '/admin';
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

    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [assignments, setAssignments] = useState<EmployeeAssignment[]>([]);
    const [batchData, setBatchData] = useState<{ employeeId: string; firstName: string; lastName: string; checkIn: string; checkOut: string; status: AttendanceStatus; existingId?: string; notes?: string; isSelf?: boolean }[]>([]);
    const [siteAttendance, setSiteAttendance] = useState<Attendance[]>([]);
    const [siteProjectId, setSiteProjectId] = useState('');
    const [projectAttendance, setProjectAttendance] = useState<Attendance[]>([]);
    const [projectLeader, setProjectLeader] = useState<{ id?: string; name?: string }>({});
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
            setData(deduplicateAttendanceRecords(attRes.data || []));
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
            hrService.getAttendanceBySite(urlSite).then(res => setSiteAttendance(deduplicateAttendanceRecords(res.data || []))).catch(() => setSiteAttendance([]));
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
                .then(res => setProjectAttendance(deduplicateAttendanceRecords(res.data || [])))
                .catch(() => setProjectAttendance([]))
                .finally(() => setProjectAttendanceLoading(false));
            sitesService.getByProject(selectedProjectId)
                .then(res => {
                    const sites = (res.data || []) as Array<{ assignedEngineerId?: string; assignedEngineerName?: string }>;
                    const assignedSite = sites.find(site => site.assignedEngineerId || site.assignedEngineerName) || sites[0];
                    const leaderId = assignedSite?.assignedEngineerId || '';
                    const leaderName = assignedSite?.assignedEngineerName || '';
                    setProjectLeader({ id: leaderId, name: leaderName });
                })
                .catch(() => setProjectLeader({}));
        } else {
            setAssignments([]);
            setSelectedDate('');
            setBatchData([]);
            setProjectAttendance([]);
            setProjectLeader({});
        }
    }, [selectedProjectId, fetchAssignments]);

    const dedupedData = useMemo(() => deduplicateAttendanceRecords(data), [data]);
    const dedupedProjectAttendance = useMemo(() => deduplicateAttendanceRecords(projectAttendance), [projectAttendance]);
    const dedupedSiteAttendance = useMemo(() => deduplicateAttendanceRecords(siteAttendance), [siteAttendance]);

    const sortByProjectLeader = useCallback((items: Array<{ employeeId?: string }>) => {
        const leaderId = projectLeader.id;
        const leaderName = (projectLeader.name || '').trim().toLowerCase();
        return [...items].sort((a, b) => {
            const aMatchesLeader = leaderId ? a.employeeId === leaderId : false;
            const bMatchesLeader = leaderId ? b.employeeId === leaderId : false;
            if (aMatchesLeader !== bMatchesLeader) return aMatchesLeader ? -1 : 1;
            const aName = getEmployeeName(a.employeeId || '').toLowerCase();
            const bName = getEmployeeName(b.employeeId || '').toLowerCase();
            const aMatchesName = leaderName ? aName.includes(leaderName) : false;
            const bMatchesName = leaderName ? bName.includes(leaderName) : false;
            if (aMatchesName !== bMatchesName) return aMatchesName ? -1 : 1;
            return aName.localeCompare(bName);
        });
    }, [getEmployeeName, projectLeader.id, projectLeader.name]);

    const reportHierarchy = useMemo(() => {
        const source = dedupedProjectAttendance.length > 0 ? dedupedProjectAttendance : dedupedData;
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
        Object.keys(years).forEach((yr) => {
            Object.keys(years[yr]).forEach((mo) => {
                Object.keys(years[yr][mo]).forEach((dt) => {
                    years[yr][mo][dt] = sortByProjectLeader(years[yr][mo][dt]) as Attendance[];
                });
            });
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
    }, [dedupedData, dedupedProjectAttendance, sortByProjectLeader]);

    useEffect(() => {
        if (selectedProjectId && selectedDate) {
            const existingForDate = dedupedData.filter(d => d.date === selectedDate && d.projectId === selectedProjectId);
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
            const leaderRecord = projectLeader.id
                ? employees.find(emp => emp.id === projectLeader.id)
                : undefined;
            if (leaderRecord && !assigned.some(item => item.employeeId === leaderRecord.id)) {
                assigned.unshift({
                    employeeId: leaderRecord.id,
                    firstName: leaderRecord.firstName,
                    lastName: leaderRecord.lastName,
                    checkIn: existingMap.get(leaderRecord.id)?.checkIn || '09:00',
                    checkOut: existingMap.get(leaderRecord.id)?.checkOut || '17:00',
                    status: (existingMap.get(leaderRecord.id)?.status || 'present') as AttendanceStatus,
                    existingId: existingMap.get(leaderRecord.id)?.id,
                    notes: existingMap.get(leaderRecord.id)?.notes || '',
                });
            }
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
                    const merged = [selfEntry, ...assigned.filter(a => a.employeeId !== selfEntry.employeeId)];
                    setBatchData(sortByProjectLeader(merged));
                    return;
                }
            }
            setBatchData(sortByProjectLeader(assigned));
        } else {
            setBatchData([]);
        }
    }, [selectedProjectId, selectedDate, assignments, dedupedData, employees, isSiteEngineer, user, sortByProjectLeader]);

    const filtered = useMemo(() => {
        const source = urlSite ? dedupedSiteAttendance : dedupedData;
        const q = search.toLowerCase().trim();
        const filtered = source.filter(d => {
            const name = getEmployeeName(d.employeeId).toLowerCase();
            if (q && !name.includes(q) && !d.status.toLowerCase().includes(q)) return false;
            if (d.date !== dailyDate) return false;
            return true;
        });
        const leaderRecord = projectLeader.id
            ? employees.find(emp => emp.id === projectLeader.id)
            : undefined;
        if (leaderRecord && !filtered.some(item => item.employeeId === leaderRecord.id)) {
            filtered.unshift({
                ...source.find(item => item.employeeId === leaderRecord.id),
                employeeId: leaderRecord.id,
                projectId: selectedProjectId || undefined,
                date: dailyDate,
                status: 'present',
                checkIn: '09:00',
                checkOut: '17:00',
                notes: '',
            } as Attendance);
        }
        return sortByProjectLeader(filtered);
    }, [dedupedData, dedupedSiteAttendance, urlSite, search, dailyDate, getEmployeeName, sortByProjectLeader]);

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

    const stats = useMemo(() => {
        const source = urlSite ? dedupedSiteAttendance : dedupedData;
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

    const openNew = () => { setEditing(null); setShowModal(true); };
    const openEdit = (item: Attendance) => {
        setEditing(item);
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

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: '40vh', color: 'var(--text-muted)', fontSize: '0.9rem' }}><FaSpinner className="spin" size={24} style={{ color: 'var(--primary)' }} /> Loading data...</div>;

    return (
        <div className="admin-page">
            <div className="attendance-page-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0, fontSize: '1rem', flexShrink: 0 }}>
                    <FaClock style={{ color: 'var(--primary)' }} /> Attendance
                    {urlSite && <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>/ {urlSite}</span>}
                </h2>
                <div className="attendance-summary-cards">
                    <StatTile icon={<FaUsers />} label="Total" value={String(stats.total)} accent="#1B2042" emphasis />
                    <StatTile icon={<FaCheckCircle />} label="Present" value={String(stats.present)} accent="#22c55e" />
                    <StatTile icon={<FaTimesCircle />} label="Absent" value={String(stats.absent)} accent="#ef4444" />
                    <StatTile icon={<FaHourglassHalf />} label="Late" value={String(stats.late)} accent="#f59e0b" />
                    <StatTile icon={<FaBan />} label="On Leave" value={String(stats.onLeave)} accent="#1B2042" />
                    <StatTile icon={<FaUserShield />} label="Permission" value={String(stats.permission)} accent="#8b5cf6" />
                </div>
            </div>

            <div className="attendance-toolbar" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                    <div className="admin-card attendance-report-card" style={{ border: '2px solid var(--primary)', padding: '0 0.3rem', margin: 0, flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.3rem', height: '28px' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                            <FaProjectDiagram size={10} /> Daily Attendance
                        </h3>
                        <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center', flex: 1 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <select className="form-select" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} style={{ width: '100%', padding: '0 0.2rem', fontSize: '0.7rem', height: '20px', minHeight: '20px', lineHeight: '1', borderRadius: '3px' }}>
                                    <option value="">— Choose a project —</option>
                                    {projects.filter(p => !urlSite || p.id === siteProjectId).map(p => (
                                        <option key={p.id} value={p.id}>{p.name} {p.location ? `(${p.location})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ width: 110, flexShrink: 0 }}>
                                <input type="date" className="form-input" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} disabled={!selectedProjectId} style={{ width: '100%', padding: '0 0.2rem', fontSize: '0.7rem', height: '20px', minHeight: '20px', lineHeight: '1', borderRadius: '3px' }} />
                            </div>
                        </div>
                    </div>

                    <Link className="admin-btn" to={`${basePath}/attendance-reports`} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.2rem 0.7rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4, opacity: 1, alignSelf: 'flex-start', width: '100%', maxWidth: '180px', minHeight: '28px', justifyContent: 'center', marginLeft: 0, textDecoration: 'none' }}>
                        <FaClipboardList size={12} /> Attendance Report
                    </Link>
                </div>

            </div>

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
                        <button className="admin-btn" onClick={handleBatchSave} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 4, padding: '0.35rem 1rem', fontSize: '0.8rem' }}>
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

            {!selectedProjectId && (
                <div className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <input type="text" className="form-input" placeholder="Search employee, status..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', width: 280 }} />
                        </div>
                    </div>

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
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }} onClick={() => openEdit(item)}><FaEdit /></button>
                                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', color: 'var(--primary-red)' }} onClick={() => handleDelete(item.id)}><FaTrash /></button>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '0.3rem 0', flexWrap: 'wrap', gap: 4 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Showing {pageSize === 0 ? filtered.length : Math.min(pageSize, filtered.length - (page - 1) * pageSize)} of {filtered.length}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Per page:</span>
                                <select className="form-select" style={{ width: 'auto', padding: '0.2rem 1.2rem 0.2rem 0.4rem', fontSize: '0.7rem' }} value={pageSize} onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}>
                                    {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                    <option value={0}>All</option>
                                </select>
                            </div>
                            {pageSize > 0 && totalPages > 1 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.5rem' }} disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><FaChevronLeft /></button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                        <button key={p} className={p === page ? 'admin-btn' : 'admin-btn admin-btn--secondary'} style={{ padding: '0.2rem 0.5rem', minWidth: 26, fontSize: '0.75rem' }} onClick={() => setPage(p)}>{p}</button>
                                    ))}
                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.5rem' }} disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><FaChevronRight /></button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showModal && editing && (
                <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3>Edit Attendance</h3>
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
