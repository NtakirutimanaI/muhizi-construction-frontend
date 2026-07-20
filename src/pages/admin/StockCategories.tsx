import { useState, useEffect, useMemo } from 'react';
import { FaTag, FaPlus, FaTimes, FaSpinner, FaTrash, FaCheck, FaEdit, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { categoriesService, type Category } from '../../services/categoriesService';
import { useToast } from '../../context/ToastContext';
import { loadPageCache, savePageCache } from '../../utils/pageCache';

const PAGE_SIZES = [5, 10, 15, 20];

const StockCategories = () => {
    const { showToast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);
    const [newCat, setNewCat] = useState('');
    const [editingCat, setEditingCat] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const totalPages = pageSize ? Math.ceil(categories.length / pageSize) : 1;
    const paginated = useMemo(() => {
        if (!pageSize) return categories;
        const start = (page - 1) * pageSize;
        return categories.slice(start, start + pageSize);
    }, [categories, page, pageSize]);

    useEffect(() => {
        const tp = pageSize ? Math.ceil(categories.length / pageSize) : 1;
        if (page > tp) setPage(tp || 1);
    }, [categories.length, pageSize]);

    const load = async () => {
        const cached = loadPageCache<{ categories: Category[] }>('pg_stock_categories');
        if (cached) {
            setCategories(cached.categories || []);
        }
        try {
            const res = await categoriesService.getAll();
            const freshCategories = res.data || [];
            setCategories(freshCategories);
            savePageCache('pg_stock_categories', { categories: freshCategories });
        } catch { }
    };

    useEffect(() => { load(); }, []);

    const addCategory = async () => {
        const trimmed = newCat.trim();
        if (!trimmed) { showToast('Enter a category name', 'error'); return; }
        setSaving(true);
        try {
            await categoriesService.create({ value: trimmed });
            showToast(`Category "${trimmed}" created`, 'success');
            setNewCat('');
            setAdding(false);
            load();
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to create category', 'error');
        }
        setSaving(false);
    };

    const startRename = (cat: Category) => {
        setEditingCat(cat.id);
        setEditValue(cat.label);
    };

    const confirmRename = async (cat: Category) => {
        const trimmed = editValue.trim();
        if (!trimmed) { showToast('Enter a category name', 'error'); return; }
        if (cat.isBuiltin) { showToast('Cannot rename built-in category', 'error'); setEditingCat(null); return; }
        setSaving(true);
        try {
            await categoriesService.update(cat.id, { label: trimmed, value: trimmed });
            showToast('Category renamed', 'success');
            setEditingCat(null);
            setEditValue('');
            load();
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to rename', 'error');
        }
        setSaving(false);
    };

    const removeCategory = async (cat: Category) => {
        if (cat.isBuiltin) { showToast('Cannot delete built-in category', 'error'); return; }
        if (!window.confirm(`Delete "${cat.label}"?`)) return;
        setSaving(true);
        try {
            await categoriesService.delete(cat.id);
            showToast('Category deleted', 'success');
            load();
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to delete', 'error');
        }
        setSaving(false);
    };

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0, marginBottom: '0.2rem' }}>
                        <FaTag style={{ color: '#7c3aed' }} /> Categories
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: '#999' }}>Manage stock categories — {categories.length} total</span>
                </div>
                {!adding && (
                    <button onClick={() => setAdding(true)}
                        style={{
                            padding: '0.4rem 0.8rem', borderRadius: 6, border: 'none',
                            background: '#7c3aed', color: '#fff', cursor: 'pointer',
                            fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                        <FaPlus size={10} /> Add New Category
                    </button>
                )}
            </div>

            {adding && (
                <div className="admin-card" style={{ padding: '0.8rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <FaTag size={14} style={{ color: '#7c3aed' }} />
                    <input value={newCat} onChange={e => setNewCat(e.target.value)}
                        placeholder="e.g. Plumbing Materials"
                        style={{
                            flex: 1, minWidth: 200, padding: '0.4rem 0.6rem', borderRadius: 6,
                            border: '1px solid var(--border-color)', fontSize: '0.85rem',
                            background: 'var(--bg-body)', color: 'var(--text-main)',
                        }}
                        onKeyDown={e => { if (e.key === 'Enter') addCategory(); }} autoFocus />
                    <button onClick={addCategory} disabled={saving}
                        style={{
                            padding: '0.4rem 0.7rem', borderRadius: 6, border: 'none',
                            background: '#22c55e', color: '#fff', cursor: 'pointer',
                            fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                        }}><FaCheck size={10} /> Save</button>
                    <button onClick={() => { setAdding(false); setNewCat(''); }}
                        style={{
                            padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #ddd',
                            background: 'transparent', cursor: 'pointer', color: '#999', fontSize: '0.75rem',
                        }}><FaTimes size={12} /></button>
                </div>
            )}

            <div className="admin-card">
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: 28 }}>#</th>
                                <th>Category</th>
                                <th>Type</th>
                                <th style={{ width: 90 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((cat, i) => (
                                <tr key={cat.id}>
                                    <td style={{ fontSize: '0.75rem', color: '#999' }}>{(page - 1) * (pageSize || categories.length) + i + 1}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{
                                                width: 26, height: 26, borderRadius: 6,
                                                background: cat.isBuiltin ? 'var(--primary)' : '#7c3aed',
                                                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem',
                                            }}><FaTag size={10} /></span>
                                            {editingCat === cat.id ? (
                                                <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                                                    <input value={editValue} onChange={e => setEditValue(e.target.value)}
                                                        className="form-input" style={{ padding: '0.25rem 0.4rem', fontSize: '0.8rem', flex: 1, minWidth: 150 }}
                                                        onKeyDown={e => { if (e.key === 'Enter') confirmRename(cat); if (e.key === 'Escape') setEditingCat(null); }} autoFocus />
                                                    <button onClick={() => confirmRename(cat)} disabled={saving}
                                                        style={{ padding: '0.2rem 0.4rem', borderRadius: 4, border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontSize: '0.65rem' }}><FaCheck size={10} /></button>
                                                    <button onClick={() => setEditingCat(null)}
                                                        style={{ padding: '0.2rem 0.4rem', borderRadius: 4, border: '1px solid #ddd', background: 'transparent', cursor: 'pointer', color: '#999', fontSize: '0.65rem' }}><FaTimes size={10} /></button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{cat.label}</div>
                                                    <div style={{ fontSize: '0.68rem', color: '#bbb' }}>{cat.value}</div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '0.15rem 0.5rem', borderRadius: 4,
                                            background: cat.isBuiltin ? '#e0e7ff' : '#f3e8ff',
                                            color: cat.isBuiltin ? '#4338ca' : '#7c3aed',
                                            fontSize: '0.68rem', fontWeight: 600,
                                        }}>
                                            {cat.isBuiltin ? 'Built-in' : 'Custom'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button onClick={() => startRename(cat)}
                                                style={{
                                                    padding: '0.2rem 0.4rem', borderRadius: 4,
                                                    border: '1px solid #ddd', background: 'transparent',
                                                    cursor: 'pointer', color: '#666', fontSize: '0.7rem',
                                                }} title="Rename"><FaEdit size={10} /></button>
                                            <button onClick={() => removeCategory(cat)}
                                                style={{
                                                    padding: '0.2rem 0.4rem', borderRadius: 4,
                                                    border: '1px solid #ddd', background: 'transparent',
                                                    cursor: 'pointer', color: '#ef4444', fontSize: '0.7rem',
                                                }} title="Delete"><FaTrash size={10} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', padding: '0.4rem 0', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: '0.78rem', color: '#999' }}>
                        Showing {pageSize ? Math.min(pageSize, categories.length - (page - 1) * pageSize) : categories.length} of {categories.length} categor{ categories.length !== 1 ? 'ies' : 'y' }
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
        </div>
    );
};

export default StockCategories;
