import { useState, useEffect } from 'react';
import { FaSpinner, FaImage, FaHardHat, FaClipboardList } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { sitesService } from '../../services/sitesService';
import { projectEvidenceService } from '../../services/projectEvidenceService';

const ClientDashboard = () => {
  const { user } = useAuth();
  const [sitesCount, setSitesCount] = useState(0);
  const [evidenceCount, setEvidenceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      sitesService.getAll(),
      projectEvidenceService.getClientVisible(),
    ])
      .then(([sitesRes, evRes]) => {
        const sites = sitesRes.data || [];
        const evidence = evRes.data || [];
        setSitesCount(sites.length);
        setEvidenceCount(evidence.length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #0d9488, #0891b2)',
        borderRadius: 0, padding: '3rem 3.5rem', marginBottom: '2rem',
        color: '#fff', position: 'relative', overflow: 'hidden', textAlign: 'center',
      }}>
        <div style={{
          position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px',
          borderRadius: 0, background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-30%', left: '20%', width: '200px', height: '200px',
          borderRadius: 0, background: 'rgba(255,255,255,0.04)',
        }} />
        <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, position: 'relative' }}>
          Welcome{user?.firstName ? `, ${user.firstName}` : ''}
        </h1>
        <p style={{ margin: '0.75rem 0 0', opacity: 0.8, fontSize: '1.2rem', position: 'relative' }}>
          Browse sites, track updates, and manage your profile
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '0.75rem', color: '#888' }}>
          <FaSpinner className="spin" /> Loading...
        </div>
      ) : (
        <div className="dashboard-stats" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem',
        }}>
          <div style={{
            background: '#fff', borderRadius: 0, padding: '1.5rem',
            border: '1px solid rgba(13,148,136,0.08)',
            boxShadow: '0 2px 12px rgba(13,148,136,0.06)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 0,
              background: 'linear-gradient(135deg, rgba(13,148,136,0.1), rgba(8,145,178,0.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0d9488', margin: '0 auto 0.75rem',
            }}>
              <FaHardHat size={20} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e' }}>{sitesCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.2rem' }}>Sites</div>
          </div>

          <div style={{
            background: '#fff', borderRadius: 0, padding: '1.5rem',
            border: '1px solid rgba(13,148,136,0.08)',
            boxShadow: '0 2px 12px rgba(13,148,136,0.06)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 0,
              background: 'linear-gradient(135deg, rgba(13,148,136,0.1), rgba(8,145,178,0.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0d9488', margin: '0 auto 0.75rem',
            }}>
              <FaImage size={20} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e' }}>{evidenceCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.2rem' }}>Updates</div>
          </div>

          <div style={{
            background: '#fff', borderRadius: 0, padding: '1.5rem',
            border: '1px solid rgba(13,148,136,0.08)',
            boxShadow: '0 2px 12px rgba(13,148,136,0.06)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 0,
              background: 'linear-gradient(135deg, rgba(13,148,136,0.1), rgba(8,145,178,0.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0d9488', margin: '0 auto 0.75rem',
            }}>
              <FaClipboardList size={20} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e' }}>{sitesCount + evidenceCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.2rem' }}>Total Items</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
