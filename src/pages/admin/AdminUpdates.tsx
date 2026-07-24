import { useState, useEffect } from 'react';
import { FaNewspaper, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaEye, FaEyeSlash, FaSearch } from 'react-icons/fa';
import { updatesService, type Update, type CreateUpdateDto } from '../../services/updatesService';
import { useAuth } from '../../context/AuthContext';

const AdminUpdates = () => {
    const { user } = useAuth();
    const [items, setItems] = useState<Update[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState<CreateUpdateDto>({
        title: '',
        summary: '',
        content: '',
        image: '',
        category: '',
        author: '',
        readTime: '',
        isPublished: false,
    });

    const fetchItems = async () => {
        try {
            setLoading(true);
            const data = await updatesService.getAll();
            setItems(Array.isArray(data) ? data : []);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, []);

    const resetForm = () => {
        setForm({ title: '', summary: '', content: '', image: '', category: '', author: '', readTime: '', isPublished: false });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (item: Update) => {
        setForm({
            title: item.title,
            summary: item.summary || '',
            content: item.content || '',
            image: item.image || '',
            category: item.category || '',
            author: item.author || '',
            readTime: item.readTime || '',
            isPublished: item.isPublished,
        });
        setEditingId(item.id);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        try {
            if (editingId) {
                await updatesService.update(editingId, form);
            } else {
                await updatesService.create(form);
            }
            resetForm();
            fetchItems();
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Failed to save update');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this update?')) return;
        try {
            await updatesService.remove(id);
            fetchItems();
        } catch {
            alert('Failed to delete update');
        }
    };

    const handleTogglePublish = async (item: Update) => {
        try {
            await updatesService.update(item.id, { isPublished: !item.isPublished });
            fetchItems();
        } catch {
            alert('Failed to update publish status');
        }
    };

    const filtered = items.filter(i =>
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        (i.category || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <style>{`
                .upd-form-group { margin-bottom: 1rem; }
                .upd-form-group label { display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.35rem; }
                .upd-form-group input, .upd-form-group textarea, .upd-form-group select {
                    width: 100%; padding: 0.6rem 0.8rem; border: 1px solid var(--border-color); border-radius: 8px;
                    font-size: 0.85rem; background: var(--bg-body); color: var(--text-main); box-sizing: border-box;
                }
                .upd-form-group textarea { min-height: 100px; resize: vertical; }
                .upd-form-group input:focus, .upd-form-group textarea:focus, .upd-form-group select:focus {
                    outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
                }
                .upd-btn { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.82rem; font-weight: 700; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 0.4rem; }
                .upd-btn-primary { background: var(--primary); color: #fff; }
                .upd-btn-primary:hover { opacity: 0.9; }
                .upd-btn-secondary { background: var(--bg-body); color: var(--text-main); border: 1px solid var(--border-color); }
                .upd-btn-danger { background: #fee2e2; color: #dc2626; }
                .upd-btn-danger:hover { background: #fecaca; }
                .upd-table { width: 100%; border-collapse: collapse; }
                .upd-table th { text-align: left; padding: 0.7rem 0.8rem; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); border-bottom: 2px solid var(--border-color); letter-spacing: 0.05em; }
                .upd-table td { padding: 0.7rem 0.8rem; font-size: 0.85rem; border-bottom: 1px solid var(--border-color); color: var(--text-main); vertical-align: middle; }
                .upd-table tr:hover td { background: rgba(0,0,0,0.02); }
                .upd-badge { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 700; }
                .upd-badge-published { background: #dcfce7; color: #16a34a; }
                .upd-badge-draft { background: #fef3c7; color: #d97706; }
            `}</style>

            <div className="content-card" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FaNewspaper size={24} color="var(--primary)" />
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>Updates Management</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{items.length} update{items.length !== 1 ? 's' : ''} total</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <FaSearch style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }} />
                        <input
                            type="text"
                            placeholder="Search updates..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ padding: '0.5rem 0.8rem 0.5rem 2rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.82rem', width: '200px', background: 'var(--bg-body)', color: 'var(--text-main)' }}
                        />
                    </div>
                    <button className="upd-btn upd-btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
                        <FaPlus /> New Update
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="content-card" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
                            {editingId ? 'Edit Update' : 'Create New Update'}
                        </h3>
                        <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                            <FaTimes />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.5rem' }}>
                            <div className="upd-form-group">
                                <label>Title *</label>
                                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                            </div>
                            <div className="upd-form-group">
                                <label>Category</label>
                                <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Project Update, Company News" />
                            </div>
                            <div className="upd-form-group">
                                <label>Author</label>
                                <input type="text" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder={user?.firstName ? `${user.firstName} ${user.lastName}` : 'Author name'} />
                            </div>
                            <div className="upd-form-group">
                                <label>Read Time</label>
                                <input type="text" value={form.readTime} onChange={e => setForm({ ...form, readTime: e.target.value })} placeholder="e.g. 5 min read" />
                            </div>
                            <div className="upd-form-group" style={{ gridColumn: '1 / -1' }}>
                                <label>Image URL</label>
                                <input type="text" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
                            </div>
                            <div className="upd-form-group" style={{ gridColumn: '1 / -1' }}>
                                <label>Summary</label>
                                <textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} rows={2} placeholder="Brief summary for the card..." />
                            </div>
                            <div className="upd-form-group" style={{ gridColumn: '1 / -1' }}>
                                <label>Content</label>
                                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={6} placeholder="Full article content..." />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <button type="button" className="upd-btn upd-btn-secondary" onClick={resetForm}>Cancel</button>
                            <button type="submit" className="upd-btn upd-btn-primary">
                                {editingId ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="content-card" style={{ padding: '1.5rem 2rem', overflow: 'auto' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <FaNewspaper size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No updates found.</p>
                    </div>
                ) : (
                    <table className="upd-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Author</th>
                                <th>Status</th>
                                <th>Published</th>
                                <th>Created</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(item => (
                                <tr key={item.id}>
                                    <td style={{ fontWeight: 600, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</td>
                                    <td>{item.category || '—'}</td>
                                    <td>{item.author || '—'}</td>
                                    <td>
                                        <span className={`upd-badge ${item.isPublished ? 'upd-badge-published' : 'upd-badge-draft'}`}>
                                            {item.isPublished ? <><FaEye size={10} /> Published</> : <><FaEyeSlash size={10} /> Draft</>}
                                        </span>
                                    </td>
                                    <td>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : '—'}</td>
                                    <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleTogglePublish(item)} title={item.isPublished ? 'Unpublish' : 'Publish'}
                                                style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', border: 'none', cursor: 'pointer', background: item.isPublished ? '#fef3c7' : '#dcfce7', color: item.isPublished ? '#d97706' : '#16a34a', fontSize: '0.75rem' }}>
                                                {item.isPublished ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                            <button onClick={() => handleEdit(item)} title="Edit"
                                                style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', border: 'none', cursor: 'pointer', background: '#e0e7ff', color: '#4f46e5', fontSize: '0.75rem' }}>
                                                <FaEdit />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} title="Delete"
                                                style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem' }}>
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminUpdates;
