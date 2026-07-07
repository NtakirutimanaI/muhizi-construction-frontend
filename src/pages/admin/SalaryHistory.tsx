import { useState, useEffect } from 'react';
import { FaHistory, FaCheckCircle, FaClock, FaBan } from 'react-icons/fa';
import { hrService } from '../../services/hrService';
import { useAuth } from '../../context/AuthContext';
import type { Payroll } from '../../services/hrService';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const statusIcon: Record<string, React.ReactNode> = {
    paid: <FaCheckCircle style={{ color: '#22c55e' }} />,
    pending: <FaClock style={{ color: '#f59e0b' }} />,
    draft: <FaBan style={{ color: '#ef4444' }} />,
};

const SalaryHistory = () => {
    const { user } = useAuth();
    const [records, setRecords] = useState<Payroll[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    useEffect(() => {
        const fetch = async () => {
            try {
                const empId = user?.id;
                if (!empId) { setLoading(false); return; }
                const res = await hrService.getPayrollByEmployee(empId);
                setRecords(res.data || []);
            } catch (e: any) {
                setErr(e.response?.data?.message || 'Could not load records.');
            } finally {
                setLoading(false);
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
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FaHistory style={{ color: '#1B2042' }} /> Salary History
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>View your salary and payment records</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="content-card" style={{ padding: '1rem', textAlign: 'center', background: '#1B2042', color: '#fff' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>RWF {totals.net.toLocaleString()}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>Total Net Pay</div>
                </div>
                <div className="content-card" style={{ padding: '1rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#22c55e' }}>RWF {totals.basic.toLocaleString()}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Basic</div>
                </div>
                <div className="content-card" style={{ padding: '1rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1B2042' }}>RWF {totals.allowances.toLocaleString()}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Allowances</div>
                </div>
                <div className="content-card" style={{ padding: '1rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444' }}>RWF {totals.deductions.toLocaleString()}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Deductions</div>
                </div>
                <div className="content-card" style={{ padding: '1rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1B2042' }}>{records.filter(r => r.status === 'paid').length}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Paid Records</div>
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
