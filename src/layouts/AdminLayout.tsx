import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FaChartBar, FaUser, FaEnvelope, FaSignOutAlt, FaCog, FaBook,
    FaSearch, FaPlus, FaBell, FaDatabase, FaMoon, FaSun,
    FaCheck, FaTrash, FaTimes, FaProjectDiagram, FaBars, FaGlobe, FaUsers,
    FaDraftingCompass, FaHandshake, FaUserTie, FaClipboardList,
    FaMoneyBillWave, FaArrowUp, FaArrowDown, FaChartPie, FaHistory, FaBrain,
    FaInbox, FaPaperPlane, FaArchive, FaLock, FaHardHat, FaTruck, FaCamera, FaGavel,
    FaCheckDouble, FaFileAlt, FaImage, FaHome, FaInfoCircle, FaTag
} from 'react-icons/fa';
import { useNotification } from '../context/NotificationContext';
import { profileService, type Profile, type ContactMessage } from '../services/profileService';
import { AnimatePresence, motion } from 'framer-motion';
import { SIDEBAR_SECTIONS, type Role } from '../config/roles';

const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const notifTypeIcon = (type: string) => {
    switch (type) {
        case 'system': return <FaCog size={10} />;
        case 'account_activity': return <FaEnvelope size={10} />;
        case 'profile_update': return <FaUser size={10} />;
        case 'welcome': return <FaBell size={10} />;
        default: return <FaBell size={10} />;
    }
};

const notifTypeLabel: Record<string, string> = {
    all: 'All',
    system: 'System',
    account_activity: 'Messages',
    profile_update: 'Profile',
    welcome: 'Welcome',
};

const AdminLayout = ({ basePath = '/admin' }: { basePath?: string }) => {
    const { logout, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Use notification context
    const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteNotification, showNotifications, setShowNotifications } = useNotification();

    // Profile preferences for notification settings
    const [profilePrefs, setProfilePrefs] = useState<Profile | null>(null);

    // Header State with Persistence
    const [searchQuery, setSearchQuery] = useState('');
    const [isDark, setIsDark] = useState(() => {
        // Check localStorage on initial load
        const savedTheme = localStorage.getItem('adminTheme');
        return savedTheme === 'dark';
    });

    // Other UI state
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [expandedNav, setExpandedNav] = useState<string[]>(['Messages']);
    const [notifTab, setNotifTab] = useState<string>('all');

    const isOnMessages = location.pathname.startsWith(`${basePath}/messages`);
    const isOnCms = location.pathname.startsWith(`${basePath}/resources`);
    const notifRef = useRef<HTMLDivElement>(null);
    const addMenuRef = useRef<HTMLDivElement>(null);
    const profileMenuRef = useRef<HTMLDivElement>(null);


    // Messages State
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [showMessages, setShowMessages] = useState(false);
    const messagesRef = useRef<HTMLDivElement>(null);

    // Save to localStorage whenever isDark changes
    useEffect(() => {
        localStorage.setItem('adminTheme', isDark ? 'dark' : 'light');
    }, [isDark]);

    // Fetch Notifications using context
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Fetch Messages
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const data = await profileService.getInboxMessages();
                setMessages(data.slice(0, 5)); // Get latest 5
                setUnreadMessages(data.filter(m => !m.status || m.status === 'new' || m.status === 'unread').length);
            } catch (error) {
                console.error("Failed to load messages", error);
            }
        };
        fetchMessages();

        // Poll every minute
        const interval = setInterval(fetchMessages, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            if (messagesRef.current && !messagesRef.current.contains(event.target as Node)) {
                setShowMessages(false);
            }
            if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
                setShowAddMenu(false);
            }
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Load profile preferences for notification settings
    useEffect(() => {
        const loadPrefs = async () => {
            try {
                const data = await profileService.getMyProfile();
                setProfilePrefs(data);
            } catch (e) {
                console.error('Failed to load profile preferences', e);
            }
        };
        loadPrefs();
    }, []);

    // Handle notification toggle respecting user preferences
    const handleToggleNotifications = () => {
        if (profilePrefs?.preferences?.enableNotifications === false) {
            // Notifications disabled in settings - don't show dropdown
            return;
        }
        setShowNotifications(!showNotifications);
    };

    const role = (user?.role || '') as Role;

    const iconMap: Record<string, React.ReactNode> = {
        FaChartBar: <FaChartBar />, FaDatabase: <FaDatabase />,
        FaProjectDiagram: <FaProjectDiagram />, FaDraftingCompass: <FaDraftingCompass />,
        FaHandshake: <FaHandshake />, FaUserTie: <FaUserTie />,
        FaClipboardList: <FaClipboardList />, FaMoneyBillWave: <FaMoneyBillWave />,
        FaArrowUp: <FaArrowUp />, FaArrowDown: <FaArrowDown />,
        FaChartPie: <FaChartPie />, FaHistory: <FaHistory />,
        FaBrain: <FaBrain />, FaEnvelope: <FaEnvelope />,
        FaUsers: <FaUsers />, FaLock: <FaLock />,
        FaBook: <FaBook />, FaCog: <FaCog />,
        FaHardHat: <FaHardHat />, FaTruck: <FaTruck />, FaCamera: <FaCamera />, FaGavel: <FaGavel />,
        FaCheckDouble: <FaCheckDouble />, FaFileAlt: <FaFileAlt />, FaImage: <FaImage />,
        FaHome: <FaHome />, FaInfoCircle: <FaInfoCircle />, FaGlobe: <FaGlobe />,
    };

    const sections = SIDEBAR_SECTIONS
        .map(s => ({
            ...s,
            items: s.items.filter(item => item.roles.includes(role)),
        }))
        .filter(s => s.items.length > 0)
        .map(s => ({
            ...s,
            items: s.items.map(item => ({
                path: item.path.replace('/admin', basePath),
                icon: iconMap[item.icon] || <FaChartBar />,
                label: item.label,
            })),
        }));

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);
        console.log("Searching for:", val);
    };

    return (
        // Apply 'dark-mode' class to the main container
        <div className={`admin-layout ${isDark ? 'dark-mode' : ''}`}>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="sidebar-overlay active"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Header - Fixed Top */}
            <header className="admin-header">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button className="menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        <FaBars />
                    </button>
                    {/* Brand Logo */}
                    <Link to="/" className="admin-brand">
                        <span style={{ width: '12px', height: '12px', background: '#fff', borderRadius: '50%', display: 'inline-block' }}></span>
                        MUHIZI Panel
                    </Link>

                    {/* Search Bar */}
                    <div className="admin-search-container">
                        <FaSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            className="admin-search-input"
                            placeholder="Search everything..."
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>
                </div>

                <div className="admin-header-actions">
                    <div style={{ position: 'relative' }} ref={addMenuRef}>
                        <button
                            title="Create New"
                            onClick={() => setShowAddMenu(!showAddMenu)}
                            style={{ width: '35px', height: '35px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', border: 'none' }}
                        >
                            <FaPlus size={12} />
                        </button>

                        <AnimatePresence>
                            {showAddMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    style={{
                                        position: 'absolute',
                                        right: '50%',
                                        transform: 'translateX(50%)',
                                        top: '120%',
                                        width: '200px',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                                        zIndex: 1000,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden',
                                        padding: '5px'
                                    }}
                                >
                                    <div style={{ padding: '8px 12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                        Quick Add
                                    </div>
                                    <Link to={`${basePath}/profile`} onClick={() => setShowAddMenu(false)} className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem' }}>
                                        <div style={{ width: '24px', height: '24px', background: '#dcfce7', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}><FaProjectDiagram size={12} /></div>
                                        New Project
                                    </Link>
                                    <Link to={`${basePath}/profile`} onClick={() => setShowAddMenu(false)} className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem' }}>
                                        <div style={{ width: '24px', height: '24px', background: '#f3e8ff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}><FaBook size={12} /></div>
                                        New Skill
                                    </Link>
                                    <Link to={`${basePath}/resources`} onClick={() => setShowAddMenu(false)} className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem' }}>
                                        <div style={{ width: '24px', height: '24px', background: '#d4edda', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7BC043' }}><FaDatabase size={12} /></div>
                                        Add Resource
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button className="admin-icon-btn" onClick={() => setIsDark(!isDark)} title="Toggle Theme">
                        {isDark ? <FaSun /> : <FaMoon />}
                    </button>

                    <div style={{ position: 'relative' }} ref={messagesRef}>
                        <button className="admin-icon-btn" title="Messages" onClick={() => setShowMessages(!showMessages)}>
                            <FaEnvelope />
                            {unreadMessages > 0 && <span className="admin-badge">{unreadMessages}</span>}
                        </button>

                        <AnimatePresence>
                            {showMessages && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="dropdown-panel"
                                    style={{
                                        position: 'absolute',
                                        right: 0,
                                        top: '120%',
                                        width: '350px',
                                        maxHeight: '450px',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                                        zIndex: 1000,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ padding: '10px 15px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-body)' }}>
                                        <h4 style={{ fontWeight: 800, fontSize: '0.9rem' }}>Recent Messages</h4>
                                        <button onClick={() => setShowMessages(false)} style={{ color: 'var(--text-muted)' }}><FaTimes /></button>
                                    </div>

                                    <div style={{ overflowY: 'auto', flex: 1 }}>
                                        {messages.length === 0 ? (
                                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                No messages yet
                                            </div>
                                        ) : (
                                            messages.map(msg => (
                                                <Link
                                                    key={msg.id}
                                                        to={`${basePath}/messages`}
                                                        onClick={() => setShowMessages(false)}
                                                    style={{
                                                        display: 'block',
                                                        padding: '12px 15px',
                                                        borderBottom: '1px solid var(--border-color)',
                                                        background: (!msg.status || msg.status === 'new' || msg.status === 'unread') ? 'rgba(123, 192, 67, 0.05)' : 'transparent',
                                                        borderLeft: `3px solid ${(!msg.status || msg.status === 'new' || msg.status === 'unread') ? 'var(--primary)' : 'transparent'}`,
                                                        textDecoration: 'none',
                                                        color: 'inherit',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-body)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = (!msg.status || msg.status === 'new' || msg.status === 'unread') ? 'rgba(123, 192, 67, 0.05)' : 'transparent'}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                        <span style={{ fontWeight: (!msg.status || msg.status === 'new' || msg.status === 'unread') ? 800 : 600, fontSize: '0.9rem' }}>{msg.name}</span>
                                                        {(!msg.status || msg.status === 'new' || msg.status === 'unread') && (
                                                            <span style={{
                                                                fontSize: '0.65rem',
                                                                padding: '0.15rem 0.4rem',
                                                                borderRadius: '8px',
                                                                background: 'var(--primary)',
                                                                color: 'white',
                                                                fontWeight: 700
                                                            }}>NEW</span>
                                                        )}
                                                    </div>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {msg.subject || 'No subject'}
                                                    </p>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                        {new Date(msg.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </Link>
                                            ))
                                        )}
                                    </div>

                                    <Link
                                        to={`${basePath}/messages`}
                                        onClick={() => setShowMessages(false)}
                                        style={{
                                            padding: '10px 15px',
                                            borderTop: '1px solid var(--border-color)',
                                            textAlign: 'center',
                                            color: 'var(--primary-teal)',
                                            fontWeight: 700,
                                            fontSize: '0.85rem',
                                            textDecoration: 'none',
                                            display: 'block',
                                            background: 'var(--bg-body)'
                                        }}
                                    >
                                        View All Messages
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div style={{ position: 'relative' }} ref={notifRef}>
                        <button className="admin-icon-btn" title="Notifications" onClick={handleToggleNotifications}>
                            <FaBell />
                            {unreadCount > 0 && <span className="admin-badge">{unreadCount}</span>}
                        </button>

                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="dropdown-panel"
                                    style={{
                                        position: 'absolute', right: 0, top: '120%', width: '360px',
                                        maxHeight: '480px', background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)', borderRadius: '12px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 1000,
                                        display: 'flex', flexDirection: 'column', overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ padding: '10px 15px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-body)' }}>
                                        <h4 style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                                            <FaBell size={12} style={{ marginRight: 6 }} />
                                            Notifications
                                        </h4>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            {unreadCount > 0 && (
                                                <button onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                                                    title="Mark all as read"
                                                    style={{ fontSize: '0.75rem', color: 'var(--primary-teal)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                    <FaCheck size={10} /> All Read
                                                </button>
                                            )}
                                            <button onClick={() => setShowNotifications(false)} style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}><FaTimes /></button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 2, padding: '6px 10px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-body)' }}>
                                        {Object.entries(notifTypeLabel).map(([key, label]) => {
                                            const count = key === 'all' ? notifications.length : notifications.filter(n => n.type === key).length;
                                            if (count === 0 && key !== 'all') return null;
                                            return (
                                                <button key={key} onClick={() => setNotifTab(key)}
                                                    style={{
                                                        padding: '3px 8px', borderRadius: '6px', border: 'none', fontSize: '0.7rem', fontWeight: 600,
                                                        background: notifTab === key ? 'var(--primary)' : 'transparent',
                                                        color: notifTab === key ? '#000' : 'var(--text-muted)', cursor: 'pointer',
                                                    }}>
                                                    {label} ({count})
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div style={{ overflowY: 'auto', flex: 1 }}>
                                        {(() => {
                                            const filtered = notifTab === 'all' ? notifications : notifications.filter(n => n.type === notifTab);
                                            return filtered.length === 0 ? (
                                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                    <FaBell size={24} style={{ opacity: 0.2, marginBottom: 8 }} />
                                                    <p>No notifications</p>
                                                </div>
                                            ) : (
                                                filtered.map(n => (
                                                    <div key={n.id}
                                                        style={{
                                                            padding: '10px 15px',
                                                            borderBottom: '1px solid var(--border-color)',
                                                            background: n.isRead ? 'transparent' : 'rgba(var(--primary-teal-rgb, 100, 255, 218), 0.05)',
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                                            <span style={{ fontWeight: n.isRead ? 600 : 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                {notifTypeIcon(n.type)}
                                                                {n.title}
                                                            </span>
                                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                                {timeAgo(n.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 6px', lineHeight: '1.3' }}>{n.message}</p>
                                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                            {!n.isRead && (
                                                                <button onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                                                                    title="Mark as Read"
                                                                    style={{ fontSize: '0.75rem', color: 'var(--primary-teal)', background: 'transparent', padding: 2, border: 'none', cursor: 'pointer' }}>
                                                                    <FaCheck size={10} />
                                                                </button>
                                                            )}
                                                            <button onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this notification?')) deleteNotification(n.id); }}
                                                                title="Delete"
                                                                style={{ fontSize: '0.75rem', color: 'var(--primary-red)', background: 'transparent', padding: 2, border: 'none', cursor: 'pointer' }}>
                                                                <FaTrash size={10} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            );
                                        })()}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div style={{ width: '1px', height: '25px', background: 'var(--border-color)' }}></div>

                    <div style={{ position: 'relative' }} ref={profileMenuRef}>
                        <div
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                        >
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user?.firstName || 'Admin'}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{role.replace(/_/g, ' ') || 'Administrator'}</div>
                            </div>

                            {user?.avatar ? (
                                <img src={user.avatar} alt="Profile" className="admin-avatar" style={{ objectFit: 'cover' }} />
                            ) : (
                                <div className="admin-avatar">
                                    {user?.firstName?.[0] || 'A'}{user?.lastName?.[0] || 'D'}
                                </div>
                            )}
                        </div>

                        <AnimatePresence>
                            {showProfileMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    style={{
                                        position: 'absolute',
                                        right: 0,
                                        top: '120%',
                                        width: '180px',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                                        zIndex: 1000,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden',
                                        padding: '5px'
                                    }}
                                >
                                    <Link
                                        to={`${basePath}/profile`}
                                        onClick={() => setShowProfileMenu(false)}
                                        className="dropdown-item"
                                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem' }}
                                    >
                                        <FaUser /> Edit Profile
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="dropdown-item"
                                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: 'var(--primary-red)', background: 'transparent', border: 'none', fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                                    >
                                        <FaSignOutAlt /> Sign Out
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* Sidebar */}
            <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
                <nav className="admin-nav">
                    {sections.map((section, si) => (
                        <div key={si}>
                            <div style={{
                                padding: '1.5rem 1rem 0.4rem',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                color: 'var(--text-muted)',
                                letterSpacing: '0.08em',
                            }}>
                                {section.label}
                            </div>
                            {section.items.map((item) => {
                                const isActive = location.pathname.startsWith(item.path);
                                const isExpanded = expandedNav.includes(item.label);
                                const subItems: Record<string, { path: string; icon: React.ReactNode; label: string }[]> = {
                                    Messages: [
                                        { path: `${basePath}/messages/inbox`, icon: <FaInbox />, label: 'Inbox' },
                                        { path: `${basePath}/messages/sent`, icon: <FaPaperPlane />, label: 'Sent' },
                                        { path: `${basePath}/messages/trash`, icon: <FaArchive />, label: 'Trash' },
                                    ],
                                };
                                const hasSub = subItems[item.label];
                                return (
                                    <div key={item.path}>
                                        <div
                                            onClick={() => {
                                                if (hasSub) {
                                                    setExpandedNav(prev => prev.includes(item.label)
                                                        ? prev.filter(l => l !== item.label)
                                                        : [...prev, item.label]
                                                    );
                                                } else {
                                                    navigate(item.path);
                                                }
                                                setMobileMenuOpen(false);
                                            }}
                                            className={`admin-nav-item ${isActive ? 'active' : ''}`}
                                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                        >
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {item.icon}
                                                <span>{item.label}</span>
                                            </span>
                                            {hasSub && (
                                                <span style={{ fontSize: '0.6rem', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                                    ▶
                                                </span>
                                            )}
                                        </div>
                                        {hasSub && isExpanded && (
                                            <div style={{ paddingLeft: '1.5rem' }}>
                                                {hasSub.map(sub => (
                                                    <Link
                                                        key={sub.path}
                                                        to={sub.path}
                                                        className={`admin-nav-item ${location.pathname === sub.path ? 'active' : ''}`}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
                                                    >
                                                        {sub.icon}
                                                        <span>{sub.label}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid #333' }}>
                    <button
                        onClick={logout}
                        style={{ color: '#aaa', display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}
                    >
                        <FaSignOutAlt />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Messages Sub-Sidebar */}
            {isOnMessages && (
                <aside className="admin-subsidebar">
                    <div style={{ padding: '1.2rem 1rem 0.6rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                        Messages
                    </div>
                    <Link to={`${basePath}/messages/inbox`}
                        className={`admin-nav-item ${location.pathname === `${basePath}/messages/inbox` ? 'active' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                        style={{ margin: '0 0.5rem' }}>
                        <FaInbox /> <span>Inbox</span>
                    </Link>
                    <Link to={`${basePath}/messages/sent`}
                        className={`admin-nav-item ${location.pathname === `${basePath}/messages/sent` ? 'active' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                        style={{ margin: '0 0.5rem' }}>
                        <FaPaperPlane /> <span>Sent</span>
                    </Link>
                    <Link to={`${basePath}/messages/trash`}
                        className={`admin-nav-item ${location.pathname === `${basePath}/messages/trash` ? 'active' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                        style={{ margin: '0 0.5rem' }}>
                        <FaArchive /> <span>Trash</span>
                    </Link>
                </aside>
            )}

            {/* CMS Sub-Sidebar */}
            {isOnCms && (
                <aside className="admin-subsidebar">
                    <div style={{ padding: '1.2rem 1rem 0.6rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                        CMS
                    </div>
                    <Link to={`${basePath}/resources?tab=home-sections`}
                        className={`admin-nav-item ${location.pathname.startsWith(`${basePath}/resources`) && new URLSearchParams(location.search).get('tab') === 'home-sections' ? 'active' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                        style={{ margin: '0 0.5rem' }}>
                        <FaHome /> <span>Home-Sections</span>
                    </Link>
                    <Link to={`${basePath}/resources?tab=about-sections`}
                        className={`admin-nav-item ${location.pathname.startsWith(`${basePath}/resources`) && new URLSearchParams(location.search).get('tab') === 'about-sections' ? 'active' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                        style={{ margin: '0 0.5rem' }}>
                        <FaInfoCircle /> <span>About-Sections</span>
                    </Link>
                    <Link to={`${basePath}/resources?tab=footer`}
                        className={`admin-nav-item ${location.pathname.startsWith(`${basePath}/resources`) && new URLSearchParams(location.search).get('tab') === 'footer' ? 'active' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                        style={{ margin: '0 0.5rem' }}>
                        <FaGlobe /> <span>Footer</span>
                    </Link>
                    <Link to={`${basePath}/resources?tab=brand`}
                        className={`admin-nav-item ${location.pathname.startsWith(`${basePath}/resources`) && new URLSearchParams(location.search).get('tab') === 'brand' ? 'active' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                        style={{ margin: '0 0.5rem' }}>
                        <FaTag /> <span>Brand</span>
                    </Link>
                </aside>
            )}

            {/* Content Wrapper */}
            <div className={`admin-content ${isOnMessages || isOnCms ? 'admin-content--with-subsidebar' : ''}`}>
                <main className="admin-main">
                    <Outlet context={{ searchQuery }} />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
