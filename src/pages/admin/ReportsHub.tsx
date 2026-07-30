import { useState, useMemo } from 'react';
import { FaClipboardCheck, FaChartPie, FaCalendarAlt, FaFileAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import DailyReports from './DailyReports';
import FinancialReports from './Reports';
import AttendanceReportsPage from './AttendanceReports';
import ClientReports from './ClientReports';

type Tab = 'daily' | 'financial' | 'attendance' | 'client';

const allTabs: { key: Tab; label: string; icon: React.ReactNode; color: string; roles: string[] }[] = [
    { key: 'daily', label: 'Daily Summaries', icon: <FaClipboardCheck />, color: '#3b82f6', roles: ['admin', 'managing_director'] },
    { key: 'financial', label: 'Financial', icon: <FaChartPie />, color: '#22c55e', roles: ['admin', 'finance_director', 'managing_director'] },
    { key: 'attendance', label: 'Attendance', icon: <FaCalendarAlt />, color: '#f59e0b', roles: ['admin', 'finance_director', 'managing_director'] },
    { key: 'client', label: 'Client Progress', icon: <FaFileAlt />, color: '#8b5cf6', roles: ['admin', 'managing_director'] },
];

const ReportsHub = () => {
    const { user } = useAuth();
    const role = user?.role || '';

    const tabs = useMemo(() => allTabs.filter(t => t.roles.includes(role)), [role]);

    const [tab, setTab] = useState<Tab>(tabs[0]?.key || 'financial');

    if (tabs.length === 0) return null;

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.5rem 1.2rem', borderRadius: 8, border: 'none',
                            fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                            background: tab === t.key ? t.color : 'var(--bg-white)',
                            color: tab === t.key ? '#fff' : 'var(--text-main)',
                            border: tab === t.key ? 'none' : '1px solid var(--border-color)',
                        }}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>
            {tab === 'daily' && <DailyReports />}
            {tab === 'financial' && <FinancialReports />}
            {tab === 'attendance' && <AttendanceReportsPage />}
            {tab === 'client' && <ClientReports />}
        </div>
    );
};

export default ReportsHub;
