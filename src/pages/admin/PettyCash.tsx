import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    FaUniversity, FaFileInvoice, FaExchangeAlt, FaPlus, FaEdit, FaTrash, FaSpinner,
    FaTimes as FaTimesIcon, FaSearch, FaDollarSign, FaSlidersH, FaPaperPlane,
    FaCheck, FaTimesCircle, FaMoneyBillWave, FaEye, FaUpload, FaFile,
    FaArrowUp, FaArrowDown, FaBalanceScale, FaClipboardList, FaFileAlt,
    FaPrint, FaDownload, FaCalendarAlt, FaHashtag, FaReceipt, FaUserTie,
    FaSignature, FaStamp, FaBookOpen, FaCalculator, FaArrowLeft, FaArrowRight,
    FaFileExcel, FaFilePdf,
} from 'react-icons/fa';
import { pettyCashFundService } from '../../services/pettyCashFundService';
import type { PettyCashFund, FundStats } from '../../services/pettyCashFundService';
import { pettyCashVoucherService } from '../../services/pettyCashVoucherService';
import type { PettyCashVoucher, VoucherStats, LineItem } from '../../services/pettyCashVoucherService';
import { pettyCashTransactionService } from '../../services/pettyCashTransactionService';
import type { PettyCashTransaction } from '../../services/pettyCashTransactionService';
import { profileService } from '../../services/profileService';
import type { Profile } from '../../services/profileService';
import DocumentPreview from '../../components/DocumentPreview';
import { useToast } from '../../context/ToastContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const EXPENSE_CATEGORIES = ['Office Supplies', 'Transportation', 'Fuel', 'Meals', 'Equipment', 'Materials', 'Services', 'Communication', 'Accommodation', 'Cleaning & Hygiene', 'Other'];
const VOUCHER_TYPES = ['cash_issued', 'cash_returned', 'fund_replenishment', 'adjustment', 'correction'];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const amountInWords = (n: number): string => {
    if (n === 0) return 'Zero';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const fmt = (x: number): string => {
        if (x < 20) return ones[x];
        if (x < 100) return tens[Math.floor(x / 10)] + (x % 10 ? ' ' + ones[x % 10] : '');
        if (x < 1000) return ones[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' and ' + fmt(x % 100) : '');
        if (x < 1000000) return fmt(Math.floor(x / 1000)) + ' Thousand' + (x % 1000 ? ' ' + fmt(x % 1000) : '');
        return fmt(Math.floor(x / 1000000)) + ' Million' + (x % 1000000 ? ' ' + fmt(x % 1000000) : '');
    };
    return fmt(Math.round(n)) + ' Rwandan Francs';
};

const inputStyle: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: '0.85rem', background: '#fff' };
const labelStyle: React.CSSProperties = { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' };

const fmt = (n: number) => n.toLocaleString();
const brown = [27, 32, 66] as [number, number, number];
const COMPANY = 'MUHIZI CONSTRUCTION';
const SLOGAN = 'Our Success is to serve opportunely your exigencies';
const ADDR = 'Kigali, Rwanda, Nyarugenge, Nyamirambo, Cosmos';
const EMAIL = 'muhizidesigningacademy@gmail.com';
const PHONE = '+250 780 620 735';
const FOOTER_TEXT = `${COMPANY}  |  ${ADDR}  |  ${EMAIL}  |  ${PHONE}`;

const dlPDF = async (v: PettyCashVoucher, logoUrl?: string): Promise<string> => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    let y = 10;

    try {
        const imgUrl = logoUrl || `${window.location.origin}/logo.jpeg`;
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => resolve(i); i.onerror = reject; i.src = imgUrl;
        });
        doc.addImage(img, 'PNG', 14, y, 20, 20);
    } catch { doc.setFillColor(...brown); doc.roundedRect(14, y, 20, 20, 3, 3, 'F'); doc.setFontSize(14); doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.text('MC', 24, y + 13, { align: 'center' }); }

    doc.setFontSize(20); doc.setTextColor(...brown); doc.setFont('helvetica', 'bold');
    doc.text(COMPANY, 38, y + 9);
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor('#888888');
    doc.text(SLOGAN, 38, y + 14);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor('#aaaaaa');
    doc.text(`${ADDR}  |  ${EMAIL}  |  ${PHONE}`, 38, y + 18);

    y += 24;
    doc.setDrawColor(...brown); doc.setLineWidth(0.7); doc.line(14, y, pw - 14, y);
    doc.setLineWidth(0.3); doc.line(14, y + 1.5, pw - 14, y + 1.5);
    y += 6;

    doc.setFillColor(...brown); doc.rect(14, y, pw - 28, 10, 'F');
    doc.setFontSize(13); doc.setTextColor(255); doc.setFont('helvetica', 'bold');
    doc.text('PETTY CASH VOUCHER', 18, y + 7);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(v.voucherNumber, pw - 18, y + 7, { align: 'right' });
    y += 14;

    const metas: [string, string][] = [['Date:', v.date], ['Fund:', v.fundName || '—'], ['Status:', (v.status || '').toUpperCase()], ['Currency:', v.currency || 'RWF']];
    metas.forEach(([lbl, val], i) => {
        const mx = 14 + (i * ((pw - 28) / 4));
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...brown); doc.text(lbl, mx, y + 3);
        doc.setFont('helvetica', 'normal'); doc.setTextColor('#333333'); doc.text(val, mx + doc.getTextWidth(lbl) + 2, y + 3);
    });
    y += 7;
    doc.setDrawColor('#dddddd'); doc.setLineWidth(0.2); doc.line(14, y, pw - 14, y);
    y += 5;

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

    section('PAYEE INFORMATION');
    field2('Payee:', v.payeeName, 'Employee ID:', v.employeeId || '—');
    field2('Department:', v.department || '—', 'Position:', v.position || '—');
    field2('Phone:', v.payeePhone || '—', 'Email:', v.payeeEmail || '—');
    y += 2;

    section('PAYMENT DETAILS');
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor('#999999'); doc.text('Purpose:', 16, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor('#333333'); doc.text(v.paymentPurpose || '—', 16 + doc.getTextWidth('Purpose:') + 2, y);
    y += 4.5;
    field2('Category:', v.expenseCategory || '—', 'Type:', (v.transactionType || '—').replace(/_/g, ' '));
    field2('Amount:', `RWF ${fmt(v.amount)}`, '', '');
    if (v.description) {
        doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor('#999999'); doc.text('Description:', 16, y);
        doc.setFont('helvetica', 'normal'); doc.setTextColor('#333333');
        const lines = doc.splitTextToSize(v.description, pw - 40);
        doc.text(lines, 16 + doc.getTextWidth('Description:') + 2, y);
        y += lines.length * 3.5 + 2;
    }
    y += 2;

    section('EXPENSE LINE ITEMS');
    const items = v.lineItems || [];
    const tDebit = items.reduce((s, i) => s + (Number(i.debit) || 0), 0);
    const tCredit = items.reduce((s, i) => s + (Number(i.credit) || 0), 0);
    const body = items.map((it, i) => [String(i + 1), v.date, it.description, it.expenseCategory, it.quantity ? String(it.quantity) : '—', it.unitCost ? `RWF ${fmt(it.unitCost)}` : '—', it.debit ? `RWF ${fmt(it.debit)}` : '—', it.credit ? `RWF ${fmt(it.credit)}` : '—']);
    body.push(['', '', '', '', '', '', `SUM: ${fmt(tDebit)}`, `SUM: ${fmt(tCredit)}`]);
    body.push(['', '', '', '', '', 'BALANCE:', `RWF ${fmt(v.amount - tDebit + tCredit)}`, '']);

    autoTable(doc, {
        startY: y, head: [['#', 'Date', 'Description', 'Category', 'Qty', 'Unit Cost', 'Debit (Dr)', 'Credit (Cr)']], body,
        theme: 'grid', styles: { fontSize: 7, cellPadding: 2, textColor: '#333333', lineColor: '#eeeeee', lineWidth: 0.2 },
        headStyles: { fillColor: brown, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
        columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 20 }, 4: { halign: 'center' }, 6: { halign: 'right', fontStyle: 'bold' }, 7: { halign: 'right', fontStyle: 'bold' } },
        alternateRowStyles: { fillColor: [250, 248, 245] }, margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 5;

    doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor('#888888');
    doc.text(`Amount in words: ${amountInWords(v.amount)}`, 16, y);
    y += 6;

    section('APPROVAL WORKFLOW');
    const sigs = [
        ['PREPARED BY', v.requestedByName || v.createdByName || '', v.requestedDate || ''],
        ['CHECKED BY', v.checkedByName || '', v.checkedDate || ''],
        ['APPROVED BY', v.approvedByName || '', v.approvedDate || ''],
        ['PAID BY', v.paidByName || '', v.paidDate || ''],
        ['RECEIVED BY', v.receivedByName || '', v.receivedDate || ''],
    ];
    const sigW = (pw - 32) / 5;
    sigs.forEach(([lbl, name, date], i) => {
        const sx = 16 + i * sigW;
        doc.setFontSize(6.5); doc.setTextColor(...brown); doc.setFont('helvetica', 'bold');
        doc.text(lbl, sx, y);
        doc.setFont('helvetica', 'normal'); doc.setTextColor('#333333');
        doc.text(name || '_______________', sx, y + 4);
        doc.text(date || '___/___/______', sx, y + 8);
        doc.setDrawColor('#cccccc'); doc.setLineWidth(0.3); doc.line(sx, y + 12, sx + sigW - 4, y + 12);
        doc.setFontSize(5.5); doc.setTextColor('#aaaaaa'); doc.text('Signature', sx, y + 15);
    });
    y += 20;

    if (v.notes) {
        section('NOTES');
        doc.setFontSize(7.5); doc.setTextColor('#333333');
        const nl = doc.splitTextToSize(v.notes, pw - 36);
        doc.text(nl, 16, y);
        y += nl.length * 3.5 + 4;
    }

    const footY = ph - 14;
    doc.setDrawColor(...brown); doc.setLineWidth(0.4); doc.line(14, footY, pw - 14, footY);
    doc.setFontSize(7); doc.setTextColor(...brown); doc.setFont('helvetica', 'normal');
    doc.text(FOOTER_TEXT, pw / 2, footY + 4, { align: 'center' });
    doc.setFontSize(6); doc.setTextColor('#aaaaaa');
    doc.text(`Created by: ${v.createdByName || 'System'}  |  ${v.voucherNumber}  |  Generated: ${new Date().toLocaleString()}`, pw / 2, footY + 8, { align: 'center' });

    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
};

const dlExcel = (v: PettyCashVoucher) => {
    const wb = XLSX.utils.book_new();
    const items = v.lineItems || [];
    const tDebit = items.reduce((s, i) => s + (Number(i.debit) || 0), 0);
    const tCredit = items.reduce((s, i) => s + (Number(i.credit) || 0), 0);
    const tQty = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    const balance = v.amount - tDebit + tCredit;
    const categories: Record<string, number> = {};
    items.forEach(it => { const c = it.expenseCategory || 'Other'; categories[c] = (categories[c] || 0) + (Number(it.debit) || 0); });

    const a: (string | number | { f: string; z?: string } | null)[][] = [];

    // ── HEADER BLOCK ──
    a.push([COMPANY, null, null, null, null, null, null, null]);
    a.push([SLOGAN, null, null, null, null, null, null, null]);
    a.push([`${ADDR}  |  ${EMAIL}  |  ${PHONE}`, null, null, null, null, null, null, null]);
    a.push([null]);
    // ── TITLE ROW ──
    a.push(['PETTY CASH VOUCHER', null, null, null, null, null, v.voucherNumber || '', '']);
    // ── META ROW ──
    a.push(['Date:', v.date || '—', 'Fund:', v.fundName || '—', 'Status:', (v.status || '').toUpperCase(), 'Currency:', v.currency || 'RWF']);
    a.push(['Reference:', v.reference || '—', null, null, null, null, null, null]);
    a.push([null]);
    // ── PAYEE SECTION ──
    a.push(['--- PAYEE INFORMATION ---']);
    a.push(['Payee Name', v.payeeName || '—', 'Employee ID', v.employeeId || '—']);
    a.push(['Department', v.department || '—', 'Position', v.position || '—']);
    a.push(['Phone', v.payeePhone || '—', 'Email', v.payeeEmail || '—']);
    a.push([null]);
    // ── PAYMENT SECTION ──
    a.push(['--- PAYMENT DETAILS ---']);
    a.push(['Purpose', v.paymentPurpose || '—', 'Category', v.expenseCategory || '—']);
    a.push(['Amount Received', v.amount || 0, 'Type', (v.transactionType || '—').replace(/_/g, ' ')]);
    a.push(['Amount in Words', amountInWords(v.amount || 0), null, null]);
    if (v.description) a.push(['Description', v.description, null, null]);
    a.push([null]);
    // ── LINE ITEMS ──
    a.push(['--- EXPENSE LINE ITEMS ---']);
    a.push(['#', 'Date', 'Description', 'Category', 'Qty', 'Unit Cost (RWF)', 'Debit Dr (RWF)', 'Credit Cr (RWF)']);
    const itemStartRow = a.length + 1; // 1-indexed for formulas
    items.forEach((it, i) => {
        a.push([i + 1, v.date || '', it.description || '', it.expenseCategory || '—', Number(it.quantity) || 0, Number(it.unitCost) || 0, Number(it.debit) || 0, Number(it.credit) || 0]);
    });
    const itemEndRow = a.length; // last item row
    // ── TOTALS ──
    a.push([null, null, null, null, { f: `SUM(E${itemStartRow}:E${itemEndRow})` }, null, { f: `SUM(G${itemStartRow}:G${itemEndRow})` }, { f: `SUM(H${itemStartRow}:H${itemEndRow})` }]);
    // ── BALANCE ──
    const totDebitRow = a.length; // 1-indexed
    a.push([null, null, null, 'BALANCE (Received - Dr + Cr)', null, null, null, { f: `B${itemStartRow - 6}-G${totDebitRow}` }]);
    a.push([null]);
    // ── APPROVALS ──
    a.push(['--- APPROVAL WORKFLOW ---']);
    a.push(['Role', 'Name', 'Date', 'Signature']);
    a.push(['Prepared By', v.requestedByName || v.createdByName || '—', v.requestedDate || '—', '']);
    a.push(['Checked By', v.checkedByName || '—', v.checkedDate || '—', '']);
    a.push(['Approved By', v.approvedByName || '—', v.approvedDate || '—', '']);
    a.push(['Paid By', v.paidByName || '—', v.paidDate || '—', '']);
    a.push(['Received By', v.receivedByName || '—', v.receivedDate || '—', '']);
    a.push([null]);
    // ── NOTES ──
    if (v.notes) { a.push(['--- NOTES ---']); a.push([v.notes]); a.push([null]); }
    // ── AUDIT ──
    a.push(['--- AUDIT TRAIL ---']);
    a.push(['Created By', v.createdByName || 'System', 'Created', v.createdAt ? new Date(v.createdAt).toLocaleString() : '—']);
    a.push(['Modified By', v.lastModifiedByName || '—', 'Updated', v.updatedAt ? new Date(v.updatedAt).toLocaleString() : '—']);
    a.push([null]);
    // ── CATEGORY BREAKDOWN ──
    if (Object.keys(categories).length > 0) {
        a.push(['--- CATEGORY BREAKDOWN ---']);
        a.push(['Category', 'Amount (RWF)']);
        Object.entries(categories).forEach(([cat, amt]) => a.push([cat, amt]));
        a.push([null]);
    }
    // ── FOOTER ──
    a.push([FOOTER_TEXT]);
    a.push([`Generated: ${new Date().toLocaleString()}  |  Software: v2.1.0  |  ${v.voucherNumber}`]);

    const ws = XLSX.utils.aoa_to_sheet(a);

    // Merge header cells
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // company name
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }, // slogan
        { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } }, // address
        { s: { r: 4, c: 0 }, e: { r: 4, c: 5 } }, // title
        { s: { r: 6, c: 1 }, e: { r: 6, c: 3 } }, // ref value
        { s: { r: 19, c: 0 }, e: { r: 19, c: 7 } }, // footer
        { s: { r: 20, c: 0 }, e: { r: 20, c: 7 } }, // gen info
    ];

    ws['!cols'] = [
        { wch: 16 }, { wch: 22 }, { wch: 16 }, { wch: 22 },
        { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Voucher');
    XLSX.writeFile(wb, `${v.voucherNumber || 'voucher'}_${(v.payeeName || 'record').replace(/\s+/g, '_')}.xlsx`);
};

const hasVoucherData = (v: PettyCashVoucher): boolean => {
    if (!v.payeeName) return false;
    if (!v.amount || v.amount <= 0) return false;
    return true;
};

const dlExcelHTML = (v: PettyCashVoucher, logoUrl?: string): string => {
    const items = v.lineItems || [];
    const tDebit = items.reduce((s, i) => s + (Number(i.debit) || 0), 0);
    const tCredit = items.reduce((s, i) => s + (Number(i.credit) || 0), 0);
    const balance = v.amount - tDebit + tCredit;
    const tQty = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    const categories: Record<string, number> = {};
    items.forEach(it => { const c = it.expenseCategory || 'Other'; categories[c] = (categories[c] || 0) + (Number(it.debit) || 0); });

    const trs = items.map((it, i) => {
        let rb = v.amount;
        for (let j = 0; j <= i; j++) { rb -= Number(items[j].debit) || 0; rb += Number(items[j].credit) || 0; }
        return `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8f7f4'}">
            <td style="padding:5px 6px;border:1px solid #ddd;text-align:center;color:#999;font-size:11px">${i + 1}</td>
            <td style="padding:5px 6px;border:1px solid #ddd;font-size:11px;white-space:nowrap">${v.date || '—'}</td>
            <td style="padding:5px 6px;border:1px solid #ddd;font-size:11px;font-weight:600">${it.description || '—'}</td>
            <td style="padding:5px 6px;border:1px solid #ddd;font-size:11px"><span style="padding:1px 5px;border-radius:3px;background:#f3f4f6">${it.expenseCategory || '—'}</span></td>
            <td style="padding:5px 6px;border:1px solid #ddd;font-size:11px;text-align:right">${it.quantity || 0}</td>
            <td style="padding:5px 6px;border:1px solid #ddd;font-size:11px;text-align:right">${it.unitCost ? Number(it.unitCost).toLocaleString() : '—'}</td>
            <td style="padding:5px 6px;border:1px solid #ddd;font-size:11px;text-align:right;font-weight:600;color:${it.debit ? '#dc2626' : '#999'}">${it.debit ? Number(it.debit).toLocaleString() : '—'}</td>
            <td style="padding:5px 6px;border:1px solid #ddd;font-size:11px;text-align:right;font-weight:600;color:${it.credit ? '#16a34a' : '#999'}">${it.credit ? Number(it.credit).toLocaleString() : '—'}</td>
        </tr>`;
    }).join('');

    const catRows = Object.entries(categories).map(([cat, amt]) => `<tr><td style="padding:3px 8px;border:1px solid #eee;font-size:11px">${cat}</td><td style="padding:3px 8px;border:1px solid #eee;font-size:11px;text-align:right;font-weight:600">${amt.toLocaleString()}</td></tr>`).join('');

    return `
    <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;padding:0;max-width:794px;margin:0 auto;background:#fff;color:#333">
        <!-- Header -->
        <div style="padding:20px 24px 12px;display:flex;align-items:center;gap:14px;border-bottom:3px solid #1B2042">
            <div style="width:48px;height:48px;border-radius:8px;background:#1B2042;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden"><img src="${logoUrl || '/logo.jpeg'}" alt="Logo" style="width:100%;height:100%;object-fit:contain" onerror="this.style.display='none';this.parentNode.innerHTML='<span style=&quot;color:#fff;font-size:16px;font-weight:800&quot;>MC</span>'" /></div>
            <div style="min-width:0"><div style="font-size:18px;font-weight:800;color:#1B2042;letter-spacing:0.5px">${COMPANY}</div>
            <div style="font-size:11px;color:#888;font-style:italic;margin-top:1px">${SLOGAN}</div>
            <div style="font-size:10px;color:#aaa;margin-top:1px">${ADDR} | ${EMAIL} | ${PHONE}</div></div>
        </div>

        <!-- Title Bar -->
        <div style="background:#1B2042;color:#fff;padding:8px 24px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:14px;font-weight:700;letter-spacing:1px">PETTY CASH VOUCHER</span>
            <span style="font-size:12px;opacity:0.8">${v.voucherNumber || '—'}</span>
        </div>

        <!-- Meta -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);padding:8px 24px;background:#faf9f7;border-bottom:1px solid #e5e7eb;font-size:11px;gap:8px">
            <div><span style="color:#999;font-weight:600">Date: </span><span style="font-weight:600">${v.date || '—'}</span></div>
            <div><span style="color:#999;font-weight:600">Fund: </span><span style="font-weight:600">${v.fundName || '—'}</span></div>
            <div><span style="color:#999;font-weight:600">Status: </span><span style="font-weight:700;text-transform:uppercase;color:#1B2042">${(v.status || '').toUpperCase()}</span></div>
            <div><span style="color:#999;font-weight:600">Ref: </span><span style="font-weight:600">${v.reference || '—'}</span></div>
        </div>

        <!-- Payee -->
        <div style="padding:12px 24px 8px">
            <div style="font-size:11px;font-weight:700;color:#1B2042;padding:4px 10px;background:#faf9f7;border-left:3px solid #1B2042;margin-bottom:8px">PAYEE INFORMATION</div>
            <table style="width:100%;border-collapse:collapse;font-size:11px">
                <tr><td style="padding:2px 0;width:50%"><span style="color:#999">Payee: </span><span style="font-weight:600">${v.payeeName || '—'}</span></td><td style="padding:2px 0"><span style="color:#999">Employee ID: </span>${v.employeeId || '—'}</td></tr>
                <tr><td style="padding:2px 0"><span style="color:#999">Department: </span>${v.department || '—'}</td><td style="padding:2px 0"><span style="color:#999">Position: </span>${v.position || '—'}</td></tr>
                <tr><td style="padding:2px 0"><span style="color:#999">Phone: </span>${v.payeePhone || '—'}</td><td style="padding:2px 0"><span style="color:#999">Email: </span>${v.payeeEmail || '—'}</td></tr>
            </table>
        </div>

        <!-- Payment -->
        <div style="padding:8px 24px 8px">
            <div style="font-size:11px;font-weight:700;color:#1B2042;padding:4px 10px;background:#faf9f7;border-left:3px solid #1B2042;margin-bottom:8px">PAYMENT DETAILS</div>
            <table style="width:100%;border-collapse:collapse;font-size:11px">
                <tr><td style="padding:2px 0;width:50%"><span style="color:#999">Purpose: </span><span style="font-weight:600">${v.paymentPurpose || '—'}</span></td><td style="padding:2px 0"><span style="color:#999">Category: </span>${v.expenseCategory || '—'}</td></tr>
                <tr><td style="padding:2px 0"><span style="color:#999">Amount Received: </span><strong style="color:#16a34a">RWF ${fmt(v.amount)}</strong></td><td style="padding:2px 0"><span style="color:#999">Type: </span>${(v.transactionType || '—').replace(/_/g, ' ')}</td></tr>
                <tr><td style="padding:2px 0;font-size:10px;color:#9CA3AF;font-style:italic" colspan="2">In words: ${amountInWords(v.amount)}</td></tr>
                ${v.description ? `<tr><td style="padding:2px 0" colspan="2"><span style="color:#999">Description: </span>${v.description}</td></tr>` : ''}
            </table>
        </div>

        <!-- Line Items -->
        <div style="padding:8px 24px 8px">
            <div style="font-size:11px;font-weight:700;color:#1B2042;padding:4px 10px;background:#faf9f7;border-left:3px solid #1B2042;margin-bottom:8px">EXPENSE LINE ITEMS</div>
            <table style="width:100%;border-collapse:collapse;font-size:11px;border:1px solid #ddd">
                <thead><tr style="background:#1B2042;color:#fff">
                    <th style="padding:5px 6px;border:1px solid #1B2042;width:28px;text-align:center;font-size:10px">#</th>
                    <th style="padding:5px 6px;border:1px solid #1B2042;width:80px;font-size:10px">Date</th>
                    <th style="padding:5px 6px;border:1px solid #1B2042;font-size:10px">Description</th>
                    <th style="padding:5px 6px;border:1px solid #1B2042;font-size:10px">Category</th>
                    <th style="padding:5px 6px;border:1px solid #1B2042;width:40px;text-align:right;font-size:10px">Qty</th>
                    <th style="padding:5px 6px;border:1px solid #1B2042;width:70px;text-align:right;font-size:10px">Unit Cost</th>
                    <th style="padding:5px 6px;border:1px solid #1B2042;width:80px;text-align:right;font-size:10px">Debit (Dr)</th>
                    <th style="padding:5px 6px;border:1px solid #1B2042;width:80px;text-align:right;font-size:10px">Credit (Cr)</th>
                </tr></thead>
                <tbody>${trs || '<tr><td colspan="8" style="padding:8px;text-align:center;color:#999;border:1px solid #eee;font-size:11px">No line items</td></tr>'}
                    <tr style="background:#1B2042;color:#fff;font-weight:700">
                        <td colspan="4" style="padding:5px 6px;border:1px solid #1B2042;text-align:right;font-size:10px">TOTALS</td>
                        <td style="padding:5px 6px;border:1px solid #1B2042;text-align:right;font-size:10px">${tQty}</td>
                        <td style="padding:5px 6px;border:1px solid #1B2042"></td>
                        <td style="padding:5px 6px;border:1px solid #1B2042;text-align:right;font-size:11px">${tDebit.toLocaleString()}</td>
                        <td style="padding:5px 6px;border:1px solid #1B2042;text-align:right;font-size:11px">${tCredit.toLocaleString()}</td>
                    </tr>
                    <tr style="background:#f0f0f0;font-weight:700">
                        <td colspan="4" style="padding:5px 6px;border:1px solid #ddd;text-align:right;font-size:10px">BALANCE (Received - Dr + Cr)</td>
                        <td colspan="3" style="padding:5px 6px;border:1px solid #ddd"></td>
                        <td style="padding:5px 6px;border:1px solid #ddd;text-align:right;font-size:11px;color:${balance >= 0 ? '#16a34a' : '#dc2626'}">RWF ${balance.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Summary -->
        <div style="margin:8px 24px;display:grid;grid-template-columns:1fr 1fr;border:1px solid #ddd;font-size:11px">
            <div style="padding:10px;border-right:1px solid #ddd">
                <div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="color:#666">Amount Received:</span><span style="font-weight:700;color:#16a34a">RWF ${fmt(v.amount)}</span></div>
                <div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="color:#666">Total Expenses (Dr):</span><span style="font-weight:700;color:#dc2626">RWF ${tDebit.toLocaleString()}</span></div>
                <div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="color:#666">Total Credits (Cr):</span><span style="font-weight:700;color:#16a34a">RWF ${tCredit.toLocaleString()}</span></div>
                <div style="border-top:1px solid #ddd;margin-top:3px;padding-top:3px;display:flex;justify-content:space-between;font-weight:700"><span>Balance:</span><span style="color:${balance >= 0 ? '#16a34a' : '#dc2626'}">RWF ${balance.toLocaleString()}</span></div>
            </div>
            <div style="padding:10px">
                <div style="font-weight:700;color:#374151;margin-bottom:4px">Category Breakdown</div>
                ${catRows || '<div style="color:#999">No categories</div>'}
            </div>
        </div>

        <!-- Approvals -->
        <div style="margin:8px 24px;border:1px solid #ddd">
            <table style="width:100%;border-collapse:collapse;font-size:10px">
                <thead><tr style="background:#f3f4f6">${['Prepared By', 'Checked By', 'Approved By', 'Paid By', 'Received By'].map(h => `<th style="padding:6px;border:1px solid #ddd;font-weight:700;text-transform:uppercase;color:#374151;text-align:center;font-size:9px">${h}</th>`).join('')}</tr></thead>
                <tbody><tr>${[
                    { name: v.requestedByName || v.createdByName || '', date: v.requestedDate || '' },
                    { name: v.checkedByName || '', date: v.checkedDate || '' },
                    { name: v.approvedByName || '', date: v.approvedDate || '' },
                    { name: v.paidByName || '', date: v.paidDate || '' },
                    { name: v.receivedByName || '', date: v.receivedDate || '' },
                ].map(s => `<td style="padding:6px;border:1px solid #ddd;text-align:center;vertical-align:top">
                    <div style="min-height:28px;border-bottom:1px solid #999;margin-bottom:3px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#ccc">${s.name ? '✓' : '_______'}</div>
                    <div style="font-weight:600;color:${s.name ? '#1B2042' : '#999'};font-size:10px">${s.name || 'Name'}</div>
                    <div style="color:#999;font-size:9px">${s.date ? new Date(s.date).toLocaleDateString('en-GB') : 'Date'}</div>
                </td>`).join('')}</tr></tbody>
            </table>
        </div>

        <!-- Footer -->
        <div style="margin:12px 24px 16px;border-top:2px solid #1B2042;padding-top:8px;display:flex;justify-content:space-between;font-size:9px;color:#aaa">
            <span>${FOOTER_TEXT}</span><span>${v.voucherNumber || '—'} | Generated: ${new Date().toLocaleString()}</span>
        </div>
    </div>`;
};

const downloadPdf = async (v: PettyCashVoucher, logoUrl?: string) => {
    const url = await dlPDF(v, logoUrl);
    const a = document.createElement('a'); a.href = url; a.download = `${v.voucherNumber || 'voucher'}_${(v.payeeName || 'record').replace(/\s+/g, '_')}.pdf`;
    a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
};

const PettyCash = () => {
    const { showToast } = useToast();
    const user = useMemo(() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } }, []);
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '';

    const [tab, setTab] = useState<'funds' | 'vouchers' | 'transactions'>('vouchers');

    const [funds, setFunds] = useState<PettyCashFund[]>([]);
    const [fundStats, setFundStats] = useState<FundStats | null>(null);
    const [fundSearch, setFundSearch] = useState('');
    const [fundModal, setFundModal] = useState<'new' | 'edit' | 'replenish' | 'adjust' | null>(null);
    const [fundEdit, setFundEdit] = useState<PettyCashFund | null>(null);
    const [fundForm, setFundForm] = useState({ fundName: '', openingBalance: 0, currency: 'RWF', custodian: '', description: '', status: 'active' as string });
    const [fundAmount, setFundAmount] = useState<number | ''>('');
    const [fundDesc, setFundDesc] = useState('');
    const [fundSaving, setFundSaving] = useState(false);
    const [fundDelete, setFundDelete] = useState<PettyCashFund | null>(null);

    const [vouchers, setVouchers] = useState<PettyCashVoucher[]>([]);
    const [voucherStats, setVoucherStats] = useState<VoucherStats | null>(null);
    const [voucherSearch, setVoucherSearch] = useState('');
    const [voucherModal, setVoucherModal] = useState<'new' | 'edit' | null>(null);
    const [voucherEdit, setVoucherEdit] = useState<PettyCashVoucher | null>(null);
    const [voucherSaving, setVoucherSaving] = useState(false);
    const [voucherDelete, setVoucherDelete] = useState<PettyCashVoucher | null>(null);
    const [vf, setVf] = useState({
        date: new Date().toISOString().split('T')[0], reference: '', payeeName: '', employeeId: '',
        department: '', position: '', payeePhone: '', payeeEmail: '', amount: 0, currency: 'RWF',
        paymentPurpose: '', paymentMethod: '', description: '', fundId: '', fundName: '',
        expenseCategory: '', notes: '', transactionType: '',
        requestedByName: '', requestedDate: '',
        checkedByName: '', checkedDate: '',
        paidByName: '', paidDate: '',
        approvedByName: '', approvedDate: '',
        receivedByName: '', receivedDate: '',
    });
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [supportingDocs, setSupportingDocs] = useState<{ id: string; name: string; type: string }[]>([]);

    const [txns, setTxns] = useState<PettyCashTransaction[]>([]);
    const [txnSearch, setTxnSearch] = useState('');
    const [txnFundFilter, setTxnFundFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedVoucher, setSelectedVoucher] = useState<PettyCashVoucher | null>(null);
    const [viewMonth, setViewMonth] = useState('');
    const [previewVoucher, setPreviewVoucher] = useState<PettyCashVoucher | null>(null);
    const [previewType, setPreviewType] = useState<'pdf' | 'excel'>('pdf');
    const [previewBlobUrl, setPreviewBlobUrl] = useState('');
    const [previewHtml, setPreviewHtml] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);
    const [companyLogo, setCompanyLogo] = useState('/logo.jpeg');

    // Drag state: each modal gets its own position
    const [modalPositions, setModalPositions] = useState<Record<string, { x: number; y: number }>>({});
    const dragging = useRef<{ key: string; offsetX: number; offsetY: number } | null>(null);

    const onDragStart = useCallback((key: string, e: React.MouseEvent) => {
        const modal = (e.currentTarget as HTMLElement).closest('.admin-modal') as HTMLElement | null;
        if (!modal) return;
        const rect = modal.getBoundingClientRect();
        dragging.current = { key, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
        setModalPositions(prev => ({ ...prev, [key]: { x: rect.left, y: rect.top } }));
        document.body.style.userSelect = 'none';
    }, []);

    const onDragMove = useCallback((e: MouseEvent) => {
        if (!dragging.current) return;
        const { key, offsetX, offsetY } = dragging.current;
        const x = Math.max(0, Math.min(window.innerWidth - 100, e.clientX - offsetX));
        const y = Math.max(0, Math.min(window.innerHeight - 50, e.clientY - offsetY));
        setModalPositions(prev => ({ ...prev, [key]: { x, y } }));
    }, []);

    const onDragEnd = useCallback(() => {
        dragging.current = null;
        document.body.style.userSelect = '';
    }, []);

    useEffect(() => {
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
        return () => {
            document.removeEventListener('mousemove', onDragMove);
            document.removeEventListener('mouseup', onDragEnd);
        };
    }, [onDragMove, onDragEnd]);

    const getModalStyle = useCallback((key: string, extra?: React.CSSProperties): React.CSSProperties => {
        const pos = modalPositions[key];
        if (pos) return { position: 'fixed' as const, left: pos.x, top: pos.y, zIndex: 10001, ...extra };
        return {}; // default centered
    }, [modalPositions]);

    const openPreview = useCallback(async (v: PettyCashVoucher, type: 'pdf' | 'excel') => {
        if (!v.payeeName || !v.amount || v.amount <= 0) {
            showToast('Voucher has no data to preview — add a payee name and amount first', 'error');
            return;
        }
        setPreviewVoucher(v);
        setPreviewType(type);
        setPreviewLoading(true);
        setPreviewBlobUrl('');
        setPreviewHtml('');
        if (type === 'pdf') {
            try {
                const url = await dlPDF(v, companyLogo);
                setPreviewBlobUrl(url);
            } catch (e) { console.error(e); showToast('Failed to generate PDF preview', 'error'); }
        } else {
            setPreviewHtml(dlExcelHTML(v, companyLogo));
        }
        setPreviewLoading(false);
    }, [showToast, companyLogo]);

    const handlePreviewDownload = useCallback(() => {
        if (!previewVoucher) return;
        if (previewType === 'pdf' && previewBlobUrl) {
            const a = document.createElement('a'); a.href = previewBlobUrl; a.download = `${previewVoucher.voucherNumber || 'voucher'}_${(previewVoucher.payeeName || 'record').replace(/\s+/g, '_')}.pdf`;
            a.click();
        } else if (previewType === 'excel') {
            dlExcel(previewVoucher);
        }
    }, [previewVoucher, previewType, previewBlobUrl]);

    const fetchFunds = useCallback(async () => {
        try {
            const [res, statsRes] = await Promise.all([pettyCashFundService.getAll(), pettyCashFundService.getStats()]);
            setFunds(res.data || []);
            setFundStats(statsRes.data || null);
        } catch (e) { console.error(e); }
    }, []);

    const fetchVouchers = useCallback(async () => {
        try {
            const [res, statsRes] = await Promise.all([pettyCashVoucherService.getAll(), pettyCashVoucherService.getStats()]);
            setVouchers(res.data || []);
            setVoucherStats(statsRes.data || null);
        } catch (e) { console.error(e); }
    }, []);

    const fetchTxns = useCallback(async () => {
        try {
            const res = await pettyCashTransactionService.getAll();
            setTxns(res.data || []);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => {
        Promise.all([fetchFunds(), fetchVouchers(), fetchTxns(), profileService.getMyProfile().then(p => { if (p?.companyLogo) setCompanyLogo(p.companyLogo); }).catch(() => {})]).finally(() => setLoading(false));
    }, [fetchFunds, fetchVouchers, fetchTxns]);

    const fFunds = useMemo(() => {
        const q = fundSearch.toLowerCase().trim();
        return funds.filter(f => !q || f.fundName.toLowerCase().includes(q) || f.fundCode.toLowerCase().includes(q) || (f.custodian || '').toLowerCase().includes(q));
    }, [funds, fundSearch]);

    const fVouchers = useMemo(() => {
        const q = voucherSearch.toLowerCase().trim();
        return vouchers.filter(v => !q || v.voucherNumber.toLowerCase().includes(q) || v.payeeName.toLowerCase().includes(q) || (v.paymentPurpose || '').toLowerCase().includes(q));
    }, [vouchers, voucherSearch]);

    const fTxns = useMemo(() => {
        const q = txnSearch.toLowerCase().trim();
        return txns.filter(t => {
            if (txnFundFilter && t.fundId !== txnFundFilter) return false;
            if (q && !t.description?.toLowerCase().includes(q) && !t.voucherNumber?.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [txns, txnSearch, txnFundFilter]);

    const monthlyGroups = useMemo(() => {
        const groups: Record<string, PettyCashVoucher[]> = {};
        fVouchers.forEach(v => {
            const d = new Date(v.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!groups[key]) groups[key] = [];
            groups[key].push(v);
        });
        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])).map(([key, items]) => ({
            key, label: items[0] ? new Date(items[0].date).toLocaleString('default', { month: 'long', year: 'numeric' }) : key, items,
        }));
    }, [fVouchers]);

    useEffect(() => {
        if (!viewMonth && monthlyGroups.length > 0) setViewMonth(monthlyGroups[0].key);
    }, [monthlyGroups, viewMonth]);

    const currentMonthVouchers = useMemo(() => {
        const g = monthlyGroups.find(m => m.key === viewMonth);
        return g ? g.items : [];
    }, [monthlyGroups, viewMonth]);

    const monthTotals = useMemo(() => {
        const totalReceived = currentMonthVouchers.reduce((s, v) => s + (v.amount || 0), 0);
        const totalSpent = currentMonthVouchers.reduce((s, v) => {
            const li = v.lineItems || [];
            return s + li.reduce((ls, i) => ls + (Number(i.debit) || 0), 0);
        }, 0);
        return { totalReceived, totalSpent, balance: totalReceived - totalSpent, count: currentMonthVouchers.length };
    }, [currentMonthVouchers]);

    const addLineItem = () => setLineItems(prev => [...prev, { id: uid(), description: '', expenseCategory: 'Office Supplies', debit: 0, credit: 0, quantity: 0, unitCost: 0 }]);
    const removeLineItem = (id: string) => setLineItems(prev => prev.filter(i => i.id !== id));
    const updateLineItem = (id: string, field: keyof LineItem, value: string | number) =>
        setLineItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

    const lineItemTotals = useMemo(() => {
        const debit = lineItems.reduce((s, i) => s + (Number(i.debit) || 0), 0);
        const credit = lineItems.reduce((s, i) => s + (Number(i.credit) || 0), 0);
        const qty = lineItems.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
        return { debit, credit, diff: debit - credit, qty };
    }, [lineItems]);

    const openVoucherNew = useCallback(() => {
        setVoucherEdit(null);
        setVf({
            date: new Date().toISOString().split('T')[0], reference: '', payeeName: '', employeeId: '',
            department: '', position: '', payeePhone: '', payeeEmail: '', amount: 0, currency: 'RWF',
            paymentPurpose: '', paymentMethod: '', description: '', fundId: '', fundName: '',
            expenseCategory: '', notes: '', transactionType: '',
            requestedByName: userName, requestedDate: new Date().toISOString().split('T')[0],
            checkedByName: '', checkedDate: '', paidByName: '', paidDate: '',
            approvedByName: '', approvedDate: '', receivedByName: '', receivedDate: '',
        });
        setLineItems([]);
        setSupportingDocs([]);
        setVoucherModal('new');
    }, [userName]);

    const openVoucherEdit = useCallback((v: PettyCashVoucher) => {
        setVoucherEdit(v);
        setVf({
            date: v.date, reference: v.reference || '', payeeName: v.payeeName, employeeId: v.employeeId || '',
            department: v.department || '', position: v.position || '', payeePhone: v.payeePhone || '',
            payeeEmail: v.payeeEmail || '', amount: v.amount, currency: v.currency || 'RWF',
            paymentPurpose: v.paymentPurpose || '', paymentMethod: v.paymentMethod || '',
            description: v.description || '', fundId: v.fundId || '', fundName: v.fundName || '',
            expenseCategory: v.expenseCategory || '', notes: v.notes || '', transactionType: v.transactionType || '',
            requestedByName: v.requestedByName || '', requestedDate: v.requestedDate || '',
            checkedByName: v.checkedByName || '', checkedDate: v.checkedDate || '',
            paidByName: v.paidByName || '', paidDate: v.paidDate || '',
            approvedByName: v.approvedByName || '', approvedDate: v.approvedDate || '',
            receivedByName: v.receivedByName || '', receivedDate: v.receivedDate || '',
        });
        setLineItems(v.lineItems || []);
        setSupportingDocs((v.supportingDocs || []).map(d => ({ id: d.id, name: d.name, type: d.type })));
        setVoucherModal('edit');
    }, []);

    const calcVoucherAmount = useMemo(() => {
        if (lineItems.length > 0) return lineItemTotals.debit;
        return vf.amount;
    }, [lineItems, lineItemTotals, vf.amount]);

    const handleVoucherSave = useCallback(async () => {
        if (!vf.payeeName.trim()) { showToast('Payee name is required', 'error'); return; }
        if (!vf.paymentPurpose.trim()) { showToast('Payment purpose is required', 'error'); return; }
        if (calcVoucherAmount <= 0) { showToast('Amount must be greater than zero', 'error'); return; }
        setVoucherSaving(true);
        try {
            const payload: Record<string, unknown> = { ...vf, amount: calcVoucherAmount, lineItems: lineItems.length > 0 ? lineItems : undefined, supportingDocs: supportingDocs.length > 0 ? supportingDocs : undefined };
            if (voucherEdit) await pettyCashVoucherService.update(voucherEdit.id, payload);
            else await pettyCashVoucherService.create(payload);
            showToast(voucherEdit ? 'Voucher updated' : 'Voucher created', 'success');
            setVoucherModal(null);
            fetchVouchers();
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
            showToast(Array.isArray(msg) ? msg.join('. ') : (typeof msg === 'string' ? msg : 'Failed to save'), 'error');
        } finally { setVoucherSaving(false); }
    }, [vf, lineItems, supportingDocs, calcVoucherAmount, voucherEdit, showToast, fetchVouchers]);

    const handleFundSave = useCallback(async () => {
        if (!fundForm.fundName.trim()) { showToast('Fund name is required', 'error'); return; }
        if (!fundForm.custodian.trim()) { showToast('Custodian is required', 'error'); return; }
        setFundSaving(true);
        try {
            if (fundEdit) await pettyCashFundService.update(fundEdit.id, fundForm);
            else await pettyCashFundService.create(fundForm);
            showToast(fundEdit ? 'Fund updated' : 'Fund created', 'success');
            setFundModal(null);
            fetchFunds();
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
            showToast(Array.isArray(msg) ? msg.join('. ') : (typeof msg === 'string' ? msg : 'Failed to save'), 'error');
        } finally { setFundSaving(false); }
    }, [fundForm, fundEdit, showToast, fetchFunds]);

    const handleFundReplenish = useCallback(async () => {
        if (fundAmount === '' || fundAmount <= 0) { showToast('Enter a valid amount', 'error'); return; }
        setFundSaving(true);
        try {
            await pettyCashFundService.replenish(fundEdit!.id, Number(fundAmount), fundDesc);
            showToast('Fund replenished', 'success');
            setFundModal(null);
            fetchFunds();
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
            showToast(typeof msg === 'string' ? msg : 'Failed', 'error');
        } finally { setFundSaving(false); }
    }, [fundAmount, fundDesc, fundEdit, showToast, fetchFunds]);

    const handleFundAdjust = useCallback(async () => {
        if (fundAmount === '') { showToast('Enter an amount', 'error'); return; }
        setFundSaving(true);
        try {
            await pettyCashFundService.adjust(fundEdit!.id, Number(fundAmount), fundDesc);
            showToast('Fund adjusted', 'success');
            setFundModal(null);
            fetchFunds();
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
            showToast(typeof msg === 'string' ? msg : 'Failed', 'error');
        } finally { setFundSaving(false); }
    }, [fundAmount, fundDesc, fundEdit, showToast, fetchFunds]);

    const handleFundDelete = useCallback(async () => {
        if (!fundDelete) return;
        try { await pettyCashFundService.delete(fundDelete.id); showToast('Fund deleted', 'success'); setFundDelete(null); fetchFunds(); }
        catch { showToast('Failed to delete', 'error'); }
    }, [fundDelete, showToast, fetchFunds]);

    const handleVoucherAction = useCallback(async (action: 'submit' | 'approve' | 'reject' | 'pay' | 'close' | 'delete', v: PettyCashVoucher) => {
        try {
            if (action === 'submit') await pettyCashVoucherService.submit(v.id);
            else if (action === 'approve') await pettyCashVoucherService.approve(v.id);
            else if (action === 'reject') await pettyCashVoucherService.reject(v.id, 'Rejected');
            else if (action === 'pay') await pettyCashVoucherService.markPaid(v.id);
            else if (action === 'close') await pettyCashVoucherService.close(v.id);
            else if (action === 'delete') { await pettyCashVoucherService.delete(v.id); setVoucherDelete(null); }
            showToast(`Voucher ${action === 'delete' ? 'deleted' : action + 'd'}`, 'success');
            fetchVouchers();
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
            showToast(typeof msg === 'string' ? msg : `Failed to ${action}`, 'error');
        }
    }, [showToast, fetchVouchers]);

    const statusBadge = (s: string) => {
        const colors: Record<string, string> = { draft: '#6B7280', pending: '#F59E0B', approved: '#22C55E', paid: '#3B82F6', closed: '#9CA3AF', rejected: '#EF4444', active: '#22C55E', inactive: '#EF4444' };
        return <span style={{ padding: '2px 10px', borderRadius: 6, background: `${colors[s] || '#6B7280'}18`, color: colors[s] || '#6B7280', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>{s}</span>;
    };

    const txnTypeBadge = (t: string) => {
        const colors: Record<string, string> = { cash_issued: '#F97316', cash_returned: '#22C55E', fund_replenishment: '#3B82F6', adjustment: '#8B5CF6', correction: '#EF4444', voucher_payment: '#F59E0B', voucher_receipt: '#06B6D4' };
        return <span style={{ padding: '2px 8px', borderRadius: 6, background: `${colors[t] || '#6B7280'}18`, color: colors[t] || '#6B7280', fontSize: '0.72rem', fontWeight: 600 }}>{t.replace(/_/g, ' ')}</span>;
    };

    if (loading) return (
        <div className="admin-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <FaSpinner className="spin" size={32} style={{ color: 'var(--primary)' }} />
        </div>
    );

    return (
        <div className="admin-page">
            {/* ═══ TABS ═══ */}
            <div className="petty-cash-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {([
                    { key: 'vouchers' as const, label: 'Voucher Sheets', icon: <FaFileInvoice /> },
                    { key: 'funds' as const, label: 'Cash Funds', icon: <FaUniversity /> },
                    { key: 'transactions' as const, label: 'Transaction Ledger', icon: <FaExchangeAlt /> },
                ]).map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        style={{ padding: '0.6rem 1.5rem', borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 600,
                            background: tab === t.key ? '#1B2042' : 'var(--bg-white)', color: tab === t.key ? '#fff' : 'var(--text-muted)',
                            boxShadow: tab === t.key ? '0 2px 8px rgba(27,32,66,0.2)' : '0 1px 3px rgba(0,0,0,0.06)' }}>
                        {t.icon}{t.label}
                    </button>
                ))}
            </div>

            {/* ═══════════════════════ VOUCHER SHEETS TAB ═══════════════════════ */}
            {tab === 'vouchers' && <>
                {/* Month Sheet Tabs */}
                <div className="petty-cash-month-tabs" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem', background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '0.4rem 0.75rem', overflowX: 'auto' }}>
                    <FaBookOpen size={14} style={{ color: 'var(--text-muted)', marginRight: 4, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: 4, flexShrink: 0 }}>Sheets:</span>
                    {monthlyGroups.map(g => (
                        <button key={g.key} onClick={() => { setViewMonth(g.key); setSelectedVoucher(null); }}
                            style={{ padding: '0.35rem 0.9rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap',
                                background: viewMonth === g.key ? '#1B2042' : 'transparent', color: viewMonth === g.key ? '#fff' : 'var(--text-muted)' }}>
                            {g.label} ({g.items.length})
                        </button>
                    ))}
                    {monthlyGroups.length === 0 && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No vouchers yet</span>}
                </div>

                {/* Month Summary Bar */}
                <div className="petty-cash-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                    {[
                        { label: 'Vouchers', value: monthTotals.count, color: '#3B82F6', icon: <FaFileInvoice /> },
                        { label: 'Total Received', value: `RWF ${monthTotals.totalReceived.toLocaleString()}`, color: '#22C55E', icon: <FaArrowUp /> },
                        { label: 'Total Expenses', value: `RWF ${monthTotals.totalSpent.toLocaleString()}`, color: '#EF4444', icon: <FaArrowDown /> },
                        { label: 'Balance', value: `RWF ${monthTotals.balance.toLocaleString()}`, color: monthTotals.balance >= 0 ? '#22C55E' : '#EF4444', icon: <FaBalanceScale /> },
                    ].map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '0.6rem 0.8rem' }}>
                            <div style={{ width: 30, height: 30, borderRadius: 7, background: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.8rem' }}>{s.icon}</div>
                            <div><div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{s.label}</div><div style={{ fontSize: '0.88rem', fontWeight: 700, color: s.color }}>{s.value}</div></div>
                        </div>
                    ))}
                </div>

                <div className="petty-cash-search-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ position: 'relative' }}><FaSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#aaa' }} />
                            <input style={{ ...inputStyle, padding: '0.4rem 0.6rem 0.4rem 2rem', width: 280 }} placeholder="Search vouchers..." value={voucherSearch} onChange={e => setVoucherSearch(e.target.value)} /></div>
                    </div>
                    <button className="admin-btn" onClick={openVoucherNew}
                        style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.5rem 1.25rem', fontSize: '0.88rem' }}><FaPlus style={{ marginRight: 6 }} />New Voucher</button>
                </div>

                {/* ═══ EXCEL-SHEET VOUCHER CARDS ═══ */}
                {currentMonthVouchers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 10 }}>
                        <FaFileInvoice size={40} style={{ opacity: 0.2, marginBottom: 10 }} />
                        <p style={{ color: 'var(--text-muted)' }}>No vouchers for this month. Click "New Voucher" to create one.</p>
                    </div>
                ) : currentMonthVouchers.map(v => {
                    const items = v.lineItems || [];
                    const totalDebit = items.reduce((s, i) => s + (Number(i.debit) || 0), 0);
                    const totalCredit = items.reduce((s, i) => s + (Number(i.credit) || 0), 0);
                    const totalQty = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
                    const categories: Record<string, number> = {};
                    items.forEach(i => { const cat = i.expenseCategory || 'Other'; categories[cat] = (categories[cat] || 0) + (Number(i.debit) || 0); });

                    return (
                        <div key={v.id} style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: 0, marginBottom: '1.5rem', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                            {/* ── Company Header ── */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0.75rem 1rem', borderBottom: '3px double #1B2042', background: '#fafafa' }}>
                                <img src={companyLogo} alt="Logo" onError={e => { (e.target as HTMLImageElement).src = '/logo.jpeg'; }} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'contain', flexShrink: 0, border: '1px solid #e5e7eb' }} />
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1B2042', letterSpacing: '0.5px' }}>{COMPANY}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#888', fontStyle: 'italic' }}>{SLOGAN}</div>
                                    <div style={{ fontSize: '0.65rem', color: '#aaa' }}>{ADDR} | {EMAIL} | {PHONE}</div>
                                </div>
                            </div>

                            {/* ── Voucher Title Bar ── */}
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr>
                                        <td colSpan={5} style={{ padding: '0.5rem 1rem', background: '#1B2042', color: '#fff', fontSize: '0.95rem', fontWeight: 700, textAlign: 'center', letterSpacing: '0.05em' }}>
                                            PETTY CASH VOUCHER
                                        </td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '0.4rem 1rem', borderRight: '1px solid #e5e7eb', fontSize: '0.78rem' }}><strong>Voucher #:</strong> <span style={{ color: '#1B2042', fontWeight: 700 }}>{v.voucherNumber}</span></td>
                                            <td style={{ padding: '0.4rem 1rem', borderRight: '1px solid #e5e7eb', fontSize: '0.78rem' }}><strong>Date:</strong> {new Date(v.date).toLocaleDateString('en-GB')}</td>
                                            <td style={{ padding: '0.4rem 1rem', borderRight: '1px solid #e5e7eb', fontSize: '0.78rem' }}><strong>Fund:</strong> {v.fundName || 'General'}</td>
                                            <td style={{ padding: '0.4rem 1rem', borderRight: '1px solid #e5e7eb', fontSize: '0.78rem' }}><strong>Ref:</strong> {v.reference || '—'}</td>
                                            <td style={{ padding: '0.4rem 1rem', fontSize: '0.78rem' }}><strong>Status:</strong> {statusBadge(v.status)}</td>
                                        </tr>
                                    </tbody>
                                </table>

                            {/* ── Payee & Purpose ── */}
                            <div className="petty-cash-payee-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', borderBottom: '1px solid #d1d5db', background: '#f9fafb' }}>
                                {[
                                    { label: 'Payee', value: v.payeeName },
                                    { label: 'Department', value: v.department || '—' },
                                    { label: 'Purpose', value: v.paymentPurpose },
                                    { label: 'Category', value: v.expenseCategory || '—' },
                                    { label: 'Phone', value: v.payeePhone || '—' },
                                    { label: 'Employee ID', value: v.employeeId || '—' },
                                ].map((f, i) => (
                                    <div key={i} style={{ padding: '0.35rem 0.75rem', borderRight: '1px solid #e5e7eb', fontSize: '0.75rem' }}>
                                        <span style={{ color: '#9CA3AF', fontWeight: 600 }}>{f.label}: </span>
                                        <span style={{ fontWeight: 600 }}>{f.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* ── Received Amount ── */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', borderBottom: '1px solid #d1d5db', background: '#ecfdf5' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}><FaReceipt style={{ color: '#22C55E', marginRight: 6 }} />Amount Received:</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#22C55E' }}>RWF {Number(v.amount).toLocaleString()}</div>
                            </div>

                            {/* ── Expense Ledger (Excel Grid) ── */}
                            {items.length > 0 ? (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="petty-cash-voucher-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                        <thead>
                                            <tr style={{ background: '#f3f4f6' }}>
                                                {['#', 'Date', 'Description', 'Category', 'Qty', 'Unit Cost', 'Debit (Dr)', 'Credit (Cr)', 'Running Bal'].map((h, i) => (
                                                    <th key={i} style={{ padding: '0.45rem 0.6rem', border: '1px solid #d1d5db', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: '#374151', textAlign: i >= 4 ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, idx) => {
                                                let runningBal = v.amount;
                                                for (let j = 0; j <= idx; j++) {
                                                    runningBal -= (Number(items[j].debit) || 0);
                                                    runningBal += (Number(items[j].credit) || 0);
                                                }
                                                return (
                                                    <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                                                        <td style={{ padding: '0.4rem 0.6rem', border: '1px solid #e5e7eb', textAlign: 'center', color: '#9CA3AF' }}>{idx + 1}</td>
                                                        <td style={{ padding: '0.4rem 0.6rem', border: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{item.description.includes('/') ? '' : ''}{v.date}</td>
                                                        <td style={{ padding: '0.4rem 0.6rem', border: '1px solid #e5e7eb', fontWeight: 600 }}>{item.description || '—'}</td>
                                                        <td style={{ padding: '0.4rem 0.6rem', border: '1px solid #e5e7eb' }}>
                                                            <span style={{ padding: '1px 6px', borderRadius: 4, background: '#f3f4f6', fontSize: '0.72rem' }}>{item.expenseCategory}</span>
                                                        </td>
                                                        <td style={{ padding: '0.4rem 0.6rem', border: '1px solid #e5e7eb', textAlign: 'right' }}>{item.quantity || '—'}</td>
                                                        <td style={{ padding: '0.4rem 0.6rem', border: '1px solid #e5e7eb', textAlign: 'right' }}>{item.unitCost ? `RWF ${Number(item.unitCost).toLocaleString()}` : '—'}</td>
                                                        <td style={{ padding: '0.4rem 0.6rem', border: '1px solid #e5e7eb', textAlign: 'right', fontWeight: 600, color: item.debit ? '#EF4444' : '#9CA3AF' }}>{item.debit ? `RWF ${Number(item.debit).toLocaleString()}` : '—'}</td>
                                                        <td style={{ padding: '0.4rem 0.6rem', border: '1px solid #e5e7eb', textAlign: 'right', fontWeight: 600, color: item.credit ? '#22C55E' : '#9CA3AF' }}>{item.credit ? `RWF ${Number(item.credit).toLocaleString()}` : '—'}</td>
                                                        <td style={{ padding: '0.4rem 0.6rem', border: '1px solid #e5e7eb', textAlign: 'right', fontWeight: 600, color: runningBal >= 0 ? '#22C55E' : '#EF4444' }}>RWF {runningBal.toLocaleString()}</td>
                                                    </tr>
                                                );
                                            })}
                                            {/* Totals Row */}
                                            <tr style={{ background: '#1B2042', color: '#fff', fontWeight: 700 }}>
                                                <td colSpan={4} style={{ padding: '0.5rem 0.6rem', border: '1px solid #1B2042', textAlign: 'right', fontSize: '0.78rem' }}>TOTALS</td>
                                                <td style={{ padding: '0.5rem 0.6rem', border: '1px solid #1B2042', textAlign: 'right', fontSize: '0.78rem' }}>{totalQty || '—'}</td>
                                                <td style={{ padding: '0.5rem 0.6rem', border: '1px solid #1B2042', textAlign: 'right', fontSize: '0.78rem' }}></td>
                                                <td style={{ padding: '0.5rem 0.6rem', border: '1px solid #1B2042', textAlign: 'right', fontSize: '0.82rem' }}>SUM: {totalDebit.toLocaleString()}</td>
                                                <td style={{ padding: '0.5rem 0.6rem', border: '1px solid #1B2042', textAlign: 'right', fontSize: '0.82rem' }}>SUM: {totalCredit.toLocaleString()}</td>
                                                <td style={{ padding: '0.5rem 0.6rem', border: '1px solid #1B2042', textAlign: 'right', fontSize: '0.82rem' }}>BAL: {(v.amount - totalDebit + totalCredit).toLocaleString()}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={{ padding: '1rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.82rem', borderBottom: '1px solid #d1d5db' }}>No line items — using single amount entry</div>
                            )}

                            {/* ── Summary & Balance ── */}
                            <div className="petty-cash-summary-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '2px solid #1B2042' }}>
                                <div style={{ padding: '0.75rem 1rem', borderRight: '1px solid #d1d5db' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.78rem' }}>
                                        <span style={{ color: '#6B7280' }}>Amount Received:</span>
                                        <span style={{ fontWeight: 700, color: '#22C55E' }}>RWF {Number(v.amount).toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.78rem' }}>
                                        <span style={{ color: '#6B7280' }}>Total Expenses (SUM Debit):</span>
                                        <span style={{ fontWeight: 700, color: '#EF4444' }}>RWF {totalDebit.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.78rem' }}>
                                        <span style={{ color: '#6B7280' }}>Total Credits (SUM Credit):</span>
                                        <span style={{ fontWeight: 700, color: '#22C55E' }}>RWF {totalCredit.toLocaleString()}</span>
                                    </div>
                                    <div style={{ borderTop: '1px solid #d1d5db', marginTop: '0.3rem', paddingTop: '0.3rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ fontWeight: 700 }}>Balance (Received - Dr + Cr):</span>
                                        <span style={{ fontWeight: 800, color: (v.amount - totalDebit + totalCredit) >= 0 ? '#22C55E' : '#EF4444' }}>RWF {(v.amount - totalDebit + totalCredit).toLocaleString()}</span>
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#9CA3AF', fontStyle: 'italic', marginTop: '0.3rem' }}>
                                        In words: {amountInWords(v.amount)}
                                    </div>
                                </div>
                                <div style={{ padding: '0.75rem 1rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>Category Breakdown</div>
                                    {Object.entries(categories).map(([cat, amt]) => (
                                        <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                                            <span style={{ color: '#6B7280' }}>{cat}</span>
                                            <span style={{ fontWeight: 600 }}>RWF {amt.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    {Object.keys(categories).length === 0 && <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>No categories</div>}
                                    {v.notes && <div style={{ marginTop: '0.5rem', padding: '0.4rem', background: '#f9fafb', borderRadius: 4, fontSize: '0.75rem', color: '#6B7280' }}><strong>Notes:</strong> {v.notes}</div>}
                                </div>
                            </div>

                            {/* ── Approval Workflow Signatures ── */}
                            <div style={{ borderTop: '3px double #1B2042' }}>
                                <table className="petty-cash-approval-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                    <thead>
                                        <tr style={{ background: '#f3f4f6' }}>
                                            {['Prepared By', 'Checked By', 'Approved By (Cashier)', 'Paid By', 'Received By'].map((h, i) => (
                                                <th key={i} style={{ padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: '#374151', textAlign: 'center' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            {[
                                                { name: v.requestedByName || v.createdByName || '', date: v.requestedDate || v.createdAt?.split('T')[0] || '' },
                                                { name: v.checkedByName || '', date: v.checkedDate || '' },
                                                { name: v.approvedByName || '', date: v.approvedDate || '' },
                                                { name: v.paidByName || '', date: v.paidDate || '' },
                                                { name: v.receivedByName || '', date: v.receivedDate || '' },
                                            ].map((s, i) => (
                                                <td key={i} style={{ padding: '0.5rem 0.6rem', border: '1px solid #d1d5db', textAlign: 'center', verticalAlign: 'top' }}>
                                                    <div style={{ minHeight: 35, borderBottom: '1px solid #9CA3AF', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {s.name ? <FaSignature size={12} style={{ color: '#1B2042', opacity: 0.5 }} /> : <span style={{ color: '#d1d5db' }}>________________</span>}
                                                    </div>
                                                    <div style={{ fontWeight: 600, color: s.name ? '#1B2042' : '#9CA3AF' }}>{s.name || 'Name'}</div>
                                                    <div style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>{s.date ? new Date(s.date).toLocaleDateString('en-GB') : 'Date'}</div>
                                                </td>
                                            ))}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* ── Voucher Footer Actions ── */}
                            <div className="petty-cash-footer-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                                <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                                    Created: {new Date(v.createdAt).toLocaleString()} {v.lastModifiedByName && `| Modified by: ${v.lastModifiedByName}`}
                                </div>
                                <div className="petty-cash-footer-actions-btns" style={{ display: 'flex', gap: 4 }}>
                                    <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => openVoucherEdit(v)} title="Edit"><FaEdit size={11} /> Edit</button>
                                    {v.status === 'draft' && <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#F59E0B' }} onClick={() => handleVoucherAction('submit', v)} title="Submit"><FaPaperPlane size={11} /> Submit</button>}
                                    {v.status === 'pending' && <>
                                        <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#22C55E' }} onClick={() => handleVoucherAction('approve', v)}><FaCheck size={11} /> Approve</button>
                                        <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#EF4444' }} onClick={() => handleVoucherAction('reject', v)}><FaTimesCircle size={11} /> Reject</button>
                                    </>}
                                    {v.status === 'approved' && <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#3B82F6' }} onClick={() => handleVoucherAction('pay', v)}><FaMoneyBillWave size={11} /> Mark Paid</button>}
                                    {v.status === 'draft' && <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#EF4444' }} onClick={() => setVoucherDelete(v)}><FaTrash size={11} /></button>}
                                    <div style={{ width: 1, height: 18, background: '#E5E7EB', margin: '0 2px' }} />
                                    {hasVoucherData(v) ? (
                                        <>
                                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#22C55E' }} onClick={() => openPreview(v, 'excel')} title="Preview Excel"><FaFileExcel size={11} /> Excel</button>
                                            <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#EF4444' }} onClick={() => openPreview(v, 'pdf')} title="Preview PDF"><FaFilePdf size={11} /> PDF</button>
                                        </>
                                    ) : (
                                        <span style={{ fontSize: '0.68rem', color: '#9CA3AF', fontStyle: 'italic', padding: '0.25rem 0.5rem' }}>No data to download</span>
                                    )}
                                </div>
                            </div>

                            {/* ── Company Footer ── */}
                            <div style={{ borderTop: '2px solid #1B2042', padding: '0.4rem 1rem', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.62rem', color: '#999' }}>
                                <span>{FOOTER_TEXT}</span>
                                <span>{v.voucherNumber} | Generated: {new Date().toLocaleString()}</span>
                            </div>
                        </div>
                    );
                })}

                {/* Month Footer Summary */}
                {currentMonthVouchers.length > 0 && (
                    <div className="petty-cash-footer-summary" style={{ background: '#1B2042', borderRadius: 10, padding: '1rem 1.5rem', color: '#fff', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', fontSize: '0.82rem', alignItems: 'end' }}>
                        <div><div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>Month Total Received</div><div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#22C55E' }}>SUM(Received): RWF {monthTotals.totalReceived.toLocaleString()}</div></div>
                        <div><div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>Month Total Expenses</div><div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#EF4444' }}>SUM(Expenses): RWF {monthTotals.totalSpent.toLocaleString()}</div></div>
                        <div><div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>Month Balance</div><div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#3B82F6' }}>BAL: RWF {monthTotals.balance.toLocaleString()}</div></div>
                        <div><div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>Sheet Summary</div><div style={{ fontSize: '1.05rem', fontWeight: 800 }}>COUNT: {monthTotals.count} vouchers</div></div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => { const withData = currentMonthVouchers.filter(hasVoucherData); if (!withData.length) return; withData.forEach(v => dlExcel(v)); }} style={{ padding: '0.35rem 0.7rem', borderRadius: 6, border: 'none', background: '#22C55E', color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><FaFileExcel size={12} /> Excel All</button>
                            <button onClick={async () => { const withData = currentMonthVouchers.filter(hasVoucherData); for (const v of withData) await downloadPdf(v, companyLogo); }} style={{ padding: '0.35rem 0.7rem', borderRadius: 6, border: 'none', background: '#EF4444', color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><FaFilePdf size={12} /> PDF All</button>
                        </div>
                    </div>
                )}
            </>}

            {/* ═══════════════════════ FUND TAB ═══════════════════════ */}
            {tab === 'funds' && <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.6rem', marginBottom: '1.25rem' }}>
                    {[
                        { label: 'Total Funds', value: funds.length, color: '#3B82F6', icon: <FaUniversity /> },
                        { label: 'Total Balance', value: `RWF ${(fundStats?.totalBalance || 0).toLocaleString()}`, color: '#22C55E', icon: <FaBalanceScale /> },
                        { label: 'Active', value: funds.filter(f => f.status === 'active').length, color: '#22C55E', icon: <FaArrowUp /> },
                        { label: 'Inactive', value: funds.filter(f => f.status === 'inactive').length, color: '#EF4444', icon: <FaArrowDown /> },
                    ].map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '0.8rem 1rem' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 9, background: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.9rem' }}>{s.icon}</div>
                            <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.label}</div><div style={{ fontSize: '1rem', fontWeight: 700, color: s.color }}>{s.value}</div></div>
                        </div>
                    ))}
                </div>
                <div className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cash Funds</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ position: 'relative' }}><FaSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#aaa' }} />
                                <input style={{ ...inputStyle, padding: '0.4rem 0.6rem 0.4rem 2rem', width: 250 }} placeholder="Search funds..." value={fundSearch} onChange={e => setFundSearch(e.target.value)} /></div>
                            <button className="admin-btn" onClick={() => { setFundEdit(null); setFundForm({ fundName: '', openingBalance: 0, currency: 'RWF', custodian: '', description: '', status: 'active' }); setFundModal('new'); }}
                                style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.5rem 1.25rem', fontSize: '0.88rem' }}><FaPlus style={{ marginRight: 6 }} />New Fund</button>
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead><tr><th>Code</th><th>Fund Name</th><th>Opening Bal</th><th>Current Bal</th><th>Currency</th><th>Custodian</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {fFunds.map(f => (
                                    <tr key={f.id}>
                                        <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem' }}>{f.fundCode}</td>
                                        <td style={{ fontWeight: 600 }}>{f.fundName}</td>
                                        <td>RWF {Number(f.openingBalance).toLocaleString()}</td>
                                        <td style={{ fontWeight: 700, color: Number(f.currentBalance) >= 0 ? '#22C55E' : '#EF4444' }}>RWF {Number(f.currentBalance).toLocaleString()}</td>
                                        <td>{f.currency}</td>
                                        <td>{f.custodian}</td>
                                        <td>{statusBadge(f.status)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => { setFundEdit(f); setFundForm({ fundName: f.fundName, openingBalance: f.openingBalance, currency: f.currency, custodian: f.custodian, description: f.description || '', status: f.status }); setFundModal('edit'); }}><FaEdit size={13} /></button>
                                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.5rem', color: '#22C55E' }} onClick={() => { setFundEdit(f); setFundAmount(''); setFundDesc(''); setFundModal('replenish'); }}><FaArrowUp size={13} /></button>
                                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.5rem', color: '#8B5CF6' }} onClick={() => { setFundEdit(f); setFundAmount(''); setFundDesc(''); setFundModal('adjust'); }}><FaSlidersH size={13} /></button>
                                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.25rem 0.5rem', color: 'var(--primary-red)' }} onClick={() => setFundDelete(f)}><FaTrash size={13} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {fFunds.length === 0 && <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No funds found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>}

            {/* ═══════════════════════ TRANSACTION TAB ═══════════════════════ */}
            {tab === 'transactions' && <>
                <div className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Transaction Ledger ({fTxns.length})</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <select style={{ ...inputStyle, width: 180 }} value={txnFundFilter} onChange={e => setTxnFundFilter(e.target.value)}>
                                <option value="">All Funds</option>
                                {funds.map(f => <option key={f.id} value={f.id}>{f.fundCode} - {f.fundName}</option>)}
                            </select>
                            <div style={{ position: 'relative' }}><FaSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#aaa' }} />
                                <input style={{ ...inputStyle, padding: '0.4rem 0.6rem 0.4rem 2rem', width: 250 }} placeholder="Search..." value={txnSearch} onChange={e => setTxnSearch(e.target.value)} /></div>
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead><tr><th>Date</th><th>Fund</th><th>V#</th><th>Type</th><th>Amount</th><th>Bal Before</th><th>Bal After</th><th>Description</th><th>By</th></tr></thead>
                            <tbody>
                                {fTxns.map(t => (
                                    <tr key={t.id}>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                                        <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>{t.fundCode || '—'}</td>
                                        <td style={{ fontSize: '0.82rem' }}>{t.voucherNumber || '—'}</td>
                                        <td>{txnTypeBadge(t.transactionType)}</td>
                                        <td style={{ fontWeight: 700 }}>RWF {Number(t.amount).toLocaleString()}</td>
                                        <td style={{ fontSize: '0.82rem' }}>{t.balanceBefore != null ? `RWF ${Number(t.balanceBefore).toLocaleString()}` : '—'}</td>
                                        <td style={{ fontSize: '0.82rem', fontWeight: 600, color: t.balanceAfter != null && Number(t.balanceAfter) >= 0 ? '#22C55E' : '#EF4444' }}>{t.balanceAfter != null ? `RWF ${Number(t.balanceAfter).toLocaleString()}` : '—'}</td>
                                        <td style={{ fontSize: '0.82rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description || '—'}</td>
                                        <td style={{ fontSize: '0.82rem' }}>{t.performedByName || '—'}</td>
                                    </tr>
                                ))}
                                {fTxns.length === 0 && <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No transactions found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>}

            {/* ═══════════════════════ FUND MODALS ═══════════════════════ */}
            {(fundModal === 'new' || fundModal === 'edit') && (
                <div className="admin-modal-overlay" onClick={() => !fundSaving && setFundModal(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ ...getModalStyle('fund-new', { maxWidth: 550 }) }}>
                        <div className="admin-modal-header" onMouseDown={e => onDragStart('fund-new', e)}><h3>{fundEdit ? 'Edit' : 'New'} Cash Fund</h3><button onClick={() => setFundModal(null)}><FaTimesIcon /></button></div>
                        <div className="admin-modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                <div><label style={labelStyle}>Fund Name *</label><input style={inputStyle} value={fundForm.fundName} onChange={e => setFundForm(p => ({ ...p, fundName: e.target.value }))} placeholder="e.g. Main Office Fund" /></div>
                                <div><label style={labelStyle}>Opening Balance (RWF)</label><input type="number" style={inputStyle} value={fundForm.openingBalance || ''} onChange={e => setFundForm(p => ({ ...p, openingBalance: Number(e.target.value) }))} /></div>
                                <div><label style={labelStyle}>Currency</label><input style={inputStyle} value={fundForm.currency} onChange={e => setFundForm(p => ({ ...p, currency: e.target.value }))} /></div>
                                <div><label style={labelStyle}>Custodian *</label><input style={inputStyle} value={fundForm.custodian} onChange={e => setFundForm(p => ({ ...p, custodian: e.target.value }))} placeholder="Person responsible" /></div>
                                <div><label style={labelStyle}>Status</label><select style={inputStyle} value={fundForm.status} onChange={e => setFundForm(p => ({ ...p, status: e.target.value }))}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
                                <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={fundForm.description} onChange={e => setFundForm(p => ({ ...p, description: e.target.value }))} /></div>
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setFundModal(null)} disabled={fundSaving}>Cancel</button>
                            <button className="admin-btn" onClick={handleFundSave} disabled={fundSaving} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff' }}>{fundSaving ? <><FaSpinner className="spin" size={12} /> Saving...</> : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}

            {fundModal === 'replenish' && fundEdit && (
                <div className="admin-modal-overlay" onClick={() => !fundSaving && setFundModal(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ ...getModalStyle('fund-replenish', { maxWidth: 420 }) }}>
                        <div className="admin-modal-header" style={{ background: '#22C55E', color: '#fff' }} onMouseDown={e => onDragStart('fund-replenish', e)}><h3><FaArrowUp style={{ marginRight: 8 }} />Replenish Fund</h3><button onClick={() => setFundModal(null)} style={{ color: '#fff' }}><FaTimesIcon /></button></div>
                        <div className="admin-modal-body">
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Adding to <strong>{fundEdit.fundName}</strong> (Current: RWF {Number(fundEdit.currentBalance).toLocaleString()})</p>
                            <div><label style={labelStyle}>Amount (RWF) *</label><input type="number" style={inputStyle} value={fundAmount || ''} onChange={e => setFundAmount(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                            <div style={{ marginTop: '0.75rem' }}><label style={labelStyle}>Description</label><input style={inputStyle} value={fundDesc} onChange={e => setFundDesc(e.target.value)} placeholder="e.g. Monthly top-up" /></div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setFundModal(null)} disabled={fundSaving}>Cancel</button>
                            <button className="admin-btn" onClick={handleFundReplenish} disabled={fundSaving} style={{ background: '#22C55E', borderColor: '#22C55E', color: '#fff' }}>{fundSaving ? <FaSpinner className="spin" size={12} /> : 'Replenish'}</button>
                        </div>
                    </div>
                </div>
            )}

            {fundModal === 'adjust' && fundEdit && (
                <div className="admin-modal-overlay" onClick={() => !fundSaving && setFundModal(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ ...getModalStyle('fund-adjust', { maxWidth: 420 }) }}>
                        <div className="admin-modal-header" style={{ background: '#8B5CF6', color: '#fff' }} onMouseDown={e => onDragStart('fund-adjust', e)}><h3><FaSlidersH style={{ marginRight: 8 }} />Adjust Balance</h3><button onClick={() => setFundModal(null)} style={{ color: '#fff' }}><FaTimesIcon /></button></div>
                        <div className="admin-modal-body">
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Adjusting <strong>{fundEdit.fundName}</strong> (Current: RWF {Number(fundEdit.currentBalance).toLocaleString()})</p>
                            <div><label style={labelStyle}>Amount (+ to increase, - to decrease) *</label><input type="number" style={inputStyle} value={fundAmount || ''} onChange={e => setFundAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g. -5000" /></div>
                            <div style={{ marginTop: '0.75rem' }}><label style={labelStyle}>Description</label><input style={inputStyle} value={fundDesc} onChange={e => setFundDesc(e.target.value)} placeholder="Reason" /></div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setFundModal(null)} disabled={fundSaving}>Cancel</button>
                            <button className="admin-btn" onClick={handleFundAdjust} disabled={fundSaving} style={{ background: '#8B5CF6', borderColor: '#8B5CF6', color: '#fff' }}>{fundSaving ? <FaSpinner className="spin" size={12} /> : 'Apply'}</button>
                        </div>
                    </div>
                </div>
            )}

            {fundDelete && (
                <div className="admin-modal-overlay" onClick={() => setFundDelete(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ ...getModalStyle('fund-delete', { maxWidth: 380 }) }}>
                        <div className="admin-modal-header" onMouseDown={e => onDragStart('fund-delete', e)}><h3>Delete Fund</h3><button onClick={() => setFundDelete(null)}><FaTimesIcon /></button></div>
                        <div className="admin-modal-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
                            <FaTrash size={36} style={{ color: '#EF4444', opacity: 0.8, marginBottom: 12 }} />
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>Delete <strong>{fundDelete.fundCode} - {fundDelete.fundName}</strong>?</p>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setFundDelete(null)}>Cancel</button>
                            <button className="admin-btn" onClick={handleFundDelete} style={{ background: '#EF4444', borderColor: '#EF4444', color: '#fff' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════ VOUCHER FORM MODAL ═══════════════════════ */}
            {voucherModal && (
                <div className="admin-modal-overlay" onClick={() => !voucherSaving && setVoucherModal(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ ...getModalStyle('voucher-form', { maxWidth: 900, maxHeight: '90vh', overflow: 'auto' }) }}>
                        <div className="admin-modal-header" onMouseDown={e => onDragStart('voucher-form', e)}>
                            <h3>{voucherEdit ? `Edit ${voucherEdit.voucherNumber}` : 'New Petty Cash Voucher'}</h3>
                            <button onClick={() => setVoucherModal(null)}><FaTimesIcon /></button>
                        </div>
                        <div className="admin-modal-body">

                            {/* Section: Voucher Info */}
                            <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem', borderLeft: '4px solid #1B2042' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', color: '#1B2042', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaFileInvoice size={14} /> Voucher Information</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                                    <div><label style={labelStyle}>Voucher Number</label><input style={{ ...inputStyle, background: '#f5f5f5' }} value={voucherEdit?.voucherNumber || 'Auto-generated'} readOnly /></div>
                                    <div><label style={labelStyle}>Date *</label><input type="date" style={inputStyle} value={vf.date} onChange={e => setVf(p => ({ ...p, date: e.target.value }))} /></div>
                                    <div><label style={labelStyle}>Cash Fund</label><select style={inputStyle} value={vf.fundId} onChange={e => { const fund = funds.find(f => f.id === e.target.value); setVf(p => ({ ...p, fundId: e.target.value, fundName: fund?.fundName || '' })); }}>
                                        <option value="">Select Fund</option>
                                        {funds.filter(f => f.status === 'active').map(f => <option key={f.id} value={f.id}>{f.fundCode} - {f.fundName}</option>)}
                                    </select></div>
                                    <div><label style={labelStyle}>Reference</label><input style={inputStyle} value={vf.reference} onChange={e => setVf(p => ({ ...p, reference: e.target.value }))} placeholder="Ref number" /></div>
                                </div>
                            </div>

                            {/* Section: Payee */}
                            <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem', borderLeft: '4px solid #F59E0B' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaUserTie size={14} /> Payee Information</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                                    <div><label style={labelStyle}>Payee Name *</label><input style={inputStyle} value={vf.payeeName} onChange={e => setVf(p => ({ ...p, payeeName: e.target.value }))} placeholder="Who is being paid?" /></div>
                                    <div><label style={labelStyle}>Employee ID</label><input style={inputStyle} value={vf.employeeId} onChange={e => setVf(p => ({ ...p, employeeId: e.target.value }))} /></div>
                                    <div><label style={labelStyle}>Department</label><input style={inputStyle} value={vf.department} onChange={e => setVf(p => ({ ...p, department: e.target.value }))} placeholder="e.g. Operations" /></div>
                                    <div><label style={labelStyle}>Position</label><input style={inputStyle} value={vf.position} onChange={e => setVf(p => ({ ...p, position: e.target.value }))} /></div>
                                    <div><label style={labelStyle}>Phone</label><input style={inputStyle} value={vf.payeePhone} onChange={e => setVf(p => ({ ...p, payeePhone: e.target.value }))} /></div>
                                    <div><label style={labelStyle}>Email</label><input type="email" style={inputStyle} value={vf.payeeEmail} onChange={e => setVf(p => ({ ...p, payeeEmail: e.target.value }))} /></div>
                                </div>
                            </div>

                            {/* Section: Payment */}
                            <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem', borderLeft: '4px solid #3B82F6' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaDollarSign size={14} /> Payment Details</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                                    <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Payment Purpose *</label><input style={inputStyle} value={vf.paymentPurpose} onChange={e => setVf(p => ({ ...p, paymentPurpose: e.target.value }))} placeholder="What is this payment for?" /></div>
                                    <div><label style={labelStyle}>Amount (RWF) *</label><input type="number" style={{ ...inputStyle, fontWeight: 700 }} value={vf.amount || ''} onChange={e => setVf(p => ({ ...p, amount: Number(e.target.value) }))} /></div>
                                    <div><label style={labelStyle}>Currency</label><input style={inputStyle} value={vf.currency} onChange={e => setVf(p => ({ ...p, currency: e.target.value }))} /></div>
                                    <div><label style={labelStyle}>Expense Category</label><select style={inputStyle} value={vf.expenseCategory} onChange={e => setVf(p => ({ ...p, expenseCategory: e.target.value }))}><option value="">Select</option>{EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                    <div><label style={labelStyle}>Transaction Type</label><select style={inputStyle} value={vf.transactionType} onChange={e => setVf(p => ({ ...p, transactionType: e.target.value }))}><option value="">Select</option>{VOUCHER_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}</select></div>
                                    <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={vf.description} onChange={e => setVf(p => ({ ...p, description: e.target.value }))} placeholder="Detailed description" /></div>
                                </div>
                            </div>

                            {/* Section: Line Items */}
                            <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem', borderLeft: '4px solid #8B5CF6' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8B5CF6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaClipboardList size={14} /> Line Items / Expense Details</div>
                                    <button className="admin-btn" onClick={addLineItem} style={{ padding: '0.3rem 0.8rem', fontSize: '0.78rem', background: '#8B5CF6', borderColor: '#8B5CF6', color: '#fff' }}><FaPlus style={{ marginRight: 4 }} />Add Row</button>
                                </div>
                                {lineItems.length > 0 ? (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table className="admin-table" style={{ fontSize: '0.82rem' }}>
                                            <thead><tr><th>#</th><th>Description</th><th>Category</th><th>Debit</th><th>Credit</th><th>Qty</th><th>Unit Cost</th><th></th></tr></thead>
                                            <tbody>
                                                {lineItems.map((item, idx) => (
                                                    <tr key={item.id}>
                                                        <td>{idx + 1}</td>
                                                        <td><input style={{ ...inputStyle, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }} value={item.description} onChange={e => updateLineItem(item.id, 'description', e.target.value)} placeholder="Description" /></td>
                                                        <td><select style={{ ...inputStyle, padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 130 }} value={item.expenseCategory} onChange={e => updateLineItem(item.id, 'expenseCategory', e.target.value)}>{EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></td>
                                                        <td><input type="number" style={{ ...inputStyle, padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 100 }} value={item.debit || ''} onChange={e => updateLineItem(item.id, 'debit', Number(e.target.value))} /></td>
                                                        <td><input type="number" style={{ ...inputStyle, padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 100 }} value={item.credit || ''} onChange={e => updateLineItem(item.id, 'credit', Number(e.target.value))} /></td>
                                                        <td><input type="number" style={{ ...inputStyle, padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 70 }} value={item.quantity || ''} onChange={e => updateLineItem(item.id, 'quantity', Number(e.target.value))} /></td>
                                                        <td><input type="number" style={{ ...inputStyle, padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 90 }} value={item.unitCost || ''} onChange={e => updateLineItem(item.id, 'unitCost', Number(e.target.value))} /></td>
                                                        <td><button onClick={() => removeLineItem(item.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}><FaTrash size={12} /></button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div style={{ display: 'flex', gap: '1.5rem', padding: '0.5rem 0', fontSize: '0.82rem', fontWeight: 600 }}>
                                            <span>SUM(Debit): <strong style={{ color: '#EF4444' }}>RWF {lineItemTotals.debit.toLocaleString()}</strong></span>
                                            <span>SUM(Credit): <strong style={{ color: '#22C55E' }}>RWF {lineItemTotals.credit.toLocaleString()}</strong></span>
                                            <span>DIFF: <strong>RWF {lineItemTotals.diff.toLocaleString()}</strong></span>
                                        </div>
                                    </div>
                                ) : (
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Click "Add Row" to add expense line items</p>
                                )}
                            </div>

                            {/* Section: Supporting Docs */}
                            <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem', borderLeft: '4px solid #06B6D4' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', color: '#06B6D4', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaUpload size={14} /> Supporting Documents</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    {['Receipts', 'Invoices', 'Purchase Orders', 'Delivery Notes', 'Photos'].map(docType => (
                                        <label key={docType} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem', border: '1px dashed var(--border-color)', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' }}>
                                            <FaFile size={13} style={{ color: '#06B6D4' }} />{docType}
                                            <input type="file" style={{ display: 'none' }} onChange={e => { const file = e.target.files?.[0]; if (file) setSupportingDocs(prev => [...prev, { id: uid(), name: `${docType}: ${file.name}`, type: file.type }]); }} />
                                        </label>
                                    ))}
                                </div>
                                {supportingDocs.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>{supportingDocs.map(d => (
                                    <span key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.5rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, fontSize: '0.75rem' }}>
                                        <FaFile size={10} style={{ color: '#06B6D4' }} />{d.name}
                                        <button onClick={() => setSupportingDocs(prev => prev.filter(x => x.id !== d.id))} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><FaTimesIcon size={9} /></button>
                                    </span>
                                ))}</div>}
                            </div>

                            {/* Section: Approval Workflow */}
                            <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem', borderLeft: '4px solid #10B981' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaSignature size={14} /> Approval Workflow</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                                    {[
                                        { key: 'requested', label: 'Requested By', color: '#3B82F6', icon: <FaPaperPlane size={12} /> },
                                        { key: 'checked', label: 'Checked By', color: '#F59E0B', icon: <FaEye size={12} /> },
                                        { key: 'paid', label: 'Paid By', color: '#8B5CF6', icon: <FaMoneyBillWave size={12} /> },
                                        { key: 'approved', label: 'Approved By (Cashier)', color: '#22C55E', icon: <FaCheck size={12} /> },
                                        { key: 'received', label: 'Received By (Employee)', color: '#06B6D4', icon: <FaClipboardList size={12} /> },
                                    ].map(w => (
                                        <div key={w.key} style={{ padding: '0.6rem', background: '#fafafa', border: `1px solid ${w.color}30`, borderRadius: 8, borderLeft: `3px solid ${w.color}` }}>
                                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: w.color, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>{w.icon}{w.label}</div>
                                            <input style={{ ...inputStyle, fontSize: '0.78rem', marginBottom: '0.3rem', padding: '0.35rem 0.5rem' }} placeholder="Name"
                                                value={(vf as Record<string, string>)[`${w.key}ByName`] || ''}
                                                onChange={e => setVf(p => ({ ...p, [`${w.key}ByName`]: e.target.value }))} />
                                            <input type="date" style={{ ...inputStyle, fontSize: '0.72rem', padding: '0.3rem 0.5rem' }}
                                                value={(vf as Record<string, string>)[`${w.key}Date`] || ''}
                                                onChange={e => setVf(p => ({ ...p, [`${w.key}Date`]: e.target.value }))} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Section: Notes */}
                            <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '1.25rem', marginBottom: '1rem', borderLeft: '4px solid #6B7280' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaFileAlt size={14} /> Notes & Remarks</div>
                                <textarea style={{ ...inputStyle, minHeight: 60 }} value={vf.notes} onChange={e => setVf(p => ({ ...p, notes: e.target.value }))} placeholder="Additional notes" />
                            </div>

                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setVoucherModal(null)} disabled={voucherSaving}>Cancel</button>
                            <button className="admin-btn" onClick={handleVoucherSave} disabled={voucherSaving} style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {voucherSaving ? <><FaSpinner className="spin" size={12} /> Saving...</> : voucherEdit ? 'Update Voucher' : 'Create Voucher'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Voucher Delete Confirm ═══ */}
            {voucherDelete && (
                <div className="admin-modal-overlay" onClick={() => setVoucherDelete(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ ...getModalStyle('voucher-delete', { maxWidth: 380 }) }}>
                        <div className="admin-modal-header" onMouseDown={e => onDragStart('voucher-delete', e)}><h3>Delete Voucher</h3><button onClick={() => setVoucherDelete(null)}><FaTimesIcon /></button></div>
                        <div className="admin-modal-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
                            <FaTrash size={36} style={{ color: '#EF4444', opacity: 0.8, marginBottom: 12 }} />
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>Delete <strong>{voucherDelete.voucherNumber}</strong>?</p>
                            <p style={{ margin: '0.5rem 0 0', fontWeight: 700 }}>RWF {Number(voucherDelete.amount).toLocaleString()}</p>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn--secondary" onClick={() => setVoucherDelete(null)}>Cancel</button>
                            <button className="admin-btn" onClick={() => handleVoucherAction('delete', voucherDelete)} style={{ background: '#EF4444', borderColor: '#EF4444', color: '#fff' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Document Preview ═══ */}
            <DocumentPreview
                open={!!previewVoucher}
                onClose={() => { setPreviewVoucher(null); if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl); setPreviewBlobUrl(''); setPreviewHtml(''); }}
                title={`${previewVoucher?.voucherNumber || 'Voucher'} — ${previewVoucher?.payeeName || ''}`}
                type={previewType}
                onDownload={handlePreviewDownload}
                blobUrl={previewType === 'pdf' ? previewBlobUrl : undefined}
                html={previewType === 'excel' ? previewHtml : undefined}
                loading={previewLoading}
            />
        </div>
    );
};

export default PettyCash;
