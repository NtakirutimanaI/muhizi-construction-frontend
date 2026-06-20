import { useState, useEffect } from 'react';
import { FaFileAlt, FaSearch, FaDownload, FaEye, FaPlus, FaTimes, FaUpload, FaCheckCircle, FaClock, FaSpinner } from 'react-icons/fa';
import { contractsService } from '../../services/contractsService';
import type { Contract } from '../../services/contractsService';

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    active: { color: '#22c55e', bg: '#22c55e20', icon: <FaCheckCircle size={12} /> },
    expiring_soon: { color: '#f59e0b', bg: '#f59e0b20', icon: <FaClock size={12} /> },
    expired: { color: '#ef4444', bg: '#ef444420', icon: <FaTimes size={12} /> },
    draft: { color: '#6b7280', bg: '#6b728020', icon: <FaFileAlt size={12} /> },
};

const Contracts = () => {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showUpload, setShowUpload] = useState(false);

    useEffect(() => {
        contractsService.getAll()
            .then(res => setContracts(res.data || []))
            .catch(() => setContracts([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = contracts
        .filter(c => filterStatus === 'all' || c.status === filterStatus)
        .filter(c => search === '' || c.title.toLowerCase().includes(search.toLowerCase()) || c.employeeName.toLowerCase().includes(search.toLowerCase()));

    const totalActive = contracts.filter(c => c.status === 'active' || c.status === 'expiring_soon').length;

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: 'var(--text-muted)' }}>
                <FaSpinner className="spin" /> Loading contracts...
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FaFileAlt style={{ color: '#8B4513' }} /> Contracts
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Manage employee contract documents — upload, review, and track expiry
                    </p>
                </div>
                <button onClick={() => setShowUpload(true)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#8B4513', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                    <FaPlus size={12} /> Upload Contract
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Total Contracts', value: contracts.length, color: '#8B4513' },
                    { label: 'Active', value: totalActive, color: '#22c55e' },
                    { label: 'Expiring Soon', value: contracts.filter(c => c.status === 'expiring_soon').length, color: '#f59e0b' },
                    { label: 'Expired', value: contracts.filter(c => c.status === 'expired').length, color: '#ef4444' },
                ].map((s, i) => (
                    <div key={i} className="content-card" style={{ padding: '0.75rem 1rem', borderLeft: `3px solid ${s.color}` }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }} />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contracts..."
                        style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.85rem' }} />
                </div>
                {['all', 'active', 'expiring_soon', 'expired', 'draft'].map(f => (
                    <button key={f} onClick={() => setFilterStatus(f)}
                        style={{
                            padding: '0.4rem 0.85rem', borderRadius: '20px', border: '1px solid var(--border-color)',
                            background: filterStatus === f ? '#8B4513' : 'transparent',
                            color: filterStatus === f ? '#fff' : 'var(--text-main)',
                            cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                            textTransform: f === 'expiring_soon' ? 'none' : 'capitalize',
                        }}>
                        {f.replace('_', ' ')} {f === 'all' ? `(${contracts.length})` : `(${contracts.filter(c => c.status === f).length})`}
                    </button>
                ))}
            </div>

            <div className="content-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '700px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-body)' }}>
                                <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Contract</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Employee</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Type</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Period</th>
                                <th style={{ textAlign: 'center', padding: '0.75rem 1rem' }}>Status</th>
                                <th style={{ textAlign: 'center', padding: '0.75rem 1rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => (
                                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.fileSize ? `${c.fileSize} \u00b7 ` : ''}{new Date(c.createdAt).toISOString().split('T')[0]}</div>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <div style={{ fontWeight: 500 }}>{c.employeeName}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.department}</div>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', textTransform: 'capitalize', fontSize: '0.8rem' }}>
                                        <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--bg-body)', fontWeight: 600 }}>
                                            {c.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                                        <div>{c.startDate}</div>
                                        {c.endDate && <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>to {c.endDate}</div>}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '12px', background: statusConfig[c.status].bg, color: statusConfig[c.status].color }}>
                                            {statusConfig[c.status].icon} {c.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                                            <button title="View"
                                                style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}>
                                                <FaEye size={12} />
                                            </button>
                                            <button title="Download"
                                                style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}>
                                                <FaDownload size={12} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No contracts found.</div>
                )}
            </div>

            {showUpload && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
                    onClick={() => setShowUpload(false)}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
                    <div onClick={(e) => e.stopPropagation()} className="content-card" style={{ position: 'relative', padding: '2rem', maxWidth: '520px', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FaUpload /> Upload Contract
                            </h2>
                            <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
                                <FaTimes />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>Contract Title</label>
                                <input placeholder="e.g. Employment Contract — Site Foreman"
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.9rem' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>Employee</label>
                                    <input placeholder="Employee name"
                                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.9rem' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>Type</label>
                                    <select style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                        <option>Permanent</option>
                                        <option>Fixed Term</option>
                                        <option>Internship</option>
                                        <option>Contractor</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>Contract File (PDF)</label>
                                <div style={{ border: '2px dashed var(--border-color)', borderRadius: '10px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8B4513'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                                    <FaUpload size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Drop PDF here or click to browse</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button onClick={() => setShowUpload(false)}
                                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.85rem' }}>
                                Cancel
                            </button>
                            <button
                                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', background: '#8B4513', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <FaUpload size={12} /> Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Contracts;
