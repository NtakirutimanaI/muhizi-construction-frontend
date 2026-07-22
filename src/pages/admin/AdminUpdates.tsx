import { useState, useEffect, useRef } from 'react';
import { FaNewspaper, FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaSearch, FaTimes, FaUpload } from 'react-icons/fa';
import { updatesService, type Update, type CreateUpdateDto } from '../../services/updatesService';
import { useAuth } from '../../context/AuthContext';

const AdminUpdates = () => {
    const { user } = useAuth();
    const [items, setItems] = useState<Update[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
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

    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [showModal]);

    const openCreate = () => {
        setForm({ title: '', summary: '', content: '', image: '', category: '', author: user?.firstName ? `${user.firstName} ${user.lastName}` : '', readTime: '', isPublished: false });
        setEditingId(null);
        setShowModal(true);
    };

    const openEdit = (item: Update) => {
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
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        try {
            setSaving(true);
            if (editingId) {
                await updatesService.update(editingId, form);
            } else {
                await updatesService.create(form);
            }
            closeModal();
            fetchItems();
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Failed to save update');
        } finally {
            setSaving(false);
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

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '0.65rem 0.85rem', border: '1px solid var(--border-color)', borderRadius: '8px',
        fontSize: '0.85rem', background: 'var(--bg-body)', color: 'var(--text-main)', boxSizing: 'border-box',
        fontFamily: 'inherit',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem',
    };

    return (
        <div>
            <style>{`
                .upd-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
                    z-index: 9998; display: flex; align-items: center; justify-content: center;
                    animation: updFadeIn 0.2s ease;
                }
                .upd-modal {
                    background: var(--bg-card, #fff); border-radius: 16px; width: 94vw; max-width: 680px;
                    max-height: 90vh; display: flex; flex-direction: column; overflow: hidden;
                    box-shadow: 0 25px 60px rgba(0,0,0,0.25);
                    animation: updSlideIn 0.25s ease;
                }
                .upd-modal-header {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color);
                }
                .upd-modal-header h3 { margin: 0; font-size: 1.05rem; font-weight: 800; color: var(--text-main); }
                .upd-modal-close {
                    width: 32px; height: 32px; border-radius: 8px; border: none; background: var(--bg-body);
                    color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center;
                    transition: all 0.15s;
                }
                .upd-modal-close:hover { background: #fee2e2; color: #dc2626; }
                .upd-modal-body {
                    padding: 1.5rem; overflow-y: auto; flex: 1;
                }
                .upd-modal-footer {
                    display: flex; gap: 0.5rem; justify-content: flex-end; padding: 1rem 1.5rem;
                    border-top: 1px solid var(--border-color); background: var(--bg-body);
                }
                .upd-modal-footer button {
                    padding: 0.55rem 1.25rem; border-radius: 8px; font-size: 0.82rem; font-weight: 700;
                    cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 0.4rem;
                    font-family: inherit;
                }
                .upd-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1.25rem; }
                .upd-form-full { grid-column: 1 / -1; }
                .upd-toggle-wrap { display: flex; align-items: center; gap: 0.6rem; cursor: pointer; user-select: none; }
                .upd-toggle {
                    width: 40px; height: 22px; border-radius: 11px; position: relative; transition: background 0.2s;
                    border: none; cursor: pointer; padding: 0;
                }
                .upd-toggle::after {
                    content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px;
                    border-radius: 50%; background: #fff; transition: transform 0.2s;
                }
                .upd-toggle.on { background: var(--primary); }
                .upd-toggle.on::after { transform: translateX(18px); }
                .upd-toggle.off { background: #d1d5db; }
                .upd-btn { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.82rem; font-weight: 700; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 0.4rem; font-family: inherit; }
                .upd-btn-primary { background: var(--primary); color: #fff; }
                .upd-btn-primary:hover { opacity: 0.9; }
                .upd-btn-secondary { background: var(--bg-body); color: var(--text-main); border: 1px solid var(--border-color); }
                .upd-table { width: 100%; border-collapse: collapse; }
                .upd-table th { text-align: left; padding: 0.7rem 0.8rem; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); border-bottom: 2px solid var(--border-color); letter-spacing: 0.05em; }
                .upd-table td { padding: 0.7rem 0.8rem; font-size: 0.85rem; border-bottom: 1px solid var(--border-color); color: var(--text-main); vertical-align: middle; }
                .upd-table tr:hover td { background: rgba(0,0,0,0.02); }
                .upd-badge { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 700; }
                .upd-badge-published { background: #dcfce7; color: #16a34a; }
                .upd-badge-draft { background: #fef3c7; color: #d97706; }
                @keyframes updFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes updSlideIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                @media (max-width: 640px) {
                    .upd-modal { width: 100vw; max-width: 100vw; max-height: 100vh; border-radius: 0; height: 100vh; }
                    .upd-form-row { grid-template-columns: 1fr; }
                }
            `}</style>

            {/* Header Bar */}
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
                    <button className="upd-btn upd-btn-primary" onClick={openCreate}>
                        <FaPlus /> New Update
                    </button>
                </div>
            </div>

            {/* Table */}
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
                                            <button onClick={() => openEdit(item)} title="Edit"
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

            {/* Modal */}
            {showModal && (
                <div className="upd-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="upd-modal" ref={modalRef}>
                        <div className="upd-modal-header">
                            <h3>{editingId ? 'Edit Update' : 'Create New Update'}</h3>
                            <button className="upd-modal-close" onClick={closeModal}><FaTimes size={14} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                            <div className="upd-modal-body">
                                <div className="upd-form-row">
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={labelStyle}>Title *</label>
                                        <input style={inputStyle} type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Enter update title" />
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={labelStyle}>Category</label>
                                        <input style={inputStyle} type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Project Update, Company News" />
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={labelStyle}>Author</label>
                                        <input style={inputStyle} type="text" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="Author name" />
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={labelStyle}>Read Time</label>
                                        <input style={inputStyle} type="text" value={form.readTime} onChange={e => setForm({ ...form, readTime: e.target.value })} placeholder="e.g. 5 min read" />
                                    </div>
                                    <div className="upd-form-full" style={{ marginBottom: '1rem' }}>
                                        <label style={labelStyle}>Image URL</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input style={{ ...inputStyle, flex: 1 }} type="text" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://example.com/image.jpg" />
                                            {form.image && (
                                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                                                    <img src={form.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="upd-form-full" style={{ marginBottom: '1rem' }}>
                                        <label style={labelStyle}>Summary</label>
                                        <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} placeholder="Brief summary for the news card..." />
                                    </div>
                                    <div className="upd-form-full" style={{ marginBottom: '1rem' }}>
                                        <label style={labelStyle}>Content</label>
                                        <textarea style={{ ...inputStyle, minHeight: '130px', resize: 'vertical' }} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Full article content..." />
                                    </div>
                                    <div className="upd-form-full" style={{ marginBottom: '0.5rem' }}>
                                        <label
                                            className="upd-toggle-wrap"
                                            onClick={() => setForm({ ...form, isPublished: !form.isPublished })}
                                        >
                                            <span className={`upd-toggle ${form.isPublished ? 'on' : 'off'}`} />
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                                {form.isPublished ? 'Published — Visible on website & client panel' : 'Draft — Not visible publicly'}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="upd-modal-footer">
                                <button type="button" style={{ background: 'var(--bg-body)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" style={{ background: 'var(--primary)', color: '#fff' }} disabled={saving}>
                                    <FaUpload size={12} />
                                    {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUpdates;
