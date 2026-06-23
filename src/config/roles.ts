export const ROLES = {
    ADMIN: 'admin',
    SITE_MANAGER: 'site_manager',
    MANAGER: 'manager',
    EMPLOYEE: 'employee',
    CLIENT: 'client',
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
            { path: '/admin', icon: 'FaChartBar', label: 'Dashboard', roles: [ROLES.ADMIN, ROLES.MANAGING_DIRECTOR, ROLES.FINANCE_DIRECTOR, ROLES.SITE_ENGINEER, ROLES.ENGINEERING_STUDIO, ROLES.CLIENT] },
        ],
    },
    {
        label: 'Operations',
        items: [
            { path: '/admin/projects', icon: 'FaProjectDiagram', label: 'Projects', roles: [ROLES.ADMIN, ROLES.SITE_ENGINEER, ROLES.ENGINEERING_STUDIO, ROLES.CLIENT] },
            { path: '/admin/designs', icon: 'FaDraftingCompass', label: 'Designs', roles: [ROLES.ADMIN, ROLES.SITE_ENGINEER, ROLES.ENGINEERING_STUDIO, ROLES.CLIENT] },
            { path: '/admin/site-activities', icon: 'FaHardHat', label: 'Activities', roles: [ROLES.ADMIN, ROLES.SITE_ENGINEER, ROLES.ENGINEERING_STUDIO] },
            { path: '/admin/material-requests', icon: 'FaTruck', label: 'Material Requests', roles: [ROLES.ADMIN, ROLES.SITE_ENGINEER] },
            { path: '/admin/project-evidence', icon: 'FaCamera', label: 'Project Evidence', roles: [ROLES.ADMIN, ROLES.SITE_ENGINEER] },
            { path: '/admin/approvals', icon: 'FaCheckDouble', label: 'Approvals', roles: [ROLES.ADMIN, ROLES.MANAGING_DIRECTOR] },
            { path: '/admin/partnerships', icon: 'FaHandshake', label: 'Partnerships', roles: [ROLES.ADMIN, ROLES.CLIENT] },
            { path: '/admin/site-rules', icon: 'FaGavel', label: 'Site Rules', roles: [ROLES.ADMIN, ROLES.SITE_ENGINEER, ROLES.ENGINEERING_STUDIO] },
        ],
    },
    {
        label: 'HR',
        items: [
            { path: '/admin/employees', icon: 'FaUserTie', label: 'Employees', roles: [ROLES.ADMIN, ROLES.SITE_ENGINEER, ROLES.MANAGING_DIRECTOR] },
            { path: '/admin/attendance', icon: 'FaClipboardList', label: 'Attendance', roles: [ROLES.ADMIN, ROLES.SITE_ENGINEER, ROLES.MANAGING_DIRECTOR, ROLES.ENGINEERING_STUDIO] },
            { path: '/admin/employee-assignments', icon: 'FaTasks', label: 'Assignments', roles: [ROLES.ADMIN, ROLES.MANAGING_DIRECTOR, ROLES.SITE_ENGINEER] },
            { path: '/admin/payroll', icon: 'FaMoneyBillWave', label: 'Payroll', roles: [ROLES.ADMIN, ROLES.FINANCE_DIRECTOR, ROLES.MANAGING_DIRECTOR] },
            { path: '/admin/contracts', icon: 'FaFileAlt', label: 'Contracts', roles: [ROLES.ADMIN, ROLES.MANAGING_DIRECTOR] },
        ],
    },
    {
        label: 'Finance',
        items: [
            { path: '/admin/incomes', icon: 'FaArrowUp', label: 'Incomes', roles: [ROLES.ADMIN, ROLES.FINANCE_DIRECTOR, ROLES.MANAGING_DIRECTOR] },
            { path: '/admin/expenses', icon: 'FaArrowDown', label: 'Expenses', roles: [ROLES.ADMIN, ROLES.FINANCE_DIRECTOR, ROLES.MANAGING_DIRECTOR] },
            { path: '/admin/reports', icon: 'FaChartPie', label: 'Reports', roles: [ROLES.ADMIN, ROLES.FINANCE_DIRECTOR, ROLES.MANAGING_DIRECTOR] },
        ],
    },
    {
        label: 'Insights',
        items: [
            { path: '/admin/audit-logs', icon: 'FaHistory', label: 'Audit Logs', roles: [ROLES.ADMIN] },
            { path: '/admin/ml-insights', icon: 'FaBrain', label: 'ML Insights', roles: [ROLES.ADMIN] },
        ],
    },
    {
        label: 'Admin',
        items: [
            { path: '/admin/messages', icon: 'FaEnvelope', label: 'Messages', roles: [ROLES.ADMIN, ROLES.SITE_ENGINEER, ROLES.MANAGING_DIRECTOR, ROLES.ENGINEERING_STUDIO, ROLES.CLIENT] },
            { path: '/admin/users', icon: 'FaUsers', label: 'Users', roles: [ROLES.ADMIN] },
            { path: '/admin/permissions', icon: 'FaLock', label: 'Permissions', roles: [ROLES.ADMIN] },
            { path: '/admin/resources', icon: 'FaDatabase', label: 'CMS', roles: [ROLES.ADMIN] },
            { path: '/admin/subscribers', icon: 'FaEnvelope', label: 'Subscribers', roles: [ROLES.ADMIN] },
            { path: '/admin/api-docs', icon: 'FaBook', label: 'API Docs', roles: [ROLES.ADMIN] },
            { path: '/admin/settings', icon: 'FaCog', label: 'Settings', roles: [ROLES.ADMIN] },
        ],
    },
    {
        label: 'Client',
        items: [
            { path: '/admin/project-progress', icon: 'FaImage', label: 'Project Progress', roles: [ROLES.CLIENT] },
        ],
    },
];

export const ROLE_PATH_MAP: Record<string, string> = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.MANAGING_DIRECTOR]: '/admin',
  [ROLES.FINANCE_DIRECTOR]: '/admin',
  [ROLES.SITE_ENGINEER]: '/admin',
  [ROLES.ENGINEERING_STUDIO]: '/admin',
  [ROLES.CLIENT]: '/client',
};

export function getRolePath(role: string): string {
  return ROLE_PATH_MAP[role] || '/admin';
}

export function canAccess(path: string, role: string): boolean {
    const normalizedPath = path.replace(/^\/(admin|manager|site-manager|employee|client)/, '/admin').split('?')[0];
    for (const section of SIDEBAR_SECTIONS) {
        for (const item of section.items) {
            if (item.path.split('?')[0] === normalizedPath) {
                return item.roles.includes(role as Role);
            }
        }
    }
    return true;
}
