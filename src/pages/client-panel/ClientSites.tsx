import { useState, useEffect, useRef } from 'react';
import { FaSpinner, FaTimes, FaImage, FaVideo, FaHardHat, FaMapMarkerAlt, FaCheckCircle, FaClock, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { projectEvidenceService } from '../../services/projectEvidenceService';
import { sitesService } from '../../services/sitesService';
import type { ProjectEvidence } from '../../services/projectEvidenceService';
import type { Site } from '../../services/sitesService';

interface EvidenceWithSite extends ProjectEvidence {
  siteName?: string;
}

const ClientSites = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [allEvidence, setAllEvidence] = useState<EvidenceWithSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeSite, setActiveSite] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
        setAllEvidence(evData);
        setSites(sitesData);
      })
      .catch(() => { setAllEvidence([]); setSites([]); })
      .finally(() => setLoading(false));
  }, []);

  const active = activeSite
    ? sites.find(s => s.id === activeSite)
    : null;

  const filteredEvidence = activeSite
    ? allEvidence.filter(e => e.siteId === activeSite)
    : allEvidence;

  const scroll = (dir: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: '#888' }}>
        <FaSpinner className="spin" /> Loading sites...
      </div>
    );
  }

  return (
    <div>
      {/* Site browser */}
      {sites.length > 0 && (
        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
          {sites.length > 4 && (
            <>
              <button onClick={() => scroll(-1)} style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 28, height: 28, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <FaChevronLeft size={10} />
              </button>
              <button onClick={() => scroll(1)} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 28, height: 28, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <FaChevronRight size={10} />
              </button>
            </>
          )}
          <div ref={scrollRef} style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.25rem 0', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div onClick={() => setActiveSite(null)} style={{ flexShrink: 0, width: 120, padding: '0.75rem 0.6rem', background: !activeSite ? '#0d9488' : '#fff', border: '1px solid rgba(13,148,136,0.2)', cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: !activeSite ? '#fff' : '#0d9488' }}>All Sites</div>
              <div style={{ fontSize: '0.6rem', color: !activeSite ? 'rgba(255,255,255,0.7)' : '#888' }}>{allEvidence.length} media</div>
            </div>
            {sites.map(site => (
              <div key={site.id} onClick={() => setActiveSite(site.id)} style={{ flexShrink: 0, width: 140, padding: '0.75rem 0.6rem', background: activeSite === site.id ? '#0d9488' : '#fff', border: '1px solid rgba(13,148,136,0.2)', cursor: 'pointer' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: activeSite === site.id ? '#fff' : '#1a1a2e', marginBottom: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <FaHardHat size={9} style={{ marginRight: 4 }} />
                  {site.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{ flex: 1, height: 4, background: '#e5e7eb' }}>
                    <div style={{ width: `${site.progress || 0}%`, height: 4, background: site.status === 'completed' ? '#10b981' : '#0d9488', transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: activeSite === site.id ? 'rgba(255,255,255,0.8)' : '#666' }}>{site.progress || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', border: '1px solid rgba(13,148,136,0.08)' }}>
          <FaHardHat size={36} style={{ opacity: 0.2, color: '#0d9488', marginBottom: '1rem' }} />
          <p style={{ color: '#888', margin: '0 0 0.35rem', fontSize: '0.9rem' }}>No sites available yet.</p>
          <p style={{ color: '#aaa', margin: 0, fontSize: '0.8rem' }}>Site information will appear here once added.</p>
        </div>
      ) : active && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#fff', border: '1px solid rgba(13,148,136,0.08)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FaHardHat size={14} color="#0d9488" /> {active.name}
          </div>
          {active.location && (
            <div style={{ fontSize: '0.75rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <FaMapMarkerAlt size={9} /> {active.location}
            </div>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 80, height: 5, background: '#e5e7eb' }}>
              <div style={{ width: `${active.progress || 0}%`, height: 5, background: active.status === 'completed' ? '#10b981' : '#0d9488' }} />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#666' }}>{active.progress || 0}%</span>
            {active.status === 'completed' ? (
              <span style={{ fontSize: '0.65rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><FaCheckCircle size={8} /> Done</span>
            ) : (
              <span style={{ fontSize: '0.65rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><FaClock size={8} /> {active.status === 'active' ? 'Active' : 'Inactive'}</span>
            )}
          </div>
        </div>
      )}

      {/* Evidence grid */}
      {filteredEvidence.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', border: '1px solid rgba(13,148,136,0.08)' }}>
          <FaImage size={36} style={{ opacity: 0.2, color: '#0d9488', marginBottom: '1rem' }} />
          <p style={{ color: '#888', margin: 0, fontSize: '0.85rem' }}>No media for this site yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
          {filteredEvidence.map(item => (
            <div key={item.id} onClick={() => setPreviewUrl(item.url)} style={{ position: 'relative', background: '#fff', border: '1px solid rgba(13,148,136,0.08)', cursor: 'pointer', overflow: 'hidden' }}>
              <img src={item.url} alt={item.title} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.type === 'video' ? <FaVideo size={9} color="#fff" /> : <FaImage size={9} color="#fff" />}
              </div>
              <div style={{ padding: '0.35rem 0.5rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                {item.notes && <div style={{ fontSize: '0.6rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {previewUrl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setPreviewUrl(null)}>
          <button onClick={() => setPreviewUrl(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
            <FaTimes />
          </button>
          <img src={previewUrl} alt="Preview" style={{ maxWidth: '92%', maxHeight: '92%', borderRadius: 0, objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
};

export default ClientSites;
