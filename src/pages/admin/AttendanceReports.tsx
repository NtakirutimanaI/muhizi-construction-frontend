import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaChevronDown, FaChevronRight, FaClock, FaFileExcel, FaFilePdf, FaProjectDiagram, FaSpinner, FaTimes, FaUsers } from 'react-icons/fa';
import { hrService, type Attendance, type Employee } from '../../services/hrService';
import { constructionService, type Project } from '../../services/constructionService';
import { loadPageCache, savePageCache } from '../../utils/pageCache';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type HierarchyDay = {
    date: string;
    records: Attendance[];
};

type HierarchyMonth = {
    key: string;
    monthName: string;
    dates: HierarchyDay[];
    totalRecords: number;
};

type HierarchyYear = {
    year: string;
    months: HierarchyMonth[];
    totalRecords: number;
};

const AttendanceReportsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const basePath = location.pathname.split('/').slice(0, 2).join('/') || '/admin';

    const [data, setData] = useState<Attendance[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedYear, setExpandedYear] = useState<string | null>(null);
    const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
    const [expandedDay, setExpandedDay] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const cached = loadPageCache<{ data: Attendance[]; projects: Project[]; employees: Employee[] }>('attendance-reports');
            if (cached) {
                setData(cached.data);
                setProjects(cached.projects);
                setEmployees(cached.employees);
            }

            try {
                const [attRes, empRes, projRes] = await Promise.all([
                    hrService.getAttendance(),
                    hrService.getEmployees(),
                    constructionService.getProjects().catch(() => ({ data: [] })),
                ]);
                const nextData = attRes.data || [];
                const nextProjects = projRes.data || [];
                const nextEmployees = empRes.data || [];
                setData(nextData);
                setProjects(nextProjects);
                setEmployees(nextEmployees);
                savePageCache('attendance-reports', { data: nextData, projects: nextProjects, employees: nextEmployees });
            } catch (error) {
                console.error('Failed to load attendance reports', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const reportHierarchy = useMemo<HierarchyYear[]>(() => {
        const years: Record<string, Record<string, Record<string, Attendance[]>>> = {};
        data.forEach((item) => {
            if (!item.date) return;
            const parsed = new Date(`${item.date}T00:00:00`);
            const year = String(parsed.getFullYear());
            const month = String(parsed.getMonth() + 1).padStart(2, '0');
            const day = item.date;
            if (!years[year]) years[year] = {};
            if (!years[year][month]) years[year][month] = {};
            if (!years[year][month][day]) years[year][month][day] = [];
            years[year][month][day].push(item);
        });

        return Object.keys(years).sort((a, b) => Number(b) - Number(a)).map((year) => {
            const yearRecords = Object.keys(years[year]).flatMap((month) => Object.keys(years[year][month]).flatMap((day) => years[year][month][day]));
            return {
                year,
                months: Object.keys(years[year]).sort((a, b) => Number(b) - Number(a)).map((month) => {
                    const monthName = new Date(Number(year), Number(month) - 1).toLocaleString('en', { month: 'long' });
                    const dates = Object.keys(years[year][month]).sort((a, b) => b.localeCompare(a));
                    const monthRecords = dates.flatMap((day) => years[year][month][day]);
                    return {
                        key: `${year}-${month}`,
                        monthName,
                        dates: dates.map((day) => ({
                            date: day,
                            records: years[year][month][day],
                        })),
                        totalRecords: monthRecords.length,
                    };
                }),
                totalRecords: yearRecords.length,
            };
        });
    }, [data]);

    const getEmployeeName = (employeeId: string) => {
        const employee = employees.find((item) => item.id === employeeId);
        return employee ? `${employee.firstName} ${employee.lastName}` : employeeId;
    };

    const getProjectName = (projectId?: string) => {
        if (!projectId) return 'General';
        const project = projects.find((item) => item.id === projectId);
        return project?.name || 'Unknown project';
    };

    const formatDayLabel = (dateValue: string) => {
        const parsed = new Date(`${dateValue}T00:00:00`);
        return parsed.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const exportDayToPDF = (records: Attendance[], dateValue: string) => {
        if (!records.length) return;
        const doc = new jsPDF();
        const brown = '#1B2042';
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const safeDate = dateValue.replace(/[\\/\\:]/g, '-');
        doc.setFontSize(20);
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
        doc.text(`Attendance Report — ${formatDayLabel(dateValue)}`, 14, 42);
        const rows = records.map((record, index) => [
            String(index + 1),
            getEmployeeName(record.employeeId),
            getProjectName(record.projectId),
            record.status.replace('_', ' '),
            record.checkIn || '—',
            record.checkOut || '—',
            record.notes || '—',
        ]);
        autoTable(doc, {
            head: [['#', 'Employee', 'Project', 'Status', 'Check In', 'Check Out', 'Notes']],
            body: rows,
            startY: 48,
            styles: { fontSize: 8, textColor: '#333' },
            headStyles: { fillColor: [27, 32, 66], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
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
        doc.save(`attendance-${safeDate}.pdf`);
    };

    const exportDayToExcel = (records: Attendance[], dateValue: string) => {
        if (!records.length) return;
        const safeDate = dateValue.replace(/[\\/\\:]/g, '-');
        const ws = XLSX.utils.aoa_to_sheet([
            ['MUHIZI CONSTRUCTION — Attendance Report'],
            [formatDayLabel(dateValue)],
            [],
            ['#', 'Employee', 'Project', 'Status', 'Check In', 'Check Out', 'Notes'],
            ...records.map((record, index) => [
                index + 1,
                getEmployeeName(record.employeeId),
                getProjectName(record.projectId),
                record.status.replace('_', ' '),
                record.checkIn || '—',
                record.checkOut || '—',
                record.notes || '—',
            ]),
        ]);
        ws['!cols'] = [
            { wch: 5 }, { wch: 24 }, { wch: 24 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 28 },
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Daily Report');
        XLSX.writeFile(wb, `attendance-${safeDate}.xlsx`);
    };

    return (
        <div className="admin-page">
            <div className="attendance-page-header" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, fontSize: '1rem' }}>
                        <FaCalendarAlt style={{ color: 'var(--primary)' }} /> Attendance Reports
                    </h2>
                    <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        Browse yearly, monthly and daily attendance records for all employees.
                    </p>
                </div>
                <button className="admin-btn" onClick={() => navigate(`${basePath}/attendance`)} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 4, padding: '0.35rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FaArrowLeft /> Back to attendance
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: '40vh', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <FaSpinner className="spin" size={24} style={{ color: 'var(--primary)' }} /> Loading attendance reports...
                </div>
            ) : reportHierarchy.length === 0 ? (
                <div className="admin-card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <FaClock size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <div>No attendance records available yet.</div>
                </div>
            ) : (
                <div className="admin-card" style={{ padding: '0.75rem' }}>
                    {reportHierarchy.map((yearBlock) => {
                        const yearOpen = expandedYear === yearBlock.year;
                        return (
                            <div key={yearBlock.year} style={{ border: '1px solid var(--border-color)', borderRadius: 8, marginBottom: '0.6rem', overflow: 'hidden' }}>
                                <button
                                    onClick={() => {
                                        setExpandedYear(yearOpen ? null : yearBlock.year);
                                        setExpandedMonth(null);
                                        setExpandedDay(null);
                                    }}
                                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0.8rem', background: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 700, color: '#1B2042', textAlign: 'left' }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <FaProjectDiagram /> {yearBlock.year}
                                    </span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                        {yearBlock.totalRecords} records
                                    </span>
                                </button>

                                {yearOpen && (
                                    <div style={{ padding: '0.4rem 0.6rem 0.6rem' }}>
                                        {yearBlock.months.map((monthBlock) => {
                                            const monthOpen = expandedMonth === monthBlock.key;
                                            return (
                                                <div key={monthBlock.key} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                                                    <button
                                                        onClick={() => {
                                                            setExpandedMonth(monthOpen ? null : monthBlock.key);
                                                            setExpandedDay(null);
                                                        }}
                                                        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.2rem', border: 'none', background: 'transparent', cursor: 'pointer', color: '#334155', textAlign: 'left' }}
                                                    >
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            {monthOpen ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                                                            <span style={{ fontWeight: 600 }}>{monthBlock.monthName}</span>
                                                        </span>
                                                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{monthBlock.totalRecords} records</span>
                                                    </button>

                                                    {monthOpen && (
                                                        <div style={{ padding: '0.2rem 0 0.35rem 0.95rem' }}>
                                                            {monthBlock.dates.map((dayBlock) => {
                                                                const dayOpen = expandedDay === `${monthBlock.key}-${dayBlock.date}`;
                                                                return (
                                                                    <div key={dayBlock.date} style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.35rem', marginTop: '0.35rem' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setExpandedDay(dayOpen ? null : `${monthBlock.key}-${dayBlock.date}`)}
                                                                                style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0', border: 'none', background: 'transparent', cursor: 'pointer', color: '#0f172a', textAlign: 'left' }}
                                                                            >
                                                                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                                    {dayOpen ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                                                                                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{formatDayLabel(dayBlock.date)}</span>
                                                                                </span>
                                                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{dayBlock.records.length} records</span>
                                                                            </button>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(event) => {
                                                                                        event.stopPropagation();
                                                                                        exportDayToExcel(dayBlock.records, dayBlock.date);
                                                                                    }}
                                                                                    style={{ display: 'flex', alignItems: 'center', gap: 4, border: '1px solid var(--border-color)', borderRadius: 4, background: '#fff', color: '#1B2042', padding: '0.2rem 0.35rem', fontSize: '0.68rem', cursor: 'pointer' }}
                                                                                >
                                                                                    <FaFileExcel size={10} /> Excel
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(event) => {
                                                                                        event.stopPropagation();
                                                                                        exportDayToPDF(dayBlock.records, dayBlock.date);
                                                                                    }}
                                                                                    style={{ display: 'flex', alignItems: 'center', gap: 4, border: '1px solid var(--border-color)', borderRadius: 4, background: '#fff', color: '#1B2042', padding: '0.2rem 0.35rem', fontSize: '0.68rem', cursor: 'pointer' }}
                                                                                >
                                                                                    <FaFilePdf size={10} /> PDF
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(event) => {
                                                                                        event.stopPropagation();
                                                                                        setExpandedDay(null);
                                                                                    }}
                                                                                    aria-label={`Close ${formatDayLabel(dayBlock.date)} report`}
                                                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', border: '1px solid var(--border-color)', borderRadius: '999px', background: '#fff', color: 'var(--text-muted)', cursor: 'pointer' }}
                                                                                >
                                                                                    <FaTimes size={10} />
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {dayOpen && (
                                                                            <div style={{ marginTop: '0.35rem', border: '1px solid var(--border-color)', borderRadius: 6, overflow: 'hidden' }}>
                                                                                <table className="admin-table" style={{ fontSize: '0.78rem' }}>
                                                                                    <thead>
                                                                                        <tr>
                                                                                            <th style={{ width: '24%' }}>Employee</th>
                                                                                            <th style={{ width: '20%' }}>Project</th>
                                                                                            <th style={{ width: '14%' }}>Status</th>
                                                                                            <th style={{ width: '14%' }}>Check In</th>
                                                                                            <th style={{ width: '14%' }}>Check Out</th>
                                                                                            <th style={{ width: '14%' }}>Notes</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {dayBlock.records.map((record) => (
                                                                                            <tr key={record.id}>
                                                                                                <td>{getEmployeeName(record.employeeId)}</td>
                                                                                                <td>{getProjectName(record.projectId)}</td>
                                                                                                <td>{record.status}</td>
                                                                                                <td>{record.checkIn || '—'}</td>
                                                                                                <td>{record.checkOut || '—'}</td>
                                                                                                <td>{record.notes || '—'}</td>
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
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AttendanceReportsPage;
