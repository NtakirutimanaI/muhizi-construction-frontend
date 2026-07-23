import { Link } from 'react-router-dom';
import { FaDraftingCompass, FaClipboardList, FaPaperPlane } from 'react-icons/fa';

const cards = [
    { to: 'submissions', icon: <FaDraftingCompass />, label: 'Submissions', desc: 'View and manage engineering submissions', bg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
    { to: 'designs', icon: <FaClipboardList />, label: 'Designs', desc: 'Browse all design projects', bg: 'linear-gradient(135deg, #1B2042, #2a3a6a)' },
    { to: 'report-to-admin', icon: <FaPaperPlane />, label: 'Report to Admin', desc: 'Submit approved work to admin', bg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
];

const EngineeringStudio = () => {
    return (
        <div style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.3rem' }}>Engineering Studio</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Select a section to get started</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                {cards.map(card => (
                    <Link
                        key={card.to}
                        to={card.to}
                        style={{
                            display: 'flex', flexDirection: 'column', gap: '0.75rem',
                            padding: '1.5rem', borderRadius: 12, textDecoration: 'none', color: '#fff',
                            background: card.bg, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'; }}
                    >
                        <div style={{ fontSize: '1.8rem' }}>{card.icon}</div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.25rem' }}>{card.label}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{card.desc}</div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default EngineeringStudio;
