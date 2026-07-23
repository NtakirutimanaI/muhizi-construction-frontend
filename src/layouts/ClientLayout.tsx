import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaImage, FaClipboardList, FaSignOutAlt, FaBars, FaSun, FaMoon, FaCamera, FaGavel, FaFileAlt, FaChartBar } from 'react-icons/fa';
import { useToast } from '../context/ToastContext';
import { ROLE_AREA_TITLE, ROLE_AREA_BG, type Role } from '../config/roles';
import { uploadService } from '../services/uploadService';
import { profileService } from '../services/profileService';

const NAV_ITEMS = [
  { path: '', icon: <FaChartBar />, label: 'Dashboard' },
  { path: '/sites', icon: <FaImage />, label: 'Sites' },
  { path: '/progress-reports', icon: <FaFileAlt />, label: 'Progress Reports' },
  { path: '/updates', icon: <FaClipboardList />, label: 'Updates' },
  { path: '/site-rules', icon: <FaGavel />, label: 'Site Rules' },
  { path: '/profile', icon: <FaUser />, label: 'My Profile' },
];

const SECTION_LABELS: Record<string, string> = {
  '': 'Dashboard',
  '/profile': 'My Profile',
  '/sites': 'Sites',
  '/progress-reports': 'Progress Reports',
  '/updates': 'Updates',
  '/site-rules': 'Site Rules',
};

const SECTION_ICONS: Record<string, React.ReactNode> = {
  '': <FaChartBar size={14} />,
  '/profile': <FaUser size={14} />,
  '/sites': <FaImage size={14} />,
  '/progress-reports': <FaFileAlt size={14} />,
  '/updates': <FaClipboardList size={14} />,
  '/site-rules': <FaGavel size={14} />,
};

const ClientLayout = ({ basePath = '/client-panel' }: { basePath?: string }) => {
  const { logout, user, updateUser } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('clientTheme');
    return saved === 'dark';
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const role = (user?.role || '') as Role;

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem('clientTheme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const currentPath = location.pathname.replace(basePath, '');
  const sectionLabel = SECTION_LABELS[currentPath] || 'Dashboard';
  const sectionIcon = SECTION_ICONS[currentPath];

  return (
    <div className={`admin-layout ${isDark ? 'dark-mode' : ''}`}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay active" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Header */}
      <header className="admin-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '1rem', paddingRight: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '0 0 auto' }}>
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FaBars />
          </button>
          <div onClick={() => navigate(basePath)} style={{
            background: ROLE_AREA_BG[role] || 'linear-gradient(135deg, #6c3096, #b84c8c)',
            borderRadius: '10px', padding: '0.25rem 0.7rem', margin: '4px 0',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            textDecoration: 'none', cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.3 }}>
              <span style={{ fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.02em', color: '#fff' }}>
                {ROLE_AREA_TITLE[role] || 'Client Panel'}
              </span>
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                {user?.firstName || ''} {user?.lastName || ''}
              </span>
            </div>
          </div>
        </div>

        <div className="admin-header-actions">
          <button className="admin-icon-btn" onClick={() => setIsDark(!isDark)} title="Toggle Theme">
            {isDark ? <FaSun /> : <FaMoon />}
          </button>

          <div style={{ width: '1px', height: '25px', background: 'var(--border-color)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            onClick={() => fileInputRef.current?.click()}>
            <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) { showToast('Image must be under 2MB', 'error'); return; }
                setUploading(true);
                try {
                  const uploaded = await uploadService.uploadFile(file);
                  await profileService.updateProfile({ avatar: uploaded.secureUrl });
                  updateUser({ avatar: uploaded.secureUrl });
                  showToast('Avatar updated', 'success');
                } catch {
                  showToast('Failed to upload avatar', 'error');
                }
                setUploading(false);
              }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user?.firstName || 'Client'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>Client</div>
            </div>
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="admin-avatar" style={{ objectFit: 'cover' }} />
            ) : (
              <div className="admin-avatar">
                {user?.firstName?.[0] || 'C'}{user?.lastName?.[0] || 'L'}
              </div>
            )}
            {uploading && <span style={{ position: 'absolute', fontSize: '0.6rem', color: 'var(--primary)' }}>...</span>}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <nav className="admin-nav">
          <div style={{ padding: '0 0.5rem 0.5rem', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            Client Menu
          </div>
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === `${basePath}${item.path}`;
            return (
              <button key={item.path} onClick={() => { navigate(`${basePath}${item.path}`); setSidebarOpen(false); }}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
                style={{ cursor: 'pointer', width: '100%', textAlign: 'left', border: 'none', background: 'none', fontSize: '0.9rem' }}>
                <span style={{
                  width: '28px', height: '28px', borderRadius: '6px',
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid #333' }}>
          <button onClick={logout}
            style={{ color: '#aaa', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', cursor: 'pointer', background: 'none', border: 'none', fontSize: '0.9rem' }}>
            <FaSignOutAlt />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="admin-content">
        <main className="admin-main">
          {currentPath !== '/site-rules' && currentPath !== '' && (
            <div style={{ marginBottom: '1rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {sectionIcon && <span style={{ color: 'var(--primary)' }}>{sectionIcon}</span>}
                {sectionLabel}
              </h1>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ClientLayout;
