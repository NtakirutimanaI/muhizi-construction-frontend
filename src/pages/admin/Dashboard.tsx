import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FaEnvelope, FaEye,
    FaArrowRight,
    FaCalendarDay, FaCalendarWeek, FaCalendarAlt,
    FaHardHat, FaTruck, FaCamera, FaClipboardList,
    FaChartLine, FaArrowUp,
} from 'react-icons/fa';
import { profileService } from '../../services/profileService';
import type { Profile } from '../../services/profileService';

interface Stats {
    messages: number;
    unreadMessages: number;
}

interface VisitorStats {
    total: number;
    last30Days: number;
    last7Days: number;
    today: number;
}

const AdminDashboard = () => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [stats, setStats] = useState<Stats>({ messages: 0, unreadMessages: 0 });
    const [visitorStats, setVisitorStats] = useState<VisitorStats>({ total: 0, last30Days: 0, last7Days: 0, today: 0 });
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

    const quickActions = [
        { to: '/admin/site-activities', icon: <FaHardHat />, bg: '#f59e0b', label: 'Site Activities', sub: 'Daily site logs' },
        { to: '/admin/material-requests', icon: <FaTruck />, bg: '#3b82f6', label: 'Material Requests', sub: 'Track materials' },
        { to: '/admin/project-evidence', icon: <FaCamera />, bg: '#8b5cf6', label: 'Project Evidence', sub: 'Photos & videos' },
        { to: '/admin/attendance', icon: <FaClipboardList />, bg: '#22c55e', label: 'Attendance', sub: 'Worker check-ins' },
    ];

    const summaryCards = [
        {
            label: 'Total Visitors', value: visitorStats?.total ?? 0, sub: `${visitorStats?.today ?? 0} today`,
            icon: <FaEye />, color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        },
        {
            label: 'Messages', value: stats?.messages ?? 0, sub: `${stats?.unreadMessages ?? 0} unread`,
            icon: <FaEnvelope />, color: '#7BC043', gradient: 'linear-gradient(135deg, #7BC043, #4a8f2f)',
        },
    ];

    const trendCards = [
        { label: 'Today', value: visitorStats?.today ?? 0, icon: <FaCalendarDay />, color: '#22c55e' },
        { label: 'Last 7 Days', value: visitorStats?.last7Days ?? 0, icon: <FaCalendarWeek />, color: '#3b82f6' },
        { label: 'Last 30 Days', value: visitorStats?.last30Days ?? 0, icon: <FaCalendarAlt />, color: '#8b5cf6' },
    ];

    const maxTrend = Math.max(visitorStats?.today ?? 1, visitorStats?.last7Days ?? 1, visitorStats?.last30Days ?? 1);

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                    Dashboard
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    Welcome back, {profile?.firstName || 'Admin'}
                </p>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {summaryCards.map(card => (
                    <div key={card.label} className="content-card" style={{
                        padding: '1.5rem', border: 'none', borderRadius: '12px',
                        background: card.gradient, color: '#fff', position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.9 }}>{card.label}</span>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                                    {card.icon}
                                </div>
                            </div>
                            <div style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1 }}>{card.value}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: '0.4rem' }}>{card.sub}</div>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-12px', right: '-12px', fontSize: '5rem', opacity: 0.1 }}>
                            {card.icon}
                        </div>
                    </div>
                ))}
            </div>

            {/* Visitor Trends + Messages Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Visitor Trends */}
                <div className="content-card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaChartLine style={{ color: '#8B4513' }} /> Visitor Trends
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {trendCards.map(c => {
                            const pct = maxTrend > 0 ? Math.round((c.value / maxTrend) * 100) : 0;
                            return (
                                <div key={c.label}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, fontSize: '0.75rem' }}>
                                                {c.icon}
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{c.label}</span>
                                        </div>
                                        <span style={{ fontWeight: 800, fontSize: '1rem', color: c.color }}>{c.value}</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'var(--bg-body)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: c.color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Messages */}
                <div className="content-card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaEnvelope style={{ color: '#3b82f6' }} /> Recent Messages
                        </h3>
                        <Link to="/admin/messages" style={{ color: '#8B4513', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
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

            {/* Quick Actions */}
            <div className="content-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <FaArrowUp style={{ color: '#8B4513', fontSize: '0.9rem' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Quick Actions</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    {quickActions.map(action => (
                        <Link to={action.to} key={action.label}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem',
                                borderRadius: '10px', textDecoration: 'none', color: 'inherit',
                                background: 'var(--bg-body)', border: '1px solid var(--border-color)',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = action.bg; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 12px ${action.bg}20`; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '10px',
                                background: `${action.bg}15`, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', color: action.bg, fontSize: '1rem',
                            }}>
                                {action.icon}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{action.label}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{action.sub}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
