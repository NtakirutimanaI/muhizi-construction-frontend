import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { constructionService } from '../../services/constructionService';
import { FaArrowLeft, FaProjectDiagram, FaHardHat, FaTruck, FaCamera, FaCheckDouble, FaFileAlt, FaGavel, FaMapMarkerAlt, FaUser, FaCalendarAlt, FaCheckCircle, FaSpinner, FaClock, FaTimesCircle, FaCheck, FaBullhorn, FaLock, FaListAlt, FaExclamationTriangle, FaMoneyCheckAlt } from 'react-icons/fa';
import type { Project } from '../../services/constructionService';

type Tab = 'overview' | 'sites' | 'approvals' | 'contracts' | 'rules';

const iconMap: Record<string, React.ReactNode> = {
    FaClock: <FaClock size={16} />, FaHardHat: <FaHardHat size={16} />,
    FaMoneyCheckAlt: <FaMoneyCheckAlt size={16} />, FaLock: <FaLock size={16} />,
    FaListAlt: <FaListAlt size={16} />, FaExclamationTriangle: <FaExclamationTriangle size={16} />,
    FaBullhorn: <FaBullhorn size={16} />,
};

const statusStyles: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    planning: { color: '#6b7280', bg: '#6b728020', icon: <FaClock size={12} /> },
    in_progress: { color: '#3b82f6', bg: '#3b82f620', icon: <FaSpinner size={12} /> },
    completed: { color: '#22c55e', bg: '#22c55e20', icon: <FaCheckCircle size={12} /> },
    cancelled: { color: '#ef4444', bg: '#ef444420', icon: <FaTimesCircle size={12} /> },
};

const approvalStatusStyles: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    pending: { color: '#f59e0b', bg: '#f59e0b20', icon: <FaClock size={12} /> },
    approved: { color: '#22c55e', bg: '#22c55e20', icon: <FaCheckCircle size={12} /> },
    rejected: { color: '#ef4444', bg: '#ef444420', icon: <FaTimesCircle size={12} /> },
};

const contractStatusStyles: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    active: { color: '#22c55e', bg: '#22c55e20', icon: <FaCheckCircle size={12} /> },
    expiring_soon: { color: '#f59e0b', bg: '#f59e0b20', icon: <FaClock size={12} /> },
    expired: { color: '#ef4444', bg: '#ef444420', icon: <FaTimesCircle size={12} /> },
    draft: { color: '#6b7280', bg: '#6b728020', icon: <FaFileAlt size={12} /> },
};

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <FaProjectDiagram size={14} /> },
    { key: 'sites', label: 'Sites & Activities', icon: <FaHardHat size={14} /> },
    { key: 'approvals', label: 'Approvals', icon: <FaCheckDouble size={14} /> },
    { key: 'contracts', label: 'Contracts', icon: <FaFileAlt size={14} /> },
    { key: 'rules', label: 'Site Rules', icon: <FaGavel size={14} /> },
];

const sampleActivities = [
    { date: '2026-06-20', task: 'Foundation pouring — Block A', crew: 'Team Alpha', status: 'completed' },
    { date: '2026-06-19', task: 'Steel reinforcement installation', crew: 'Team Bravo', status: 'completed' },
    { date: '2026-06-18', task: 'Site clearance and excavation', crew: 'Team Alpha', status: 'completed' },
    { date: '2026-06-21', task: 'Curing and quality inspection', crew: 'Team Charlie', status: 'in_progress' },
];

const sampleMaterials = [
    { item: 'Portland Cement', qty: 200, unit: 'bags', status: 'delivered', date: '2026-06-19' },
    { item: '12mm Rebar', qty: 500, unit: 'units', status: 'ordered', date: '2026-06-22' },
    { item: 'Sharp Sand', qty: 10, unit: 'tons', status: 'delivered', date: '2026-06-18' },
];

const sampleEvidence = [
    { title: 'Foundation Layout', type: 'image', date: '2026-06-20' },
    { title: 'Rebar Placement — Block A', type: 'image', date: '2026-06-19' },
    { title: 'Site Progress — Week 3', type: 'video', date: '2026-06-18' },
];

const sampleApprovals = [
    { id: '1', title: 'Cement Order — 200 Bags', requester: 'Jean Niyonzima', amount: null, items: [{ name: 'Portland Cement', qty: 200, unit: 'bags' }], status: 'pending', date: '2026-06-18' },
    { id: '2', title: 'Worker Transport Advance', requester: 'Patrick Habimana', amount: 150000, items: null, status: 'pending', date: '2026-06-19' },
    { id: '3', title: 'Steel Reinforcement Bars', requester: 'Jean Niyonzima', amount: null, items: [{ name: '12mm Rebar', qty: 500, unit: 'units' }, { name: '16mm Rebar', qty: 300, unit: 'units' }], status: 'approved', date: '2026-06-15' },
    { id: '4', title: 'Equipment Repair Fund', requester: 'Patrick Habimana', amount: 350000, items: null, status: 'rejected', date: '2026-06-14' },
];

const sampleContracts = [
    { id: '1', title: 'Site Engineer Contract', employee: 'Jean Niyonzima', type: 'permanent', period: '2025-01-15 — ongoing', status: 'active' },
    { id: '2', title: 'Safety Officer Agreement', employee: 'Alice Mukamana', type: 'fixed_term', period: '2025-03-01 — 2026-02-28', status: 'expiring_soon' },
    { id: '3', title: 'Equipment Rental Contractor', employee: 'Patrick Habimana', type: 'contractor', period: '2026-04-01 — 2027-03-31', status: 'active' },
];

const sampleRules = [
    { title: 'Job Start Time & Attendance', iconName: 'FaClock', pinColor: '#e74c3c', items: ['Report by 6:30 AM sharp — gates close at 6:45 AM.', 'Biometric scan at main gate.', 'Afternoon shift starts at 1:00 PM.', 'Overtime requires site manager approval.'] },
    { title: 'Safety Rules', iconName: 'FaHardHat', pinColor: '#f39c12', items: ['PPE mandatory at all times.', '3rd PPE offense = termination.', 'Report all accidents immediately.', 'Monthly safety drills required.'] },
    { title: 'Site Confidentiality', iconName: 'FaLock', pinColor: '#8B4513', items: ['No photos without authorization.', 'NDA signed upon hiring.', 'Social media posts require clearance.'] },
];

const ProjectDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [loading, setLoading] = useState(true);
    const [approvals, setApprovals] = useState(sampleApprovals);
    const [selectedApproval, setSelectedApproval] = useState<typeof sampleApprovals[0] | null>(null);
    const [selectedRule, setSelectedRule] = useState<typeof sampleRules[0] | null>(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await constructionService.getProject(id!);
                setProject(res.data);
            } catch { setProject(null); }
            finally { setLoading(false); }
        };
        if (id) fetch();
    }, [id]);

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading project...</div>;
    if (!project) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Project not found.</div>;

    return (
        <div>
            <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/admin/projects')}
                    style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FaArrowLeft size={12} /> Back
                </button>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaProjectDiagram style={{ color: '#8B4513' }} /> {project.name}
                    </h1>
                    {project.location && <p style={{ margin: '0.15rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <FaMapMarkerAlt size={12} /> {project.location}
                    </p>}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', borderBottom: '2px solid var(--border-color)', paddingBottom: 0 }}>
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)}
                        style={{
                            padding: '0.5rem 1rem', border: 'none', background: 'none',
                            color: activeTab === t.key ? '#8B4513' : 'var(--text-muted)',
                            cursor: 'pointer', fontSize: '0.82rem', fontWeight: activeTab === t.key ? 700 : 500,
                            borderBottom: activeTab === t.key ? '2px solid #8B4513' : '2px solid transparent',
                            marginBottom: '-2px', display: 'flex', alignItems: 'center', gap: '0.35rem',
                            transition: 'all 0.15s',
                        }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div className="content-card" style={{ padding: '0.75rem 1rem', borderLeft: '3px solid #8B4513' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Status</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                {statusStyles[project.status]?.icon} <span style={{ textTransform: 'capitalize' }}>{project.status.replace('_', ' ')}</span>
                            </div>
                        </div>
                        <div className="content-card" style={{ padding: '0.75rem 1rem', borderLeft: '3px solid #22c55e' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Budget</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.15rem' }}>RWF {(project.budget || 0).toLocaleString()}</div>
                        </div>
                        <div className="content-card" style={{ padding: '0.75rem 1rem', borderLeft: '3px solid #3b82f6' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Progress</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.15rem' }}>{project.progress || 0}%</div>
                            <div style={{ marginTop: '0.3rem', height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: `${project.progress || 0}%`, height: '100%', background: '#8B4513', borderRadius: '2px' }} />
                            </div>
                        </div>
                        <div className="content-card" style={{ padding: '0.75rem 1rem', borderLeft: '3px solid #8B4513' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Type</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.15rem', textTransform: 'capitalize' }}>{project.type || '—'}</div>
                        </div>
                    </div>

                    {project.description && (
                        <div className="content-card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.35rem' }}>Description</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>{project.description}</p>
                        </div>
                    )}

                    <div className="content-card" style={{ padding: '1rem 1.25rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Project Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                            {project.clientName && <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Client</span><div style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><FaUser size={12} /> {project.clientName}</div></div>}
                            {project.startDate && <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Start Date</span><div style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><FaCalendarAlt size={12} /> {new Date(project.startDate).toLocaleDateString()}</div></div>}
                            {project.endDate && <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>End Date</span><div style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><FaCalendarAlt size={12} /> {new Date(project.endDate).toLocaleDateString()}</div></div>}
                            <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created</span><div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{new Date(project.createdAt).toLocaleDateString()}</div></div>
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                        {[
                            { icon: <FaHardHat />, label: 'Sites & Activities', count: sampleActivities.length, tab: 'sites' as Tab },
                            { icon: <FaTruck />, label: 'Material Requests', count: sampleMaterials.length, tab: 'sites' as Tab },
                            { icon: <FaCheckDouble />, label: 'Pending Approvals', count: approvals.filter(a => a.status === 'pending').length, tab: 'approvals' as Tab },
                            { icon: <FaFileAlt />, label: 'Contracts', count: sampleContracts.length, tab: 'contracts' as Tab },
                            { icon: <FaGavel />, label: 'Site Rules', count: sampleRules.length, tab: 'rules' as Tab },
                        ].map((s, i) => (
                            <div key={i} className="content-card" style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderLeft: '3px solid #8B4513' }}
                                onClick={() => setActiveTab(s.tab)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.icon} {s.label}</div>
                                <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.1rem' }}>{s.count}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'sites' && (
                <div>
                    <div className="content-card" style={{ padding: '1rem 1.25rem', marginBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <FaHardHat /> Recent Activities
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {sampleActivities.map((a, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.25rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{a.task}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.date} &middot; {a.crew}</div>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '10px', background: a.status === 'completed' ? '#22c55e20' : '#3b82f620', color: a.status === 'completed' ? '#22c55e' : '#3b82f6', textTransform: 'capitalize' }}>{a.status.replace('_', ' ')}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="content-card" style={{ padding: '1rem 1.25rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <FaTruck /> Material Requests
                            </h3>
                            {sampleMaterials.map((m, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
                                    <span>{m.item} — {m.qty} {m.unit}</span>
                                    <span style={{ fontWeight: 600, color: m.status === 'delivered' ? '#22c55e' : '#f59e0b', textTransform: 'capitalize' }}>{m.status}</span>
                                </div>
                            ))}
                        </div>
                        <div className="content-card" style={{ padding: '1rem 1.25rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <FaCamera /> Evidence
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                {sampleEvidence.map((e, i) => (
                                    <div key={i} style={{ padding: '0.6rem', background: 'var(--bg-body)', borderRadius: '8px', textAlign: 'center', fontSize: '0.75rem', border: '1px solid var(--border-color)' }}>
                                        <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{e.type === 'image' ? '📷' : '🎥'}</div>
                                        <div style={{ fontWeight: 600 }}>{e.title}</div>
                                        <div style={{ color: 'var(--text-muted)' }}>{e.date}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'approvals' && (
                <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {approvals.map(a => (
                            <div key={a.id} className="content-card" style={{
                                padding: '0.85rem 1.1rem', borderLeft: `4px solid ${approvalStatusStyles[a.status].color}`,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', cursor: 'pointer',
                            }} onClick={() => setSelectedApproval(a)}>
                                <div style={{ flex: 1, minWidth: '180px' }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{a.title}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{a.requester} &middot; {a.date}{a.amount ? ` · RWF ${a.amount.toLocaleString()}` : ''}</div>
                                </div>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '12px', background: approvalStatusStyles[a.status].bg, color: approvalStatusStyles[a.status].color }}>
                                    {approvalStatusStyles[a.status].icon} {a.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'contracts' && (
                <div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '600px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-body)' }}>
                                    <th style={{ textAlign: 'left', padding: '0.65rem 1rem' }}>Contract</th>
                                    <th style={{ textAlign: 'left', padding: '0.65rem 1rem' }}>Employee</th>
                                    <th style={{ textAlign: 'left', padding: '0.65rem 1rem' }}>Type</th>
                                    <th style={{ textAlign: 'left', padding: '0.65rem 1rem' }}>Period</th>
                                    <th style={{ textAlign: 'center', padding: '0.65rem 1rem' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sampleContracts.map(c => (
                                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '0.65rem 1rem', fontWeight: 600, fontSize: '0.82rem' }}>{c.title}</td>
                                        <td style={{ padding: '0.65rem 1rem' }}>{c.employee}</td>
                                        <td style={{ padding: '0.65rem 1rem', textTransform: 'capitalize', fontSize: '0.8rem' }}>{c.type.replace('_', ' ')}</td>
                                        <td style={{ padding: '0.65rem 1rem', fontSize: '0.8rem' }}>{c.period}</td>
                                        <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '12px', background: contractStatusStyles[c.status].bg, color: contractStatusStyles[c.status].color }}>
                                                {contractStatusStyles[c.status].icon} {c.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'rules' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
                    {sampleRules.map((r, i) => (
                        <div key={i} className="content-card" style={{
                            padding: '1rem 1.15rem', borderLeft: `4px solid ${r.pinColor}`, cursor: 'pointer',
                        }} onClick={() => setSelectedRule(r)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: `${r.pinColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.pinColor }}>
                                    {iconMap[r.iconName] || <FaBullhorn size={14} />}
                                </div>
                                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{r.title}</h3>
                            </div>
                            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {r.items.slice(0, 2).map((item, j) => (
                                    <li key={j} style={{ fontSize: '0.78rem', lineHeight: 1.4, color: 'var(--text-muted)', paddingLeft: '0.75rem', position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: 0, top: '6px', width: '4px', height: '4px', borderRadius: '50%', background: r.pinColor }} />
                                        {item}
                                    </li>
                                ))}
                                {r.items.length > 2 && <li style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>+{r.items.length - 2} more</li>}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            {selectedApproval && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
                    onClick={() => setSelectedApproval(null)}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
                    <div onClick={(e) => e.stopPropagation()} className="content-card" style={{ position: 'relative', padding: '1.5rem 2rem', maxWidth: '500px', width: '100%' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>{selectedApproval.title}</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{selectedApproval.requester} &middot; {selectedApproval.date}</p>
                        {selectedApproval.amount && <p style={{ fontSize: '1rem', fontWeight: 700, color: '#22c55e' }}>RWF {selectedApproval.amount.toLocaleString()}</p>}
                        {selectedApproval.items && selectedApproval.items.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', fontSize: '0.85rem' }}>
                                <span>{item.name}</span><span style={{ fontWeight: 600 }}>{item.qty} {item.unit}</span>
                            </div>
                        ))}
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setApprovals(prev => prev.map(a => a.id === selectedApproval.id ? { ...a, status: 'approved' } : a)); setSelectedApproval(null); }}
                                style={{ padding: '0.4rem 1rem', borderRadius: '6px', border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                                <FaCheck size={11} /> Approve
                            </button>
                            <button onClick={() => { setApprovals(prev => prev.map(a => a.id === selectedApproval.id ? { ...a, status: 'rejected' } : a)); setSelectedApproval(null); }}
                                style={{ padding: '0.4rem 1rem', borderRadius: '6px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedRule && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
                    onClick={() => setSelectedRule(null)}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
                    <div onClick={(e) => e.stopPropagation()} style={{
                        position: 'relative', background: 'linear-gradient(145deg, #8B4513, #6B3410)', borderRadius: '16px',
                        padding: '1.5rem 2rem', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto', color: '#fff',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {iconMap[selectedRule.iconName] || <FaBullhorn size={16} />}
                            </div>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{selectedRule.title}</h2>
                        </div>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {selectedRule.items.map((item, i) => (
                                <li key={i} style={{ fontSize: '0.95rem', lineHeight: 1.5, paddingLeft: '1.25rem', position: 'relative', opacity: 0.95 }}>
                                    <span style={{ position: 'absolute', left: 0, top: '8px', width: '6px', height: '6px', borderRadius: '50%', background: selectedRule.pinColor }} />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => setSelectedRule(null)} style={{ marginTop: '1rem', padding: '0.4rem 1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetail;
