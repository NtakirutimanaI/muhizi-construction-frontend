import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FaEdit, FaTrash, FaPlus, FaTimes as FaTimesIcon, FaMoneyBillWave, FaFileExcel, FaFilePdf, FaArrowsAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { financeService } from '../../services/financeService';
import type { Expense } from '../../services/financeService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FormData {
    description: string; amount: number; category: string; vendor: string; date: string;
}

const emptyForm: FormData = { description: '', amount: 0, category: 'materials', vendor: '', date: '' };

const CATEGORIES = ['materials', 'labor', 'equipment', 'transport', 'utilities', 'rent', 'salary', 'marketing', 'other'];
const PAGE_SIZES = [5, 10, 15, 20];

const Expenses = () => {
    const [data, setData] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Expense | null>(null);
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
            const res = await financeService.getExpenses();
            setData(res.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(); }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return data.filter(d => {
            if (q && !d.description.toLowerCase().includes(q) && !d.category.toLowerCase().includes(q) && !(d.vendor || '').toLowerCase().includes(q)) return false;
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
        d.description,
        `RWF ${d.amount.toLocaleString()}`,
        d.category.charAt(0).toUpperCase() + d.category.slice(1),
        d.vendor || '—',
        new Date(d.date).toLocaleDateString(),
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
        doc.text('Expenses Report', 14, titleY);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#666');
        const today = new Date().toLocaleDateString();
        doc.text(`Generated: ${today}${fromDate && toDate ? ` | Period: ${fromDate} to ${toDate}` : ''}`, pageW - 14, titleY, { align: 'right' });

        autoTable(doc, {
            head: [['#', 'Description', 'Amount', 'Category', 'Vendor', 'Date']],
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

        doc.save('expenses.pdf');
    };

    const downloadExcel = () => {
        const brown = '#8B4513';
        const today = new Date().toLocaleDateString();
        const period = fromDate && toDate ? `Period: ${fromDate} to ${toDate}` : '';
        const headers = ['#', 'Description', 'Amount', 'Category', 'Vendor', 'Date'];
        const rows = tableData.map(r => `<tr>${r.map(c => `<td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${c}</td>`).join('')}</tr>`).join('');

        const html = `
            <html><head><meta charset="UTF-8"></head><body>
            <div style="text-align:center;color:${brown};font-size:20px;font-weight:bold;font-family:Arial">MUHIZI CONSTRUCTION</div>
            <div style="text-align:center;color:${brown};font-size:11px;font-family:Arial;margin-bottom:4px">Building Your Vision, Delivering Excellence</div>
            <hr style="border:1px solid ${brown}" />
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;color:${brown};font-family:Arial;margin:6px 0">
                <span>Expenses Report</span>
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
        a.href = url; a.download = 'expenses.xls'; a.click();
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

    const totals = useMemo(() => ({
        totalExpenses: data.reduce((s, d) => s + d.amount, 0),
        count: data.length,
        materials: data.filter(d => d.category === 'materials').reduce((s, d) => s + d.amount, 0),
        labor: data.filter(d => d.category === 'labor').reduce((s, d) => s + d.amount, 0),
        equipment: data.filter(d => d.category === 'equipment').reduce((s, d) => s + d.amount, 0),
        transport: data.filter(d => d.category === 'transport').reduce((s, d) => s + d.amount, 0),
    }), [data]);

    const openNew = () => { setEditing(null); setForm(emptyForm); setModalPos(null); setShowModal(true); };
    const openEdit = (item: Expense) => {
        setEditing(item);
        setForm({ description: item.description, amount: item.amount, category: item.category, vendor: item.vendor || '', date: item.date });
        setModalPos(null);
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            if (editing) await financeService.updateExpense(editing.id, form);
            else await financeService.createExpense(form);
            setShowModal(false);
            fetch();
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this expense record?')) return;
        try { await financeService.deleteExpense(id); fetch(); }
        catch (e) { console.error(e); }
    };

    if (loading) return <div className="admin-page"><div className="inline-spinner">Loading expenses...</div></div>;

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, flexShrink: 0 }}>
                    <FaMoneyBillWave style={{ color: 'var(--primary)' }} /> Expenses
                </h2>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>RWF {totals.totalExpenses.toLocaleString()}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Total Expenses</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{totals.count}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Transactions</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>RWF {totals.materials.toLocaleString()}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Materials</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>RWF {totals.labor.toLocaleString()}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Labor</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>RWF {totals.equipment.toLocaleString()}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Equipment</div>
                    </div>
                    <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>RWF {totals.transport.toLocaleString()}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Transport</div>
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>All Expense Records</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input type="text" className="form-input" placeholder="Search description, category, vendor..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 400 }} />
                        <input type="date" className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 140 }} title="From date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} />
                        <input type="date" className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 140 }} title="To date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} />
                        <button className="admin-btn" onClick={downloadExcel} disabled={!canDownload} style={{ background: '#8B4513', borderColor: '#8B4513', color: '#fff', borderRadius: 5, padding: '0.6rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, opacity: canDownload ? 1 : 0.5 }}>
                            <FaFileExcel /> Excel
                        </button>
                        <button className="admin-btn" onClick={downloadPDF} disabled={!canDownload} style={{ background: '#8B4513', borderColor: '#8B4513', color: '#fff', borderRadius: 5, padding: '0.6rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, opacity: canDownload ? 1 : 0.5 }}>
                            <FaFilePdf /> PDF
                        </button>
                        <button className="admin-btn" onClick={openNew} style={{ background: '#8B4513', borderColor: '#8B4513', color: '#fff', borderRadius: 5, padding: '0.6rem 1.5rem', fontSize: '0.95rem' }}>
                            <FaPlus style={{ marginRight: 6 }} />Add Expense
                        </button>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Description</th><th>Amount</th><th>Category</th><th>Vendor</th><th>Date</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(item => (
                                <tr key={item.id}>
                                    <td><strong>{item.description}</strong></td>
                                    <td style={{ color: '#ef4444', fontWeight: 700 }}>RWF {item.amount?.toLocaleString() || '—'}</td>
                                    <td><span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize' }}>{item.category}</span></td>
                                    <td>{item.vendor || '—'}</td>
                                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(item.date).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => openEdit(item)}><FaEdit /></button>
                                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem', color: 'var(--primary-red)' }} onClick={() => handleDelete(item.id)}><FaTrash /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <FaMoneyBillWave size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                                    <div>No expense records found. Click "Add Expense" to create one.</div>
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
                            <h3><FaArrowsAlt style={{ fontSize: '0.75rem', marginRight: 8, opacity: 0.5 }} />{editing ? 'Edit' : 'Add'} Expense</h3>
                            <button onClick={() => setShowModal(false)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Description</label>
                                    <input className="form-input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Expense description" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Amount (RWF)</label>
                                    <input type="number" className="form-input" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))} placeholder="0" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select className="form-select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Vendor</label>
                                    <input className="form-input" value={form.vendor} onChange={e => setForm(p => ({ ...p, vendor: e.target.value }))} placeholder="Vendor name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input type="date" className="form-input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                                </div>
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

export default Expenses;
