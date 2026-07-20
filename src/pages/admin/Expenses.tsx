import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    FaEdit, FaPlus, FaTimes as FaTimesIcon, FaMoneyBillWave, FaArrowsAlt, FaChevronLeft, FaChevronRight, FaSpinner,
    FaFileDownload, FaBuilding, FaListUl, FaMinusCircle, FaHashtag, FaBoxes, FaHardHat, FaTruck, FaTools,
} from 'react-icons/fa';
import { financeService } from '../../services/financeService';
import type { Expense } from '../../services/financeService';
import { constructionService } from '../../services/constructionService';
import type { Project } from '../../services/constructionService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { loadPageCache, savePageCache } from '../../utils/pageCache';
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

interface ItemRow { description: string; amount: number | ''; }

interface FormData {
    description: string; amount: number | ''; category: string; vendor: string; date: string;
    projectId: string; items: ItemRow[];
}

const emptyForm = (): FormData => ({
    description: '', amount: '', category: 'materials', vendor: '', date: new Date().toISOString().split('T')[0],
    projectId: '', items: [],
});

const CATEGORIES = ['materials', 'labor', 'equipment', 'transport', 'utilities', 'rent', 'salary', 'marketing', 'other'];
const PAGE_SIZES = [5, 10, 15, 20];

const Expenses = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const canManage = user?.role !== 'managing_director';
    const [data, setData] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Expense | null>(null);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [modalPos, setModalPos] = useState<{ x: number; y: number } | null>(null);
    const dragging = useRef<{ offsetX: number; offsetY: number } | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);

    const fetch = async () => {
        const cached = loadPageCache<Expense[]>('pg_expenses');
        if (cached) setData(cached);
        try {
            const res = await financeService.getExpenses();
            const fresh = res.data || [];
            setData(fresh);
            savePageCache('pg_expenses', fresh);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetch();
        constructionService.getProjects().then(res => setProjects(res.data || [])).catch(() => setProjects([]));
    }, []);

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

    /** One expense, fully documented: what was paid for, what it broke down into, who recorded it. */
    const exportExpense = (item: Expense) => {
        const doc = new jsPDF();
        const brown = '#1B2042';
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        let y = 46;

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
        doc.text('Expense Voucher', 14, 40);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#666');
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageW - 14, 40, { align: 'right' });

        const details: [string, string][] = [
            ['Description', item.description],
            ['Amount', `RWF ${item.amount.toLocaleString()}`],
            ['Category', item.category.replace(/_/g, ' ')],
            ['Vendor', item.vendor || '—'],
            ['Date', new Date(item.date).toLocaleDateString()],
        ];
        if (item.project?.name) details.push(['Project', item.project.name]);
        if (item.paymentMethod) details.push(['Payment Method', item.paymentMethod]);
        details.push(['Recorded By', item.recordedByName || 'Unattributed']);

        autoTable(doc, {
            body: details,
            startY: y,
            styles: { fontSize: 9, textColor: '#333' },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
            alternateRowStyles: { fillColor: [250, 245, 240] },
        });
        y = (doc as any).lastAutoTable.finalY + 8;

        if (item.items && item.items.length > 0) {
            doc.setFontSize(11); doc.setTextColor(brown); doc.setFont('helvetica', 'bold');
            doc.text('What This Paid For', 14, y);
            autoTable(doc, {
                head: [['Description', 'Amount']],
                body: item.items.map(li => [li.description, `RWF ${Number(li.amount).toLocaleString()}`]),
                foot: [['Total', `RWF ${item.items.reduce((s, li) => s + Number(li.amount), 0).toLocaleString()}`]],
                startY: y + 4,
                styles: { fontSize: 9, textColor: '#333' },
                headStyles: { fillColor: [139, 69, 19], textColor: [255, 255, 255], fontStyle: 'bold' },
                footStyles: { fillColor: [240, 240, 240], textColor: '#333', fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [250, 245, 240] },
            });
        }

        if (item.notes) {
            const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : y;
            doc.setFontSize(9); doc.setTextColor('#333'); doc.setFont('helvetica', 'normal');
            doc.text(`Notes: ${item.notes}`, 14, finalY, { maxWidth: pageW - 28 });
        }

        doc.setDrawColor(brown); doc.setLineWidth(0.5); doc.line(14, pageH - 20, pageW - 14, pageH - 20);
        doc.setFontSize(8); doc.setTextColor(brown); doc.setFont('helvetica', 'normal');
        doc.text('Email: info@muhiziconstruction.com  |  Phone: +250 788 000 000  |  Location: Kigali, Rwanda', pageW / 2, pageH - 14, { align: 'center' });
        doc.save(`expense_${item.description.replace(/\s+/g, '_').slice(0, 30)}_${item.date}.pdf`);
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
        setForm({
            description: item.description, amount: item.amount || '', category: item.category, vendor: item.vendor || '', date: item.date,
            projectId: item.projectId || '', items: item.items?.map(li => ({ description: li.description, amount: li.amount })) || [],
        });
        setModalPos(null);
        setShowModal(true);
    };

    const addItemRow = () => setForm(p => ({ ...p, items: [...p.items, { description: '', amount: '' }] }));
    const removeItemRow = (i: number) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
    const updateItemRow = (i: number, patch: Partial<ItemRow>) => setForm(p => ({ ...p, items: p.items.map((row, idx) => idx === i ? { ...row, ...patch } : row) }));

    const handleSave = async () => {
        if (!form.description.trim()) { showToast('Description is required', 'error'); return; }
        if (form.amount === '' || form.amount < 0) { showToast('Enter a valid amount', 'error'); return; }
        if (!form.date) { showToast('Date is required', 'error'); return; }
        const cleanItems = form.items
            .filter(li => li.description.trim() && li.amount !== '')
            .map(li => ({ description: li.description.trim(), amount: Number(li.amount) }));
        setSaving(true);
        try {
            const payload = { ...form, projectId: form.projectId || undefined, items: cleanItems };
            if (editing) await financeService.updateExpense(editing.id, payload);
            else await financeService.createExpense(payload);
            showToast(editing ? 'Expense updated' : 'Expense recorded', 'success');
            setShowModal(false);
            fetch();
        } catch (e: any) {
            const message = e?.response?.data?.message;
            showToast(Array.isArray(message) ? message.join('. ') : (typeof message === 'string' ? message : 'Failed to save expense'), 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="admin-page">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.85rem' }}>
                <FaMoneyBillWave style={{ color: 'var(--primary)' }} /> Expenses
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <StatTile icon={<FaMoneyBillWave />} label="Total expenses" value={`RWF ${totals.totalExpenses.toLocaleString()}`} accent="#ef4444" emphasis />
                <StatTile icon={<FaHashtag />} label="Transactions" value={String(totals.count)} accent="#1B2042" />
                <StatTile icon={<FaBoxes />} label="Materials" value={`RWF ${totals.materials.toLocaleString()}`} accent="#f59e0b" />
                <StatTile icon={<FaHardHat />} label="Labor" value={`RWF ${totals.labor.toLocaleString()}`} accent="#3b82f6" />
                <StatTile icon={<FaTools />} label="Equipment" value={`RWF ${totals.equipment.toLocaleString()}`} accent="#06b6d4" />
                <StatTile icon={<FaTruck />} label="Transport" value={`RWF ${totals.transport.toLocaleString()}`} accent="#e11d48" />
            </div>

            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>All Expense Records</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input type="text" className="form-input" placeholder="Search description, category, vendor..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 400 }} />
                        <input type="date" className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 140 }} title="From date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} />
                        <input type="date" className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 140 }} title="To date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} />
                        {canManage && (
                            <button className="admin-btn" onClick={openNew} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.6rem 1.5rem', fontSize: '0.95rem' }}>
                                <FaPlus style={{ marginRight: 6 }} />Add Expense
                            </button>
                        )}
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Description</th><th>Amount</th><th>Category</th><th>Project</th><th>Vendor</th><th>Date</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <strong>{item.description}</strong>
                                        {item.items && item.items.length > 0 && (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                <FaListUl size={9} /> {item.items.length} item{item.items.length > 1 ? 's' : ''} itemized
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ color: '#ef4444', fontWeight: 700 }}>RWF {item.amount?.toLocaleString() || '—'}</td>
                                    <td><span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize' }}>{item.category}</span></td>
                                    <td>
                                        {item.project?.name ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem' }}><FaBuilding size={10} style={{ color: 'var(--text-muted)' }} /> {item.project.name}</span>
                                        ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                    </td>
                                    <td>{item.vendor || '—'}</td>
                                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(item.date).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            {canManage && (
                                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => openEdit(item)} title="Edit"><FaEdit /></button>
                                            )}
                                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => exportExpense(item)} title="Download as PDF — for records, sharing, or uploading elsewhere as evidence"><FaFileDownload /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <FaMoneyBillWave size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                                    <div>{canManage ? 'No expense records found. Click "Add Expense" to create one.' : 'No expense records found yet.'}</div>
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
                <div className="admin-modal-overlay" onClick={() => !saving && setShowModal(false)}>
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
                                    <input type="number" className="form-input" value={form.amount || ''} onChange={e => setForm(p => ({ ...p, amount: e.target.value === '' ? '' : Number(e.target.value) }))} placeholder="e.g. 500000" />
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
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Project <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                                    <select className="form-select" value={form.projectId} onChange={e => setForm(p => ({ ...p, projectId: e.target.value }))}>
                                        <option value="">— None —</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginTop: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <FaListUl size={11} /> What This Paid For <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional — e.g. materials, labor)</span>
                                    </label>
                                    <button type="button" onClick={addItemRow} style={{ padding: '0.25rem 0.6rem', borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <FaPlus size={9} /> Add Item
                                    </button>
                                </div>
                                {form.items.length === 0 ? (
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>No breakdown added — the expense will just show its total amount.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {form.items.map((row, i) => (
                                            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <input className="form-input" placeholder="e.g. Cement (50 bags)" value={row.description} onChange={e => updateItemRow(i, { description: e.target.value })} style={{ flex: 2 }} />
                                                <input type="number" className="form-input" placeholder="Amount" value={row.amount} onChange={e => updateItemRow(i, { amount: e.target.value === '' ? '' : Number(e.target.value) })} style={{ flex: 1 }} />
                                                <button type="button" onClick={() => removeItemRow(i)} style={{ background: 'none', border: 'none', color: 'var(--primary-red)', cursor: 'pointer', display: 'flex', padding: 4 }}>
                                                    <FaMinusCircle size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: 2 }}>
                                            Items total: RWF {form.items.reduce((s, r) => s + (Number(r.amount) || 0), 0).toLocaleString()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
                            <button className="admin-btn" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
                                {saving ? <><FaSpinner className="spin" size={12} /> Saving...</> : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
