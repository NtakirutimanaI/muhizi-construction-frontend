import { useState, useEffect, useMemo } from 'react';
import { FaEnvelope, FaUser, FaPhone, FaBuilding, FaCheck, FaClock, FaTrash, FaInbox, FaFileExcel, FaFilePdf, FaChevronLeft, FaChevronRight, FaPaperPlane, FaTimes } from 'react-icons/fa';
import { profileService, type ContactMessage } from '../../services/profileService';
import { mlService, type LeadScoreResult } from '../../services/mlService';
import { useToast } from '../../context/ToastContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PAGE_SIZES = [5, 10, 15, 20];

const MessagesInbox = () => {
    const { showToast } = useToast();
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showReply, setShowReply] = useState(false);
    const [replySubject, setReplySubject] = useState('');
    const [replyMessage, setReplyMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [leadScore, setLeadScore] = useState<LeadScoreResult | null>(null);
    const [scoringLead, setScoringLead] = useState(false);

    useEffect(() => { loadMessages(); }, []);

    const loadMessages = async () => {
        try {
            const data = await profileService.getInboxMessages();
            setMessages(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return messages.filter(m => {
            if (q && !m.name.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q) && !(m.subject || '').toLowerCase().includes(q) && !(m.message || '').toLowerCase().includes(q) && !(m.phone || '').toLowerCase().includes(q)) return false;
            if (fromDate && m.createdAt && new Date(m.createdAt) < new Date(fromDate)) return false;
            if (toDate && m.createdAt) { const end = new Date(toDate); end.setHours(23, 59, 59, 999); if (new Date(m.createdAt) > end) return false; }
            if (filter === 'unread' && (!m.status || m.status === 'read')) return false;
            if (filter === 'read' && (!m.status || m.status === 'unread' || m.status === 'new')) return false;
            return true;
        });
    }, [messages, search, fromDate, toDate, filter]);

    const totalPages = pageSize === 0 ? 1 : Math.ceil(filtered.length / pageSize);
    const paginated = useMemo(() => {
        if (pageSize === 0) return filtered;
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    useEffect(() => { if (page > totalPages) setPage(totalPages || 1); }, [totalPages, page]);

    const unreadCount = messages.filter(m => !m.status || m.status === 'unread' || m.status === 'new').length;

    const handleSelect = async (msg: ContactMessage) => {
        setSelectedMessage(msg);
        if (!msg.status || msg.status === 'unread' || msg.status === 'new') {
            try {
                await profileService.markMessageAsRead(msg.id!);
                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'read' as any } : m));
            } catch (error) {
                console.error('Failed to mark as read:', error);
            }
        }
        setLeadScore(null);
        setScoringLead(true);
        try {
            const result = await mlService.scoreLead({
                name: msg.name,
                email: msg.email,
                phone: msg.phone,
                company: msg.company,
                subject: msg.subject,
                message: msg.message,
            });
            setLeadScore(result);
        } catch (error) {
            console.error('Failed to score lead:', error);
        } finally {
            setScoringLead(false);
        }
    };

    const handleTrash = async (messageId: string) => {
        if (!window.confirm('Move this message to trash?')) return;
        try {
            await profileService.trashMessage(messageId);
            setMessages(prev => prev.filter(m => m.id !== messageId));
            if (selectedMessage?.id === messageId) setSelectedMessage(null);
            showToast('Message moved to trash', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to trash message', 'error');
        }
    };

    const formatDate = (dateString: string) => new Date(dateString).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === paginated.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(paginated.map(m => m.id!)));
    };

    const handleReply = async () => {
        if (!replyMessage.trim()) { showToast('Message is required', 'error'); return; }
        const selected = messages.filter(m => selectedIds.has(m.id!));
        if (!selected.length) { showToast('No messages selected', 'error'); return; }
        setSending(true);
        let sent = 0;
        for (const msg of selected) {
            try {
                await profileService.sendAdminMessage({
                    name: msg.name,
                    email: msg.email,
                    subject: replySubject.trim() || `Re: ${msg.subject || 'Your Message'}`,
                    message: replyMessage.trim(),
                });
                sent++;
            } catch { /* skip failed */ }
        }
        showToast(`Reply sent to ${sent}/${selected.length} recipient(s)`, sent === selected.length ? 'success' : 'error');
        setShowReply(false);
        setReplySubject('');
        setReplyMessage('');
        setSelectedIds(new Set());
        setSending(false);
    };

    const tableData = useMemo(() => filtered.map((m, i) => [
        String(i + 1), m.name, m.email, m.subject || '—',
        m.status === 'new' || m.status === 'unread' ? 'Unread' : 'Read',
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
        doc.text('Inbox Messages Report', 14, 40);
        doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor('#666');
        doc.text(`Generated: ${new Date().toLocaleDateString()}${fromDate && toDate ? ` | Period: ${fromDate} to ${toDate}` : ''}`, pageW - 14, 40, { align: 'right' });
        autoTable(doc, {
            head: [['#', 'Name', 'Email', 'Subject', 'Status', 'Date']],
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
        doc.save('inbox-messages.pdf');
    };

    const downloadExcel = () => {
        const brown = '#1B2042';
        const headers = ['#', 'Name', 'Email', 'Subject', 'Status', 'Date'];
        const rows = tableData.map(r => `<tr>${r.map(c => `<td style="padding:4px 8px;border:1px solid #ccc;font-size:11px">${c}</td>`).join('')}</tr>`).join('');
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
            <div style="text-align:center;color:${brown};font-size:20px;font-weight:bold;font-family:Arial">MUHIZI CONSTRUCTION</div>
            <div style="text-align:center;color:${brown};font-size:11px;font-family:Arial;margin-bottom:4px">Building Your Vision, Delivering Excellence</div>
            <hr style="border:1px solid ${brown}" />
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:bold;color:${brown};font-family:Arial;margin:6px 0"><span>Inbox Messages Report</span><span>${new Date().toLocaleDateString()}${fromDate && toDate ? ' | ' + fromDate + ' to ' + toDate : ''}</span></div>
            <table style="border-collapse:collapse;width:100%;font-family:Arial">
                <tr style="background:${brown};color:#fff">${headers.map(h => `<th style="padding:6px 8px;border:1px solid ${brown};font-size:11px">${h}</th>`).join('')}</tr>${rows}
            </table>
            <hr style="border:0.5px solid ${brown};margin-top:12px" />
            <div style="text-align:center;color:${brown};font-size:10px;font-family:Arial">Email: info@muhiziconstruction.com | Phone: +250 788 000 000 | Location: Kigali, Rwanda</div>
        </body></html>`;
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'inbox-messages.xls'; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, flexShrink: 0 }}>
                    <FaEnvelope style={{ color: 'var(--primary)' }} /> Messages
                </h2>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => {
                        if (!selectedIds.size) { showToast('Select messages first', 'error'); return; }
                        setReplySubject(''); setReplyMessage(''); setShowReply(true);
                    }}
                        style={{ padding: '0.35rem 0.8rem', borderRadius: '6px', border: 'none', background: '#1B2042', color: '#fff', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <FaPaperPlane size={10} /> Reply {selectedIds.size ? `(${selectedIds.size})` : ''}
                    </button>
                <div className="admin-summary-cards">
                    <div className="admin-summary-card">
                        <div className="admin-summary-card__value">{messages.length}</div>
                        <div className="admin-summary-card__label">Total</div>
                    </div>
                    <div className="admin-summary-card">
                        <div className="admin-summary-card__value">{unreadCount}</div>
                        <div className="admin-summary-card__label">Unread</div>
                    </div>
                    <div className="admin-summary-card">
                        <div className="admin-summary-card__value">{messages.length - unreadCount}</div>
                        <div className="admin-summary-card__label">Read</div>
                    </div>
                </div>
                </div>
            </div>

            <div className="admin-card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {(['all', 'unread', 'read'] as const).map(f => (
                            <button key={f} className={`admin-btn ${filter !== f ? 'admin-btn--secondary' : ''}`} onClick={() => { setFilter(f); setPage(1); }} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', textTransform: 'capitalize' }}>{f}</button>
                        ))}
                    </div>
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

            <div className="messages-layout" style={{ display: 'grid', gridTemplateColumns: selectedMessage ? 'minmax(300px, 400px) 1fr' : '1fr', gap: '1.5rem', minHeight: '500px' }}>
                <div className="admin-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Inbox ({filtered.length})</h3>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={paginated.length > 0 && selectedIds.size === paginated.length} onChange={toggleSelectAll} style={{ cursor: 'pointer' }} />
                            Select All
                        </label>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '520px' }}>
                        {loading ? (
                            <div className="inline-spinner">Loading messages...</div>
                        ) : paginated.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                                <FaInbox size={40} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                <p style={{ fontSize: '0.95rem' }}>No messages in inbox</p>
                            </div>
                        ) : (
                            paginated.map(msg => (
                                <div key={msg.id} style={{
                                    padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)',
                                    borderLeft: `3px solid ${!msg.status || msg.status === 'unread' || msg.status === 'new' ? '#1B2042' : 'transparent'}`,
                                    background: selectedMessage?.id === msg.id ? 'rgba(27,32,66,0.06)' : '#fff',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                }}
                                    onMouseEnter={e => { if (selectedMessage?.id !== msg.id) e.currentTarget.style.background = 'var(--bg-body)'; }}
                                    onMouseLeave={e => { if (selectedMessage?.id !== msg.id) e.currentTarget.style.background = '#fff'; }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                        <div onClick={e => e.stopPropagation()} style={{ paddingTop: '0.15rem' }}>
                                            <input type="checkbox" checked={selectedIds.has(msg.id!)} onChange={() => toggleSelect(msg.id!)} style={{ cursor: 'pointer' }} />
                                        </div>
                                        <div style={{ flex: 1 }} onClick={() => handleSelect(msg)}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                <h4 style={{ fontSize: '0.9rem', fontWeight: !msg.status || msg.status === 'unread' || msg.status === 'new' ? 700 : 500, margin: 0 }}>{msg.name}</h4>
                                                {(!msg.status || msg.status === 'unread' || msg.status === 'new') && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1B2042', flexShrink: 0 }} />}
                                            </div>
                                            {msg.subject && <p style={{ fontSize: '0.8rem', margin: '0 0 0.25rem 0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.subject}</p>}
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.4rem 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.message?.length > 80 ? msg.message.slice(0, 80) + '...' : msg.message}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>{msg.createdAt ? formatDate(msg.createdAt) : ''}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
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

                {selectedMessage && (
                    <div className="admin-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '520px' }}>
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{ padding: '0.2rem 0.75rem', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600, background: !selectedMessage.status || selectedMessage.status === 'unread' || selectedMessage.status === 'new' ? 'rgba(27,32,66,0.12)' : 'rgba(0,128,128,0.12)', color: !selectedMessage.status || selectedMessage.status === 'unread' || selectedMessage.status === 'new' ? '#1B2042' : 'var(--primary-teal)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    {!selectedMessage.status || selectedMessage.status === 'unread' || selectedMessage.status === 'new' ? <FaClock size={10} /> : <FaCheck size={10} />}
                                    {!selectedMessage.status || selectedMessage.status === 'unread' || selectedMessage.status === 'new' ? 'NEW' : 'READ'}
                                </span>
                                {scoringLead && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Scoring lead...</span>
                                )}
                                {!scoringLead && leadScore && (
                                    <span
                                        title={leadScore.reasons?.join(' · ')}
                                        style={{
                                            padding: '0.2rem 0.75rem', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600,
                                            background: leadScore.priority === 'high' ? 'rgba(211,47,47,0.12)' : leadScore.priority === 'medium' ? 'rgba(245,158,11,0.14)' : 'rgba(107,114,128,0.12)',
                                            color: leadScore.priority === 'high' ? '#d32f2f' : leadScore.priority === 'medium' ? '#b45309' : '#6b7280',
                                        }}
                                    >
                                        {leadScore.priority.toUpperCase()} PRIORITY LEAD ({leadScore.lead_score})
                                    </span>
                                )}
                            </div>
                            <button className="admin-btn admin-btn--secondary" onClick={() => handleTrash(selectedMessage.id!)} style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <FaTrash size={11} /> Trash
                            </button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1B2042', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.1rem' }}><FaUser size={18} /></div>
                                    <div>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{selectedMessage.name}</h2>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>{selectedMessage.createdAt ? formatDate(selectedMessage.createdAt) : ''}</p>
                                    </div>
                                </div>
                                {selectedMessage.subject && (
                                    <div style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-body)', borderRadius: 6, marginBottom: '0.75rem' }}>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.15rem 0' }}>Subject</p>
                                        <p style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>{selectedMessage.subject}</p>
                                    </div>
                                )}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '0.75rem', background: 'var(--bg-body)', borderRadius: 6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                        <FaEnvelope size={13} style={{ color: 'var(--primary-teal)' }} />
                                        <a href={`mailto:${selectedMessage.email}`} style={{ color: 'var(--primary-teal)', textDecoration: 'none', fontWeight: 500 }}>{selectedMessage.email}</a>
                                    </div>
                                    {selectedMessage.phone && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                            <FaPhone size={13} style={{ color: 'var(--text-muted)' }} /><span style={{ fontWeight: 500 }}>{selectedMessage.phone}</span>
                                        </div>
                                    )}
                                    {selectedMessage.company && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                            <FaBuilding size={13} style={{ color: 'var(--text-muted)' }} /><span style={{ fontWeight: 500 }}>{selectedMessage.company}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Message</h3>
                                <div style={{ padding: '1.25rem', borderRadius: 8, fontSize: '0.95rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', border: '1px solid var(--border-color)' }}>
                                    {selectedMessage.message || 'No message content'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showReply && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => { if (!sending) setShowReply(false); }}>
                    <div className="admin-card" style={{ width: 520, maxWidth: '95vw', padding: 0 }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaPaperPlane size={13} /> Reply to {selectedIds.size} Recipient(s)</h3>
                            <button onClick={() => { if (!sending) setShowReply(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)' }}><FaTimes size={16} /></button>
                        </div>
                        <div style={{ padding: '1.25rem' }}>
                            <div style={{ marginBottom: '0.75rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Subject</label>
                                <input className="form-input" type="text" value={replySubject} onChange={e => setReplySubject(e.target.value)} placeholder="Re: Your Message" style={{ width: '100%' }} />
                            </div>
                            <div style={{ marginBottom: '0.75rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Message <span style={{ color: '#d32f2f' }}>*</span></label>
                                <textarea className="form-input" rows={6} value={replyMessage} onChange={e => setReplyMessage(e.target.value)} placeholder="Type your reply..." style={{ width: '100%', resize: 'vertical' }} />
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem', padding: '0.5rem 0.75rem', background: 'var(--bg-body)', borderRadius: 6 }}>
                                <strong>Recipients:</strong> {messages.filter(m => selectedIds.has(m.id!)).map(m => m.name).join(', ')}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button className="admin-btn admin-btn--secondary" onClick={() => setShowReply(false)} disabled={sending} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Cancel</button>
                                <button className="admin-btn" onClick={handleReply} disabled={sending || !replyMessage.trim()} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', opacity: sending || !replyMessage.trim() ? 0.6 : 1 }}>
                                    {sending ? <>Sending...</> : <><FaPaperPlane size={11} /> Send Reply</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessagesInbox;
