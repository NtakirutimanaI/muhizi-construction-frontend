import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    FaReceipt, FaEdit, FaTrash, FaPlus, FaTimes as FaTimesIcon, FaSpinner, FaCheck, FaTimes,
    FaCheckCircle, FaTimesCircle, FaClock, FaPaperPlane, FaDollarSign, FaLock,
    FaUser, FaMoneyBillWave, FaStamp, FaClipboardCheck, FaSearch, FaFileExcel, FaSave,
    FaChevronLeft, FaChevronRight, FaTable, FaCopy, FaSearch as FaSearchIcon, FaFilePdf,
} from 'react-icons/fa';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { pettyCashVoucherService } from '../../services/pettyCashVoucherService';
import type { PettyCashVoucher, TransactionLine } from '../../services/pettyCashVoucherService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import ESignature from '../../components/ESignature';
import DocumentPreview from '../../components/DocumentPreview';

const SC: Record<string, { bg: string; c: string; ic: React.ReactNode }> = {
    draft: { bg: '#f3f4f6', c: '#6b7280', ic: <FaEdit size={8} /> },
    pending: { bg: '#fef3c7', c: '#d97706', ic: <FaClock size={8} /> },
    approved: { bg: '#d1fae5', c: '#059669', ic: <FaCheckCircle size={8} /> },
    paid: { bg: '#dbeafe', c: '#2563eb', ic: <FaDollarSign size={8} /> },
    closed: { bg: '#e5e7eb', c: '#374151', ic: <FaLock size={8} /> },
    rejected: { bg: '#fee2e2', c: '#dc2626', ic: <FaTimesCircle size={8} /> },
};

interface FormData {
    date: string; reference: string;
    payeeName: string; employeeId: string; department: string; position: string; payeePhone: string; payeeEmail: string;
    amount: number | ''; currency: string; paymentPurpose: string; paymentMethod: string; paymentDate: string;
    cashFundAccount: string; description: string;
    transactions: TransactionLine[];
    requestedByName: string; requestedBySignature: string; requestedDate: string;
    approvedByName: string; approvedBySignature: string; approvedDate: string;
    paymentConfirmationNotes: string;
}

const emptyForm = (): FormData => ({
    date: new Date().toISOString().split('T')[0], reference: '',
    payeeName: '', employeeId: '', department: '', position: '', payeePhone: '', payeeEmail: '',
    amount: '', currency: 'RWF', paymentPurpose: '', paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0], cashFundAccount: '', description: '',
    transactions: [],
    requestedByName: '', requestedBySignature: '', requestedDate: '',
    approvedByName: '', approvedBySignature: '', approvedDate: '',
    paymentConfirmationNotes: '',
});

const DEPTS = ['Finance', 'HR', 'Operations', 'Projects', 'Procurement', 'IT', 'Engineering', 'Site', 'Other'];
const METHODS = ['cash', 'mobile_money', 'bank_transfer', 'cheque'];
const PAGE_SIZES = [5, 10, 15, 20];

const newTxn = (): TransactionLine => ({
    id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    date: new Date().toISOString().split('T')[0], description: '', debit: 0, credit: 0,
});

const sDr = (t: TransactionLine[]) => t.reduce((s, x) => s + (Number(x.debit) || 0), 0);
const sCr = (t: TransactionLine[]) => t.reduce((s, x) => s + (Number(x.credit) || 0), 0);
const sBal = (t: TransactionLine[]) => sCr(t) - sDr(t);

const fmt = (n: number) => n.toLocaleString('en-US');

const previewHtml = (v: PettyCashVoucher): string => {
    const tx = v.transactions || [];
    const tDr = sDr(tx), tCr = sCr(tx), tBal = sBal(tx);
    const brown = '#1B2042', gray = '#555', lightBg = '#faf9f7', border = '#e5e7eb';
    const statusColor: Record<string, string> = { draft: '#6b7280', pending: '#d97706', approved: '#059669', paid: '#2563eb', closed: '#374151', rejected: '#dc2626' };
    const sc = statusColor[v.status] || '#6b7280';
    const rows = tx.map((t, i) => `<tr><td style="padding:6px 10px;text-align:center;font-size:13px;color:#666;border-bottom:1px solid #eee">${i + 1}</td><td style="padding:6px 10px;font-size:13px;border-bottom:1px solid #eee">${t.date || '—'}</td><td style="padding:6px 10px;font-size:13px;border-bottom:1px solid #eee">${t.description || '—'}</td><td style="padding:6px 10px;text-align:right;font-weight:600;color:#dc2626;font-size:13px;border-bottom:1px solid #eee">${t.debit ? `RWF ${fmt(t.debit)}` : '—'}</td><td style="padding:6px 10px;text-align:right;font-weight:600;color:#16a34a;font-size:13px;border-bottom:1px solid #eee">${t.credit ? `RWF ${fmt(t.credit)}` : '—'}</td></tr>`).join('');

    return `
    <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#333;max-width:794px;margin:0 auto;background:#fff;padding:0">
        <div style="padding:24px 32px 16px;display:flex;align-items:center;gap:16px;border-bottom:3px solid ${brown}">
            <div style="width:60px;height:60px;border-radius:8px;overflow:hidden;flex-shrink:0;background:#f0eeeb;display:flex;align-items:center;justify-content:center"><img src="/logo.jpeg" alt="Logo" style="width:100%;height:100%;object-fit:contain" onerror="this.style.display='none';this.parentNode.innerHTML='<span style=&quot;color:#fff;font-size:22px;font-weight:800&quot;>MC</span>'" /></div>
            <div>
                <div style="font-size:20px;font-weight:800;color:${brown};letter-spacing:0.5px">MUHIZI CONSTRUCTION</div>
                <div style="font-size:12px;color:#888;font-style:italic;margin-top:2px">Our Success is to serve opportunely your exigencies</div>
                <div style="font-size:11px;color:#aaa;margin-top:2px">Kigali, Rwanda, Nyarugenge, Nyamirambo, Cosmos | muhizidesigningacademy@gmail.com | +250 780 620 735</div>
            </div>
        </div>

        <div style="background:${brown};color:#fff;padding:12px 32px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:16px;font-weight:700;letter-spacing:1px">PETTY CASH VOUCHER</span>
            <span style="font-size:13px;opacity:0.8">${v.voucherNumber}</span>
        </div>

        <div style="padding:16px 32px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;background:${lightBg};border-bottom:1px solid ${border}">
            <div><div style="font-size:10px;color:#999;text-transform:uppercase;font-weight:600;margin-bottom:2px">Date</div><div style="font-size:13px;font-weight:600">${v.date || '—'}</div></div>
            <div><div style="font-size:10px;color:#999;text-transform:uppercase;font-weight:600;margin-bottom:2px">Reference</div><div style="font-size:13px;font-weight:600">${v.reference || '—'}</div></div>
            <div><div style="font-size:10px;color:#999;text-transform:uppercase;font-weight:600;margin-bottom:2px">Status</div><div style="font-size:13px;font-weight:700;color:${sc};text-transform:uppercase">${(v.status || '').toUpperCase()}</div></div>
            <div><div style="font-size:10px;color:#999;text-transform:uppercase;font-weight:600;margin-bottom:2px">Currency</div><div style="font-size:13px;font-weight:600">${v.currency || 'RWF'}</div></div>
        </div>

        <div style="padding:20px 32px 12px">
            <div style="font-size:13px;font-weight:700;color:${brown};padding:6px 12px;background:${lightBg};border-left:3px solid ${brown};margin-bottom:10px">PAYEE INFORMATION</div>
            <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:4px 0;width:50%"><span style="font-size:11px;color:#999">Recipient Name: </span><span style="font-size:13px;font-weight:600">${v.payeeName || '—'}</span></td><td style="padding:4px 0"><span style="font-size:11px;color:#999">Employee ID: </span><span style="font-size:13px">${v.employeeId || '—'}</span></td></tr>
                <tr><td style="padding:4px 0"><span style="font-size:11px;color:#999">Department: </span><span style="font-size:13px">${v.department || '—'}</span></td><td style="padding:4px 0"><span style="font-size:11px;color:#999">Position: </span><span style="font-size:13px">${v.position || '—'}</span></td></tr>
                <tr><td style="padding:4px 0"><span style="font-size:11px;color:#999">Phone: </span><span style="font-size:13px">${v.payeePhone || '—'}</span></td><td style="padding:4px 0"><span style="font-size:11px;color:#999">Email: </span><span style="font-size:13px">${v.payeeEmail || '—'}</span></td></tr>
            </table>
        </div>

        <div style="padding:12px 32px 12px">
            <div style="font-size:13px;font-weight:700;color:${brown};padding:6px 12px;background:${lightBg};border-left:3px solid ${brown};margin-bottom:10px">PAYMENT DETAILS</div>
            <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:4px 0;width:50%"><span style="font-size:11px;color:#999">Purpose: </span><span style="font-size:13px;font-weight:600">${v.paymentPurpose || '—'}</span></td><td style="padding:4px 0"><span style="font-size:11px;color:#999">Method: </span><span style="font-size:13px">${(v.paymentMethod || 'cash').replace('_', ' ')}</span></td></tr>
                <tr><td style="padding:4px 0"><span style="font-size:11px;color:#999">Cash Fund: </span><span style="font-size:13px">${v.cashFundAccount || '—'}</span></td><td style="padding:4px 0"><span style="font-size:11px;color:#999">Payment Date: </span><span style="font-size:13px">${v.paymentDate || v.date || '—'}</span></td></tr>
                ${v.description ? `<tr><td colspan="2" style="padding:4px 0"><span style="font-size:11px;color:#999">Description: </span><span style="font-size:13px">${v.description}</span></td></tr>` : ''}
            </table>
        </div>

        <div style="padding:12px 32px 12px">
            <div style="font-size:13px;font-weight:700;color:${brown};padding:6px 12px;background:${lightBg};border-left:3px solid ${brown};margin-bottom:10px">TRANSACTION LEDGER (Dr / Cr)</div>
            <table style="width:100%;border-collapse:collapse;border:1px solid ${border}">
                <thead><tr style="background:${brown}">
                    <th style="padding:8px 10px;text-align:center;color:#fff;font-size:12px;font-weight:600;border:1px solid ${brown}">#</th>
                    <th style="padding:8px 10px;text-align:left;color:#fff;font-size:12px;font-weight:600;border:1px solid ${brown}">Date</th>
                    <th style="padding:8px 10px;text-align:left;color:#fff;font-size:12px;font-weight:600;border:1px solid ${brown}">Description</th>
                    <th style="padding:8px 10px;text-align:right;color:#fff;font-size:12px;font-weight:600;border:1px solid ${brown}">Debit (Dr)</th>
                    <th style="padding:8px 10px;text-align:right;color:#fff;font-size:12px;font-weight:600;border:1px solid ${brown}">Credit (Cr)</th>
                </tr></thead>
                <tbody>
                    ${rows || `<tr><td colspan="5" style="padding:16px;text-align:center;color:#aaa;font-size:13px">No transactions</td></tr>`}
                </tbody>
                <tfoot>
                    <tr style="background:${lightBg}">
                        <td colspan="3" style="padding:8px 10px;font-weight:700;font-size:13px;text-align:right;border-top:2px solid ${brown}">TOTALS</td>
                        <td style="padding:8px 10px;text-align:right;font-weight:700;color:#dc2626;font-size:13px;border-top:2px solid ${brown}">RWF ${fmt(tDr)}</td>
                        <td style="padding:8px 10px;text-align:right;font-weight:700;color:#16a34a;font-size:13px;border-top:2px solid ${brown}">RWF ${fmt(tCr)}</td>
                    </tr>
                    <tr style="background:#f3f4f6">
                        <td colspan="3" style="padding:8px 10px;font-weight:700;font-size:13px;text-align:right">BALANCE (Cr - Dr)</td>
                        <td colspan="2" style="padding:8px 10px;text-align:right;font-weight:700;font-size:14px;color:${tBal >= 0 ? '#16a34a' : '#dc2626'}">RWF ${fmt(tBal)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>

        <div style="padding:12px 32px 12px">
            <div style="font-size:13px;font-weight:700;color:${brown};padding:6px 12px;background:${lightBg};border-left:3px solid ${brown};margin-bottom:10px">APPROVALS & SIGNATURES</div>
            <table style="width:100%;border-collapse:collapse">
                <tr>
                    <td style="padding:6px 0;width:50%;vertical-align:top">
                        <div style="font-size:11px;color:#999;font-weight:600;margin-bottom:4px">REQUESTED BY</div>
                        <div style="font-size:13px;font-weight:600">${v.requestedByName || '_________________________'}</div>
                        <div style="font-size:12px;color:#666;margin-top:2px">Date: ${v.requestedDate || '____________'}</div>
                        ${v.requestedBySignature ? `<img src="${v.requestedBySignature}" style="height:40px;margin-top:6px" />` : `<div style="width:120px;border-bottom:1px solid #ccc;margin-top:16px;font-size:10px;color:#aaa;text-align:center">Signature</div>`}
                    </td>
                    <td style="padding:6px 0;width:50%;vertical-align:top">
                        <div style="font-size:11px;color:#999;font-weight:600;margin-bottom:4px">APPROVED BY</div>
                        <div style="font-size:13px;font-weight:600">${v.approvedByName || '_________________________'}</div>
                        <div style="font-size:12px;color:#666;margin-top:2px">Date: ${v.approvedDate || '____________'}</div>
                        ${v.approvedBySignature ? `<img src="${v.approvedBySignature}" style="height:40px;margin-top:6px" />` : `<div style="width:120px;border-bottom:1px solid #ccc;margin-top:16px;font-size:10px;color:#aaa;text-align:center">Signature</div>`}
                    </td>
                </tr>
            </table>
        </div>

        ${(v.status === 'paid' || v.status === 'closed') ? `
        <div style="padding:12px 32px 12px">
            <div style="font-size:13px;font-weight:700;color:${brown};padding:6px 12px;background:${lightBg};border-left:3px solid ${brown};margin-bottom:10px">PAYMENT CONFIRMATION</div>
            <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:4px 0;width:50%"><span style="font-size:11px;color:#999">Confirmed By: </span><span style="font-size:13px;font-weight:600">${v.confirmedByName || '—'}</span></td><td style="padding:4px 0"><span style="font-size:11px;color:#999">Date: </span><span style="font-size:13px">${v.confirmedDate || '—'}</span></td></tr>
                ${v.paymentConfirmationNotes ? `<tr><td colspan="2" style="padding:4px 0"><span style="font-size:11px;color:#999">Notes: </span><span style="font-size:13px">${v.paymentConfirmationNotes}</span></td></tr>` : ''}
            </table>
        </div>` : ''}

        <div style="padding:16px 32px;border-top:2px solid ${brown};margin-top:12px">
            <div style="font-size:11px;color:#999;text-align:center;margin-bottom:6px">MUHIZI CONSTRUCTION | Kigali, Rwanda, Nyarugenge, Nyamirambo, Cosmos | muhizidesigningacademy@gmail.com | +250 780 620 735</div>
            <div style="font-size:10px;color:#bbb;text-align:center">Created by: ${v.createdByName || 'System'} | Software: ${v.softwareVersion || 'v2.1.0'} | ${v.voucherNumber} | Generated: ${new Date().toLocaleString()}</div>
        </div>
    </div>`;
};

const dlExcel = (v: PettyCashVoucher) => {
    const wb = XLSX.utils.book_new();
    const tx = v.transactions || [];
    const tDr = sDr(tx), tCr = sCr(tx), tBal = sBal(tx);
    const rows: (string | number | object)[][] = [
        ['MUHIZI CONSTRUCTION'],
        ['Our Success is to serve opportunely your exigencies'],
        ['Kigali, Rwanda, Nyarugenge, Nyamirambo, Cosmos | muhizidesigningacademy@gmail.com | +250 780 620 735'],
        [''],
        ['PETTY CASH VOUCHER', '', '', '', '', '', ''],
        [''],
        ['Voucher Number', v.voucherNumber, '', 'Date', v.date, '', 'Status', (v.status || '').toUpperCase()],
        ['Reference', v.reference || '—', '', 'Currency', v.currency || 'RWF', '', 'Payment Method', (v.paymentMethod || 'cash').replace('_', ' ')],
        [''],
        ['--- PAYEE INFORMATION ---'],
        [''],
        ['Recipient Name', v.payeeName, '', 'Employee ID', v.employeeId || '—'],
        ['Department', v.department || '—', '', 'Position', v.position || '—'],
        ['Phone', v.payeePhone || '—', '', 'Email', v.payeeEmail || '—'],
        [''],
        ['--- PAYMENT DETAILS ---'],
        [''],
        ['Payment Purpose', v.paymentPurpose],
        ['Cash Fund / Account', v.cashFundAccount || '—'],
        ['Payment Date', v.paymentDate || v.date],
        ['Description', v.description || '—'],
        [''],
        ['--- TRANSACTION LEDGER (Dr / Cr) ---'],
        [''],
        ['#', 'Date', 'Description', 'Debit (Dr)', 'Credit (Cr)'],
    ];
    const startRow = rows.length;
    tx.forEach((t, i) => rows.push([i + 1, t.date, t.description, t.debit || 0, t.credit || 0]));
    const endRow = rows.length;
    rows.push(['', '', 'TOTALS', { f: `SUM(D${startRow + 1}:D${endRow})` }, { f: `SUM(E${startRow + 1}:E${endRow})` }]);
    rows.push(['', '', 'BALANCE (Cr - Dr)', '', { f: `E${endRow + 1}-D${endRow + 1}` }]);
    rows.push([''],
        ['--- APPROVALS & SIGNATURES ---'],
        [''],
        ['Requested By', v.requestedByName || '—', '', 'Date', v.requestedDate || '—'],
        ['Approved By', v.approvedByName || '—', '', 'Date', v.approvedDate || '—'],
        [''],
        ['--- PAYMENT CONFIRMATION ---'],
        [''],
        ['Confirmed By', v.confirmedByName || '—', '', 'Date', v.confirmedDate || '—'],
        ['Notes', v.paymentConfirmationNotes || '—'],
        [''],
        ['--- AUDIT TRAIL ---'],
        ['Created By', v.createdByName || 'System', '', 'Software Version', v.softwareVersion || 'v2.1.0'],
        ['Last Modified', v.lastModifiedByName || '—', '', 'Created', v.createdAt ? new Date(v.createdAt).toLocaleString() : '—'],
        [''],
        ['MUHIZI CONSTRUCTION | Kigali, Rwanda, Nyarugenge, Nyamirambo, Cosmos | muhizidesigningacademy@gmail.com | +250 780 620 735'],
    );
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 18 }, { wch: 28 }, { wch: 18 }, { wch: 38 }, { wch: 18 }, { wch: 4 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, v.voucherNumber || 'Voucher');
    XLSX.writeFile(wb, `${v.voucherNumber || 'voucher'}_${(v.payeeName || 'record').replace(/\s+/g, '_')}.xlsx`);
};

const dlPDF = async (v: PettyCashVoucher): Promise<string> => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const brown = [27, 32, 66];
    const gray = '#555555';
    let y = 10;

    // --- HEADER: Logo + Company ---
    try {
        const logoUrl = `${window.location.origin}/logo.jpeg`;
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => resolve(i); i.onerror = reject; i.src = logoUrl;
        });
        doc.addImage(img, 'PNG', 14, y, 20, 20);
    } catch { doc.setFillColor(...brown); doc.roundedRect(14, y, 20, 20, 3, 3, 'F'); doc.setFontSize(14); doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.text('MC', 24, y + 13, { align: 'center' }); }

    doc.setFontSize(20); doc.setTextColor(...brown); doc.setFont('helvetica', 'bold');
    doc.text('MUHIZI CONSTRUCTION', 38, y + 9);
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor('#888888');
    doc.text('Our Success is to serve opportunely your exigencies', 38, y + 14);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor('#aaaaaa');
    doc.text('Kigali, Rwanda, Nyarugenge, Nyamirambo, Cosmos  |  muhizidesigningacademy@gmail.com  |  +250 780 620 735', 38, y + 18);

    // Double line separator
    y += 24;
    doc.setDrawColor(...brown); doc.setLineWidth(0.7); doc.line(14, y, pw - 14, y);
    doc.setLineWidth(0.3); doc.line(14, y + 1.5, pw - 14, y + 1.5);
    y += 6;

    // Title bar
    doc.setFillColor(...brown); doc.rect(14, y, pw - 28, 10, 'F');
    doc.setFontSize(13); doc.setTextColor(255); doc.setFont('helvetica', 'bold');
    doc.text('PETTY CASH VOUCHER', 18, y + 7);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(v.voucherNumber, pw - 18, y + 7, { align: 'right' });
    y += 14;

    // Meta row
    const metas: [string, string][] = [['Date:', v.date], ['Ref:', v.reference || '—'], ['Status:', (v.status || '').toUpperCase()], ['Currency:', v.currency || 'RWF']];
    metas.forEach(([lbl, val], i) => {
        const mx = 14 + (i * ((pw - 28) / 4));
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...brown); doc.text(lbl, mx, y + 3);
        doc.setFont('helvetica', 'normal'); doc.setTextColor('#333333'); doc.text(val, mx + doc.getTextWidth(lbl) + 2, y + 3);
    });
    y += 7;
    doc.setDrawColor('#dddddd'); doc.setLineWidth(0.2); doc.line(14, y, pw - 14, y);
    y += 5;

    // Section helper
    const section = (title: string) => {
        doc.setFillColor(245, 243, 240); doc.rect(14, y, pw - 28, 7, 'F');
        doc.setFillColor(...brown); doc.rect(14, y, 3, 7, 'F');
        doc.setFontSize(8.5); doc.setTextColor(...brown); doc.setFont('helvetica', 'bold');
        doc.text(title, 20, y + 4.8);
        y += 9;
    };

    const field2 = (l1: string, v1: string, l2: string, v2: string) => {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold'); doc.setTextColor('#999999'); doc.text(l1, 16, y);
        doc.setFont('helvetica', 'normal'); doc.setTextColor('#333333'); doc.text(v1 || '—', 16 + doc.getTextWidth(l1) + 2, y);
        if (l2) {
            doc.setFont('helvetica', 'bold'); doc.setTextColor('#999999'); doc.text(l2, pw / 2 + 2, y);
            doc.setFont('helvetica', 'normal'); doc.setTextColor('#333333'); doc.text(v2 || '—', pw / 2 + 2 + doc.getTextWidth(l2) + 2, y);
        }
        y += 4.5;
    };

    // PAYEE
    section('PAYEE INFORMATION');
    field2('Recipient:', v.payeeName, 'Employee ID:', v.employeeId || '—');
    field2('Department:', v.department || '—', 'Position:', v.position || '—');
    field2('Phone:', v.payeePhone || '—', 'Email:', v.payeeEmail || '—');
    y += 2;

    // PAYMENT
    section('PAYMENT DETAILS');
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor('#999999'); doc.text('Purpose:', 16, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor('#333333'); doc.text(v.paymentPurpose || '—', 16 + doc.getTextWidth('Purpose:') + 2, y);
    y += 4.5;
    field2('Method:', (v.paymentMethod || 'cash').replace('_', ' '), 'Cash Fund:', v.cashFundAccount || '—');
    field2('Payment Date:', v.paymentDate || v.date, '', '');
    if (v.description) {
        doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor('#999999'); doc.text('Description:', 16, y);
        doc.setFont('helvetica', 'normal'); doc.setTextColor('#333333');
        const lines = doc.splitTextToSize(v.description, pw - 40);
        doc.text(lines, 16 + doc.getTextWidth('Description:') + 2, y);
        y += lines.length * 3.5 + 2;
    }
    y += 2;

    // TRANSACTION LEDGER
    section('TRANSACTION LEDGER (Dr / Cr)');
    const tx = v.transactions || [];
    const tDr = sDr(tx), tCr = sCr(tx), tBal = sBal(tx);
    const txBody = tx.map((t, i) => [String(i + 1), t.date, t.description, t.debit ? `RWF ${fmt(t.debit)}` : '—', t.credit ? `RWF ${fmt(t.credit)}` : '—']);
    txBody.push(['', '', 'TOTALS', `RWF ${fmt(tDr)}`, `RWF ${fmt(tCr)}`]);
    txBody.push(['', '', 'BALANCE (Cr - Dr)', '', `RWF ${fmt(tBal)}`]);

    autoTable(doc, {
        startY: y,
        head: [['#', 'Date', 'Description', 'Debit (Dr)', 'Credit (Cr)']],
        body: txBody,
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 2.5, textColor: '#333333', lineColor: '#eeeeee', lineWidth: 0.2 },
        headStyles: { fillColor: brown, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 24 }, 3: { halign: 'right', fontStyle: 'bold' }, 4: { halign: 'right', fontStyle: 'bold' } },
        alternateRowStyles: { fillColor: [250, 248, 245] },
        margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 5;

    // SIGNATURES
    section('APPROVALS & SIGNATURES');
    const drawSig = (dataUrl: string | undefined, sx: number, sy: number) => {
        if (!dataUrl) { doc.setDrawColor('#cccccc'); doc.setLineWidth(0.3); doc.line(sx, sy - 14, sx + 55, sy - 14); return; }
        try { doc.addImage(dataUrl, 'PNG', sx, sy - 20, 55, 18); } catch { /* skip */ }
    };

    doc.setFontSize(7.5); doc.setTextColor(...brown); doc.setFont('helvetica', 'bold');
    doc.text('REQUESTED BY', 16, y); doc.text('APPROVED BY', pw / 2 + 2, y);
    y += 5;
    doc.setFont('helvetica', 'normal'); doc.setTextColor(gray);
    doc.text(`Name: ${v.requestedByName || '_________________________'}`, 16, y);
    doc.text(`Name: ${v.approvedByName || '_________________________'}`, pw / 2 + 2, y);
    y += 4;
    doc.text(`Date: ${v.requestedDate || '____________'}`, 16, y);
    doc.text(`Date: ${v.approvedDate || '____________'}`, pw / 2 + 2, y);
    y += 4;
    drawSig(v.requestedBySignature, 16, y + 18);
    drawSig(v.approvedBySignature, pw / 2 + 2, y + 18);
    doc.setFontSize(6.5); doc.setTextColor('#aaaaaa'); doc.setFont('helvetica', 'italic');
    doc.text('Signature', 16, y + 20); doc.text('Signature', pw / 2 + 2, y + 20);
    y += 24;

    // PAYMENT CONFIRMATION
    if (v.status === 'paid' || v.status === 'closed') {
        section('PAYMENT CONFIRMATION');
        field2('Confirmed By:', v.confirmedByName || '—', 'Date:', v.confirmedDate || '—');
        if (v.paymentConfirmationNotes) {
            doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor('#999999'); doc.text('Notes:', 16, y);
            doc.setFont('helvetica', 'normal'); doc.setTextColor('#333333');
            const nl = doc.splitTextToSize(v.paymentConfirmationNotes, pw - 40);
            doc.text(nl, 16 + doc.getTextWidth('Notes:') + 2, y);
            y += nl.length * 3.5 + 2;
        }
        y += 2;
    }

    // FOOTER
    const footY = ph - 14;
    doc.setDrawColor(...brown); doc.setLineWidth(0.4); doc.line(14, footY, pw - 14, footY);
    doc.setFontSize(7); doc.setTextColor(...brown); doc.setFont('helvetica', 'normal');
    doc.text('MUHIZI CONSTRUCTION  |  Kigali, Rwanda, Nyarugenge, Nyamirambo, Cosmos  |  muhizidesigningacademy@gmail.com  |  +250 780 620 735', pw / 2, footY + 4, { align: 'center' });
    doc.setFontSize(6); doc.setTextColor('#aaaaaa');
    doc.text(`Created by: ${v.createdByName || 'System'}  |  ${v.softwareVersion || 'v2.1.0'}  |  ${v.voucherNumber}  |  Generated: ${new Date().toLocaleString()}`, pw / 2, footY + 8, { align: 'center' });

    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
};

const downloadPdf = async (v: PettyCashVoucher) => {
    const url = await dlPDF(v);
    const a = document.createElement('a'); a.href = url; a.download = `${v.voucherNumber || 'voucher'}_${(v.payeeName || 'record').replace(/\s+/g, '_')}.pdf`;
    a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
};

const PettyCashVoucher = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const isFin = user?.role === 'finance_director' || user?.role === 'admin';
    const [all, setAll] = useState<PettyCashVoucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sheets, setSheets] = useState<{ id: string; label: string; status: string; form: FormData; saved: boolean; bid?: string }[]>([]);
    const [ai, setAi] = useState(0);
    const [search, setSearch] = useState('');
    const [sFilt, setSFilt] = useState('');
    const [showList, setShowList] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [rej, setRej] = useState<{ i: number; v: PettyCashVoucher } | null>(null);
    const [rejR, setRejR] = useState('');
    const [pay, setPay] = useState<{ i: number; v: PettyCashVoucher } | null>(null);
    const [payN, setPayN] = useState('');
    const [del, setDel] = useState<{ i: number; l: string } | null>(null);
    const [preview, setPreview] = useState<{ open: boolean; type: 'pdf' | 'excel'; voucher: PettyCashVoucher | null; blobUrl?: string; html?: string; loading: boolean }>({ open: false, type: 'pdf', voucher: null, loading: false });
    const tRef = useRef<HTMLDivElement>(null);

    const fetch = async () => { try { const r = await pettyCashVoucherService.getAll(); setAll(r.data || []); } catch {} finally { setLoading(false); } };
    useEffect(() => { fetch(); }, []);

    const mk = () => { const t = { id: `n${Date.now()}`, label: 'New Voucher', status: 'draft', form: emptyForm(), saved: false }; setSheets(p => { const n = [...p, t]; setAi(n.length - 1); return n; }); setShowList(false); };
    const open = (v: PettyCashVoucher) => {
        const ex = sheets.findIndex(s => s.bid === v.id);
        if (ex >= 0) { setAi(ex); setShowList(false); return; }
        const t = { id: v.id, label: v.voucherNumber, status: v.status, saved: true, bid: v.id, form: {
            date: v.date, reference: v.reference || '', payeeName: v.payeeName, employeeId: v.employeeId || '', department: v.department || '',
            position: v.position || '', payeePhone: v.payeePhone || '', payeeEmail: v.payeeEmail || '',
            amount: v.amount || '', currency: v.currency || 'RWF', paymentPurpose: v.paymentPurpose, paymentMethod: v.paymentMethod || 'cash',
            paymentDate: v.paymentDate || v.date, cashFundAccount: v.cashFundAccount || '', description: v.description || '',
            transactions: v.transactions?.map(x => ({ ...x })) || [],
            requestedByName: v.requestedByName || '', requestedBySignature: v.requestedBySignature || '', requestedDate: v.requestedDate || '',
            approvedByName: v.approvedByName || '', approvedBySignature: v.approvedBySignature || '', approvedDate: v.approvedDate || '',
            paymentConfirmationNotes: v.paymentConfirmationNotes || '',
        }};
        setSheets(p => { const n = [...p, t]; setAi(n.length - 1); return n; });
        setShowList(false);
    };
    const close = (i: number) => { setSheets(p => p.filter((_, j) => j !== i)); setAi(p => { if (i < p) return p - 1; if (i >= p && p > 0) return p - 1; return 0; }); };
    const uf = (i: number, patch: Partial<FormData>) => setSheets(p => p.map((s, j) => j === i ? { ...s, form: { ...s.form, ...patch } } : s));
    const act = sheets[ai];
    const gV = (t: typeof act) => all.find(v => v.id === t?.bid);

    const save = async () => {
        if (!act) return;
        if (!act.form.payeeName.trim()) { showToast('Recipient name is required', 'error'); return; }
        if (!act.form.paymentPurpose.trim()) { showToast('Purpose is required', 'error'); return; }
        setSaving(true);
        try {
            const tx = act.form.transactions;
            const amt = sCr(tx) > 0 ? sCr(tx) : sDr(tx);
            const p = { ...act.form, amount: amt || (typeof act.form.amount === 'number' ? act.form.amount : 0), transactions: tx, softwareVersion: 'v2.1.0' };
            if (act.bid) { await pettyCashVoucherService.update(act.bid, p); showToast('Updated', 'success'); }
            else { const r = await pettyCashVoucherService.create(p); setSheets(s => s.map((x, j) => j === ai ? { ...x, saved: true, bid: r.data.id, label: r.data.voucherNumber, status: r.data.status } : x)); showToast('Created', 'success'); }
            fetch();
        } catch (e: any) { showToast(e?.response?.data?.message || 'Failed', 'error'); } finally { setSaving(false); }
    };

    const act2 = async (fn: () => Promise<any>, m: string) => { try { await fn(); showToast(m, 'success'); fetch(); } catch (e: any) { showToast(e?.response?.data?.message || 'Failed', 'error'); } };
    const sc = tRef.current?.scrollBy;

    const fList = useMemo(() => all.filter(v => {
        const q = search.toLowerCase().trim();
        if (q && !v.voucherNumber.toLowerCase().includes(q) && !v.payeeName.toLowerCase().includes(q)) return false;
        if (sFilt && v.status !== sFilt) return false;
        return true;
    }), [all, search, sFilt]);

    const months = useMemo(() => {
        const map = new Map<string, PettyCashVoucher[]>();
        fList.forEach(v => {
            const d = new Date(v.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(v);
        });
        const entries = Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
        return entries.map(([key, vouchers]) => ({
            key,
            label: new Date(key + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
            vouchers: vouchers.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            totalDr: vouchers.reduce((s, v) => s + sDr(v.transactions || []), 0),
            totalCr: vouchers.reduce((s, v) => s + sCr(v.transactions || []), 0),
            totalAmount: vouchers.reduce((s, v) => s + Number(v.amount || 0), 0),
        }));
    }, [fList]);

    const totalPages = pageSize === 0 ? 1 : Math.ceil(months.length / pageSize);
    const paginatedMonths = useMemo(() => {
        if (pageSize === 0) return months;
        const start = (page - 1) * pageSize;
        return months.slice(start, start + pageSize);
    }, [months, page, pageSize]);

    useEffect(() => { if (page > totalPages) setPage(totalPages || 1); }, [totalPages, page]);

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}><FaSpinner className="spin" size={28} style={{ color: 'var(--primary)' }} /></div>;

    const tx = act?.form.transactions || [];
    const tDr = sDr(tx), tCr = sCr(tx), tBal = sBal(tx);

    const inp: React.CSSProperties = { padding: '4px 6px', fontSize: '0.78rem', width: '100%', boxSizing: 'border-box' };
    const lbl: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 2, display: 'block' };

    return (
        <div style={{ maxWidth: '100vw', overflow: 'hidden' }}>
            {/* TOOLBAR */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0, fontSize: '1rem' }}><FaReceipt style={{ color: 'var(--primary)' }} /> Petty Cash Voucher</h2>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => setShowList(!showList)} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border-color)', background: '#fff', cursor: 'pointer', fontSize: '0.72rem' }}><FaSearchIcon size={9} style={{ marginRight: 3 }} />{showList ? 'Hide' : 'List'}</button>
                    <button onClick={mk} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #1B2042', background: '#1B2042', color: '#fff', cursor: 'pointer', fontSize: '0.72rem' }}><FaPlus size={9} style={{ marginRight: 3 }} />New</button>
                </div>
            </div>

            {/* TABS */}
            {sheets.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px 6px 0 0', padding: '2px 2px 0', overflow: 'hidden' }}>
                    <button onClick={() => tRef.current?.scrollBy({ left: -120, behavior: 'smooth' })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: '#999' }}><FaChevronLeft size={9} /></button>
                    <div ref={tRef} style={{ display: 'flex', gap: 1, overflowX: 'auto', flex: 1, scrollbarWidth: 'none' }}>
                        {sheets.map((s, i) => { const sc2 = SC[s.status] || SC.draft; const a = i === ai; return (
                            <div key={s.id} onClick={() => { setAi(i); setShowList(false); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: '4px 4px 0 0', cursor: 'pointer', fontSize: '0.7rem', fontWeight: a ? 700 : 500, whiteSpace: 'nowrap', background: a ? '#1B2042' : 'transparent', color: a ? '#fff' : '#333', border: a ? '1px solid #1B2042' : '1px solid transparent', borderBottom: a ? '1px solid #1B2042' : '1px solid #e5e7eb' }}>
                                {!s.saved && <span style={{ width: 4, height: 4, borderRadius: '50%', background: a ? '#fbbf24' : '#f59e0b' }} />}
                                <span>{s.label}</span>
                                {s.saved && <span style={{ padding: '0 3px', borderRadius: 2, background: a ? 'rgba(255,255,255,0.2)' : sc2.bg, color: a ? '#fff' : sc2.c, fontSize: '0.55rem', fontWeight: 700 }}>{s.status}</span>}
                                <button onClick={e => { e.stopPropagation(); close(i); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: a ? 'rgba(255,255,255,0.6)' : '#999', padding: 0 }}><FaTimes size={8} /></button>
                            </div>
                        ); })}
                    </div>
                    <button onClick={() => tRef.current?.scrollBy({ left: 120, behavior: 'smooth' })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: '#999' }}><FaChevronRight size={9} /></button>
                </div>
            )}

            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                {/* LIST */}
                {showList && (
                    <div style={{ width: 260, flexShrink: 0, background: '#fff', border: '1px solid var(--border-color)', borderRadius: 6, padding: 6, maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}>
                        {/* Search & Filter */}
                        <input type="text" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ ...inp, marginBottom: 4, border: '1px solid var(--border-color)', borderRadius: 4 }} />
                        <select value={sFilt} onChange={e => { setSFilt(e.target.value); setPage(1); }} style={{ ...inp, marginBottom: 6, border: '1px solid var(--border-color)', borderRadius: 4 }}>
                            <option value="">All Status</option>
                            {Object.keys(SC).map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                        </select>

                        {/* Monthly Groups */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {paginatedMonths.length === 0 && <p style={{ textAlign: 'center', color: '#999', fontSize: '0.72rem', padding: '1rem 0' }}>No vouchers</p>}
                            {paginatedMonths.map(m => (
                                <div key={m.key} style={{ marginBottom: 8 }}>
                                    {/* Month Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', background: '#f0eeeb', borderRadius: 4, marginBottom: 3, borderLeft: '3px solid #1B2042' }}>
                                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1B2042' }}>{m.label}</span>
                                        <span style={{ fontSize: '0.58rem', color: '#888', fontWeight: 600 }}>{m.vouchers.length} item{m.vouchers.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    {/* Vouchers in this month */}
                                    {m.vouchers.map(v => {
                                        const sc2 = SC[v.status] || SC.draft;
                                        const isOpen = sheets.some(s => s.bid === v.id);
                                        return (
                                            <div key={v.id} onClick={() => open(v)} style={{ padding: '5px 6px', borderRadius: 4, cursor: 'pointer', marginBottom: 2, border: isOpen ? '1px solid #1B2042' : '1px solid #e5e7eb', background: isOpen ? '#f8f7f5' : '#fff' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '0.72rem' }}>{v.voucherNumber}</span>
                                                    <span style={{ padding: '0 4px', borderRadius: 3, background: sc2.bg, color: sc2.c, fontSize: '0.55rem', fontWeight: 700 }}>{v.status}</span>
                                                </div>
                                                <div style={{ fontSize: '0.66rem', color: '#666' }}>{v.payeeName}</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>RWF {Number(v.amount).toLocaleString()}</span>
                                                    <span style={{ fontSize: '0.6rem', color: '#999' }}>{new Date(v.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {/* Month subtotal */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 6px', fontSize: '0.6rem', color: '#888', borderTop: '1px dashed #e5e7eb', marginTop: 2 }}>
                                        <span>Total: RWF {fmt(m.totalAmount)}</span>
                                        <span>Dr: {fmt(m.totalDr)} / Cr: {fmt(m.totalCr)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Footer */}
                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 6, marginTop: 4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <span style={{ fontSize: '0.62rem', color: '#888' }}>
                                    {pageSize === 0 ? months.length : Math.min(pageSize, months.length - (page - 1) * pageSize)} of {months.length} month{months.length !== 1 ? 's' : ''}
                                </span>
                                <select value={pageSize} onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }} style={{ fontSize: '0.6rem', padding: '1px 3px', border: '1px solid #ddd', borderRadius: 3 }}>
                                    {PAGE_SIZES.map(s => <option key={s} value={s}>{s}/page</option>)}
                                    <option value={0}>All</option>
                                </select>
                            </div>
                            {pageSize > 0 && totalPages > 1 && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ background: 'none', border: '1px solid #ddd', borderRadius: 3, padding: '2px 6px', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.4 : 1, fontSize: '0.6rem' }}><FaChevronLeft size={8} /></button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                        <button key={p} onClick={() => setPage(p)} style={{ border: p === page ? '1px solid #1B2042' : '1px solid #ddd', borderRadius: 3, padding: '2px 6px', background: p === page ? '#1B2042' : '#fff', color: p === page ? '#fff' : '#333', cursor: 'pointer', fontSize: '0.6rem', fontWeight: p === page ? 700 : 400, minWidth: 22 }}>{p}</button>
                                    ))}
                                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ background: 'none', border: '1px solid #ddd', borderRadius: 3, padding: '2px 6px', cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, fontSize: '0.6rem' }}><FaChevronRight size={8} /></button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ACTIVE SHEET */}
                <div style={{ flex: 1, minWidth: 0, background: '#fff', border: '1px solid var(--border-color)', borderRadius: 6, padding: 10, overflowX: 'auto' }}>
                    {!act ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#999' }}>
                            <FaReceipt size={36} style={{ opacity: 0.2, marginBottom: 8 }} />
                            <p style={{ fontSize: '0.85rem', margin: '0 0 2px' }}>No voucher open</p>
                            <p style={{ fontSize: '0.78rem', margin: '0 0 12px' }}>Open from list or create new</p>
                            <button onClick={mk} style={{ padding: '5px 12px', borderRadius: 4, border: '1px solid #1B2042', background: '#1B2042', color: '#fff', cursor: 'pointer', fontSize: '0.78rem' }}><FaPlus size={9} style={{ marginRight: 4 }} />New Sheet</button>
                        </div>
                    ) : (<>
                        {/* ACTION BAR */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, paddingBottom: 5, borderBottom: '2px solid #e5e7eb', flexWrap: 'wrap', gap: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{act.label}</span>
                                {act.saved && (() => { const v = gV(act); if (!v) return null; const sc2 = SC[v.status]; return <span style={{ padding: '1px 6px', borderRadius: 4, background: sc2.bg, color: sc2.c, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>{v.status}</span>; })()}
                                {!act.saved && <span style={{ padding: '1px 6px', borderRadius: 4, background: '#fef3c7', color: '#d97706', fontSize: '0.65rem', fontWeight: 700 }}>Unsaved</span>}
                            </div>
                            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                <button onClick={save} disabled={saving} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #1B2042', background: '#1B2042', color: '#fff', cursor: 'pointer', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 3 }}>{saving ? <FaSpinner className="spin" size={9} /> : <FaSave size={9} />} Save</button>
                                {act.saved && (() => { const v = gV(act); if (!v) return null; return (<>
                                    <button onClick={() => { setPreview({ open: true, type: 'excel', voucher: v, html: previewHtml(v), loading: false }); }} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #16a34a', background: '#fff', color: '#16a34a', cursor: 'pointer', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 3 }}><FaFileExcel size={9} /> Excel</button>
                                    <button onClick={async () => { setPreview({ open: true, type: 'pdf', voucher: v, loading: true }); try { const url = await dlPDF(v); setPreview(p => ({ ...p, blobUrl: url, loading: false })); } catch { setPreview(p => ({ ...p, loading: false })); showToast('PDF generation failed', 'error'); } }} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #dc2626', background: '#fff', color: '#dc2626', cursor: 'pointer', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 3 }}><FaFilePdf size={9} /> PDF</button>
                                    {isFin && v.status === 'pending' && <><button onClick={() => act2(() => pettyCashVoucherService.approve(v.id), 'Approved')} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #22c55e', background: '#22c55e', color: '#fff', cursor: 'pointer', fontSize: '0.72rem' }}><FaCheck size={8} /> Approve</button><button onClick={() => { setRej({ i: ai, v }); setRejR(''); }} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #ef4444', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: '0.72rem' }}><FaTimes size={8} /></button></>}
                                    {isFin && v.status === 'approved' && <button onClick={() => { setPay({ i: ai, v }); setPayN(''); }} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #3b82f6', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: '0.72rem' }}><FaDollarSign size={8} /> Pay</button>}
                                    {isFin && v.status === 'paid' && <button onClick={() => act2(() => pettyCashVoucherService.close(v.id), 'Closed')} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #1B2042', background: '#1B2042', color: '#fff', cursor: 'pointer', fontSize: '0.72rem' }}><FaLock size={8} /> Close</button>}
                                    {!isFin && v.status === 'draft' && <button onClick={() => act2(() => pettyCashVoucherService.submit(v.id), 'Submitted')} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #f59e0b', background: '#f59e0b', color: '#fff', cursor: 'pointer', fontSize: '0.72rem' }}><FaPaperPlane size={8} /> Submit</button>}
                                </>); })()}
                            </div>
                        </div>

                        {/* HEADER ROW */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 4, marginBottom: 6, padding: '5px 8px', background: '#faf9f7', borderRadius: 4, border: '1px solid #e5e7eb' }}>
                            <div><label style={lbl}>Date *</label><input type="date" style={inp} value={act.form.date} onChange={e => uf(ai, { date: e.target.value })} /></div>
                            <div><label style={lbl}>Reference</label><input style={inp} value={act.form.reference} onChange={e => uf(ai, { reference: e.target.value })} placeholder="Ref #" /></div>
                            <div><label style={lbl}>Currency</label><input style={inp} value={act.form.currency} onChange={e => uf(ai, { currency: e.target.value })} /></div>
                            <div><label style={lbl}>Method</label><select style={inp} value={act.form.paymentMethod} onChange={e => uf(ai, { paymentMethod: e.target.value })}>{METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}</select></div>
                            <div><label style={lbl}>Cash Fund</label><input style={inp} value={act.form.cashFundAccount} onChange={e => uf(ai, { cashFundAccount: e.target.value })} placeholder="PCF-001" /></div>
                        </div>

                        {/* PAYEE - 2 col compact */}
                        <div style={{ padding: '5px 8px', background: '#faf9f7', borderRadius: 4, border: '1px solid #e5e7eb', marginBottom: 6 }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1B2042', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><FaUser size={9} /> Payee Information</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 4 }}>
                                <div><label style={lbl}>Name *</label><input style={inp} value={act.form.payeeName} onChange={e => uf(ai, { payeeName: e.target.value })} placeholder="Recipient" /></div>
                                <div><label style={lbl}>Employee ID</label><input style={inp} value={act.form.employeeId} onChange={e => uf(ai, { employeeId: e.target.value })} placeholder="EMP-XXXX" /></div>
                                <div><label style={lbl}>Department</label><select style={inp} value={act.form.department} onChange={e => uf(ai, { department: e.target.value })}><option value="">—</option>{DEPTS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                                <div><label style={lbl}>Position</label><input style={inp} value={act.form.position} onChange={e => uf(ai, { position: e.target.value })} placeholder="Title" /></div>
                                <div><label style={lbl}>Phone</label><input style={inp} value={act.form.payeePhone} onChange={e => uf(ai, { payeePhone: e.target.value })} placeholder="+250..." /></div>
                                <div><label style={lbl}>Email</label><input style={inp} value={act.form.payeeEmail} onChange={e => uf(ai, { payeeEmail: e.target.value })} placeholder="email" /></div>
                            </div>
                        </div>

                        {/* PURPOSE */}
                        <div style={{ padding: '5px 8px', background: '#faf9f7', borderRadius: 4, border: '1px solid #e5e7eb', marginBottom: 6 }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1B2042', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><FaMoneyBillWave size={9} /> Payment Details</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 4 }}>
                                <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Purpose *</label><input style={{ ...inp, fontWeight: 600 }} value={act.form.paymentPurpose} onChange={e => uf(ai, { paymentPurpose: e.target.value })} placeholder="What is this payment for?" /></div>
                                <div><label style={lbl}>Description</label><textarea style={{ ...inp, resize: 'vertical' }} rows={2} value={act.form.description} onChange={e => uf(ai, { description: e.target.value })} placeholder="Details" /></div>
                            </div>
                        </div>

                        {/* TRANSACTION LEDGER */}
                        <div style={{ padding: '5px 8px', background: '#faf9f7', borderRadius: 4, border: '1px solid #e5e7eb', marginBottom: 6, overflowX: 'auto' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1B2042', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><FaTable size={9} /> Transaction Ledger</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', minWidth: 500 }}>
                                <thead>
                                    <tr style={{ background: '#1B2042', color: '#fff' }}>
                                        <th style={{ padding: '4px 5px', width: 28, textAlign: 'center' }}>#</th>
                                        <th style={{ padding: '4px 5px', width: 110 }}>Date</th>
                                        <th style={{ padding: '4px 5px' }}>Description</th>
                                        <th style={{ padding: '4px 5px', width: 115, textAlign: 'right' }}>Debit (Dr)</th>
                                        <th style={{ padding: '4px 5px', width: 115, textAlign: 'right' }}>Credit (Cr)</th>
                                        <th style={{ padding: '4px 5px', width: 50, textAlign: 'center' }}>×</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tx.map((t, i) => (
                                        <tr key={t.id} style={{ background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                                            <td style={{ padding: '2px 3px', textAlign: 'center', color: '#999', fontSize: '0.68rem' }}>{i + 1}</td>
                                            <td style={{ padding: '2px 2px' }}><input type="date" style={{ ...inp, fontSize: '0.72rem' }} value={t.date} onChange={e => { const x = [...tx]; x[i] = { ...x[i], date: e.target.value }; uf(ai, { transactions: x }); }} /></td>
                                            <td style={{ padding: '2px 2px' }}><input style={{ ...inp, fontSize: '0.72rem' }} value={t.description} onChange={e => { const x = [...tx]; x[i] = { ...x[i], description: e.target.value }; uf(ai, { transactions: x }); }} placeholder="e.g. Cash for site wages" /></td>
                                            <td style={{ padding: '2px 2px' }}><input type="number" style={{ ...inp, fontSize: '0.72rem', textAlign: 'right', fontWeight: 600, color: '#dc2626' }} value={t.debit || ''} onChange={e => { const x = [...tx]; x[i] = { ...x[i], debit: Number(e.target.value) || 0 }; uf(ai, { transactions: x }); }} /></td>
                                            <td style={{ padding: '2px 2px' }}><input type="number" style={{ ...inp, fontSize: '0.72rem', textAlign: 'right', fontWeight: 600, color: '#16a34a' }} value={t.credit || ''} onChange={e => { const x = [...tx]; x[i] = { ...x[i], credit: Number(e.target.value) || 0 }; uf(ai, { transactions: x }); }} /></td>
                                            <td style={{ padding: '2px 2px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                    <button onClick={() => { const x = [...tx]; x.splice(i + 1, 0, { ...tx[i], id: `t${Date.now()}${Math.random().toString(36).slice(2, 5)}` }); uf(ai, { transactions: x }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 1 }} title="Duplicate"><FaCopy size={9} /></button>
                                                    <button onClick={() => uf(ai, { transactions: tx.filter((_, j) => j !== i) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 1 }} title="Remove"><FaTimes size={9} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ background: '#e8e5df', fontWeight: 700 }}>
                                        <td colSpan={3} style={{ padding: '5px 6px', textAlign: 'right', fontSize: '0.75rem' }}>TOTALS</td>
                                        <td style={{ padding: '5px 6px', textAlign: 'right', color: '#dc2626', fontSize: '0.8rem' }}>RWF {tDr.toLocaleString()}</td>
                                        <td style={{ padding: '5px 6px', textAlign: 'right', color: '#16a34a', fontSize: '0.8rem' }}>RWF {tCr.toLocaleString()}</td>
                                        <td></td>
                                    </tr>
                                    <tr style={{ background: tBal >= 0 ? '#d1fae5' : '#fee2e2', fontWeight: 700 }}>
                                        <td colSpan={3} style={{ padding: '5px 6px', textAlign: 'right', fontSize: '0.73rem', color: tBal >= 0 ? '#059669' : '#dc2626' }}>BALANCE (Cr − Dr)</td>
                                        <td colSpan={2} style={{ padding: '5px 6px', textAlign: 'center', color: tBal >= 0 ? '#059669' : '#dc2626', fontSize: '0.88rem' }}>RWF {tBal.toLocaleString()}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                            <button onClick={() => uf(ai, { transactions: [...tx, newTxn()] })} style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, border: '1px dashed #1B2042', background: 'transparent', color: '#1B2042', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}>
                                <FaPlus size={9} /> Add Line
                            </button>
                        </div>

                        {/* SIGNATURES - side by side */}
                        <div style={{ padding: '5px 8px', background: '#faf9f7', borderRadius: 4, border: '1px solid #e5e7eb', marginBottom: 6 }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1B2042', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><FaStamp size={9} /> Approvals & Signatures</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                                <div style={{ padding: 6, background: '#fff', borderRadius: 4, border: '1px solid #e5e7eb' }}>
                                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1B2042', marginBottom: 4 }}>REQUESTED BY</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 4 }}>
                                        <div><label style={lbl}>Name</label><input style={inp} value={act.form.requestedByName} onChange={e => uf(ai, { requestedByName: e.target.value })} /></div>
                                        <div><label style={lbl}>Date</label><input type="date" style={inp} value={act.form.requestedDate} onChange={e => uf(ai, { requestedDate: e.target.value })} /></div>
                                    </div>
                                    <ESignature value={act.form.requestedBySignature} onChange={v => uf(ai, { requestedBySignature: v })} label="Signature" height={60} />
                                </div>
                                <div style={{ padding: 6, background: '#fff', borderRadius: 4, border: '1px solid #e5e7eb' }}>
                                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1B2042', marginBottom: 4 }}>APPROVED BY</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 4 }}>
                                        <div><label style={lbl}>Name</label><input style={inp} value={act.form.approvedByName} onChange={e => uf(ai, { approvedByName: e.target.value })} /></div>
                                        <div><label style={lbl}>Date</label><input type="date" style={inp} value={act.form.approvedDate} onChange={e => uf(ai, { approvedDate: e.target.value })} /></div>
                                    </div>
                                    <ESignature value={act.form.approvedBySignature} onChange={v => uf(ai, { approvedBySignature: v })} label="Signature" height={60} />
                                </div>
                            </div>
                            <div style={{ marginTop: 4 }}>
                                <label style={lbl}>Payment Confirmation Notes</label>
                                <textarea style={{ ...inp, resize: 'vertical', fontSize: '0.75rem' }} rows={2} value={act.form.paymentConfirmationNotes} onChange={e => uf(ai, { paymentConfirmationNotes: e.target.value })} placeholder="Confirmation notes" />
                            </div>
                        </div>
                    </>)}
                </div>
            </div>

            {/* MODALS */}
            {rej && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setRej(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 8, padding: 16, maxWidth: 360, width: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><h3 style={{ margin: 0, fontSize: '0.9rem' }}>Reject Voucher</h3><button onClick={() => setRej(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><FaTimesIcon size={14} /></button></div>
                        <p style={{ margin: '0 0 6px', fontSize: '0.82rem' }}>Reject <strong>{rej.v.voucherNumber}</strong>?</p>
                        <input style={{ ...inp, border: '1px solid var(--border-color)', borderRadius: 4, marginBottom: 8 }} value={rejR} onChange={e => setRejR(e.target.value)} placeholder="Reason" />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                            <button onClick={() => setRej(null)} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button>
                            <button onClick={async () => { await act2(() => pettyCashVoucherService.reject(rej.v.id, rejR), 'Rejected'); setRej(null); }} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #ef4444', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: '0.75rem' }}>Reject</button>
                        </div>
                    </div>
                </div>
            )}
            {pay && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setPay(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 8, padding: 16, maxWidth: 380, width: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><h3 style={{ margin: 0, fontSize: '0.9rem' }}><FaDollarSign style={{ marginRight: 4 }} /> Mark Paid</h3><button onClick={() => setPay(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><FaTimesIcon size={14} /></button></div>
                        <p style={{ margin: '0 0 2px', fontSize: '0.82rem' }}><strong>{pay.v.voucherNumber}</strong></p>
                        <p style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: '#1B2042' }}>RWF {Number(pay.v.amount).toLocaleString()}</p>
                        <textarea style={{ ...inp, border: '1px solid var(--border-color)', borderRadius: 4, marginBottom: 8, resize: 'vertical' }} rows={2} value={payN} onChange={e => setPayN(e.target.value)} placeholder="Payment notes" />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                            <button onClick={() => setPay(null)} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button>
                            <button onClick={async () => { await act2(() => pettyCashVoucherService.markPaid(pay.v.id, payN), 'Paid'); setPay(null); }} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #3b82f6', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: '0.75rem' }}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
            {del && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setDel(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 8, padding: 16, maxWidth: 320, width: '90%', textAlign: 'center' }}>
                        <FaTrash size={28} style={{ color: '#dc2626', marginBottom: 6 }} />
                        <p style={{ fontSize: '0.85rem', margin: '0 0 8px' }}>Delete <strong>{del.l}</strong>?</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                            <button onClick={() => setDel(null)} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button>
                            <button onClick={async () => { const v = all.find(x => x.voucherNumber === del.l); if (v) await act2(() => pettyCashVoucherService.delete(v.id), 'Deleted'); close(del.i); setDel(null); }} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #ef4444', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: '0.75rem' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
            <DocumentPreview
                open={preview.open}
                onClose={() => { if (preview.blobUrl) URL.revokeObjectURL(preview.blobUrl); setPreview({ open: false, type: 'pdf', voucher: null, loading: false }); }}
                title={preview.voucher ? `${preview.voucher.voucherNumber} — ${preview.voucher.payeeName}` : 'Document Preview'}
                type={preview.type}
                blobUrl={preview.blobUrl}
                html={preview.html}
                loading={preview.loading}
                onDownload={() => {
                    if (!preview.voucher) return;
                    if (preview.type === 'pdf') downloadPdf(preview.voucher);
                    else dlExcel(preview.voucher);
                }}
            />
        </div>
    );
};

export default PettyCashVoucher;
