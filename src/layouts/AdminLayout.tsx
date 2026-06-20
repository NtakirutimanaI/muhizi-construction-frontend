import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FaChartBar, FaUser, FaEnvelope, FaSignOutAlt, FaCog, FaBook,
    FaSearch, FaPlus, FaBell, FaDatabase, FaMoon, FaSun,
    FaCheck, FaTrash, FaTimes, FaProjectDiagram, FaBars, FaGlobe, FaUsers,
    FaDraftingCompass, FaHandshake, FaUserTie, FaClipboardList,
    FaMoneyBillWave, FaArrowUp, FaArrowDown, FaChartPie, FaHistory, FaBrain,
    FaInbox, FaPaperPlane, FaArchive, FaLock, FaHardHat, FaTruck, FaCamera
} from 'react-icons/fa';
import { useNotification } from '../context/NotificationContext';
import { profileService, type Profile, type ContactMessage } from '../services/profileService';
import { AnimatePresence, motion } from 'framer-motion';
import { SIDEBAR_SECTIONS, type Role } from '../config/roles';

const AdminLayout = () => {
    const { logout, user } = useAuth();
    const location = useLocation();

    // Use notification context
    const { notifications, unreadCount, fetchNotifications, markAsRead, deleteNotification, showNotifications, setShowNotifications } = useNotification();

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

    const isOnMessages = location.pathname.startsWith('/admin/messages');
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
        FaHardHat: <FaHardHat />, FaTruck: <FaTruck />, FaCamera: <FaCamera />,
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
                path: item.path,
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
                        <span style={{ width: '12px', height: '12px', background: 'var(--primary)', borderRadius: '50%', display: 'inline-block' }}></span>
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
                            style={{ width: '35px', height: '35px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', cursor: 'pointer', border: 'none' }}
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
                                    <Link to="/admin/profile" onClick={() => setShowAddMenu(false)} className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem' }}>
                                        <div style={{ width: '24px', height: '24px', background: '#dcfce7', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}><FaProjectDiagram size={12} /></div>
                                        New Project
                                    </Link>
                                    <Link to="/admin/profile" onClick={() => setShowAddMenu(false)} className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem' }}>
                                        <div style={{ width: '24px', height: '24px', background: '#f3e8ff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}><FaBook size={12} /></div>
                                        New Skill
                                    </Link>
                                    <Link to="/admin/resources" onClick={() => setShowAddMenu(false)} className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem' }}>
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
                                                    to="/admin/messages"
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
                                        to="/admin/messages"
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
                                        position: 'absolute',
                                        right: 0,
                                        top: '120%',
                                        width: '320px',
                                        maxHeight: '400px',
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
                                        <h4 style={{ fontWeight: 800, fontSize: '0.9rem' }}>Notifications</h4>
                                        <button onClick={() => setShowNotifications(false)} style={{ color: 'var(--text-muted)' }}><FaTimes /></button>
                                    </div>

                                    <div style={{ overflowY: 'auto', flex: 1 }}>
                                        {notifications.length === 0 ? (
                                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                No notifications
                                            </div>
                                        ) : (
                                            notifications.map(n => (
                                                <div
                                                    key={n.id}
                                                    style={{
                                                        padding: '12px 15px',
                                                        borderBottom: '1px solid var(--border-color)',
                                                        background: n.isRead ? 'transparent' : 'rgba(var(--primary-teal-rgb, 100, 255, 218), 0.05)',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                        <span style={{ fontWeight: n.isRead ? 600 : 800, fontSize: '0.9rem', color: n.isRead ? 'var(--text-muted)' : 'var(--text-main)' }}>{n.title}</span>
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                            {new Date(n.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.4' }}>{n.message}</p>

                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        {!n.isRead && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    markAsRead(n.id);
                                                                }}
                                                                title="Mark as Read"
                                                                style={{ fontSize: '0.8rem', color: 'var(--primary-teal)', background: 'transparent', padding: '2px', border: 'none', cursor: 'pointer' }}
                                                            >
                                                                <FaCheck />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (window.confirm('Delete this notification?')) {
                                                                    deleteNotification(n.id);
                                                                }
                                                            }}
                                                            title="Delete"
                                                            style={{ fontSize: '0.8rem', color: 'var(--primary-red)', background: 'transparent', padding: '2px', border: 'none', cursor: 'pointer' }}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
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
                                        to="/admin/profile"
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
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`admin-nav-item ${isActive ? 'active' : ''}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </Link>
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
                    <Link to="/admin/messages/inbox"
                        className={`admin-nav-item ${location.pathname === '/admin/messages/inbox' ? 'active' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                        style={{ margin: '0 0.5rem' }}>
                        <FaInbox /> <span>Inbox</span>
                    </Link>
                    <Link to="/admin/messages/sent"
                        className={`admin-nav-item ${location.pathname === '/admin/messages/sent' ? 'active' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                        style={{ margin: '0 0.5rem' }}>
                        <FaPaperPlane /> <span>Sent</span>
                    </Link>
                    <Link to="/admin/messages/trash"
                        className={`admin-nav-item ${location.pathname === '/admin/messages/trash' ? 'active' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                        style={{ margin: '0 0.5rem' }}>
                        <FaArchive /> <span>Trash</span>
                    </Link>
                </aside>
            )}

            {/* Content Wrapper */}
            <div className={`admin-content ${isOnMessages ? 'admin-content--with-subsidebar' : ''}`}>
                <main className="admin-main">
                    <Outlet context={{ searchQuery }} />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
