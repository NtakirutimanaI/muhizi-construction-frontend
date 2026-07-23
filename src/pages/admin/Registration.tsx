import { useState, useEffect, useMemo, useCallback, useRef, Fragment } from 'react';
import { FaUserPlus, FaUser, FaEnvelope, FaPhone, FaHome, FaIdCard, FaGraduationCap, FaVenusMars, FaRing, FaUsers, FaCalendarAlt, FaCheck, FaTimes, FaPlus, FaTimes as FaTimesIcon, FaShieldAlt, FaChevronLeft, FaChevronRight, FaEye, FaEyeSlash, FaEdit, FaTrash, FaSearch, FaCheckCircle, FaTimesCircle, FaUserTie, FaArrowsAlt, FaFilePdf, FaUpload, FaExternalLinkAlt, FaUniversity, FaBriefcase, FaInfoCircle, FaChevronDown, FaChevronUp, FaMoneyBillWave } from 'react-icons/fa';
import { insuranceService } from '../../services/insuranceService';
import { authService } from '../../services/authService';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { loadPageCache, savePageCache } from '../../utils/pageCache';

const ROLES_LIST = ['admin', 'managing_director', 'finance_director', 'site_engineer', 'engineering_studio', 'storekeeper', 'employee', 'partner', 'client'];
const GENDERS = ['Male', 'Female', 'Other'];
const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'];
const EDUCATION_LEVELS = ["High School", "Diploma", "Bachelor's Degree", "Master's Degree", "PhD", "Vocational Training", "Other"];
const MEDICAL_INSURANCES = ['Mutuelle de Sante', 'RSSB', 'RAMA', 'Radiant', 'Other'];
const EMPLOYMENT_STATUSES = ['employed', 'contract', 'external'];
const EMPLOYMENT_CATEGORIES = ['Helper', 'Masonry', 'Plumber', 'Charpantier', 'Electrician', 'Painter', 'Welder', 'Roofer', 'Tiler', 'Heavy Equipment Operator', 'Supervisor', 'Foreman', 'Internal Department (Office)', 'Other'];
const WORK_SHIFTS = ['day', 'night'];
const EMPLOYER_ROLES = ['admin', 'managing_director', 'finance_director', 'site_engineer', 'engineering_studio', 'storekeeper', 'employee'];
const PAGE_SIZES = [5, 10, 15, 20, 50];

interface UserData {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    isActive: boolean;
    phone?: string;
    address?: string;
    gender?: string;
    maritalStatus?: string;
    nationalId?: string;
    educationLevel?: string;
    medicalInsurance?: string;
    contractUrl?: string;
    bankAccount?: string;
    employmentStatus?: string;
    employmentCategory?: string;
    workShift?: string;
    basicSalary?: number;
    profile?: { firstName?: string; lastName?: string; avatar?: string; phone?: string };
    createdAt: string;
    updatedAt?: string;
}

interface FormState {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
    phone: string;
    address: string;
    gender: string;
    maritalStatus: string;
    nationalId: string;
    educationLevel: string;
    medicalInsurance: string;
    contractUrl: string;
    bankAccount: string;
    employmentStatus: string;
    employmentCategory: string;
    workShift: string;
    basicSalary: string;
    isActive: boolean;
}

const emptyForm: FormState = {
    firstName: '', lastName: '', email: '', password: '', role: 'employee',
    phone: '', address: '', gender: '', maritalStatus: '', nationalId: '',
    educationLevel: '', medicalInsurance: '', contractUrl: '', bankAccount: '',
    employmentStatus: '', employmentCategory: '', workShift: '', basicSalary: '', isActive: true,
};

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

const PasswordStrengthBar = ({ password }: { password: string }) => {
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
        /\d/.test(password),
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    ];
    const score = checks.filter(Boolean).length;
    const color = score <= 1 ? '#ef4444' : score <= 2 ? '#f59e0b' : score <= 3 ? '#eab308' : '#22c55e';

    return (
        <div style={{ marginTop: 6 }}>
            <div style={{ display: 'flex', gap: 3, marginBottom: 2 }}>
                {checks.map((ok, i) => (
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: ok ? color : 'var(--border-color)', transition: 'background 0.2s' }} />
                ))}
            </div>
            <span style={{ fontSize: '0.7rem', color }}>
                {score === 0 ? 'Very weak' : score <= 1 ? 'Weak' : score <= 2 ? 'Fair' : score <= 3 ? 'Good' : 'Strong'}
            </span>
        </div>
    );
};

const roleColors: Record<string, string> = {
    admin: '#ef4444', managing_director: '#1B2042', finance_director: '#f59e0b', site_engineer: '#22c55e',
    engineering_studio: '#3b82f6', storekeeper: '#8b5cf6', employee: '#6b7280',
    partner: '#1a8a6a', client: '#6c3096',
};

const InfoItem = ({ label, value, mono }: { label: string; value?: string; mono?: boolean }) => (
    <div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: 2 }}>{label}</div>
        <div style={{ fontWeight: 500, fontFamily: mono ? 'monospace' : undefined }}>{value || '—'}</div>
    </div>
);

const Registration = () => {
    const { showToast } = useToast();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState<'add' | 'edit' | null>(null);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [modalPos, setModalPos] = useState<{ x: number; y: number } | null>(null);
    const dragging = useRef<{ offsetX: number; offsetY: number } | null>(null);
    const [contractModalUser, setContractModalUser] = useState<UserData | null>(null);
    const [contractFile, setContractFile] = useState<File | null>(null);
    const [contractUploading, setContractUploading] = useState(false);
    const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
    const contractInputRef = useRef<HTMLInputElement>(null);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [viewUser, setViewUser] = useState<UserData | null>(null);
    const [insuranceDeduction, setInsuranceDeduction] = useState(0);

    const toggleRow = (id: string) => {
        setExpandedRow(prev => prev === id ? null : id);
    };

    const filteredUsers = useMemo(() => {
        const q = search.toLowerCase().trim();
        return users.filter(u => {
            if (q) {
                const name = `${u.firstName || u.profile?.firstName || ''} ${u.lastName || u.profile?.lastName || ''}`.toLowerCase();
                const email = u.email.toLowerCase();
                const phone = (u.phone || u.profile?.phone || '').toLowerCase();
                if (!name.includes(q) && !email.includes(q) && !phone.includes(q)) return false;
            }
            if (filterRole && u.role !== filterRole) return false;
            if (filterStatus === 'active' && !u.isActive) return false;
            if (filterStatus === 'inactive' && u.isActive) return false;
            return true;
        });
    }, [users, search, filterRole, filterStatus]);

    const totalPages = pageSize === 0 ? 1 : Math.ceil(filteredUsers.length / pageSize);
    const paginatedUsers = useMemo(() => {
        if (pageSize === 0) return filteredUsers;
        const start = (page - 1) * pageSize;
        return filteredUsers.slice(start, start + pageSize);
    }, [filteredUsers, page, pageSize]);

    useEffect(() => { if (page > totalPages) setPage(totalPages || 1); }, [totalPages, page]);

    const fetchUsers = async () => {
        try {
            const cached = loadPageCache<UserData[]>('pg_registration');
            if (cached) setUsers(cached);
            const data = await authService.getAllUsers();
            setUsers(data);
            savePageCache('pg_registration', data);
        } catch (e) {
            console.error('Failed to load users', e);
            showToast('Failed to load users', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    useEffect(() => {
        insuranceService.getDeduction().then(res => setInsuranceDeduction(res.data.totalDeduction || 0)).catch(() => {});
    }, []);

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!dragging.current) return;
        setModalPos({ x: e.clientX - dragging.current.offsetX, y: e.clientY - dragging.current.offsetY });
    }, []);

    const onMouseUp = useCallback(() => {
        dragging.current = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }, [onMouseMove]);

    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, [onMouseMove, onMouseUp]);

    const onHeaderMouseDown = useCallback((e: React.MouseEvent) => {
        const modal = (e.currentTarget as HTMLElement).closest('.admin-modal') as HTMLElement | null;
        if (!modal) return;
        const rect = modal.getBoundingClientRect();
        setModalPos({ x: rect.left, y: rect.top });
        dragging.current = { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [onMouseMove, onMouseUp]);

    const validatePassword = (pw: string): string => {
        if (pw.length < 8) return 'Minimum 8 characters';
        if (!/[A-Z]/.test(pw)) return 'At least one capital letter';
        if (!/[a-z]/.test(pw)) return 'At least one lowercase letter';
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) return 'At least one special character';
        return '';
    };

    const openAdd = () => {
        setForm(emptyForm);
        setEditingUser(null);
        setPasswordError('');
        setModalPos(null);
        setShowModal('add');
    };

    const openEdit = (u: UserData) => {
        setEditingUser(u);
        setForm({
            firstName: u.firstName || u.profile?.firstName || '',
            lastName: u.lastName || u.profile?.lastName || '',
            email: u.email,
            password: '',
            role: u.role,
            phone: u.phone || u.profile?.phone || '',
            address: u.address || '',
            gender: u.gender || '',
            maritalStatus: u.maritalStatus || '',
            nationalId: u.nationalId || '',
            educationLevel: u.educationLevel || '',
            medicalInsurance: u.medicalInsurance || '',
            contractUrl: u.contractUrl || '',
            bankAccount: u.bankAccount || '',
            employmentStatus: u.employmentStatus || '',
            employmentCategory: u.employmentCategory || '',
            workShift: u.workShift || '',
            basicSalary: u.basicSalary ? String(u.basicSalary) : '',
            isActive: u.isActive,
        });
        setPasswordError('');
        setModalPos(null);
        setShowModal('edit');
    };

    const handleSave = async () => {
        try {
            if (showModal === 'edit' && editingUser) {
                if (form.password) {
                    const err = validatePassword(form.password);
                    if (err) { setPasswordError(err); return; }
                }
                const payload: any = {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: form.email,
                    role: form.role,
                    isActive: form.isActive,
                    phone: form.phone,
                    address: form.address,
                    gender: form.gender,
                    maritalStatus: form.maritalStatus,
                    nationalId: form.nationalId,
                    educationLevel: form.educationLevel,
                    medicalInsurance: form.medicalInsurance,
                    contractUrl: form.contractUrl,
                    bankAccount: form.bankAccount,
                    employmentStatus: form.employmentStatus,
                    employmentCategory: form.employmentCategory,
                    workShift: form.workShift,
                    basicSalary: form.basicSalary ? parseFloat(form.basicSalary) : 0,
                };
                if (form.password) payload.password = form.password;
                await authService.updateUser(editingUser.id, payload);
                showToast('User updated successfully', 'success');
            } else if (showModal === 'add') {
                const err = validatePassword(form.password);
                if (err) { setPasswordError(err); return; }
                await authService.createUser({
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: form.email,
                    password: form.password,
                    role: form.role,
                    phone: form.phone,
                    address: form.address,
                    gender: form.gender,
                    maritalStatus: form.maritalStatus,
                    nationalId: form.nationalId,
                    educationLevel: form.educationLevel,
                    medicalInsurance: form.medicalInsurance,
                    contractUrl: form.contractUrl,
                    bankAccount: form.bankAccount,
                    employmentStatus: form.employmentStatus,
                    employmentCategory: form.employmentCategory,
                    workShift: form.workShift,
                    basicSalary: form.basicSalary ? parseFloat(form.basicSalary) : 0,
                });
                showToast('User registered successfully', 'success');
            }
            setShowModal(null);
            setEditingUser(null);
            setForm(emptyForm);
            fetchUsers();
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || 'Operation failed';
            showToast(msg, 'error');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await authService.deleteUser(id);
            showToast('User deleted successfully', 'success');
            setConfirmDelete(null);
            fetchUsers();
        } catch (e: any) {
            showToast(e?.response?.data?.message || 'Failed to delete user', 'error');
        }
    };

    const handleContractUpload = async () => {
        if (!contractFile || !contractModalUser) return;
        setContractUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', contractFile);
            const res = await api.post('/upload/contract-document', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            const contractUrl = res.data.url || res.data.secureUrl;
            await authService.updateUser(contractModalUser.id, { contractUrl });
            showToast('Contract uploaded successfully', 'success');
            setContractModalUser(null);
            setContractFile(null);
            fetchUsers();
        } catch (e: any) {
            showToast(e?.response?.data?.message || 'Failed to upload contract', 'error');
        } finally {
            setContractUploading(false);
        }
    };

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, flexShrink: 0 }}>
                    <FaUserPlus style={{ color: 'var(--primary)' }} /> User Registration
                </h2>
                <button className="admin-btn" onClick={openAdd} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.6rem 1.5rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FaPlus /> Register New User
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <StatTile icon={<FaUsers />} label="Total Users" value={String(users.length)} accent="#1B2042" emphasis />
                <StatTile icon={<FaCheckCircle />} label="Active" value={String(users.filter(u => u.isActive).length)} accent="#22c55e" />
                <StatTile icon={<FaTimesCircle />} label="Inactive" value={String(users.filter(u => !u.isActive).length)} accent="#6b7280" />
                <StatTile icon={<FaShieldAlt />} label="Employees" value={String(users.filter(u => u.role === 'employee').length)} accent="#3b82f6" />
                <StatTile icon={<FaUserTie />} label="Engineers" value={String(users.filter(u => u.role === 'site_engineer' || u.role === 'engineering_studio').length)} accent="#8b5cf6" />
            </div>

            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Registered Users</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative' }}>
                            <FaSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }} />
                            <input type="text" className="form-input" placeholder="Search by name, email, phone..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ padding: '0.3rem 0.5rem 0.3rem 1.8rem', fontSize: '0.8rem', width: 260 }} />
                        </div>
                        <select className="form-select" value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 160 }}>
                            <option value="">All Roles</option>
                            {ROLES_LIST.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                        </select>
                        <select className="form-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value as any); setPage(1); }} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 120 }}>
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Role</th>
                                <th>Employment Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.map((u, i) => {
                                const expanded = expandedRow === u.id;
                                return (
                                    <Fragment key={u.id}>
                                        <tr>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{(page - 1) * pageSize + i + 1}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                                        {u.profile?.avatar
                                                            ? <img src={u.profile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            : <FaUser size={12} style={{ color: 'var(--text-muted)' }} />}
                                                    </div>
                                                    <span style={{ fontWeight: 600 }}>{u.firstName || u.profile?.firstName || ''} {u.lastName || u.profile?.lastName || ''}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '0.85rem' }}>{u.email}</td>
                                            <td style={{ fontSize: '0.85rem' }}>{u.phone || u.profile?.phone || '—'}</td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600,
                                                    color: '#fff', background: roleColors[u.role] || '#6b7280',
                                                }}>{u.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                            </td>
                                            <td>
                                                {u.employmentStatus
                                                    ? <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600, color: '#fff', background: u.employmentStatus === 'employed' ? '#22c55e' : '#6b7280' }}>{u.employmentStatus.charAt(0).toUpperCase() + u.employmentStatus.slice(1)}</span>
                                                    : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} title="View details" onClick={() => setViewUser(u)}><FaEye /></button>
                                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} title="Edit" onClick={() => openEdit(u)}><FaEdit /></button>
                                                    {confirmDelete === u.id ? (
                                                        <div style={{ display: 'flex', gap: 2 }}>
                                                            <button className="admin-btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: '#ef4444', borderColor: '#ef4444', color: '#fff' }} onClick={() => handleDelete(u.id)}>Yes</button>
                                                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={() => setConfirmDelete(null)}>No</button>
                                                        </div>
                                                    ) : (
                                                        <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--primary-red)' }} title="Delete" onClick={() => setConfirmDelete(u.id)}><FaTrash /></button>
                                                    )}
                                                    <button
                                                        className="admin-btn admin-btn--secondary"
                                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: expanded ? 'var(--primary)' : 'var(--text-muted)' }}
                                                        title={expanded ? 'Show less' : 'Show more details'}
                                                        onClick={() => toggleRow(u.id)}
                                                    >{expanded ? <FaChevronUp /> : <FaChevronDown />}</button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expanded && (
                                            <tr>
                                                <td colSpan={7} style={{ padding: 0 }}>
                                                    <div style={{ background: 'var(--bg-body)', borderRadius: 6, margin: '4px 8px 8px', padding: '1rem 1.2rem', fontSize: '0.85rem' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem 1.5rem' }}>
                                                            <InfoItem label="Gender" value={u.gender} />
                                                            <InfoItem label="National ID" value={u.nationalId} mono />
                                                            <InfoItem label="Education" value={u.educationLevel} />
                                                            <InfoItem label="Medical Insurance" value={u.medicalInsurance} />
                                                            <InfoItem label="Bank Account" value={u.bankAccount} mono />
                                                            <InfoItem label="Address" value={u.address} />
                                                            <InfoItem label="Employment Category" value={u.employmentCategory} />
                                                            <InfoItem label="Basic Salary" value={u.basicSalary ? `RWF ${Number(u.basicSalary).toLocaleString('en-RW')}` : undefined} />
                                                            <InfoItem label="Net Salary" value={u.basicSalary ? `RWF ${(Number(u.basicSalary) - insuranceDeduction).toLocaleString('en-RW')}` : undefined} />
                                                            <div>
                                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: 2 }}>Employment Status</div>
                                                                {u.employmentStatus
                                                                    ? <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600, color: '#fff', background: u.employmentStatus === 'employed' ? '#22c55e' : u.employmentStatus === 'contract' ? '#f59e0b' : '#6b7280' }}>{u.employmentStatus.charAt(0).toUpperCase() + u.employmentStatus.slice(1)}</span>
                                                                    : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                                            </div>
                                                            <div>
                                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: 2 }}>Work Shift</div>
                                                                {u.workShift
                                                                    ? <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600, color: '#fff', background: u.workShift === 'day' ? '#3b82f6' : '#8b5cf6' }}>{u.workShift === 'day' ? 'Day Worker' : 'Night Worker'}</span>
                                                                    : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                                            </div>
                                                            <div>
                                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: 2 }}>Active</div>
                                                                {u.isActive ? <FaCheck style={{ color: '#22c55e' }} /> : <FaTimesIcon style={{ color: '#ef4444' }} />}
                                                            </div>
                                                            <div>
                                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: 2 }}>Joined</div>
                                                                <span style={{ fontWeight: 500 }}>{new Date(u.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                            <div>
                                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: 2 }}>Contract</div>
                                                                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} title="Upload contract" onClick={() => { setContractModalUser(u); setContractFile(null); }}><FaUpload /></button>
                                                                    {u.contractUrl && (
                                                                        <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: '#ef4444' }} title="View contract" onClick={() => setPdfViewerUrl(u.contractUrl!)}><FaFilePdf /></button>
                                                                    )}
                                                                    {!u.contractUrl && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No file</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                            {paginatedUsers.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <FaUsers size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                                        <div>No users found.</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0.5rem 0', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Showing {pageSize === 0 ? filteredUsers.length : Math.min(pageSize, filteredUsers.length - (page - 1) * pageSize)} of {filteredUsers.length}
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

            {(showModal === 'add' || showModal === 'edit') && (
                <div className="admin-modal-overlay" onClick={() => setShowModal(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640, left: modalPos?.x ?? '50%', top: modalPos?.y ?? '50%', transform: modalPos ? 'none' : 'translate(-50%, -50%)' }}>
                        <div className="admin-modal-header" onMouseDown={onHeaderMouseDown}>
                            <h3><FaArrowsAlt style={{ fontSize: '0.75rem', marginRight: 8, opacity: 0.5 }} />{showModal === 'add' ? 'Register New User' : 'Edit User Information'}</h3>
                            <button onClick={() => setShowModal(null)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaUser size={11} /> First Name *</label>
                                    <input className="form-input" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} placeholder="Enter first name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaUser size={11} /> Last Name *</label>
                                    <input className="form-input" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Enter last name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaEnvelope size={11} /> Email *</label>
                                    <input type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="user@example.com" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaPhone size={11} /> Phone</label>
                                    <input type="tel" className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+250 788 000 000" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaVenusMars size={11} /> Gender</label>
                                    <select className="form-select" value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                                        <option value="">Select gender</option>
                                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaRing size={11} /> Marital Status</label>
                                    <select className="form-select" value={form.maritalStatus} onChange={e => setForm(p => ({ ...p, maritalStatus: e.target.value }))}>
                                        <option value="">Select status</option>
                                        {MARITAL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaIdCard size={11} /> National ID</label>
                                    <input className="form-input" value={form.nationalId} onChange={e => setForm(p => ({ ...p, nationalId: e.target.value }))} placeholder="National ID number" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaGraduationCap size={11} /> Education Level</label>
                                    <select className="form-select" value={form.educationLevel} onChange={e => setForm(p => ({ ...p, educationLevel: e.target.value }))}>
                                        <option value="">Select education level</option>
                                        {EDUCATION_LEVELS.map(el => <option key={el} value={el}>{el}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaShieldAlt size={11} /> Medical Insurance</label>
                                    <select className="form-select" value={form.medicalInsurance} onChange={e => setForm(p => ({ ...p, medicalInsurance: e.target.value }))}>
                                        <option value="">Select insurance</option>
                                        {MEDICAL_INSURANCES.map(mi => <option key={mi} value={mi}>{mi}</option>)}
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaUniversity size={11} /> Bank Account</label>
                                    <input className="form-input" value={form.bankAccount} onChange={e => setForm(p => ({ ...p, bankAccount: e.target.value }))} placeholder="e.g. BK:00986883, Equity:08788888" />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaHome size={11} /> Address</label>
                                    <input className="form-input" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Physical address" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaShieldAlt size={11} /> Role *</label>
                                    <select className="form-select" value={form.role} onChange={e => {
                                        const newRole = e.target.value;
                                        const isEmployer = EMPLOYER_ROLES.includes(newRole);
                                        setForm(p => ({ ...p, role: newRole, employmentStatus: isEmployer ? 'employed' : '' }));
                                    }}>
                                        {ROLES_LIST.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaBriefcase size={11} /> Employment Status</label>
                                    <select className="form-select" value={form.employmentStatus} onChange={e => setForm(p => ({ ...p, employmentStatus: e.target.value }))}>
                                        <option value="">None</option>
                                        <option value="employed">Employed</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaBriefcase size={11} /> Employment Category</label>
                                    <select className="form-select" value={form.employmentCategory} onChange={e => setForm(p => ({ ...p, employmentCategory: e.target.value }))}>
                                        <option value="">None</option>
                                        {EMPLOYMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaBriefcase size={11} /> Work Shift</label>
                                    <select className="form-select" value={form.workShift} onChange={e => setForm(p => ({ ...p, workShift: e.target.value }))}>
                                        <option value="">None</option>
                                        {WORK_SHIFTS.map(s => <option key={s} value={s}>{s === 'day' ? 'Day Worker' : 'Night Worker'}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaMoneyBillWave size={11} /> Basic Salary (RWF)</label>
                                    <input type="number" className="form-input" value={form.basicSalary} onChange={e => setForm(p => ({ ...p, basicSalary: e.target.value }))} placeholder="e.g. 150000" min="0" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaMoneyBillWave size={11} /> Net Salary (RWF)</label>
                                    <div style={{
                                        padding: '0.6rem 0.75rem', background: 'var(--bg-body)', borderRadius: 6, border: '1px solid var(--border-color)',
                                        fontSize: '0.95rem', fontWeight: 600,
                                        color: (form.basicSalary ? parseFloat(form.basicSalary) - insuranceDeduction : 0) < 0 ? '#ef4444' : '#22c55e',
                                    }}>
                                        {(form.basicSalary ? parseFloat(form.basicSalary) - insuranceDeduction : 0).toLocaleString('en-RW')} RWF
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Auto-calculated: Basic − Insurance ({insuranceDeduction.toLocaleString('en-RW')} RWF)</span>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{showModal === 'edit' ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={showPassword ? 'text' : 'password'} className="form-input" style={{ paddingRight: '2.2rem' }} value={form.password} onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setPasswordError(''); }} placeholder="Min 8 chars, 1 capital, 1 small, 1 special" />
                                        <span onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </span>
                                    </div>
                                    {form.password && <PasswordStrengthBar password={form.password} />}
                                    {passwordError && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>{passwordError}</span>}
                                    {showModal === 'add' && !passwordError && <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: 4, display: 'block' }}>Min 8 chars, 1 uppercase, 1 lowercase, 1 special</span>}
                                </div>
                                {showModal === 'edit' && (
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} style={{ width: 16, height: 16 }} />
                                            Active Account
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setShowModal(null)}>Cancel</button>
                            <button className="admin-btn" onClick={handleSave}>{showModal === 'add' ? 'Register' : 'Update'}</button>
                        </div>
                    </div>
                </div>
            )}

            {viewUser && (
                <div className="admin-modal-overlay" onClick={() => setViewUser(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 580, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                        <div className="admin-modal-header">
                            <h3><FaUser style={{ marginRight: 8 }} /> {viewUser.firstName || viewUser.profile?.firstName || ''} {viewUser.lastName || viewUser.profile?.lastName || ''}</h3>
                            <button onClick={() => setViewUser(null)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                    {viewUser.profile?.avatar
                                        ? <img src={viewUser.profile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <FaUser size={22} style={{ color: 'var(--text-muted)' }} />}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{viewUser.firstName || viewUser.profile?.firstName || ''} {viewUser.lastName || viewUser.profile?.lastName || ''}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{viewUser.email}</div>
                                    <div style={{ marginTop: 4 }}>
                                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600, color: '#fff', background: roleColors[viewUser.role] || '#6b7280' }}>{viewUser.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem 1.5rem' }}>
                                <InfoItem label="Phone" value={viewUser.phone || viewUser.profile?.phone} />
                                <InfoItem label="Gender" value={viewUser.gender} />
                                <InfoItem label="Marital Status" value={viewUser.maritalStatus} />
                                <InfoItem label="National ID" value={viewUser.nationalId} mono />
                                <InfoItem label="Education Level" value={viewUser.educationLevel} />
                                <InfoItem label="Medical Insurance" value={viewUser.medicalInsurance} />
                                <InfoItem label="Bank Account" value={viewUser.bankAccount} mono />
                                <InfoItem label="Address" value={viewUser.address} />
                                <InfoItem label="Basic Salary" value={viewUser.basicSalary ? `RWF ${Number(viewUser.basicSalary).toLocaleString('en-RW')}` : undefined} />
                                <InfoItem label="Net Salary" value={viewUser.basicSalary ? `RWF ${(Number(viewUser.basicSalary) - insuranceDeduction).toLocaleString('en-RW')}` : undefined} />
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: 2 }}>Employment Status</div>
                                    {viewUser.employmentStatus
                                        ? <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600, color: '#fff', background: viewUser.employmentStatus === 'employed' ? '#22c55e' : viewUser.employmentStatus === 'contract' ? '#f59e0b' : '#6b7280' }}>{viewUser.employmentStatus.charAt(0).toUpperCase() + viewUser.employmentStatus.slice(1)}</span>
                                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                </div>
                                <InfoItem label="Employment Category" value={viewUser.employmentCategory} />
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: 2 }}>Work Shift</div>
                                    {viewUser.workShift
                                        ? <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600, color: '#fff', background: viewUser.workShift === 'day' ? '#3b82f6' : '#8b5cf6' }}>{viewUser.workShift === 'day' ? 'Day Worker' : 'Night Worker'}</span>
                                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: 2 }}>Status</div>
                                    {viewUser.isActive ? <FaCheck style={{ color: '#22c55e' }} /> : <FaTimesIcon style={{ color: '#ef4444' }} />}
                                </div>
                                <InfoItem label="Joined" value={new Date(viewUser.createdAt).toLocaleDateString()} />
                            </div>
                            {viewUser.contractUrl && (
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: 6 }}>Contract Document</div>
                                    <button className="admin-btn admin-btn--secondary" style={{ fontSize: '0.8rem' }} onClick={() => { setPdfViewerUrl(viewUser.contractUrl!); setViewUser(null); }}><FaFilePdf style={{ marginRight: 4 }} /> View Contract PDF</button>
                                </div>
                            )}
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setViewUser(null)}>Close</button>
                            <button className="admin-btn" onClick={() => { setViewUser(null); openEdit(viewUser); }}>Edit User</button>
                        </div>
                    </div>
                </div>
            )}

            {contractModalUser && (
                <div className="admin-modal-overlay" onClick={() => setContractModalUser(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                        <div className="admin-modal-header">
                            <h3><FaFilePdf style={{ marginRight: 8 }} /> Upload Contract — {contractModalUser.firstName} {contractModalUser.lastName}</h3>
                            <button onClick={() => setContractModalUser(null)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            {contractModalUser.contractUrl && (
                                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-body)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Current contract on file</span>
                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }} onClick={() => setPdfViewerUrl(contractModalUser.contractUrl!)}><FaExternalLinkAlt style={{ marginRight: 4 }} /> View</button>
                                </div>
                            )}
                            <div style={{ border: '2px dashed var(--border-color)', borderRadius: 8, padding: '2rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => contractInputRef.current?.click()}>
                                <FaUpload size={28} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{contractFile ? contractFile.name : 'Click to select PDF file'}</div>
                                <input ref={contractInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setContractFile(e.target.files?.[0] || null)} />
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setContractModalUser(null)}>Cancel</button>
                            <button className="admin-btn" onClick={handleContractUpload} disabled={!contractFile || contractUploading}>{contractUploading ? 'Uploading...' : 'Upload Contract'}</button>
                        </div>
                    </div>
                </div>
            )}

            {pdfViewerUrl && (
                <div className="admin-modal-overlay" onClick={() => setPdfViewerUrl(null)} style={{ zIndex: 9999 }}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 900, width: '95vw', height: '85vh', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column' }}>
                        <div className="admin-modal-header">
                            <h3><FaFilePdf style={{ marginRight: 8 }} /> Contract Document</h3>
                            <button onClick={() => setPdfViewerUrl(null)}><FaTimesIcon /></button>
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <iframe src={pdfViewerUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Contract PDF" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Registration;
