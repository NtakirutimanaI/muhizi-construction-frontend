import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaEnvelope,
    FaArrowRight,
    FaHardHat, FaTruck, FaCamera, FaClipboardList,
    FaChartLine, FaProjectDiagram, FaMapMarkerAlt,
    FaUserTie, FaMoneyBillWave, FaTasks, FaCalendarCheck,
    FaExclamationTriangle, FaWallet, FaFileInvoiceDollar, FaDraftingCompass,
    FaArrowUp, FaArrowDown, FaGavel, FaCheckCircle, FaTimesCircle,
    FaClock, FaFileAlt,
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
import { engineeringSubmissionsService } from '../../services/engineeringSubmissionsService';
import type { EngineeringSubmission } from '../../services/engineeringSubmissionsService';
import type { AdminKpi, ManagingDirectorKpi, FinanceDirectorKpi, SiteEngineerKpi, EngineeringStudioKpi, ClientKpi } from '../../services/dashboardService';
import type { YearlyReport } from '../../services/financeService';
import { useAuth } from '../../context/AuthContext';
import { loadPageCache, savePageCache } from '../../utils/pageCache';

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
    const isStorekeeper = role === 'storekeeper';
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
    const [recentSubmissions, setRecentSubmissions] = useState<EngineeringSubmission[]>([]);
    type AnyKpi = Partial<AdminKpi & ManagingDirectorKpi & FinanceDirectorKpi & SiteEngineerKpi & EngineeringStudioKpi & ClientKpi>;
    const [kpi, setKpi] = useState<AnyKpi | null>(null);
    const [yearlyReport, setYearlyReport] = useState<YearlyReport | null>(null);

    useEffect(() => {
        const cached = loadPageCache(role);
        if (cached) {
            if (cached.profile) setProfile(cached.profile);
            if (cached.recentMessages) setRecentMessages(cached.recentMessages);
            if (cached.messageStats) setMessageStats(cached.messageStats);
            if (cached.projects) setProjects(cached.projects);
            if (cached.sites) setSites(cached.sites);
            if (cached.employees) setEmployees(cached.employees);
            if (cached.attendanceToday != null) setAttendanceToday(cached.attendanceToday);
            if (cached.myAssignments) setMyAssignments(cached.myAssignments);
            if (cached.kpi) setKpi(cached.kpi);
            if (cached.yearlyReport) setYearlyReport(cached.yearlyReport);
        }

        const fetchFresh = async () => {
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
                    savePageCache(role, { kpi: d });
                } catch (e) { console.error(e); }

                if (role === 'engineering_studio') {
                    try {
                        const res = await engineeringSubmissionsService.getMy();
                        const subs = (res.data || []) as EngineeringSubmission[];
                        setRecentSubmissions(subs.slice(0, 5));
                        savePageCache(role, { recentSubmissions: subs.slice(0, 5) });
                    } catch (e) { console.error(e); }
                }
                return;
            }

            const dataPromises: Promise<any>[] = [];
            const cacheData: any = {};

            if (isAdmin) {
                dataPromises.push(
                    profileService.getContactMessages().then(d => {
                        setRecentMessages(d.slice(0, 5));
                        setMessageStats({ total: d.length, unread: d.filter(m => !m.status || m.status === 'new' || m.status === 'unread').length });
                        cacheData.recentMessages = d.slice(0, 5);
                        cacheData.messageStats = { total: d.length, unread: d.filter(m => !m.status || m.status === 'new' || m.status === 'unread').length };
                    }).catch(e => console.error(e)),
                    dashboardService.getAdminKpi().then(d => { setKpi(d); cacheData.kpi = d; }).catch(e => console.error(e)),
                    financeService.getYearlyReport(new Date().getFullYear()).then(d => { setYearlyReport(d.data); cacheData.yearlyReport = d.data; }).catch(e => console.error(e)),
                );
            }

            if (isStorekeeper) {
                dataPromises.push(
                    assignmentService.getMyTeam().then(async res => {
                        const assignments = res.data || [];
                        setMyAssignments(assignments);
                        cacheData.myAssignments = assignments;
                        const projectIds = [...new Set(assignments.map((a: any) => a.projectId).filter(Boolean))] as string[];
                        const siteIds = [...new Set(assignments.map((a: any) => a.siteId).filter(Boolean))] as string[];
                        const [projRes, siteRes] = await Promise.all([
                            constructionService.getProjects(),
                            sitesService.getAll(),
                        ]);
                        const allProjects = projRes.data || [];
                        const allSites = siteRes.data || [];
                        const filteredProjects = allProjects.filter((p: Project) => projectIds.includes(p.id));
                        const filteredSites = allSites.filter((s: Site) => siteIds.includes(s.id) || projectIds.includes(s.projectId));
                        setProjects(filteredProjects);
                        setSites(filteredSites);
                        cacheData.projects = filteredProjects;
                        cacheData.sites = filteredSites;
                    }).catch(e => console.error(e))
                );
            } else {
                dataPromises.push(
                    constructionService.getProjects().then(d => { setProjects(d.data || []); cacheData.projects = d.data || []; }).catch(e => console.error(e)),
                    sitesService.getAll().then(d => { setSites(d.data || []); cacheData.sites = d.data || []; }).catch(e => console.error(e)),
                );
            }
            dataPromises.push(
                hrService.getEmployees().then(d => { setEmployees(d.data || []); cacheData.employees = d.data || []; }).catch(e => console.error(e)),
            );
            if (role !== 'employee') {
                dataPromises.push(
                    hrService.getAttendanceStats().then(d => { setAttendanceToday(d.data?.present ?? 0); cacheData.attendanceToday = d.data?.present ?? 0; }).catch(e => console.error(e)),
                );
            }

            await Promise.all(dataPromises);
            cacheData.profile = cached?.profile || null;
            savePageCache(role, cacheData);
        };
        fetchFresh();
    }, [role, isStorekeeper, isAdmin, isExecutive]);

    const quickActions = isStorekeeper ? [
        { to: '/admin/site-activities', icon: <FaHardHat />, bg: '#f59e0b', label: 'Site Activities', sub: `${sites.length} my sites` },
        { to: '/admin/material-requests', icon: <FaTruck />, bg: '#1B2042', label: 'Material Requests', sub: `${projects.length} my projects` },
        { to: '/admin/employee-assignments', icon: <FaTasks />, bg: '#8b5cf6', label: 'My Team', sub: `${myAssignments.length} assignments` },
        { to: '/admin/attendance', icon: <FaClipboardList />, bg: '#22c55e', label: 'Attendance', sub: `${attendanceToday} checked in today` },
    ] : role === 'finance_director' ? [
        { to: '/admin/payroll', icon: <FaMoneyBillWave />, bg: '#1B2042', label: 'Payroll', sub: `${kpi?.pendingPayments ?? 0} pending payments` },
        { to: '/admin/incomes', icon: <FaArrowUp />, bg: '#22c55e', label: 'Incomes', sub: `${moneyShort(kpi?.mtdIncomes ?? 0)} this month` },
        { to: '/admin/expenses', icon: <FaArrowDown />, bg: '#8b5cf6', label: 'Expenses', sub: `${moneyShort(kpi?.mtdExpenses ?? 0)} this month` },
        { to: '/admin/reports', icon: <FaChartLine />, bg: '#f59e0b', label: 'Reports', sub: `${moneyShort(kpi?.cashFlow ?? 0)} cash flow` },
    ] : role === 'engineering_studio' ? [
        { to: '/admin/engineering-submissions', icon: <FaDraftingCompass />, bg: '#8b5cf6', label: 'Submissions', sub: `${kpi?.mySubmissions ?? 0} total submissions` },
        { to: '/admin/designs', icon: <FaClipboardList />, bg: '#1B2042', label: 'Designs', sub: `${kpi?.totalDesigns ?? 0} total designs` },
        { to: '/admin/daily-tasks', icon: <FaTasks />, bg: '#22c55e', label: 'Daily Tasks', sub: `${kpi?.pendingTasks ?? 0} pending tasks` },
        { to: '/admin/site-rules', icon: <FaGavel />, bg: '#f59e0b', label: 'Site Rules', sub: 'View rules & policies' },
    ] : [
        { to: '/admin/site-activities', icon: <FaHardHat />, bg: '#f59e0b', label: 'Site Activities', sub: `${sites.length} sites` },
        { to: '/admin/material-requests', icon: <FaTruck />, bg: '#1B2042', label: 'Material Requests', sub: `${projects.length} projects` },
        { to: '/admin/project-evidence', icon: <FaCamera />, bg: '#8b5cf6', label: 'Project Evidence', sub: `${sites.filter(s => (s.evidence?.length ?? 0) > 0).length} sites with media` },
        { to: '/admin/attendance', icon: <FaClipboardList />, bg: '#22c55e', label: 'Attendance', sub: `${attendanceToday} checked in today` },
    ];

    let summaryCards: Card[];

    if (isStorekeeper) {
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
                    { label: 'Income (MTD)', value: money(kpi?.mtdIncomes ?? 0), sub: 'this month', icon: <FaMoneyBillWave />, color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
                    { label: 'Expenses (MTD)', value: money(kpi?.mtdExpenses ?? 0), sub: 'this month', icon: <FaWallet />, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
                    { label: 'Cash Flow (MTD)', value: money(kpi?.cashFlow ?? 0), sub: 'income minus expenses', icon: <FaChartLine />, color: '#1B2042', gradient: 'linear-gradient(135deg, #1B2042, #2a3a6a)' },
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
                    { label: 'Total Designs', value: kpi?.totalDesigns ?? 0, sub: 'in studio', icon: <FaDraftingCompass />, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
                    { label: 'Approved Designs', value: kpi?.approvedDesigns ?? 0, sub: 'approved', icon: <FaCheckCircle />, color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
                    { label: 'My Submissions', value: kpi?.mySubmissions ?? 0, sub: 'submitted by you', icon: <FaFileAlt />, color: '#1B2042', gradient: 'linear-gradient(135deg, #1B2042, #2a3a6a)' },
                    { label: 'Pending Review', value: kpi?.pendingSubmissions ?? 0, sub: 'awaiting review', icon: <FaClock />, color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
                    { label: 'My Tasks', value: kpi?.myTasks ?? 0, sub: 'assigned to you', icon: <FaTasks />, color: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
                    { label: 'Pending Tasks', value: kpi?.pendingTasks ?? 0, sub: 'to complete', icon: <FaClipboardList />, color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
                    { label: 'Completed Tasks', value: kpi?.completedTasks ?? 0, sub: 'done', icon: <FaCheckCircle />, color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
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
        if (role === 'storekeeper') {
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

    const projectLocationData = (() => {
        const counts: Record<string, number> = {};
        projects.forEach(p => {
            const loc = p.location || 'Unspecified';
            counts[loc] = (counts[loc] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    })();

    const performanceMetrics = (() => {
        const metrics: { label: string; value: string; change: number }[] = [];
        if (isAdmin && kpi) {
            metrics.push({ label: 'Total Income', value: moneyShort(kpi.mtdIncomes ?? 0), change: 2.35 });
            metrics.push({ label: 'Total Expenses', value: moneyShort(kpi.mtdExpenses ?? 0), change: -1.5 });
            metrics.push({ label: 'Pending Approvals', value: String(kpi.pendingApprovals ?? 0), change: kpi.pendingApprovals ?? 0 > 5 ? -4.5 : 2.21 });
            metrics.push({ label: 'Stock Alerts', value: String(kpi.stockAlerts ?? 0), change: kpi.stockAlerts ?? 0 > 3 ? -2.5 : 1.26 });
        } else if (isExecutive && kpi) {
            if (role === 'managing_director') {
                metrics.push({ label: 'Active Sites', value: String(kpi.activeSites ?? 0), change: 3.1 });
                metrics.push({ label: 'Pending Requests', value: String(kpi.pendingRequests ?? 0), change: kpi.pendingRequests ?? 0 > 5 ? -4.5 : 2.21 });
                metrics.push({ label: 'Stock Alerts', value: String(kpi.stockAlerts ?? 0), change: kpi.stockAlerts ?? 0 > 2 ? -2.5 : 1.5 });
                metrics.push({ label: 'Recent Evidence', value: String(kpi.recentEvidence ?? 0), change: 8.7 });
            } else if (role === 'finance_director') {
                metrics.push({ label: 'Income', value: moneyShort(kpi.mtdIncomes ?? 0), change: 2.35 });
                metrics.push({ label: 'Expenses', value: moneyShort(kpi.mtdExpenses ?? 0), change: -1.5 });
                metrics.push({ label: 'Cash Flow', value: moneyShort(kpi.cashFlow ?? 0), change: 4.2 });
                metrics.push({ label: 'Pending Payments', value: String(kpi.pendingPayments ?? 0), change: kpi.pendingPayments ?? 0 > 3 ? -3.1 : 1.8 });
            }
        } else {
            metrics.push({ label: 'Projects', value: String(projects.length), change: 2.5 });
            metrics.push({ label: 'Active', value: String(projects.filter(p => p.status === 'in_progress').length), change: 1.2 });
            metrics.push({ label: 'Sites', value: String(sites.length), change: 3.8 });
            metrics.push({ label: 'Employees', value: String(employees.length), change: 0.8 });
        }
        return metrics;
    })();

    const renderPieLabel = ({ name, percent }: any) => {
        if (percent < 0.05) return null;
        return `${name} ${(percent * 100).toFixed(0)}%`;
    };

    const isEngineeringStudio = role === 'engineering_studio';

    const submissionStatusData = (() => {
        if (!isEngineeringStudio || !kpi) return [];
        const data = [
            { name: 'Pending', value: kpi.pendingSubmissions ?? 0 },
            { name: 'Approved', value: kpi.approvedSubmissions ?? 0 },
            { name: 'Rejected', value: kpi.rejectedSubmissions ?? 0 },
        ].filter(d => d.value > 0);
        return data;
    })();

    const designsOverviewData = (() => {
        if (!isEngineeringStudio || !kpi) return [];
        return [
            { name: 'Approved', value: kpi.approvedDesigns ?? 0 },
            { name: 'Other', value: (kpi.totalDesigns ?? 0) - (kpi.approvedDesigns ?? 0) },
        ].filter(d => d.value > 0);
    })();

    const engPerformanceMetrics = (() => {
        if (!isEngineeringStudio || !kpi) return [];
        const total = kpi.mySubmissions ?? 0;
        const approved = kpi.approvedSubmissions ?? 0;
        const rate = total > 0 ? Math.round((approved / total) * 100) : 0;
        return [
            { label: 'Total Designs', value: String(kpi.totalDesigns ?? 0), change: 5.0 },
            { label: 'Approved Designs', value: String(kpi.approvedDesigns ?? 0), change: 3.2 },
            { label: 'My Submissions', value: String(kpi.mySubmissions ?? 0), change: 1.8 },
            { label: 'Approval Rate', value: `${rate}%`, change: rate >= 50 ? 2.5 : -1.5 },
        ];
    })();

    return (
        <div className="db-page">
            <div className="db-container">
                <div className="db-content">
                    <div className="db-quick-actions">
                        {quickActions.map(action => (
                            <Link to={action.to} key={action.label} className="db-quick-action">
                                <div className="db-quick-action-icon" style={{ background: action.bg }}>{action.icon}</div>
                                <div>
                                    <div className="db-quick-action-label">{action.label}</div>
                                    <div className="db-quick-action-sub">{action.sub}</div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="db-kpi-row">
                        {summaryCards.map(card => (
                            <div key={card.label} className="db-kpi-card-sm" style={{ background: card.gradient }}>
                                <div className="db-kpi-sm-content">
                                    <div className="db-kpi-sm-top">
                                        <span className="db-kpi-sm-label">{card.label}</span>
                                        <div className="db-kpi-sm-icon">{card.icon}</div>
                                    </div>
                                    <div className="db-kpi-sm-value">{card.value}</div>
                                    <div className="db-kpi-sm-sub">{card.sub}</div>
                                </div>
                                <div className="db-kpi-sm-watermark">{card.icon}</div>
                            </div>
                        ))}
                    </div>

                    {(isAdmin || role === 'finance_director' || (isExecutive && !isEngineeringStudio)) && (
                        <div className="db-charts-row">
                            <div className="db-chart-card">
                                <h3 className="db-chart-title">
                                    <FaChartLine style={{ color: '#22c55e' }} /> Income Trend — {new Date().getFullYear()}
                                </h3>
                                {monthlyChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200}>
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
                                    <div className="db-chart-empty">No financial data yet</div>
                                )}
                            </div>
                            <div className="db-chart-card">
                                <h3 className="db-chart-title">
                                    <FaWallet style={{ color: '#8b5cf6' }} /> Monthly Income vs Expenses
                                </h3>
                                {monthlyChartData.length > 0 ? (
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
                                    <div className="db-chart-empty">No financial data yet</div>
                                )}
                            </div>
                        </div>
                    )}

                    {isEngineeringStudio ? (
                        <div className="db-charts-row db-charts-row-3">
                            <div className="db-chart-card">
                                <h3 className="db-chart-title">
                                    <FaDraftingCompass style={{ color: '#8b5cf6' }} /> Submissions by Status
                                </h3>
                                {submissionStatusData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={150}>
                                        <PieChart>
                                            <Pie data={submissionStatusData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" label={renderPieLabel} labelLine={false}>
                                                {submissionStatusData.map((_: any, i: number) => (
                                                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="db-chart-empty">No submissions yet</div>
                                )}
                            </div>
                            <div className="db-chart-card">
                                <h3 className="db-chart-title">
                                    <FaClipboardList style={{ color: '#1B2042' }} /> Designs Overview
                                </h3>
                                {designsOverviewData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={150}>
                                        <BarChart data={designsOverviewData} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e5e7eb)" />
                                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                                            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                            <Bar dataKey="value" name="Designs" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                                                {designsOverviewData.map((_: any, i: number) => (
                                                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="db-chart-empty">No designs yet</div>
                                )}
                            </div>
                            <div className="db-chart-card">
                                <h3 className="db-chart-title">
                                    <FaChartLine style={{ color: '#22c55e' }} /> Performance
                                </h3>
                                <div className="db-perf-list">
                                    {engPerformanceMetrics.map(m => (
                                        <div key={m.label} className="db-perf-item">
                                            <span className="db-perf-label">{m.label}</span>
                                            <div className="db-perf-right">
                                                <span className="db-perf-value">{m.value}</span>
                                                <span className={`db-perf-change ${m.change >= 0 ? 'db-perf-change--up' : 'db-perf-change--down'}`}>
                                                    ({m.change >= 0 ? '+' : ''}{m.change.toFixed(2)})
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="db-charts-row db-charts-row-3">
                            <div className="db-chart-card">
                                <h3 className="db-chart-title">
                                    <FaProjectDiagram style={{ color: '#1B2042' }} /> Projects by Status
                                </h3>
                            {projectStatusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={150}>
                                    <PieChart>
                                        <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" label={renderPieLabel} labelLine={false}>
                                            {projectStatusData.map((_: any, i: number) => (
                                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="db-chart-empty">No projects yet</div>
                            )}
                        </div>
                        <div className="db-chart-card">
                            <h3 className="db-chart-title">
                                <FaUserTie style={{ color: '#8b5cf6' }} /> Employees by Dept
                            </h3>
                            {employeeDeptData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={150}>
                                    <BarChart data={employeeDeptData} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e5e7eb)" />
                                        <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 8 }} />
                                        <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="count" name="Employees" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                                            {employeeDeptData.map((_: any, i: number) => (
                                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="db-chart-empty">No employees yet</div>
                            )}
                        </div>
                        <div className="db-chart-card">
                            <h3 className="db-chart-title">
                                <FaHardHat style={{ color: '#f59e0b' }} /> Sites by Status
                            </h3>
                            {siteStatusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={150}>
                                    <PieChart>
                                        <Pie data={siteStatusData} cx="50%" cy="50%" outerRadius={55} dataKey="value" label={renderPieLabel} labelLine={false}>
                                            {siteStatusData.map((_: any, i: number) => (
                                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="db-chart-empty">No sites yet</div>
                            )}
                        </div>
                    </div>
                    )}

                    {isEngineeringStudio ? (
                        <div className="db-two-col">
                            <div className="db-geo-card">
                                <h3 className="db-section-title">
                                    <FaDraftingCompass style={{ color: '#8b5cf6' }} /> Recent Submissions
                                </h3>
                                {recentSubmissions.length > 0 ? (
                                    <div className="db-sites-list">
                                        {recentSubmissions.map((sub) => (
                                            <Link
                                                key={sub.id}
                                                to="/admin/engineering-submissions"
                                                className="db-project-item"
                                                style={{ textDecoration: 'none', color: 'inherit' }}
                                            >
                                                <div className="db-project-header">
                                                    <FaDraftingCompass style={{ color: '#8b5cf6', fontSize: '1rem' }} />
                                                    <span className="db-project-name">{sub.title}</span>
                                                    <span style={{
                                                        fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                                                        borderRadius: 10, textTransform: 'capitalize',
                                                        background: sub.status === 'approved' ? '#22c55e18' : sub.status === 'rejected' ? '#ef444418' : '#f59e0b18',
                                                        color: sub.status === 'approved' ? '#22c55e' : sub.status === 'rejected' ? '#ef4444' : '#f59e0b',
                                                    }}>
                                                        {sub.status}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                                    {sub.documentUrls?.length || 0} document(s) — {new Date(sub.createdAt).toLocaleDateString()}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="db-chart-empty">No submissions yet</p>
                                )}
                            </div>
                            <div className="db-perf-card">
                                <h3 className="db-section-title">
                                    <FaChartLine style={{ color: '#22c55e' }} /> Your Performance
                                </h3>
                                <div className="db-perf-list">
                                    {engPerformanceMetrics.map(m => (
                                        <div key={m.label} className="db-perf-item">
                                            <span className="db-perf-label">{m.label}</span>
                                            <div className="db-perf-right">
                                                <span className="db-perf-value">{m.value}</span>
                                                <span className={`db-perf-change ${m.change >= 0 ? 'db-perf-change--up' : 'db-perf-change--down'}`}>
                                                    ({m.change >= 0 ? '+' : ''}{m.change.toFixed(2)})
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="db-two-col">
                            <div className="db-geo-card">
                                <h3 className="db-section-title">
                                    <FaMapMarkerAlt style={{ color: '#1B2042' }} /> Project Distribution
                            </h3>
                            {projectLocationData.length > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={projectLocationData}
                                                cx="50%" cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                dataKey="value"
                                                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {projectLocationData.map((_: any, i: number) => (
                                                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="db-geo-legend">
                                        {projectLocationData.map((item, idx) => (
                                            <div key={idx} className="db-geo-legend-item">
                                                <span className="db-geo-legend-dot" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                                                <span>{item.name}: {item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="db-chart-empty">No project locations yet</div>
                            )}
                        </div>
                        <div className="db-perf-card">
                            <h3 className="db-section-title">
                                <FaChartLine style={{ color: '#22c55e' }} /> Performance
                            </h3>
                                <div className="db-perf-list">
                                    {performanceMetrics.map(m => (
                                        <div key={m.label} className="db-perf-item">
                                            <span className="db-perf-label">{m.label}</span>
                                            <div className="db-perf-right">
                                                <span className="db-perf-value">{m.value}</span>
                                                <span className={`db-perf-change ${m.change >= 0 ? 'db-perf-change--up' : 'db-perf-change--down'}`}>
                                                    ({m.change >= 0 ? '+' : ''}{m.change.toFixed(2)})
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                        </div>
                    </div>
                    )}

                    <div className="db-charts-row db-charts-row-2">
                    {isAdmin && (
                        <div className="db-chart-card">
                            <div className="db-chart-header">
                                <h3 className="db-chart-title">
                                    <FaEnvelope style={{ color: '#1B2042' }} /> Recent Messages
                                </h3>
                                <Link to="/admin/messages" className="db-view-all">
                                    View All <FaArrowRight size={10} />
                                </Link>
                            </div>
                            {recentMessages.length > 0 ? (
                                <div className="db-messages-list">
                                    {recentMessages.map((msg, i) => (
                                        <Link to="/admin/messages" key={msg.id || i} className="db-message-item" style={{ borderBottom: i < recentMessages.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                            <div className="db-message-info">
                                                <div className="db-message-name">
                                                    {msg.name}
                                                    {(!msg.status || msg.status === 'new') && (
                                                        <span className="db-message-badge">NEW</span>
                                                    )}
                                                </div>
                                                <div className="db-message-subject">{msg.subject || 'No subject'}</div>
                                            </div>
                                            <div className="db-message-date">
                                                {new Date(msg.createdAt || Date.now()).toLocaleDateString()}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="db-chart-empty">No messages yet</p>
                            )}
                        </div>
                    )}

                    {showSitesAndProjects && (
                        <div className="db-chart-card">
                            <div className="db-chart-header">
                                <h3 className="db-chart-title">
                                    <FaHardHat style={{ color: '#1B2042' }} /> Sites & Projects
                                </h3>
                            </div>
                            {projects.length === 0 && sites.length === 0 ? (
                                <p className="db-chart-empty">No sites or projects yet</p>
                            ) : (
                                <div className="db-sites-list">
                                    {projects.filter(p => sites.some(s => s.projectId === p.id)).length === 0 ? (
                                        <p className="db-chart-empty">No sites linked to projects yet</p>
                                    ) : (
                                        projects.filter(p => sites.some(s => s.projectId === p.id)).map(project => {
                                            const projectSites = sites.filter(s => s.projectId === project.id);
                                            return (
                                                <div key={project.id} className="db-project-item" onClick={() => navigate(`/admin/sites/${project.id}`)}>
                                                    <div className="db-project-header">
                                                        <FaProjectDiagram style={{ color: '#1B2042', fontSize: '1rem' }} />
                                                        <span className="db-project-name">{project.name}</span>
                                                        <span className={`db-project-status db-project-status--${project.status}`}>
                                                            {project.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <div className="db-project-sites">
                                                        {projectSites.map(site => (
                                                            <div key={site.id} className="db-project-site">
                                                                <FaMapMarkerAlt size={10} style={{ color: '#1B2042' }} />
                                                                <span>{site.name}</span>
                                                                {site.location && <span className="db-project-site-loc">— {site.location}</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    {sites.filter(s => !s.projectId).length > 0 && (
                                        <div className="db-unlinked-section">
                                            <div className="db-unlinked-label">Unlinked Sites</div>
                                            {sites.filter(s => !s.projectId).map(site => (
                                                <div key={site.id} className="db-project-site">
                                                    <FaMapMarkerAlt size={10} style={{ color: '#f59e0b' }} />
                                                    <span>{site.name}</span>
                                                    {site.location && <span className="db-project-site-loc">— {site.location}</span>}
                                                    <span className="db-unlinked-badge">No project</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    </div>

                    <div className="db-footer">
                        <span>Muhizi Construction</span>
                        <span>&copy; {new Date().getFullYear()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
