import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FaChartBar, FaArrowUp, FaArrowDown, FaBalanceScale, FaFileExcel, FaFilePdf } from 'react-icons/fa';
import { financeService } from '../../services/financeService';
import type { MonthlyReport, YearlyReport } from '../../services/financeService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const Reports = () => {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [view, setView] = useState<'monthly' | 'yearly'>('monthly');
    const [monthly, setMonthly] = useState<MonthlyReport | null>(null);
    const [yearly, setYearly] = useState<YearlyReport | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchMonthly = async () => {
        setLoading(true);
        try {
            const res = await financeService.getMonthlyReport(year, month);
            setMonthly(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchYearly = async () => {
        setLoading(true);
        try {
            const res = await financeService.getYearlyReport(year);
            setYearly(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (view === 'monthly') fetchMonthly();
        else fetchYearly();
    }, [view, month, year]);

    const downloadPDF = () => {
        const doc = new jsPDF();
        const brown = '#8B4513';
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();

        doc.setFontSize(22);
        doc.setTextColor(brown);
        doc.setFont('helvetica', 'bold');
        doc.text('MUHIZI CONSTRUCTION', pageW / 2, 22, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Building Your Vision, Delivering Excellence', pageW / 2, 30, { align: 'center' });

        doc.setDrawColor(brown);
        doc.setLineWidth(0.8);
        doc.line(14, 34, pageW - 14, 34);

        doc.setFontSize(13);
        doc.setTextColor(brown);
        doc.setFont('helvetica', 'bold');
        const titleY = 40;
        const periodStr = view === 'monthly' ? `${MONTHS[month - 1]} ${year}` : `${year}`;
        doc.text(`${view === 'monthly' ? 'Monthly' : 'Yearly'} Financial Report`, 14, titleY);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#666');
        doc.text(`Generated: ${new Date().toLocaleDateString()} | Period: ${periodStr}`, pageW - 14, titleY, { align: 'right' });

        if (view === 'monthly' && monthly) {
            const summaryRows = [
                ['Total Income', `RWF ${monthly.totalIncome.toLocaleString()}`],
                ['Total Expense', `RWF ${monthly.totalExpense.toLocaleString()}`],
                ['Net Profit', `RWF ${monthly.netProfit.toLocaleString()}`],
                ['Transactions', String(monthly.incomeCount + monthly.expenseCount)],
            ];
            autoTable(doc, {
                head: [['Metric', 'Value']],
                body: summaryRows,
                startY: 46,
                styles: { fontSize: 9, textColor: '#333' },
                headStyles: { fillColor: [139, 69, 19], textColor: [255, 255, 255], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [250, 245, 240] },
            });

            const incomeCatY = (doc as any).lastAutoTable.finalY + 8;
            doc.setFontSize(11);
            doc.setTextColor(brown);
            doc.setFont('helvetica', 'bold');
            doc.text('Income by Category', 14, incomeCatY);

            const incomeData = Object.entries(monthly.incomeByCategory).map(([cat, amt]) => [
                cat.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                `RWF ${amt.toLocaleString()}`,
            ]);
            if (incomeData.length > 0) {
                autoTable(doc, {
                    head: [['Category', 'Amount']],
                    body: incomeData,
                    startY: incomeCatY + 4,
                    styles: { fontSize: 8, textColor: '#333' },
                    headStyles: { fillColor: [139, 69, 19], textColor: [255, 255, 255], fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [250, 245, 240] },
                });
            }

            const expenseCatY = (doc as any).lastAutoTable.finalY + 8;
            doc.setFontSize(11);
            doc.setTextColor(brown);
            doc.setFont('helvetica', 'bold');
            doc.text('Expense by Category', 14, expenseCatY);

            const expenseData = Object.entries(monthly.expenseByCategory).map(([cat, amt]) => [
                cat.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                `RWF ${amt.toLocaleString()}`,
            ]);
            if (expenseData.length > 0) {
                autoTable(doc, {
                    head: [['Category', 'Amount']],
                    body: expenseData,
                    startY: expenseCatY + 4,
                    styles: { fontSize: 8, textColor: '#333' },
                    headStyles: { fillColor: [139, 69, 19], textColor: [255, 255, 255], fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [250, 245, 240] },
                });
            }
        }

        if (view === 'yearly' && yearly) {
            const summaryRows = [
                ['Total Income', `RWF ${yearly.totalIncome.toLocaleString()}`],
                ['Total Expense', `RWF ${yearly.totalExpense.toLocaleString()}`],
                ['Net Profit', `RWF ${yearly.netProfit.toLocaleString()}`],
            ];
            autoTable(doc, {
                head: [['Metric', 'Value']],
                body: summaryRows,
                startY: 46,
                styles: { fontSize: 9, textColor: '#333' },
                headStyles: { fillColor: [139, 69, 19], textColor: [255, 255, 255], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [250, 245, 240] },
            });

            const monthlyY = (doc as any).lastAutoTable.finalY + 8;
            doc.setFontSize(11);
            doc.setTextColor(brown);
            doc.setFont('helvetica', 'bold');
            doc.text('Monthly Breakdown', 14, monthlyY);

            const monthlyData = yearly.monthlyData.map(m => [
                MONTHS[m.month - 1],
                `RWF ${m.income.toLocaleString()}`,
                `RWF ${m.expense.toLocaleString()}`,
                `RWF ${(m.income - m.expense).toLocaleString()}`,
            ]);
            autoTable(doc, {
                head: [['Month', 'Income', 'Expense', 'Net']],
                body: monthlyData,
                startY: monthlyY + 4,
                styles: { fontSize: 8, textColor: '#333' },
                headStyles: { fillColor: [139, 69, 19], textColor: [255, 255, 255], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [250, 245, 240] },
            });
        }

        doc.setDrawColor(brown);
        doc.setLineWidth(0.5);
        doc.line(14, pageH - 20, pageW - 14, pageH - 20);
        doc.setFontSize(8);
        doc.setTextColor(brown);
        doc.setFont('helvetica', 'normal');
        doc.text('Email: info@muhiziconstruction.com  |  Phone: +250 788 000 000  |  Location: Kigali, Rwanda', pageW / 2, pageH - 14, { align: 'center' });

        doc.save(`report_${view}_${periodStr.replace(' ', '_')}.pdf`);
    };

    const downloadExcel = () => {
        const brown = '#8B4513';
        const today = new Date().toLocaleDateString();
        const periodStr = view === 'monthly' ? `${MONTHS[month - 1]} ${year}` : `${year}`;
        const title = `${view === 'monthly' ? 'Monthly' : 'Yearly'} Financial Report`;

        let bodyRows = '';
        if (view === 'monthly' && monthly) {
            const summaryRows = [
                `<tr><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px;font-weight:bold">Total Income</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">RWF ${monthly.totalIncome.toLocaleString()}</td></tr>`,
                `<tr><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px;font-weight:bold">Total Expense</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">RWF ${monthly.totalExpense.toLocaleString()}</td></tr>`,
                `<tr><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px;font-weight:bold">Net Profit</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">RWF ${monthly.netProfit.toLocaleString()}</td></tr>`,
                `<tr><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px;font-weight:bold">Transactions</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${monthly.incomeCount + monthly.expenseCount}</td></tr>`,
            ].join('');
            const incomeRows = Object.entries(monthly.incomeByCategory).map(([cat, amt]) =>
                `<tr><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">RWF ${amt.toLocaleString()}</td></tr>`
            ).join('');
            const expenseRows = Object.entries(monthly.expenseByCategory).map(([cat, amt]) =>
                `<tr><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">RWF ${amt.toLocaleString()}</td></tr>`
            ).join('');

            bodyRows = `
                <tr style="background:${brown};color:#fff"><th colspan="2" style="padding:6px 8px;border:1px solid ${brown};font-size:11px">Summary</th></tr>
                ${summaryRows}
                ${incomeRows ? `<tr style="background:${brown};color:#fff"><th colspan="2" style="padding:6px 8px;border:1px solid ${brown};font-size:11px">Income by Category</th></tr>` : ''}
                ${incomeRows}
                ${expenseRows ? `<tr style="background:${brown};color:#fff"><th colspan="2" style="padding:6px 8px;border:1px solid ${brown};font-size:11px">Expense by Category</th></tr>` : ''}
                ${expenseRows}
            `;
        } else if (view === 'yearly' && yearly) {
            const summaryRows = [
                `<tr><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px;font-weight:bold">Total Income</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">RWF ${yearly.totalIncome.toLocaleString()}</td></tr>`,
                `<tr><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px;font-weight:bold">Total Expense</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">RWF ${yearly.totalExpense.toLocaleString()}</td></tr>`,
                `<tr><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px;font-weight:bold">Net Profit</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">RWF ${yearly.netProfit.toLocaleString()}</td></tr>`,
                '<tr style="background:lightgray"><th style="padding:6px 8px;border:1px solid #ccc;font-size:11px">Month</th><th style="padding:6px 8px;border:1px solid #ccc;font-size:11px">Income</th><th style="padding:6px 8px;border:1px solid #ccc;font-size:11px">Expense</th><th style="padding:6px 8px;border:1px solid #ccc;font-size:11px">Net</th></tr>',
                ...yearly.monthlyData.map(m => {
                    const net = m.income - m.expense;
                    return `<tr><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${MONTHS[m.month - 1]}</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">RWF ${m.income.toLocaleString()}</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">RWF ${m.expense.toLocaleString()}</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">RWF ${net.toLocaleString()}</td></tr>`;
                }),
            ].join('');
            bodyRows = summaryRows;
        }

        const html = `
            <html><head><meta charset="UTF-8"></head><body>
            <div style="text-align:center;color:${brown};font-size:20px;font-weight:bold;font-family:Arial">MUHIZI CONSTRUCTION</div>
            <div style="text-align:center;color:${brown};font-size:11px;font-family:Arial;margin-bottom:4px">Building Your Vision, Delivering Excellence</div>
            <hr style="border:1px solid ${brown}" />
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;color:${brown};font-family:Arial;margin:6px 0">
                <span>${title}</span>
                <span>${today} | Period: ${periodStr}</span>
            </div>
            <table style="border-collapse:collapse;width:100%;font-family:Arial">
                ${bodyRows}
            </table>
            <hr style="border:0.5px solid ${brown};margin-top:12px" />
            <div style="text-align:center;color:${brown};font-size:10px;font-family:Arial">Email: info@muhiziconstruction.com | Phone: +250 788 000 000 | Location: Kigali, Rwanda</div>
            </body></html>`;

        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `report_${view}_${periodStr.replace(' ', '_')}.xls`; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, flexShrink: 0 }}>
                    <FaChartBar style={{ color: 'var(--primary)' }} /> Financial Reports
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div className="admin-card" style={{ padding: '0.3rem 0.75rem', display: 'flex', gap: 4 }}>
                        <button className={`admin-btn ${view === 'monthly' ? '' : 'admin-btn--secondary'}`} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setView('monthly')}>Monthly</button>
                        <button className={`admin-btn ${view === 'yearly' ? '' : 'admin-btn--secondary'}`} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setView('yearly')}>Yearly</button>
                    </div>
                    <select className="form-select" style={{ width: 110, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }} value={month} onChange={e => setMonth(Number(e.target.value))}>
                        {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                    </select>
                    <select className="form-select" style={{ width: 90, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }} value={year} onChange={e => setYear(Number(e.target.value))}>
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <button className="admin-btn" onClick={downloadExcel} disabled={!monthly && !yearly} style={{ background: '#8B4513', borderColor: '#8B4513', color: '#fff', borderRadius: 5, padding: '0.6rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, opacity: monthly || yearly ? 1 : 0.5 }}>
                        <FaFileExcel /> Excel
                    </button>
                    <button className="admin-btn" onClick={downloadPDF} disabled={!monthly && !yearly} style={{ background: '#8B4513', borderColor: '#8B4513', color: '#fff', borderRadius: 5, padding: '0.6rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, opacity: monthly || yearly ? 1 : 0.5 }}>
                        <FaFilePdf /> PDF
                    </button>
                </div>
            </div>

            {loading && <div className="admin-card"><p>Loading...</p></div>}

            {!loading && view === 'monthly' && monthly && (
                <>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>RWF {monthly.totalIncome.toLocaleString()}</div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Total Income</div>
                        </div>
                        <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>RWF {monthly.totalExpense.toLocaleString()}</div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Total Expense</div>
                        </div>
                        <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>RWF {monthly.netProfit.toLocaleString()}</div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Net Profit</div>
                        </div>
                        <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{monthly.incomeCount + monthly.expenseCount}</div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Transactions</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="admin-card" style={{ padding: '1.25rem' }}>
                            <h3 style={{ marginBottom: '1rem', color: '#22c55e' }}>Income by Category</h3>
                            {Object.keys(monthly.incomeByCategory).length > 0 ? (
                                <table className="admin-table">
                                    <thead><tr><th>Category</th><th>Amount</th></tr></thead>
                                    <tbody>
                                        {Object.entries(monthly.incomeByCategory).map(([cat, amt]) => (
                                            <tr key={cat}>
                                                <td style={{ textTransform: 'capitalize' }}>{cat.replace('_', ' ')}</td>
                                                <td style={{ fontWeight: 700 }}>RWF {amt.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : <p style={{ color: 'var(--text-muted)' }}>No data</p>}
                        </div>
                        <div className="admin-card" style={{ padding: '1.25rem' }}>
                            <h3 style={{ marginBottom: '1rem', color: '#ef4444' }}>Expense by Category</h3>
                            {Object.keys(monthly.expenseByCategory).length > 0 ? (
                                <table className="admin-table">
                                    <thead><tr><th>Category</th><th>Amount</th></tr></thead>
                                    <tbody>
                                        {Object.entries(monthly.expenseByCategory).map(([cat, amt]) => (
                                            <tr key={cat}>
                                                <td style={{ textTransform: 'capitalize' }}>{cat}</td>
                                                <td style={{ fontWeight: 700 }}>RWF {amt.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : <p style={{ color: 'var(--text-muted)' }}>No data</p>}
                        </div>
                    </div>
                </>
            )}

            {!loading && view === 'yearly' && yearly && (
                <>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>RWF {yearly.totalIncome.toLocaleString()}</div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Total Income</div>
                        </div>
                        <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>RWF {yearly.totalExpense.toLocaleString()}</div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Total Expense</div>
                        </div>
                        <div className="admin-card" style={{ padding: '0.45rem 3.5rem', textAlign: 'center', background: '#8B4513', color: '#fff' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>RWF {yearly.netProfit.toLocaleString()}</div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Net Profit</div>
                        </div>
                    </div>

                    <div className="admin-card" style={{ padding: '1.25rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Monthly Breakdown</h3>
                        <table className="admin-table">
                            <thead><tr><th>Month</th><th>Income</th><th>Expense</th><th>Net</th></tr></thead>
                            <tbody>
                                {yearly.monthlyData.map(m => (
                                    <tr key={m.month}>
                                        <td>{MONTHS[m.month - 1]}</td>
                                        <td style={{ color: '#22c55e', fontWeight: 700 }}>RWF {m.income.toLocaleString()}</td>
                                        <td style={{ color: '#ef4444', fontWeight: 700 }}>RWF {m.expense.toLocaleString()}</td>
                                        <td style={{ fontWeight: 700, color: (m.income - m.expense) >= 0 ? '#22c55e' : '#ef4444' }}>RWF {(m.income - m.expense).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {yearly.monthlyData.length === 0 && <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No data</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {!loading && view === 'monthly' && !monthly && (
                <div className="admin-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No report data for this period.</div>
            )}
            {!loading && view === 'yearly' && !yearly && (
                <div className="admin-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No report data for this year.</div>
            )}
        </div>
    );
};

export default Reports;
