import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaEnvelope,
    FaArrowRight,
    FaHardHat, FaTruck, FaCamera, FaClipboardList,
    FaChartLine, FaProjectDiagram, FaMapMarkerAlt,
    FaUserTie, FaMoneyBillWave, FaTasks, FaCalendarCheck,
    FaExclamationTriangle, FaWallet, FaFileInvoiceDollar, FaDraftingCompass,
} from 'react-icons/fa';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer,
    LineChart, Line,
} from 'recharts';
import { profileService } from '../../services/profileService';
import type { Profile, ContactMessage } from '../../services/profileService';
import { constructionService, type Project } from '../../services/constructionService';
import { sitesService, type Site } from '../../services/sitesService';
import { hrService } from '../../services/hrService';
import { assignmentService } from '../../services/assignmentService';
import { dashboardService } from '../../services/dashboardService';
import { financeService } from '../../services/financeService';
import type { AdminKpi, ManagingDirectorKpi, FinanceDirectorKpi, SiteEngineerKpi, EngineeringStudioKpi, ClientKpi } from '../../services/dashboardService';
import type { YearlyReport } from '../../services/financeService';
import { useAuth } from '../../context/AuthContext';

interface Card {
    label: string;
    value: number | string;
    sub: string;
    icon: React.ReactNode;
    color: string;
    gradient: string;
}

const money = (n: number) => `RWF ${Math.round(n).toLocaleString()}`;
const moneyShort = (n: number) => {
    if (n >= 1_000_000) return `RWF ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `RWF ${(n / 1_000).toFixed(0)}K`;
    return `RWF ${Math.round(n).toLocaleString()}`;
};

const EXECUTIVE_ROLES = ['managing_director', 'finance_director', 'site_engineer', 'engineering_studio', 'client'];

const CHART_COLORS = ['#1B2042', '#f59e0b', '#22c55e', '#8b5cf6', '#ef4444', '#3b82f6', '#ec4899', '#06b6d4'];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const role = user?.role || '';
    const isSiteManager = role === 'site_manager';
    const isAdmin = role === 'admin';
    const isExecutive = EXECUTIVE_ROLES.includes(role);

    const [profile, setProfile] = useState<Profile | null>(null);
    const [recentMessages, setRecentMessages] = useState<ContactMessage[]>([]);
    const [messageStats, setMessageStats] = useState({ total: 0, unread: 0 });
    const [projects, setProjects] = useState<Project[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [attendanceToday, setAttendanceToday] = useState(0);
    const [myAssignments, setMyAssignments] = useState<any[]>([]);
    type AnyKpi = Partial<AdminKpi & ManagingDirectorKpi & FinanceDirectorKpi & SiteEngineerKpi & EngineeringStudioKpi & ClientKpi>;
    const [kpi, setKpi] = useState<AnyKpi | null>(null);
    const [yearlyReport, setYearlyReport] = useState<YearlyReport | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try { const d = await profileService.getMyProfile(); setProfile(d); } catch (e) { console.error(e); }

            if (isExecutive) {
                try {
                    let d: AnyKpi;
                    switch (role) {
                        case 'managing_director': d = await dashboardService.getManagingDirectorKpi(); break;
                        case 'finance_director': d = await dashboardService.getFinanceDirectorKpi(); break;
                        case 'site_engineer': d = await dashboardService.getSiteEngineerKpi(); break;
                        case 'engineering_studio': d = await dashboardService.getEngineeringStudioKpi(); break;
                        default: d = await dashboardService.getClientKpi();
                    }
                    setKpi(d);
                } catch (e) { console.error(e); }
                setLoading(false);
                return;
            }

            const dataPromises: Promise<any>[] = [];

            if (isAdmin) {
                dataPromises.push(
                    profileService.getContactMessages().then(d => {
                        setRecentMessages(d.slice(0, 5));
                        setMessageStats({ total: d.length, unread: d.filter(m => !m.status || m.status === 'new' || m.status === 'unread').length });
                    }).catch(e => console.error(e)),
                    dashboardService.getAdminKpi().then(d => setKpi(d)).catch(e => console.error(e)),
                    financeService.getYearlyReport(new Date().getFullYear()).then(d => setYearlyReport(d.data)).catch(e => console.error(e)),
                );
            }

            if (isSiteManager) {
                dataPromises.push(
                    assignmentService.getMyTeam().then(async res => {
                        const assignments = res.data || [];
                        setMyAssignments(assignments);
                        const projectIds = [...new Set(assignments.map((a: any) => a.projectId).filter(Boolean))] as string[];
                        const siteIds = [...new Set(assignments.map((a: any) => a.siteId).filter(Boolean))] as string[];
                        const [projRes, siteRes] = await Promise.all([
                            constructionService.getProjects(),
                            sitesService.getAll(),
                        ]);
                        const allProjects = projRes.data || [];
                        const allSites = siteRes.data || [];
                        setProjects(allProjects.filter((p: Project) => projectIds.includes(p.id)));
                        setSites(allSites.filter((s: Site) => siteIds.includes(s.id) || projectIds.includes(s.projectId)));
                    }).catch(e => console.error(e))
                );
            } else {
                dataPromises.push(
                    constructionService.getProjects().then(d => setProjects(d.data || [])).catch(e => console.error(e)),
                    sitesService.getAll().then(d => setSites(d.data || [])).catch(e => console.error(e)),
                );
            }
            dataPromises.push(
                hrService.getEmployees().then(d => setEmployees(d.data || [])).catch(e => console.error(e)),
            );
            if (role !== 'employee') {
                dataPromises.push(
                    hrService.getAttendanceStats().then(d => setAttendanceToday(d.data?.present ?? 0)).catch(e => console.error(e)),
                );
            }

            await Promise.all(dataPromises);
            setLoading(false);
        };
        fetch();
    }, [role, isSiteManager, isAdmin, isExecutive]);

    const quickActions = isSiteManager ? [
        { to: '/admin/site-activities', icon: <FaHardHat />, bg: '#f59e0b', label: 'Site Activities', sub: `${sites.length} my sites` },
        { to: '/admin/material-requests', icon: <FaTruck />, bg: '#1B2042', label: 'Material Requests', sub: `${projects.length} my projects` },
        { to: '/admin/employee-assignments', icon: <FaTasks />, bg: '#8b5cf6', label: 'My Team', sub: `${myAssignments.length} assignments` },
        { to: '/admin/attendance', icon: <FaClipboardList />, bg: '#22c55e', label: 'Attendance', sub: `${attendanceToday} checked in today` },
    ] : [
        { to: '/admin/site-activities', icon: <FaHardHat />, bg: '#f59e0b', label: 'Site Activities', sub: `${sites.length} sites` },
        { to: '/admin/material-requests', icon: <FaTruck />, bg: '#1B2042', label: 'Material Requests', sub: `${projects.length} projects` },
        { to: '/admin/project-evidence', icon: <FaCamera />, bg: '#8b5cf6', label: 'Project Evidence', sub: `${sites.filter(s => (s.evidence?.length ?? 0) > 0).length} sites with media` },
        { to: '/admin/attendance', icon: <FaClipboardList />, bg: '#22c55e', label: 'Attendance', sub: `${attendanceToday} checked in today` },
    ];

    let summaryCards: Card[];

    if (isSiteManager) {
        summaryCards = [
            { label: 'My Projects', value: projects.length, sub: `${projects.filter(p => p.status === 'in_progress').length} active`, icon: <FaProjectDiagram />, color: '#1B2042', gradient: 'linear-gradient(135deg, #1B2042, #2a3a6a)' },
            { label: 'My Sites', value: sites.length, sub: `${sites.filter(s => s.status === 'active').length} active`, icon: <FaHardHat />, color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
            { label: 'Leading Members', value: myAssignments.length, sub: 'assigned workers', icon: <FaUserTie />, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
            { label: 'Attendance', value: attendanceToday, sub: 'checked in today', icon: <FaCalendarCheck />, color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
        ];
    } else if (isAdmin) {
        summaryCards = [
            { label: 'Total Projects', value: projects.length, sub: `${projects.filter(p => p.status === 'in_progress').length} active`, icon: <FaProjectDiagram />, color: '#1B2042', gradient: 'linear-gradient(135deg, #1B2042, #2a3a6a)' },
            { label: 'Total Sites', value: sites.length, sub: `${sites.filter(s => s.status === 'active').length} active`, icon: <FaHardHat />, color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
            { label: 'Employees', value: employees.length, sub: `${employees.filter(e => e.status === 'active').length} active`, icon: <FaUserTie />, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
            { label: 'Messages', value: messageStats.total, sub: `${messageStats.unread} unread`, icon: <FaEnvelope />, color: '#7BC043', gradient: 'linear-gradient(135deg, #7BC043, #4a8f2f)' },
            { label: 'Pending Approvals', value: kpi?.pendingApprovals ?? 0, sub: 'awaiting decision', icon: <FaClipboardList />, color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #b45309)' },
            { label: 'Stock Alerts', value: kpi?.stockAlerts ?? 0, sub: 'items out of stock', icon: <FaExclamationTriangle />, color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #b91c1c)' },
            { label: 'Income (MTD)', value: money(kpi?.mtdIncomes ?? 0), sub: 'this month', icon: <FaMoneyBillWave />, color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
            { label: 'Expenses (MTD)', value: money(kpi?.mtdExpenses ?? 0), sub: 'this month', icon: <FaWallet />, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
        ];
    } else if (isExecutive) {
        switch (role) {
            case 'managing_director':
                summaryCards = [
                    { label: 'Active Sites', value: kpi?.activeSites ?? 0, sub: 'currently active', icon: <FaHardHat />, color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
                    { label: 'Pending Requests', value: kpi?.pendingRequests ?? 0, sub: 'material requests', icon: <FaClipboardList />, color: '#1B2042', gradient: 'linear-gradient(135deg, #1B2042, #2a3a6a)' },
                    { label: 'Stock Alerts', value: kpi?.stockAlerts ?? 0, sub: 'items out of stock', icon: <FaExclamationTriangle />, color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #b91c1c)' },
                    { label: 'Recent Evidence', value: kpi?.recentEvidence ?? 0, sub: 'project evidence items', icon: <FaCamera />, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
                ];
                break;
            case 'finance_director':
                summaryCards = [
                    { label: 'Income (MTD)', value: money(kpi?.mtdIncomes ?? 0), sub: 'this month', icon: <FaMoneyBillWave />, color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
                    { label: 'Expenses (MTD)', value: money(kpi?.mtdExpenses ?? 0), sub: 'this month', icon: <FaWallet />, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
                    { label: 'Cash Flow (MTD)', value: money(kpi?.cashFlow ?? 0), sub: 'income minus expenses', icon: <FaChartLine />, color: '#1B2042', gradient: 'linear-gradient(135deg, #1B2042, #2a3a6a)' },
                    { label: 'Pending Payments', value: kpi?.pendingPayments ?? 0, sub: 'awaiting approval', icon: <FaFileInvoiceDollar />, color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
                ];
                break;
            case 'site_engineer':
                summaryCards = [
                    { label: 'Assigned Sites', value: kpi?.assignedSites ?? 0, sub: 'total sites', icon: <FaHardHat />, color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
                    { label: 'Pending Requests', value: kpi?.pendingRequests ?? 0, sub: 'your material requests', icon: <FaClipboardList />, color: '#1B2042', gradient: 'linear-gradient(135deg, #1B2042, #2a3a6a)' },
                ];
                break;
            case 'engineering_studio':
                summaryCards = [
                    { label: 'Assigned Designs', value: kpi?.assignedDesigns ?? 0, sub: 'in your studio', icon: <FaDraftingCompass />, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
                    { label: 'Pending Submissions', value: kpi?.pendingSubmissions ?? 0, sub: 'awaiting review', icon: <FaClipboardList />, color: '#1B2042', gradient: 'linear-gradient(135deg, #1B2042, #2a3a6a)' },
                ];
                break;
            default:
                summaryCards = [
                    { label: 'Total Projects', value: kpi?.totalProjects ?? 0, sub: 'your projects', icon: <FaProjectDiagram />, color: '#1B2042', gradient: 'linear-gradient(135deg, #1B2042, #2a3a6a)' },
                    { label: 'Active Projects', value: kpi?.activeProjects ?? 0, sub: 'in progress', icon: <FaHardHat />, color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
                ];
        }
    } else {
        summaryCards = [
            { label: 'Total Projects', value: projects.length, sub: `${projects.filter(p => p.status === 'in_progress').length} active`, icon: <FaProjectDiagram />, color: '#1B2042', gradient: 'linear-gradient(135deg, #1B2042, #2a3a6a)' },
            { label: 'Total Sites', value: sites.length, sub: `${sites.filter(s => s.status === 'active').length} active`, icon: <FaHardHat />, color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
            { label: 'Employees', value: employees.length, sub: `${employees.filter(e => e.status === 'active').length} active`, icon: <FaUserTie />, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
        ];
        if (role === 'manager') {
            summaryCards.push({ label: 'Attendance', value: attendanceToday, sub: 'checked in today', icon: <FaCalendarCheck />, color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' });
        }
    }

    const showSitesAndProjects = !isExecutive;

    const monthlyChartData = yearlyReport?.monthlyData?.map((m: any) => ({
        name: MONTH_NAMES[m.month - 1],
        Income: m.income,
        Expenses: m.expense,
    })) || [];

    const projectStatusData = (() => {
        const counts: Record<string, number> = {};
        projects.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
        return Object.entries(counts)
            .map(([name, value]) => ({ name: name.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()), value }))
            .filter(d => d.value > 0);
    })();

    const siteStatusData = (() => {
        const counts: Record<string, number> = {};
        sites.forEach(s => { counts[s.status] = (counts[s.status] || 0) + 1; });
        return Object.entries(counts)
            .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
            .filter(d => d.value > 0);
    })();

    const employeeDeptData = (() => {
        const counts: Record<string, number> = {};
        employees.forEach((e: any) => { const dept = e.department || 'Other'; counts[dept] = (counts[dept] || 0) + 1; });
        return Object.entries(counts)
            .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count: value }))
            .sort((a, b) => b.count - a.count);
    })();

    const expenseCategoryData = (() => {
        const report = yearlyReport as any;
        if (!report?.expenseByCategory) return [];
        return Object.entries(report.expenseByCategory)
            .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value: value as number }))
            .sort((a, b) => b.value - a.value);
    })();

    const renderPieLabel = ({ name, percent }: any) => {
        if (percent < 0.05) return null;
        return `${name} ${(percent * 100).toFixed(0)}%`;
    };

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">
                        {isSiteManager ? 'Site Summary' : 'Dashboard'}
                    </h1>
                    <p className="dashboard-subtitle">
                        Welcome back, {profile?.firstName || 'there'}
                    </p>
                </div>
                <div className="dashboard-quick-actions">
                    {quickActions.map(action => (
                        <Link to={action.to} key={action.label} className="dashboard-quick-action" style={{ '--qa-bg': action.bg } as any}>
                            <div className="dashboard-quick-action-icon" style={{ background: action.bg }}>{action.icon}</div>
                            <div>
                                <div className="dashboard-quick-action-label">{action.label}</div>
                                <div className="dashboard-quick-action-sub">{action.sub}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="dashboard-cards">
                {summaryCards.map(card => (
                    <div key={card.label} className="dashboard-card" style={{ background: card.gradient }}>
                        <div className="dashboard-card-content">
                            <div className="dashboard-card-top">
                                <span className="dashboard-card-label">{card.label}</span>
                                <div className="dashboard-card-icon-box" style={{ background: 'rgba(255,255,255,0.2)' }}>
                                    {card.icon}
                                </div>
                            </div>
                            <div className="dashboard-card-value">{card.value}</div>
                            <div className="dashboard-card-sub">{card.sub}</div>
                        </div>
                        <div className="dashboard-card-watermark">{card.icon}</div>
                    </div>
                ))}
            </div>

            {(isAdmin || role === 'finance_director') && (
                <div className="dashboard-charts-row">
                    <div className="dashboard-chart-card dashboard-chart-wide">
                        <h3 className="dashboard-chart-title">
                            <FaChartLine style={{ color: '#22c55e' }} /> Monthly Income vs Expenses
                        </h3>
                        {loading ? (
                            <div className="dashboard-skeleton dashboard-skeleton-chart" />
                        ) : monthlyChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={monthlyChartData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e5e7eb)" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 9 }} tickFormatter={(v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : v} />
                                    <Tooltip formatter={(value: number) => money(value)} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Legend />
                                    <Bar dataKey="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Expenses" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="dashboard-chart-empty">No financial data yet</div>
                        )}
                    </div>

                    <div className="dashboard-chart-card">
                        <h3 className="dashboard-chart-title">
                            <FaWallet style={{ color: '#8b5cf6' }} /> Expense Breakdown
                        </h3>
                        {loading ? (
                            <div className="dashboard-skeleton dashboard-skeleton-pie" />
                        ) : expenseCategoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={expenseCategoryData}
                                        cx="50%" cy="50%"
                                        outerRadius={80}
                                        dataKey="value"
                                        label={renderPieLabel}
                                        labelLine={false}
                                    >
                                        {expenseCategoryData.map((_: any, i: number) => (
                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => money(value)} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="dashboard-chart-empty">No expense data yet</div>
                        )}
                    </div>
                </div>
            )}

            <div className="dashboard-charts-row">
                <div className="dashboard-chart-card">
                    <h3 className="dashboard-chart-title">
                        <FaProjectDiagram style={{ color: '#1B2042' }} /> Projects by Status
                    </h3>
                    {loading ? (
                        <div className="dashboard-skeleton dashboard-skeleton-pie" />
                    ) : projectStatusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie
                                    data={projectStatusData}
                                    cx="50%" cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    dataKey="value"
                                    label={renderPieLabel}
                                    labelLine={false}
                                >
                                    {projectStatusData.map((_: any, i: number) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="dashboard-chart-empty">No projects yet</div>
                    )}
                </div>

                <div className="dashboard-chart-card dashboard-chart-wide">
                    <h3 className="dashboard-chart-title">
                        <FaUserTie style={{ color: '#8b5cf6' }} /> Employees by Department
                    </h3>
                    {loading ? (
                        <div className="dashboard-skeleton dashboard-skeleton-chart" />
                    ) : employeeDeptData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={employeeDeptData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e5e7eb)" />
                                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="count" name="Employees" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                                    {employeeDeptData.map((_: any, i: number) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="dashboard-chart-empty">No employees yet</div>
                    )}
                </div>

                <div className="dashboard-chart-card">
                    <h3 className="dashboard-chart-title">
                        <FaHardHat style={{ color: '#f59e0b' }} /> Sites by Status
                    </h3>
                    {loading ? (
                        <div className="dashboard-skeleton dashboard-skeleton-pie" />
                    ) : siteStatusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie
                                    data={siteStatusData}
                                    cx="50%" cy="50%"
                                    outerRadius={70}
                                    dataKey="value"
                                    label={renderPieLabel}
                                    labelLine={false}
                                >
                                    {siteStatusData.map((_: any, i: number) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="dashboard-chart-empty">No sites yet</div>
                    )}
                </div>
            </div>

            {isAdmin && (
                <div className="dashboard-chart-card" style={{ marginBottom: '1rem' }}>
                    <h3 className="dashboard-chart-title">
                        <FaChartLine style={{ color: '#1B2042' }} /> Income Trend — {new Date().getFullYear()}
                    </h3>
                    {loading ? (
                        <div className="dashboard-skeleton dashboard-skeleton-chart" />
                    ) : monthlyChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={170}>
                            <LineChart data={monthlyChartData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e5e7eb)" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 9 }} tickFormatter={(v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : v} />
                                <Tooltip formatter={(value: number) => money(value)} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Legend />
                                <Line type="monotone" dataKey="Income" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4, fill: '#22c55e' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="dashboard-chart-empty">No financial data yet</div>
                    )}
                </div>
            )}

            {isAdmin && (
                <div className="dashboard-chart-card" style={{ marginBottom: '1rem' }}>
                    <div className="dashboard-chart-header">
                        <h3 className="dashboard-chart-title">
                            <FaEnvelope style={{ color: '#1B2042' }} /> Recent Messages
                        </h3>
                        <Link to="/admin/messages" className="dashboard-view-all">
                            View All <FaArrowRight size={10} />
                        </Link>
                    </div>
                    {recentMessages.length > 0 ? (
                        <div className="dashboard-messages-list">
                            {recentMessages.map((msg, i) => (
                                <Link to="/admin/messages" key={msg.id || i} className="dashboard-message-item" style={{ borderBottom: i < recentMessages.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                    <div className="dashboard-message-info">
                                        <div className="dashboard-message-name">
                                            {msg.name}
                                            {(!msg.status || msg.status === 'new') && (
                                                <span className="dashboard-message-badge">NEW</span>
                                            )}
                                        </div>
                                        <div className="dashboard-message-subject">{msg.subject || 'No subject'}</div>
                                    </div>
                                    <div className="dashboard-message-date">
                                        {new Date(msg.createdAt || Date.now()).toLocaleDateString()}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="dashboard-chart-empty">No messages yet</p>
                    )}
                </div>
            )}

            {showSitesAndProjects && (
                <div className="dashboard-chart-card">
                    <div className="dashboard-chart-header">
                        <h3 className="dashboard-chart-title">
                            <FaHardHat style={{ color: '#1B2042' }} /> Sites & Projects
                        </h3>
                    </div>
                    {projects.length === 0 && sites.length === 0 ? (
                        <p className="dashboard-chart-empty">No sites or projects yet</p>
                    ) : (
                        <div className="dashboard-sites-list">
                            {projects.filter(p => sites.some(s => s.projectId === p.id)).length === 0 ? (
                                <p className="dashboard-chart-empty">No sites linked to projects yet</p>
                            ) : (
                                projects.filter(p => sites.some(s => s.projectId === p.id)).map(project => {
                                    const projectSites = sites.filter(s => s.projectId === project.id);
                                    return (
                                        <div key={project.id} className="dashboard-project-item" onClick={() => navigate(`/admin/sites/${project.id}`)}>
                                            <div className="dashboard-project-header">
                                                <FaProjectDiagram style={{ color: '#1B2042', fontSize: '1rem' }} />
                                                <span className="dashboard-project-name">{project.name}</span>
                                                <span className={`dashboard-project-status dashboard-project-status--${project.status}`}>
                                                    {project.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="dashboard-project-sites">
                                                {projectSites.map(site => (
                                                    <div key={site.id} className="dashboard-project-site">
                                                        <FaMapMarkerAlt size={10} style={{ color: '#1B2042' }} />
                                                        <span>{site.name}</span>
                                                        {site.location && <span className="dashboard-project-site-loc">— {site.location}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            {sites.filter(s => !s.projectId).length > 0 && (
                                <div className="dashboard-unlinked-section">
                                    <div className="dashboard-unlinked-label">Unlinked Sites</div>
                                    {sites.filter(s => !s.projectId).map(site => (
                                        <div key={site.id} className="dashboard-project-site">
                                            <FaMapMarkerAlt size={10} style={{ color: '#f59e0b' }} />
                                            <span>{site.name}</span>
                                            {site.location && <span className="dashboard-project-site-loc">— {site.location}</span>}
                                            <span className="dashboard-unlinked-badge">No project</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
