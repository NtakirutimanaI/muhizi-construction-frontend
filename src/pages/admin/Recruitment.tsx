import { useState, useEffect, useMemo } from 'react';
import {
    FaUserPlus, FaUsers, FaCamera, FaSpinner, FaTimes as FaTimesIcon, FaEye,
    FaEdit, FaTrash, FaChevronLeft, FaChevronRight, FaProjectDiagram, FaMapMarkerAlt,
} from 'react-icons/fa';
import { hrService } from '../../services/hrService';
import { assignmentService } from '../../services/assignmentService';
import { sitesService } from '../../services/sitesService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { uploadService } from '../../services/uploadService';
import type { EmployeeAssignment } from '../../services/assignmentService';

const StatTile = ({ icon, label, value, accent, emphasis }: { icon: React.ReactNode; label: string; value: string; accent: string; emphasis?: boolean }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0,
        background: emphasis ? `${accent}12` : 'var(--bg-white)',
        border: `1px solid ${emphasis ? `${accent}40` : 'var(--border-color)'}`,
        borderRadius: 10, padding: '0.8rem 1rem',
    }}>
        <div style={{
            width: 36, height: 36, borderRadius: 9, background: `${accent}18`, color: accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.95rem',
        }}>{icon}</div>
        <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
            <div style={{ fontSize: emphasis ? '1.1rem' : '0.95rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
        </div>
    </div>
);

const JOB_CATEGORIES = [
    'Masonry', 'Helper', 'Plumber', 'Carpenter', 'Electrician', 'Painter',
    'Roofer', 'Welder', 'Heavy Equipment Operator', 'Labourer', 'Foreman', 'Other',
];
const PAGE_SIZES = [5, 10, 15, 20];

interface RecruitForm {
    firstName: string; lastName: string; email: string; phone: string;
    address: string; position: string; nationalId: string; avatar: string;
}
const emptyForm: RecruitForm = {
    firstName: '', lastName: '', email: '', phone: '',
    address: '', position: '', nationalId: '', avatar: '',
};

const Recruitment = () => {
    const { showToast } = useToast();
    const { user } = useAuth();

    const [engineerSites, setEngineerSites] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedSiteId, setSelectedSiteId] = useState('');
    const [engineerProjects, setEngineerProjects] = useState<{ id: string; name: string; location?: string }[]>([]);

    const [teamMembers, setTeamMembers] = useState<(EmployeeAssignment & { employee?: any })[]>([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<RecruitForm>(emptyForm);
    const [uploading, setUploading] = useState(false);

    const [viewItem, setViewItem] = useState<EmployeeAssignment | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<EmployeeAssignment | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        sitesService.getMyAssigned()
            .catch(() => sitesService.getAll())
            .then(res => {
                const sites = res?.data || [];
                setEngineerSites(sites);
                const projMap = new Map<string, { id: string; name: string; location?: string }>();
                sites.forEach((s: any) => {
                    if (s.project && !projMap.has(s.project.id)) {
                        projMap.set(s.project.id, s.project);
                    }
                });
                const projs = Array.from(projMap.values());
                setEngineerProjects(projs);
                if (projs.length >= 1) {
                    setSelectedProjectId(projs[0].id);
                    const site = sites.find((s: any) => s.projectId === projs[0].id);
                    if (site) setSelectedSiteId(site.id);
                }
            })
            .catch(() => {
                setEngineerSites([]);
                setEngineerProjects([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const fetchTeam = async () => {
        try {
            const assignRes = await assignmentService.getMyRecruits();
            setTeamMembers(assignRes.data || []);
        } catch {
            try {
                const allAssignRes = await assignmentService.getAll();
                setTeamMembers(allAssignRes.data || []);
            } catch {
                setTeamMembers([]);
            }
        }
    };

    useEffect(() => { fetchTeam(); }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return teamMembers.filter(t => {
            if (!t.employee) return false;
            const name = `${t.employee.firstName} ${t.employee.lastName}`.toLowerCase();
            if (q && !name.includes(q) && !(t.employee.email || '').toLowerCase().includes(q) && !(t.task || '').toLowerCase().includes(q)) return false;
            return true;
        });
    }, [teamMembers, search]);

    const totalPages = pageSize === 0 ? 1 : Math.ceil(filtered.length / pageSize);
    const paginated = useMemo(() => {
        if (pageSize === 0) return filtered;
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    useEffect(() => { if (page > totalPages) setPage(totalPages || 1); }, [totalPages, page]);

    const selectedProject = engineerProjects.find(p => p.id === selectedProjectId);
    const selectedSite = engineerSites.find((s: any) => s.id === selectedSiteId);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const uploaded = await uploadService.uploadFile(file);
            setForm(p => ({ ...p, avatar: uploaded.secureUrl }));
        } catch { showToast('Failed to upload image', 'error'); }
        finally { setUploading(false); }
    };

    const handleSave = async () => {
        if (!form.firstName.trim() || !form.lastName.trim()) {
            showToast('First and last name are required', 'error'); return;
        }
        if (!form.position) {
            showToast('Job category is required', 'error'); return;
        }
        if (form.nationalId && !/^\d{16}$/.test(form.nationalId)) {
            showToast('National ID must be exactly 16 digits', 'error'); return;
        }
        setSaving(true);
        try {
            const empPayload: any = {
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                phone: form.phone || undefined,
                address: form.address || undefined,
                position: form.position,
                nationalId: form.nationalId || undefined,
                avatar: form.avatar || undefined,
                department: 'construction',
                status: 'active',
                salary: 0,
            };
            if (form.email.trim()) empPayload.email = form.email.trim();

            const empRes = await hrService.createEmployee(empPayload);
            const newEmp = empRes.data;

            await assignmentService.create({
                employeeId: newEmp.id,
                projectId: selectedProjectId,
                siteId: selectedSiteId || undefined,
                task: form.position,
                role: 'worker',
                startDate: new Date().toISOString().split('T')[0],
                isActive: true,
            });

            showToast(`${form.firstName} ${form.lastName} recruited successfully`, 'success');
            setShowModal(false);
            setForm(emptyForm);
            fetchTeam();
        } catch (e: any) {
            const msg = e?.response?.data?.message;
            const text = Array.isArray(msg) ? msg.join('. ') : typeof msg === 'string' ? msg : 'Failed to recruit worker';
            showToast(text, 'error');
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            if (deleteTarget.id.startsWith('emp-')) {
                await hrService.deleteEmployee(deleteTarget.employeeId);
            } else {
                await assignmentService.delete(deleteTarget.id);
            }
            showToast('Worker removed from team', 'success');
            setDeleteTarget(null);
            fetchTeam();
        } catch (e: any) {
            const msg = e?.response?.data?.message;
            const text = Array.isArray(msg) ? msg.join('. ') : typeof msg === 'string' ? msg : 'Failed to remove worker';
            showToast(text, 'error');
        }
        finally { setDeleting(false); }
    };

    if (loading) {
        return (
            <div className="admin-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
                <FaSpinner className="spin" size={24} style={{ color: 'var(--primary)' }} />
            </div>
        );
    }



    const stats = {
        total: filtered.length,
    };

    return (
        <div className="admin-page">
            <div style={{ marginBottom: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.1rem' }}>
                    <FaUserPlus style={{ color: 'var(--primary)' }} /> Recruitment
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'flex-end' }}>
                    <div style={{ minWidth: 160, flex: '0 0 auto' }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2, display: 'block' }}>Site</label>
                        <div style={{ padding: '0.55rem 0.75rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 8, whiteSpace: 'nowrap' }}>
                            <FaMapMarkerAlt size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                            {selectedSite ? `${selectedSite.name}${selectedSite.location ? ` — ${selectedSite.location}` : ''}` : '—'}
                        </div>
                    </div>
                    <div style={{ minWidth: 180, flex: '0 0 auto' }}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2, display: 'block' }}>Project</label>
                        <select className="form-select" value={selectedProjectId}
                            onChange={e => {
                                setSelectedProjectId(e.target.value);
                                const site = engineerSites.find((s: any) => s.projectId === e.target.value);
                                setSelectedSiteId(site?.id || '');
                            }}
                            disabled={engineerProjects.length <= 1}
                            style={{ padding: '0.55rem 0.75rem', fontSize: '0.82rem', minWidth: 180 }}>
                            {engineerProjects.map(p => (
                                <option key={p.id} value={p.id}>{p.name} {p.location ? `(${p.location})` : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }} />
                    <StatTile icon={<FaUsers />} label="My Team" value={String(stats.total)} accent="#1B2042" emphasis />
                </div>
            </div>

            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Recruited Workers ({filtered.length})</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input type="text" className="form-input" placeholder="Search name, job..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 200 }} />
                        <button className="admin-btn" onClick={() => { setForm(emptyForm); setShowModal(true); }}
                            style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, opacity: 1 }}>
                            <FaUserPlus /> Recruit Worker
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th><th>Phone</th><th>Job Category</th><th>National ID</th><th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(item => {
                                const emp = item.employee;
                                if (!emp) return null;
                                const initials = `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase();
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {emp.avatar ? (
                                                    <img src={emp.avatar} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                                ) : (
                                                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: 700, flexShrink: 0 }}>
                                                        {initials}
                                                    </div>
                                                )}
                                                <strong style={{ fontSize: '0.85rem' }}>{emp.firstName} {emp.lastName}</strong>
                                            </div>
                                        </td>
                                        <td>{emp.phone || '—'}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{item.task || emp.position || '—'}</td>
                                        <td>{emp.nationalId || '—'}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.78rem' }} onClick={() => setViewItem(item)} title="View"><FaEye /></button>
                                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.78rem', color: 'var(--primary-red)' }} onClick={() => setDeleteTarget(item)} title="Remove"><FaTrash /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr><td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <FaUsers size={28} style={{ opacity: 0.3, marginBottom: 6 }} />
                                    <div style={{ fontSize: '0.82rem' }}>No workers recruited yet. Click "Recruit Worker" to add one.</div>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem', padding: '0.35rem 0', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Showing {pageSize === 0 ? filtered.length : Math.min(pageSize, filtered.length - (page - 1) * pageSize)} of {filtered.length}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Per page:</span>
                            <select className="form-select" style={{ width: 'auto', padding: '0.3rem 1.5rem 0.3rem 0.5rem', fontSize: '0.8rem' }} value={pageSize} onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}>
                                {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                <option value={0}>All</option>
                            </select>
                        </div>
                        {pageSize > 0 && totalPages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><FaChevronLeft /></button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button key={p} className={p === page ? 'admin-btn' : 'admin-btn admin-btn--secondary'} style={{ padding: '0.3rem 0.7rem', minWidth: 32, fontSize: '0.85rem' }} onClick={() => setPage(p)}>{p}</button>
                                ))}
                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><FaChevronRight /></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="admin-modal-overlay" onClick={() => !saving && setShowModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', borderRadius: 12 }}>
                        <div className="admin-modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem' }}>
                                <FaUserPlus style={{ color: 'var(--primary)' }} /> Recruit New Worker
                            </h3>
                            <button onClick={() => !saving && setShowModal(false)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    {form.avatar ? (
                                        <img src={form.avatar} alt="" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }} />
                                    ) : (
                                        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700 }}>
                                            {(form.firstName?.[0] || '') + (form.lastName?.[0] || '') || <FaUserPlus />}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <input type="file" accept="image/*" style={{ display: 'none' }} id="recruit-avatar" onChange={handleAvatarUpload} />
                                    <label htmlFor="recruit-avatar" className="admin-btn admin-btn--secondary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                        {uploading ? <><FaSpinner className="spin" size={11} /> Uploading...</> : <><FaCamera size={11} /> {form.avatar ? 'Change Photo' : 'Upload Photo'}</>}
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">First Name *</label>
                                    <input className="form-input" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} placeholder="First name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name *</label>
                                    <input className="form-input" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Last name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                                    <input type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+250 788 000 000" />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Address / Location</label>
                                    <input className="form-input" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="e.g. Kicukiro, Kigali" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Job Category *</label>
                                    <select className="form-select" value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))}>
                                        <option value="">— Select —</option>
                                        {JOB_CATEGORIES.map(j => <option key={j} value={j}>{j}</option>)}
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">National ID Number (16 digits)</label>
                                    <input className="form-input" value={form.nationalId} maxLength={16} onChange={e => setForm(p => ({ ...p, nationalId: e.target.value.replace(/\D/g, '') }))} placeholder="1198000123456789" />
                                </div>
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
                            <button className="admin-btn" onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : 'Recruit Worker'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewItem && viewItem.employee && (() => {
                const emp = viewItem.employee;
                const initials = `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase();
                return (
                    <div className="admin-modal-overlay" onClick={() => setViewItem(null)}>
                        <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, borderRadius: 12 }}>
                            <div className="admin-modal-header">
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem' }}>
                                    <FaUsers style={{ color: 'var(--primary)' }} /> Worker Profile
                                </h3>
                                <button onClick={() => setViewItem(null)}><FaTimesIcon /></button>
                            </div>
                            <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    {emp.avatar ? (
                                        <img src={emp.avatar} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                                    ) : (
                                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700 }}>{initials}</div>
                                    )}
                                    <div>
                                        <div style={{ fontWeight: 700 }}>{emp.firstName} {emp.lastName}</div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{viewItem.task || emp.position || 'Worker'}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#f9f9f9', borderRadius: 8, padding: '0.75rem' }}>
                                    <div><div style={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase' }}>Phone</div><div>{emp.phone || '—'}</div></div>
                                    <div><div style={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase' }}>Email</div><div>{emp.email || '—'}</div></div>
                                    <div><div style={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase' }}>Address</div><div>{emp.address || '—'}</div></div>
                                    <div><div style={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase' }}>National ID</div><div>{emp.nationalId || '—'}</div></div>
                                    <div><div style={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase' }}>Assigned Since</div><div>{viewItem.startDate ? new Date(viewItem.startDate).toLocaleDateString() : '—'}</div></div>
                                </div>
                            </div>
                            <div className="admin-modal-footer">
                                <button className="admin-btn admin-btn--secondary" onClick={() => setViewItem(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {deleteTarget && (
                <div className="admin-modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, borderRadius: 12 }}>
                        <div className="admin-modal-header">
                            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FaTrash style={{ color: 'var(--primary-red)' }} /> Remove Worker
                            </h3>
                            <button onClick={() => !deleting && setDeleteTarget(null)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            <p style={{ margin: 0, fontSize: '0.88rem' }}>
                                Remove <strong>{deleteTarget.employee?.firstName} {deleteTarget.employee?.lastName}</strong> from your team? They will no longer appear in your attendance records.
                            </p>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
                            <button className="admin-btn" style={{ background: 'var(--primary-red)', borderColor: 'var(--primary-red)' }} onClick={handleDelete} disabled={deleting}>
                                {deleting ? 'Removing...' : 'Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Recruitment;
