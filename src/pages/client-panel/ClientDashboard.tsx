import { FaUser, FaImage, FaClipboardList } from 'react-icons/fa';

const ClientDashboard = () => {
  const cards = [
    { icon: <FaUser size={24} />, label: 'My Profile', desc: 'Manage your personal information', path: 'profile' },
    { icon: <FaImage size={24} />, label: 'Sites', desc: 'View site images and videos', path: 'sites' },
    { icon: <FaClipboardList size={24} />, label: 'Updates', desc: 'Track project progress updates', path: 'updates' },
  ];

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #6c3096, #b84c8c)',
        borderRadius: '20px', padding: '2rem 2.5rem', marginBottom: '2rem',
        color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px',
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-30%', left: '20%', width: '200px', height: '200px',
          borderRadius: '50%', background: 'rgba(255,255,255,0.04)',
        }} />
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, position: 'relative' }}>
          Welcome to Your Dashboard
        </h1>
        <p style={{ margin: '0.5rem 0 0', opacity: 0.8, fontSize: '0.9rem', position: 'relative' }}>
          Browse sites, track updates, and manage your profile
        </p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem',
      }}>
        {cards.map(card => (
          <div key={card.path} onClick={() => window.location.href = card.path}
            style={{
              background: '#fff', borderRadius: '16px', padding: '1.5rem',
              cursor: 'pointer', transition: 'all 0.2s',
              border: '1px solid rgba(108,48,150,0.08)',
              boxShadow: '0 2px 12px rgba(108,48,150,0.06)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(108,48,150,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(108,48,150,0.06)'; }}
          >
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(108,48,150,0.1), rgba(184,76,140,0.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#6c3096', marginBottom: '1rem',
            }}>{card.icon}</div>
            <h3 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 700, color: '#1a1a2e' }}>{card.label}</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientDashboard;
