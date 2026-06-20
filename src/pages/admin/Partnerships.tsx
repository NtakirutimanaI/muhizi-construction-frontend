import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FaEdit, FaTrash, FaPlus, FaTimes as FaTimesIcon, FaHandshake, FaCheckCircle, FaRegCircle, FaHourglassHalf, FaFileExcel, FaFilePdf, FaArrowsAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { constructionService } from '../../services/constructionService';
import type { Partnership } from '../../services/constructionService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FormData {
    companyName: string; contactPerson: string; email: string; phone: string;
    partnershipType: string; status: string; startDate: string; endDate: string; notes: string;
}

const emptyForm: FormData = {
    companyName: '', contactPerson: '', email: '', phone: '',
    partnershipType: 'supplier', status: 'active', startDate: '', endDate: '', notes: '',
};

const PAGE_SIZES = [5, 10, 15, 20];

const Partnerships = () => {
    const [data, setData] = useState<Partnership[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Partnership | null>(null);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [modalPos, setModalPos] = useState<{ x: number; y: number } | null>(null);
    const dragging = useRef<{ offsetX: number; offsetY: number } | null>(null);

    const fetch = async () => {
        try {
            const res = await constructionService.getPartnerships();
            setData(res.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(); }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return data.filter(d => {
            if (q && !d.companyName.toLowerCase().includes(q) && !(d.contactPerson || '').toLowerCase().includes(q) && !d.partnershipType.toLowerCase().includes(q)) return false;
            if (fromDate && new Date(d.createdAt) < new Date(fromDate)) return false;
            if (toDate) { const end = new Date(toDate); end.setHours(23, 59, 59, 999); if (new Date(d.createdAt) > end) return false; }
            return true;
        });
    }, [data, search, fromDate, toDate]);

    const totalPages = pageSize === 0 ? 1 : Math.ceil(filtered.length / pageSize);
    const paginated = useMemo(() => {
        if (pageSize === 0) return filtered;
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages || 1);
    }, [totalPages, page]);

    const canDownload = (fromDate && toDate) || search.trim().length > 0;

    const tableData = useMemo(() => filtered.map((d, i) => [
        String(i + 1),
        d.companyName,
        d.contactPerson || '—',
        d.partnershipType.replace('_', ' '),
        d.status,
        d.email || '—',
        d.phone || '—',
        d.startDate ? new Date(d.startDate).toLocaleDateString() : '?',
    ]), [filtered]);

    const downloadPDF = () => {
        const doc = new jsPDF();
        const brown = '#8B4513';
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
        doc.text('Partnerships Report', 14, titleY);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#666');
        const today = new Date().toLocaleDateString();
        doc.text(`Generated: ${today}${fromDate && toDate ? ` | Period: ${fromDate} to ${toDate}` : ''}`, pageW - 14, titleY, { align: 'right' });

        autoTable(doc, {
            head: [['#', 'Company', 'Contact', 'Type', 'Status', 'Email', 'Phone', 'Start Date']],
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

        doc.save('partnerships.pdf');
    };

    const downloadExcel = () => {
        const brown = '#8B4513';
        const today = new Date().toLocaleDateString();
        const period = fromDate && toDate ? `Period: ${fromDate} to ${toDate}` : '';
        const headers = ['#', 'Company', 'Contact', 'Type', 'Status', 'Email', 'Phone', 'Start Date'];
        const rows = tableData.map(r => `<tr>${r.map(c => `<td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${c}</td>`).join('')}</tr>`).join('');

        const html = `
            <html><head><meta charset="UTF-8"></head><body>
            <div style="text-align:center;color:${brown};font-size:20px;font-weight:bold;font-family:Arial">MUHIZI CONSTRUCTION</div>
            <div style="text-align:center;color:${brown};font-size:11px;font-family:Arial;margin-bottom:4px">Building Your Vision, Delivering Excellence</div>
            <hr style="border:1px solid ${brown}" />
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;color:${brown};font-family:Arial;margin:6px 0">
                <span>Partnerships Report</span>
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
        a.href = url; a.download = 'partnerships.xls'; a.click();
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

    const stats = useMemo(() => ({
        total: data.length,
        active: data.filter(d => d.status === 'active').length,
        inactive: data.filter(d => d.status === 'inactive').length,
        pending: data.filter(d => d.status === 'pending').length,
        suppliers: data.filter(d => d.partnershipType === 'supplier').length,
        subcontractors: data.filter(d => d.partnershipType === 'subcontractor').length,
    }), [data]);

    const openNew = () => { setEditing(null); setForm(emptyForm); setModalPos(null); setShowModal(true); };
    const openEdit = (item: Partnership) => {
        setEditing(item);
        setForm({
            companyName: item.companyName, contactPerson: item.contactPerson || '',
            email: item.email || '', phone: item.phone || '',
            partnershipType: item.partnershipType, status: item.status,
            startDate: item.startDate || '', endDate: item.endDate || '', notes: item.notes || '',
        });
        setModalPos(null);
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            if (editing) await constructionService.updatePartnership(editing.id, form);
            else await constructionService.createPartnership(form);
            setShowModal(false);
            fetch();
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this partnership?')) return;
        try { await constructionService.deletePartnership(id); fetch(); }
        catch (e) { console.error(e); }
    };

    if (loading) return <div className="admin-page"><div className="inline-spinner">Loading partnerships...</div></div>;

    const statusColors: Record<string, string> = {
        active: '#22c55e', inactive: '#6b7280', pending: '#f59e0b',
    };

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, flexShrink: 0 }}>
                    <FaHandshake style={{ color: 'var(--primary)' }} /> Partnerships
                </h2>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{stats.total}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Total</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{stats.active}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Active</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{stats.pending}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Pending</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{stats.inactive}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Inactive</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{stats.suppliers}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Suppliers</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{stats.subcontractors}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Subcontract</div>
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>All Partnerships</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input type="text" className="form-input" placeholder="Search company, contact, type..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 400 }} />
                        <input type="date" className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 140 }} title="From date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} />
                        <input type="date" className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 140 }} title="To date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} />
                        <button className="admin-btn" onClick={downloadExcel} disabled={!canDownload} style={{ background: '#8B4513', borderColor: '#8B4513', color: '#fff', borderRadius: 5, padding: '0.6rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, opacity: canDownload ? 1 : 0.5 }}>
                            <FaFileExcel /> Excel
                        </button>
                        <button className="admin-btn" onClick={downloadPDF} disabled={!canDownload} style={{ background: '#8B4513', borderColor: '#8B4513', color: '#fff', borderRadius: 5, padding: '0.6rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, opacity: canDownload ? 1 : 0.5 }}>
                            <FaFilePdf /> PDF
                        </button>
                        <button className="admin-btn" onClick={openNew} style={{ background: '#8B4513', borderColor: '#8B4513', color: '#fff', borderRadius: 5, padding: '0.6rem 1.5rem', fontSize: '0.95rem' }}>
                            <FaPlus style={{ marginRight: 6 }} />Add Partnership
                        </button>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Company</th><th>Contact</th><th>Type</th><th>Status</th><th>Email</th><th>Phone</th><th>Dates</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(item => (
                                <tr key={item.id}>
                                    <td><strong>{item.companyName}</strong></td>
                                    <td>
                                        {item.contactPerson && <div>{item.contactPerson}</div>}
                                        {!item.contactPerson && '—'}
                                    </td>
                                    <td style={{ textTransform: 'capitalize' }}>{item.partnershipType.replace('_', ' ')}</td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600,
                                            color: '#fff', background: statusColors[item.status] || '#6b7280',
                                        }}>{item.status}</span>
                                    </td>
                                    <td>{item.email || '—'}</td>
                                    <td>{item.phone || '—'}</td>
                                    <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                        {item.startDate ? new Date(item.startDate).toLocaleDateString() : '?'} — {item.endDate ? new Date(item.endDate).toLocaleDateString() : '?'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => openEdit(item)}><FaEdit /></button>
                                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem', color: 'var(--primary-red)' }} onClick={() => handleDelete(item.id)}><FaTrash /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <FaHandshake size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                                    <div>No partnerships found. Click "Add New" to create one.</div>
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
            {showModal && (
                <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ left: modalPos?.x ?? '50%', top: modalPos?.y ?? '50%', transform: modalPos ? 'none' : 'translate(-50%, -50%)' }}>
                        <div className="admin-modal-header" onMouseDown={onHeaderMouseDown}>
                            <h3><FaArrowsAlt style={{ fontSize: '0.75rem', marginRight: 8, opacity: 0.5 }} />{editing ? 'Edit' : 'Add'} Partnership</h3>
                            <button onClick={() => setShowModal(false)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Company Name</label>
                                    <input className="form-input" value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))} placeholder="Company name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Partnership Type</label>
                                    <select className="form-select" value={form.partnershipType} onChange={e => setForm(p => ({ ...p, partnershipType: e.target.value }))}>
                                        <option value="supplier">Supplier</option>
                                        <option value="subcontractor">Subcontractor</option>
                                        <option value="investor">Investor</option>
                                        <option value="joint_venture">Joint Venture</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact Person</label>
                                    <input className="form-input" value={form.contactPerson} onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))} placeholder="Full name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="pending">Pending</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="contact@company.com" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+250 788 000 000" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input type="date" className="form-input" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End Date</label>
                                    <input type="date" className="form-input" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="form-label">Notes</label>
                                <textarea className="form-textarea" rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Additional notes..." />
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="admin-btn" onClick={handleSave}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Partnerships;
