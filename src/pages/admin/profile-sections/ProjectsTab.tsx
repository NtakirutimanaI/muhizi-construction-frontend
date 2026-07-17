import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaGithub, FaGlobe, FaUpload } from 'react-icons/fa';
import type { Profile } from '../../../services/profileService';
import { profileService } from '../../../services/profileService';
import { uploadService } from '../../../services/uploadService';

interface ProjectsTabProps {
    profile: Profile;
    onUpdate: (updatedProfile: Profile) => void;
    searchQuery?: string;
}

const ProjectsTab: React.FC<ProjectsTabProps> = ({ profile, onUpdate, searchQuery = '' }) => {
    const [projects, setProjects] = useState(profile.projects || []);
    const [filter, setFilter] = useState<string>('All');

    // Edit State
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // GitHub Import State
    const [showGithubImport, setShowGithubImport] = useState(false);
    const [githubRepos, setGithubRepos] = useState<any[]>([]);
    const [loadingGithub, setLoadingGithub] = useState(false);

    // Image Upload Ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    const categories = ['Backend', 'Frontend', 'UI/UX', 'Fullstack', 'Other'];

    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('Image must be smaller than 2MB');
                return;
            }
            setUploading(true);
            try {
                const uploaded = await uploadService.uploadFile(file);
                setEditForm((prev: any) => ({ ...prev, imageUrl: uploaded.secureUrl }));
            } catch {
                alert('Failed to upload image');
            } finally {
                setUploading(false);
            }
        }
    };

    const filteredProjects = projects.filter((p: any) => {
        const matchesCategory = filter === 'All' || p.category === filter;
        const query = searchQuery.toLowerCase();
        const matchesSearch = !query ||
            p.name.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query) ||
            (p.technologies && p.technologies.some((t: string) => t.toLowerCase().includes(query)));

        return matchesCategory && matchesSearch;
    });

    // --- GitHub Import Logic ---
    const fetchGithubRepos = async () => {
        setLoadingGithub(true);
        try {
            let username = profile.socialLinks?.github || '';
            if (username.includes('github.com/')) {
                username = username.split('github.com/')[1].replace('/', '');
            }
            if (!username) {
                alert('Please set your GitHub URL in General tab first.');
                setLoadingGithub(false);
                return;
            }

            const repos = await profileService.getGithubRepos(username);
            setGithubRepos(repos);
            setShowGithubImport(true);
        } catch (e) {
            console.error(e);
            alert('Failed to fetch GitHub repos. Check your username/connection.');
        } finally {
            setLoadingGithub(false);
        }
    };

    const importRepo = (repo: any) => {
        setEditForm({
            name: repo.name,
            description: repo.description || '',
            url: repo.homepage || '',
            githubUrl: repo.html_url,
            technologies: [repo.language].filter(Boolean),
            imageUrl: '',
            featured: false,
            category: 'Other',
            effectiveness: 50, // Default start
            published: false,
            type: 'Open Source',
            role: 'Developer'
        });
        setEditingIndex(-1); // New item logic
        setShowGithubImport(false);
    };

    // --- CRUD Logic ---
    const startNew = () => {
        setEditingIndex(-1);
        setEditForm({
            name: '',
            description: '',
            technologies: [],
            url: '',
            githubUrl: '',
            imageUrl: '',
            location: '',
            featured: false,
            category: 'Other',
            effectiveness: 0,
            published: false,
            type: '',
            role: ''
        });
    };

    const startEdit = (index: number) => {
        const projectToEdit = filteredProjects[index];
        const originalIndex = projects.indexOf(projectToEdit);

        setEditingIndex(originalIndex);
        setEditForm({ ...projectToEdit });
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditForm(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditForm((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleTechChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const techs = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
        setEditForm((prev: any) => ({ ...prev, technologies: techs }));
    };

    const saveProject = async () => {
        setLoading(true);
        let updatedProjects = [...projects];

        if (editingIndex === -1) {
            updatedProjects.push(editForm);
        } else if (editingIndex !== null) {
            updatedProjects[editingIndex] = editForm;
        }

        console.log('Attempting to save project...', { editForm, updatedProjects });

        try {
            // Only send the projects array to avoid validation issues
            console.log('Sending update request...');
            const result = await profileService.updateProfile({ projects: updatedProjects });
            console.log('Update successful:', result);
            setProjects(result.projects);
            onUpdate(result);
            cancelEdit();

            // Show success message
            alert('✅ Project Saved');
        } catch (error: any) {
            console.error('SAVE ERROR:', error);
            console.error('Error details:', {
                message: error?.message,
                response: error?.response,
                status: error?.response?.status,
                data: error?.response?.data
            });

            // More detailed error message
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save project';
            if (error?.response?.data?.errors) {
                console.error('Validation errors:', error.response.data.errors);
            }
            if (error?.response?.data?.message) {
                console.error('Server message:', error.response.data.message);
            }
            alert(`❌ Failed to save project: ${errorMessage}`);
        } finally {
            console.log('Resetting loading state...');
            setLoading(false);
        }
    };

    const deleteProject = async (index: number) => {
        if (!window.confirm('Delete this project?')) return;
        setLoading(true);
        const updatedProjects = projects.filter((_: any, i: number) => i !== index);

        try {
            // Only send the projects array
            const result = await profileService.updateProfile({ projects: updatedProjects });
            setProjects(result.projects);
            onUpdate(result);

            // Show success message
            alert('✅ Project Deleted');
        } catch (error: any) {
            console.error('Failed to delete project', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete project';
            alert(`❌ Failed to delete project: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    // Helper for effectiveness color
    const getEffectivenessColor = (score: number) => {
        if (score < 50) return 'var(--primary-red)';
        if (score < 80) return 'var(--primary)';
        return 'var(--primary-teal)'; // Success
    };

    const isPublishable = (editForm?.effectiveness || 0) >= 80;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Projects ({projects.length})</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Manage and classify your portfolio projects</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={fetchGithubRepos} disabled={loadingGithub} className="admin-icon-btn" style={{ width: 'auto', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', gap: '8px' }}>
                        <FaGithub /> {loadingGithub ? 'Fetching...' : 'Check GitHub'}
                    </button>
                    <button onClick={startNew} disabled={editingIndex !== null} className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                        <FaPlus /> Manual Add
                    </button>
                </div>
            </div>

            {/* Categories Tabs */}
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                {['All', ...categories].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            border: 'none',
                            background: filter === cat ? 'var(--text-main)' : 'transparent',
                            color: filter === cat ? 'var(--bg-body)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* GitHub Import Modal */}
            <AnimatePresence>
                {showGithubImport && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="content-card"
                            style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
                        >
                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-white)' }}>
                                <h3 style={{ fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}><FaGithub /> Select Repository to Import</h3>
                                <button onClick={() => setShowGithubImport(false)} style={{ color: 'var(--text-muted)' }}><FaTimes /></button>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: 'var(--bg-body)' }}>
                                {githubRepos.map((repo: any) => (
                                    <div key={repo.id} style={{
                                        padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px',
                                        marginBottom: '0.8rem', background: 'var(--bg-white)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 700, color: 'var(--primary-teal)' }}>{repo.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{repo.description}</div>
                                            {repo.language && <span style={{ fontSize: '0.75rem', background: 'var(--bg-body)', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>{repo.language}</span>}
                                        </div>
                                        <button onClick={() => importRepo(repo)} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>Import</button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Editor Main */}
            <AnimatePresence>
                {editingIndex !== null && editForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="content-card"
                        style={{ border: '2px solid var(--primary)', marginBottom: '2rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                                {editingIndex === -1 ? 'New Project' : 'Edit Project'}
                            </h4>
                            <button onClick={cancelEdit} style={{ color: 'var(--text-muted)' }}>
                                <FaTimes />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Project Name</label>
                                <input name="name" value={editForm.name} onChange={handleFormChange} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select name="category" value={editForm.category || 'Other'} onChange={handleFormChange} className="form-select">
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <input
                                    name="type"
                                    value={editForm.type || ''}
                                    onChange={handleFormChange}
                                    className="form-input"
                                    placeholder="e.g., Client Project, Personal, Open Source"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <input
                                    name="role"
                                    value={editForm.role || ''}
                                    onChange={handleFormChange}
                                    className="form-input"
                                    placeholder="e.g., Lead Developer, Solo Developer"
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Location</label>
                            <input
                                name="location"
                                value={editForm.location || ''}
                                onChange={handleFormChange}
                                className="form-input"
                                placeholder="e.g., Kigali, Rwanda"
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                                Shown under the project name on the public site.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Live URL</label>
                                <input name="url" value={editForm.url || ''} onChange={handleFormChange} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">GitHub URL</label>
                                <input name="githubUrl" value={editForm.githubUrl || ''} onChange={handleFormChange} className="form-input" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Project Image</label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />

                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                {/* Image Preview */}
                                {editForm.imageUrl && (
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                        border: '2px solid var(--border-color)'
                                    }}>
                                        <img
                                            src={editForm.imageUrl}
                                            alt="Preview"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Error'; }}
                                        />
                                    </div>
                                )}

                                {/* Upload/Replace Button */}
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="admin-icon-btn"
                                        style={{
                                            width: 'auto',
                                            padding: '0.6rem 1rem',
                                            gap: '8px',
                                            fontSize: '0.85rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: editForm.imageUrl ? 'var(--primary)' : 'transparent',
                                            color: editForm.imageUrl ? '#000' : 'inherit'
                                        }}
                                    >
                                        <FaUpload /> {editForm.imageUrl ? 'Replace Image' : 'Upload from PC'}
                                    </button>

                                    {/* Remove Image Button */}
                                    {editForm.imageUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setEditForm((prev: any) => ({ ...prev, imageUrl: '' }))}
                                            className="admin-icon-btn"
                                            style={{
                                                width: 'auto',
                                                padding: '0.6rem 1rem',
                                                gap: '8px',
                                                fontSize: '0.85rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--primary-red)',
                                                color: 'var(--primary-red)'
                                            }}
                                        >
                                            <FaTimes /> Remove Image
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* URL Input */}
                            <input
                                name="imageUrl"
                                value={editForm.imageUrl || ''}
                                onChange={handleFormChange}
                                className="form-input"
                                placeholder="Or paste image URL: https://example.com/image.jpg"
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                Upload an image from your PC (max 2MB) or paste a direct URL
                            </p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea name="description" value={editForm.description} onChange={handleFormChange} className="form-textarea" rows={3} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Technologies (Comma separated)</label>
                            <input
                                name="technologies"
                                value={Array.isArray(editForm.technologies) ? editForm.technologies.join(', ') : editForm.technologies}
                                onChange={handleTechChange}
                                className="form-input"
                            />
                        </div>

                        {/* Effectiveness Meter */}
                        <div style={{ padding: '1rem', background: 'var(--bg-body)', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Effectiveness / Readiness</span>
                                <span style={{ fontWeight: 'bold', color: isPublishable ? 'var(--primary-teal)' : 'var(--primary-red)' }}>
                                    {editForm.effectiveness || 0}%
                                </span>
                            </label>
                            <input
                                type="range"
                                min="0" max="100"
                                name="effectiveness"
                                value={editForm.effectiveness || 0}
                                onChange={(e) => setEditForm((prev: any) => ({ ...prev, effectiveness: parseInt(e.target.value) }))}
                                style={{ width: '100%', height: '8px', borderRadius: '4px', cursor: 'pointer', accentColor: isPublishable ? 'var(--primary-teal)' : 'var(--primary-red)' }}
                            />
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {isPublishable
                                    ? "✅ Project is ready to be published!"
                                    : "⚠️ Improve effectiveness to at least 80% to enable publishing."}
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label mb-1">Visibility</label>
                                {isPublishable ? (
                                    <button
                                        onClick={() => setEditForm((prev: any) => ({ ...prev, published: !prev.published }))}
                                        style={{
                                            width: '100%', padding: '0.8rem', borderRadius: '6px', fontWeight: 700,
                                            background: editForm.published ? 'var(--primary-teal)' : 'transparent',
                                            color: editForm.published ? '#fff' : 'var(--text-muted)',
                                            border: `1px solid ${editForm.published ? 'transparent' : 'var(--border-color)'}`
                                        }}
                                    >
                                        {editForm.published ? <><FaGlobe /> Published to Public</> : 'Draft (Private)'}
                                    </button>
                                ) : (
                                    <div style={{ padding: '0.8rem', textAlign: 'center', background: 'var(--bg-body)', color: 'var(--text-muted)', fontSize: '0.9rem', borderRadius: '6px' }}>
                                        Publishing Locked (Low Effectiveness)
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifySelf: 'end', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={cancelEdit} className="admin-icon-btn" style={{ fontSize: '0.9rem', width: 'auto', padding: '0.5rem 1rem' }} disabled={loading}>Cancel</button>
                            <button onClick={saveProject} className="btn-primary" disabled={loading || uploading}>
                                {loading || uploading ? 'Saving...' : <><FaSave /> Save Project</>}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Projects List */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                {filteredProjects.map((project: any, index: number) => (
                    <motion.div
                        key={index}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="content-card"
                        style={{ display: 'flex', flexDirection: 'row', gap: '1rem', justifyContent: 'space-between', alignItems: 'stretch' }}
                    >
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                                {project.published ? (
                                    <span style={{ fontSize: '0.75rem', background: 'rgba(78, 205, 196, 0.2)', color: 'var(--primary-teal)', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }} title="Publicly Visible"><FaGlobe /> Public</span>
                                ) : (
                                    <span style={{ fontSize: '0.75rem', background: 'var(--bg-body)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: '4px' }} title="Draft / Private">Draft</span>
                                )}
                                <span style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px' }}>{project.category || 'Uncategorized'}</span>
                                <h4 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>{project.name}</h4>
                            </div>

                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{project.description}</p>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>Effectiveness:</span>
                                    <div style={{ width: '80px', height: '6px', background: 'var(--bg-body)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div
                                            style={{ width: `${project.effectiveness || 0}%`, height: '100%', background: getEffectivenessColor(project.effectiveness || 0) }}
                                        />
                                    </div>
                                    <span>{project.effectiveness || 0}%</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center', borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
                            <button onClick={() => startEdit(projects.indexOf(project))} className="admin-icon-btn" title="Edit"><FaEdit /></button>
                            <button onClick={() => deleteProject(projects.indexOf(project))} className="admin-icon-btn" style={{ color: 'var(--primary-red)' }} title="Delete"><FaTrash /></button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default ProjectsTab;
