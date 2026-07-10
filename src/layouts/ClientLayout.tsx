import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaImage, FaClipboardList, FaSignOutAlt, FaBars, FaTimes, FaBell, FaChevronRight } from 'react-icons/fa';
import { useNotification } from '../context/NotificationContext';
import { ROLE_AREA_TITLE, ROLE_AREA_BG, type Role } from '../config/roles';

const NAV_ITEMS = [
  { path: '/profile', icon: <FaUser />, label: 'My Profile' },
  { path: '/sites', icon: <FaImage />, label: 'Sites' },
  { path: '/updates', icon: <FaClipboardList />, label: 'Updates' },
];

const ClientLayout = ({ basePath = '/client-panel' }: { basePath?: string }) => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotification();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = (user?.role || '') as Role;

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const currentNav = NAV_ITEMS.find(item =>
    location.pathname === `${basePath}${item.path}`
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f0ff 0%, #fce4ec 50%, #f3e5f5 100%)',
      display: 'flex',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '64px',
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(108,48,150,0.1)',
        display: 'flex', alignItems: 'center',
        padding: '0 1.5rem',
      }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: 'linear-gradient(135deg, #6c3096, #b84c8c)',
            border: 'none', color: '#fff', width: '38px', height: '38px',
            borderRadius: '12px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', marginRight: '1rem',
          }}>
          {sidebarOpen ? <FaTimes size={14} /> : <FaBars size={14} />}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
          <div style={{
            background: ROLE_AREA_BG[role] || 'linear-gradient(135deg, #6c3096, #b84c8c)',
            borderRadius: '10px', padding: '0.3rem 0.8rem',
            display: 'flex', flexDirection: 'column',
          }}>
            <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#fff' }}>
              {ROLE_AREA_TITLE[role] || 'Client'}
            </span>
            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
              {user?.firstName || ''} {user?.lastName || ''}
            </span>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <button style={{
            width: '38px', height: '38px', borderRadius: '12px',
            background: 'rgba(108,48,150,0.08)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#6c3096', position: 'relative',
          }}>
            <FaBell size={16} />
            {unreadCount > 0 && <span style={{
              position: 'absolute', top: -4, right: -4,
              background: '#ef4444', color: '#fff', fontSize: '0.55rem',
              fontWeight: 700, width: '18px', height: '18px',
              borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center',
            }}>{unreadCount}</span>}
          </button>
        </div>

        <div style={{ width: 1, height: 30, background: 'rgba(108,48,150,0.1)', margin: '0 1rem' }} />

        <div onClick={() => setSidebarOpen(false)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
          {user?.avatar ? (
            <img src={user.avatar} alt="" style={{
              width: '34px', height: '34px', borderRadius: '10px', objectFit: 'cover',
            }} />
          ) : (
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #6c3096, #b84c8c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '0.8rem',
            }}>
              {user?.firstName?.[0] || 'C'}
            </div>
          )}
        </div>
      </div>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
            zIndex: 98, backdropFilter: 'blur(4px)',
          }} />
      )}

      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 99,
        width: '260px',
        background: 'linear-gradient(180deg, rgba(108,48,150,0.97), rgba(184,76,140,0.95))',
        backdropFilter: 'blur(20px)',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '4px 0 30px rgba(108,48,150,0.3)',
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
                  borderRadius: '14px',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                  cursor: 'pointer', fontSize: '0.9rem', fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s', width: '100%', textAlign: 'left',
                  backdropFilter: isActive ? 'blur(10px)' : 'none',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; } }}
              >
                <span style={{
                  width: '32px', height: '32px', borderRadius: '10px',
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
              borderRadius: '14px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
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

      <div style={{
        flex: 1,
        marginTop: '64px',
        marginLeft: 0,
        padding: '1.5rem 2rem',
        maxWidth: '1200px',
        width: '100%',
        transition: 'margin-left 0.3s',
      }}>
        {currentNav && (
          <div style={{
            marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span style={{
              width: '36px', height: '36px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #6c3096, #b84c8c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '0.85rem',
            }}>{currentNav.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a2e' }}>{currentNav.label}</div>
              <div style={{ fontSize: '0.75rem', color: '#888' }}>Client Dashboard</div>
            </div>
          </div>
        )}

        <Outlet />
      </div>
    </div>
  );
};

export default ClientLayout;
