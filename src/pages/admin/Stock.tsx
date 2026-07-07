import { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import {
    FaWarehouse, FaPlus, FaTrash, FaEdit, FaTimes, FaSpinner,
    FaChevronLeft, FaChevronRight, FaSearch, FaExclamationTriangle,
    FaArrowDown, FaArrowUp, FaBoxes, FaChartBar, FaListUl, FaTag,
    FaCheckCircle, FaExclamationCircle, FaChartPie, FaChartLine,
} from 'react-icons/fa';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { stockService } from '../../services/stockService';
import type { Stock } from '../../services/stockService';
import { categoriesService, type Category } from '../../services/categoriesService';
import { useToast } from '../../context/ToastContext';

const PAGE_SIZES = [5, 10, 15, 20];

interface CategoryOption { value: string; label: string; }

interface ItemSummary {
    item: string;
    category: string;
    unit: string;
    totalIn: number;
    totalOut: number;
    balance: number;
    totalCostIn: number;
    totalCostOut: number;
    lastIn: string;
    lastOut: string;
}

const emptyForm = () => ({
    item: '', category: '', type: 'in' as 'in' | 'out',
    quantity: '' as any, unit: 'pieces', unitPrice: '' as any,
    date: new Date().toISOString().split('T')[0], time: '', reference: '', notes: '',
});

type ViewMode = 'summary' | 'transactions';


const StockPage = () => {
    const { showToast } = useToast();
    const location = useLocation();
    const outletCtx = useOutletContext<{ searchQuery?: string; setSearchQuery?: (q: string) => void }>();
    const [entries, setEntries] = useState<Stock[]>([]);
    const [stats, setStats] = useState({ totalIn: 0, totalOut: 0, netStock: 0, itemCount: 0 });
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<ViewMode>('summary');
    const pathFilter = location.pathname.endsWith('/in') ? 'in' : location.pathname.endsWith('/out') ? 'out' : 'all';
    const [filter, setFilter] = useState<'all' | 'in' | 'out'>(pathFilter);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [summaryPage, setSummaryPage] = useState(1);
    const [summaryPageSize, setSummaryPageSize] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Stock | null>(null);
    const [form, setForm] = useState(emptyForm());
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [dbCategories, setDbCategories] = useState<CategoryOption[]>([]);

    useEffect(() => {
        if (outletCtx.searchQuery) {
            setSearch(outletCtx.searchQuery);
            outletCtx.setSearchQuery?.('');
        }
    }, [outletCtx.searchQuery]);

    const defaultCategory = useMemo(() => {
        if (dbCategories.length) return dbCategories[0].value;
        return '';
    }, [dbCategories]);

    useEffect(() => {
        if (defaultCategory && !form.category) {
            setForm(p => ({ ...p, category: defaultCategory }));
        }
    }, [defaultCategory]);

    const loadCategories = async () => {
        try {
            const res = await categoriesService.getAll();
            setDbCategories((res.data || []).map((c: Category) => ({ value: c.value, label: c.label })));
        } catch { }
    };

    const load = async () => {
        setLoading(true);
        try {
            const [eRes, sRes] = await Promise.all([
                stockService.getAll().catch(() => ({ data: [] })),
                stockService.getStats().catch(() => ({ data: { totalIn: 0, totalOut: 0, netStock: 0, itemCount: 0 } })),
            ]);
            setEntries(eRes.data || []);
            setStats(sRes.data || { totalIn: 0, totalOut: 0, netStock: 0, itemCount: 0 });
        } catch { }
        setLoading(false);
    };

    useEffect(() => { load(); loadCategories(); }, []);
    useEffect(() => { setFilter(pathFilter); setPage(1); }, [location.pathname]);

    const filtered = useMemo(() => {
        let arr = entries;
        if (filter !== 'all') arr = arr.filter(e => e.type === filter);
        if (categoryFilter !== 'all') arr = arr.filter(e => e.category === categoryFilter);
        if (dateFrom) arr = arr.filter(e => e.date >= dateFrom);
        if (dateTo) arr = arr.filter(e => e.date <= dateTo);
        if (search) {
            const q = search.toLowerCase();
            arr = arr.filter(e =>
                e.item.toLowerCase().includes(q) ||
                (e.reference || '').toLowerCase().includes(q) ||
                (e.notes || '').toLowerCase().includes(q)
            );
        }
        return arr;
    }, [entries, filter, search, categoryFilter, dateFrom, dateTo]);

    const totalPages = pageSize ? Math.ceil(filtered.length / pageSize) : 1;
    const paginated = pageSize ? filtered.slice((page - 1) * pageSize, page * pageSize) : filtered;

    useEffect(() => {
        const tp = pageSize ? Math.ceil(filtered.length / pageSize) : 1;
        if (page > tp) setPage(tp || 1);
    }, [filtered.length, pageSize]);

    const itemSummary = useMemo(() => {
        const map = new Map<string, ItemSummary>();
        for (const e of entries) {
            const key = e.item.toLowerCase();
            const existing = map.get(key) || {
                item: e.item,
                category: e.category,
                unit: e.unit,
                totalIn: 0,
                totalOut: 0,
                balance: 0,
                totalCostIn: 0,
                totalCostOut: 0,
                lastIn: '',
                lastOut: '',
            };
            if (e.type === 'in') {
                existing.totalIn += Number(e.quantity);
                existing.totalCostIn += Number(e.totalCost);
                if (e.date > existing.lastIn) existing.lastIn = e.date;
            } else {
                existing.totalOut += Number(e.quantity);
                existing.totalCostOut += Number(e.totalCost);
                if (e.date > existing.lastOut) existing.lastOut = e.date;
            }
            existing.balance = existing.totalIn - existing.totalOut;
            map.set(key, existing);
        }
        return Array.from(map.values()).sort((a, b) => a.balance / Math.max(a.totalIn, 1) - b.balance / Math.max(b.totalIn, 1));
    }, [entries]);

    const summaryFiltered = useMemo(() => {
        let arr = itemSummary;
        if (search) arr = arr.filter(s => s.item.toLowerCase().includes(search.toLowerCase()));
        if (categoryFilter !== 'all') arr = arr.filter(s => s.category === categoryFilter);
        return arr;
    }, [itemSummary, search, categoryFilter]);

    const summaryTotalPages = summaryPageSize ? Math.ceil(summaryFiltered.length / summaryPageSize) : 1;
    const summaryPaginated = summaryPageSize ? summaryFiltered.slice((summaryPage - 1) * summaryPageSize, summaryPage * summaryPageSize) : summaryFiltered;

    useEffect(() => {
        const tp = summaryPageSize ? Math.ceil(summaryFiltered.length / summaryPageSize) : 1;
        if (summaryPage > tp) setSummaryPage(tp || 1);
    }, [summaryFiltered.length, summaryPageSize]);

    const runningOut = useMemo(() => {
        return itemSummary.filter(s => s.totalIn > 0 && s.balance / s.totalIn <= 0.3);
    }, [itemSummary]);

    const criticalItems = useMemo(() => {
        return itemSummary.filter(s => s.balance <= 0 && s.totalIn > 0);
    }, [itemSummary]);

    const monthlyTrend = useMemo(() => {
        const map = new Map<string, { in: number; out: number; costIn: number; costOut: number }>();
        for (const e of entries) {
            const month = e.date.slice(0, 7);
            const existing = map.get(month) || { in: 0, out: 0, costIn: 0, costOut: 0 };
            if (e.type === 'in') {
                existing.in += Number(e.quantity);
                existing.costIn += Number(e.totalCost);
            } else {
                existing.out += Number(e.quantity);
                existing.costOut += Number(e.totalCost);
            }
            map.set(month, existing);
        }
        return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
    }, [entries]);

    const categoryTotals = useMemo(() => {
        const map = new Map<string, number>();
        for (const e of entries) {
            const cat = e.category || 'other';
            map.set(cat, (map.get(cat) || 0) + Number(e.totalCost));
        }
        return Array.from(map.entries())
            .map(([name, value]) => ({ name: categoryLabel(name), value }))
            .sort((a, b) => b.value - a.value);
    }, [entries]);

    const PIE_COLORS = ['#4ecdc4', '#ff5252', '#1B2042', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    const validate = useCallback(() => {
        const errs: Record<string, string> = {};
        if (!form.item.trim()) errs.item = 'Item name is required';
        if (!form.category) errs.category = 'Category is required';
        if (!form.type || !['in', 'out'].includes(form.type)) errs.type = 'Type must be In or Out';
        if (form.quantity === '' || form.quantity === null || isNaN(Number(form.quantity))) errs.quantity = 'Quantity is required';
        else if (Number(form.quantity) <= 0) errs.quantity = 'Quantity must be greater than 0';
        if (form.unitPrice !== '' && form.unitPrice !== null && isNaN(Number(form.unitPrice))) errs.unitPrice = 'Invalid unit price';
        else if (Number(form.unitPrice) < 0) errs.unitPrice = 'Unit price cannot be negative';
        if (!form.date) errs.date = 'Date is required';
        setFormErrors(errs);
        return Object.keys(errs).length === 0;
    }, [form]);

    const openNew = () => { setEditing(null); setForm({ ...emptyForm(), type: pathFilter !== 'all' ? pathFilter : 'in', category: defaultCategory }); setFormErrors({}); setShowModal(true); };
    const openEdit = (e: Stock) => {
        setEditing(e);
        setForm({
            item: e.item, category: e.category, type: e.type,
            quantity: e.quantity, unit: e.unit, unitPrice: e.unitPrice,
            date: e.date, time: e.time || '', reference: e.reference || '', notes: e.notes || '',
        });
        setFormErrors({});
        setShowModal(true);
    };

    const save = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const payload = {
                ...form,
                quantity: Number(form.quantity),
                unitPrice: Number(form.unitPrice || 0),
            };
            if (editing) {
                await stockService.update(editing.id, payload);
                showToast('Stock entry updated', 'success');
            } else {
                await stockService.create(payload);
                showToast('Stock entry created', 'success');
            }
            setShowModal(false);
            setEditing(null);
            load();
        } catch {
            showToast('Failed to save', 'error');
        }
        setSaving(false);
    };

    const closeModal = () => { setShowModal(false); setEditing(null); setFormErrors({}); };

    const remove = async (id: string) => {
        if (!window.confirm('Delete this stock entry?')) return;
        try {
            await stockService.delete(id);
            showToast('Entry deleted', 'success');
            load();
        } catch {
            showToast('Failed to delete', 'error');
        }
    };

    const categoryLabel = (v: string) => dbCategories.find(c => c.value === v)?.label || v.replace(/_/g, ' ');

    const dynamicCategories = useMemo(() => {
        const cats = new Set(entries.map(e => e.category));
        const all = [...dbCategories];
        for (const c of cats) {
            if (!all.find(a => a.value === c)) all.push({ value: c, label: c.replace(/_/g, ' ') });
        }
        return all;
    }, [entries, dbCategories]);

    const stockLevel = (item: ItemSummary) => {
        if (item.totalIn === 0) return { pct: 0, label: 'No activity', color: '#9ca3af' };
        const pct = Math.max(0, Math.min(100, (item.balance / item.totalIn) * 100));
        if (pct <= 10) return { pct, label: 'Critical', color: '#ef4444' };
        if (pct <= 30) return { pct, label: 'Low', color: '#f59e0b' };
        if (pct <= 60) return { pct, label: 'Moderate', color: '#3b82f6' };
        return { pct, label: 'Healthy', color: '#22c55e' };
    };

    if (loading) return (
        <div className="admin-page">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: '#999', fontSize: '1.1rem' }}>
                <FaSpinner className="spin" size={20} /> Loading stock...
            </div>
        </div>
    );

    return (
        <div className="admin-page">

            {/* HEADER + STATS ROW */}
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginRight: '0.5rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, fontSize: '1rem' }}>
                        <FaWarehouse style={{ color: 'var(--primary)' }} /> Inventory
                    </h2>
                    <span style={{ fontSize: '0.7rem', color: '#999' }}>{stats.itemCount} items · {entries.length} txns</span>
                </div>
                <div className="admin-card" style={{ padding: '0.35rem 1.5rem', textAlign: 'center', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>RWF {Number(stats.totalIn).toLocaleString()}</div>
                    <div style={{ fontSize: '0.6rem', opacity: 0.85 }}>Stock In</div>
                </div>
                <div className="admin-card" style={{ padding: '0.35rem 1.5rem', textAlign: 'center', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>RWF {Number(stats.totalOut).toLocaleString()}</div>
                    <div style={{ fontSize: '0.6rem', opacity: 0.85 }}>Stock Out</div>
                </div>
                <div className="admin-card" style={{
                    padding: '0.35rem 1.5rem', textAlign: 'center',
                    background: stats.netStock >= 0 ? 'linear-gradient(135deg, var(--primary), #2d3a6e)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#fff',
                }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>RWF {Math.abs(Number(stats.netStock)).toLocaleString()}</div>
                    <div style={{ fontSize: '0.6rem', opacity: 0.85 }}>Net Stock {stats.netStock >= 0 ? '(Surplus)' : '(Deficit)'}</div>
                </div>
                <div className="admin-card" style={{ padding: '0.35rem 1.5rem', textAlign: 'center', background: 'linear-gradient(135deg, #6b7280, #4b5563)', color: '#fff' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{stats.itemCount}</div>
                    <div style={{ fontSize: '0.6rem', opacity: 0.85 }}>Items</div>
                </div>
                {(() => {
                    const today = new Date().toISOString().split('T')[0];
                    const todayEntries = entries.filter(e => e.date === today);
                    const todayIn = todayEntries.filter(e => e.type === 'in').reduce((s, e) => s + Number(e.totalCost), 0);
                    const todayOut = todayEntries.filter(e => e.type === 'out').reduce((s, e) => s + Number(e.totalCost), 0);
                    return (
                        <div className="admin-card" style={{ padding: '0.35rem 1.5rem', textAlign: 'center', background: 'linear-gradient(135deg, #0891b2, #0e7490)', color: '#fff' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, display: 'flex', gap: 6, justifyContent: 'center' }}>
                                <span>+RWF {todayIn.toLocaleString()}</span>
                                <span style={{ opacity: 0.6 }}>/</span>
                                <span>-RWF {todayOut.toLocaleString()}</span>
                            </div>
                            <div style={{ fontSize: '0.6rem', opacity: 0.85 }}>Today</div>
                        </div>
                    );
                })()}
            </div>

            {/* TOGGLE + ADD STOCK */}
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', marginTop: '0.2rem' }}>
                <div style={{ display: 'flex', gap: 2, background: '#f3f4f6', borderRadius: 6, padding: 1 }}>
                    <button onClick={() => setView('summary')}
                        style={{
                            padding: '0.25rem 0.55rem', borderRadius: 5, border: 'none',
                            background: view === 'summary' ? '#fff' : 'transparent',
                            color: view === 'summary' ? 'var(--primary)' : '#666',
                            cursor: 'pointer', fontSize: '0.68rem', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 3,
                            boxShadow: view === 'summary' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        }}>
                        <FaChartBar size={9} /> Summary
                    </button>
                    <button onClick={() => setView('transactions')}
                        style={{
                            padding: '0.25rem 0.55rem', borderRadius: 5, border: 'none',
                            background: view === 'transactions' ? '#fff' : 'transparent',
                            color: view === 'transactions' ? 'var(--primary)' : '#666',
                            cursor: 'pointer', fontSize: '0.68rem', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 3,
                            boxShadow: view === 'transactions' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        }}>
                        <FaListUl size={9} /> Transactions
                    </button>
                </div>
                <button onClick={openNew}
                    style={{
                        padding: '0.25rem 0.65rem', borderRadius: 6, border: 'none',
                        background: pathFilter === 'out' ? '#ef4444' : 'var(--primary)', color: '#fff', cursor: 'pointer',
                        fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
                        boxShadow: '0 2px 6px rgba(27,32,66,0.2)',
                    }}>
                    <FaPlus size={9} /> {pathFilter === 'out' ? 'Add Stock Out' : 'Add Stock'}
                </button>
            </div>

            {/* HEALTH ALERTS */}
            {criticalItems.length > 0 && (
                <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
                    padding: '0.5rem 0.85rem', marginTop: '0.3rem',
                    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                }}>
                    <FaExclamationCircle style={{ color: '#ef4444', flexShrink: 0 }} size={16} />
                    <span style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.82rem' }}>
                        {criticalItems.length} item{criticalItems.length > 1 ? 's' : ''} completely out of stock
                    </span>
                    <span style={{ color: '#7f1d1d', fontSize: '0.75rem' }}>
                        {criticalItems.map(s => s.item).join(', ')}
                    </span>
                </div>
            )}

            {runningOut.length > 0 && runningOut.length !== criticalItems.length && (
                <div style={{
                    background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8,
                    padding: '0.5rem 0.85rem', marginTop: '0.3rem',
                    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                }}>
                    <FaExclamationTriangle style={{ color: '#f59e0b', flexShrink: 0 }} size={16} />
                    <span style={{ fontWeight: 700, color: '#92400e', fontSize: '0.82rem' }}>
                        {runningOut.length} item{runningOut.length > 1 ? 's' : ''} running low
                    </span>
                    <span style={{ color: '#78350f', fontSize: '0.75rem' }}>
                        {runningOut.filter(s => s.balance > 0).map(s => `${s.item} (${s.balance} ${s.unit} left)`).join(', ')}
                    </span>
                </div>
            )}

            {/* FILTERS BAR */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem',
                flexWrap: 'wrap', background: 'var(--bg-card)', borderRadius: 8,
                padding: '0.4rem 0.75rem', border: '1px solid var(--border-color)',
            }}>
                <FaSearch size={12} style={{ color: '#bbb', flexShrink: 0 }} />
                <input type="text" placeholder="Search item, reference..." value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    style={{
                        padding: '0.35rem 0.5rem', fontSize: '0.8rem', border: 'none',
                        background: 'transparent', color: 'var(--text-main)', outline: 'none',
                        flex: 1, minWidth: 150,
                    }} />
                <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
                <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
                    style={{
                        padding: '0.3rem 0.5rem', fontSize: '0.75rem', borderRadius: 6,
                        border: '1px solid var(--border-color)', background: 'var(--bg-body)',
                        color: 'var(--text-main)', maxWidth: 160,
                    }}>
                    <option value="all">All Categories</option>
                    {dynamicCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                    title="From date"
                    style={{
                        padding: '0.3rem 0.5rem', fontSize: '0.75rem', borderRadius: 6,
                        border: '1px solid var(--border-color)', background: 'var(--bg-body)',
                        color: 'var(--text-main)', width: 130,
                    }} />
                <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
                    title="To date"
                    style={{
                        padding: '0.3rem 0.5rem', fontSize: '0.75rem', borderRadius: 6,
                        border: '1px solid var(--border-color)', background: 'var(--bg-body)',
                        color: 'var(--text-main)', width: 130,
                    }} />
                {(dateFrom || dateTo) && (
                    <button onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
                        style={{
                            padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: 6,
                            border: '1px solid #ddd', background: 'transparent', cursor: 'pointer', color: '#999',
                        }}>
                        <FaTimes size={9} /> Clear
                    </button>
                )}

            </div>

            {/* SUMMARY VIEW */}
            {view === 'summary' && (
                <>
                    {/* Item Health Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.4rem', marginTop: '0.3rem' }}>
                        {summaryPaginated.map(item => {
                            const level = stockLevel(item);
                            return (
                                <div key={item.item} style={{
                                    background: 'var(--bg-card)', borderRadius: 12, padding: '0.85rem 1rem',
                                    border: `1px solid ${level.color}22`,
                                    borderLeft: `4px solid ${level.color}`,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{item.item}</div>
                                            <div style={{ fontSize: '0.65rem', color: '#999', marginTop: 1 }}>
                                                <FaTag size={8} style={{ marginRight: 3 }} />
                                                {categoryLabel(item.category)} · {item.unit}
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: '0.15rem 0.45rem', borderRadius: 4,
                                            background: `${level.color}18`,
                                            color: level.color, fontWeight: 700, fontSize: '0.65rem',
                                        }}>
                                            {level.label}
                                        </span>
                                    </div>
                                    {/* Progress bar */}
                                    <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, marginBottom: 8, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${level.pct}%`, background: level.color, borderRadius: 3, transition: 'width 0.3s' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#666' }}>
                                        <span><FaArrowDown size={7} style={{ color: '#22c55e', marginRight: 2 }} />{item.totalIn}</span>
                                        <span><FaArrowUp size={7} style={{ color: '#ef4444', marginRight: 2 }} />{item.totalOut}</span>
                                        <span style={{ fontWeight: 700, color: level.color }}>Balance: {item.balance}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {itemSummary.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#999' }}>
                                <FaBoxes size={36} style={{ opacity: 0.2, marginBottom: 10 }} />
                                <div style={{ fontWeight: 600 }}>No stock data</div>
                                <div style={{ fontSize: '0.8rem' }}>Add your first stock entry to see the summary</div>
                            </div>
                        )}
                    </div>

                    {/* Summary Pagination */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '0.2rem 0', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: '0.78rem', color: '#999' }}>
                            Showing {summaryPageSize ? Math.min(summaryPageSize, summaryFiltered.length - (summaryPage - 1) * summaryPageSize) : summaryFiltered.length} of {summaryFiltered.length} item{summaryFiltered.length !== 1 ? 's' : ''}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ fontSize: '0.75rem', color: '#999' }}>Per page:</span>
                                <select className="form-select" style={{ width: 'auto', padding: '0.25rem 1.3rem 0.25rem 0.4rem', fontSize: '0.75rem' }}
                                    value={summaryPageSize} onChange={e => { setSummaryPage(1); setSummaryPageSize(Number(e.target.value)); }}>
                                    {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                    <option value={0}>All</option>
                                </select>
                            </div>
                            {summaryPageSize > 0 && summaryTotalPages > 1 && (
                                <div style={{ display: 'flex', gap: 2 }}>
                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.45rem', fontSize: '0.7rem' }}
                                        disabled={summaryPage <= 1} onClick={() => setSummaryPage(p => Math.max(1, p - 1))}><FaChevronLeft size={10} /></button>
                                    {Array.from({ length: summaryTotalPages }, (_, i) => i + 1).map(p => (
                                        <button key={p} className={p === summaryPage ? 'admin-btn' : 'admin-btn admin-btn--secondary'}
                                            style={{ padding: '0.25rem 0.5rem', minWidth: 26, fontSize: '0.72rem' }} onClick={() => setSummaryPage(p)}>{p}</button>
                                    ))}
                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.45rem', fontSize: '0.7rem' }}
                                        disabled={summaryPage >= summaryTotalPages} onClick={() => setSummaryPage(p => Math.min(summaryTotalPages, p + 1))}><FaChevronRight size={10} /></button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                        {monthlyTrend.length > 1 && (
                            <div className="admin-card" style={{ padding: '0.75rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <FaChartLine style={{ color: 'var(--primary)' }} /> Monthly Trend
                                </h4>
                                <ResponsiveContainer width="100%" height={180}>
                                    <LineChart data={monthlyTrend.map(([month, d]) => ({
                                        month: new Date(month + '-01').toLocaleDateString('default', { month: 'short', year: '2-digit' }),
                                        In: d.in,
                                        Out: d.out,
                                    }))}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                                        <Legend wrapperStyle={{ fontSize: 10 }} />
                                        <Line type="monotone" dataKey="In" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 4 }} />
                                        <Line type="monotone" dataKey="Out" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                        {categoryTotals.length > 0 && (
                            <div className="admin-card" style={{ padding: '0.75rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <FaChartPie style={{ color: 'var(--primary)' }} /> By Category
                                </h4>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie data={categoryTotals.slice(0, 6)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                                            {categoryTotals.slice(0, 6).map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} formatter={(v: number) => `RWF ${v.toLocaleString()}`} />
                                        <Legend wrapperStyle={{ fontSize: 9 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* TRANSACTIONS VIEW */}
            {view === 'transactions' && (
                <div className="admin-card">
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 28 }}></th>
                                    <th>Item</th>
                                    <th>Category</th>
                                    <th>Qty</th>
                                    <th>Unit Price</th>
                                    <th>Total</th>
                                    <th>Date</th>
                                    <th>Reference</th>
                                    <th style={{ width: 80 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map(entry => (
                                    <tr key={entry.id}>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                width: 24, height: 24, borderRadius: 6,
                                                background: entry.type === 'in' ? '#22c55e18' : '#ef444418',
                                                color: entry.type === 'in' ? '#22c55e' : '#ef4444',
                                                fontSize: '0.65rem',
                                            }}>
                                                {entry.type === 'in' ? <FaArrowDown /> : <FaArrowUp />}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{entry.item}</div>
                                        </td>
                                        <td style={{ fontSize: '0.75rem' }}>
                                            <span style={{
                                                padding: '0.15rem 0.45rem', borderRadius: 4,
                                                background: '#f0f0f0', color: '#555', fontSize: '0.7rem',
                                            }}>
                                                {categoryLabel(entry.category)}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.82rem' }}>
                                            {Number(entry.quantity).toLocaleString()} {entry.unit}
                                        </td>
                                        <td style={{ fontSize: '0.78rem', color: '#666' }}>
                                            RWF {Number(entry.unitPrice).toLocaleString()}
                                        </td>
                                        <td style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>
                                            RWF {Number(entry.totalCost).toLocaleString()}
                                        </td>
                                        <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', color: '#999' }}>
                                            {entry.date}{entry.time ? <span style={{ color: '#bbb', marginLeft: 4, fontSize: '0.72rem' }}>{entry.time}</span> : ''}
                                        </td>
                                        <td style={{ fontSize: '0.75rem', color: '#999' }}>{entry.reference || '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button onClick={() => openEdit(entry)}
                                                    style={{
                                                        padding: '0.2rem 0.4rem', borderRadius: 4,
                                                        border: '1px solid #ddd', background: 'transparent',
                                                        cursor: 'pointer', color: '#666', fontSize: '0.7rem',
                                                    }}><FaEdit size={10} /></button>
                                                <button onClick={() => remove(entry.id)}
                                                    style={{
                                                        padding: '0.2rem 0.4rem', borderRadius: 4,
                                                        border: '1px solid #ddd', background: 'transparent',
                                                        cursor: 'pointer', color: '#ef4444', fontSize: '0.7rem',
                                                    }}><FaTrash size={10} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!paginated.length && (
                                    <tr>
                                        <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#999' }}>
                                            <FaWarehouse size={36} style={{ opacity: 0.25, marginBottom: 10 }} />
                                            <div style={{ fontSize: '0.95rem' }}>No stock entries found</div>
                                            <span style={{ fontSize: '0.8rem' }}>Add your first stock item to start tracking inventory</span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', padding: '0.4rem 0', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: '0.78rem', color: '#999' }}>
                            Showing {paginated.length} of {filtered.length} entry{filtered.length !== 1 ? 'ies' : 'y'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ fontSize: '0.75rem', color: '#999' }}>Per page:</span>
                                <select className="form-select" style={{ width: 'auto', padding: '0.25rem 1.3rem 0.25rem 0.4rem', fontSize: '0.75rem' }}
                                    value={pageSize} onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}>
                                    {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                    <option value={0}>All</option>
                                </select>
                            </div>
                            {pageSize > 0 && totalPages > 1 && (
                                <div style={{ display: 'flex', gap: 2 }}>
                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.45rem', fontSize: '0.7rem' }}
                                        disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><FaChevronLeft size={10} /></button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                        <button key={p} className={p === page ? 'admin-btn' : 'admin-btn admin-btn--secondary'}
                                            style={{ padding: '0.25rem 0.5rem', minWidth: 26, fontSize: '0.72rem' }} onClick={() => setPage(p)}>{p}</button>
                                    ))}
                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.45rem', fontSize: '0.7rem' }}
                                        disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><FaChevronRight size={10} /></button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ADD / EDIT MODAL */}
            {showModal && (
                <div className="admin-modal-overlay" onClick={() => { if (!saving) { closeModal(); } }}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 520 }}>
                        <div className="admin-modal-header">
                            <h3><FaWarehouse style={{ marginRight: 8 }} />{editing ? 'Edit' : form.type === 'out' ? 'Add Stock Out' : 'Add Stock In'}</h3>
                            <button onClick={() => { if (!saving) { closeModal(); } }}><FaTimes /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as 'in' | 'out' }))} className="form-select">
                                        <option value="in">Stock In (Purchase)</option>
                                        <option value="out">Stock Out (Usage)</option>
                                    </select>
                                    {formErrors.type && <span style={{ color: '#ef4444', fontSize: '0.68rem' }}>{formErrors.type}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="form-select" style={{ flex: 1 }}>
                                            {dbCategories.length === 0 && <option value="">-- Loading --</option>}
                                            {dbCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                        {form.type === 'in' && (
                                            <button onClick={async () => {
                                                const name = prompt('Enter new category name:');
                                                if (!name || !name.trim()) return;
                                                try {
                                                    await categoriesService.create({ value: name.trim() });
                                                    await loadCategories();
                                                    showToast('Category created', 'success');
                                                } catch (err: any) {
                                                    showToast(err?.response?.data?.message || 'Failed to create category', 'error');
                                                }
                                            }}
                                                title="Create new category"
                                                style={{
                                                    padding: '0.3rem 0.6rem', borderRadius: 6, border: '1px dashed var(--primary)',
                                                    background: 'transparent', color: 'var(--primary)', cursor: 'pointer',
                                                    fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap',
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                }}>
                                                <FaPlus size={10} /> New
                                            </button>
                                        )}
                                    </div>
                                    {formErrors.category && <span style={{ color: '#ef4444', fontSize: '0.68rem' }}>{formErrors.category}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Item Name</label>
                                    <input value={form.item} onChange={e => { setForm(p => ({ ...p, item: e.target.value })); if (formErrors.item) setFormErrors(p => ({ ...p, item: '' })); }} className="form-input" placeholder="e.g. Portland Cement" style={{ borderColor: formErrors.item ? '#ef4444' : undefined }} />
                                    {formErrors.item && <span style={{ color: '#ef4444', fontSize: '0.68rem' }}>{formErrors.item}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Unit</label>
                                    <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} className="form-select">
                                        <option value="pieces">Pieces</option>
                                        <option value="bags">Bags</option>
                                        <option value="tons">Tons</option>
                                        <option value="kg">Kg</option>
                                        <option value="liters">Liters</option>
                                        <option value="meters">Meters</option>
                                        <option value="units">Units</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Quantity</label>
                                    <input type="number" value={form.quantity} onChange={e => { setForm(p => ({ ...p, quantity: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })); if (formErrors.quantity) setFormErrors(p => ({ ...p, quantity: '' })); }} className="form-input" placeholder="e.g. 100" style={{ borderColor: formErrors.quantity ? '#ef4444' : undefined }} />
                                    {formErrors.quantity && <span style={{ color: '#ef4444', fontSize: '0.68rem' }}>{formErrors.quantity}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Unit Price (RWF)</label>
                                    <input type="number" value={form.unitPrice} onChange={e => { setForm(p => ({ ...p, unitPrice: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })); if (formErrors.unitPrice) setFormErrors(p => ({ ...p, unitPrice: '' })); }} className="form-input" placeholder="e.g. 15000" style={{ borderColor: formErrors.unitPrice ? '#ef4444' : undefined }} />
                                    {formErrors.unitPrice && <span style={{ color: '#ef4444', fontSize: '0.68rem' }}>{formErrors.unitPrice}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input type="date" value={form.date} onChange={e => { setForm(p => ({ ...p, date: e.target.value })); if (formErrors.date) setFormErrors(p => ({ ...p, date: '' })); }} className="form-input" style={{ borderColor: formErrors.date ? '#ef4444' : undefined }} />
                                    {formErrors.date && <span style={{ color: '#ef4444', fontSize: '0.68rem' }}>{formErrors.date}</span>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Time</label>
                                    <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reference</label>
                                    <input value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} className="form-input" placeholder="Invoice or ref #" />
                                </div>
                                <div style={{ gridColumn: 'span 2' }} className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="form-textarea" rows={2} placeholder="Optional notes" />
                                </div>
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={closeModal} disabled={saving}>Cancel</button>
                            <button className="admin-btn" onClick={save} disabled={saving}>
                                {saving ? <><FaSpinner className="spin" /> Saving...</> : (editing ? 'Update' : `${form.type === 'out' ? 'Add Stock Out' : 'Add Stock In'}`)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockPage;
