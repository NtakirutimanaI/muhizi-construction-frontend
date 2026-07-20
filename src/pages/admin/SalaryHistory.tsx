import { useState, useEffect } from 'react';
import { FaHistory, FaCheckCircle, FaClock, FaBan, FaDollarSign, FaMoneyBillWave } from 'react-icons/fa';
import { hrService } from '../../services/hrService';
import { useAuth } from '../../context/AuthContext';
import { loadPageCache, savePageCache } from '../../utils/pageCache';
import type { Payroll } from '../../services/hrService';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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

const statusIcon: Record<string, React.ReactNode> = {
    paid: <FaCheckCircle style={{ color: '#22c55e' }} />,
    pending: <FaClock style={{ color: '#f59e0b' }} />,
    draft: <FaBan style={{ color: '#ef4444' }} />,
};

const SalaryHistory = () => {
    const { user } = useAuth();
    const [records, setRecords] = useState<Payroll[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
        const fetch = async () => {
            const cached = loadPageCache<{ records: Payroll[] }>('pg_salary_history');
            if (cached) {
                setRecords(cached.records || []);
            }
            try {
                const empId = user?.id;
                if (!empId) return;
                const res = await hrService.getPayrollByEmployee(empId);
                const freshRecords = res.data || [];
                setRecords(freshRecords);
                savePageCache('pg_salary_history', { records: freshRecords });
            } catch (e: any) {
                setErr(e.response?.data?.message || 'Could not load records.');
            }
        };
        fetch();
    }, [user]);

    const totals = records.reduce((acc, r) => ({
        basic: acc.basic + r.basicSalary,
        allowances: acc.allowances + (r.totalAllowances || 0),
        deductions: acc.deductions + (r.totalDeductions || 0),
        net: acc.net + r.netSalary,
    }), { basic: 0, allowances: 0, deductions: 0, net: 0 });

    return (
        <div>
            <div style={{ marginBottom: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, flexShrink: 0 }}>
                    <FaHistory style={{ color: 'var(--primary)' }} /> Salary History
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.6rem', marginTop: '0.75rem', marginBottom: '1.25rem' }}>
                    <StatTile icon={<FaDollarSign />} label="Net Pay" value={`RWF ${totals.net.toLocaleString()}`} accent="#1B2042" emphasis />
                    <StatTile icon={<FaMoneyBillWave />} label="Basic" value={`RWF ${totals.basic.toLocaleString()}`} accent="#22c55e" />
                    <StatTile icon={<FaCheckCircle />} label="Allowances" value={`RWF ${totals.allowances.toLocaleString()}`} accent="#3b82f6" />
                    <StatTile icon={<FaBan />} label="Deductions" value={`RWF ${totals.deductions.toLocaleString()}`} accent="#ef4444" />
                    <StatTile icon={<FaClock />} label="Paid" value={String(records.filter(r => r.status === 'paid').length)} accent="#f59e0b" />
                </div>
            </div>

            {loading && <div className="inline-spinner">Loading salary records...</div>}
            {err && <p style={{ color: '#ef4444', padding: '1rem' }}>{err}</p>}

            {!loading && !err && records.length === 0 && (
                <div className="content-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No salary records found.
                </div>
            )}

            {!loading && records.length > 0 && (
                <div className="content-card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: 600 }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ textAlign: 'left', padding: '0.6rem 0.5rem' }}>Period</th>
                                <th style={{ textAlign: 'right', padding: '0.6rem 0.5rem' }}>Basic</th>
                                <th style={{ textAlign: 'right', padding: '0.6rem 0.5rem' }}>Allowances</th>
                                <th style={{ textAlign: 'right', padding: '0.6rem 0.5rem' }}>Deductions</th>
                                <th style={{ textAlign: 'right', padding: '0.6rem 0.5rem' }}>Net Pay</th>
                                <th style={{ textAlign: 'center', padding: '0.6rem 0.5rem' }}>Status</th>
                                <th style={{ textAlign: 'right', padding: '0.6rem 0.5rem' }}>Paid On</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map(r => (
                                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>{MONTHS[r.month - 1]} {r.year}</td>
                                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>RWF {r.basicSalary.toLocaleString()}</td>
                                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', color: '#1B2042' }}>RWF {(r.totalAllowances || 0).toLocaleString()}</td>
                                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', color: '#ef4444' }}>RWF {(r.totalDeductions || 0).toLocaleString()}</td>
                                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#22c55e' }}>RWF {r.netSalary.toLocaleString()}</td>
                                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '12px', background: r.status === 'paid' ? '#22c55e20' : r.status === 'pending' ? '#f59e0b20' : '#ef444420', color: r.status === 'paid' ? '#22c55e' : r.status === 'pending' ? '#f59e0b' : '#ef4444' }}>
                                            {statusIcon[r.status] || null} {r.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>{r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SalaryHistory;
