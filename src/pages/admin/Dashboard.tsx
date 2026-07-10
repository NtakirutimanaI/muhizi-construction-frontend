import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaEnvelope,
    FaArrowRight,
    FaHardHat, FaTruck, FaCamera, FaClipboardList,
    FaArrowUp, FaProjectDiagram, FaMapMarkerAlt,
    FaUserTie, FaTasks, FaCalendarCheck,
} from 'react-icons/fa';
import { profileService } from '../../services/profileService';
import type { Profile } from '../../services/profileService';
import { constructionService, type Project } from '../../services/constructionService';
import { sitesService, type Site } from '../../services/sitesService';
import { hrService } from '../../services/hrService';
import { assignmentService } from '../../services/assignmentService';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isSiteManager = user?.role === 'site_manager';
    const isAdmin = user?.role === 'admin';
    const [profile, setProfile] = useState<Profile | null>(null);
    const [recentMessages, setRecentMessages] = useState<any[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [attendanceToday, setAttendanceToday] = useState(0);
    const [myAssignments, setMyAssignments] = useState<any[]>([]);

    useEffect(() => {
        const fetch = async () => {
            try { const d = await profileService.getMyProfile(); setProfile(d); } catch (e) { console.error(e); }
            if (isAdmin) {
                try { const d = await profileService.getContactMessages(); setRecentMessages(d.slice(0, 5)); } catch (e) { console.error(e); }
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
            try { const d = await hrService.getAttendanceStats(); setAttendanceToday(d.today ?? d.present ?? 0); } catch (e) { console.error(e); }
        };
        fetch();
    }, [isSiteManager, isAdmin]);

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

    const summaryCards = isSiteManager ? [
        {
            label: 'My Projects', value: projects.length, sub: `${projects.filter(p => p.status === 'in_progress').length} active`,
            icon: <FaProjectDiagram />, color: '#1B2042', gradient: 'linear-gradient(135deg, #1B2042, #2a3a6a)',
        },
        {
            label: 'My Sites', value: sites.length, sub: `${sites.filter(s => s.status === 'active').length} active`,
            icon: <FaHardHat />, color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
        },
        {
            label: 'Leading Members', value: myAssignments.length, sub: 'assigned workers',
            icon: <FaUserTie />, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
        },
        {
            label: 'Attendance', value: attendanceToday, sub: 'checked in today',
            icon: <FaCalendarCheck />, color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
        },
    ] : [
        {
            label: 'Total Projects', value: projects.length, sub: `${projects.filter(p => p.status === 'in_progress').length} active`,
            icon: <FaProjectDiagram />, color: '#1B2042', gradient: 'linear-gradient(135deg, #1B2042, #2a3a6a)',
        },
        {
            label: 'Total Sites', value: sites.length, sub: `${sites.filter(s => s.status === 'active').length} active`,
            icon: <FaHardHat />, color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
        },
        {
            label: 'Employees', value: employees.length, sub: `${employees.filter(e => e.status === 'active').length} active`,
            icon: <FaUserTie />, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
        },
        ...(isAdmin ? [{
            label: 'Messages', value: recentMessages.length, sub: `${recentMessages.filter(m => !m.status || m.status === 'new' || m.status === 'unread').length} unread`,
            icon: <FaEnvelope />, color: '#7BC043', gradient: 'linear-gradient(135deg, #7BC043, #4a8f2f)',
        }] : [{
            label: 'Attendance', value: attendanceToday, sub: 'checked in today',
            icon: <FaCalendarCheck />, color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
        }]),
    ];

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                    {isSiteManager ? 'Site Summary' : 'Dashboard'}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    Welcome back, {profile?.firstName || 'Admin'}
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

            {/* Recent Messages — admin only */}
            {isAdmin && (
            <div style={{ marginBottom: '1.5rem' }}>
                <div className="content-card" style={{ padding: '1.25rem' }}>
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
            </div>
            )}

            {/* Sites & Projects */}
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
                                    <div key={project.id} className="content-card" style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer' }}
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
        </div>
    );
};

export default AdminDashboard;
