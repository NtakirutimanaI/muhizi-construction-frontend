import { useState } from 'react';
import { FaTimes, FaDownload, FaFilePdf, FaFileExcel, FaSpinner } from 'react-icons/fa';

interface DocumentPreviewProps {
    open: boolean;
    onClose: () => void;
    title: string;
    type: 'pdf' | 'excel';
    onDownload: () => void;
    blobUrl?: string;
    html?: string;
    loading?: boolean;
}

const DocumentPreview = ({ open, onClose, title, type, onDownload, blobUrl, html, loading }: DocumentPreviewProps) => {
    if (!open) return null;
    const isPdf = type === 'pdf';
    const accent = isPdf ? '#dc2626' : '#16a34a';
    const Icon = isPdf ? FaFilePdf : FaFileExcel;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 16 }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, width: '95vw', maxWidth: 900, height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: `2px solid ${accent}`, background: '#faf9f7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon size={16} style={{ color: accent }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1B2042' }}>{title}</span>
                        <span style={{ fontSize: '0.65rem', color: '#999', background: '#f3f4f6', padding: '1px 6px', borderRadius: 3 }}>{isPdf ? 'PDF Preview' : 'Excel Preview'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={onDownload} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 14px', borderRadius: 5, border: `1px solid ${accent}`, background: accent, color: '#fff', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                            <FaDownload size={10} /> Download {isPdf ? 'PDF' : 'Excel'}
                        </button>
                        <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 5, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FaTimes size={12} color="#666" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', background: '#e5e7eb', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 16 }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
                            <FaSpinner className="spin" size={28} style={{ color: accent }} />
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>Generating document...</span>
                        </div>
                    ) : isPdf && blobUrl ? (
                        <iframe src={blobUrl} style={{ width: '100%', height: '100%', border: 'none', borderRadius: 4, minHeight: 500 }} title="PDF Preview" />
                    ) : html ? (
                        <div style={{ background: '#fff', width: '100%', maxWidth: 794, boxShadow: '0 2px 12px rgba(0,0,0,0.15)', borderRadius: 4, overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: html }} />
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default DocumentPreview;
