import { useState, useEffect, useMemo, useRef } from 'react';
import { FaUserPlus, FaPlus, FaTimes, FaSpinner, FaClipboardList, FaClock,
    FaTrash, FaFlag, FaCalendarAlt, FaEye, FaSearch, FaCheck, FaChevronDown, FaEdit, FaArrowLeft,
} from 'react-icons/fa';
import { tasksService, type Task, type TaskStatus, type TaskPriority, type EditTaskDto } from '../../services/tasksService';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const STATUS_STYLE: Record<TaskStatus, { color: string; bg: string; label: string }> = {
    pending: { color: '#f59e0b', bg: '#f59e0b18', label: 'Pending' },
    in_progress: { color: '#3b82f6', bg: '#3b82f618', label: 'In Progress' },
    completed: { color: '#22c55e', bg: '#22c55e18', label: 'Completed' },
    rejected: { color: '#ef4444', bg: '#ef444418', label: 'Rejected' },
};

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: '#6b7280' },
    { value: 'medium', label: 'Medium', color: '#f59e0b' },
    { value: 'high', label: 'High', color: '#ef4444' },
];

const StatusBadge = ({ status }: { status: TaskStatus }) => {
    const s = STATUS_STYLE[status];
    return (
        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 10, background: s.bg, color: s.color }}>
            {s.label}
        </span>
    );
};

interface TeamMember {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profile?: { firstName: string; lastName: string; avatar?: string };
}

const getName = (m: TeamMember) =>
    `${m.profile?.firstName || m.firstName || ''} ${m.profile?.lastName || m.lastName || ''}`.trim() || m.email;

const AssignTasks = () => {
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [memberSearch, setMemberSearch] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [saving, setSaving] = useState(false);

    const [viewTask, setViewTask] = useState<Task | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [clearing, setClearing] = useState(false);

    const [editTask, setEditTask] = useState<Task | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
    const [editDueDate, setEditDueDate] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [editAssignedTo, setEditAssignedTo] = useState('');
    const [editSaving, setEditSaving] = useState(false);

    const loadData = async () => {
        try {
            const [tasksRes, membersRes] = await Promise.all([
                tasksService.getAll().catch(() => ({ data: [] })),
                tasksService.getTeamMembers().catch(() => ({ data: [] })),
            ]);
            setTasks(tasksRes.data || []);
            setMembers(membersRes.data || []);
        } catch {
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filteredMembers = useMemo(() => {
        const q = memberSearch.toLowerCase();
        return members.filter(m => getName(m).toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
    }, [members, memberSearch]);

    const filteredTasks = useMemo(() => {
        const q = search.toLowerCase();
        return tasks.filter(t => {
            if (q && !t.title.toLowerCase().includes(q) && !t.assignedToName.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [tasks, search]);

    const assignedMembers = useMemo(() => {
        const map = new Map<string, string>();
        tasks.forEach(t => { if (t.assignedTo && t.assignedToName) map.set(t.assignedTo, t.assignedToName); });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [tasks]);

    const toggleMember = (id: string) => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

    const resetForm = () => {
        setTitle(''); setDescription(''); setPriority('medium'); setDueDate(''); setNotes('');
        setSelectedIds([]); setMemberSearch(''); setDropdownOpen(false); setShowForm(false);
    };

    const handleAssign = async () => {
        if (!title.trim() || !description.trim() || selectedIds.length === 0) {
            showToast('Title, description, and at least one member required', 'error');
            return;
        }
        setSaving(true);
        try {
            await Promise.all(selectedIds.map(id => {
                const m = members.find(x => x.id === id);
                return tasksService.create({
                    title, description, priority, dueDate: dueDate || undefined, notes: notes || undefined,
                    assignedTo: id, assignedToName: m ? getName(m) : '',
                });
            }));
            showToast(`${selectedIds.length} task(s) assigned`, 'success');
            resetForm();
            loadData();
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to create task', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this task?')) return;
        setDeleting(true);
        try {
            await tasksService.remove(id);
            showToast('Task deleted', 'success');
            setViewTask(null);
            loadData();
        } catch {
            showToast('Failed to delete', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm('Clear ALL tasks? This cannot be undone.')) return;
        setClearing(true);
        try {
            await tasksService.clearAll();
            showToast('All tasks cleared', 'success');
            setTasks([]);
        } catch {
            showToast('Failed to clear tasks', 'error');
        } finally {
            setClearing(false);
        }
    };

    const openEdit = (task: Task) => {
        setEditTask(task);
        setEditTitle(task.title);
        setEditDescription(task.description);
        setEditPriority(task.priority);
        setEditDueDate(task.dueDate || '');
        setEditNotes(task.notes || '');
        setEditAssignedTo(task.assignedTo);
        setViewTask(null);
    };

    const handleEdit = async () => {
        if (!editTask || !editTitle.trim() || !editDescription.trim()) {
            showToast('Title and description are required', 'error');
            return;
        }
        setEditSaving(true);
        try {
            const member = members.find(m => m.id === editAssignedTo);
            const dto: EditTaskDto = {
                title: editTitle,
                description: editDescription,
                priority: editPriority,
                dueDate: editDueDate || undefined,
                notes: editNotes || undefined,
                assignedTo: editAssignedTo || undefined,
                assignedToName: member ? getName(member) : undefined,
            };
            await tasksService.update(editTask.id, dto);
            showToast('Task updated', 'success');
            setEditTask(null);
            loadData();
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to update task', 'error');
        } finally {
            setEditSaving(false);
        }
    };

    return (
        <div className="admin-page">
            {/* Header */}
            <div className="es-flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FaUserPlus style={{ color: 'var(--primary)' }} /> Assign Tasks
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        Create and assign tasks to employed Engineering Studio members
                    </p>
                </div>
                <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                    <FaPlus /> Assign Task
                </button>
            </div>

            {/* Summary + Search + Clear */}
            <div className="es-toolbar" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
                    <FaSearch style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }} />
                    <input type="text" className="form-input" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)}
                        style={{ padding: '0.35rem 0.75rem 0.35rem 2rem', fontSize: '0.82rem', width: '100%' }} />
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>|</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {assignedMembers.length} member{assignedMembers.length !== 1 ? 's' : ''}:
                    {' '}{assignedMembers.map(m => m.name).join(', ') || '—'}
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                        onClick={() => navigate('/admin/engineering-studio')}
                        style={{
                            padding: '0.35rem 0.85rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
                            border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-body)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                        <FaArrowLeft /> Back
                    </button>
                    {tasks.length > 0 && (
                        <button onClick={handleClearAll} disabled={clearing}
                            style={{
                                padding: '0.35rem 0.85rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
                                border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#ef444418'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                            {clearing ? <><FaSpinner className="spin" /> Clearing...</> : <><FaTrash /> Clear All Tasks</>}
                        </button>
                    )}
                </div>
            </div>

            {/* Tasks List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <FaSpinner className="spin" size={24} />
                </div>
            ) : filteredTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <FaClipboardList size={36} style={{ opacity: 0.2, marginBottom: 10 }} />
                    <div style={{ fontWeight: 600 }}>No tasks found</div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
                    {filteredTasks.map(task => (
                        <div key={task.id} className="content-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', borderRadius: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                <h4 style={{ fontWeight: 700, fontSize: '0.92rem', margin: 0, lineHeight: 1.3, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</h4>
                                <StatusBadge status={task.status} />
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {task.description}
                            </p>
                            <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                                <span style={{
                                    fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 6,
                                    background: PRIORITY_OPTIONS.find(p => p.value === task.priority)?.color + '18',
                                    color: PRIORITY_OPTIONS.find(p => p.value === task.priority)?.color,
                                    textTransform: 'capitalize',
                                }}>
                                    <FaFlag size={8} style={{ marginRight: 2 }} />{task.priority}
                                </span>
                                {task.dueDate && (
                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                        <FaCalendarAlt size={8} style={{ marginRight: 2 }} />{new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <FaUserPlus size={9} style={{ marginRight: 3 }} />{task.assignedToName}
                                </div>
                                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                    <button onClick={() => setViewTask(task)} title="View"
                                        style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-body)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', transition: 'all 0.15s' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#3b82f618'; e.currentTarget.style.borderColor = '#3b82f6'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-body)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}>
                                        <FaEye size={12} />
                                    </button>
                                    <button onClick={() => openEdit(task)} title="Edit"
                                        style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-body)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', transition: 'all 0.15s' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#f59e0b18'; e.currentTarget.style.borderColor = '#f59e0b'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-body)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}>
                                        <FaEdit size={12} />
                                    </button>
                                    <button onClick={() => handleDelete(task.id)} title="Delete"
                                        style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-body)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', transition: 'all 0.15s' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#ef444418'; e.currentTarget.style.borderColor = '#ef4444'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-body)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}>
                                        <FaTrash size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Assign Task Modal */}
            {showForm && (
                <div className="admin-modal-overlay" onClick={() => { if (!saving) resetForm(); }}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 620, maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="admin-modal-header">
                            <h3><FaUserPlus style={{ marginRight: 8 }} />Assign Task</h3>
                            <button onClick={() => !saving && resetForm()}><FaTimes /></button>
                        </div>
                        <div className="admin-modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                            {/* Title */}
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Task Title *</label>
                                <input value={title} onChange={e => setTitle(e.target.value)} className="form-input" placeholder="e.g., Review foundation design" />
                            </div>

                            {/* Description */}
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Description *</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} className="form-textarea" rows={3} placeholder="Describe what needs to be done..." />
                            </div>

                            {/* Priority + Due Date */}
                            <div className="es-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Priority</label>
                                    <select className="form-select" value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}>
                                        {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Due Date</label>
                                    <input type="date" className="form-input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Notes</label>
                                <input className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes (optional)..." />
                            </div>

                            {/* Assign To */}
                            <div className="form-group" style={{ marginBottom: 0 }} ref={dropdownRef}>
                                <label className="form-label">
                                    Assign To * <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                        ({selectedIds.length} selected)
                                    </span>
                                </label>

                                {members.length === 0 ? (
                                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'var(--bg-body)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                        <FaUserPlus size={20} style={{ opacity: 0.3, marginBottom: 6 }} />
                                        <div>No employed Engineering Studio members found</div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Trigger */}
                                        <div
                                            onClick={() => setDropdownOpen(!dropdownOpen)}
                                            className="form-select"
                                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 38 }}
                                        >
                                            <span style={{ color: selectedIds.length ? 'var(--text-main)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {selectedIds.length === 0 ? 'Select team members...' : `${selectedIds.length} member(s) selected`}
                                            </span>
                                            <FaChevronDown size={10} style={{ flexShrink: 0, opacity: 0.5, transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                                        </div>

                                        {/* Dropdown */}
                                        {dropdownOpen && (
                                            <div style={{
                                                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: 4,
                                                background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8,
                                                boxShadow: '0 8px 24px rgba(0,0,0,0.15)', maxHeight: 280, overflow: 'hidden',
                                                display: 'flex', flexDirection: 'column',
                                            }}>
                                                <div style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                                    <div style={{ position: 'relative' }}>
                                                        <FaSearch style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.7rem' }} />
                                                        <input
                                                            type="text" placeholder="Search..." value={memberSearch}
                                                            onChange={e => setMemberSearch(e.target.value)}
                                                            style={{ width: '100%', padding: '0.35rem 0.5rem 0.35rem 1.5rem', border: '1px solid var(--border-color)', borderRadius: 4, fontSize: '0.8rem', background: 'var(--bg-body)', outline: 'none' }}
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>
                                                <div style={{ overflowY: 'auto', flex: 1 }}>
                                                    {filteredMembers.map(m => {
                                                        const name = getName(m);
                                                        const isSelected = selectedIds.includes(m.id);
                                                        return (
                                                            <div key={m.id} onClick={() => toggleMember(m.id)}
                                                                style={{
                                                                    padding: '0.5rem 0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem',
                                                                    borderBottom: '1px solid var(--border-color)',
                                                                    background: isSelected ? 'rgba(139,92,246,0.08)' : 'transparent',
                                                                }}
                                                                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-body)'; }}
                                                                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? 'rgba(139,92,246,0.08)' : 'transparent'; }}
                                                            >
                                                                <span style={{
                                                                    width: 18, height: 18, borderRadius: 4,
                                                                    border: `2px solid ${isSelected ? '#8b5cf6' : 'var(--border-color)'}`,
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    background: isSelected ? '#8b5cf6' : 'transparent',
                                                                    color: '#fff', fontSize: '0.55rem', flexShrink: 0,
                                                                }}>
                                                                    {isSelected && <FaCheck />}
                                                                </span>
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <div style={{ fontSize: '0.85rem', fontWeight: isSelected ? 600 : 400 }}>{name}</div>
                                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.email}</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {filteredMembers.length === 0 && (
                                                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No members found</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Selected tags */}
                                {selectedIds.length > 0 && (
                                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                        {members.filter(m => selectedIds.includes(m.id)).map(m => (
                                            <span key={m.id} style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.2rem 0.5rem',
                                                background: '#8b5cf618', color: '#8b5cf6', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600,
                                            }}>
                                                {getName(m)}
                                                <FaTimes size={8} style={{ cursor: 'pointer' }} onClick={() => toggleMember(m.id)} />
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => !saving && resetForm()} disabled={saving}>Cancel</button>
                            <button className="admin-btn" onClick={handleAssign} disabled={saving || selectedIds.length === 0 || !title.trim() || !description.trim()}>
                                {saving ? <><FaSpinner className="spin" /> Assigning...</> : <><FaUserPlus /> Assign {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Task Modal */}
            {viewTask && (
                <div className="admin-modal-overlay" onClick={() => setViewTask(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 560, maxWidth: '95vw' }}>
                        <div className="admin-modal-header">
                            <h3><FaClipboardList style={{ marginRight: 8 }} />{viewTask.title}</h3>
                            <button onClick={() => setViewTask(null)}><FaTimes /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
                                <StatusBadge status={viewTask.status} />
                                <span style={{
                                    fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 10,
                                    background: PRIORITY_OPTIONS.find(p => p.value === viewTask.priority)?.color + '18',
                                    color: PRIORITY_OPTIONS.find(p => p.value === viewTask.priority)?.color,
                                    textTransform: 'capitalize',
                                }}>
                                    {viewTask.priority} priority
                                </span>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '1rem' }}>{viewTask.description}</p>
                            <div className="es-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.82rem' }}>
                                <div><strong>Assigned To:</strong> {viewTask.assignedToName}</div>
                                <div><strong>Created:</strong> {new Date(viewTask.createdAt).toLocaleDateString()}</div>
                                {viewTask.dueDate && <div><strong>Due:</strong> {new Date(viewTask.dueDate).toLocaleDateString()}</div>}
                                {viewTask.notes && <div style={{ gridColumn: '1 / -1' }}><strong>Notes:</strong> {viewTask.notes}</div>}
                            </div>
                            {viewTask.completionNotes && (
                                <div style={{ padding: '0.6rem 0.8rem', background: 'var(--bg-body)', borderRadius: 6, marginTop: '1rem' }}>
                                    <strong>Completion Notes:</strong>
                                    <p style={{ fontSize: '0.85rem', margin: '4px 0 0' }}>{viewTask.completionNotes}</p>
                                </div>
                            )}
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => handleDelete(viewTask.id)} disabled={deleting} style={{ color: '#ef4444' }}>
                                {deleting ? <FaSpinner className="spin" /> : <FaTrash />} Delete
                            </button>
                            <button className="admin-btn admin-btn--secondary" onClick={() => openEdit(viewTask)}>
                                <FaEdit /> Edit
                            </button>
                            <button className="admin-btn admin-btn--secondary" onClick={() => setViewTask(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Task Modal */}
            {editTask && (
                <div className="admin-modal-overlay" onClick={() => { if (!editSaving) setEditTask(null); }}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 620, maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="admin-modal-header">
                            <h3><FaEdit style={{ marginRight: 8 }} />Edit Task</h3>
                            <button onClick={() => { if (!editSaving) setEditTask(null); }}><FaTimes /></button>
                        </div>
                        <div className="admin-modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Task Title *</label>
                                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="form-input" />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Description *</label>
                                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} className="form-textarea" rows={3} />
                            </div>
                            <div className="es-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Priority</label>
                                    <select className="form-select" value={editPriority} onChange={e => setEditPriority(e.target.value as TaskPriority)}>
                                        {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Due Date</label>
                                    <input type="date" className="form-input" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Notes</label>
                                <input className="form-input" value={editNotes} onChange={e => setEditNotes(e.target.value)} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Assign To</label>
                                <select className="form-select" value={editAssignedTo} onChange={e => setEditAssignedTo(e.target.value)}>
                                    {members.map(m => <option key={m.id} value={m.id}>{getName(m)} — {m.email}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => { if (!editSaving) setEditTask(null); }} disabled={editSaving}>Cancel</button>
                            <button className="admin-btn" onClick={handleEdit} disabled={editSaving || !editTitle.trim() || !editDescription.trim()}>
                                {editSaving ? <><FaSpinner className="spin" /> Saving...</> : <><FaEdit /> Save Changes</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignTasks;
