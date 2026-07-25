import { useState, useEffect, useMemo, useCallback } from 'react';
import { FaTasks, FaEdit, FaTrash, FaPlus, FaTimes as FaTimesIcon, FaChevronLeft, FaChevronRight, FaExchangeAlt, FaEnvelope, FaSpinner } from 'react-icons/fa';
import { assignmentService, type EmployeeAssignment } from '../../services/assignmentService';
import { hrService, type Employee } from '../../services/hrService';
import { constructionService, type Project } from '../../services/constructionService';
import { sitesService, type Site } from '../../services/sitesService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { loadPageCache, savePageCache } from '../../utils/pageCache';

interface FormData {
    employeeId: string;
    projectId: string;
    siteId: string;
    task: string;
    role: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

const emptyForm: FormData = { employeeId: '', projectId: '', siteId: '', task: '', role: 'worker', startDate: '', endDate: '', isActive: true };
const PAGE_SIZES = [5, 10, 15, 20];

const EmployeeAssignments = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [data, setData] = useState<EmployeeAssignment[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<EmployeeAssignment | null>(null);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const filteredSites = useMemo(() => {
        if (!form.projectId) return sites;
        return sites.filter(s => s.projectId === form.projectId);
    }, [sites, form.projectId]);

    const isStorekeeper = user?.role === 'storekeeper';

    const fetch = async () => {
        const cached = loadPageCache<{ data: EmployeeAssignment[]; employees: Employee[]; projects: Project[]; sites: Site[] }>('pg_employee_assignments');
        if (cached) {
            setData(cached.data || []);
            setEmployees(cached.employees || []);
            setProjects(cached.projects || []);
            setSites(cached.sites || []);
        }
        try {
            const assPromise = isStorekeeper ? assignmentService.getMyTeam() : assignmentService.getAll();
            const [assRes, empRes, projRes, siteRes] = await Promise.all([
                assPromise,
                hrService.getEmployees(),
                constructionService.getProjects(),
                sitesService.getAll(),
            ]);
            const freshData = assRes.data || [];
            const freshEmployees = empRes.data || [];
            const freshProjects = projRes.data || [];
            const freshSites = siteRes.data || [];
            setData(freshData);
            setEmployees(freshEmployees);
            setProjects(freshProjects);
            setSites(freshSites);
            savePageCache('pg_employee_assignments', { data: freshData, employees: freshEmployees, projects: freshProjects, sites: freshSites });
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetch(); }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return data.filter(d => {
            const name = `${d.employee?.firstName || ''} ${d.employee?.lastName || ''} ${d.employee?.email || ''} ${d.project?.name || ''} ${d.site?.name || ''} ${d.task || ''} ${d.role}`.toLowerCase();
            return !q || name.includes(q);
        });
    }, [data, search]);

    const totalPages = pageSize === 0 ? 1 : Math.ceil(filtered.length / pageSize);
    const paginated = useMemo(() => {
        if (pageSize === 0) return filtered;
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages || 1);
    }, [totalPages, page]);

    const roleColors: Record<string, string> = {
        storekeeper: '#8b5cf6', worker: '#22c55e', supervisor: '#1B2042',
    };

    const openNew = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
    const openEdit = (item: EmployeeAssignment) => {
        setEditing(item);
        setForm({
            employeeId: item.employeeId,
            projectId: item.projectId,
            siteId: item.siteId || '',
            task: item.task || '',
            role: item.role,
            startDate: item.startDate,
            endDate: item.endDate || '',
            isActive: item.isActive,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                employeeId: form.employeeId,
                projectId: form.projectId,
                siteId: form.siteId || undefined,
                task: form.task || undefined,
                role: form.role as EmployeeAssignment['role'],
                startDate: form.startDate,
                endDate: form.endDate || undefined,
                isActive: form.isActive,
            };
            if (editing) {
                await assignmentService.update(editing.id, payload);
                showToast('Assignment updated', 'success');
            } else {
                await assignmentService.create(payload);
                showToast('Assignment created', 'success');
            }
            setShowModal(false);
            fetch();
        } catch (e: any) {
            const errMsg = e?.response?.data ? JSON.stringify(e.response.data) : (e?.message || 'Failed to save');
            showToast(errMsg, 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this assignment?')) return;
        try {
            await assignmentService.delete(id);
            fetch();
            showToast('Assignment deleted', 'success');
        } catch { showToast('Failed to delete', 'error'); }
    };

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: '40vh', color: 'var(--text-muted)', fontSize: '0.9rem' }}><FaSpinner className="spin" size={24} style={{ color: 'var(--primary)' }} /> Loading data...</div>;

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, flexShrink: 0, fontSize: '1rem' }}>
                    <FaTasks style={{ color: 'var(--primary)' }} /> Employee Assignments
                </h2>
                {!isStorekeeper && (
                    <button className="admin-btn" onClick={openNew} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}>
                        <FaPlus style={{ marginRight: 6 }} />Assign Employee
                    </button>
                )}
            </div>

            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{data.length} assignment{data.length !== 1 ? 's' : ''}</span>
                    <input type="text" className="form-input" placeholder="Search employee, project, role..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', width: 350 }} />
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Employee</th><th>Email</th><th>Project</th><th>Site</th><th>Task</th><th>Role</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(item => (
                                <tr key={item.id}>
                                    <td><strong>{item.employee?.firstName} {item.employee?.lastName}</strong></td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <FaEnvelope size={11} />{item.employee?.email || '—'}
                                        </span>
                                    </td>
                                    <td>{item.project?.name || '—'}</td>
                                    <td>{item.site?.name || '—'}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.task || '—'}</td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block', padding: '2px 10px', borderRadius: 0, fontSize: '0.8rem', fontWeight: 600,
                                            color: '#fff', background: roleColors[item.role] || '#6b7280',
                                        }}>{item.role.replace('_', ' ')}</span>
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(item.startDate).toLocaleDateString()}</td>
                                    <td style={{ whiteSpace: 'nowrap' }}>{item.endDate ? new Date(item.endDate).toLocaleDateString() : '—'}</td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block', padding: '2px 10px', borderRadius: 0, fontSize: '0.8rem', fontWeight: 600,
                                            color: '#fff', background: item.isActive ? '#22c55e' : '#ef4444',
                                        }}>{item.isActive ? 'Active' : 'Inactive'}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            {!isStorekeeper && (
                                                <><button className="admin-btn admin-btn--secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }} onClick={() => openEdit(item)}><FaEdit /></button>
                                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', color: 'var(--primary-red)' }} onClick={() => handleDelete(item.id)}><FaTrash /></button></>
                                            )}
                                            {isStorekeeper && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr><td colSpan={10} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <FaExchangeAlt size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                                    <div>No assignments yet. Click "Assign Employee" to assign someone to a project.</div>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', padding: '0.4rem 0', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Showing {pageSize === 0 ? filtered.length : Math.min(pageSize, filtered.length - (page - 1) * pageSize)} of {filtered.length}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Per page:</span>
                            <select className="form-select" style={{ width: 'auto', padding: '0.2rem 1.2rem 0.2rem 0.4rem', fontSize: '0.7rem' }}
                                value={pageSize} onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}>
                                {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                <option value={0}>All</option>
                            </select>
                        </div>
                        {pageSize > 0 && totalPages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }} disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><FaChevronLeft /></button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button key={p} className={p === page ? 'admin-btn' : 'admin-btn admin-btn--secondary'} style={{ padding: '0.15rem 0.5rem', minWidth: 26, fontSize: '0.7rem' }} onClick={() => setPage(p)}>{p}</button>
                                ))}
                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }} disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><FaChevronRight /></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ width: 600 }}>
                        <div className="admin-modal-header">
                            <h3>{editing ? 'Edit' : 'New'} Assignment</h3>
                            <button onClick={() => setShowModal(false)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Employee</label>
                                    <select className="form-select" value={form.employeeId} onChange={e => setForm(p => ({ ...p, employeeId: e.target.value }))}>
                                        <option value="">Select employee...</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.email})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Project</label>
                                    <select className="form-select" value={form.projectId} onChange={e => { setForm(p => ({ ...p, projectId: e.target.value, siteId: '' })); }}>
                                        <option value="">Select project...</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} {p.location ? `(${p.location})` : ''}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Site</label>
                                    <select className="form-select" value={form.siteId} onChange={e => setForm(p => ({ ...p, siteId: e.target.value }))}>
                                        <option value="">No site</option>
                                        {filteredSites.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} {s.location ? `(${s.location})` : ''}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Task</label>
                                    <input type="text" className="form-input" value={form.task} onChange={e => setForm(p => ({ ...p, task: e.target.value }))} placeholder="e.g. Foundation work" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <select className="form-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                                        <option value="worker">Worker</option>
                                        <option value="storekeeper">Storekeeper</option>
                                        <option value="supervisor">Supervisor</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select className="form-select" value={form.isActive ? 'active' : 'inactive'} onChange={e => setForm(p => ({ ...p, isActive: e.target.value === 'active' }))}>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input type="date" className="form-input" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End Date <span style={{ color: '#999', fontSize: '0.75rem' }}>(optional)</span></label>
                                    <input type="date" className="form-input" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
                                </div>
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="admin-btn" onClick={handleSave} disabled={!form.employeeId || !form.projectId || !form.startDate}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeAssignments;
