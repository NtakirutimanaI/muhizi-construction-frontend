export const ROLES = {
    ADMIN: 'admin',
    SITE_MANAGER: 'site_manager',
    MANAGER: 'manager',
    EMPLOYEE: 'employee',
    CLIENT: 'client',
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
            { path: '/admin', icon: 'FaChartBar', label: 'Dashboard', roles: [ROLES.ADMIN, ROLES.SITE_MANAGER, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.CLIENT] },
        ],
    },
    {
        label: 'Content',
        items: [
            { path: '/admin/resources', icon: 'FaDatabase', label: 'CMS', roles: [ROLES.ADMIN] },
        ],
    },
    {
        label: 'Operations',
        items: [
            { path: '/admin/projects', icon: 'FaProjectDiagram', label: 'Projects', roles: [ROLES.ADMIN, ROLES.SITE_MANAGER, ROLES.CLIENT, ROLES.EMPLOYEE] },
            { path: '/admin/designs', icon: 'FaDraftingCompass', label: 'Designs', roles: [ROLES.ADMIN, ROLES.SITE_MANAGER, ROLES.CLIENT] },
            { path: '/admin/site-activities', icon: 'FaHardHat', label: 'Activities', roles: [ROLES.ADMIN, ROLES.SITE_MANAGER, ROLES.EMPLOYEE] },
            { path: '/admin/material-requests', icon: 'FaTruck', label: 'Material Requests', roles: [ROLES.ADMIN, ROLES.SITE_MANAGER] },
            { path: '/admin/project-evidence', icon: 'FaCamera', label: 'Project Evidence', roles: [ROLES.ADMIN, ROLES.SITE_MANAGER] },
            { path: '/admin/approvals', icon: 'FaCheckDouble', label: 'Approvals', roles: [ROLES.ADMIN, ROLES.MANAGER] },
            { path: '/admin/partnerships', icon: 'FaHandshake', label: 'Partnerships', roles: [ROLES.ADMIN, ROLES.CLIENT] },
            { path: '/admin/site-rules', icon: 'FaGavel', label: 'Site Rules', roles: [ROLES.ADMIN, ROLES.SITE_MANAGER, ROLES.EMPLOYEE] },
        ],
    },
    {
        label: 'HR',
        items: [
            { path: '/admin/employees', icon: 'FaUserTie', label: 'Employees', roles: [ROLES.ADMIN, ROLES.SITE_MANAGER, ROLES.MANAGER] },
            { path: '/admin/attendance', icon: 'FaClipboardList', label: 'Attendance', roles: [ROLES.ADMIN, ROLES.SITE_MANAGER, ROLES.MANAGER, ROLES.EMPLOYEE] },
            { path: '/admin/employee-assignments', icon: 'FaTasks', label: 'Assignments', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.SITE_MANAGER] },
            { path: '/admin/salary-history', icon: 'FaHistory', label: 'Salary History', roles: [ROLES.EMPLOYEE] },
            { path: '/admin/payroll', icon: 'FaMoneyBillWave', label: 'Payroll', roles: [ROLES.ADMIN, ROLES.MANAGER] },
            { path: '/admin/contracts', icon: 'FaFileAlt', label: 'Contracts', roles: [ROLES.ADMIN, ROLES.MANAGER] },
        ],
    },
    {
        label: 'Finance',
        items: [
            { path: '/admin/incomes', icon: 'FaArrowUp', label: 'Incomes', roles: [ROLES.ADMIN, ROLES.MANAGER] },
            { path: '/admin/expenses', icon: 'FaArrowDown', label: 'Expenses', roles: [ROLES.ADMIN, ROLES.MANAGER] },
            { path: '/admin/reports', icon: 'FaChartPie', label: 'Reports', roles: [ROLES.ADMIN, ROLES.SITE_MANAGER, ROLES.MANAGER] },
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
            { path: '/admin/messages', icon: 'FaEnvelope', label: 'Messages', roles: [ROLES.ADMIN, ROLES.SITE_MANAGER, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.CLIENT] },
            { path: '/admin/users', icon: 'FaUsers', label: 'Users', roles: [ROLES.ADMIN] },
            { path: '/admin/permissions', icon: 'FaLock', label: 'Permissions', roles: [ROLES.ADMIN] },
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
  [ROLES.MANAGER]: '/manager',
  [ROLES.SITE_MANAGER]: '/site-manager',
  [ROLES.EMPLOYEE]: '/employee',
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
