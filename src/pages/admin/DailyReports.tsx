import { useState, useEffect } from 'react';
import { FaClipboardCheck, FaPlus, FaTimes, FaSpinner, FaCalendarDay, FaUser, FaTrash } from 'react-icons/fa';
import { dailyReportsService } from '../../services/dailyReportsService';
import type { DailyReport } from '../../services/dailyReportsService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { loadPageCache, savePageCache } from '../../utils/pageCache';

const todayStr = () => new Date().toISOString().split('T')[0];

const DailyReports = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const isAdmin = user?.role === 'admin';
    const isSubmitter = user?.role === 'managing_director';

    const [reports, setReports] = useState<DailyReport[]>([]);
    const [loading, setLoading] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [summary, setSummary] = useState('');
    const [date, setDate] = useState(todayStr());
    const [saving, setSaving] = useState(false);

    const load = async () => {
        const cached = loadPageCache<DailyReport[]>('pg_daily_reports');
        if (cached) {
            setReports(cached);
        }
        try {
            const res = isAdmin ? await dailyReportsService.getAll() : await dailyReportsService.getMy();
            const data = res.data || [];
            setReports(data);
            savePageCache('pg_daily_reports', data);
        } catch {
            if (!cached) showToast('Failed to load reports', 'error');
        }
    };

    useEffect(() => { load(); }, []);

    const openNew = () => { setSummary(''); setDate(todayStr()); setShowNew(true); };

    const submit = async () => {
        if (!summary.trim() || summary.trim().length < 10) {
            showToast('Summary must be at least 10 characters', 'error');
            return;
        }
        setSaving(true);
        try {
            await dailyReportsService.create({ date, summary: summary.trim() });
            showToast('Daily report submitted', 'success');
            setShowNew(false);
            load();
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to submit report', 'error');
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id: string) => {
        if (!window.confirm('Delete this report?')) return;
        try {
            await dailyReportsService.remove(id);
            showToast('Report deleted', 'success');
            load();
        } catch {
            showToast('Failed to delete', 'error');
        }
    };

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FaClipboardCheck style={{ color: 'var(--primary)' }} /> Daily Operations Reports
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        {isAdmin ? 'Daily summaries submitted by the Managing Director.' : 'Submit a short summary of the day\'s site, stock, and request activity.'}
                    </p>
                </div>
                {isSubmitter && (
                    <button onClick={openNew} className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                        <FaPlus /> Submit Today's Report
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
                {reports.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <FaClipboardCheck size={36} style={{ opacity: 0.2, marginBottom: 10 }} />
                        <div style={{ fontWeight: 600 }}>No reports yet</div>
                        {isSubmitter && <div style={{ fontSize: '0.85rem' }}>Click "Submit Today's Report" to log your first one.</div>}
                    </div>
                )}
                {reports.map(r => (
                    <div key={r.id} className="content-card" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                    <FaCalendarDay size={11} style={{ color: 'var(--primary)' }} />
                                    {new Date(r.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                                {isAdmin && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <FaUser size={10} /> {r.submittedByName}
                                    </span>
                                )}
                            </div>
                            {isAdmin && (
                                <button onClick={() => remove(r.id)} style={{ color: 'var(--primary-red)', flexShrink: 0 }} title="Delete"><FaTrash size={12} /></button>
                            )}
                        </div>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{r.summary}</p>
                    </div>
                ))}
            </div>

            {showNew && (
                <div className="admin-modal-overlay" onClick={() => !saving && setShowNew(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 520 }}>
                        <div className="admin-modal-header">
                            <h3><FaClipboardCheck style={{ marginRight: 8 }} />Submit Daily Report</h3>
                            <button onClick={() => !saving && setShowNew(false)}><FaTimes /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Date</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="form-input" max={todayStr()} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Summary</label>
                                <textarea value={summary} onChange={e => setSummary(e.target.value)} className="form-textarea" rows={7}
                                    placeholder="e.g., Site A foundation pour completed on schedule. Site B awaiting cement delivery, expected tomorrow. Two material requests approved. No safety incidents." />
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setShowNew(false)} disabled={saving}>Cancel</button>
                            <button className="admin-btn" onClick={submit} disabled={saving}>
                                {saving ? <><FaSpinner className="spin" /> Submitting...</> : 'Submit Report'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyReports;
