import { useState, useEffect, useMemo } from 'react';
import {
    FaClipboardList, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf,
    FaSpinner, FaEye, FaStickyNote, FaCalendarAlt, FaFlag,
} from 'react-icons/fa';
import { tasksService, type Task, type TaskStatus } from '../../services/tasksService';
import { useToast } from '../../context/ToastContext';
import { loadPageCache, savePageCache } from '../../utils/pageCache';

const STATUS_STYLE: Record<TaskStatus, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
    pending: { color: '#f59e0b', bg: '#f59e0b18', label: 'Pending', icon: <FaClock size={10} /> },
    in_progress: { color: '#3b82f6', bg: '#3b82f618', label: 'In Progress', icon: <FaHourglassHalf size={10} /> },
    completed: { color: '#22c55e', bg: '#22c55e18', label: 'Completed', icon: <FaCheckCircle size={10} /> },
    rejected: { color: '#ef4444', bg: '#ef444418', label: 'Rejected', icon: <FaTimesCircle size={10} /> },
};

const PRIORITY_STYLE: Record<string, { color: string; label: string }> = {
    low: { color: '#6b7280', label: 'Low' },
    medium: { color: '#f59e0b', label: 'Medium' },
    high: { color: '#ef4444', label: 'High' },
};

const StatusBadge = ({ status }: { status: TaskStatus }) => {
    const s = STATUS_STYLE[status];
    return (
        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 10, background: s.bg, color: s.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {s.icon} {s.label}
        </span>
    );
};

const DailyTasks = () => {
    const { showToast } = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewTask, setViewTask] = useState<Task | null>(null);
    const [completionNotes, setCompletionNotes] = useState('');
    const [updating, setUpdating] = useState(false);

    const load = async () => {
        const cached = loadPageCache<Task[]>('pg_daily_tasks');
        if (cached) { setTasks(cached); setLoading(false); }
        try {
            const res = await tasksService.getMy();
            const data = res.data || [];
            setTasks(data);
            savePageCache('pg_daily_tasks', data);
        } catch {
            showToast('Failed to load tasks', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const todayCount = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        return tasks.filter(t => t.createdAt && new Date(t.createdAt).toISOString().slice(0, 10) === today).length;
    }, [tasks]);

    const handleStatusUpdate = async (status: TaskStatus) => {
        if (!viewTask) return;
        setUpdating(true);
        try {
            await tasksService.updateStatus(viewTask.id, {
                status,
                completionNotes: completionNotes.trim() || undefined,
            });
            showToast(`Task marked as ${STATUS_STYLE[status].label.toLowerCase()}`, 'success');
            setViewTask(null);
            setCompletionNotes('');
            load();
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to update task', 'error');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="admin-page">
            <div style={{ marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FaClipboardList style={{ color: 'var(--primary)' }} /> Daily Tasks
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    Tasks assigned to you by the Managing Director
                </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {tasks.length} total task{tasks.length !== 1 ? 's' : ''}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>|</span>
                <span style={{ fontSize: '0.82rem', color: '#f59e0b', fontWeight: 600 }}>
                    {todayCount} today
                </span>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <FaSpinner className="spin" size={24} />
                </div>
            ) : tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <FaClipboardList size={36} style={{ opacity: 0.2, marginBottom: 10 }} />
                    <div style={{ fontWeight: 600 }}>No tasks assigned yet</div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
                    {tasks.map(task => (
                        <div key={task.id} className="content-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', borderRadius: 10, cursor: 'pointer' }}
                            onClick={() => { setViewTask(task); setCompletionNotes(''); }}>
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
                                    background: PRIORITY_STYLE[task.priority]?.color + '18',
                                    color: PRIORITY_STYLE[task.priority]?.color,
                                    textTransform: 'capitalize', display: 'inline-flex', alignItems: 'center', gap: 3,
                                }}>
                                    <FaFlag size={8} /> {task.priority}
                                </span>
                                {task.dueDate && (
                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                        <FaCalendarAlt size={8} style={{ marginRight: 2 }} />{new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <FaStickyNote size={9} style={{ marginRight: 3 }} />From: {task.assignedByName}
                                </div>
                                <FaEye style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {viewTask && (
                <div className="admin-modal-overlay" onClick={() => setViewTask(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 560, maxWidth: '95vw' }}>
                        <div className="admin-modal-header">
                            <h3><FaClipboardList style={{ marginRight: 8 }} />{viewTask.title}</h3>
                            <button onClick={() => setViewTask(null)}><FaTimesCircle /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
                                <StatusBadge status={viewTask.status} />
                                <span style={{
                                    fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 10,
                                    background: PRIORITY_STYLE[viewTask.priority]?.color + '18',
                                    color: PRIORITY_STYLE[viewTask.priority]?.color,
                                    textTransform: 'capitalize',
                                }}>
                                    {viewTask.priority} priority
                                </span>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '1rem' }}>{viewTask.description}</p>
                            <div className="es-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.82rem' }}>
                                <div><strong>From:</strong> {viewTask.assignedByName}</div>
                                <div><strong>Created:</strong> {new Date(viewTask.createdAt).toLocaleDateString()}</div>
                                {viewTask.dueDate && <div><strong>Due:</strong> {new Date(viewTask.dueDate).toLocaleDateString()}</div>}
                                {viewTask.notes && <div style={{ gridColumn: '1 / -1' }}><strong>Notes:</strong> {viewTask.notes}</div>}
                            </div>
                            {viewTask.completionNotes && (
                                <div style={{ padding: '0.6rem 0.8rem', background: 'var(--bg-body)', borderRadius: 6, marginBottom: '1rem' }}>
                                    <strong>Completion Notes:</strong>
                                    <p style={{ fontSize: '0.85rem', margin: '4px 0 0' }}>{viewTask.completionNotes}</p>
                                </div>
                            )}
                            {viewTask.status !== 'completed' && viewTask.status !== 'rejected' && (
                                <div className="form-group">
                                    <label className="form-label">Notes (optional)</label>
                                    <textarea value={completionNotes} onChange={e => setCompletionNotes(e.target.value)} className="form-textarea" rows={3} placeholder="Add notes about this task..." />
                                </div>
                            )}
                        </div>
                        {viewTask.status !== 'completed' && viewTask.status !== 'rejected' && (
                            <div className="admin-modal-footer">
                                {viewTask.status !== 'in_progress' && (
                                    <button className="admin-btn admin-btn--secondary" onClick={() => handleStatusUpdate('in_progress')} disabled={updating}>
                                        {updating ? <FaSpinner className="spin" /> : <FaHourglassHalf />} Start Working
                                    </button>
                                )}
                                <button className="admin-btn admin-btn--secondary" onClick={() => handleStatusUpdate('rejected')} disabled={updating} style={{ color: '#ef4444' }}>
                                    {updating ? <FaSpinner className="spin" /> : <FaTimesCircle />} Reject
                                </button>
                                <button className="admin-btn" onClick={() => handleStatusUpdate('completed')} disabled={updating}>
                                    {updating ? <FaSpinner className="spin" /> : <FaCheckCircle />} Mark Complete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyTasks;
