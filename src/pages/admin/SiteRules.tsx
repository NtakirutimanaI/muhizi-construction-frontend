import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { siteRulesService, type SiteRule } from '../../services/siteRulesService';
import {
    FaClock, FaHardHat, FaMoneyCheckAlt, FaLock, FaListAlt, FaExclamationTriangle,
    FaPhone, FaBullhorn, FaCheckCircle, FaRegNewspaper, FaClipboardCheck,
    FaTimes, FaExpandAlt, FaGavel, FaEdit, FaTrash, FaPlus, FaCog, FaSave
} from 'react-icons/fa';

const iconMap: Record<string, React.ReactNode> = {
    FaClock: <FaClock size={16} />, FaHardHat: <FaHardHat size={16} />,
    FaMoneyCheckAlt: <FaMoneyCheckAlt size={16} />, FaLock: <FaLock size={16} />,
    FaListAlt: <FaListAlt size={16} />, FaExclamationTriangle: <FaExclamationTriangle size={16} />,
    FaBullhorn: <FaBullhorn size={16} />, FaGavel: <FaGavel size={16} />,
};

const pinColors = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#1B2042', '#e67e22', '#1abc9c'];
const iconOptions = Object.keys(iconMap);
const rotations = ['-1.5deg', '0.8deg', '-0.5deg', '1.2deg', '-0.8deg', '0.5deg'];

interface FormData {
    title: string;
    iconName: string;
    pinColor: string;
    items: string;
    order: number;
}

const emptyForm: FormData = { title: '', iconName: 'FaBullhorn', pinColor: '#e74c3c', items: '', order: 0 };

const SiteRules = () => {
    const { user } = useAuth();
    const role = user?.role || '';
    const canManage = role === 'admin' || role === 'site_manager';

    const [rules, setRules] = useState<SiteRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [manageMode, setManageMode] = useState(false);
    const [selectedRule, setSelectedRule] = useState<SiteRule | null>(null);
    const [formModal, setFormModal] = useState<{ open: boolean; edit?: SiteRule }>({ open: false });
    const [form, setForm] = useState<FormData>(emptyForm);

    const fetchRules = async () => {
        try {
            const ep = canManage && manageMode ? siteRulesService.getAllAdmin : siteRulesService.getAll;
            const res = await ep();
            setRules(res.data || []);
        } catch { /* keep current */ } finally { setLoading(false); }
    };

    useEffect(() => { fetchRules(); }, [manageMode]);

    const openEdit = (rule: SiteRule) => {
        setForm({
            title: rule.title,
            iconName: rule.iconName || 'FaBullhorn',
            pinColor: rule.pinColor || '#e74c3c',
            items: rule.items.join('\n'),
            order: rule.order,
        });
        setFormModal({ open: true, edit: rule });
    };

    const openCreate = () => {
        setForm(emptyForm);
        setFormModal({ open: true });
    };

    const handleSave = async () => {
        const payload = {
            title: form.title,
            iconName: form.iconName,
            pinColor: form.pinColor,
            items: form.items.split('\n').map(s => s.trim()).filter(Boolean),
            order: form.order,
        };
        if (formModal.edit) {
            await siteRulesService.update(formModal.edit.id, payload);
        } else {
            await siteRulesService.create(payload);
        }
        setFormModal({ open: false });
        fetchRules();
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this notice permanently?')) return;
        await siteRulesService.delete(id);
        fetchRules();
    };

    const totalItems = rules.reduce((sum, r) => sum + r.items.length, 0);
    const postedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FaBullhorn style={{ color: '#1B2042' }} /> Site Rules Board
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Official notices and regulations — all employees must read and comply
                    </p>
                </div>
                {canManage && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                            onClick={() => setManageMode(!manageMode)}
                            style={{
                                padding: '0.4rem 1rem', borderRadius: '8px', border: `1px solid ${manageMode ? '#1B2042' : 'var(--border-color)'}`,
                                background: manageMode ? '#1B2042' : 'transparent',
                                color: manageMode ? '#fff' : 'var(--text-main)',
                                cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                                fontWeight: 600,
                            }}
                        >
                            <FaCog size={12} /> {manageMode ? 'View Mode' : 'Manage Board'}
                        </button>
                        {manageMode && (
                            <button onClick={openCreate} style={{
                                padding: '0.4rem 1rem', borderRadius: '8px', border: 'none',
                                background: '#22c55e', color: '#fff', cursor: 'pointer',
                                fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600,
                            }}>
                                <FaPlus size={12} /> Add Notice
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div style={{
                background: 'linear-gradient(135deg, #1B2042 0%, #1B2042 30%, #1B2042 60%, #1B2042 100%)',
                borderRadius: '16px', padding: '2rem 1.5rem 1.5rem',
                border: '4px solid #1B2042',
                boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.3)',
                position: 'relative',
            }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: `
                        repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(0,0,0,0.05) 60px, rgba(0,0,0,0.05) 61px),
                        repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(0,0,0,0.05) 60px, rgba(0,0,0,0.05) 61px)
                    `,
                    borderRadius: '12px', pointerEvents: 'none',
                }} />

                <div style={{
                    position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                    background: '#1B2042', padding: '4px 24px', borderRadius: '4px',
                    border: '1px solid #1B2042', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}>
                    <span style={{ color: '#D4A574', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                        &#9733; Official Notice Board &#9733;
                    </span>
                </div>

                <div style={{ position: 'relative', zIndex: 1, marginBottom: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                        {[
                            { value: rules.length, label: 'Rule Categories', icon: <FaRegNewspaper size={14} /> },
                            { value: totalItems, label: 'Total Regulations', icon: <FaClipboardCheck size={14} /> },
                            { value: postedDate.split(',')[0], label: 'Last Updated', icon: <FaClock size={14} /> },
                            { value: manageMode ? 'Manage Mode' : 'Active', label: 'Board Status', icon: <FaCheckCircle size={14} /> },
                        ].map((stat, i) => (
                            <div key={i} style={{
                                background: 'rgba(255,255,255,0.08)',
                                backdropFilter: 'blur(4px)', borderRadius: '10px',
                                padding: '0.7rem 0.8rem', color: '#fff',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                                    <span style={{ opacity: 0.6 }}>{stat.icon}</span>
                                    <span style={{ fontSize: '0.62rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
                                </div>
                                <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{stat.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.5)', position: 'relative', zIndex: 1 }}>
                        Loading notices...
                    </div>
                ) : rules.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.5)', position: 'relative', zIndex: 1 }}>
                        No notices posted yet.
                        {manageMode && <div style={{ marginTop: '0.5rem' }}>Click "Add Notice" to create the first one.</div>}
                    </div>
                ) : (
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: '1.25rem', position: 'relative', zIndex: 1,
                    }}>
                        {rules.map((section, idx) => (
                            <div key={section.id}>
                                <div
                                    className="notice-card"
                                    style={{
                                        background: 'linear-gradient(145deg, #1B2042 0%, #1B2042 100%)',
                                        borderRadius: '6px', padding: '1.25rem 1.25rem 1rem',
                                        color: '#fff', position: 'relative',
                                        transform: `rotate(${rotations[idx % rotations.length]})`,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                                        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                                        cursor: 'pointer',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                    }}
                                    onClick={() => setSelectedRule(section)}
                                    role="button" tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedRule(section); }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'rotate(0deg) scale(1.03)';
                                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.3)';
                                        e.currentTarget.style.zIndex = '10';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = `rotate(${rotations[idx % rotations.length]}) scale(1)`;
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)';
                                        e.currentTarget.style.zIndex = '1';
                                    }}
                                >
                                    <div style={{ position: 'absolute', top: '6px', right: '8px', opacity: 0.3, fontSize: '0.6rem', transition: 'opacity 0.2s', color: '#fff' }}
                                        className="notice-expand-icon">
                                        <FaExpandAlt />
                                    </div>

                                    {manageMode && (
                                        <div style={{ position: 'absolute', top: '6px', left: '8px', display: 'flex', gap: '4px', zIndex: 5 }}>
                                            <button onClick={(e) => { e.stopPropagation(); openEdit(section); }}
                                                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '4px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', fontSize: '0.6rem' }}>
                                                <FaEdit />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(section.id); }}
                                                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '4px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer', fontSize: '0.6rem' }}>
                                                <FaTrash />
                                            </button>
                                        </div>
                                    )}

                                    <div style={{
                                        position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)',
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        background: `radial-gradient(circle at 35% 35%, ${section.pinColor || '#e74c3c'}, ${(section.pinColor || '#e74c3c')}dd)`,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.3)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'transform 0.2s ease', zIndex: 2,
                                    }} className="notice-pin">
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)', marginTop: '-4px' }} />
                                    </div>

                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        marginBottom: '0.6rem', paddingBottom: '0.5rem',
                                        borderBottom: '1px dashed rgba(255,255,255,0.2)', marginTop: '4px',
                                    }}>
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '6px',
                                            background: 'rgba(255,255,255,0.12)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#fff', fontSize: '0.85rem',
                                        }}>
                                            {iconMap[section.iconName] || <FaBullhorn size={16} />}
                                        </div>
                                        <h2 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, letterSpacing: '0.01em' }}>
                                            {section.title}
                                        </h2>
                                    </div>

                                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                        {section.items.map((item, i) => (
                                            <li key={i} style={{
                                                fontSize: '0.75rem', lineHeight: 1.45, opacity: 0.92,
                                                paddingLeft: '0.85rem', position: 'relative',
                                            }}>
                                                <span style={{
                                                    position: 'absolute', left: 0, top: '6px',
                                                    width: '4px', height: '4px', borderRadius: '50%',
                                                    background: 'rgba(255,255,255,0.4)',
                                                }} />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>

                                    <div style={{
                                        marginTop: '0.6rem', paddingTop: '0.4rem',
                                        borderTop: '1px dashed rgba(255,255,255,0.12)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    }}>
                                        <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>Notice #{idx + 1}</span>
                                        <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>
                                            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{
                    marginTop: '1.5rem', position: 'relative', zIndex: 1,
                    padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(4px)', borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.08)', color: '#fff',
                    display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
                }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaPhone size={14} />
                    </div>
                    <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                        <strong>Questions or concerns?</strong> Contact HR at{' '}
                        <strong>hr@muhiziconstruction.rw</strong> or call{' '}
                        <strong>+250 788 000 000</strong>
                    </span>
                </div>

                <div style={{ marginTop: '0.75rem', position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                    {['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6'].map((color, i) => (
                        <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, opacity: 0.3 }} />
                    ))}
                    <span style={{ fontSize: '0.6rem', opacity: 0.3, color: '#fff', marginLeft: '0.5rem' }}>
                        &#9733; pinned with care by Muhizi Construction
                    </span>
                </div>
            </div>

            {selectedRule && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
                    onClick={() => setSelectedRule(null)}
                >
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
                    <div onClick={(e) => e.stopPropagation()} style={{
                        position: 'relative', background: 'linear-gradient(145deg, #1B2042, #1B2042)',
                        borderRadius: '16px', padding: '2rem 2.5rem', maxWidth: '700px', width: '100%',
                        maxHeight: '85vh', overflowY: 'auto', color: '#fff',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        <button onClick={() => setSelectedRule(null)}
                            style={{ position: 'absolute', top: '12px', right: '14px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', fontSize: '1rem', transition: 'background 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                            <FaTimes />
                        </button>

                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.3rem', marginBottom: '1rem' }}>
                            {iconMap[selectedRule.iconName] || <FaBullhorn size={20} />}
                        </div>

                        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.25rem', letterSpacing: '-0.01em' }}>
                            {selectedRule.title}
                        </h2>

                        <div style={{ width: '60px', height: '3px', borderRadius: '2px', background: selectedRule.pinColor || '#e74c3c', marginBottom: '1.25rem' }} />

                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {selectedRule.items.map((item, i) => (
                                <li key={i} style={{ fontSize: '1.05rem', lineHeight: 1.6, paddingLeft: '1.5rem', position: 'relative', opacity: 0.95 }}>
                                    <span style={{ position: 'absolute', left: 0, top: '10px', width: '8px', height: '8px', borderRadius: '50%', background: selectedRule.pinColor || '#e74c3c' }} />
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.5 }}>
                            <span>Notice Board — Muhizi Construction</span>
                            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>
            )}

            {formModal.open && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
                    onClick={() => setFormModal({ open: false })}
                >
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
                    <div onClick={(e) => e.stopPropagation()} style={{
                        position: 'relative', background: 'var(--bg-card)', borderRadius: '16px',
                        padding: '2rem', maxWidth: '560px', width: '100%', maxHeight: '85vh', overflowY: 'auto',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)',
                    }}>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {formModal.edit ? <FaEdit /> : <FaPlus />} {formModal.edit ? 'Edit Notice' : 'New Notice'}
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>Title</label>
                                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.9rem' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>Icon</label>
                                    <select value={form.iconName} onChange={(e) => setForm({ ...form, iconName: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                        {iconOptions.map(name => (
                                            <option key={name} value={name}>{name.replace('Fa', '')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>Pin Color</label>
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', padding: '0.5rem 0' }}>
                                        {pinColors.map(c => (
                                            <div key={c} onClick={() => setForm({ ...form, pinColor: c })}
                                                style={{
                                                    width: '28px', height: '28px', borderRadius: '50%', background: c, cursor: 'pointer',
                                                    border: form.pinColor === c ? '3px solid var(--text-main)' : '3px solid transparent',
                                                    transition: 'border 0.15s',
                                                }} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>Rules (one per line)</label>
                                <textarea value={form.items} onChange={(e) => setForm({ ...form, items: e.target.value })}
                                    rows={7}
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit' }} />
                            </div>
                        </div>

                        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button onClick={() => setFormModal({ open: false })}
                                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.85rem' }}>
                                Cancel
                            </button>
                            <button onClick={handleSave}
                                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', background: '#1B2042', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                                <FaSave size={12} /> {formModal.edit ? 'Update' : 'Publish'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SiteRules;
