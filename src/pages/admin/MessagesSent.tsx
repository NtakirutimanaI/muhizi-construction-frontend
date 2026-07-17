import { useState, useEffect, useMemo } from 'react';
import { FaEnvelope, FaPaperPlane, FaFileExcel, FaFilePdf, FaChevronLeft, FaChevronRight, FaTrash, FaReply, FaTimes } from 'react-icons/fa';
import { profileService, type ContactMessage } from '../../services/profileService';
import { useToast } from '../../context/ToastContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PAGE_SIZES = [5, 10, 15, 20];

const MessagesSent = () => {
    const { showToast } = useToast();
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showCompose, setShowCompose] = useState(false);
    const [composeForm, setComposeForm] = useState({ name: '', email: '', phone: '', company: '', subject: '', message: '' });
    const [sending, setSending] = useState(false);

    useEffect(() => { loadMessages(); }, []);

    const loadMessages = async () => {
        try {
            const data = await profileService.getSentMessages();
            setMessages(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleComposeChange = (field: string, value: string) => {
        setComposeForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSend = async () => {
        if (!composeForm.name.trim() || !composeForm.email.trim() || !composeForm.message.trim()) {
            showToast('Name, email, and message are required', 'error');
            return;
        }
        setSending(true);
        try {
            await profileService.sendAdminMessage(composeForm);
            showToast('Message sent successfully', 'success');
            setShowCompose(false);
            setComposeForm({ name: '', email: '', phone: '', company: '', subject: '', message: '' });
            loadMessages();
        } catch (error) {
            console.error(error);
            showToast('Failed to send message', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleTrash = async (messageId: string) => {
        if (!window.confirm('Move this message to trash?')) return;
        try {
            await profileService.trashMessage(messageId);
            setMessages(prev => prev.filter(m => m.id !== messageId));
            showToast('Message moved to trash', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to trash message', 'error');
        }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return messages.filter(m => {
            if (q && !m.name.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q) && !(m.subject || '').toLowerCase().includes(q)) return false;
            if (fromDate && m.createdAt && new Date(m.createdAt) < new Date(fromDate)) return false;
            if (toDate && m.createdAt) { const end = new Date(toDate); end.setHours(23, 59, 59, 999); if (new Date(m.createdAt) > end) return false; }
            return true;
        });
    }, [messages, search, fromDate, toDate]);

    const totalPages = pageSize === 0 ? 1 : Math.ceil(filtered.length / pageSize);
    const paginated = useMemo(() => {
        if (pageSize === 0) return filtered;
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    useEffect(() => { if (page > totalPages) setPage(totalPages || 1); }, [totalPages, page]);

    const formatDate = (dateString: string) => new Date(dateString).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const tableData = useMemo(() => filtered.map((m, i) => [
        String(i + 1), m.name, m.email, m.subject || '—',
        m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—',
    ]), [filtered]);

    const downloadPDF = () => {
        const doc = new jsPDF();
        const brown = '#1B2042';
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFontSize(22); doc.setTextColor(brown); doc.setFont('helvetica', 'bold');
        doc.text('MUHIZI CONSTRUCTION', pageW / 2, 22, { align: 'center' });
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.text('Building Your Vision, Delivering Excellence', pageW / 2, 30, { align: 'center' });
        doc.setDrawColor(brown); doc.setLineWidth(0.8); doc.line(14, 34, pageW - 14, 34);
        doc.setFontSize(13); doc.setTextColor(brown); doc.setFont('helvetica', 'bold');
        doc.text('Sent Messages Report', 14, 40);
        doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor('#666');
        doc.text(`Generated: ${new Date().toLocaleDateString()}${fromDate && toDate ? ` | Period: ${fromDate} to ${toDate}` : ''}`, pageW - 14, 40, { align: 'right' });
        autoTable(doc, {
            head: [['#', 'Name', 'Email', 'Subject', 'Date']],
            body: tableData, startY: 46,
            styles: { fontSize: 8, textColor: '#333' },
            headStyles: { fillColor: [139, 69, 19], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [250, 245, 240] },
            columnStyles: { 0: { cellWidth: 10, halign: 'center' } },
            didDrawPage: (data: any) => {
                doc.setDrawColor(brown); doc.setLineWidth(0.5);
                doc.line(14, pageH - 20, pageW - 14, pageH - 20);
                doc.setFontSize(8); doc.setTextColor(brown); doc.setFont('helvetica', 'normal');
                doc.text('Email: info@muhiziconstruction.com  |  Phone: +250 788 000 000  |  Location: Kigali, Rwanda', pageW / 2, pageH - 14, { align: 'center' });
            },
        });
        doc.save('sent-messages.pdf');
    };

    const downloadExcel = () => {
        const brown = '#1B2042';
        const headers = ['#', 'Name', 'Email', 'Subject', 'Date'];
        const rows = tableData.map(r => `<tr>${r.map(c => `<td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${c}</td>`).join('')}</tr>`).join('');
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
            <div style="text-align:center;color:${brown};font-size:20px;font-weight:bold;font-family:Arial">MUHIZI CONSTRUCTION</div>
            <div style="text-align:center;color:${brown};font-size:11px;font-family:Arial;margin-bottom:4px">Building Your Vision, Delivering Excellence</div>
            <hr style="border:1px solid ${brown}" />
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;color:${brown};font-family:Arial;margin:6px 0"><span>Sent Messages Report</span><span>${new Date().toLocaleDateString()}${fromDate && toDate ? ' | ' + fromDate + ' to ' + toDate : ''}</span></div>
            <table style="border-collapse:collapse;width:100%;font-family:Arial">
                <tr style="background:${brown};color:#fff">${headers.map(h => `<th style="padding:6px 8px;border:1px solid ${brown};font-size:11px">${h}</th>`).join('')}</tr>${rows}
            </table>
            <hr style="border:0.5px solid ${brown};margin-top:12px" />
            <div style="text-align:center;color:${brown};font-size:10px;font-family:Arial">Email: info@muhiziconstruction.com | Phone: +250 788 000 000 | Location: Kigali, Rwanda</div>
        </body></html>`;
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'sent-messages.xls'; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, flexShrink: 0 }}>
                    <FaEnvelope style={{ color: 'var(--primary)' }} /> Messages
                </h2>
                <div className="admin-summary-cards">
                    <div className="admin-summary-card">
                        <div className="admin-summary-card__value">{messages.length}</div>
                        <div className="admin-summary-card__label">Sent</div>
                    </div>
                </div>
            </div>

            <div className="admin-card" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end', padding: '0.5rem 1rem' }}>
                <button className="admin-btn" onClick={() => setShowCompose(true)}
                    style={{ padding: '0.3rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FaReply /> Compose
                </button>
            </div>

            <div className="admin-card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input type="text" className="form-input" placeholder="Search name, email, subject..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 280 }} />
                        <input type="date" className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 130 }} title="From date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} />
                        <input type="date" className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 130 }} title="To date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} />
                        <button className="admin-btn" onClick={downloadExcel} title="Download as Excel — for records, sharing, or uploading elsewhere as evidence" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.6rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5, opacity: 1 }}>
                            <FaFileExcel /> Excel
                        </button>
                        <button className="admin-btn" onClick={downloadPDF} title="Download as PDF — for records, sharing, or uploading elsewhere as evidence" style={{ background: '#1B2042', borderColor: '#1B2042', color: '#fff', borderRadius: 5, padding: '0.6rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5, opacity: 1 }}>
                            <FaFilePdf /> PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Compose Modal */}
            {showCompose && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCompose(false)}>
                    <div className="admin-card" style={{ width: 520, maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Compose Message</h3>
                            <button className="admin-btn admin-btn--secondary" onClick={() => setShowCompose(false)} style={{ padding: '0.3rem 0.6rem' }}><FaTimes /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <input type="text" className="form-input" placeholder="Recipient name *" value={composeForm.name}
                                    onChange={e => handleComposeChange('name', e.target.value)} style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }} />
                                <input type="text" className="form-input" placeholder="Phone" value={composeForm.phone}
                                    onChange={e => handleComposeChange('phone', e.target.value)} style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <input type="email" className="form-input" placeholder="Recipient email *" value={composeForm.email}
                                    onChange={e => handleComposeChange('email', e.target.value)} style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }} />
                                <input type="text" className="form-input" placeholder="Company" value={composeForm.company}
                                    onChange={e => handleComposeChange('company', e.target.value)} style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }} />
                            </div>
                            <input type="text" className="form-input" placeholder="Subject" value={composeForm.subject}
                                onChange={e => handleComposeChange('subject', e.target.value)} style={{ padding: '0.5rem', fontSize: '0.85rem' }} />
                            <textarea className="form-input" placeholder="Message *" rows={6} value={composeForm.message}
                                onChange={e => handleComposeChange('message', e.target.value)} style={{ padding: '0.5rem', fontSize: '0.85rem', resize: 'vertical' }} />
                            <button className="admin-btn" onClick={handleSend} disabled={sending}
                                style={{ padding: '0.6rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <FaPaperPlane /> {sending ? 'Sending...' : 'Send Message'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Sent ({filtered.length})</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '0.7rem 0.75rem', fontSize: '0.75rem', textAlign: 'left' }}>#</th>
                                <th style={{ padding: '0.7rem 0.75rem', fontSize: '0.75rem', textAlign: 'left' }}>Name</th>
                                <th style={{ padding: '0.7rem 0.75rem', fontSize: '0.75rem', textAlign: 'left' }}>Email</th>
                                <th style={{ padding: '0.7rem 0.75rem', fontSize: '0.75rem', textAlign: 'left' }}>Subject</th>
                                <th style={{ padding: '0.7rem 0.75rem', fontSize: '0.75rem', textAlign: 'left' }}>Date</th>
                                <th style={{ padding: '0.7rem 0.75rem', fontSize: '0.75rem', textAlign: 'center', width: 80 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                    <div className="inline-spinner">Loading sent messages...</div>
                                </td></tr>
                            ) : paginated.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                                    <FaPaperPlane size={32} style={{ marginBottom: '0.75rem', opacity: 0.2 }} />
                                    <p style={{ fontSize: '0.95rem' }}>No sent messages</p>
                                </td></tr>
                            ) : (
                                paginated.map((m, i) => (
                                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.8rem' }}>{(page - 1) * pageSize + i + 1}</td>
                                        <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}>{m.name}</td>
                                        <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.8rem' }}>{m.email}</td>
                                        <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.subject || '—'}</td>
                                        <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.8rem' }}>{m.createdAt ? formatDate(m.createdAt) : '—'}</td>
                                        <td style={{ padding: '0.7rem 0.75rem', textAlign: 'center' }}>
                                            <button className="admin-btn admin-btn--secondary" onClick={() => handleTrash(m.id!)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                <FaTrash size={10} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pageSize === 0 ? filtered.length : Math.min(pageSize, filtered.length - (page - 1) * pageSize)} of {filtered.length}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <select className="form-select" style={{ width: 'auto', padding: '0.2rem 1.2rem 0.2rem 0.4rem', fontSize: '0.75rem' }} value={pageSize} onChange={e => { setPage(1); setPageSize(Number(e.target.value)); }}>
                            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}<option value={0}>All</option>
                        </select>
                        {pageSize > 0 && totalPages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><FaChevronLeft /></button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button key={p} className={p === page ? 'admin-btn' : 'admin-btn admin-btn--secondary'} style={{ padding: '0.2rem 0.5rem', minWidth: 26, fontSize: '0.75rem' }} onClick={() => setPage(p)}>{p}</button>
                                ))}
                                <button className="admin-btn admin-btn--secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><FaChevronRight /></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessagesSent;
