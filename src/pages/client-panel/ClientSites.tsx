import { useState, useEffect } from 'react';
import { FaSpinner, FaTimes, FaImage, FaVideo, FaHardHat } from 'react-icons/fa';
import { projectEvidenceService } from '../../services/projectEvidenceService';

const ClientSites = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    projectEvidenceService.getClientVisible()
      .then(res => setItems(res.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: '#888' }}>
        <FaSpinner className="spin" /> Loading sites...
      </div>
    );
  }

  return (
    <div>
      {items.length === 0 ? (
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '3rem', textAlign: 'center',
          border: '1px solid rgba(108,48,150,0.08)', boxShadow: '0 2px 12px rgba(108,48,150,0.06)',
        }}>
          <FaHardHat size={48} style={{ opacity: 0.2, color: '#6c3096', marginBottom: '1rem' }} />
          <p style={{ color: '#888', margin: 0 }}>No site images or videos available yet. Check back later.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem',
        }}>
          {items.map(item => (
            <div key={item.id} style={{
              background: '#fff', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer',
              border: '1px solid rgba(108,48,150,0.08)',
              boxShadow: '0 2px 12px rgba(108,48,150,0.06)',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(108,48,150,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(108,48,150,0.06)'; }}
              onClick={() => setPreviewUrl(item.url)}
            >
              <div style={{ position: 'relative' }}>
                <img src={item.url} alt={item.title} style={{
                  width: '100%', height: '220px', objectFit: 'cover', display: 'block',
                }} />
                <div style={{
                  position: 'absolute', top: '12px', right: '12px',
                  background: 'rgba(0,0,0,0.5)', borderRadius: '50%',
                  width: '34px', height: '34px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: '#fff',
                  backdropFilter: 'blur(4px)',
                }}>
                  {item.type === 'video' ? <FaVideo size={14} /> : <FaImage size={14} />}
                </div>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                  padding: '2rem 1rem 0.75rem',
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>{item.title}</div>
                  {item.project && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{item.project}</div>}
                </div>
              </div>
              {item.notes && (
                <div style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#666', borderTop: '1px solid rgba(108,48,150,0.08)' }}>
                  {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {previewUrl && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }} onClick={() => setPreviewUrl(null)}>
          <button onClick={() => setPreviewUrl(null)} style={{
            position: 'absolute', top: '1.5rem', right: '1.5rem',
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
            width: '40px', height: '40px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', cursor: 'pointer', fontSize: '1.1rem',
            backdropFilter: 'blur(4px)',
          }}>
            <FaTimes />
          </button>
          <img src={previewUrl} alt="Preview" style={{
            maxWidth: '92%', maxHeight: '92%', borderRadius: '12px', objectFit: 'contain',
          }} />
        </div>
      )}
    </div>
  );
};

export default ClientSites;
