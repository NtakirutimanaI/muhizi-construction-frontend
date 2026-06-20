import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FaProjectDiagram, FaCode, FaCertificate, FaLanguage, FaBriefcase, FaGraduationCap,
    FaEnvelope, FaEye, FaUser, FaBuilding, FaGlobeAfrica,
    FaArrowRight, FaMapMarkerAlt, FaClock, FaChartLine
} from 'react-icons/fa';
import { profileService } from '../../services/profileService';
import type { Profile } from '../../services/profileService';

interface Stats {
    projects: number;
    skills: number;
    messages: number;
    unreadMessages: number;
    certifications: number;
    experience: number;
    education: number;
    languages: number;
    views: number;
    clients: number;
}

interface VisitorStats {
    total: number;
    last30Days: number;
    last7Days: number;
    today: number;
    companies: { company: string; count: number }[];
    locations: { location: string; count: number }[];
    pages: { page: string; count: number }[];
}

const AdminDashboard = () => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [stats, setStats] = useState<Stats>({ projects: 0, skills: 0, messages: 0, unreadMessages: 0, certifications: 0, experience: 0, education: 0, languages: 0, views: 0, clients: 0 });
    const [visitorStats, setVisitorStats] = useState<VisitorStats>({ total: 0, last30Days: 0, last7Days: 0, today: 0, companies: [], locations: [], pages: [] });
    const [recentMessages, setRecentMessages] = useState<any[]>([]);

    useEffect(() => {
        const fetch = async () => {
            try { const d = await profileService.getMyProfile(); setProfile(d); } catch (e) { console.error(e); }
            try { const d = await profileService.getStats(); setStats(d); } catch (e) { console.error(e); }
            try { const d = await profileService.getVisitorStats(); setVisitorStats(d); } catch (e) { console.error(e); }
            try { const d = await profileService.getContactMessages(); setRecentMessages(d.slice(0, 5)); } catch (e) { console.error(e); }
        };
        fetch();
    }, []);

    const summaryCards = [
        { label: 'Total Visitors', value: visitorStats?.total ?? 0, icon: <FaEye />, color: '#3b82f6', sub: `${visitorStats?.today ?? 0} today` },
        { label: 'Messages', value: stats?.messages ?? 0, icon: <FaEnvelope />, color: '#7BC043', sub: `${stats?.unreadMessages ?? 0} unread` },
        { label: 'Projects', value: stats?.projects ?? 0, icon: <FaProjectDiagram />, color: '#8b5cf6', sub: 'portfolio items' },
        { label: 'Skills', value: stats?.skills ?? 0, icon: <FaCode />, color: '#22c55e', sub: 'across all categories' },
    ];

    const sectionCards = [
        { label: 'Certifications', value: stats?.certifications ?? 0, icon: <FaCertificate />, color: '#22c55e', link: '/admin/resources' },
        { label: 'Languages', value: stats?.languages ?? 0, icon: <FaLanguage />, color: '#06b6d4', link: '/admin/resources' },
        { label: 'Experience', value: stats?.experience ?? 0, icon: <FaBriefcase />, color: '#ec4899', link: '/admin/resources' },
        { label: 'Education', value: stats?.education ?? 0, icon: <FaGraduationCap />, color: '#7BC043', link: '/admin/resources' },
    ];

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                    Dashboard
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    Welcome back, {profile?.firstName || 'Admin'} — here is your portfolio overview
                </p>
            </div>

            {/* Top Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {summaryCards.map(card => (
                    <div className="content-card" key={card.label} style={{ padding: '1.25rem', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, fontSize: '1.1rem' }}>
                                {card.icon}
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{card.label}</span>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>{card.value}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{card.sub}</div>
                    </div>
                ))}
            </div>

            <div className="responsive-grid-2" style={{ marginBottom: '2rem' }}>
                {/* Visitor Locations */}
                <div className="content-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaMapMarkerAlt style={{ color: '#ef4444' }} /> Visitor Locations
                    </h3>
                    {visitorStats?.locations && visitorStats.locations.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {visitorStats.locations.map((loc, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                    <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FaGlobeAfrica size={12} style={{ color: 'var(--text-muted)' }} /> {loc.location}
                                    </span>
                                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-teal)' }}>{loc.count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No visitor data yet</p>
                    )}
                </div>

                {/* Visitor Companies */}
                <div className="content-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaBuilding style={{ color: '#7BC043' }} /> Visitor Companies
                    </h3>
                    {visitorStats?.companies && visitorStats.companies.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {visitorStats.companies.map((c, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                    <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FaBuilding size={12} style={{ color: 'var(--text-muted)' }} /> {c.company}
                                    </span>
                                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-teal)' }}>{c.count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No company data yet</p>
                    )}
                </div>

                {/* Recent Messages */}
                <div className="content-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaEnvelope style={{ color: '#3b82f6' }} /> Recent Messages
                        </h3>
                        <Link to="/admin/messages" style={{ color: 'var(--primary-teal)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            View All <FaArrowRight size={10} />
                        </Link>
                    </div>
                    {recentMessages.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {recentMessages.map((msg, i) => (
                                <Link to="/admin/messages" key={msg.id || i} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{msg.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{msg.subject || 'No subject'}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(msg.createdAt || Date.now()).toLocaleDateString()}</div>
                                            {(!msg.status || msg.status === 'new') && (
                                                <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '8px', background: '#ef4444', color: 'white', fontWeight: 700 }}>NEW</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No messages yet</p>
                    )}
                </div>

                {/* Portfolio Sections */}
                <div className="content-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaChartLine style={{ color: 'var(--primary)' }} /> Portfolio Sections
                    </h3>
                    <div className="form-grid-2">
                        {sectionCards.map(card => (
                            <Link to={card.link} key={card.label} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-body)', transition: 'all 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-color)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-body)'; }}
                                >
                                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                                        {card.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{card.label}</div>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: card.color }}>{card.value}</div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom row: Profile Info + Quick Actions */}
            <div className="responsive-grid-2">
                <div className="content-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaUser style={{ color: 'var(--primary-teal)' }} /> Profile Info
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[
                            { label: 'Name', value: `${profile?.firstName || ''} ${profile?.lastName || ''}` },
                            { label: 'Email', value: profile?.email || '' },
                            { label: 'Title', value: profile?.title || 'Not set' },
                            { label: 'Location', value: profile?.location || 'Not set' },
                            { label: 'Experience', value: `${profile?.yearsOfExperience || 0} years` },
                            { label: 'Bio', value: profile?.bio ? `${profile.bio.slice(0, 60)}...` : 'Not set' },
                        ].map(row => (
                            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                                <span style={{ fontWeight: 600, textAlign: 'right' }}>{row.value || '—'}</span>
                            </div>
                        ))}
                    </div>
                    <Link to="/admin/profile" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '1rem', color: 'var(--primary-teal)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
                        Edit Profile <FaArrowRight size={11} />
                    </Link>
                </div>

                <div className="content-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaClock style={{ color: 'var(--primary)' }} /> Quick Actions
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                            { to: '/admin/resources', icon: <FaProjectDiagram />, bg: '#7bc04315', color: '#7BC043', title: 'Manage Portfolio', sub: 'Edit projects, skills, certifications' },
                            { to: '/admin/messages', icon: <FaEnvelope />, bg: '#3b82f615', color: '#3b82f6', title: 'View Messages', sub: 'Check contact form submissions' },
                            { to: '/admin/profile', icon: <FaUser />, bg: '#22c55e15', color: '#22c55e', title: 'Update Profile', sub: 'Change your personal info' },
                        ].map(action => (
                            <Link to={action.to} key={action.title} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--bg-body)', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-color)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-body)'; }}
                            >
                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: action.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: action.color }}>{action.icon}</div>
                                <div><div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{action.title}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{action.sub}</div></div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
