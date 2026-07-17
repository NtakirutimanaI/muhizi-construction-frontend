import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaEdit, FaTimes, FaSave, FaNewspaper, FaUpload } from 'react-icons/fa';
import type { Profile } from '../../../services/profileService';
import { profileService } from '../../../services/profileService';
import { uploadService } from '../../../services/uploadService';
import { useToast } from '../../../context/ToastContext';
import { slugify } from '../../../data/newsData';

interface NewsTabProps {
    profile: Profile;
    onUpdate: (updatedProfile: Profile) => void;
}

interface NewsPost {
    slug: string;
    title: string;
    date: string;
    category: string;
    summary: string;
    image: string;
    author: string;
    comments: number;
    readTime: string;
    content: string[];
}

const EMPTY_FORM = {
    title: '',
    category: '',
    summary: '',
    image: '',
    author: '',
    readTime: '',
    comments: 0,
    content: '',
};

const NewsTab: React.FC<NewsTabProps> = ({ profile, onUpdate }) => {
    const { showToast } = useToast();
    const [posts, setPosts] = useState<NewsPost[]>(profile.pageContent?.news || []);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const startNew = () => { setEditingIndex(-1); setForm(EMPTY_FORM); };
    const startEdit = (i: number) => {
        const p = posts[i];
        setEditingIndex(i);
        setForm({
            title: p.title,
            category: p.category,
            summary: p.summary,
            image: p.image,
            author: p.author,
            readTime: p.readTime,
            comments: p.comments,
            content: (p.content || []).join('\n\n'),
        });
    };
    const cancelEdit = () => { setEditingIndex(null); setForm(EMPTY_FORM); };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { showToast('Image must be smaller than 2MB', 'error'); return; }
        setUploading(true);
        try {
            const uploaded = await uploadService.uploadFile(file);
            setForm(prev => ({ ...prev, image: uploaded.secureUrl }));
        } catch {
            showToast('Failed to upload image', 'error');
        } finally {
            setUploading(false);
        }
    };

    const savePost = async () => {
        if (!form.title.trim()) { showToast('Title is required', 'error'); return; }
        setLoading(true);

        const existingSlugs = posts
            .filter((_, i) => i !== editingIndex)
            .map(p => p.slug);
        let slug = slugify(form.title);
        let suffix = 2;
        const base = slug;
        while (existingSlugs.includes(slug)) {
            slug = `${base}-${suffix}`;
            suffix += 1;
        }

        const isExisting = editingIndex !== null && editingIndex !== -1;
        const date = isExisting ? posts[editingIndex as number].date : new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase();
        const postToSave: NewsPost = {
            slug: isExisting ? posts[editingIndex as number].slug : slug,
            title: form.title,
            category: form.category || 'General',
            summary: form.summary,
            image: form.image,
            author: form.author || 'Admin',
            readTime: form.readTime || '4 min read',
            comments: Number(form.comments) || 0,
            content: form.content.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean),
            date,
        };

        const updated = [...posts];
        if (editingIndex === -1) updated.unshift(postToSave);
        else if (editingIndex !== null) updated[editingIndex] = postToSave;

        try {
            const pc = { ...(profile.pageContent || {}), news: updated };
            const result = await profileService.updateProfile({ pageContent: pc });
            setPosts(result.pageContent?.news || []);
            onUpdate(result);
            cancelEdit();
            showToast('Article saved', 'success');
        } catch (error: any) {
            console.error('Failed to save article', error);
            showToast(error?.response?.data?.message || error?.message || 'Failed to save', 'error');
        } finally {
            setLoading(false);
        }
    };

    const deletePost = async (i: number) => {
        if (!window.confirm('Delete this article?')) return;
        setLoading(true);
        const updated = posts.filter((_, idx) => idx !== i);
        try {
            const pc = { ...(profile.pageContent || {}), news: updated };
            const result = await profileService.updateProfile({ pageContent: pc });
            setPosts(result.pageContent?.news || []);
            onUpdate(result);
            showToast('Article deleted', 'success');
        } catch (error: any) {
            console.error('Failed to delete article', error);
            showToast(error?.response?.data?.message || error?.message || 'Failed to delete', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>News &amp; Articles ({posts.length})</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Shown on the homepage News section, the /news list, and each article page.
                        {posts.length === 0 && ' The public site currently shows built-in sample articles until you add your own here.'}
                    </p>
                </div>
                <button onClick={startNew} disabled={editingIndex !== null} className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                    <FaPlus /> Add Article
                </button>
            </div>

            <AnimatePresence>
                {editingIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="content-card"
                        style={{ border: '2px solid var(--primary)', padding: '1.5rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{editingIndex === -1 ? 'New Article' : 'Edit Article'}</h4>
                            <button onClick={cancelEdit} style={{ color: 'var(--text-muted)' }}><FaTimes /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Title *</label>
                                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="form-input" placeholder="e.g., Logistics, Safety" />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Summary</label>
                            <textarea value={form.summary} onChange={e => setForm(p => ({ ...p, summary: e.target.value }))} className="form-textarea" rows={2} placeholder="Short teaser shown on cards" />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Cover Image</label>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {form.image ? (
                                    <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '2px solid var(--border-color)', flexShrink: 0 }}>
                                        <img src={form.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ) : (
                                    <div style={{ width: 80, height: 80, borderRadius: 8, border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0 }}>No image</div>
                                )}
                                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="admin-icon-btn" style={{ width: 'auto', padding: '0.5rem 1rem', gap: '8px', border: '1px solid var(--border-color)' }}>
                                    <FaUpload /> {uploading ? 'Uploading...' : form.image ? 'Replace Image' : 'Upload Image'}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Author</label>
                                <input value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} className="form-input" placeholder="Admin" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Read Time</label>
                                <input value={form.readTime} onChange={e => setForm(p => ({ ...p, readTime: e.target.value }))} className="form-input" placeholder="4 min read" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Comments Count</label>
                                <input type="number" min={0} value={form.comments} onChange={e => setForm(p => ({ ...p, comments: Number(e.target.value) }))} className="form-input" />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Article Content</label>
                            <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} className="form-textarea" rows={8} placeholder="Write each paragraph, separated by a blank line." />
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Separate paragraphs with a blank line.</p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={cancelEdit} className="admin-icon-btn" style={{ fontSize: '0.9rem', width: 'auto', padding: '0.5rem 1rem' }} disabled={loading}>Cancel</button>
                            <button onClick={savePost} className="btn-primary" disabled={loading || uploading}>
                                {loading || uploading ? 'Saving...' : <><FaSave /> Save Article</>}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {posts.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        <FaNewspaper size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                        <p>No articles yet. Click "Add Article" to publish your first one.</p>
                    </div>
                )}
                {posts.map((post, index) => (
                    <div key={post.slug} className="content-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--border-color)' }}>
                            {post.image ? (
                                <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: 'var(--bg-body)' }} />
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>{post.title}</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{post.category} · {post.date}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => startEdit(index)} className="admin-icon-btn" title="Edit"><FaEdit /></button>
                            <button onClick={() => deletePost(index)} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }} title="Delete"><FaTrash /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NewsTab;
