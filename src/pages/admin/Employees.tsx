import { useState, useEffect, useMemo } from 'react';
import {
    FaUsers, FaDollarSign, FaFileExcel, FaFilePdf, FaChevronLeft, FaChevronRight, FaEye,
    FaTimes as FaTimesIcon, FaSpinner, FaUserTie, FaIdCard, FaBriefcase, FaPlus,
    FaHammer, FaClock, FaCheckCircle, FaUser, FaPhone, FaHome, FaCamera,
} from 'react-icons/fa';
import { hrService, type EmployedUser } from '../../services/hrService';
import { authService } from '../../services/authService';
import { loadPageCache, savePageCache } from '../../utils/pageCache';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const StatTile = ({ icon, label, value, accent, emphasis }: { icon: React.ReactNode; label: string; value: string; accent: string; emphasis?: boolean }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0,
        background: emphasis ? `${accent}12` : 'var(--bg-white)',
        border: `1px solid ${emphasis ? `${accent}40` : 'var(--border-color)'}`,
        borderRadius: 8, padding: '0.4rem 0.6rem',
    }}>
        <div style={{
            width: 26, height: 26, borderRadius: 7, background: `${accent}18`, color: accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem',
        }}>{icon}</div>
        <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{label}</div>
            <div style={{ fontSize: emphasis ? '0.9rem' : '0.8rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
        </div>
    </div>
);

const ROLE_DISPLAY: Record<string, string> = {
    admin: 'Admin', managing_director: 'Managing Director', finance_director: 'Finance Director',
    site_engineer: 'Site Engineer', storekeeper: 'Storekeeper', partner: 'Partner',
    client: 'Client', engineering_studio: 'Engineering Studio',
};

const PAGE_SIZES = [5, 10, 15, 20];

const emptyRecruit = {
    firstName: '', lastName: '', phone: '', address: '', nationalId: '', picture: '',
};

const Employees = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const role = user?.role || '';
    const isSiteEngineer = role === 'site_engineer';

    const [data, setData] = useState<EmployedUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewItem, setViewItem] = useState<EmployedUser | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [showRecruitModal, setShowRecruitModal] = useState(false);
    const [recruitForm, setRecruitForm] = useState(emptyRecruit);
    const [recruitLoading, setRecruitLoading] = useState(false);

    const fetch = async () => {
        try {
            let res;
            if (isSiteEngineer && user?.id) {
                res = await hrService.getWageWorkers(user.id);
            } else {
                res = await hrService.getEmployedUsers();
            }
            setData(res.data || []);
            savePageCache(isSiteEngineer ? 'pg_wage_workers' : 'pg_employees_employed', res.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        setLoading(true);
        const cached = loadPageCache<EmployedUser[]>(isSiteEngineer ? 'pg_wage_workers' : 'pg_employees_employed');
        if (cached) setData(cached);
        fetch();
    }, [isSiteEngineer, user?.id]);

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
        isSiteEngineer ? (d.employmentCategory || '—') : (ROLE_DISPLAY[d.role] || d.role),
        isSiteEngineer ? (d.workShift === 'day' ? 'Day' : d.workShift === 'night' ? 'Night' : '—') : (d.employmentCategory || '—'),
        `RWF ${(d.basicSalary || 0).toLocaleString()}`,
    ]), [filtered, isSiteEngineer]);

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
        doc.text(isSiteEngineer ? 'Site Wage Workers' : 'Internal Administration — Employed Staff', 14, titleY);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#666');
        const today = new Date().toLocaleDateString();
        doc.text(`Generated: ${today}`, pageW - 14, titleY, { align: 'right' });

        autoTable(doc, {
            head: [['#', 'Name', 'Email', isSiteEngineer ? 'Trade' : 'Role', isSiteEngineer ? 'Shift' : 'Category', 'Salary']],
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

        doc.save(isSiteEngineer ? 'wage-workers.pdf' : 'employed-staff.pdf');
    };

    const downloadExcel = () => {
        const brown = '#1B2042';
        const today = new Date().toLocaleDateString();
        const headers = ['#', 'Name', 'Email', isSiteEngineer ? 'Trade' : 'Role', isSiteEngineer ? 'Shift' : 'Category', 'Salary'];
        const rows = tableData.map(r => `<tr>${r.map(c => `<td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${c}</td>`).join('')}</tr>`).join('');

        const html = `
            <html><head><meta charset="UTF-8"></head><body>
            <div style="text-align:center;color:${brown};font-size:20px;font-weight:bold;font-family:Arial">MUHIZI CONSTRUCTION</div>
            <div style="text-align:center;color:${brown};font-size:11px;font-family:Arial;margin-bottom:4px">Building Your Vision, Delivering Excellence</div>
            <hr style="border:1px solid ${brown}" />
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;color:${brown};font-family:Arial;margin:6px 0">
                <span>${isSiteEngineer ? 'Site Wage Workers' : 'Internal Administration — Employed Staff'}</span>
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
        a.href = url; a.download = isSiteEngineer ? 'wage-workers.xls' : 'employed-staff.xls'; a.click();
        URL.revokeObjectURL(url);
    };

    const stats = useMemo(() => ({
        total: data.length,
        totalSalary: data.reduce((s, d) => s + (d.basicSalary || 0), 0),
        byCategory: data.reduce((acc, d) => { const cat = d.employmentCategory || 'Other'; acc[cat] = (acc[cat] || 0) + 1; return acc; }, {} as Record<string, number>),
    }), [data]);

    const handleRecruit = async () => {
        if (!recruitForm.firstName.trim() || !recruitForm.lastName.trim()) {
            showToast('First and last name are required', 'error');
            return;
        }
        if (!recruitForm.nationalId.trim()) {
            showToast('National ID is required', 'error');
            return;
        }
        if (!/^\d{16}$/.test(recruitForm.nationalId)) {
            showToast('National ID must be exactly 16 digits', 'error');
            return;
        }
        setRecruitLoading(true);
        try {
            const tempEmail = `wage_${Date.now()}@muhizi.temp`;
            await authService.createUser({
                firstName: recruitForm.firstName,
                lastName: recruitForm.lastName,
                email: tempEmail,
                password: `Wage@${Date.now()}`,
                role: 'storekeeper',
                phone: recruitForm.phone || undefined,
                address: recruitForm.address || undefined,
                nationalId: recruitForm.nationalId || undefined,
                avatar: recruitForm.picture || undefined,
                employmentStatus: 'wage_worker',
                recruitedBy: user?.id,
            });
            showToast('Wage worker recruited successfully', 'success');
            setShowRecruitModal(false);
            setRecruitForm(emptyRecruit);
            fetch();
        } catch (e: any) {
            showToast(e?.response?.data?.message || 'Failed to recruit worker', 'error');
        } finally {
            setRecruitLoading(false);
        }
    };

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', minHeight: '40vh', color: 'var(--text-muted)', fontSize: '0.9rem' }}><FaSpinner className="spin" size={24} style={{ color: 'var(--primary)' }} /> Loading data...</div>;

    const pageTitle = isSiteEngineer ? 'My Team' : 'Internal Administration — Employed Staff';
    const pageIcon = isSiteEngineer ? <FaHammer style={{ color: '#e67e22' }} /> : <FaUsers style={{ color: 'var(--primary)' }} />;

    return (
        <div className="admin-page" style={{ maxWidth: 1100, width: '100%' }}>
            <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, flexShrink: 0, fontSize: '1rem' }}>
                        {pageIcon} {pageTitle}
                    </h2>
                    {isSiteEngineer && (
                        <button className="admin-btn" onClick={() => { setRecruitForm(emptyRecruit); setShowRecruitModal(true); }} style={{ background: '#e67e22', borderColor: '#e67e22', color: '#fff', borderRadius: 4, padding: '0.35rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FaPlus size={11} /> Recruit Worker
                        </button>
                    )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.4rem', marginTop: '0.4rem', marginBottom: '0.6rem' }}>
                    <StatTile icon={isSiteEngineer ? <FaHammer /> : <FaUsers />} label={isSiteEngineer ? 'Total Workers' : 'Total Employed'} value={String(stats.total)} accent={isSiteEngineer ? '#e67e22' : '#1B2042'} emphasis />
                    {isSiteEngineer ? (
                        <>
                            {Object.entries(stats.byCategory).slice(0, 3).map(([cat, count]) => (
                                <StatTile key={cat} icon={<FaBriefcase />} label={cat} value={String(count)} accent="#8b5e34" />
                            ))}
                            <StatTile icon={<FaDollarSign />} label="Total Wages" value={`RWF ${stats.totalSalary.toLocaleString()}`} accent="#f59e0b" />
                        </>
                    ) : (
                        <>
                            <StatTile icon={<FaCheckCircle />} label="Active" value={String(data.filter(d => d.isActive).length)} accent="#22c55e" />
                            <StatTile icon={<FaDollarSign />} label="Total Salary" value={`RWF ${stats.totalSalary.toLocaleString()}`} accent="#f59e0b" />
                        </>
                    )}
                </div>
            </div>

            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isSiteEngineer ? 'Recruited Workers' : 'Employed Users'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <input type="text" className="form-input" placeholder="Search name, email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', width: 160, maxWidth: '100%' }} />
                        <button className="admin-btn" onClick={downloadExcel} title="Download as Excel" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 4, padding: '0.35rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, opacity: 1 }}>
                            <FaFileExcel /> Excel
                        </button>
                        <button className="admin-btn" onClick={downloadPDF} title="Download as PDF" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 4, padding: '0.35rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, opacity: 1 }}>
                            <FaFilePdf /> PDF
                        </button>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th><th>Email</th><th>{isSiteEngineer ? 'Trade' : 'Role'}</th><th>{isSiteEngineer ? 'Shift' : 'Category'}</th><th>Salary</th><th style={{ textAlign: 'center' }}>Actions</th>
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
                                                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: isSiteEngineer ? '#e67e22' : 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>
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
                                        <td style={{ textTransform: 'capitalize' }}>{isSiteEngineer ? (item.employmentCategory || '—') : (ROLE_DISPLAY[item.role] || item.role)}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{isSiteEngineer ? (item.workShift || '—') : (item.employmentCategory || '—')}</td>
                                        <td>RWF {(item.basicSalary || 0).toLocaleString()}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }} onClick={() => setViewItem(item)} title="View profile"><FaEye /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {data.length === 0 && (
                                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <FaUsers size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                                    <div>{isSiteEngineer ? 'No wage workers recruited yet.' : 'No employed users found.'}</div>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '0.35rem 0', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Showing {pageSize === 0 ? filtered.length : Math.min(pageSize, filtered.length - (page - 1) * pageSize)} of {filtered.length}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Per page:</span>
                            <select
                                className="form-select"
                                style={{ width: 'auto', padding: '0.25rem 1.2rem 0.25rem 0.4rem', fontSize: '0.7rem' }}
                                value={pageSize}
                                onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}
                            >
                                {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                <option value={0}>All</option>
                            </select>
                        </div>
                        {pageSize > 0 && totalPages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }} disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><FaChevronLeft /></button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button key={p} className={p === page ? 'admin-btn' : 'admin-btn admin-btn--secondary'} style={{ padding: '0.2rem 0.5rem', minWidth: 26, fontSize: '0.7rem' }} onClick={() => setPage(p)}>{p}</button>
                                ))}
                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }} disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><FaChevronRight /></button>
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
                        <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640, maxHeight: '85vh', overflowY: 'auto', borderRadius: 12 }}>
                            <div className="admin-modal-header" style={{ padding: '1rem 1.25rem' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.05rem' }}>
                                    {isSiteEngineer ? <FaHammer style={{ color: '#e67e22' }} /> : <FaUsers style={{ color: 'var(--primary)' }} />} {isSiteEngineer ? 'Worker Profile' : 'Employee Profile'}
                                </h3>
                                <button onClick={() => setViewItem(null)}><FaTimesIcon /></button>
                            </div>
                            <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    {viewItem.profile?.avatar ? (
                                        <img src={viewItem.profile.avatar} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-color)' }} />
                                    ) : (
                                        <div style={{
                                            width: 52, height: 52, borderRadius: '50%', background: isSiteEngineer ? '#e67e22' : 'var(--primary)', color: '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', fontWeight: 700, flexShrink: 0,
                                        }}>{initials || <FaUsers />}</div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>{viewItem.firstName} {viewItem.lastName}</div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                            {isSiteEngineer ? (viewItem.employmentCategory || 'Wage Worker') : (ROLE_DISPLAY[viewItem.role] || viewItem.role)}{viewItem.employmentCategory ? ` · ${viewItem.employmentCategory}` : ''}
                                        </div>
                                    </div>
                                    <span style={{
                                        display: 'inline-block', padding: '3px 12px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
                                        color: '#fff', background: isSiteEngineer ? '#e67e22' : '#22c55e', textTransform: 'capitalize',
                                    }}>{isSiteEngineer ? 'wage worker' : 'employed'}</span>
                                </div>

                                <div style={{ background: '#1B204210', borderRadius: 10, padding: '0.85rem 1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <FaDollarSign size={12} /> {isSiteEngineer ? 'Daily Wage' : 'Basic Salary'}
                                    </span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: isSiteEngineer ? '#e67e22' : 'var(--primary)' }}>RWF {(viewItem.basicSalary || 0).toLocaleString()}</span>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isSiteEngineer ? '#e67e22' : 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <FaIdCard size={11} /> Personal Information
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', background: '#f9f9f9', borderRadius: 8, padding: '0.75rem 0.9rem' }}>
                                        {field('Phone', viewItem.phone)}
                                        {field('National ID', viewItem.nationalId, !!viewItem.nationalId)}
                                        {field('Address', viewItem.address)}
                                        {field('Gender', viewItem.gender && <span style={{ textTransform: 'capitalize' }}>{viewItem.gender}</span>)}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isSiteEngineer ? '#e67e22' : 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <FaBriefcase size={11} /> {isSiteEngineer ? 'Work Details' : 'Employment Details'}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', background: '#f9f9f9', borderRadius: 8, padding: '0.75rem 0.9rem' }}>
                                        {isSiteEngineer ? (
                                            <>
                                                {field('Trade', viewItem.employmentCategory && <span style={{ textTransform: 'capitalize' }}>{viewItem.employmentCategory}</span>)}
                                                {field('Work Shift', viewItem.workShift && <span style={{ textTransform: 'capitalize' }}>{viewItem.workShift === 'day' ? 'Day Shift' : 'Night Shift'}</span>)}
                                                {field('Recruited', viewItem.createdAt && new Date(viewItem.createdAt).toLocaleDateString())}
                                            </>
                                        ) : (
                                            <>
                                                {field('Role', ROLE_DISPLAY[viewItem.role] || viewItem.role)}
                                                {field('Category', viewItem.employmentCategory && <span style={{ textTransform: 'capitalize' }}>{viewItem.employmentCategory}</span>)}
                                                {field('Work Shift', viewItem.workShift && <span style={{ textTransform: 'capitalize' }}>{viewItem.workShift}</span>)}
                                                {field('Status', <span style={{ textTransform: 'capitalize' }}>{viewItem.employmentStatus}</span>)}
                                                {field('Registered', viewItem.createdAt && new Date(viewItem.createdAt).toLocaleDateString())}
                                            </>
                                        )}
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

            {showRecruitModal && (
                <div className="admin-modal-overlay" onClick={() => setShowRecruitModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                        <div className="admin-modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem' }}>
                                <FaHammer style={{ color: '#e67e22' }} /> Recruit Wage Worker
                            </h3>
                            <button onClick={() => setShowRecruitModal(false)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.6rem' }}>
                                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--bg-secondary)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '0.3rem' }}>
                                    {recruitForm.picture ? (
                                        <img src={recruitForm.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <FaCamera size={20} style={{ color: 'var(--text-muted)' }} />
                                    )}
                                </div>
                                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    Picture (optional)
                                    <input type="file" accept="image/*" hidden onChange={async e => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                            const reader = new FileReader();
                                            reader.onload = ev => setRecruitForm(p => ({ ...p, picture: ev.target?.result as string }));
                                            reader.readAsDataURL(file);
                                        } catch { }
                                    }} />
                                </label>
                            </div>
                            <div className="reg-form-grid">
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaUser size={11} /> First Name *</label>
                                    <input className="form-input" value={recruitForm.firstName} onChange={e => setRecruitForm(p => ({ ...p, firstName: e.target.value.replace(/\b\w/g, c => c.toUpperCase()) }))} placeholder="Enter first name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaUser size={11} /> Last Name *</label>
                                    <input className="form-input" value={recruitForm.lastName} onChange={e => setRecruitForm(p => ({ ...p, lastName: e.target.value.replace(/\b\w/g, c => c.toUpperCase()) }))} placeholder="Enter last name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaPhone size={11} /> Phone</label>
                                    <input className="form-input" value={recruitForm.phone} onChange={e => setRecruitForm(p => ({ ...p, phone: e.target.value }))} placeholder="+250 788 000 000" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaIdCard size={11} /> National ID (16 digits) *</label>
                                    <input className="form-input" value={recruitForm.nationalId} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 16); setRecruitForm(p => ({ ...p, nationalId: v })); }} placeholder="e.g. 1199980012345678" maxLength={16} inputMode="numeric" pattern="\d{16}" required />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaHome size={11} /> Address</label>
                                    <input className="form-input" value={recruitForm.address} onChange={e => setRecruitForm(p => ({ ...p, address: e.target.value }))} placeholder="Home address" />
                                </div>
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setShowRecruitModal(false)} style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}>Cancel</button>
                            <button className="admin-btn" onClick={handleRecruit} disabled={recruitLoading} style={{ background: '#e67e22', borderColor: '#e67e22', padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}>
                                {recruitLoading ? <><FaSpinner className="spin" /> Recruiting...</> : 'Recruit Worker'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;
