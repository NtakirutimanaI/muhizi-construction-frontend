import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaImage, FaClipboardList, FaSignOutAlt, FaBars, FaTimes, FaSun, FaMoon, FaChevronRight, FaCamera } from 'react-icons/fa';
import { useToast } from '../context/ToastContext';
import { ROLE_AREA_TITLE, ROLE_AREA_BG, type Role } from '../config/roles';
import { uploadService } from '../services/uploadService';
import { profileService } from '../services/profileService';

const NAV_ITEMS = [
  { path: '/profile', icon: <FaUser />, label: 'My Profile' },
  { path: '/sites', icon: <FaImage />, label: 'Sites' },
  { path: '/updates', icon: <FaClipboardList />, label: 'Updates' },
];

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

  const currentNav = NAV_ITEMS.find(item =>
    location.pathname === `${basePath}${item.path}`
  );

  return (
    <div className={isDark ? 'client-dark' : ''} style={{
      minHeight: '100vh',
      background: isDark ? '#0f172a' : 'linear-gradient(135deg, #ecfdf5 0%, #ccfbf1 50%, #e0f2fe 100%)',
      display: 'flex',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <style>{`
        .client-dark [style*="background:#fff"],
        .client-dark [style*="background: #fff"],
        .client-dark [style*="background:rgb(255,255,255)"],
        .client-dark [style*="background: rgb(255, 255, 255)"] {
          background: #1e293b !important;
        }
        .client-dark [style*="color:#1a1a2e"],
        .client-dark [style*="color: #1a1a2e"],
        .client-dark [style*="color:#1e293b"],
        .client-dark [style*="color: #1e293b"],
        .client-dark [style*="color:#475569"],
        .client-dark [style*="color: #475569"],
        .client-dark [style*="color:#334155"],
        .client-dark [style*="color: #334155"] {
          color: #e2e8f0 !important;
        }
        .client-dark [style*="color:#888"],
        .client-dark [style*="color: #888"],
        .client-dark [style*="color:#666"],
        .client-dark [style*="color: #666"],
        .client-dark [style*="color:#94a3b8"],
        .client-dark [style*="color: #94a3b8"],
        .client-dark [style*="color:#475569"],
        .client-dark [style*="color: #475569"] {
          color: #94a3b8 !important;
        }
        .client-dark [style*="border:1px solid #e2e8f0"],
        .client-dark [style*="border: 1px solid #e2e8f0"],
        .client-dark [style*="border:1px solid rgba(13,148,136,0.08)"] {
          border-color: rgba(255,255,255,0.08) !important;
        }
        .client-dark [style*="background:#f1f5f9"],
        .client-dark [style*="background: #f1f5f9"],
        .client-dark [style*="background:#f8fafc"],
        .client-dark [style*="background: #f8fafc"] {
          background: #334155 !important;
        }

        @media (max-width: 640px) {
          .client-header {
            padding: 0 0.75rem !important;
          }
          .client-content {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
          }
          .client-content .dashboard-stats {
            grid-template-columns: 1fr !important;
          }
          .client-content [style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          .client-content [style*="minmax(160px"] {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
          }
          .client-content h1[style*="2.5rem"] {
            font-size: 1.75rem !important;
          }
        }
        @media (max-width: 480px) {
          .client-content {
            max-width: 100% !important;
          }
          .client-content [style*="padding: 3rem 3.5rem"] {
            padding: 2rem 1.25rem !important;
          }
          .client-content [style*="2.5rem"] {
            font-size: 1.5rem !important;
          }
          .client-content [style*="padding: 1.75rem 2rem"] {
            padding: 1.25rem !important;
          }
          .client-content [style*="margin-left: 2.5rem"] {
            margin-left: 1.5rem !important;
          }
        }
      `}</style>
      <div className="client-header" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '64px',
        background: isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(13,148,136,0.1)',
        display: 'flex', alignItems: 'center',
        padding: '0 1.5rem',
      }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: 'linear-gradient(135deg, #0d9488, #0891b2)',
            border: 'none', color: '#fff', width: '38px', height: '38px',
            borderRadius: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', marginRight: '1rem',
          }}>
          {sidebarOpen ? <FaTimes size={14} /> : <FaBars size={14} />}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
          <div onClick={() => navigate(basePath)} style={{
            background: ROLE_AREA_BG[role] || 'linear-gradient(135deg, #0d9488, #0891b2)',
            borderRadius: 0, padding: '0.3rem 0.8rem',
            display: 'flex', flexDirection: 'column', cursor: 'pointer',
          }}>
            <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#fff' }}>
              {ROLE_AREA_TITLE[role] || 'Client'}
            </span>
            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
              {user?.firstName || ''} {user?.lastName || ''}
            </span>
          </div>
        </div>

        <button onClick={() => setIsDark(!isDark)} style={{
          width: '38px', height: '38px', borderRadius: '50%',
          background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(13,148,136,0.08)',
          border: '1px solid rgba(13,148,136,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: isDark ? '#fbbf24' : '#0d9488',
        }}>
          {isDark ? <FaSun size={16} /> : <FaMoon size={16} />}
        </button>

        <div style={{ width: 1, height: 30, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(13,148,136,0.1)', margin: '0 1rem' }} />

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
        <div onClick={() => fileInputRef.current?.click()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', position: 'relative' }}>
          {user?.avatar ? (
            <img src={user.avatar} alt="" style={{
              width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover',
            }} />
          ) : (
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #0d9488, #0891b2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '1rem',
            }}>
              {user?.firstName?.[0] || 'C'}
            </div>
          )}
          {uploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: '0.6rem' }}>...</span>
          </div>}
        </div>
      </div>

      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 99,
        width: '160px',
        background: 'linear-gradient(180deg, rgba(13,148,136,0.97), rgba(8,145,178,0.95))',
        backdropFilter: 'blur(20px)',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '4px 0 30px rgba(13,148,136,0.3)',
      }}>
        <div style={{
          padding: '1.5rem 1.25rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
            Navigation
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
            {user?.firstName || ''} {user?.lastName || ''}
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === `${basePath}${item.path}`;
            return (
              <button key={item.path} onClick={() => navigate(`${basePath}${item.path}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                  borderRadius: 0,
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                  cursor: 'pointer', fontSize: '0.9rem', fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s', width: '100%', textAlign: 'left',
                  backdropFilter: isActive ? 'blur(10px)' : 'none',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; } }}
              >
                <span style={{
                  width: '32px', height: '32px', borderRadius: 0,
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', flexShrink: 0,
                }}>{item.icon}</span>
                {item.label}
                {isActive && <FaChevronRight size={10} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1rem', width: '100%', textAlign: 'left',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 0, color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            <FaSignOutAlt size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="client-content" style={{
        margin: '64px auto 0',
        padding: '0 2rem 2rem',
        maxWidth: '600px',
        width: '100%',
        color: isDark ? '#e2e8f0' : undefined,
      }}>
        {currentNav && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span style={{
              width: '36px', height: '36px', borderRadius: 0,
              background: 'linear-gradient(135deg, #0d9488, #0891b2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '0.85rem',
            }}>{currentNav.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: isDark ? '#e2e8f0' : '#1a1a2e' }}>{currentNav.label}</div>
              <div style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#888' }}>Client Dashboard</div>
            </div>
          </div>
        )}

        <Outlet />
      </div>
    </div>
  );
};

export default ClientLayout;
