import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaArrowLeft, FaShareSquare, FaSearch, FaUserTie, FaHandshake,
    FaCheckCircle, FaTimes, FaStickyNote, FaFileAlt, FaSpinner, FaTrash,
    FaDraftingCompass, FaClipboardList, FaEye,
} from 'react-icons/fa';
import { useToast } from '../../context/ToastContext';
import { constructionService, type Design, type Partnership } from '../../services/constructionService';
import { sitesService, type Site } from '../../services/sitesService';
import { engineeringSubmissionsService, type EngineeringSubmission } from '../../services/engineeringSubmissionsService';
import sharedFilesService, { type SharedFile } from '../../services/sharedFilesService';

interface ShareableItem {
    id: string;
    title: string;
    description?: string;
    type: 'design' | 'submission';
    source: string;
    status?: string;
    fileUrl?: string;
    createdAt: string;
}

interface EngineerInfo {
    id: string;
    name: string;
    siteName: string;
    projectName: string;
}

interface PartnerInfo {
    id: string;
    name: string;
    type: string;
    projectName: string;
}

const ShareFiles = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [designs, setDesigns] = useState<Design[]>([]);
    const [submissions, setSubmissions] = useState<EngineeringSubmission[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [partnerships, setPartnerships] = useState<Partnership[]>([]);
    const [sharedRecords, setSharedRecords] = useState<SharedFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sourceFilter, setSourceFilter] = useState<'all' | 'design' | 'submission'>('all');

    // Selection
    const [selectedItem, setSelectedItem] = useState<ShareableItem | null>(null);
    const [recipientTab, setRecipientTab] = useState<'site_engineer' | 'partner'>('site_engineer');
    const [selectedRecipientId, setSelectedRecipientId] = useState('');
    const [selectedRecipientName, setSelectedRecipientName] = useState('');
    const [shareNotes, setShareNotes] = useState('');
    const [sharing, setSharing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        // Load each source independently — page works even if some fail
        constructionService.getDesigns()
            .then(res => setDesigns(res.data || []))
            .catch(() => {});
        sitesService.getAll()
            .then(res => setSites(res.data || []))
            .catch(() => {});
        constructionService.getPartnerships()
            .then(res => setPartnerships(res.data || []))
            .catch(() => {});
        engineeringSubmissionsService.getAll()
            .then(res => setSubmissions(res.data || []))
            .catch(() => {});
        sharedFilesService.getAll()
            .then(res => setSharedRecords(res.data || []))
            .catch(() => {});
        setLoading(false);
    };

    // Merge designs + submissions into shareable items
    // Deduplicate: if a submission was saved to designs, show it as a design only
    const designTitles = new Set(designs.map(d => d.title.toLowerCase().trim()));

    const allItems: ShareableItem[] = [
        ...designs.map(d => ({
            id: d.id,
            title: d.title,
            description: d.description,
            type: 'design' as const,
            source: d.source,
            status: d.status,
            fileUrl: d.fileUrl,
            createdAt: d.createdAt,
        })),
        ...submissions
            .filter(s => !designTitles.has(s.title.toLowerCase().trim()))
            .map(s => ({
                id: s.id,
                title: s.title,
                description: s.description,
                type: 'submission' as const,
                source: 'submission',
                status: s.status,
                fileUrl: s.documentUrls?.[0]?.url,
                createdAt: s.createdAt,
            })),
    ];

    const filteredItems = allItems.filter(item => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || item.title.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q);
        const matchesSource = sourceFilter === 'all' || item.type === sourceFilter;
        return matchesSearch && matchesSource;
    });

    // Build engineers from sites
    const engineers: EngineerInfo[] = sites
        .filter(s => s.assignedEngineerId && s.assignedEngineerName)
        .map(s => ({
            id: s.assignedEngineerId!,
            name: s.assignedEngineerName!,
            siteName: s.name,
            projectName: s.project?.name || 'Unassigned',
        }));

    // Build partners from partnerships
    const partners: PartnerInfo[] = partnerships
        .filter(p => p.status === 'active' && p.partnerUserId)
        .map(p => ({
            id: p.partnerUserId!,
            name: p.contactPerson || p.companyName,
            type: p.partnershipType,
            projectName: p.project?.name || '',
        }));

    const activeRecipients = recipientTab === 'site_engineer' ? engineers : partners;

    const handleShare = async () => {
        if (!selectedItem || !selectedRecipientId) {
            showToast('Please select a file and a recipient', 'error');
            return;
        }
        setSharing(true);
        try {
            await sharedFilesService.share({
                designId: selectedItem.id,
                sharedTo: selectedRecipientId,
                recipientName: selectedRecipientName,
                recipientType: recipientTab,
                notes: shareNotes || undefined,
            });
            showToast(`Shared with ${selectedRecipientName}`, 'success');
            setSelectedItem(null);
            setSelectedRecipientId('');
            setSelectedRecipientName('');
            setShareNotes('');
            const sharedRes = await sharedFilesService.getAll().catch(() => ({ data: [] }));
            setSharedRecords(sharedRes.data || []);
        } catch {
            showToast('Failed to share file', 'error');
        }
        setSharing(false);
    };

    const handleUnshare = async (id: string) => {
        try {
            await sharedFilesService.remove(id);
            setSharedRecords(prev => prev.filter(r => r.id !== id));
            showToast('Share removed', 'success');
        } catch {
            showToast('Failed to remove share', 'error');
        }
    };

    return (
    <>
        <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => navigate('/admin/engineering-studio')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
                >
                    <FaArrowLeft /> Back
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <FaShareSquare size={22} style={{ color: 'var(--primary)' }} />
                    <h1 style={{ margin: 0, fontSize: '1.3rem' }}>Share Files</h1>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <FaSpinner className="spin" size={24} /> Loading...
                </div>
            ) : (
                <div className="es-share-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
                    {/* LEFT: Files to share */}
                    <div>
                        <h3 style={{ margin: '0 0 0.8rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <FaFileAlt /> Available Files
                        </h3>

                        {/* Search */}
                        <div style={{ position: 'relative', marginBottom: '0.8rem' }}>
                            <FaSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }} />
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ width: '100%', padding: '0.55rem 0.55rem 0.55rem 2rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.82rem' }}
                            />
                        </div>

                        {/* Source filter tabs */}
                        <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.8rem', background: 'var(--bg-primary)', borderRadius: 8, padding: '0.2rem' }}>
                            {(['all', 'design', 'submission'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setSourceFilter(tab)}
                                    style={{
                                        flex: 1, padding: '0.4rem 0.5rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
                                        background: sourceFilter === tab ? 'var(--primary)' : 'transparent',
                                        color: sourceFilter === tab ? '#fff' : 'var(--text-muted)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                                    }}
                                >
                                    {tab === 'all' && <><FaFileAlt /> All ({allItems.length})</>}
                                    {tab === 'design' && <><FaDraftingCompass /> Designs ({allItems.filter(i => i.type === 'design').length})</>}
                                    {tab === 'submission' && <><FaClipboardList /> Submissions ({allItems.filter(i => i.type === 'submission').length})</>}
                                </button>
                            ))}
                        </div>

                        {/* File list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 500, overflow: 'auto' }}>
                            {filteredItems.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                    <FaFileAlt size={24} style={{ marginBottom: '0.4rem', opacity: 0.4 }} />
                                    <p>No files found</p>
                                </div>
                            ) : (
                                filteredItems.map(item => {
                                    const isSelected = selectedItem?.id === item.id;
                                    const itemShares = sharedRecords.filter(s => s.designId === item.id);
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => { setSelectedItem(isSelected ? null : item); setSelectedRecipientId(''); setSelectedRecipientName(''); }}
                                            style={{
                                                padding: '0.7rem 0.8rem', borderRadius: 10, cursor: 'pointer', border: '2px solid',
                                                borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                                                background: isSelected ? 'rgba(var(--primary-rgb, 139,92,246), 0.08)' : 'var(--bg-secondary)',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                <div style={{ marginTop: '0.15rem' }}>
                                                    {item.type === 'design' ? (
                                                        <FaDraftingCompass style={{ color: '#8b5cf6', fontSize: '0.8rem' }} />
                                                    ) : (
                                                        <FaClipboardList style={{ color: '#f59e0b', fontSize: '0.8rem' }} />
                                                    )}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        {item.title}
                                                        <span style={{
                                                            fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase',
                                                            background: item.type === 'design' ? '#8b5cf618' : '#f59e0b18',
                                                            color: item.type === 'design' ? '#8b5cf6' : '#f59e0b',
                                                        }}>
                                                            {item.type}
                                                        </span>
                                                    </div>
                                                    {item.description && (
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {item.description.length > 60 ? item.description.slice(0, 60) + '...' : item.description}
                                                        </div>
                                                    )}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                                        {item.status && (
                                                            <span style={{
                                                                fontSize: '0.58rem', padding: '0.1rem 0.35rem', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase',
                                                                background: item.status === 'approved' ? '#22c55e18' : item.status === 'submitted' ? '#3b82f618' : item.status === 'rejected' ? '#ef444418' : '#94a3b818',
                                                                color: item.status === 'approved' ? '#22c55e' : item.status === 'submitted' ? '#3b82f6' : item.status === 'rejected' ? '#ef4444' : '#94a3b8',
                                                            }}>
                                                                {item.status}
                                                            </span>
                                                        )}
                                                        {itemShares.length > 0 && (
                                                            <span style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 600 }}>
                                                                Shared ({itemShares.length})
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.1rem' }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (item.type === 'design' && item.fileUrl) {
                                                            window.open(item.fileUrl, '_blank');
                                                        } else if (item.type === 'submission') {
                                                            const sub = submissions.find(s => s.id === item.id);
                                                            if (sub?.documentUrls?.length) {
                                                                window.open(sub.documentUrls[0].url, '_blank');
                                                            }
                                                        }
                                                    }}
                                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: 4, fontSize: '0.75rem' }}
                                                    title="Preview"
                                                >
                                                        <FaEye />
                                                    </button>
                                                    {isSelected && <FaCheckCircle style={{ color: 'var(--primary)', fontSize: '0.8rem' }} />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* RIGHT: To section */}
                    <div>
                        <h3 style={{ margin: '0 0 0.8rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            To:
                        </h3>

                        {/* Recipient type tabs */}
                        <div className="es-recipient-tabs" style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.8rem' }}>
                            <button
                                onClick={() => { setRecipientTab('site_engineer'); setSelectedRecipientId(''); setSelectedRecipientName(''); }}
                                style={{
                                    flex: 1, padding: '0.55rem', borderRadius: 8, border: '2px solid', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                                    borderColor: recipientTab === 'site_engineer' ? 'var(--primary)' : 'var(--border)',
                                    background: recipientTab === 'site_engineer' ? 'rgba(var(--primary-rgb, 139,92,246), 0.1)' : 'transparent',
                                    color: recipientTab === 'site_engineer' ? 'var(--primary)' : 'var(--text-muted)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                }}
                            >
                                <FaUserTie /> Site Engineers
                            </button>
                            <button
                                onClick={() => { setRecipientTab('partner'); setSelectedRecipientId(''); setSelectedRecipientName(''); }}
                                style={{
                                    flex: 1, padding: '0.55rem', borderRadius: 8, border: '2px solid', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                                    borderColor: recipientTab === 'partner' ? '#27ae60' : 'var(--border)',
                                    background: recipientTab === 'partner' ? 'rgba(39,174,96,0.1)' : 'transparent',
                                    color: recipientTab === 'partner' ? '#27ae60' : 'var(--text-muted)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                }}
                            >
                                <FaHandshake /> Partners
                            </button>
                        </div>

                        {/* Recipient list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 340, overflow: 'auto', marginBottom: '0.8rem' }}>
                            {activeRecipients.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                    {recipientTab === 'site_engineer' ? 'No site engineers found' : 'No active partners'}
                                </div>
                            ) : (
                                activeRecipients.map(r => {
                                    const isSelected = selectedRecipientId === r.id;
                                    const accentColor = recipientTab === 'site_engineer' ? 'var(--primary)' : '#27ae60';
                                    return (
                                        <div
                                            key={r.id}
                                            onClick={() => { setSelectedRecipientId(r.id); setSelectedRecipientName(r.name); }}
                                            style={{
                                                padding: '0.6rem 0.8rem', borderRadius: 10, cursor: 'pointer', border: '2px solid',
                                                borderColor: isSelected ? accentColor : 'var(--border)',
                                                background: isSelected ? (recipientTab === 'site_engineer' ? 'rgba(var(--primary-rgb, 139,92,246), 0.08)' : 'rgba(39,174,96,0.08)') : 'var(--bg-secondary)',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {recipientTab === 'site_engineer' ? (
                                                    <FaUserTie style={{ fontSize: '0.75rem', color: '#e67e22' }} />
                                                ) : (
                                                    <FaHandshake style={{ fontSize: '0.75rem', color: '#27ae60' }} />
                                                )}
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{r.name}</div>
                                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                                        {recipientTab === 'site_engineer'
                                                            ? `${(r as EngineerInfo).projectName} / ${(r as EngineerInfo).siteName}`
                                                            : `${(r as PartnerInfo).type}${(r as PartnerInfo).projectName ? ` / ${(r as PartnerInfo).projectName}` : ''}`
                                                        }
                                                    </div>
                                                </div>
                                                {isSelected && <FaCheckCircle style={{ color: accentColor, fontSize: '0.8rem' }} />}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Notes */}
                        {selectedItem && selectedRecipientId && (
                            <div style={{ marginBottom: '0.8rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <FaStickyNote /> Note (optional)
                                </label>
                                <textarea
                                    placeholder="Add a note..."
                                    value={shareNotes}
                                    onChange={e => setShareNotes(e.target.value)}
                                    rows={2}
                                    style={{
                                        width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--border)',
                                        background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.82rem', resize: 'vertical',
                                    }}
                                />
                            </div>
                        )}

                        {/* Share button */}
                        <button
                            onClick={handleShare}
                            disabled={!selectedItem || !selectedRecipientId || sharing}
                            style={{
                                width: '100%', padding: '0.65rem', borderRadius: 10, border: 'none',
                                background: (!selectedItem || !selectedRecipientId || sharing) ? 'var(--text-muted)' : 'var(--primary)',
                                color: '#fff', cursor: (!selectedItem || !selectedRecipientId || sharing) ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            }}
                        >
                            {sharing ? <><FaSpinner className="spin" /> Sharing...</> : <><FaShareSquare /> Share</>}
                        </button>

                        {/* Share summary */}
                        {sharedRecords.length > 0 && (
                            <div style={{ marginTop: '1.2rem', borderTop: '1px solid var(--border)', paddingTop: '0.8rem' }}>
                                <p style={{ margin: '0 0 0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Share History ({sharedRecords.length})
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: 180, overflow: 'auto' }}>
                                    {sharedRecords.map(s => {
                                        const item = allItems.find(i => i.id === s.designId);
                                        return (
                                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.5rem', borderRadius: 6, background: 'var(--bg-secondary)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, flex: 1 }}>
                                                    {s.recipientType === 'site_engineer' ? (
                                                        <FaUserTie style={{ fontSize: '0.6rem', color: '#e67e22', flexShrink: 0 }} />
                                                    ) : (
                                                        <FaHandshake style={{ fontSize: '0.6rem', color: '#27ae60', flexShrink: 0 }} />
                                                    )}
                                                    <span style={{ fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {item?.title || 'Unknown'} &rarr; {s.recipientName || s.sharedTo}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleUnshare(s.id)}
                                                    style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', padding: '0.2rem', fontSize: '0.65rem', flexShrink: 0, marginLeft: '0.3rem' }}
                                                    title="Remove share"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </>
    );
};

export default ShareFiles;
