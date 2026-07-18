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
import { profileService } from '../../services/profileService';
import type { Profile, ContactMessage } from '../../services/profileService';
import { constructionService, type Project } from '../../services/constructionService';
import { sitesService, type Site } from '../../services/sitesService';
import { hrService } from '../../services/hrService';
import { assignmentService } from '../../services/assignmentService';
import { dashboardService } from '../../services/dashboardService';
import type { AdminKpi, ManagingDirectorKpi, FinanceDirectorKpi, SiteEngineerKpi, EngineeringStudioKpi, ClientKpi } from '../../services/dashboardService';
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

// Roles with a dedicated /dashboard/* KPI endpoint but no access to /projects, /sites,
// /employees or /profile/messages — their dashboard is built entirely from that endpoint.
const EXECUTIVE_ROLES = ['managing_director', 'finance_director', 'site_engineer', 'engineering_studio', 'client'];

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

    useEffect(() => {
        const fetch = async () => {
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
                return;
            }

            if (isAdmin) {
                try {
                    const d = await profileService.getContactMessages();
                    setRecentMessages(d.slice(0, 5));
                    setMessageStats({ total: d.length, unread: d.filter(m => !m.status || m.status === 'new' || m.status === 'unread').length });
                } catch (e) { console.error(e); }
                try { const d = await dashboardService.getAdminKpi(); setKpi(d); } catch (e) { console.error(e); }
            }

            if (isSiteManager) {
                try {
                    const res = await assignmentService.getMyTeam();
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
                } catch (e) { console.error(e); }
            } else {
                try { const d = await constructionService.getProjects(); setProjects(d.data || []); } catch (e) { console.error(e); }
                try { const d = await sitesService.getAll(); setSites(d.data || []); } catch (e) { console.error(e); }
            }
            try { const d = await hrService.getEmployees(); setEmployees(d.data || []); } catch (e) { console.error(e); }
            if (role !== 'employee') {
                try { const d = await hrService.getAttendanceStats(); setAttendanceToday(d.data?.present ?? 0); } catch (e) { console.error(e); }
            }
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
        // manager / employee — no dedicated KPI endpoint; fall back to accessible list data.
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

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                    {isSiteManager ? 'Site Summary' : 'Dashboard'}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    Welcome back, {profile?.firstName || 'there'}
                </p>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {summaryCards.map(card => (
                    <div key={card.label} className="content-card" style={{
                        padding: '1rem', border: 'none', borderRadius: '10px',
                        background: card.gradient, color: '#fff', position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.9 }}>{card.label}</span>
                                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                    {card.icon}
                                </div>
                            </div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1 }}>{card.value}</div>
                            <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: '0.25rem' }}>{card.sub}</div>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-8px', right: '-8px', fontSize: '3.5rem', opacity: 0.1 }}>
                            {card.icon}
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Messages — admin only (contact messages are an admin-only endpoint) */}
            {isAdmin && (
                <div className="content-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaEnvelope style={{ color: '#1B2042' }} /> Recent Messages
                        </h3>
                        <Link to="/admin/messages" style={{ color: '#1B2042', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            View All <FaArrowRight size={10} />
                        </Link>
                    </div>
                    {recentMessages.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {recentMessages.map((msg, i) => (
                                <Link to="/admin/messages" key={msg.id || i} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '0.6rem 0', borderBottom: i < recentMessages.length - 1 ? '1px solid var(--border-color)' : 'none',
                                        transition: 'all 0.15s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-body)'; e.currentTarget.style.margin = '0 -0.5rem'; e.currentTarget.style.padding = '0.6rem 0.5rem'; e.currentTarget.style.borderRadius = '6px'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.margin = '0'; e.currentTarget.style.padding = '0.6rem 0'; e.currentTarget.style.borderRadius = '0'; }}
                                    >
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {msg.name}
                                                {(!msg.status || msg.status === 'new') && (
                                                    <span style={{ fontSize: '0.55rem', padding: '0.1rem 0.35rem', borderRadius: '6px', background: '#ef4444', color: 'white', fontWeight: 700 }}>NEW</span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.subject || 'No subject'}</div>
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                                            {new Date(msg.createdAt || Date.now()).toLocaleDateString()}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>No messages yet</p>
                    )}
                </div>
            )}

            {/* Sites & Projects — omitted for executive roles (managing_director, finance_director,
                site_engineer, engineering_studio, client); they get role-specific KPI cards above
                instead, and can still drill into the full Sites page via the sidebar. */}
            {showSitesAndProjects && (
                <div className="content-card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                        <FaHardHat style={{ color: '#1B2042', fontSize: '0.9rem' }} />
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Sites & Projects</h3>
                    </div>
                    {projects.length === 0 && sites.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>No sites or projects yet</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {projects.filter(p => sites.some(s => s.projectId === p.id)).length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>No sites linked to projects yet</p>
                            ) : (
                                projects.filter(p => sites.some(s => s.projectId === p.id)).map(project => {
                                    const projectSites = sites.filter(s => s.projectId === project.id);
                                    return (
                                        <div key={project.id} className="content-card" style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0', cursor: 'pointer' }}
                                            onClick={() => navigate(`/admin/sites/${project.id}`)}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1B2042'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                                                <FaProjectDiagram style={{ color: '#1B2042', fontSize: '1rem' }} />
                                                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{project.name}</span>
                                                <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '6px', background: project.status === 'completed' ? '#22c55e20' : project.status === 'in_progress' ? '#f59e0b20' : '#6b728020', color: project.status === 'completed' ? '#22c55e' : project.status === 'in_progress' ? '#f59e0b' : '#6b7280', fontWeight: 600, textTransform: 'capitalize' }}>{project.status.replace('_', ' ')}</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '1.5rem' }}>
                                                {projectSites.map(site => (
                                                    <div key={site.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                        <FaMapMarkerAlt size={10} style={{ color: '#1B2042' }} />
                                                        <span>{site.name}</span>
                                                        {site.location && <span style={{ opacity: 0.6 }}>— {site.location}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            {sites.filter(s => !s.projectId).length > 0 && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Unlinked Sites</div>
                                    {sites.filter(s => !s.projectId).map(site => (
                                        <div key={site.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.3rem 0' }}>
                                            <FaMapMarkerAlt size={10} style={{ color: '#f59e0b' }} />
                                            <span>{site.name}</span>
                                            {site.location && <span style={{ opacity: 0.6 }}>— {site.location}</span>}
                                            <span style={{ fontSize: '0.7rem', padding: '0.05rem 0.4rem', borderRadius: '4px', background: '#f59e0b15', color: '#f59e0b', fontWeight: 600 }}>No project</span>
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
