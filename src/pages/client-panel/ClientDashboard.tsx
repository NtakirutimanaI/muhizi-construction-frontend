import { useState, useEffect } from 'react';
import { FaSpinner, FaImage, FaHardHat, FaClipboardList } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { clientPortalService } from '../../services/clientPortalService';
import type { Project } from '../../services/constructionService';

const ClientDashboard = () => {
  const { user } = useAuth();
  const [sitesCount, setSitesCount] = useState(0);
  const [evidenceCount, setEvidenceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientPortalService.getMyProjects()
      .then(async (projectsRes) => {
        const projects = (projectsRes.data || []) as Project[];
        const sites = projects.flatMap((p) => (p as any).sites || []);
        setSitesCount(sites.length);

        const evidenceResults = await Promise.all(
          projects.map((p) => clientPortalService.getProjectEvidence(p.id).catch(() => ({ data: [] })))
        );
        const evidence = evidenceResults.flatMap((r) => r.data || []);
        setEvidenceCount(evidence.length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="content-card" style={{
        padding: '2.5rem 3rem', marginBottom: '1.5rem',
        position: 'relative', overflow: 'hidden', textAlign: 'center',
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>
          Welcome{user?.firstName ? `, ${user.firstName}` : ''}
        </h1>
        <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)', fontSize: '1rem' }}>
          Browse sites, track updates, and manage your profile
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '0.75rem', color: 'var(--text-muted)' }}>
          <FaSpinner className="spin" /> Loading...
        </div>
      ) : (
        <div className="admin-summary-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="admin-summary-card" style={{ borderLeft: '4px solid #6c3096' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(108,48,150,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c3096', marginBottom: '0.5rem' }}>
              <FaHardHat size={18} />
            </div>
            <div className="admin-summary-card__value">{sitesCount}</div>
            <div className="admin-summary-card__label">Sites</div>
          </div>
          <div className="admin-summary-card" style={{ borderLeft: '4px solid #b84c8c' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(184,76,140,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b84c8c', marginBottom: '0.5rem' }}>
              <FaImage size={18} />
            </div>
            <div className="admin-summary-card__value">{evidenceCount}</div>
            <div className="admin-summary-card__label">Updates</div>
          </div>
          <div className="admin-summary-card" style={{ borderLeft: '4px solid #0d9488' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(13,148,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', marginBottom: '0.5rem' }}>
              <FaClipboardList size={18} />
            </div>
            <div className="admin-summary-card__value">{sitesCount + evidenceCount}</div>
            <div className="admin-summary-card__label">Total Items</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
