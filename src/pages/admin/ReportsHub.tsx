import { useState } from 'react';
import { FaClipboardCheck, FaChartPie, FaCalendarAlt, FaFileAlt } from 'react-icons/fa';
import DailyReports from './DailyReports';
import FinancialReports from './Reports';
import AttendanceReportsPage from './AttendanceReports';
import ClientReports from './ClientReports';

type Tab = 'daily' | 'financial' | 'attendance' | 'client';

const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'daily', label: 'Daily Summaries', icon: <FaClipboardCheck />, color: '#3b82f6' },
    { key: 'financial', label: 'Financial', icon: <FaChartPie />, color: '#22c55e' },
    { key: 'attendance', label: 'Attendance', icon: <FaCalendarAlt />, color: '#f59e0b' },
    { key: 'client', label: 'Client Progress', icon: <FaFileAlt />, color: '#8b5cf6' },
];

const ReportsHub = () => {
    const [tab, setTab] = useState<Tab>('daily');

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
