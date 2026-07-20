import { useState, useEffect, useRef } from 'react';
import { FaSpinner, FaTimes, FaImage, FaVideo, FaHardHat, FaMapMarkerAlt, FaCheckCircle, FaClock, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { clientPortalService } from '../../services/clientPortalService';
import { loadPageCache, savePageCache } from '../../utils/pageCache';
import type { ProjectEvidence } from '../../services/projectEvidenceService';
import type { Site } from '../../services/sitesService';
import type { Project } from '../../services/constructionService';

interface EvidenceWithSite extends ProjectEvidence {
  siteName?: string;
}

const ClientSites = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [allEvidence, setAllEvidence] = useState<EvidenceWithSite[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeSite, setActiveSite] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cached = loadPageCache<{ sites: Site[]; allEvidence: EvidenceWithSite[] }>('pg_client_sites');
    if (cached) {
      setSites(cached.sites);
      setAllEvidence(cached.allEvidence);
    }

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

        setAllEvidence(evData);
        setSites(sitesData);
        savePageCache('pg_client_sites', { sites: sitesData, allEvidence: evData });
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

  return (
    <div>
      {sites.length > 0 && (
        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
          {sites.length > 4 && (
            <>
              <button onClick={() => scroll(-1)} style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 28, height: 28, background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <FaChevronLeft size={10} />
              </button>
              <button onClick={() => scroll(1)} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 28, height: 28, background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <FaChevronRight size={10} />
              </button>
            </>
          )}
          <div ref={scrollRef} style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.25rem 0', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div onClick={() => setActiveSite(null)} className="content-card" style={{ flexShrink: 0, width: 120, padding: '0.75rem 0.6rem', cursor: 'pointer', textAlign: 'center', background: !activeSite ? 'var(--primary)' : 'var(--bg-white)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: !activeSite ? '#fff' : 'var(--text-main)' }}>All Sites</div>
              <div style={{ fontSize: '0.6rem', color: !activeSite ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>{allEvidence.length} media</div>
            </div>
            {sites.map(site => (
              <div key={site.id} onClick={() => setActiveSite(site.id)} className="content-card" style={{ flexShrink: 0, width: 140, padding: '0.75rem 0.6rem', cursor: 'pointer', background: activeSite === site.id ? 'var(--primary)' : 'var(--bg-white)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: activeSite === site.id ? '#fff' : 'var(--text-main)', marginBottom: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <FaHardHat size={9} style={{ marginRight: 4 }} />
                  {site.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{ flex: 1, height: 4, background: 'var(--border-color)' }}>
                    <div style={{ width: `${site.progress || 0}%`, height: 4, background: site.status === 'completed' ? '#10b981' : 'var(--primary)', transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: activeSite === site.id ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>{site.progress || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sites.length === 0 ? (
        <div className="content-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <FaHardHat size={36} style={{ opacity: 0.2, color: 'var(--primary)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)', margin: '0 0 0.35rem', fontSize: '0.9rem' }}>No sites available yet.</p>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>Site information will appear here once added.</p>
        </div>
      ) : active && (
        <div className="content-card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FaHardHat size={14} color="var(--primary)" /> {active.name}
          </div>
          {active.location && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <FaMapMarkerAlt size={9} /> {active.location}
            </div>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 80, height: 5, background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${active.progress || 0}%`, height: 5, background: active.status === 'completed' ? '#10b981' : 'var(--primary)' }} />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{active.progress || 0}%</span>
            {active.status === 'completed' ? (
              <span style={{ fontSize: '0.65rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><FaCheckCircle size={8} /> Done</span>
            ) : (
              <span style={{ fontSize: '0.65rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><FaClock size={8} /> {active.status === 'active' ? 'Active' : 'Inactive'}</span>
            )}
          </div>
        </div>
      )}

      {filteredEvidence.length === 0 ? (
        <div className="content-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <FaImage size={36} style={{ opacity: 0.2, color: 'var(--primary)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>No media for this site yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
          {filteredEvidence.map(item => (
            <div key={item.id} onClick={() => setPreviewUrl(item.url)} className="content-card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
              <img src={item.url} alt={item.title} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.type === 'video' ? <FaVideo size={9} color="#fff" /> : <FaImage size={9} color="#fff" />}
              </div>
              <div style={{ padding: '0.35rem 0.5rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                {item.notes && <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {previewUrl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setPreviewUrl(null)}>
          <button onClick={() => setPreviewUrl(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
            <FaTimes />
          </button>
          <img src={previewUrl} alt="Preview" style={{ maxWidth: '92%', maxHeight: '92%', borderRadius: '8px', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
};

export default ClientSites;
