import React, { useState, useEffect, useCallback } from 'react';
import { FaLock, FaShieldAlt, FaCheck, FaTimes, FaUndo, FaUserShield, FaSpinner, FaUsers } from 'react-icons/fa';
import { profileService } from '../../services/profileService';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';

const ROLES: string[] = ['admin', 'managing_director', 'finance_director', 'site_engineer', 'engineering_studio', 'partner'];

interface UserData {
    id: string;
    email: string;
    username: string;
    role: string;
    isActive: boolean;
    profile?: { firstName?: string; lastName?: string; avatar?: string; phone?: string };
    createdAt: string;
}

interface PermissionGroup {
    group: string;
    permissions: string[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
    { group: 'Profile', permissions: ['profile:read', 'profile:create', 'profile:update', 'profile:delete'] },
    { group: 'Messages', permissions: ['messages:read', 'messages:create', 'messages:update', 'messages:delete'] },
    { group: 'Resources', permissions: ['resources:read', 'resources:create', 'resources:update', 'resources:delete'] },
    { group: 'Notifications', permissions: ['notifications:read', 'notifications:update'] },
    { group: 'Visitors', permissions: ['visitors:read'] },
    { group: 'Users', permissions: ['users:read', 'users:create', 'users:update', 'users:delete'] },
    { group: 'Projects', permissions: ['projects:read', 'projects:create', 'projects:update', 'projects:delete'] },
    { group: 'Designs', permissions: ['designs:read', 'designs:create', 'designs:update', 'designs:delete'] },
    { group: 'Partnerships', permissions: ['partnerships:read', 'partnerships:create', 'partnerships:update', 'partnerships:delete'] },
    { group: 'Employees', permissions: ['employees:read', 'employees:create', 'employees:update', 'employees:delete'] },
    { group: 'Attendance', permissions: ['attendance:read', 'attendance:create', 'attendance:update'] },
    { group: 'Payroll', permissions: ['payroll:read', 'payroll:create', 'payroll:update'] },
    { group: 'Finances', permissions: ['incomes:read', 'incomes:create', 'incomes:update', 'incomes:delete', 'expenses:read', 'expenses:create', 'expenses:update', 'expenses:delete'] },
    { group: 'Reports', permissions: ['reports:read'] },
    { group: 'Settings', permissions: ['settings:read', 'settings:update'] },
    { group: 'ML', permissions: ['ml:read', 'ml:execute'] },
    { group: 'Audit', permissions: ['audit:read'] },
];

const DEFAULT_PERMISSIONS: Record<string, string[]> = {
    admin: ['*'],
    managing_director: ['profile:read', 'messages:read', 'resources:read', 'notifications:read', 'visitors:read'],
    finance_director: ['profile:read', 'messages:read', 'resources:read', 'notifications:read', 'visitors:read', 'incomes:read', 'incomes:create', 'incomes:update', 'expenses:read', 'expenses:create', 'expenses:update', 'payroll:read', 'reports:read'],
    site_engineer: ['profile:read', 'profile:update', 'messages:read', 'messages:update', 'resources:read', 'resources:create', 'resources:update', 'notifications:read', 'visitors:read', 'projects:read', 'designs:read'],
    engineering_studio: ['profile:read', 'messages:read', 'resources:read', 'projects:read', 'designs:read', 'designs:create', 'designs:update'],
    partner: ['profile:read'],
};

const LOCAL_KEY = 'app_permissions';

const roleColors: Record<string, string> = { admin: '#ef4444', managing_director: '#1B2042', finance_director: '#f59e0b', site_engineer: '#22c55e', engineering_studio: '#3b82f6', partner: '#1a8a6a' };
const roleLabels: Record<string, string> = { admin: 'CEO', managing_director: 'Managing Director', finance_director: 'Finance Director', site_engineer: 'Site Engineer', engineering_studio: 'Engineering Studio', partner: 'Partner' };

export default function Permissions() {
    const { showToast } = useToast();
    const [rolePerms, setRolePerms] = useState<Record<string, string[]>>({ ...DEFAULT_PERMISSIONS });
    const [loading, setLoading] = useState(true);
    const [savingPerm, setSavingPerm] = useState<string | null>(null);
    const [searchPerm, setSearchPerm] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
        const obj: Record<string, boolean> = {};
        PERMISSION_GROUPS.forEach(g => obj[g.group] = true);
        return obj;
    });

    const [users, setUsers] = useState<UserData[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [assigningUser, setAssigningUser] = useState<string | null>(null);
    const [userSearch, setUserSearch] = useState('');

    const allPermissions: string[] = PERMISSION_GROUPS.flatMap(g => g.permissions);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const profile = await profileService.getMyProfile();
                const saved = (profile?.pageContent as any)?.permissions as Record<string, string[]> | undefined;
                if (saved && typeof saved === 'object') {
                    const merged: Record<string, string[]> = {};
                    for (const role of ROLES) {
                        merged[role] = saved[role] && Array.isArray(saved[role]) ? saved[role] : (DEFAULT_PERMISSIONS[role] || []);
                    }
                    setRolePerms(merged);
                    localStorage.setItem(LOCAL_KEY, JSON.stringify(merged));
                    return;
                }
            } catch { /* ignore */ }
            try {
                const local = localStorage.getItem(LOCAL_KEY);
                if (local) {
                    const parsed = JSON.parse(local) as Record<string, string[]>;
                    const merged: Record<string, string[]> = {};
                    for (const role of ROLES) {
                        merged[role] = parsed[role] && Array.isArray(parsed[role]) ? parsed[role] : (DEFAULT_PERMISSIONS[role] || []);
                    }
                    setRolePerms(merged);
                    return;
                }
            } catch { /* ignore */ }
            setRolePerms({ ...DEFAULT_PERMISSIONS });
        })().finally(() => setLoading(false));
        authService.getAllUsers().then(setUsers).catch(() => showToast('Failed to load users', 'error')).finally(() => setLoadingUsers(false));
    }, []);

    const persist = useCallback(async (updated: Record<string, string[]>) => {
        try {
            const profile = await profileService.getMyProfile();
            await profileService.updateProfile({ pageContent: { ...profile.pageContent, permissions: updated } } as any);
        } catch { /* ignore */ }
        localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
    }, []);

    const togglePermission = async (role: string, permission: string) => {
        if (role === 'admin') return;
        const current = rolePerms[role] || [];
        const granting = !current.includes(permission);
        if (!confirm(`Do you want to ${granting ? 'apply' : 'remove'} "${permission}" for "${roleLabels[role]}"?`)) return;
        setSavingPerm(`${role}:${permission}`);
        const updated = granting ? [...current, permission] : current.filter(p => p !== permission);
        const next = { ...rolePerms, [role]: updated };
        setRolePerms(next);
        await persist(next);
        showToast(`${granting ? 'Granted' : 'Revoked'} "${permission}" for ${roleLabels[role]}`, 'success');
        setSavingPerm(null);
    };

    const toggleGroupForRole = async (role: string, groupName: string, grant: boolean) => {
        if (role === 'admin') return;
        const groupPerms = PERMISSION_GROUPS.find(g => g.group === groupName)?.permissions ?? [];
        if (!confirm(`Do you want to ${grant ? 'grant all' : 'revoke all'} "${groupName}" permissions for "${roleLabels[role]}"?`)) return;
        setSavingPerm(`${role}:${groupName}`);
        const current = rolePerms[role] || [];
        const updated = grant ? [...new Set([...current, ...groupPerms])] : current.filter(p => !groupPerms.includes(p));
        const next = { ...rolePerms, [role]: updated };
        setRolePerms(next);
        await persist(next);
        showToast(`${grant ? 'Granted' : 'Revoked'} all "${groupName}" for ${roleLabels[role]}`, 'success');
        setSavingPerm(null);
    };

    const setAllForRole = async (role: string, grant: boolean) => {
        if (role === 'admin') return;
        if (!confirm(`Do you want to ${grant ? 'grant all permissions to' : 'revoke all permissions from'} "${roleLabels[role]}"?`)) return;
        setSavingPerm(`${role}:all`);
        const next = { ...rolePerms, [role]: grant ? [...allPermissions] : [] };
        setRolePerms(next);
        await persist(next);
        showToast(`${grant ? 'Granted' : 'Revoked'} all permissions for ${roleLabels[role]}`, 'success');
        setSavingPerm(null);
    };

    const resetPermissions = async () => {
        if (!confirm('Reset all permissions to factory defaults?')) return;
        setSavingPerm('reset');
        try {
            const profile = await profileService.getMyProfile();
            const pc = { ...profile.pageContent } as any;
            delete pc.permissions;
            await profileService.updateProfile({ pageContent: pc } as any);
            localStorage.removeItem(LOCAL_KEY);
        } catch { /* ignore */ }
        setRolePerms({ ...DEFAULT_PERMISSIONS });
        showToast('Permissions reset to defaults', 'success');
        setSavingPerm(null);
    };

    const assignRole = async (userId: string, newRole: string, userName: string) => {
        if (!confirm(`Do you want to assign "${newRole}" role to "${userName}"?`)) return;
        setAssigningUser(userId);
        try {
            await authService.updateUser(userId, { role: newRole });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            showToast(`"${newRole}" role assigned to ${userName}`, 'success');
        } catch {
            showToast('Failed to assign role', 'error');
        } finally {
            setAssigningUser(null);
        }
    };

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const groupHasPermission = (groupName: string, perms: string[]) => {
        return PERMISSION_GROUPS.find(g => g.group === groupName)?.permissions.some(p => perms.includes(p)) ?? false;
    };

    const groupAllGranted = (groupName: string, perms: string[]) => {
        const groupPerms = PERMISSION_GROUPS.find(g => g.group === groupName)?.permissions ?? [];
        return groupPerms.length > 0 && groupPerms.every(p => perms.includes(p));
    };

    const filteredGroups = searchPerm.trim()
        ? PERMISSION_GROUPS.map(g => ({
            ...g,
            permissions: g.permissions.filter(p => p.toLowerCase().includes(searchPerm.toLowerCase())),
        })).filter(g => g.permissions.length > 0)
        : PERMISSION_GROUPS;

    const rows: React.ReactNode[] = [];
    for (const g of filteredGroups) {
        const exp = expandedGroups[g.group];
        const cells: React.ReactNode[] = [];
        for (const role of ROLES) {
            if (exp) {
                cells.push(<td key={role} style={{ textAlign: 'center', borderBottom: 'none', padding: '0.15rem' }}></td>);
            } else {
                const perms = rolePerms[role] || [];
                const anyG = groupHasPermission(g.group, perms);
                const allG = groupAllGranted(g.group, perms);
                cells.push(
                    <td key={role} style={{ textAlign: 'center', background: anyG ? 'rgba(34,197,94,0.08)' : undefined }}>
                        {role === 'admin' ? (
                            <FaCheck style={{ color: '#22c55e' }} />
                        ) : (
                            <button
                                onClick={() => toggleGroupForRole(role, g.group, !allG)}
                                disabled={savingPerm?.startsWith(`${role}:`)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.7rem', color: allG ? '#22c55e' : (anyG ? '#f59e0b' : 'var(--text-muted)') }}
                            >
                                {allG ? 'All' : anyG ? 'Partial' : 'None'}
                            </button>
                        )}
                    </td>
                );
            }
        }
        rows.push(
            <tr key={g.group}>
                <td style={{ fontWeight: 600, cursor: 'pointer', position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 1, borderBottom: exp ? 'none' : undefined }} onClick={() => toggleGroup(g.group)}>
                    <span style={{ marginRight: '0.3rem', opacity: 0.5 }}>{exp ? '▼' : '▶'}</span> {g.group} ({g.permissions.length})
                </td>
                {cells}
            </tr>
        );
        if (exp) {
            for (const perm of g.permissions) {
                const permCells: React.ReactNode[] = [];
                for (const role of ROLES) {
                    const rolePermList = rolePerms[role] || [];
                    const granted = role === 'admin' || rolePermList.includes(perm);
                    const isCellSaving = savingPerm === `${role}:${perm}`;
                    permCells.push(
                        <td key={role} style={{ textAlign: 'center', padding: '0.15rem' }}>
                            {isCellSaving ? (
                                <FaSpinner style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)', fontSize: '0.7rem' }} />
                            ) : (
                                <button
                                    onClick={() => togglePermission(role, perm)}
                                    disabled={role === 'admin'}
                                    style={{
                                        width: 22, height: 22, borderRadius: 4, border: '1px solid',
                                        borderColor: role === 'admin' ? 'transparent' : (granted ? '#22c55e' : 'var(--border-color)'),
                                        background: granted ? '#22c55e' : 'transparent',
                                        cursor: role === 'admin' ? 'default' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto', opacity: role === 'admin' ? 0.5 : 1,
                                    }}
                                    title={granted ? 'Revoke' : 'Grant'}
                                >
                                    {granted && <FaCheck size={10} style={{ color: '#fff' }} />}
                                    {!granted && <FaTimes size={8} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />}
                                </button>
                            )}
                        </td>
                    );
                }
                rows.push(
                    <tr key={perm}>
                        <td style={{ paddingLeft: '2rem', fontSize: '0.7rem', position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 1 }}>
                            {perm}
                        </td>
                        {permCells}
                    </tr>
                );
            }
        }
    }

    if (loading) {
        return (
            <div className="admin-page">
                <div className="inline-spinner">Loading permissions...</div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <FaUserShield style={{ color: 'var(--primary)' }} /> Permissions
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                        {ROLES.map(role => (
                            <div key={role} style={{ padding: '0.25rem 0.6rem', borderRadius: 6, background: roleColors[role], color: '#fff', fontSize: '0.7rem', fontWeight: 600 }}>
                                {roleLabels[role]}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="admin-card" style={{ padding: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FaLock /> Role-Based Permission Matrix
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input type="text" className="form-input" placeholder="Search permissions..." value={searchPerm} onChange={e => setSearchPerm(e.target.value)} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 200 }} />
                        <button className="admin-btn" onClick={resetPermissions} disabled={savingPerm === 'reset'} style={{ background: 'transparent', borderColor: 'var(--text-muted)', color: 'var(--text-muted)', borderRadius: 5, padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                            {savingPerm === 'reset' ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaUndo />} Reset
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table" style={{ fontSize: '0.75rem' }}>
                        <thead>
                            <tr>
                                <th style={{ minWidth: 140, position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 2 }}>Permission</th>
                                {ROLES.map(role => (
                                    <th key={role} style={{ textAlign: 'center', minWidth: 100, background: roleColors[role], color: '#fff', fontWeight: 600 }}>
                                        <div>{roleLabels[role]}</div>
                                        {role !== 'admin' && (
                                            <div style={{ display: 'flex', gap: '0.2rem', justifyContent: 'center', marginTop: '0.2rem' }}>
                                                <button onClick={() => setAllForRole(role, true)} disabled={savingPerm?.startsWith(`${role}:`)} title="Grant all" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 3, padding: '0.1rem 0.3rem', fontSize: '0.6rem', cursor: 'pointer' }}>All</button>
                                                <button onClick={() => setAllForRole(role, false)} disabled={savingPerm?.startsWith(`${role}:`)} title="Revoke all" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 3, padding: '0.1rem 0.3rem', fontSize: '0.6rem', cursor: 'pointer' }}>None</button>
                                            </div>
                                        )}
                                        {role === 'admin' && (
                                            <div style={{ fontSize: '0.6rem', fontWeight: 400, opacity: 0.8 }}>Full Access</div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows}
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: '0.75rem', padding: '0.4rem 0.6rem', background: 'rgba(27,32,66,0.08)', borderRadius: 6, fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <FaShieldAlt style={{ color: 'var(--primary)' }} />
                    <span>Each permission change saves immediately to the database and is permanent until modified.</span>
                </div>
            </div>

            <div className="admin-card" style={{ padding: '0.8rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FaUsers /> User Role Assignment
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button className="admin-btn" onClick={() => { setLoadingUsers(true); setUserSearch(''); authService.getAllUsers().then(setUsers).catch(() => showToast('Failed to load users — are you logged in as admin?', 'error')).finally(() => setLoadingUsers(false)); }} disabled={loadingUsers} style={{ background: 'transparent', borderColor: 'var(--primary)', color: 'var(--primary)', borderRadius: 5, padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {loadingUsers ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaUsers />} Load Users
                        </button>
                        <input type="text" className="form-input" placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 200 }} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {users.length > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>Available roles:</span>}
                    {ROLES.map(role => {
                        const count = users.filter(u => u.role === role).length;
                        return (
                            <div key={role} style={{ padding: '0.15rem 0.5rem', borderRadius: 4, background: roleColors[role], color: '#fff', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                {roleLabels[role]}
                                <span style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 8, padding: '0.05rem 0.35rem', fontSize: '0.6rem' }}>{count}</span>
                            </div>
                        );
                    })}
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{users.length} total users</span>
                </div>

                {loadingUsers ? (
                    <div className="inline-spinner" style={{ padding: '1.5rem 0' }}>Loading users...</div>
                ) : users.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No users loaded. Click "Load Users" to fetch all users and assign roles.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{ minWidth: 180 }}>User</th>
                                    <th>Email</th>
                                    <th>Username</th>
                                    <th style={{ minWidth: 140 }}>Current Role</th>
                                    <th style={{ minWidth: 140 }}>Change Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.filter(u => {
                                    if (!userSearch.trim()) return true;
                                    const q = userSearch.toLowerCase();
                                    const name = `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.toLowerCase();
                                    return name.includes(q) || u.email.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
                                }).map(u => {
                                    const userName = `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim() || u.username;
                                    return (
                                        <tr key={u.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                                        {u.profile?.avatar ? <img src={u.profile.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FaUserShield size={12} style={{ color: 'var(--text-muted)' }} />}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{userName}</div>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '0.75rem' }}>{u.email}</td>
                                            <td style={{ fontSize: '0.75rem' }}>{u.username}</td>
                                            <td>
                                                <span style={{ padding: '0.15rem 0.5rem', borderRadius: 4, background: roleColors[u.role] || '#666', color: '#fff', fontSize: '0.7rem', fontWeight: 600, display: 'inline-block' }}>
                                                    {roleLabels[u.role] || u.role}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                                    <select
                                                        className="form-input"
                                                        value={u.role}
                                                        onChange={e => assignRole(u.id, e.target.value, userName)}
                                                        disabled={assigningUser === u.id}
                                                        style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', width: 120 }}
                                                    >
                                                        {ROLES.map(r => (
                                                            <option key={r} value={r}>{roleLabels[r]}</option>
                                                        ))}
                                                    </select>
                                                    {assigningUser === u.id && <FaSpinner style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)', fontSize: '0.7rem' }} />}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div style={{ marginTop: '0.75rem', padding: '0.4rem 0.6rem', background: 'rgba(27,32,66,0.08)', borderRadius: 6, fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <FaUsers style={{ color: 'var(--primary)' }} />
                    <span>Select a new role from the dropdown to assign. Changes are saved immediately.</span>
                </div>
            </div>
        </div>
    );
}
