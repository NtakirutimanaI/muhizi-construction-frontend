import { useState, useEffect } from 'react';
import { FaSpinner, FaClipboardList, FaCheckCircle, FaClock, FaHardHat } from 'react-icons/fa';
import { clientPortalService } from '../../services/clientPortalService';
import type { ProjectEvidence } from '../../services/projectEvidenceService';
import type { Site } from '../../services/sitesService';
import type { Project } from '../../services/constructionService';

interface EvidenceWithSite extends ProjectEvidence {
  siteName?: string;
}

const ClientUpdates = () => {
  const [items, setItems] = useState<EvidenceWithSite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientPortalService.getMyProjects()
      .then(async (projectsRes) => {
        const projects = (projectsRes.data || []) as Project[];
        const sitesData = projects.flatMap((p) => (p as any).sites || []) as Site[];
        const siteMap = new Map(sitesData.map(s => [s.id, s.name]));

        const evidenceResults = await Promise.all(
          projects.map((p) => clientPortalService.getProjectEvidence(p.id).catch(() => ({ data: [] })))
        );
        const evData = evidenceResults.flatMap((r) => (r.data || [])) as EvidenceWithSite[];
        evData.forEach(e => { e.siteName = siteMap.get(e.siteId || e.project) || e.project; });
        evData.sort((a, b) => {
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        setItems(evData);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: 'var(--text-muted)' }}>
        <FaSpinner className="spin" /> Loading updates...
      </div>
    );
  }

  return (
    <div>
      <div className="content-card" style={{
        padding: '1.5rem 2rem', marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FaClipboardList size={24} color="var(--primary)" />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>Project Updates</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{items.length} update{items.length !== 1 ? 's' : ''} available</div>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="content-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <FaClipboardList size={48} style={{ opacity: 0.2, color: 'var(--primary)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No updates available yet. Check back later.</p>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', left: '21px', top: 0, bottom: 0, width: '2px',
            background: 'rgba(108,48,150,0.15)',
          }} />
          {items.map((item, index) => (
            <div key={item.id} className="content-card" style={{
              padding: '1.25rem 1.5rem',
              display: 'flex', gap: '1.25rem', alignItems: 'flex-start',
              marginBottom: '1rem', marginLeft: '2.5rem', position: 'relative',
            }}>
              <div style={{
                position: 'absolute', left: '-2.5rem', top: '1.25rem',
                width: '12px', height: '12px', borderRadius: '50%',
                background: index % 2 === 0 ? '#6c3096' : '#b84c8c',
                border: '3px solid var(--bg-white)', boxShadow: '0 0 0 2px rgba(108,48,150,0.2)',
              }} />

              <div style={{
                width: '44px', height: '44px', borderRadius: '8px', flexShrink: 0,
                background: index % 2 === 0
                  ? 'linear-gradient(135deg, rgba(108,48,150,0.1), rgba(184,76,140,0.1))'
                  : 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(52,211,153,0.1))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: index % 2 === 0 ? '#6c3096' : '#10b981',
              }}>
                {index % 2 === 0 ? <FaClock size={18} /> : <FaCheckCircle size={18} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    {item.title || 'Update'}
                  </div>
                  {item.date && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {new Date(item.date).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
                {item.siteName && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FaHardHat size={11} />
                    {item.siteName}
                  </div>
                )}
                {item.notes && (
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {item.notes}
                  </p>
                )}
              </div>
              {item.url && (
                <img src={item.url} alt="" style={{
                  width: '80px', height: '80px', borderRadius: '8px',
                  objectFit: 'cover', flexShrink: 0, cursor: 'pointer',
                }} onClick={() => window.open(item.url, '_blank')} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientUpdates;
