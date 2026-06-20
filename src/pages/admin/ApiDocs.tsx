import { useState, useEffect } from 'react';
import { FaCode, FaBookOpen, FaSearch, FaChevronDown, FaChevronRight, FaLock, FaGlobe } from 'react-icons/fa';

interface Endpoint {
    path: string;
    method: string;
    summary: string;
    tags: string[];
    isPublic?: boolean;
}

interface GroupedEndpoints {
    [tag: string]: Endpoint[];
}

const METHOD_COLORS: Record<string, string> = {
    GET: '#22c55e',
    POST: '#3b82f6',
    PUT: '#f59e0b',
    PATCH: '#8b5cf6',
    DELETE: '#ef4444',
};

const TAG_LABELS: Record<string, string> = {
    Authentication: 'Authentication',
    Profile: 'Profile & Messages',
    Notifications: 'Notifications',
    Public: 'Public',
    Chat: 'Chat',
    Resources: 'Resources',
    Upload: 'Upload',
    Audit: 'Audit',
    ML: 'ML / AI',
    Projects: 'Projects',
    Designs: 'Designs',
    Partnerships: 'Partnerships',
    Employees: 'Employees',
    Attendance: 'Attendance',
    Payroll: 'Payroll',
    Incomes: 'Incomes',
    Expenses: 'Expenses',
    Reports: 'Reports',
};

const PublicEndpoints = new Set([
    '/auth/register', '/auth/login', '/profile/public', '/profile/contact',
    '/profile/visit', '/chat/message', '/chat/history/{sessionId}',
]);

const MethodBadge = ({ method }: { method: string }) => (
    <span
        style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#fff',
            background: METHOD_COLORS[method] || '#6b7280',
            textTransform: 'uppercase',
            minWidth: 52,
            textAlign: 'center',
        }}
    >
        {method}
    </span>
);

const ApiDocs = () => {
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [search, setSearch] = useState('');
    const [counts, setCounts] = useState({ total: 0, GET: 0, POST: 0, PUT: 0, PATCH: 0, DELETE: 0 });
    const [grouped, setGrouped] = useState<GroupedEndpoints>({});
    const [expandedTags, setExpandedTags] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetch('/api/docs-json')
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(spec => {
                const c = { total: 0, GET: 0, POST: 0, PUT: 0, PATCH: 0, DELETE: 0 };
                const all: Endpoint[] = [];
                const paths = spec.paths || {};
                Object.keys(paths).forEach(path => {
                    const methods = paths[path] || {};
                    Object.keys(methods).forEach(m => {
                        const det = methods[m];
                        const key = m.toUpperCase() as keyof typeof c;
                        if (key in c) { c[key]++; c.total++; }
                        const tags = det.tags || ['Other'];
                        all.push({
                            path,
                            method: key,
                            summary: det.summary || '',
                            tags,
                            isPublic: PublicEndpoints.has(path) || tags.includes('Public'),
                        });
                    });
                });
                setCounts(c);

                const g: GroupedEndpoints = {};
                const tagOrder = [
                    'Authentication', 'Profile', 'Notifications', 'Chat', 'Resources',
                    'Upload', 'Audit', 'ML', 'Projects', 'Designs', 'Partnerships',
                    'Employees', 'Attendance', 'Payroll', 'Incomes', 'Expenses', 'Reports',
                ];
                tagOrder.forEach(t => { g[t] = []; });
                all.forEach(ep => {
                    const t = ep.tags[0] || 'Other';
                    if (tagOrder.includes(t)) {
                        g[t].push(ep);
                    } else {
                        if (!g['Other']) g['Other'] = [];
                        g['Other'].push(ep);
                    }
                });
                Object.keys(g).forEach(k => {
                    if (k !== 'Public') g[k].sort((a, b) => a.path.localeCompare(b.path));
                });
                setGrouped(g);

                const exp: Record<string, boolean> = {};
                Object.keys(g).forEach(k => { exp[k] = true; });
                setExpandedTags(exp);
                setLoading(false);
            })
            .catch((e) => { setFetchError(e.message); setLoading(false); });
    }, []);

    const statCards = [
        { label: 'Total', value: counts.total, color: '#8B4513' },
        { label: 'GET', value: counts.GET, color: '#22c55e' },
        { label: 'POST', value: counts.POST, color: '#3b82f6' },
        { label: 'PUT', value: counts.PUT, color: '#f59e0b' },
        { label: 'PATCH', value: counts.PATCH, color: '#8b5cf6' },
        { label: 'DELETE', value: counts.DELETE, color: '#ef4444' },
    ];

    const toggleTag = (tag: string) => {
        setExpandedTags(prev => ({ ...prev, [tag]: !prev[tag] }));
    };

    const allEndpoints = Object.values(grouped).flat();

    const filteredTags = Object.entries(grouped)
        .filter(([, eps]) => eps.length > 0)
        .filter(([tag]) => {
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return tag.toLowerCase().includes(q) ||
                eps.some(ep =>
                    ep.path.toLowerCase().includes(q) ||
                    ep.method.toLowerCase().includes(q) ||
                    ep.summary.toLowerCase().includes(q)
                );
        });

    const filteredEndpointsForTag = (eps: Endpoint[]): Endpoint[] => {
        if (!search.trim()) return eps;
        const q = search.toLowerCase();
        return eps.filter(ep =>
            ep.path.toLowerCase().includes(q) ||
            ep.method.toLowerCase().includes(q) ||
            ep.summary.toLowerCase().includes(q)
        );
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div className="inline-spinner">Loading API documentation...</div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, flexShrink: 0 }}>
                    <FaCode style={{ color: 'var(--primary)' }} /> API Documentation
                </h2>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {statCards.map(card => (
                        <div
                            key={card.label}
                            className="admin-card"
                            style={{
                                padding: '0.45rem 2rem',
                                textAlign: 'center',
                                background: card.color,
                                color: '#fff',
                                minWidth: 70,
                            }}
                        >
                            <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{card.value}</div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>{card.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {fetchError && (
                <div style={{ padding: '0.75rem 1rem', marginBottom: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: '0.85rem' }}>
                    Failed to load API specs: {fetchError}. Make sure the backend server is running.
                </div>
            )}

            <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Toolbar */}
                    <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FaBookOpen style={{ color: 'var(--primary)' }} /> All Endpoints
                            <span style={{ background: 'var(--bg-body)', padding: '1px 8px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600 }}>{allEndpoints.length}</span>
                        </span>
                        <div style={{ position: 'relative' }}>
                            <FaSearch size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search endpoints..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ padding: '0.3rem 0.5rem 0.3rem 1.8rem', fontSize: '0.8rem', width: 300 }}
                            />
                        </div>
                    </div>

                    {/* Grouped tables */}
                    <div style={{ overflowX: 'auto' }}>
                        {filteredTags.map(([tag, eps]) => {
                            const filtered = filteredEndpointsForTag(eps);
                            if (filtered.length === 0) return null;
                            const isExpanded = expandedTags[tag] !== false;
                            return (
                                <div key={tag} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    {/* Tag header */}
                                    <div
                                        onClick={() => toggleTag(tag)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.6rem 1rem',
                                            cursor: 'pointer',
                                            background: 'var(--bg-body)',
                                            fontWeight: 700,
                                            fontSize: '0.85rem',
                                            userSelect: 'none',
                                            borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
                                        }}
                                    >
                                        {isExpanded ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                                        <span style={{ color: '#8B4513' }}>{TAG_LABELS[tag] || tag}</span>
                                        <span style={{ background: '#8B4513', color: '#fff', padding: '1px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 600 }}>{filtered.length}</span>
                                    </div>

                                    {/* Table */}
                                    {isExpanded && (
                                        <table className="admin-table" style={{ margin: 0 }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: 70 }}>Method</th>
                                                    <th>Endpoint</th>
                                                    <th>Description</th>
                                                    <th style={{ width: 60, textAlign: 'center' }}>Auth</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filtered.map((ep, i) => (
                                                    <tr key={`${ep.path}-${ep.method}-${i}`}>
                                                        <td><MethodBadge method={ep.method} /></td>
                                                        <td>
                                                            <code style={{
                                                                fontSize: '0.8rem',
                                                                background: 'var(--bg-body)',
                                                                padding: '2px 6px',
                                                                borderRadius: 4,
                                                                color: 'var(--text-color)',
                                                                wordBreak: 'break-all',
                                                            }}>
                                                                {ep.path}
                                                            </code>
                                                        </td>
                                                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                            {ep.summary || '—'}
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            {ep.isPublic ? (
                                                                <FaGlobe size={14} style={{ color: '#22c55e' }} title="Public" />
                                                            ) : (
                                                                <FaLock size={14} style={{ color: '#f59e0b' }} title="Authenticated" />
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            );
                        })}
                        {filteredTags.length === 0 && (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <FaCode size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                                <div>No endpoints match your search.</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
};

export default ApiDocs;
