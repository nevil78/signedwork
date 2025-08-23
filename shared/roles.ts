// Company sub-roles and permissions system
export const COMPANY_ROLES = {
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  MANAGER: 'MANAGER',
  BRANCH_ADMIN: 'BRANCH_ADMIN', // Prepared for future use
} as const;

export type CompanyRole = typeof COMPANY_ROLES[keyof typeof COMPANY_ROLES];

// Company permissions map for server-side access control (updated to match requirements)
export const COMPANY_PERMISSIONS = {
  [COMPANY_ROLES.COMPANY_ADMIN]: [
    'work.approve.any',
    'employee.manage',
    'manager.manage',
    'settings.read',
    'settings.write',
    'reports.view'
  ],
  [COMPANY_ROLES.MANAGER]: [
    'work.approve.directReports',
    'reports.view.team'
  ],
  [COMPANY_ROLES.BRANCH_ADMIN]: [
    'work.approve.directReports',
    'reports.view.team',
    'settings.read'
  ]
} as const;

// Legacy alias for backwards compatibility
export const ROLE_PERMISSIONS = COMPANY_PERMISSIONS;

// Route access mapping
export const ROUTE_PERMISSIONS = {
  '/company/admin/*': [COMPANY_ROLES.COMPANY_ADMIN],
  '/company/manager/*': [COMPANY_ROLES.MANAGER, COMPANY_ROLES.COMPANY_ADMIN],
  '/company/branch/*': [COMPANY_ROLES.BRANCH_ADMIN, COMPANY_ROLES.COMPANY_ADMIN], // Future use
} as const;

// Define permission types for better type safety
export type CompanyPermission = 
  | 'work.approve.any'
  | 'work.approve.directReports'
  | 'employee.manage'
  | 'manager.manage'
  | 'settings.read'
  | 'settings.write'
  | 'reports.view'
  | 'reports.view.team';

// Helper functions for permission checking
export function hasCompanyPermission(role: CompanyRole, permission: CompanyPermission): boolean {
  const rolePermissions = COMPANY_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
}

// Legacy function for backwards compatibility
export function hasPermission(role: CompanyRole, permission: string): boolean {
  const rolePermissions = COMPANY_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission as CompanyPermission);
}

// Get all permissions for a role
export function getCompanyPermissions(role: CompanyRole): readonly CompanyPermission[] {
  return COMPANY_PERMISSIONS[role] || [];
}

export function canAccessRoute(role: CompanyRole, route: string): boolean {
  for (const [routePattern, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    const pattern = routePattern.replace('*', '.*');
    if (new RegExp(pattern).test(route)) {
      return (allowedRoles as readonly CompanyRole[]).includes(role);
    }
  }
  return false;
}

// Usage examples for permission checking:
// if (hasCompanyPermission(userRole, 'work.approve.any')) { /* Allow */ }
// if (hasCompanyPermission(userRole, 'reports.view.team')) { /* Allow */ }

// Database-backed role provider (Step 2 implementation)
export async function getCompanyRole(companyId: string, storage: any): Promise<CompanyRole> {
  try {
    const company = await storage.getCompany(companyId);
    if (company && company.companySubRole) {
      return company.companySubRole as CompanyRole;
    }
    
    // Fallback to COMPANY_ADMIN for existing companies without role set
    return COMPANY_ROLES.COMPANY_ADMIN;
  } catch (error) {
    console.error('Error fetching company role from database:', error);
    return COMPANY_ROLES.COMPANY_ADMIN;
  }
}

// DEPRECATED: Temporary role provider for development (replaced by database lookup)
export function getTemporaryRole(email: string): CompanyRole {
  console.warn('getTemporaryRole is deprecated. Use getCompanyRole with database lookup instead.');
  
  // Development role mapping - kept for backwards compatibility only
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
  
  // Default to COMPANY_ADMIN for development
  return COMPANY_ROLES.COMPANY_ADMIN;
}