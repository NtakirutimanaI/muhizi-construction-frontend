import { useState, useEffect } from 'react';
import { FaSpinner, FaClipboardList, FaCheckCircle, FaClock, FaHardHat, FaImage, FaVideo, FaCalendarAlt } from 'react-icons/fa';
import { projectEvidenceService } from '../../services/projectEvidenceService';
import { sitesService } from '../../services/sitesService';
import type { ProjectEvidence } from '../../services/projectEvidenceService';
import type { Site } from '../../services/sitesService';

interface EvidenceWithSite extends ProjectEvidence {
  siteName?: string;
}

const PartnerUpdates = () => {
  const [items, setItems] = useState<EvidenceWithSite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      projectEvidenceService.getClientVisible(),
      sitesService.getAll(),
    ])
      .then(([evRes, sitesRes]) => {
        const evData = (evRes.data || []) as EvidenceWithSite[];
        const sitesData = (sitesRes.data || []) as Site[];
        const siteMap = new Map(sitesData.map(s => [s.id, s.name]));
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

  const images = items.filter(i => i.type === 'image');
  const videos = items.filter(i => i.type === 'video');
  const latestDate = items.length > 0 && items[0].date ? items[0].date : null;
  const siteNames = [...new Set(items.map(i => i.siteName).filter(Boolean))];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: '#888' }}>
        <FaSpinner className="spin" /> Loading updates...
      </div>
    );
  }

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #0d4f3c, #1a8a6a)',
        borderRadius: 0, padding: '1.75rem 2rem', marginBottom: '1.5rem', color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FaClipboardList size={24} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Project Updates</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{items.length} update{items.length !== 1 ? 's' : ''} available</div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#fff', borderRadius: 0, padding: '0.75rem 1rem', border: '1px solid rgba(26,138,106,0.08)', boxShadow: '0 2px 8px rgba(26,138,106,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#888', marginBottom: '0.25rem' }}>
            <FaImage size={11} style={{ color: '#1a8a6a' }} /> Images
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1a8a6a' }}>{images.length}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 0, padding: '0.75rem 1rem', border: '1px solid rgba(26,138,106,0.08)', boxShadow: '0 2px 8px rgba(26,138,106,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#888', marginBottom: '0.25rem' }}>
            <FaVideo size={11} style={{ color: '#10b981' }} /> Videos
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981' }}>{videos.length}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 0, padding: '0.75rem 1rem', border: '1px solid rgba(26,138,106,0.08)', boxShadow: '0 2px 8px rgba(26,138,106,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#888', marginBottom: '0.25rem' }}>
            <FaCalendarAlt size={11} style={{ color: '#f59e0b' }} /> Latest
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#333' }}>
            {latestDate ? new Date(latestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 0, padding: '0.75rem 1rem', border: '1px solid rgba(26,138,106,0.08)', boxShadow: '0 2px 8px rgba(26,138,106,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#888', marginBottom: '0.25rem' }}>
            <FaHardHat size={11} style={{ color: '#8b5cf6' }} /> Sites
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#8b5cf6' }}>{siteNames.length}</div>
        </div>
      </div>

      {items.length === 0 ? (
        <div style={{
          background: '#fff', borderRadius: 0, padding: '3rem', textAlign: 'center',
          border: '1px solid rgba(26,138,106,0.08)', boxShadow: '0 2px 12px rgba(26,138,106,0.06)',
        }}>
          <FaClipboardList size={48} style={{ opacity: 0.2, color: '#1a8a6a', marginBottom: '1rem' }} />
          <p style={{ color: '#888', margin: 0 }}>No updates available yet. Check back later.</p>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', left: '21px', top: 0, bottom: 0, width: '2px',
            background: 'rgba(26,138,106,0.15)',
          }} />
          {items.map((item, index) => (
            <div key={item.id} style={{
              background: '#fff', borderRadius: 0, padding: '1.25rem 1.5rem',
              border: '1px solid rgba(26,138,106,0.08)',
              boxShadow: '0 2px 12px rgba(26,138,106,0.06)',
              display: 'flex', gap: '1.25rem', alignItems: 'flex-start',
              transition: 'all 0.2s', marginBottom: '1rem', marginLeft: '2.5rem', position: 'relative',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,138,106,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(26,138,106,0.06)'; }}
            >
              <div style={{
                position: 'absolute', left: '-2.5rem', top: '1.25rem',
                width: '12px', height: '12px', borderRadius: 0,
                background: index % 2 === 0 ? '#1a8a6a' : '#10b981',
                border: '3px solid #fff', boxShadow: '0 0 0 2px rgba(26,138,106,0.2)',
              }} />

              <div style={{
                width: '44px', height: '44px', borderRadius: 0, flexShrink: 0,
                background: index % 2 === 0
                  ? 'linear-gradient(135deg, rgba(26,138,106,0.1), rgba(13,79,60,0.1))'
                  : 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(52,211,153,0.1))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: index % 2 === 0 ? '#1a8a6a' : '#10b981',
              }}>
                {index % 2 === 0 ? <FaClock size={18} /> : <FaCheckCircle size={18} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a2e' }}>
                    {item.title || 'Update'}
                  </div>
                  {item.date && (
                    <span style={{ fontSize: '0.7rem', color: '#aaa', fontWeight: 500 }}>
                      {new Date(item.date).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
                {item.siteName && (
                  <div style={{ fontSize: '0.8rem', color: '#1a8a6a', fontWeight: 600, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FaHardHat size={11} />
                    {item.siteName}
                  </div>
                )}
                {item.notes && (
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#666', lineHeight: 1.5 }}>
                    {item.notes}
                  </p>
                )}
              </div>
              {item.url && (
                <img src={item.url} alt="" style={{
                  width: '80px', height: '80px', borderRadius: 0,
                  objectFit: 'cover', flexShrink: 0, cursor: 'pointer',
                }} onClick={() => window.open(item.url, '_blank')}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartnerUpdates;
