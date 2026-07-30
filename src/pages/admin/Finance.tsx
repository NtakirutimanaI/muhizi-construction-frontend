import { useState } from 'react';
import { FaArrowUp, FaArrowDown, FaReceipt, FaWallet } from 'react-icons/fa';
import Incomes from './Incomes';
import Expenses from './Expenses';
import PettyCashVoucher from './PettyCashVoucher';
import PettyCash from './PettyCash';

type Tab = 'incomes' | 'expenses' | 'petty-cash-voucher' | 'petty-cash';

const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'incomes', label: 'Incomes', icon: <FaArrowUp />, color: '#22c55e' },
    { key: 'expenses', label: 'Expenses', icon: <FaArrowDown />, color: '#ef4444' },
    { key: 'petty-cash-voucher', label: 'Petty Cash Voucher', icon: <FaReceipt />, color: '#f59e0b' },
    { key: 'petty-cash', label: 'Petty Cash', icon: <FaWallet />, color: '#3b82f6' },
];

const Finance = () => {
    const [tab, setTab] = useState<Tab>('incomes');

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
            {tab === 'incomes' && <Incomes />}
            {tab === 'expenses' && <Expenses />}
            {tab === 'petty-cash-voucher' && <PettyCashVoucher />}
            {tab === 'petty-cash' && <PettyCash />}
        </div>
    );
};

export default Finance;
