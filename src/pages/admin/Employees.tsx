import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    FaUsers, FaDollarSign, FaFileExcel, FaFilePdf, FaChevronLeft, FaChevronRight, FaEye,
    FaTimes as FaTimesIcon, FaSpinner, FaExclamationTriangle, FaUserTie, FaIdCard, FaHeartbeat,
    FaGraduationCap, FaFileAlt, FaBriefcase, FaClock, FaCheckCircle, FaTimesCircle, FaBan,
} from 'react-icons/fa';
import { hrService, type EmployedUser } from '../../services/hrService';
import { loadPageCache, savePageCache } from '../../utils/pageCache';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const ROLE_DISPLAY: Record<string, string> = {
    admin: 'Admin', managing_director: 'Managing Director', finance_director: 'Finance Director',
    site_engineer: 'Site Engineer', storekeeper: 'Storekeeper', partner: 'Partner',
    client: 'Client', engineering_studio: 'Engineering Studio',
};

const PAGE_SIZES = [5, 10, 15, 20];

const Employees = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const role = user?.role || '';

    const [data, setData] = useState<EmployedUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewItem, setViewItem] = useState<EmployedUser | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const fetch = async () => {
        const cached = loadPageCache<EmployedUser[]>('pg_employees_employed');
        if (cached) { setData(cached); }
        try {
            const res = await hrService.getEmployedUsers();
            setData(res.data || []);
            savePageCache('pg_employees_employed', res.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(); }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return data.filter(d => {
            if (q && !(d.firstName + ' ' + d.lastName).toLowerCase().includes(q) && !d.email.toLowerCase().includes(q) && !(d.employmentCategory || '').toLowerCase().includes(q) && !(d.role || '').toLowerCase().includes(q)) return false;
            return true;
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

    const tableData = useMemo(() => filtered.map((d, i) => [
        String(i + 1),
        `${d.firstName} ${d.lastName}`,
        d.email,
        ROLE_DISPLAY[d.role] || d.role,
        d.employmentCategory || '—',
        `RWF ${(d.basicSalary || 0).toLocaleString()}`,
    ]), [filtered]);

    const downloadPDF = () => {
        const doc = new jsPDF();
        const brown = '#1B2042';
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();

        doc.setFontSize(22);
        doc.setTextColor(brown);
        doc.setFont('helvetica', 'bold');
        doc.text('MUHIZI CONSTRUCTION', pageW / 2, 22, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Building Your Vision, Delivering Excellence', pageW / 2, 30, { align: 'center' });

        doc.setDrawColor(brown);
        doc.setLineWidth(0.8);
        doc.line(14, 34, pageW - 14, 34);

        doc.setFontSize(13);
        doc.setTextColor(brown);
        doc.setFont('helvetica', 'bold');
        const titleY = 40;
        doc.text('Internal Administration — Employed Staff', 14, titleY);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#666');
        const today = new Date().toLocaleDateString();
        doc.text(`Generated: ${today}`, pageW - 14, titleY, { align: 'right' });

        autoTable(doc, {
            head: [['#', 'Name', 'Email', 'Role', 'Category', 'Salary']],
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

        doc.save('employed-staff.pdf');
    };

    const downloadExcel = () => {
        const brown = '#1B2042';
        const today = new Date().toLocaleDateString();
        const headers = ['#', 'Name', 'Email', 'Role', 'Category', 'Salary'];
        const rows = tableData.map(r => `<tr>${r.map(c => `<td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${c}</td>`).join('')}</tr>`).join('');

        const html = `
            <html><head><meta charset="UTF-8"></head><body>
            <div style="text-align:center;color:${brown};font-size:20px;font-weight:bold;font-family:Arial">MUHIZI CONSTRUCTION</div>
            <div style="text-align:center;color:${brown};font-size:11px;font-family:Arial;margin-bottom:4px">Building Your Vision, Delivering Excellence</div>
            <hr style="border:1px solid ${brown}" />
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;color:${brown};font-family:Arial;margin:6px 0">
                <span>Internal Administration — Employed Staff</span>
                <span>${today}</span>
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
        a.href = url; a.download = 'employed-staff.xls'; a.click();
        URL.revokeObjectURL(url);
    };

    const stats = useMemo(() => ({
        total: data.length,
        byRole: data.reduce((acc, d) => { acc[d.role] = (acc[d.role] || 0) + 1; return acc; }, {} as Record<string, number>),
        totalSalary: data.reduce((s, d) => s + (d.basicSalary || 0), 0),
    }), [data]);

    const statusColors: Record<string, string> = {
        employed: '#22c55e', active: '#22c55e', inactive: '#f59e0b', terminated: '#ef4444',
    };

    return (
        <div className="admin-page" style={{ maxWidth: 1100, width: '100%' }}>
            <div style={{ marginBottom: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, flexShrink: 0, fontSize: '1.1rem' }}>
                    <FaUsers style={{ color: 'var(--primary)' }} /> Internal Administration — Employed Staff
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem', marginBottom: '1.25rem' }}>
                    <StatTile icon={<FaUsers />} label="Total Employed" value={String(stats.total)} accent="#1B2042" emphasis />
                    {Object.entries(stats.byRole).slice(0, 3).map(([r, count]) => (
                        <StatTile key={r} icon={<FaUserTie />} label={ROLE_DISPLAY[r] || r} value={String(count)} accent="#8b5e34" />
                    ))}
                    <StatTile icon={<FaDollarSign />} label="Total Salary" value={`RWF ${stats.totalSalary.toLocaleString()}`} accent="#f59e0b" />
                </div>
            </div>

            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Employed Users</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input type="text" className="form-input" placeholder="Search name, email, role..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 180, maxWidth: '100%' }} />
                        <button className="admin-btn" onClick={downloadExcel} title="Download as Excel" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.5rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, opacity: 1 }}>
                            <FaFileExcel /> Excel
                        </button>
                        <button className="admin-btn" onClick={downloadPDF} title="Download as PDF" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.5rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, opacity: 1 }}>
                            <FaFilePdf /> PDF
                        </button>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th><th>Email</th><th>Role</th><th>Category</th><th>Salary</th><th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(item => {
                                const initials = `${item.firstName?.[0] || ''}${item.lastName?.[0] || ''}`.toUpperCase();
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {item.profile?.avatar ? (
                                                    <img src={item.profile.avatar} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                                ) : (
                                                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>
                                                        {initials}
                                                    </div>
                                                )}
                                                <strong style={{ cursor: 'pointer' }} onClick={() => setViewItem(item)}
                                                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.textDecoration = 'underline'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.textDecoration = 'none'; }}>
                                                    {item.firstName} {item.lastName}
                                                </strong>
                                            </div>
                                        </td>
                                        <td>{item.email}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{ROLE_DISPLAY[item.role] || item.role}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{item.employmentCategory || '—'}</td>
                                        <td>RWF {(item.basicSalary || 0).toLocaleString()}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setViewItem(item)} title="View profile"><FaEye /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {data.length === 0 && (
                                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <FaUsers size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                                    <div>No employed users found.</div>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0.5rem 0', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Showing {pageSize === 0 ? filtered.length : Math.min(pageSize, filtered.length - (page - 1) * pageSize)} of {filtered.length}
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

            {viewItem && (() => {
                const initials = `${viewItem.firstName?.[0] || ''}${viewItem.lastName?.[0] || ''}`.toUpperCase();
                const field = (label: string, value: React.ReactNode, locked?: boolean) => (
                    <div>
                        <div style={{ fontSize: '0.65rem', color: '#999', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {label} {locked && <FaIdCard size={8} title="Identity field" />}
                        </div>
                        <div style={{ fontSize: '0.85rem' }}>{value || '—'}</div>
                    </div>
                );
                return (
                    <div className="admin-modal-overlay" onClick={() => setViewItem(null)}>
                        <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: 640, maxHeight: '85vh', overflowY: 'auto', borderRadius: 12 }}>
                            <div className="admin-modal-header" style={{ padding: '1rem 1.25rem' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.05rem' }}>
                                    <FaUsers style={{ color: 'var(--primary)' }} /> Employee Profile
                                </h3>
                                <button onClick={() => setViewItem(null)}><FaTimesIcon /></button>
                            </div>
                            <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    {viewItem.profile?.avatar ? (
                                        <img src={viewItem.profile.avatar} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-color)' }} />
                                    ) : (
                                        <div style={{
                                            width: 52, height: 52, borderRadius: '50%', background: 'var(--primary)', color: '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', fontWeight: 700, flexShrink: 0,
                                        }}>{initials || <FaUsers />}</div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>{viewItem.firstName} {viewItem.lastName}</div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                            {ROLE_DISPLAY[viewItem.role] || viewItem.role}{viewItem.employmentCategory ? ` · ${viewItem.employmentCategory}` : ''}
                                        </div>
                                    </div>
                                    <span style={{
                                        display: 'inline-block', padding: '3px 12px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
                                        color: '#fff', background: '#22c55e', textTransform: 'capitalize',
                                    }}>employed</span>
                                </div>

                                <div style={{ background: '#1B204210', borderRadius: 10, padding: '0.85rem 1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <FaDollarSign size={12} /> Basic Salary
                                    </span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>RWF {(viewItem.basicSalary || 0).toLocaleString()}</span>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <FaIdCard size={11} /> Personal Information
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', background: '#f9f9f9', borderRadius: 8, padding: '0.75rem 0.9rem' }}>
                                        {field('Email', viewItem.email, true)}
                                        {field('Phone', viewItem.phone)}
                                        {field('National ID', viewItem.nationalId, !!viewItem.nationalId)}
                                        {field('Address', viewItem.address)}
                                        {field('Gender', viewItem.gender && <span style={{ textTransform: 'capitalize' }}>{viewItem.gender}</span>)}
                                        {field('Marital Status', viewItem.maritalStatus && <span style={{ textTransform: 'capitalize' }}>{viewItem.maritalStatus}</span>)}
                                        {field('Education', viewItem.educationLevel)}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <FaBriefcase size={11} /> Employment Details
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', background: '#f9f9f9', borderRadius: 8, padding: '0.75rem 0.9rem' }}>
                                        {field('Role', ROLE_DISPLAY[viewItem.role] || viewItem.role)}
                                        {field('Category', viewItem.employmentCategory && <span style={{ textTransform: 'capitalize' }}>{viewItem.employmentCategory}</span>)}
                                        {field('Work Shift', viewItem.workShift && <span style={{ textTransform: 'capitalize' }}>{viewItem.workShift}</span>)}
                                        {field('Status', <span style={{ textTransform: 'capitalize' }}>{viewItem.employmentStatus}</span>)}
                                        {field('Registered', viewItem.createdAt && new Date(viewItem.createdAt).toLocaleDateString())}
                                    </div>
                                </div>
                            </div>
                            <div className="admin-modal-footer">
                                <button className="admin-btn admin-btn--secondary" onClick={() => setViewItem(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default Employees;
