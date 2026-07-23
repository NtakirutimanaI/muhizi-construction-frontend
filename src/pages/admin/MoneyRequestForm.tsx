import { useRef, useState, useEffect } from 'react';
import { FaDownload, FaPrint } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { profileService } from '../../services/profileService';

interface FormData {
    date: string;
    requesterName: string;
    department: string;
    amount: string;
    reason: string;
    description: string;
    disbursementDate: string;
    status: 'draft' | 'pending' | 'approved' | 'rejected';
    authorizedByName: string;
    authorizedByPosition: string;
    authorizationDate: string;
    requesterSignature?: string;
    authorizedBySignature?: string;
    stampUrl?: string;
}

const MoneyRequestForm = ({ data, embedded = false, companyLogo: companyLogoProp }: { data: Partial<FormData>; embedded?: boolean; companyLogo?: string }) => {
    const formRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);
    const [logo, setLogo] = useState(companyLogoProp || '');

    useEffect(() => {
        if (!companyLogoProp) {
            profileService.getMyProfile().then(p => {
                const prof = (p as any).data || p;
                setLogo(prof.companyLogo || '/logo.jpeg');
            }).catch(() => setLogo('/logo.jpeg'));
        }
    }, [companyLogoProp]);

    const d: FormData = {
        date: data.date || new Date().toISOString().split('T')[0],
        requesterName: data.requesterName || 'MUTIMUKEYE Odette',
        department: data.department || 'Accountant',
        amount: data.amount || '',
        reason: data.reason || '',
        description: data.description || '',
        disbursementDate: data.disbursementDate || '',
        status: data.status || 'pending',
        authorizedByName: data.authorizedByName || 'Papias UWIMANA',
        authorizedByPosition: data.authorizedByPosition || 'CEO/Founder',
        authorizationDate: data.authorizationDate || '',
        requesterSignature: data.requesterSignature || '',
        authorizedBySignature: data.authorizedBySignature || '',
        stampUrl: data.stampUrl || '',
    };

    const formatDate = (val: string) => {
        if (!val) return '\u00A0';
        return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const handleDownload = async () => {
        if (!formRef.current) return;
        setDownloading(true);
        try {
            const canvas = await html2canvas(formRef.current, { scale: 2, useCORS: true, backgroundColor: '#fff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = (canvas.height * pdfW) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
            pdf.save(`Money-Request-Form-${d.requesterName?.replace(/\s+/g, '-')}-${d.date}.pdf`);
        } catch (err) {
            console.error('PDF generation failed:', err);
        }
        setDownloading(false);
    };

    const handlePrint = () => {
        if (!formRef.current) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write('<html><head><title>Money Request Form</title>');
        printWindow.document.write('<style>body{margin:0;padding:20px;font-family:Arial,sans-serif;}@media print{body{padding:0;}}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(formRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    const statusColor = d.status === 'approved' ? '#16a34a' : d.status === 'rejected' ? '#dc2626' : d.status === 'draft' ? '#6366f1' : '#d97706';
    const statusLabel = d.status === 'approved' ? 'APPROVED' : d.status === 'rejected' ? 'DENIED' : d.status === 'draft' ? 'DRAFT' : 'PENDING';

    const tborder = '1px solid #222';
    const cell = '10px 14px';

    const labelCell: React.CSSProperties = {
        fontWeight: 700, fontSize: '13px', color: '#1a1a1a',
        padding: cell, border: tborder, width: '35%', verticalAlign: 'top',
        background: '#f8f9fa', lineHeight: 1.4,
    };

    const valueCell: React.CSSProperties = {
        fontSize: '13px', color: '#111', padding: cell, border: tborder,
        minHeight: '24px', lineHeight: 1.5,
    };

    const formContent = (
        <div ref={formRef} style={{
            fontFamily: 'Arial, Helvetica, sans-serif', background: '#fff',
            padding: '36px 40px', maxWidth: '800px', margin: '0 auto',
            color: '#111', position: 'relative', lineHeight: 1.5,
        }}>

            {/* ── Header ── */}
            <div style={{ textAlign: 'center', borderBottom: '3px double #1B2042', paddingBottom: '18px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px', marginBottom: '10px' }}>
                    <img
                        src={logo || '/logo.jpeg'}
                        alt="Company Logo"
                        style={{ width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #ddd' }}
                    />
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#1B2042', letterSpacing: '0.5px', lineHeight: 1.25 }}>
                            MUHIZI DESIGNING & CONSTRUCTION
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#555', fontStyle: 'italic', letterSpacing: '0.8px', marginTop: '3px' }}>
                            OUR SUCCESS IS TO SERVE OPPORTUNELY YOUR EXIGENCIES
                        </div>
                    </div>
                </div>
                <div style={{
                    marginTop: '14px', fontSize: '17px', fontWeight: 900, color: '#1B2042',
                    letterSpacing: '2.5px', borderTop: '1px solid #bbb', borderBottom: '1px solid #bbb',
                    padding: '10px 0',
                }}>
                    MONEY REQUEST FORM
                </div>
            </div>

            {/* ── Status Badge ── */}
            <div style={{ textAlign: 'right', marginBottom: '14px' }}>
                <span style={{
                    fontSize: '11px', fontWeight: 800, padding: '4px 14px', letterSpacing: '1.5px',
                    border: `2px solid ${statusColor}`, color: statusColor, borderRadius: 3,
                    textTransform: 'uppercase',
                }}>
                    {statusLabel}
                </span>
            </div>

            {/* ── Requester Info Table ── */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <tbody>
                    <tr>
                        <td style={labelCell}>Date</td>
                        <td style={valueCell}>{formatDate(d.date)}</td>
                    </tr>
                    <tr>
                        <td style={labelCell}>Requester's Name</td>
                        <td style={valueCell}>{d.requesterName}</td>
                    </tr>
                    <tr>
                        <td style={labelCell}>Department / Position</td>
                        <td style={valueCell}>{d.department}</td>
                    </tr>
                    <tr>
                        <td style={{ ...labelCell, fontWeight: 800 }}>Amount Requested (RWF)</td>
                        <td style={{ ...valueCell, fontWeight: 800, fontSize: '15px', color: '#1B2042' }}>
                            {d.amount ? `RWF ${Number(d.amount).toLocaleString()}` : '\u00A0'}
                        </td>
                    </tr>
                    <tr>
                        <td style={labelCell}>Reason</td>
                        <td style={valueCell}>{d.reason || '\u00A0'}</td>
                    </tr>
                    <tr>
                        <td style={{ ...labelCell, verticalAlign: 'top' }}>Description of How the Money Will Be Used</td>
                        <td style={{ ...valueCell, minHeight: '65px', whiteSpace: 'pre-wrap' }}>{d.description || '\u00A0'}</td>
                    </tr>
                    <tr>
                        <td style={labelCell}>Requested Disbursement Date</td>
                        <td style={valueCell}>{formatDate(d.disbursementDate)}</td>
                    </tr>
                </tbody>
            </table>

            {/* ── Requester Signature ── */}
            <div style={{ border: tborder, borderTop: 'none', padding: '14px 14px 12px', marginBottom: '22px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px', color: '#222' }}>
                    Signature of Requester (Finance Director)
                </div>
                <div style={{ borderBottom: '1px solid #888', height: '48px', marginBottom: '6px', display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
                    {d.requesterSignature ? <img src={d.requesterSignature} alt="Signature" style={{ height: '40px', objectFit: 'contain' }} /> : null}
                </div>
                <div style={{ fontSize: '11px', color: '#444', fontWeight: 600 }}>{d.requesterName}</div>
                <div style={{ fontSize: '11px', color: '#666' }}>Date: {formatDate(d.date)}</div>
            </div>

            {/* ── Authorization Section ── */}
            {d.status !== 'draft' && (
            <div style={{ border: tborder, borderTop: '2.5px solid #1B2042', padding: '16px 14px', marginBottom: '18px', position: 'relative' }}>
                <div style={{
                    fontSize: '14px', fontWeight: 900, color: '#1B2042', letterSpacing: '2px',
                    marginBottom: '14px', textAlign: 'center', borderBottom: '1px solid #ccc',
                    paddingBottom: '8px',
                }}>
                    AUTHORIZATION
                </div>

                <div style={{ display: 'flex', gap: '36px', marginBottom: '16px', fontSize: '13px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'default' }}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '18px', height: '18px', border: '2px solid #333', borderRadius: '3px',
                            background: d.status === 'approved' ? '#16a34a' : '#fff',
                            fontSize: '12px', color: '#fff', fontWeight: 700,
                        }}>
                            {d.status === 'approved' ? '\u2713' : ''}
                        </span>
                        <span style={{ fontWeight: 700, color: '#1a1a1a' }}>APPROVED</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'default' }}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '18px', height: '18px', border: '2px solid #333', borderRadius: '3px',
                            background: d.status === 'rejected' ? '#dc2626' : '#fff',
                            fontSize: '12px', color: '#fff', fontWeight: 700,
                        }}>
                            {d.status === 'rejected' ? '\u2713' : ''}
                        </span>
                        <span style={{ fontWeight: 700, color: '#1a1a1a' }}>DENIED</span>
                    </label>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                        <tr>
                            <td style={labelCell}>Authorized By</td>
                            <td style={valueCell}>{d.authorizedByName}</td>
                        </tr>
                        <tr>
                            <td style={labelCell}>Position</td>
                            <td style={valueCell}>{d.authorizedByPosition}</td>
                        </tr>
                        <tr>
                            <td style={labelCell}>Signature</td>
                            <td style={{ ...valueCell, height: '48px' }}>
                                {d.authorizedBySignature ? <img src={d.authorizedBySignature} alt="Signature" style={{ height: '40px', objectFit: 'contain' }} /> : null}
                            </td>
                        </tr>
                        <tr>
                            <td style={labelCell}>Date</td>
                            <td style={valueCell}>{formatDate(d.authorizationDate)}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Stamp */}
                {d.stampUrl && (
                    <div style={{ position: 'absolute', bottom: '20px', right: '30px', transform: 'rotate(-12deg)', opacity: 0.65 }}>
                        <img src={d.stampUrl} alt="Official Stamp" style={{ width: '90px', height: '90px', objectFit: 'contain' }} />
                    </div>
                )}
            </div>
            )}

            {/* ── Footer ── */}
            <div style={{ textAlign: 'center', fontSize: '10px', color: '#888', borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '4px', letterSpacing: '0.5px' }}>
                MUHIZI DESIGNING & CONSTRUCTION &mdash; Official Money Request Form &mdash; Confidential
            </div>
        </div>
    );

    if (embedded) return formContent;

    return (
        <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', justifyContent: 'flex-end' }}>
                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    style={{
                        padding: '0.5rem 1rem', borderRadius: 7, border: 'none',
                        background: '#1B2042', color: '#fff', cursor: 'pointer',
                        fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                        opacity: downloading ? 0.6 : 1,
                    }}
                >
                    <FaDownload size={12} /> {downloading ? 'Generating...' : 'Download PDF'}
                </button>
                <button
                    onClick={handlePrint}
                    style={{
                        padding: '0.5rem 1rem', borderRadius: 7, border: '1px solid var(--border-color)',
                        background: 'var(--bg-white)', color: 'var(--text-main)', cursor: 'pointer',
                        fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                    }}
                >
                    <FaPrint size={12} /> Print
                </button>
            </div>
            <div style={{ overflow: 'auto', border: '1px solid var(--border-color)', borderRadius: 0 }}>
                {formContent}
            </div>
        </div>
    );
};

export default MoneyRequestForm;
