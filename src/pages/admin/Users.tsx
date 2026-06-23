import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FaUsers, FaEnvelope, FaUser, FaCalendarAlt, FaCheck, FaTimes, FaPlus, FaTimes as FaTimesIcon, FaShieldAlt, FaChevronLeft, FaChevronRight, FaEye, FaEyeSlash, FaEdit, FaTrash, FaArrowsAlt, FaDownload, FaFileExcel, FaFilePdf } from 'react-icons/fa';
import { authService } from '../../services/authService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface UserData {
    id: string;
    email: string;
    username: string;
    role: string;
    isActive: boolean;
    profile?: { firstName?: string; lastName?: string; avatar?: string; phone?: string };
    createdAt: string;
    updatedAt?: string;
}

const ROLES = ['admin', 'site_manager', 'manager', 'employee', 'client'];
const PAGE_SIZES = [5, 10, 15, 20];

const Users = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState<'add' | 'edit' | 'view' | null>(null);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', username: '', password: '', role: 'employee', isActive: true, phone: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [modalPos, setModalPos] = useState<{ x: number; y: number } | null>(null);
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const dragging = useRef<{ offsetX: number; offsetY: number } | null>(null);

    const filteredUsers = useMemo(() => {
        const q = search.toLowerCase().trim();
        return users.filter(u => {
            if (q) {
                const name = `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.toLowerCase();
                const email = u.email.toLowerCase();
                const username = u.username.toLowerCase();
                if (!name.includes(q) && !email.includes(q) && !username.includes(q)) return false;
            }
            if (fromDate && new Date(u.createdAt) < new Date(fromDate)) return false;
            if (toDate) {
                const end = new Date(toDate);
                end.setHours(23, 59, 59, 999);
                if (new Date(u.createdAt) > end) return false;
            }
            return true;
        });
    }, [users, search, fromDate, toDate]);

    const canDownload = (fromDate && toDate) || search.trim().length > 0;

    const validatePassword = (pw: string): string => {
        if (pw.length < 8) return 'Minimum 8 characters';
        if (!/[A-Z]/.test(pw)) return 'At least one capital letter';
        if (!/[a-z]/.test(pw)) return 'At least one lowercase letter';
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) return 'At least one special character';
        return '';
    };

    const tableData = useMemo(() => filteredUsers.map((u, i) => [
        String(i + 1),
        u.profile?.firstName || '', u.profile?.lastName || '',
        u.email, u.profile?.phone || '', u.username, u.role, u.isActive ? 'Active' : 'Inactive',
        new Date(u.createdAt).toLocaleDateString(),
    ]), [filteredUsers]);

    const downloadPDF = () => {
        const doc = new jsPDF();
        const brown = '#1B2042';
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(brown);
        doc.setFont('helvetica', 'bold');
        doc.text('MUHIZI CONSTRUCTION', pageW / 2, 22, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Building Your Vision, Delivering Excellence', pageW / 2, 30, { align: 'center' });

        // Divider
        doc.setDrawColor(brown);
        doc.setLineWidth(0.8);
        doc.line(14, 34, pageW - 14, 34);

        // Title & date
        doc.setFontSize(13);
        doc.setTextColor(brown);
        doc.setFont('helvetica', 'bold');
        const titleY = 40;
        doc.text('Users Report', 14, titleY);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#666');
        const today = new Date().toLocaleDateString();
        doc.text(`Generated: ${today}${fromDate && toDate ? ` | Period: ${fromDate} to ${toDate}` : ''}`, pageW - 14, titleY, { align: 'right' });

        // Table
        autoTable(doc, {
            head: [['#', 'First Name', 'Last Name', 'Email', 'Phone', 'Username', 'Role', 'Status', 'Joined']],
            body: tableData,
            startY: 46,
            styles: { fontSize: 8, textColor: '#333' },
            headStyles: { fillColor: [139, 69, 19], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [250, 245, 240] },
            columnStyles: { 0: { cellWidth: 10, halign: 'center' } },
            didDrawPage: (data: any) => {
                doc.setDrawColor(brown);
                doc.setLineWidth(0.5);
                doc.line(14, pageH - 20, pageW - 14, pageH - 20);
                doc.setFontSize(8);
                doc.setTextColor(brown);
                doc.setFont('helvetica', 'normal');
                doc.text('Email: info@muhiziconstruction.com  |  Phone: +250 788 000 000  |  Location: Kigali, Rwanda', pageW / 2, pageH - 14, { align: 'center' });
            },
        });

        doc.save('users.pdf');
    };

    const downloadExcel = () => {
        const brown = '#1B2042';
        const today = new Date().toLocaleDateString();
        const period = fromDate && toDate ? `Period: ${fromDate} to ${toDate}` : '';
        const headers = ['#', 'First Name', 'Last Name', 'Email', 'Phone', 'Username', 'Role', 'Status', 'Joined'];
        const rows = tableData.map(r => `<tr>${r.map(c => `<td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${c}</td>`).join('')}</tr>`).join('');

        const html = `
            <html><head><meta charset="UTF-8"></head><body>
            <div style="text-align:center;color:${brown};font-size:20px;font-weight:bold;font-family:Arial">MUHIZI CONSTRUCTION</div>
            <div style="text-align:center;color:${brown};font-size:11px;font-family:Arial;margin-bottom:4px">Building Your Vision, Delivering Excellence</div>
            <hr style="border:1px solid ${brown}" />
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;color:${brown};font-family:Arial;margin:6px 0">
                <span>Users Report</span>
                <span>${today}${period ? ' | ' + period : ''}</span>
            </div>
            <table style="border-collapse:collapse;width:100%;font-family:Arial">
                <tr style="background:${brown};color:#fff">${headers.map(h => `<th style="padding:6px 8px;border:1px solid ${brown};font-size:11px">${h}</th>`).join('')}</tr>
                ${rows}
            </table>
            <hr style="border:0.5px solid ${brown};margin-top:12px" />
            <div style="text-align:center;color:${brown};font-size:10px;font-family:Arial">Email: info@muhiziconstruction.com | Phone: +250 788 000 000 | Location: Kigali, Rwanda</div>
            </body></html>`;

        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'users.xls'; a.click();
        URL.revokeObjectURL(url);
    };

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
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const totalPages = pageSize === 0 ? 1 : Math.ceil(filteredUsers.length / pageSize);
    const paginatedUsers = useMemo(() => {
        if (pageSize === 0) return filteredUsers;
        const start = (page - 1) * pageSize;
        return filteredUsers.slice(start, start + pageSize);
    }, [filteredUsers, page, pageSize]);

    const fetch = async () => {
        try {
            const data = await authService.getAllUsers();
            setUsers(data);
        } catch (e) {
            console.error('Failed to load users', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetch(); }, []);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages || 1);
    }, [totalPages, page]);

    const openAdd = () => {
        setForm({ firstName: '', lastName: '', email: '', username: '', password: '', role: 'employee', isActive: true, phone: '' });
        setSelectedUser(null);
        setPasswordError('');
        setModalPos(null);
        setShowModal('add');
    };

    const openEdit = (u: UserData) => {
        setSelectedUser(u);
        setForm({
            firstName: u.profile?.firstName || '',
            lastName: u.profile?.lastName || '',
            email: u.email,
            username: u.username,
            password: '',
            role: u.role,
            isActive: u.isActive,
            phone: u.profile?.phone || '',
        });
        setPasswordError('');
        setModalPos(null);
        setShowModal('edit');
    };

    const openView = (u: UserData) => {
        setSelectedUser(u);
        setModalPos(null);
        setShowModal('view');
    };

    const handleSave = async () => {
        try {
            if (showModal === 'add') {
                const err = validatePassword(form.password);
                if (err) { setPasswordError(err); return; }
                await authService.register(form);
            } else if (showModal === 'edit' && selectedUser) {
                if (form.password) {
                    const err = validatePassword(form.password);
                    if (err) { setPasswordError(err); return; }
                }
                const payload: any = {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: form.email,
                    username: form.username,
                    role: form.role,
                    isActive: form.isActive,
                    phone: form.phone,
                };
                if (form.password) payload.password = form.password;
                await authService.updateUser(selectedUser.id, payload);
            }
            setShowModal(null);
            fetch();
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || 'Operation failed';
            alert(msg);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this user? This action cannot be undone.')) return;
        try {
            await authService.deleteUser(id);
            fetch();
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Failed to delete user');
        }
    };

    if (loading) return <div className="admin-page"><div className="inline-spinner">Loading users...</div></div>;

    const roleColors: Record<string, string> = {
        admin: '#ef4444', site_manager: '#f59e0b', manager: '#1B2042', employee: '#22c55e', client: '#8b5cf6',
    };

    const modalTitle = showModal === 'add' ? 'Add User' : showModal === 'edit' ? 'Edit User' : 'User Details';

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, flexShrink: 0 }}>
                    <FaUsers style={{ color: 'var(--primary)' }} /> Users
                </h2>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#1B2042', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{users.length}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Total</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#1B2042', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{users.filter(u => u.isActive).length}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Active</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#1B2042', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{users.filter(u => !u.isActive).length}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Inactive</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#1B2042', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{users.filter(u => u.role === 'admin').length}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Admins</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#1B2042', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{users.filter(u => u.role === 'site_manager').length}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Mgrs</div>
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>All Users</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input type="text" className="form-input" placeholder="Search users..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 400 }} />
                        <input type="date" className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 140 }} title="From date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} />
                        <input type="date" className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 140 }} title="To date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} />
                        <button className="admin-btn" onClick={downloadExcel} disabled={!canDownload} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.6rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, opacity: canDownload ? 1 : 0.5 }}>
                            <FaFileExcel /> Excel
                        </button>
                        <button className="admin-btn" onClick={downloadPDF} disabled={!canDownload} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.6rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, opacity: canDownload ? 1 : 0.5 }}>
                            <FaFilePdf /> PDF
                        </button>
                        <button className="admin-btn" onClick={openAdd} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.6rem 1.5rem', fontSize: '0.95rem' }}>
                            <FaPlus style={{ marginRight: 6 }} />Add User
                        </button>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User</th><th>Email</th><th>Phone</th><th>Username</th><th>Active</th><th>Joined</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.map(u => (
                                <tr key={u.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                                {u.profile?.avatar
                                                    ? <img src={u.profile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : <FaUser size={14} style={{ color: 'var(--text-muted)' }} />
                                                }
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700 }}>
                                                    {u.profile?.firstName || ''} {u.profile?.lastName || ''}
                                                </div>
                                                {u.role === 'admin' && (
                                                    <span style={{ fontSize: '0.7rem', background: 'rgba(239,68,68,0.12)', color: '#ef4444', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                                                        <FaShieldAlt size={10} style={{ marginRight: 3 }} />Admin
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <FaEnvelope size={12} style={{ color: 'var(--text-muted)' }} />
                                            {u.email}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.profile?.phone || '—'}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{u.username}</td>
                                    <td>
                                        {u.isActive
                                            ? <FaCheck style={{ color: '#22c55e' }} />
                                            : <FaTimesIcon style={{ color: 'var(--primary-red)' }} />}
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <FaCalendarAlt size={12} />
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }} title="View" onClick={() => openView(u)}><FaEye /></button>
                                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }} title="Edit" onClick={() => openEdit(u)}><FaEdit /></button>
                                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', color: 'var(--primary-red)' }} title="Delete" onClick={() => handleDelete(u.id)}><FaTrash /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
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
                        Showing {pageSize === 0 ? users.length : Math.min(pageSize, users.length - (page - 1) * pageSize)} of {users.length}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Per page:</span>
                            <select
                                className="form-select"
                                style={{ width: 'auto', padding: '0.3rem 1.5rem 0.3rem 0.5rem', fontSize: '0.8rem' }}
                                value={pageSize}
                                onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}
                            >
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
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ left: modalPos?.x ?? '50%', top: modalPos?.y ?? '50%', transform: modalPos ? 'none' : 'translate(-50%, -50%)' }}>
                        <div className="admin-modal-header" onMouseDown={onHeaderMouseDown}>
                            <h3><FaArrowsAlt style={{ fontSize: '0.75rem', marginRight: 8, opacity: 0.5 }} />{modalTitle}</h3>
                            <button onClick={() => setShowModal(null)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">First Name</label>
                                    <input className="form-input" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} placeholder="Enter first name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name</label>
                                    <input className="form-input" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Enter last name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="user@example.com" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Username</label>
                                    <input className="form-input" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="Choose a username" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input type="tel" className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+250 788 000 000" />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">{showModal === 'edit' ? 'New Password (leave blank to keep)' : 'Password'}</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={showPassword ? 'text' : 'password'} className="form-input" style={{ paddingRight: '2.2rem' }} value={form.password} onChange={e => { const v = e.target.value; setForm(p => ({ ...p, password: v })); setPasswordError(''); }} placeholder="Min 8 chars, 1 capital, 1 small, 1 special" />
                                        <span onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </span>
                                    </div>
                                    {form.password && (
                                        <PasswordStrengthBar password={form.password} />
                                    )}
                                    {passwordError && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>{passwordError}</span>}
                                    {showModal === 'add' && !passwordError && <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: 4, display: 'block' }}>Min 8 chars, 1 uppercase, 1 lowercase, 1 special</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <select className="form-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                                        {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                                    </select>
                                </div>
                                {showModal === 'edit' && (
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
                                            Active Account
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setShowModal(null)}>Cancel</button>
                            <button className="admin-btn" onClick={handleSave}>{showModal === 'add' ? 'Create' : 'Update'}</button>
                        </div>
                    </div>
                </div>
            )}

            {showModal === 'view' && selectedUser && (
                <div className="admin-modal-overlay" onClick={() => setShowModal(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, left: modalPos?.x ?? '50%', top: modalPos?.y ?? '50%', transform: modalPos ? 'none' : 'translate(-50%, -50%)' }}>
                        <div className="admin-modal-header" onMouseDown={onHeaderMouseDown}>
                            <h3><FaArrowsAlt style={{ fontSize: '0.75rem', marginRight: 8, opacity: 0.5 }} />User Details</h3>
                            <button onClick={() => setShowModal(null)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', overflow: 'hidden' }}>
                                    {selectedUser.profile?.avatar
                                        ? <img src={selectedUser.profile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <FaUser size={24} style={{ color: 'var(--text-muted)' }} />
                                    }
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                    {selectedUser.profile?.firstName || ''} {selectedUser.profile?.lastName || ''}
                                </div>
                                <span style={{
                                    display: 'inline-block', padding: '2px 12px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600,
                                    color: '#fff', background: roleColors[selectedUser.role] || '#6b7280', marginTop: 4,
                                }}>{selectedUser.role.replace('_', ' ')}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Email</span>
                                    <span style={{ fontWeight: 600 }}>{selectedUser.email}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Phone</span>
                                    <span style={{ fontWeight: 600 }}>{selectedUser.profile?.phone || '—'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Username</span>
                                    <span style={{ fontWeight: 600 }}>{selectedUser.username}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Status</span>
                                    <span style={{ fontWeight: 600, color: selectedUser.isActive ? '#22c55e' : '#ef4444' }}>
                                        {selectedUser.isActive ? 'Active' : 'Inactive'} {selectedUser.isActive ? <FaCheck size={12} style={{ marginLeft: 4 }} /> : <FaTimesIcon size={12} style={{ marginLeft: 4 }} />}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Joined</span>
                                    <span style={{ fontWeight: 600 }}>{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                                </div>
                                {selectedUser.updatedAt && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.9rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Last Updated</span>
                                        <span style={{ fontWeight: 600 }}>{new Date(selectedUser.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn" onClick={() => setShowModal(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;

function PasswordStrengthBar({ password }: { password: string }) {
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
        /\d/.test(password),
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    ];
    const score = checks.filter(Boolean).length;
    const segments = checks.map((ok, i) => ({
        filled: ok,
        color: score <= 1 ? '#ef4444' : score <= 2 ? '#f59e0b' : score <= 3 ? '#eab308' : '#22c55e',
    }));

    return (
        <div style={{ marginTop: 6 }}>
            <div style={{ display: 'flex', gap: 3, marginBottom: 2 }}>
                {segments.map((s, i) => (
                    <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: s.filled ? s.color : 'var(--border-color)',
                        transition: 'background 0.2s',
                    }} />
                ))}
            </div>
            <span style={{ fontSize: '0.7rem', color: segments[0]?.color || 'var(--text-muted)' }}>
                {score === 0 ? 'Very weak' : score <= 1 ? 'Weak' : score <= 2 ? 'Fair' : score <= 3 ? 'Good' : 'Strong'}
            </span>
        </div>
    );
}
