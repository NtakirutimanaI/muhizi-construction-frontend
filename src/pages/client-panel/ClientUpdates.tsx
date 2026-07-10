import { useState, useEffect } from 'react';
import { FaSpinner, FaClipboardList, FaCheckCircle, FaClock, FaHardHat } from 'react-icons/fa';
import { projectEvidenceService } from '../../services/projectEvidenceService';

const ClientUpdates = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectEvidenceService.getClientVisible()
      .then(res => setItems(res.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: '#888' }}>
        <FaSpinner className="spin" /> Loading updates...
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
          <FaClipboardList size={48} style={{ opacity: 0.2, color: '#6c3096', marginBottom: '1rem' }} />
          <p style={{ color: '#888', margin: 0 }}>No updates available yet. Check back later.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map((item, index) => (
            <div key={item.id} style={{
              background: '#fff', borderRadius: '16px', padding: '1.25rem 1.5rem',
              border: '1px solid rgba(108,48,150,0.08)',
              boxShadow: '0 2px 12px rgba(108,48,150,0.06)',
              display: 'flex', gap: '1.25rem', alignItems: 'flex-start',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(108,48,150,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(108,48,150,0.06)'; }}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '14px',
                background: index % 2 === 0
                  ? 'linear-gradient(135deg, rgba(108,48,150,0.1), rgba(184,76,140,0.1))'
                  : 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(52,211,153,0.1))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                color: index % 2 === 0 ? '#6c3096' : '#10b981',
              }}>
                {index % 2 === 0 ? <FaClock size={18} /> : <FaCheckCircle size={18} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a2e', marginBottom: '0.25rem' }}>
                  {item.title || 'Update'}
                </div>
                {item.project && (
                  <div style={{ fontSize: '0.8rem', color: '#6c3096', fontWeight: 600, marginBottom: '0.35rem' }}>
                    <FaHardHat size={11} style={{ marginRight: 4 }} />
                    {item.project}
                  </div>
                )}
                {item.notes && (
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#666', lineHeight: 1.5 }}>
                    {item.notes}
                  </p>
                )}
                {item.date && (
                  <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.5rem' }}>
                    {item.date}
                  </div>
                )}
              </div>
              {item.url && (
                <img src={item.url} alt="" style={{
                  width: '80px', height: '80px', borderRadius: '12px',
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
