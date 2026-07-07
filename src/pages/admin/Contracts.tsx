import { useState, useEffect, useRef, useMemo } from 'react';
import { FaFileAlt, FaSearch, FaDownload, FaEye, FaPlus, FaTimes, FaUpload, FaCheckCircle, FaClock, FaSpinner, FaFilePdf, FaEdit, FaFileSignature, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { contractsService } from '../../services/contractsService';
import { hrService, type Employee } from '../../services/hrService';
import api from '../../services/api';
import type { Contract } from '../../services/contractsService';

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    active: { color: '#22c55e', bg: '#22c55e20', icon: <FaCheckCircle size={12} /> },
    expiring_soon: { color: '#f59e0b', bg: '#f59e0b20', icon: <FaClock size={12} /> },
    expired: { color: '#ef4444', bg: '#ef444420', icon: <FaTimes size={12} /> },
    draft: { color: '#6b7280', bg: '#6b728020', icon: <FaFileAlt size={12} /> },
};

const PAGE_SIZES = [5, 10, 15, 20];

interface UploadForm {
    title: string;
    employeeId: string;
    type: string;
    startDate: string;
    endDate: string;
}

const emptyForm: UploadForm = { title: '', employeeId: '', type: 'Permanent', startDate: '', endDate: '' };

const Contracts = () => {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showUpload, setShowUpload] = useState(false);
    const [editing, setEditing] = useState<Contract | null>(null);
    const [form, setForm] = useState<UploadForm>(emptyForm);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ title: '', body: '', footer: '', employeeId: '', type: 'Permanent', startDate: '', endDate: '' });
    const [createEmployee, setCreateEmployee] = useState<Employee | null>(null);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        contractsService.getAll()
            .then(res => setContracts(res.data || []))
            .catch(() => setContracts([]))
            .finally(() => setLoading(false));
    }, []);

    const openEdit = (contract: Contract) => {
        const emp = employees.find(e => `${e.firstName} ${e.lastName}` === contract.employeeName) || null;
        setEditing(contract);
        setSelectedEmployee(emp);
        setForm({
            title: contract.title,
            employeeId: emp?.id || '',
            type: contract.type.charAt(0).toUpperCase() + contract.type.slice(1).replace('_', ' '),
            startDate: contract.startDate,
            endDate: contract.endDate || '',
        });
        setSelectedFile(null);
        setShowUpload(true);
    };

    useEffect(() => {
        if (showUpload) {
            hrService.getEmployees()
                .then(res => {
                    setEmployees(res.data || []);
                    if (editing) {
                        const emp = (res.data || []).find((e: Employee) => `${e.firstName} ${e.lastName}` === editing.employeeName) || null;
                        setSelectedEmployee(emp);
                        if (emp) setForm(p => ({ ...p, employeeId: emp.id }));
                    }
                })
                .catch(() => setEmployees([]));
        } else {
            setForm(emptyForm);
            setSelectedEmployee(null);
            setSelectedFile(null);
            setEditing(null);
        }
    }, [showUpload]);

    const filtered = useMemo(() => contracts
        .filter(c => filterStatus === 'all' || c.status === filterStatus)
        .filter(c => search === '' || c.title.toLowerCase().includes(search.toLowerCase()) || c.employeeName.toLowerCase().includes(search.toLowerCase())), [contracts, filterStatus, search]);

    const totalPages = useMemo(() => pageSize === 0 ? 1 : Math.ceil(filtered.length / pageSize), [filtered, pageSize]);
    const paginated = useMemo(() => {
        if (pageSize === 0) return filtered;
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages || 1);
    }, [totalPages, page]);

    const totalActive = contracts.filter(c => c.status === 'active' || c.status === 'expiring_soon').length;

    const handleEmployeeSelect = (empId: string) => {
        const emp = employees.find(e => e.id === empId) || null;
        setSelectedEmployee(emp);
        setForm(p => ({ ...p, employeeId: empId }));
    };

    const handleCreate = async () => {
        if (!createForm.title || !createForm.employeeId || !createForm.startDate) return;
        setCreating(true);
        try {
            await contractsService.create({
                title: createForm.title,
                employeeName: createEmployee ? `${createEmployee.firstName} ${createEmployee.lastName}` : '',
                department: createEmployee?.department || '',
                type: createForm.type.toLowerCase().replace(' ', '_') as Contract['type'],
                startDate: createForm.startDate,
                endDate: createForm.endDate || undefined,
                body: createForm.body || undefined,
                footer: createForm.footer || undefined,
                status: 'active',
            });
            setShowCreate(false);
            const res = await contractsService.getAll();
            setContracts(res.data || []);
        } catch (e) { console.error(e); }
        finally { setCreating(false); }
    };

    const handleUpload = async () => {
        if (!form.title || !form.employeeId || !form.startDate) return;
        setUploading(true);
        try {
            let fileUrl = editing?.fileUrl;
            let fileSize = editing?.fileSize;
            if (selectedFile) {
                const fd = new FormData();
                fd.append('file', selectedFile);
                const uploadRes = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                fileUrl = uploadRes.data?.url || uploadRes.data?.secureUrl;
                fileSize = uploadRes.data?.bytes ? `${(uploadRes.data.bytes / 1024).toFixed(1)} KB` : undefined;
            }
            const payload = {
                title: form.title,
                employeeName: selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : '',
                department: selectedEmployee?.department || '',
                type: form.type.toLowerCase().replace(' ', '_') as Contract['type'],
                startDate: form.startDate,
                endDate: form.endDate || undefined,
                status: editing?.status || 'active',
                fileUrl,
                fileSize,
            };
            if (editing) {
                await contractsService.update(editing.id, payload);
            } else {
                await contractsService.create(payload);
            }
            setShowUpload(false);
            const res = await contractsService.getAll();
            setContracts(res.data || []);
        } catch (e) { console.error(e); }
        finally { setUploading(false); }
    };

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
                        <FaFileAlt style={{ color: '#1B2042' }} /> Contracts
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Manage employee contract documents — upload, review, and track expiry
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => { setShowCreate(true); hrService.getEmployees().then(r => setEmployees(r.data || [])).catch(() => {}); }}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                        <FaFileSignature size={12} /> Create Contract
                    </button>
                    <button onClick={() => setShowUpload(true)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#1B2042', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                        <FaPlus size={12} /> Upload Contract
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#1B2042', color: '#fff' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{contracts.length}</div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Total</div>
                </div>
                <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#22c55e', color: '#fff' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{totalActive}</div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Active</div>
                </div>
                <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#f59e0b', color: '#fff' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{contracts.filter(c => c.status === 'expiring_soon').length}</div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Expiring</div>
                </div>
                <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#ef4444', color: '#fff' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{contracts.filter(c => c.status === 'expired').length}</div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Expired</div>
                </div>
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
                            background: filterStatus === f ? '#1B2042' : 'transparent',
                            color: filterStatus === f ? '#fff' : 'var(--text-main)',
                            cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                            textTransform: f === 'expiring_soon' ? 'none' : 'capitalize',
                        }}>
                        {f.replace('_', ' ')} {f === 'all' ? `(${contracts.length})` : `(${contracts.filter(c => c.status === f).length})`}
                    </button>
                ))}
            </div>

            <div className="content-card" style={{ padding: 0, overflow: 'hidden', minHeight: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '700px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-body)' }}>
                                <th style={{ textAlign: 'left', padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>Contract</th>
                                <th style={{ textAlign: 'left', padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>Employee</th>
                                <th style={{ textAlign: 'left', padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>Type</th>
                                <th style={{ textAlign: 'left', padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>Period</th>
                                <th style={{ textAlign: 'center', padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>Status</th>
                                <th style={{ textAlign: 'center', padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(c => (
                                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '0.25rem 0.6rem' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.75rem' }}>{c.title}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{c.fileSize ? `${c.fileSize} \u00b7 ` : ''}{new Date(c.createdAt).toISOString().split('T')[0]}</div>
                                    </td>
                                    <td style={{ padding: '0.25rem 0.6rem' }}>
                                        <div style={{ fontWeight: 500, fontSize: '0.75rem' }}>{c.employeeName}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{c.department}</div>
                                    </td>
                                    <td style={{ padding: '0.25rem 0.6rem', textTransform: 'capitalize', fontSize: '0.7rem' }}>
                                        <span style={{ padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'var(--bg-body)', fontWeight: 600, fontSize: '0.7rem' }}>
                                            {c.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem' }}>
                                        <div>{c.startDate}</div>
                                        {c.endDate && <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>to {c.endDate}</div>}
                                    </td>
                                    <td style={{ padding: '0.25rem 0.6rem', textAlign: 'center' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.65rem', fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: '10px', background: statusConfig[c.status].bg, color: statusConfig[c.status].color }}>
                                            {statusConfig[c.status].icon} {c.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.25rem 0.6rem', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '0.2rem', justifyContent: 'center' }}>
                                            <button title="Edit"
                                                onClick={() => openEdit(c)}
                                                style={{ padding: '0.2rem 0.35rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.65rem', display: 'flex', alignItems: 'center' }}>
                                                <FaEdit size={10} />
                                            </button>
                                            <button title="View" onClick={() => c.fileUrl ? window.open(c.fileUrl, '_blank') : alert('No file attached')}
                                                style={{ padding: '0.2rem 0.35rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.65rem', display: 'flex', alignItems: 'center' }}>
                                                <FaEye size={10} />
                                            </button>
                                            <button title="Download" onClick={() => {
                                                if (!c.fileUrl) { alert('No file attached'); return; }
                                                const a = document.createElement('a');
                                                a.href = c.fileUrl;
                                                a.download = c.title.replace(/\s+/g, '_') + '.pdf';
                                                document.body.appendChild(a);
                                                a.click();
                                                document.body.removeChild(a);
                                            }}
                                                style={{ padding: '0.2rem 0.35rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.65rem', display: 'flex', alignItems: 'center' }}>
                                                <FaDownload size={10} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No contracts found.</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0.6rem', flexWrap: 'wrap', gap: 8, borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Showing {pageSize === 0 ? filtered.length : Math.min(pageSize, filtered.length - (page - 1) * pageSize)} of {filtered.length}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Per page:</span>
                            <select className="form-select" style={{ width: 'auto', padding: '0.2rem 1.2rem 0.2rem 0.4rem', fontSize: '0.72rem' }} value={pageSize} onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}>
                                {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                <option value={0}>All</option>
                            </select>
                        </div>
                        {pageSize > 0 && totalPages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }} disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><FaChevronLeft size={10} /></button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button key={p} className={p === page ? 'admin-btn' : 'admin-btn admin-btn--secondary'} style={{ padding: '0.2rem 0.5rem', minWidth: 26, fontSize: '0.72rem' }} onClick={() => setPage(p)}>{p}</button>
                                ))}
                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }} disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><FaChevronRight size={10} /></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showCreate && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
                    onClick={() => setShowCreate(false)}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
                    <div onClick={(e) => e.stopPropagation()} className="content-card" style={{ position: 'relative', padding: '2rem', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FaFileSignature /> Create Contract
                            </h2>
                            <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
                                <FaTimes />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>Contract Title</label>
                                <input placeholder="e.g. Employment Contract — Site Foreman" value={createForm.title}
                                    onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))}
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.9rem' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>Employee</label>
                                    <select value={createForm.employeeId} onChange={e => {
                                        const emp = employees.find(ee => ee.id === e.target.value) || null;
                                        setCreateEmployee(emp);
                                        setCreateForm(p => ({ ...p, employeeId: e.target.value }));
                                    }}
                                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                        <option value="">Select employee...</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} {emp.department ? `(${emp.department})` : ''}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>Type</label>
                                    <select value={createForm.type} onChange={e => setCreateForm(p => ({ ...p, type: e.target.value }))}
                                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                        <option>Permanent</option>
                                        <option>Fixed Term</option>
                                        <option>Internship</option>
                                        <option>Contractor</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>Start Date</label>
                                    <input type="date" value={createForm.startDate}
                                        onChange={e => setCreateForm(p => ({ ...p, startDate: e.target.value }))}
                                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.9rem' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>End Date <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                                    <input type="date" value={createForm.endDate}
                                        onChange={e => setCreateForm(p => ({ ...p, endDate: e.target.value }))}
                                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.9rem' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>Body <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(contract content)</span></label>
                                <textarea rows={8} placeholder="Enter the contract terms and conditions here..." value={createForm.body}
                                    onChange={e => setCreateForm(p => ({ ...p, body: e.target.value }))}
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>Footer <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(signature area, date, etc.)</span></label>
                                <textarea rows={3} placeholder="e.g. Signed: ___________________  Date: ___________" value={createForm.footer}
                                    onChange={e => setCreateForm(p => ({ ...p, footer: e.target.value }))}
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit' }} />
                            </div>
                        </div>

                        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button onClick={() => setShowCreate(false)}
                                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.85rem' }}>
                                Cancel
                            </button>
                            <button onClick={handleCreate} disabled={!createForm.title || !createForm.employeeId || !createForm.startDate || creating}
                                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: (!createForm.title || !createForm.employeeId || !createForm.startDate || creating) ? 0.5 : 1 }}>
                                {creating ? <FaSpinner className="spin" size={12} /> : <FaFileSignature size={12} />} {creating ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showUpload && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
                    onClick={() => setShowUpload(false)}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
                    <div onClick={(e) => e.stopPropagation()} className="content-card" style={{ position: 'relative', padding: '2rem', maxWidth: '520px', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {editing ? <FaEdit /> : <FaUpload />} {editing ? 'Edit Contract' : 'Upload Contract'}
                            </h2>
                            <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
                                <FaTimes />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>Contract Title</label>
                                <input placeholder="e.g. Employment Contract — Site Foreman" value={form.title}
                                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.9rem' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>Employee</label>
                                    <select value={form.employeeId} onChange={e => handleEmployeeSelect(e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                        <option value="">Select employee...</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} {emp.department ? `(${emp.department})` : ''}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>Type</label>
                                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                        <option>Permanent</option>
                                        <option>Fixed Term</option>
                                        <option>Internship</option>
                                        <option>Contractor</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>Start Date</label>
                                    <input type="date" value={form.startDate}
                                        onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.9rem' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>End Date <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                                    <input type="date" value={form.endDate}
                                        onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.9rem' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>Department</label>
                                <input value={selectedEmployee?.department || ''} disabled
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-muted)', fontSize: '0.9rem' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>Contract File (PDF)</label>
                                <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }}
                                    onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                                <div onClick={() => fileInputRef.current?.click()}
                                    style={{ border: '2px dashed var(--border-color)', borderRadius: '10px', padding: '1rem', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1B2042'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                                    {selectedFile ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                            <FaFilePdf size={20} style={{ color: '#ef4444' }} />
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>{selectedFile.name}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                                        </div>
                                    ) : (
                                        <>
                                            <FaUpload size={20} style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }} />
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Drop PDF here or click to browse</div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button onClick={() => setShowUpload(false)}
                                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.85rem' }}>
                                Cancel
                            </button>
                            <button onClick={handleUpload} disabled={!form.title || !form.employeeId || !form.startDate || uploading}
                                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', background: '#1B2042', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: (!form.title || !form.employeeId || !form.startDate || uploading) ? 0.5 : 1 }}>
                                {uploading ? <FaSpinner className="spin" size={12} /> : (editing ? <FaEdit size={12} /> : <FaUpload size={12} />)} {uploading ? 'Saving...' : editing ? 'Update' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Contracts;
