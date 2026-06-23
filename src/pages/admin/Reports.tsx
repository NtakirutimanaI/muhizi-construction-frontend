import { useState, useEffect } from 'react';
import { FaFileExcel, FaFilePdf, FaArrowUp, FaArrowDown, FaBalanceScale } from 'react-icons/fa';
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
        try { const res = await financeService.getMonthlyReport(year, month); setMonthly(res.data); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchYearly = async () => {
        setLoading(true);
        try { const res = await financeService.getYearlyReport(year); setYearly(res.data); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (view === 'monthly') fetchMonthly();
        else fetchYearly();
    }, [view, month, year]);

    const downloadPDF = () => {
        if (!monthly && !yearly) return;
        const doc = new jsPDF();
        const brown = '#1B2042';
        const pageW = doc.internal.pageSize.getWidth();
        const periodStr = view === 'monthly' ? `${MONTHS[month - 1]} ${year}` : `${year}`;

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
        doc.text(`${view === 'monthly' ? 'Monthly' : 'Yearly'} Financial Report`, 14, 40);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#666');
        doc.text(`Generated: ${new Date().toLocaleDateString()} | Period: ${periodStr}`, pageW - 14, 40, { align: 'right' });

        if (view === 'monthly' && monthly) {
            autoTable(doc, {
                head: [['Metric', 'Value']],
                body: [
                    ['Total Income', `RWF ${monthly.totalIncome.toLocaleString()}`],
                    ['Total Expense', `RWF ${monthly.totalExpense.toLocaleString()}`],
                    ['Net Profit', `RWF ${monthly.netProfit.toLocaleString()}`],
                    ['Transactions', String(monthly.incomeCount + monthly.expenseCount)],
                ],
                startY: 46,
                styles: { fontSize: 9, textColor: '#333' },
                headStyles: { fillColor: [139, 69, 19], textColor: [255, 255, 255], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [250, 245, 240] },
            });
            const incomeData = Object.entries(monthly.incomeByCategory);
            if (incomeData.length > 0) {
                const y = (doc as any).lastAutoTable.finalY + 8;
                doc.setFontSize(11); doc.setTextColor(brown); doc.setFont('helvetica', 'bold');
                doc.text('Income by Category', 14, y);
                autoTable(doc, {
                    head: [['Category', 'Amount']],
                    body: incomeData.map(([cat, amt]) => [cat.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()), `RWF ${amt.toLocaleString()}`]),
                    startY: y + 4,
                    styles: { fontSize: 8, textColor: '#333' },
                    headStyles: { fillColor: [139, 69, 19], textColor: [255, 255, 255], fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [250, 245, 240] },
                });
            }
            const expenseData = Object.entries(monthly.expenseByCategory);
            if (expenseData.length > 0) {
                const y = (doc as any).lastAutoTable.finalY + 8;
                doc.setFontSize(11); doc.setTextColor(brown); doc.setFont('helvetica', 'bold');
                doc.text('Expense by Category', 14, y);
                autoTable(doc, {
                    head: [['Category', 'Amount']],
                    body: expenseData.map(([cat, amt]) => [cat.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()), `RWF ${amt.toLocaleString()}`]),
                    startY: y + 4,
                    styles: { fontSize: 8, textColor: '#333' },
                    headStyles: { fillColor: [139, 69, 19], textColor: [255, 255, 255], fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [250, 245, 240] },
                });
            }
        }

        if (view === 'yearly' && yearly) {
            autoTable(doc, {
                head: [['Metric', 'Value']],
                body: [
                    ['Total Income', `RWF ${yearly.totalIncome.toLocaleString()}`],
                    ['Total Expense', `RWF ${yearly.totalExpense.toLocaleString()}`],
                    ['Net Profit', `RWF ${yearly.netProfit.toLocaleString()}`],
                ],
                startY: 46,
                styles: { fontSize: 9, textColor: '#333' },
                headStyles: { fillColor: [139, 69, 19], textColor: [255, 255, 255], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [250, 245, 240] },
            });
            if (yearly.monthlyData.length > 0) {
                const y = (doc as any).lastAutoTable.finalY + 8;
                doc.setFontSize(11); doc.setTextColor(brown); doc.setFont('helvetica', 'bold');
                doc.text('Monthly Breakdown', 14, y);
                autoTable(doc, {
                    head: [['Month', 'Income', 'Expense', 'Net']],
                    body: yearly.monthlyData.map(m => [MONTHS[m.month - 1], `RWF ${m.income.toLocaleString()}`, `RWF ${m.expense.toLocaleString()}`, `RWF ${(m.income - m.expense).toLocaleString()}`]),
                    startY: y + 4,
                    styles: { fontSize: 8, textColor: '#333' },
                    headStyles: { fillColor: [139, 69, 19], textColor: [255, 255, 255], fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [250, 245, 240] },
                });
            }
        }

        const pageH = doc.internal.pageSize.getHeight();
        doc.setDrawColor(brown); doc.setLineWidth(0.5); doc.line(14, pageH - 20, pageW - 14, pageH - 20);
        doc.setFontSize(8); doc.setTextColor(brown); doc.setFont('helvetica', 'normal');
        doc.text('Email: info@muhiziconstruction.com  |  Phone: +250 788 000 000  |  Location: Kigali, Rwanda', pageW / 2, pageH - 14, { align: 'center' });
        doc.save(`report_${view}_${periodStr.replace(' ', '_')}.pdf`);
    };

    const downloadExcel = () => {
        if (!monthly && !yearly) return;
        const brown = '#1B2042';
        const periodStr = view === 'monthly' ? `${MONTHS[month - 1]} ${year}` : `${year}`;
        const title = `${view === 'monthly' ? 'Monthly' : 'Yearly'} Financial Report`;
        let rows = '';

        if (view === 'monthly' && monthly) {
            rows = `
                <tr style="background:${brown};color:#fff"><th colspan="2" style="padding:6px 8px;border:1px solid ${brown};font-size:11px">Summary</th></tr>
                <tr><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px;font-weight:bold">Total Income</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">RWF ${monthly.totalIncome.toLocaleString()}</td></tr>
                <tr><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px;font-weight:bold">Total Expense</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">RWF ${monthly.totalExpense.toLocaleString()}</td></tr>
                <tr><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px;font-weight:bold">Net Profit</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">RWF ${monthly.netProfit.toLocaleString()}</td></tr>
                <tr><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px;font-weight:bold">Transactions</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${monthly.incomeCount + monthly.expenseCount}</td></tr>
                ${Object.entries(monthly.incomeByCategory).length ? '<tr style="background:var(--primary);color:#fff"><th colspan="2" style="padding:6px 8px;border:1px solid var(--primary);font-size:11px">Income by Category</th></tr>' : ''}
                ${Object.entries(monthly.incomeByCategory).map(([cat, amt]) => `<tr><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">RWF ${amt.toLocaleString()}</td></tr>`).join('')}
                ${Object.entries(monthly.expenseByCategory).length ? '<tr style="background:var(--primary);color:#fff"><th colspan="2" style="padding:6px 8px;border:1px solid var(--primary);font-size:11px">Expense by Category</th></tr>' : ''}
                ${Object.entries(monthly.expenseByCategory).map(([cat, amt]) => `<tr><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">RWF ${amt.toLocaleString()}</td></tr>`).join('')}
            `;
        } else if (view === 'yearly' && yearly) {
            rows = `
                <tr style="background:${brown};color:#fff"><th colspan="2" style="padding:6px 8px;border:1px solid ${brown};font-size:11px">Summary</th></tr>
                <tr><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px;font-weight:bold">Total Income</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">RWF ${yearly.totalIncome.toLocaleString()}</td></tr>
                <tr><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px;font-weight:bold">Total Expense</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">RWF ${yearly.totalExpense.toLocaleString()}</td></tr>
                <tr><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px;font-weight:bold">Net Profit</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">RWF ${yearly.netProfit.toLocaleString()}</td></tr>
                <tr style="background:lightgray"><th style="padding:6px 8px;border:1px solid #ccc;font-size:11px">Month</th><th style="padding:6px 8px;border:1px solid #ccc;font-size:11px">Income</th><th style="padding:6px 8px;border:1px solid #ccc;font-size:11px">Expense</th><th style="padding:6px 8px;border:1px solid #ccc;font-size:11px">Net</th></tr>
                ${yearly.monthlyData.map(m => `<tr><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${MONTHS[m.month - 1]}</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">RWF ${m.income.toLocaleString()}</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">RWF ${m.expense.toLocaleString()}</td><td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">RWF ${(m.income - m.expense).toLocaleString()}</td></tr>`).join('')}
            `;
        }

        const html = `<html><head><meta charset="UTF-8"></head><body>
            <div style="text-align:center;color:${brown};font-size:20px;font-weight:bold;font-family:Arial">MUHIZI CONSTRUCTION</div>
            <div style="text-align:center;color:${brown};font-size:11px;font-family:Arial;margin-bottom:4px">Building Your Vision, Delivering Excellence</div>
            <hr style="border:1px solid ${brown}" />
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;color:${brown};font-family:Arial;margin:6px 0"><span>${title}</span><span>${new Date().toLocaleDateString()} | Period: ${periodStr}</span></div>
            <table style="border-collapse:collapse;width:100%;font-family:Arial">${rows}</table>
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
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>Financial Reports</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{view === 'monthly' ? `${MONTHS[month - 1]} ${year}` : year} — income, expenses, and net summary</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 0, border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                        <button onClick={() => setView('monthly')} style={{
                            padding: '0.4rem 0.9rem', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                            background: view === 'monthly' ? '#1B2042' : 'transparent',
                            color: view === 'monthly' ? '#fff' : 'var(--text-muted)',
                        }}>Monthly</button>
                        <button onClick={() => setView('yearly')} style={{
                            padding: '0.4rem 0.9rem', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                            background: view === 'yearly' ? '#1B2042' : 'transparent',
                            color: view === 'yearly' ? '#fff' : 'var(--text-muted)',
                        }}>Yearly</button>
                    </div>
                    <select className="form-select" style={{ width: 110, fontSize: '0.8rem' }} value={month} onChange={e => setMonth(Number(e.target.value))}>
                        {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                    </select>
                    <select className="form-select" style={{ width: 90, fontSize: '0.8rem' }} value={year} onChange={e => setYear(Number(e.target.value))}>
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <button onClick={downloadExcel} disabled={!monthly && !yearly}
                        style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', fontWeight: 600, border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', background: 'transparent', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6, opacity: monthly || yearly ? 1 : 0.5 }}>
                        <FaFileExcel style={{ color: '#22c55e' }} /> Excel
                    </button>
                    <button onClick={downloadPDF} disabled={!monthly && !yearly}
                        style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', fontWeight: 600, border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', background: 'transparent', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6, opacity: monthly || yearly ? 1 : 0.5 }}>
                        <FaFilePdf style={{ color: '#ef4444' }} /> PDF
                    </button>
                </div>
            </div>

            {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading...</p>}

            {!loading && view === 'monthly' && monthly && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="content-card" style={{ padding: '1.25rem', textAlign: 'center', border: '1px solid var(--border-color)', background: '#22c55e10' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>RWF {monthly.totalIncome.toLocaleString()}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Total Income</div>
                        </div>
                        <div className="content-card" style={{ padding: '1.25rem', textAlign: 'center', border: '1px solid var(--border-color)', background: '#ef444410' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>RWF {monthly.totalExpense.toLocaleString()}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Total Expense</div>
                        </div>
                        <div className="content-card" style={{ padding: '1.25rem', textAlign: 'center', border: '1px solid var(--border-color)', background: '#1B204210' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1B2042' }}>RWF {monthly.netProfit.toLocaleString()}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Net Profit</div>
                        </div>
                        <div className="content-card" style={{ padding: '1.25rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{monthly.incomeCount + monthly.expenseCount}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Transactions</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="content-card" style={{ padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaArrowUp /> Income by Category
                            </h3>
                            {Object.keys(monthly.incomeByCategory).length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    {Object.entries(monthly.incomeByCategory).map(([cat, amt]) => (
                                        <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                                            <span style={{ textTransform: 'capitalize' }}>{cat.replace('_', ' ')}</span>
                                            <span style={{ fontWeight: 700, color: '#22c55e' }}>RWF {amt.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data</p>}
                        </div>
                        <div className="content-card" style={{ padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaArrowDown /> Expense by Category
                            </h3>
                            {Object.keys(monthly.expenseByCategory).length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    {Object.entries(monthly.expenseByCategory).map(([cat, amt]) => (
                                        <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                                            <span style={{ textTransform: 'capitalize' }}>{cat.replace('_', ' ')}</span>
                                            <span style={{ fontWeight: 700, color: '#ef4444' }}>RWF {amt.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data</p>}
                        </div>
                    </div>
                </>
            )}

            {!loading && view === 'yearly' && yearly && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="content-card" style={{ padding: '1.25rem', textAlign: 'center', border: '1px solid var(--border-color)', background: '#22c55e10' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>RWF {yearly.totalIncome.toLocaleString()}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Total Income</div>
                        </div>
                        <div className="content-card" style={{ padding: '1.25rem', textAlign: 'center', border: '1px solid var(--border-color)', background: '#ef444410' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>RWF {yearly.totalExpense.toLocaleString()}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Total Expense</div>
                        </div>
                        <div className="content-card" style={{ padding: '1.25rem', textAlign: 'center', border: '1px solid var(--border-color)', background: '#1B204210' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1B2042' }}>RWF {yearly.netProfit.toLocaleString()}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Net Profit</div>
                        </div>
                    </div>

                    <div className="content-card" style={{ padding: '1.25rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaBalanceScale /> Monthly Breakdown
                        </h3>
                        {yearly.monthlyData.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: '500px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', padding: '0.5rem 0', borderBottom: '2px solid var(--border-color)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        <span>Month</span><span style={{ textAlign: 'right' }}>Income</span><span style={{ textAlign: 'right' }}>Expense</span><span style={{ textAlign: 'right' }}>Net</span>
                                    </div>
                                    {yearly.monthlyData.map(m => {
                                        const net = m.income - m.expense;
                                        return (
                                            <div key={m.month} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem', alignItems: 'center' }}>
                                                <span>{MONTHS[m.month - 1]}</span>
                                                <span style={{ textAlign: 'right', fontWeight: 600, color: '#22c55e' }}>RWF {m.income.toLocaleString()}</span>
                                                <span style={{ textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>RWF {m.expense.toLocaleString()}</span>
                                                <span style={{ textAlign: 'right', fontWeight: 700, color: net >= 0 ? '#22c55e' : '#ef4444' }}>RWF {net.toLocaleString()}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data</p>}
                    </div>
                </>
            )}

            {!loading && view === 'monthly' && !monthly && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No report data for this period.</p>
            )}
            {!loading && view === 'yearly' && !yearly && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No report data for this year.</p>
            )}
        </div>
    );
};

export default Reports;
