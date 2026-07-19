export const ROLES = {
    ADMIN: 'admin',
    SITE_MANAGER: 'site_manager',
    MANAGER: 'manager',
    EMPLOYEE: 'employee',
    CLIENT: 'client',
    PARTNER: 'partner',
    MANAGING_DIRECTOR: 'managing_director',
    FINANCE_DIRECTOR: 'finance_director',
    SITE_ENGINEER: 'site_engineer',
    ENGINEERING_STUDIO: 'engineering_studio',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface SidebarItem {
    path: string;
    icon: string;
    label: string;
    roles: Role[];
}

export interface SidebarSection {
    label: string;
    items: SidebarItem[];
}

export const SIDEBAR_SECTIONS: SidebarSection[] = [
    {
        label: 'Main',
        items: [
            { path: '/admin', icon: 'FaChartBar', label: 'Dashboard', roles: [ROLES.ADMIN, ROLES.SITE_MANAGER, ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.MANAGING_DIRECTOR, ROLES.FINANCE_DIRECTOR, ROLES.SITE_ENGINEER, ROLES.ENGINEERING_STUDIO, ROLES.PARTNER] },
        ],
    },
    {
        label: 'Operations',
        items: [
            { path: '/admin/sites', icon: 'FaProjectDiagram', label: 'Sites', roles: [ROLES.ADMIN, ROLES.SITE_MANAGER, ROLES.MANAGER, ROLES.SITE_ENGINEER, ROLES.FINANCE_DIRECTOR, ROLES.ENGINEERING_STUDIO, ROLES.PARTNER, ROLES.MANAGING_DIRECTOR] },

            { path: '/admin/requests', icon: 'FaClipboardList', label: 'Requests & Approvals', roles: [ROLES.ADMIN, ROLES.MANAGING_DIRECTOR, ROLES.SITE_ENGINEER] },
            { path: '/admin/engineering-submissions', icon: 'FaDraftingCompass', label: 'Engineering Submissions', roles: [ROLES.ADMIN, ROLES.MANAGING_DIRECTOR, ROLES.ENGINEERING_STUDIO] },
            { path: '/admin/daily-reports', icon: 'FaClipboardCheck', label: 'Daily Reports', roles: [ROLES.ADMIN] },
            { path: '/admin/partnerships', icon: 'FaHandshake', label: 'Partnerships', roles: [ROLES.ADMIN, ROLES.MANAGER] },
            // Site safety/operating rules apply to everyone on the platform, not just operations roles.
            { path: '/admin/site-rules', icon: 'FaGavel', label: 'Site Rules', roles: [ROLES.ADMIN, ROLES.SITE_MANAGER, ROLES.MANAGER, ROLES.SITE_ENGINEER, ROLES.ENGINEERING_STUDIO, ROLES.MANAGING_DIRECTOR, ROLES.FINANCE_DIRECTOR, ROLES.EMPLOYEE, ROLES.CLIENT, ROLES.PARTNER] },
        ],
    },
    {
        label: 'HR',
        items: [
            // Admin's HR view is intentionally limited to the employee registry itself
            // (who they are, what they're paid) — day-to-day attendance, payroll runs, and
            // contracts are operational detail owned by Site Engineer / Finance Director.
            // Managing Director does not have an HR role in this org — they own Operations
            // (stock, material requests, engineering-submission review, site oversight).
            // Finance Director's Employees view is the single source of truth for hiring —
            // full profile, documents/CV, and contracts all live on the employee record
            // itself (see Employees.tsx), so there's no separate Contracts nav item and no
            // day-to-day Attendance clutter (that's an operational concern, not Finance's).
            { path: '/admin/employees', icon: 'FaUserTie', label: 'Employees', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.SITE_ENGINEER, ROLES.FINANCE_DIRECTOR] },
            { path: '/admin/attendance', icon: 'FaClipboardList', label: 'Attendance', roles: [ROLES.SITE_MANAGER, ROLES.MANAGER, ROLES.SITE_ENGINEER, ROLES.ENGINEERING_STUDIO] },
            { path: '/admin/payroll', icon: 'FaMoneyBillWave', label: 'Payroll', roles: [ROLES.FINANCE_DIRECTOR] },
        ],
    },
    {
        label: 'Finance',
        items: [
            { path: '/admin/incomes', icon: 'FaArrowUp', label: 'Incomes', roles: [ROLES.ADMIN, ROLES.FINANCE_DIRECTOR, ROLES.MANAGING_DIRECTOR] },
            { path: '/admin/expenses', icon: 'FaArrowDown', label: 'Expenses', roles: [ROLES.ADMIN, ROLES.FINANCE_DIRECTOR, ROLES.MANAGING_DIRECTOR] },
            { path: '/admin/stock/in', icon: 'FaBoxes', label: 'Stock', roles: [ROLES.FINANCE_DIRECTOR, ROLES.MANAGING_DIRECTOR] },
            { path: '/admin/reports', icon: 'FaChartPie', label: 'Reports', roles: [ROLES.ADMIN, ROLES.FINANCE_DIRECTOR, ROLES.MANAGING_DIRECTOR] },
        ],
    },
    {
        label: 'Admin',
        items: [
            { path: '/admin/messages', icon: 'FaEnvelope', label: 'Messages', roles: [ROLES.ADMIN, ROLES.SITE_MANAGER, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.SITE_ENGINEER, ROLES.MANAGING_DIRECTOR, ROLES.ENGINEERING_STUDIO] },
            { path: '/admin/users', icon: 'FaUsers', label: 'Users', roles: [ROLES.ADMIN] },
            { path: '/admin/resources', icon: 'FaDatabase', label: 'CMS', roles: [ROLES.ADMIN] },
            { path: '/admin/subscribers', icon: 'FaEnvelope', label: 'Subscribers', roles: [ROLES.ADMIN] },
            { path: '/admin/settings', icon: 'FaCog', label: 'Settings', roles: [ROLES.ADMIN] },
        ],
    },
    {
        label: 'Partner',
        items: [
            { path: '/admin/project-progress', icon: 'FaImage', label: 'Project Progress', roles: [ROLES.PARTNER] },
            { path: '/admin/updates', icon: 'FaClipboardList', label: 'Updates', roles: [ROLES.PARTNER] },
        ],
    },
    {
        label: 'Client',
        items: [
            { path: '/admin/profile', icon: 'FaUser', label: 'My Profile', roles: [ROLES.CLIENT] },
            { path: '/admin/sites', icon: 'FaImage', label: 'Sites', roles: [ROLES.CLIENT] },
            { path: '/admin/updates', icon: 'FaClipboardList', label: 'Updates', roles: [ROLES.CLIENT] },
        ],
    },
];

export const ROLE_PATH_MAP: Record<string, string> = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.SITE_MANAGER]: '/sitemanager',
  [ROLES.MANAGER]: '/manager',
  [ROLES.EMPLOYEE]: '/employee',
  [ROLES.MANAGING_DIRECTOR]: '/managingdirector',
  [ROLES.FINANCE_DIRECTOR]: '/directorfinance',
  [ROLES.SITE_ENGINEER]: '/siteengineer',
  [ROLES.ENGINEERING_STUDIO]: '/engineeringstudio',
  [ROLES.CLIENT]: '/client-panel',
  [ROLES.PARTNER]: '/partner',
};

export const ROLE_AREA_TITLE: Record<string, string> = {
  [ROLES.ADMIN]: 'Administrator Area',
  [ROLES.SITE_MANAGER]: 'Site Manager Area',
  [ROLES.MANAGER]: 'Manager Area',
  [ROLES.EMPLOYEE]: 'Employee Area',
  [ROLES.MANAGING_DIRECTOR]: 'CEO Area',
  [ROLES.FINANCE_DIRECTOR]: 'Finance Director Area',
  [ROLES.SITE_ENGINEER]: 'Site Engineer Area',
  [ROLES.ENGINEERING_STUDIO]: 'Engineering Studio Area',
  [ROLES.CLIENT]: 'My Area',
  [ROLES.PARTNER]: 'Partner Area',
};

export const ROLE_AREA_BG: Record<string, string> = {
  [ROLES.ADMIN]: 'linear-gradient(135deg, #1a1a2e, #16213e)',
  [ROLES.SITE_MANAGER]: 'linear-gradient(135deg, #1B2042, #2a3a6a)',
  [ROLES.MANAGER]: 'linear-gradient(135deg, #0f3443, #34e89e)',
  [ROLES.EMPLOYEE]: 'linear-gradient(135deg, #2c3e50, #3498db)',
  [ROLES.MANAGING_DIRECTOR]: 'linear-gradient(135deg, #4a0e4e, #801336)',
  [ROLES.FINANCE_DIRECTOR]: 'linear-gradient(135deg, #1B2042, #2a2f5e)',
  [ROLES.SITE_ENGINEER]: 'linear-gradient(135deg, #e67e22, #f39c12)',
  [ROLES.ENGINEERING_STUDIO]: 'linear-gradient(135deg, #8e44ad, #9b59b6)',
  [ROLES.CLIENT]: 'linear-gradient(135deg, #6c3096, #b84c8c)',
  [ROLES.PARTNER]: 'linear-gradient(135deg, #0d4f3c, #1a8a6a)',
};

export function getRolePath(role: string): string {
  return ROLE_PATH_MAP[role] || '/admin';
}

export function canAccess(path: string, role: string): boolean {
    const normalizedPath = path.replace(/^\/(admin|manager|sitemanager|site-manager|employee|partner|client-panel|managingdirector|directorfinance|siteengineer|engineeringstudio)/, '/admin').split('?')[0];
    for (const section of SIDEBAR_SECTIONS) {
        for (const item of section.items) {
            if (item.path.split('?')[0] === normalizedPath) {
                return item.roles.includes(role as Role);
            }
        }
    }
    return true;
}
