// Company sub-roles and permissions system
export const COMPANY_ROLES = {
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  MANAGER: 'MANAGER',
  BRANCH_ADMIN: 'BRANCH_ADMIN', // Prepared for future use
} as const;

export type CompanyRole = typeof COMPANY_ROLES[keyof typeof COMPANY_ROLES];

// Permissions map for role-based access control
export const ROLE_PERMISSIONS = {
  [COMPANY_ROLES.COMPANY_ADMIN]: [
    'work.approve.any',
    'employee.manage',
    'manager.manage',
    'settings.read',
    'settings.write',
    'reports.view',
    'company.admin',
    'billing.manage',
    'integrations.manage'
  ],
  [COMPANY_ROLES.MANAGER]: [
    'work.approve.directReports',
    'reports.view.team',
    'team.manage',
    'approvals.pending'
  ],
  [COMPANY_ROLES.BRANCH_ADMIN]: [
    'work.approve.branch',
    'employee.manage.branch',
    'reports.view.branch',
    'settings.read'
  ]
} as const;

// Route access mapping
export const ROUTE_PERMISSIONS = {
  '/company/admin/*': [COMPANY_ROLES.COMPANY_ADMIN],
  '/company/manager/*': [COMPANY_ROLES.MANAGER, COMPANY_ROLES.COMPANY_ADMIN],
  '/company/branch/*': [COMPANY_ROLES.BRANCH_ADMIN, COMPANY_ROLES.COMPANY_ADMIN], // Future use
} as const;

// Helper functions for permission checking
export function hasPermission(role: CompanyRole, permission: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission as any);
}

export function canAccessRoute(role: CompanyRole, route: string): boolean {
  for (const [routePattern, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    const pattern = routePattern.replace('*', '.*');
    if (new RegExp(pattern).test(route)) {
      return allowedRoles.includes(role);
    }
  }
  return false;
}

// Temporary role provider for development (will be replaced with DB in Step 2)
export function getTemporaryRole(email: string): CompanyRole {
  // Development role mapping - replace with DB lookup later
  const adminEmails = [
    'admin@company.com',
    'ceo@company.com',
    'arham@gmail.com', // Current test account
  ];
  
  const managerEmails = [
    'manager@company.com',
    'supervisor@company.com',
    'team.lead@company.com',
  ];
  
  if (adminEmails.includes(email.toLowerCase())) {
    return COMPANY_ROLES.COMPANY_ADMIN;
  }
  
  if (managerEmails.includes(email.toLowerCase())) {
    return COMPANY_ROLES.MANAGER;
  }
  
  // Default to COMPANY_ADMIN for now during development
  return COMPANY_ROLES.COMPANY_ADMIN;
}