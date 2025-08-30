import { 
  employees, companies, experiences, educations, certifications, projects, endorsements, workEntries, employeeCompanies,
  companyInvitationCodes, companyEmployees, companyBranches, companyTeams, teamMembers, companyManagers, managerPermissions, jobListings, jobApplications, savedJobs, jobAlerts, profileViews, admins, emailVerifications, userFeedback, loginSessions,
  skills, skillTrends, userSkillPreferences, skillAnalytics, pendingUsers,
  recruiterProfiles, candidatePipelines, candidateInteractions, recruitmentAnalytics, savedSearches,
  type Employee, type Company, type InsertEmployee, type InsertCompany,
  type Experience, type Education, type Certification, type Project, type Endorsement, type WorkEntry, type EmployeeCompany,
  type InsertExperience, type InsertEducation, type InsertCertification, 
  type InsertProject, type InsertEndorsement, type InsertWorkEntry, type InsertEmployeeCompany,
  type CompanyInvitationCode, type CompanyEmployee, type InsertCompanyInvitationCode, type InsertCompanyEmployee,
  type TeamMember, type InsertTeamMember,
  type CompanyBranch, type CompanyTeam, type InsertCompanyBranch, type InsertCompanyTeam,
  type CompanyManager, type ManagerPermission, type InsertCompanyManager, type InsertManagerPermission,
  type JobListing, type JobApplication, type SavedJob, type JobAlert, type ProfileView,
  type InsertJobListing, type InsertJobApplication, type InsertSavedJob, type InsertJobAlert,
  type Admin, type InsertAdmin, type LoginSession, type InsertLoginSession,
  type Skill, type SkillTrend, type UserSkillPreference, type SkillAnalytic,
  type InsertSkill, type InsertSkillTrend, type InsertUserSkillPreference, type InsertSkillAnalytic,
  type PendingUser, type InsertPendingUser,
  type UserFeedback, type InsertFeedback,
  type RecruiterProfile, type CandidatePipeline, type CandidateInteraction, type RecruitmentAnalytic, type SavedSearch,
  type InsertRecruiterProfile, type InsertCandidatePipeline, type InsertCandidateInteraction, type InsertRecruitmentAnalytic, type InsertSavedSearch
} from "@shared/schema";

type EmailVerification = typeof emailVerifications.$inferSelect;
type InsertEmailVerification = typeof emailVerifications.$inferInsert;
import { db } from "./db";
import { eq, and, sql, desc, asc, inArray, count, like, or, getTableColumns, lt, ilike, isNotNull, isNull } from "drizzle-orm";
import bcrypt from "bcrypt";

// Generate a short, memorable employee ID
function generateEmployeeId(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  // Format: EMP-ABC123 (3 letters + 3 numbers)
  let result = 'EMP-';
  
  // Add 3 random letters
  for (let i = 0; i < 3; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // Add 3 random numbers
  for (let i = 0; i < 3; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return result;
}

// Generate a short, memorable company ID
function generateCompanyId(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  // Format: CMP-ABC123 (3 letters + 3 numbers)
  let result = 'CMP-';
  
  // Add 3 random letters
  for (let i = 0; i < 3; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // Add 3 random numbers
  for (let i = 0; i < 3; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return result;
}

// Generate a unique invitation code
function generateInvitationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  // Generate 8-character code
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

// Generate unique manager ID based on company name (JNM123 format)
function generateManagerUniqueId(companyName: string): string {
  // Extract consonants from company name
  const consonants = companyName.match(/[bcdfghjklmnpqrstvwxyz]/gi) || ['X', 'Y', 'Z'];
  
  // Take first 3 consonants (or pad with X, Y, Z if needed)
  const prefix = consonants.slice(0, 3).join('').toUpperCase().padEnd(3, 'XYZ'[consonants.length % 3]);
  
  // Generate 3 random numbers
  const suffix = Math.floor(100 + Math.random() * 900);
  
  return prefix + suffix; // "JNM123"
}

// Generate a short, memorable admin ID
function generateAdminId(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  // Format: ADM-ABC123 (3 letters + 3 numbers)
  let result = 'ADM-';
  
  // Add 3 random letters
  for (let i = 0; i < 3; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // Add 3 random numbers
  for (let i = 0; i < 3; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return result;
}

// Generate a short, memorable branch ID
function generateBranchId(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  // Format: BRN-ABC123 (3 letters + 3 numbers)
  let result = 'BRN-';
  
  // Add 3 random letters
  for (let i = 0; i < 3; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // Add 3 random numbers
  for (let i = 0; i < 3; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return result;
}

// Generate a short, memorable team ID
function generateTeamId(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  // Format: TM-ABC123 (3 letters + 3 numbers)
  let result = 'TM-';
  
  // Add 3 random letters
  for (let i = 0; i < 2; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // Add 4 random numbers
  for (let i = 0; i < 4; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return result;
}

export interface IStorage {
  // Employee operations
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeById(id: string): Promise<Employee | undefined>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  createEmployeeWithHashedPassword(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, data: Partial<Employee>): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;
  getEmployeeBackupData(id: string): Promise<any>;
  
  // Company operations
  getCompany(id: string): Promise<Company | undefined>;
  getCompanyById(id: string): Promise<Company | undefined>;
  getCompanyByEmail(email: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  createCompanyWithHashedPassword(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, data: Partial<Company>): Promise<Company>;
  deleteCompany(id: string): Promise<void>;
  getCompanyBackupData(id: string): Promise<any>;
  
  // Authentication
  authenticateEmployee(email: string, password: string): Promise<Employee | null>;
  authenticateCompany(email: string, password: string): Promise<Company | null>;
  
  // Password management
  changeEmployeePassword(employeeId: string, currentPassword: string, newPassword: string): Promise<boolean>;
  changeCompanyPassword(companyId: string, currentPassword: string, newPassword: string): Promise<boolean>;
  
  // Employee Profile Data
  getEmployeeProfile(employeeId: string): Promise<{
    experiences: Experience[];
    educations: Education[];
    certifications: Certification[];
    projects: Project[];
    endorsements: Endorsement[];
  }>;
  
  // Experience operations
  getExperience(id: string): Promise<Experience | undefined>;
  createExperience(experience: InsertExperience): Promise<Experience>;
  updateExperience(id: string, data: Partial<Experience>): Promise<Experience>;
  deleteExperience(id: string): Promise<void>;
  
  // Education operations
  getEducation(id: string): Promise<Education | undefined>;
  createEducation(education: InsertEducation): Promise<Education>;
  updateEducation(id: string, data: Partial<Education>): Promise<Education>;
  deleteEducation(id: string): Promise<void>;
  
  // Certification operations
  getCertification(id: string): Promise<Certification | undefined>;
  createCertification(certification: InsertCertification): Promise<Certification>;
  updateCertification(id: string, data: Partial<Certification>): Promise<Certification>;
  deleteCertification(id: string): Promise<void>;
  
  // Project operations
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, data: Partial<Project>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Endorsement operations
  getEndorsement(id: string): Promise<Endorsement | undefined>;
  createEndorsement(endorsement: InsertEndorsement): Promise<Endorsement>;
  deleteEndorsement(id: string): Promise<void>;
  
  // Employee Company operations
  getEmployeeCompanies(employeeId: string): Promise<EmployeeCompany[]>;
  createEmployeeCompany(company: InsertEmployeeCompany): Promise<EmployeeCompany>;
  updateEmployeeCompany(id: string, data: Partial<EmployeeCompany>): Promise<EmployeeCompany>;
  deleteEmployeeCompany(id: string): Promise<void>;
  
  // Work entry operations
  getWorkEntries(employeeId: string, companyId?: string): Promise<WorkEntry[]>;
  getWorkEntry(id: string): Promise<WorkEntry | undefined>;
  createWorkEntry(workEntry: InsertWorkEntry): Promise<WorkEntry>;
  updateWorkEntry(id: string, data: Partial<WorkEntry>): Promise<WorkEntry>;
  deleteWorkEntry(id: string): Promise<void>;
  getWorkEntriesForManager(managerId: string): Promise<any[]>;
  approveWorkEntryAsCompany(workEntryId: string, companyId: string, data: { rating?: number; feedback?: string; approvedBy: string }): Promise<WorkEntry>;
  approveWorkEntryAsManager(workEntryId: string, managerId: string, data: { rating?: number; feedback?: string }): Promise<WorkEntry>;
  
  // Company invitation operations
  generateInvitationCode(companyId: string): Promise<CompanyInvitationCode>;
  validateInvitationCode(code: string): Promise<CompanyInvitationCode | null>;
  useInvitationCode(code: string, employeeId: string): Promise<CompanyEmployee>;
  
  // Company employees operations
  getCompanyEmployees(companyId: string): Promise<CompanyEmployee[]>;
  getCompanyEmployeesPaginated(companyId: string, options: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: string;
    department?: string;
  }): Promise<{
    employees: CompanyEmployee[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }>;
  getEmployeeCompaniesNew(employeeId: string): Promise<CompanyEmployee[]>;
  
  // Job discovery operations
  searchJobs(filters: JobSearchFilters): Promise<JobListing[]>;
  getJobById(id: string): Promise<JobListing | undefined>;
  createJobListing(job: InsertJobListing): Promise<JobListing>;
  updateJobListing(id: string, data: Partial<JobListing>): Promise<JobListing>;
  deleteJobListing(id: string): Promise<void>;
  
  // Job application operations  
  getJobApplications(employeeId: string): Promise<JobApplication[]>;
  getJobApplicationsForJob(jobId: string): Promise<JobApplication[]>;
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  updateJobApplicationStatus(id: string, updates: { status?: string; companyNotes?: string; interviewNotes?: string }): Promise<JobApplication>;
  
  // Company recruiter operations
  getCompanyJobApplications(companyId: string): Promise<JobApplication[]>;
  getJobApplicationWithEmployee(applicationId: string): Promise<JobApplication | null>;
  
  // Saved jobs operations
  getSavedJobs(employeeId: string): Promise<SavedJob[]>;
  saveJob(data: InsertSavedJob): Promise<SavedJob>;
  unsaveJob(employeeId: string, jobId: string): Promise<void>;
  
  // Job alerts operations
  getJobAlerts(employeeId: string): Promise<JobAlert[]>;
  createJobAlert(alert: InsertJobAlert): Promise<JobAlert>;
  updateJobAlert(id: string, data: Partial<JobAlert>): Promise<JobAlert>;
  deleteJobAlert(id: string): Promise<void>;
  
  // Profile views operations
  recordProfileView(viewerCompanyId: string, viewedEmployeeId: string, context: string): Promise<ProfileView>;
  getProfileViews(employeeId: string): Promise<ProfileView[]>;
  
  // Employee Summary Dashboard
  getEmployeeSummaryDashboard(employeeId: string): Promise<{
    quickStats: {
      totalCompaniesWorked: number;
      totalApplicationsMade: number;
      totalWorkSummaries: number;
      totalLogins: number;
    };
    careerSummary: {
      currentCompany: { name: string; joinedAt: Date; position?: string } | null;
      pastCompanies: { name: string; joinedAt: Date; leftAt: Date; position?: string }[];
      totalCompanies: number;
    };
    applicationsSummary: {
      total: number;
      pending: number;
      shortlisted: number;
      interviewed: number;
      offered: number;
      rejected: number;
      recent: { jobTitle: string; companyName: string; status: string; appliedAt: Date }[];
    };
    workActivitySummary: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      recent: { title: string; companyName: string; status: string; createdAt: Date }[];
    };
    loginHistory: {
      total: number;
      recent: { loginAt: Date; deviceType?: string; location?: string }[];
    };
  }>;
  
  // Company employee access with privacy controls
  getEmployeeCompanyRelation(employeeId: string, companyId: string): Promise<CompanyEmployee | null>;
  getWorkEntriesForEmployeeAndCompany(employeeId: string, companyId: string): Promise<WorkEntry[]>;
  
  // Admin operations
  getAdmin(id: string): Promise<Admin | undefined>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  checkAdminExists(): Promise<boolean>;
  updateAdmin(id: string, data: Partial<Admin>): Promise<Admin>;
  authenticateAdmin(username: string, password: string): Promise<Admin | null>;
  updateAdminLastLogin(id: string): Promise<void>;
  
  // Admin management operations
  getAllEmployees(): Promise<Employee[]>;
  getAllCompanies(): Promise<Company[]>;
  getEmployeeCount(): Promise<number>;
  getCompanyCount(): Promise<number>;
  getJobListingCount(): Promise<number>;
  getActiveJobCount(): Promise<number>;
  getAdminCount(): Promise<number>;
  deactivateEmployee(employeeId: string): Promise<void>;
  activateEmployee(employeeId: string): Promise<void>;
  deactivateCompany(companyId: string): Promise<void>;
  activateCompany(companyId: string): Promise<void>;
  
  // Enhanced admin employee-company management
  getEmployeeWithCompanyHistory(employeeId: string): Promise<{
    employee: Employee;
    companyHistory: CompanyEmployee[];
    currentCompany: Company | null;
  }>;
  getCompanyWithEmployeeHistory(companyId: string): Promise<{
    company: Company;
    currentEmployees: (CompanyEmployee & { employee: Employee })[];
    pastEmployees: (CompanyEmployee & { employee: Employee })[];
    totalEmployeesCount: number;
  }>;
  getAllEmployeesWithCurrentCompany(): Promise<(Employee & {
    currentCompany?: Company;
    currentPosition?: string;
    currentStatus?: string;
  })[]>;
  getAllCompaniesWithEmployeeCounts(): Promise<(Company & {
    currentEmployeesCount: number;
    totalEmployeesCount: number;
  })[]>;
  transferEmployeeBetweenCompanies(employeeId: string, fromCompanyId: string, toCompanyId: string, newPosition?: string): Promise<void>;
  updateEmployeeCompanyRelationship(relationshipId: string, updates: Partial<CompanyEmployee>): Promise<CompanyEmployee>;
  getEmployeeCareerReport(employeeId: string): Promise<{
    employee: Employee;
    totalTenure: number; // in days
    companiesWorked: number;
    longestTenure: { company: Company; days: number };
    currentPosition: string | null;
    careerHistory: (CompanyEmployee & { company: Company })[];
  }>;
  getCompanyEmployeeReport(companyId: string): Promise<{
    company: Company;
    currentEmployees: (CompanyEmployee & { employee: Employee })[];
    exEmployees: (CompanyEmployee & { employee: Employee })[];
    averageTenure: number; // in days
    longestTenuredEmployee: { employee: Employee; days: number } | null;
    departmentCounts: Record<string, number>;
  }>;
  
  // Email verification operations
  createEmailVerification(data: InsertEmailVerification): Promise<EmailVerification>;
  getEmailVerification(email: string, otpCode: string, purpose: string): Promise<EmailVerification | undefined>;
  markEmailVerificationUsed(id: string): Promise<void>;
  cleanupExpiredVerifications(): Promise<void>;
  updateUserPassword(userId: string, userType: 'employee' | 'company', hashedPassword: string): Promise<void>;
  getEmployeeById(id: string): Promise<Employee | undefined>;
  getCompanyById(id: string): Promise<Company | undefined>;
  updateEmployeeProfilePicture(id: string, profilePictureURL: string): Promise<void>;
  markCompanyEmailVerified(id: string): Promise<void>;
  
  // Company verification operations
  updateCompanyVerificationStatus(companyId: string, data: {
    verificationStatus: string;
    verificationMethod?: string;
    verificationNotes?: string;
    rejectionReason?: string;
  }): Promise<void>;
  getPendingVerifications(): Promise<Company[]>;
  updateVerificationStatus(id: string, status: string, notes?: string, rejectionReason?: string): Promise<void>;
  
  // CIN verification operations
  getCompaniesByCINVerificationStatus(status: string): Promise<Company[]>;
  updateCompanyCINVerification(companyId: string, data: {
    cinVerificationStatus: string;
    cinVerifiedAt: Date;
    cinVerifiedBy: string;
    isBasicDetailsLocked: boolean;
    verificationNotes?: string;
  }): Promise<Company>;
  
  // PAN verification methods
  getCompaniesByPANVerificationStatus(status: string): Promise<Company[]>;
  updateCompanyPANVerification(companyId: string, data: {
    panVerificationStatus: string;
    panVerifiedAt: Date;
    panVerifiedBy: string;
    isBasicDetailsLocked: boolean;
    verificationNotes?: string;
  }): Promise<Company>;
  
  // GST verification methods
  getCompaniesByGSTVerificationStatus(status: string): Promise<Company[]>;
  updateCompanyGSTVerification(companyId: string, data: {
    gstVerificationStatus: string;
    gstVerifiedAt: Date;
    gstVerifiedBy: string;
    isBasicDetailsLocked: boolean;
    verificationNotes?: string;
  }): Promise<Company>;
  
  // User feedback operations
  createFeedback(feedback: InsertFeedback): Promise<UserFeedback>;
  getAllFeedback(): Promise<UserFeedback[]>;
  getFeedbackById(id: string): Promise<UserFeedback | undefined>;
  updateFeedbackStatus(id: string, status: string, adminResponse?: string, respondedBy?: string): Promise<UserFeedback>;
  getFeedbackByStatus(status: string): Promise<UserFeedback[]>;
  getFeedbackByType(feedbackType: string): Promise<UserFeedback[]>;
  getFeedbackStats(): Promise<{
    total: number;
    new: number;
    inReview: number;
    inProgress: number;
    resolved: number;
    closed: number;
    byType: Record<string, number>;
  }>;

  // Employee Summary Dashboard operations
  getEmployeeSummaryDashboard(employeeId: string): Promise<{
    quickStats: {
      totalCompaniesWorked: number;
      totalApplicationsMade: number;
      totalWorkSummaries: number;
      totalLogins: number;
    };
    careerSummary: {
      currentCompany: { name: string; joinedAt: Date; position?: string } | null;
      pastCompanies: { name: string; joinedAt: Date; leftAt: Date; position?: string }[];
      totalCompanies: number;
    };
    applicationsSummary: {
      total: number;
      pending: number;
      shortlisted: number;
      interviewed: number;
      offered: number;
      rejected: number;
      recent: { jobTitle: string; companyName: string; status: string; appliedAt: Date }[];
    };
    workActivitySummary: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      recent: { title: string; companyName: string; status: string; createdAt: Date }[];
    };
    loginHistory: {
      total: number;
      recent: { loginAt: Date; deviceType?: string; location?: string }[];
    };
  }>;

  // Login session operations
  createLoginSession(session: InsertLoginSession): Promise<LoginSession>;
  getLoginSessions(userId: string, userType: string): Promise<LoginSession[]>;
  updateLoginSession(sessionId: string, data: Partial<LoginSession>): Promise<LoginSession>;
  getLoginSessionsCount(userId: string, userType: string): Promise<number>;

  // ==================== HIERARCHICAL COMPANY STRUCTURE OPERATIONS ====================
  
  // Company Branch operations (for HDFC Surat, HDFC Mumbai, etc.)
  getCompanyBranches(companyId: string): Promise<CompanyBranch[]>;
  getCompanyBranch(branchId: string): Promise<CompanyBranch | undefined>;
  createCompanyBranch(branch: InsertCompanyBranch): Promise<CompanyBranch>;
  updateCompanyBranch(branchId: string, data: Partial<CompanyBranch>): Promise<CompanyBranch>;
  deleteCompanyBranch(branchId: string): Promise<void>;
  
  // Company Team operations (for teams within branches)
  getCompanyTeams(companyId: string, branchId?: string): Promise<CompanyTeam[]>;
  getCompanyTeam(teamId: string): Promise<CompanyTeam | undefined>;
  createCompanyTeam(team: InsertCompanyTeam): Promise<CompanyTeam>;
  updateCompanyTeam(teamId: string, data: Partial<CompanyTeam>): Promise<CompanyTeam>;
  deleteCompanyTeam(teamId: string): Promise<void>;
  getTeamMembers(teamId: string): Promise<CompanyEmployee[]>;
  
  // Enhanced CompanyEmployee operations with hierarchy
  getEmployeeHierarchyInfo(employeeId: string, companyId: string): Promise<{
    employee: Employee;
    companyRole: CompanyEmployee;
    branch?: CompanyBranch;
    team?: CompanyTeam;
    permissions: {
      canVerifyWork: boolean;
      canManageEmployees: boolean;
      canCreateTeams: boolean;
      verificationScope: string;
    };
  } | null>;
  
  // Role-based verification methods
  canEmployeeVerifyWork(verifierId: string, employeeId: string, companyId: string): Promise<boolean>;
  getEmployeesVerifiableByUser(verifierId: string, companyId: string): Promise<CompanyEmployee[]>;
  
  // Hierarchical work entry operations with verification tracking
  createWorkEntryWithHierarchy(workEntry: InsertWorkEntry & {
    branchId?: string;
    teamId?: string;
  }): Promise<WorkEntry>;
  
  verifyWorkEntryHierarchical(workEntryId: string, verifierId: string, data: {
    approvalStatus: "approved" | "needs_changes";
    companyRating?: number;
    companyFeedback?: string;
  }): Promise<WorkEntry>;
  
  getWorkEntriesWithHierarchy(options: {
    employeeId?: string;
    companyId?: string;
    branchId?: string;
    teamId?: string;
    verifierId?: string;
    includeHierarchyInfo?: boolean;
  }): Promise<(WorkEntry & {
    employee?: Employee;
    company?: Company;
    branch?: CompanyBranch;
    team?: CompanyTeam;
    verifier?: Employee;
    externalCompanyDisplay?: string; // "HDFC" for external view
    internalVerificationDisplay?: string; // "Manager X, HDFC Surat" for internal view
  })[]>;
  
  // Company hierarchy reporting
  getCompanyHierarchyStructure(companyId: string): Promise<{
    company: Company;
    branches: (CompanyBranch & {
      teams: (CompanyTeam & {
        members: CompanyEmployee[];
        teamLead?: Employee;
      })[];
      employeeCount: number;
    })[];
    headquarterTeams: (CompanyTeam & {
      members: CompanyEmployee[];
      teamLead?: Employee;
    })[];
    totalEmployees: number;
    totalBranches: number;
    totalTeams: number;
  }>;
  
  // Permission management
  updateEmployeeHierarchyRole(employeeId: string, companyId: string, updates: {
    hierarchyRole?: "company_admin" | "branch_manager" | "team_lead" | "employee";
    canVerifyWork?: boolean;
    canManageEmployees?: boolean;
    canCreateTeams?: boolean;
    verificationScope?: "none" | "team" | "branch" | "company";
    branchId?: string;
    teamId?: string;
  }): Promise<CompanyEmployee>;

  // Manager Account Operations (CEO/Company Admin only)
  createManager(managerData: InsertCompanyManager): Promise<CompanyManager>;
  getManager(id: string): Promise<CompanyManager | undefined>;
  getManagerByUniqueId(uniqueId: string): Promise<CompanyManager | undefined>;
  getManagersByCompany(companyId: string): Promise<CompanyManager[]>;
  updateManager(id: string, data: Partial<CompanyManager>): Promise<CompanyManager>;
  deleteManager(id: string): Promise<void>;
  getTeamsByManager(managerId: string): Promise<CompanyTeam[]>;
  resetManagerPassword(id: string, newPassword: string): Promise<void>;
  updateManagerLastLogin(id: string): Promise<void>;

  // Manager Authentication
  authenticateManager(uniqueId: string, password: string): Promise<CompanyManager | null>;
  
  // Manager Permissions
  createManagerPermissions(permissionData: InsertManagerPermission): Promise<ManagerPermission>;
  getManagerPermissions(managerId: string): Promise<ManagerPermission | undefined>;
  updateManagerPermissions(managerId: string, data: Partial<ManagerPermission>): Promise<ManagerPermission>;
  
  // Manager-scoped Employee Operations
  getEmployeesAssignedToManager(managerId: string): Promise<(CompanyEmployee & { employee: Employee })[]>;
  assignEmployeeToManager(employeeId: string, companyId: string, managerId: string): Promise<CompanyEmployee>;
  unassignEmployeeFromManager(employeeId: string, companyId: string): Promise<CompanyEmployee>;
  
  // Manager-scoped Work Entry Operations
  getWorkEntriesForManager(managerId: string, filters?: {
    status?: string;
    approvalStatus?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<(WorkEntry & { employee: Employee })[]>;
  
  approveWorkEntryAsManager(workEntryId: string, managerId: string, data: {
    approvalStatus: "manager_approved" | "manager_rejected";
    managerFeedback?: string;
    managerRating?: number;
  }): Promise<WorkEntry>;
  
  // Manager Analytics
  getManagerAnalytics(managerId: string): Promise<{
    totalEmployees: number;
    pendingWorkEntries: number;
    approvedWorkEntries: number;
    rejectedWorkEntries: number;
    teamProductivity: {
      averageHoursPerWeek: number;
      completedTasks: number;
      ongoingTasks: number;
    };
  }>;

  // Recruiter Profile operations
  getRecruiterProfile(userId: string, userType: string): Promise<RecruiterProfile | undefined>;
  createRecruiterProfile(profile: InsertRecruiterProfile): Promise<RecruiterProfile>;
  updateRecruiterProfile(id: string, data: Partial<RecruiterProfile>): Promise<RecruiterProfile>;
  deleteRecruiterProfile(id: string): Promise<void>;
  getRecruiterProfiles(): Promise<RecruiterProfile[]>;

  // Advanced Talent Search operations
  searchTalent(filters: TalentSearchFilters): Promise<(Employee & { 
    verifiedWorkHistory: boolean;
    totalExperience: number; 
    latestRole: string;
    latestCompany: string;
  })[]>;

  // Candidate Pipeline operations
  getCandidatePipelines(recruiterId: string): Promise<(CandidatePipeline & { candidate: Employee })[]>;
  getCandidatePipeline(id: string): Promise<CandidatePipeline | undefined>;
  createCandidatePipeline(pipeline: InsertCandidatePipeline): Promise<CandidatePipeline>;
  updateCandidatePipeline(id: string, data: Partial<CandidatePipeline>): Promise<CandidatePipeline>;
  deleteCandidatePipeline(id: string): Promise<void>;
  updateCandidateStage(pipelineId: string, stage: string): Promise<CandidatePipeline>;

  // Candidate Interaction operations
  getCandidateInteractions(pipelineId: string): Promise<CandidateInteraction[]>;
  createCandidateInteraction(interaction: InsertCandidateInteraction): Promise<CandidateInteraction>;
  updateCandidateInteraction(id: string, data: Partial<CandidateInteraction>): Promise<CandidateInteraction>;
  deleteCandidateInteraction(id: string): Promise<void>;

  // Recruitment Analytics operations
  getRecruitmentAnalytics(recruiterId: string, dateRange?: { start: string; end: string }): Promise<{
    totalSearches: number;
    totalContacts: number;
    totalInterviews: number;
    totalHires: number;
    pipelineBreakdown: { stage: string; count: number }[];
    performanceMetrics: { avgTimeToHire: number; conversionRate: number };
  }>;
  recordRecruitmentMetric(metric: InsertRecruitmentAnalytic): Promise<RecruitmentAnalytic>;

  // Saved Search operations
  getSavedSearches(recruiterId: string): Promise<SavedSearch[]>;
  createSavedSearch(search: InsertSavedSearch): Promise<SavedSearch>;
  updateSavedSearch(id: string, data: Partial<SavedSearch>): Promise<SavedSearch>;
  deleteSavedSearch(id: string): Promise<void>;
  executeSavedSearch(searchId: string): Promise<Employee[]>;
}

export interface JobSearchFilters {
  keywords?: string;
  location?: string;
  employmentType?: string[];
  experienceLevel?: string[];
  remoteType?: string[];
  salaryMin?: number;
  salaryMax?: number;
  companyId?: string;
}

export interface TalentSearchFilters {
  keywords?: string;
  skills?: string[];
  experienceLevel?: string[];
  location?: string;
  availability?: string[];
  verifiedOnly?: boolean;
  minYearsExperience?: number;
  maxYearsExperience?: number;
  industry?: string[];
  salaryRange?: { min?: number; max?: number };
  workType?: string[];
  education?: string[];
  certifications?: string[];
}

export class DatabaseStorage implements IStorage {
  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(sql`LOWER(${employees.email}) = LOWER(${email})`);
    return employee || undefined;
  }

  async createEmployee(employeeData: InsertEmployee): Promise<Employee> {
    // Handle OAuth users who don't have passwords
    const hashedPassword = employeeData.password ? await bcrypt.hash(employeeData.password, 10) : '';
    
    // Normalize email to lowercase for consistency
    const normalizedEmail = employeeData.email.toLowerCase();
    
    // Generate a unique employee ID
    let employeeId = generateEmployeeId();
    let attempts = 0;
    const maxAttempts = 10;
    
    // Ensure the employee ID is unique
    while (attempts < maxAttempts) {
      const existing = await db.select().from(employees).where(eq(employees.employeeId, employeeId));
      if (existing.length === 0) {
        break;
      }
      employeeId = generateEmployeeId();
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique employee ID");
    }
    
    const [employee] = await db
      .insert(employees)
      .values({
        ...employeeData,
        employeeId,
        email: normalizedEmail,
        password: hashedPassword,
      })
      .returning();
    return employee;
  }

  async createEmployeeWithHashedPassword(employeeData: InsertEmployee): Promise<Employee> {
    // Password is already hashed, don't hash again
    const normalizedEmail = employeeData.email.toLowerCase();
    
    // Generate a unique employee ID
    let employeeId = generateEmployeeId();
    let attempts = 0;
    const maxAttempts = 10;
    
    // Ensure the employee ID is unique
    while (attempts < maxAttempts) {
      const existing = await db.select().from(employees).where(eq(employees.employeeId, employeeId));
      if (existing.length === 0) {
        break;
      }
      employeeId = generateEmployeeId();
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique employee ID");
    }
    
    const [employee] = await db
      .insert(employees)
      .values({
        ...employeeData,
        employeeId: employeeData.employeeId || employeeId,
        email: normalizedEmail,
        password: employeeData.password, // Use password as-is (already hashed)
        isActive: true,
        emailVerified: employeeData.emailVerified || false,
      })
      .returning();
    return employee;
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async getCompanyByEmail(email: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(sql`LOWER(${companies.email}) = LOWER(${email})`);
    return company || undefined;
  }

  async createCompany(companyData: InsertCompany): Promise<Company> {
    const hashedPassword = await bcrypt.hash(companyData.password, 10);
    
    // Normalize email to lowercase for consistency
    const normalizedEmail = companyData.email.toLowerCase();
    
    // Generate a unique company ID
    let companyId = generateCompanyId();
    let attempts = 0;
    const maxAttempts = 10;
    
    // Ensure the company ID is unique
    while (attempts < maxAttempts) {
      const existing = await db.select().from(companies).where(eq(companies.companyId, companyId));
      if (existing.length === 0) {
        break;
      }
      companyId = generateCompanyId();
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique company ID");
    }
    
    const [company] = await db
      .insert(companies)
      .values({
        ...companyData,
        companyId,
        email: normalizedEmail,
        password: hashedPassword,
      })
      .returning();
    return company;
  }

  async createCompanyWithHashedPassword(companyData: InsertCompany): Promise<Company> {
    // Password is already hashed, don't hash again
    const normalizedEmail = companyData.email.toLowerCase();
    
    // Generate a unique company ID
    let companyId = generateCompanyId();
    let attempts = 0;
    const maxAttempts = 10;
    
    // Ensure the company ID is unique
    while (attempts < maxAttempts) {
      const existing = await db.select().from(companies).where(eq(companies.companyId, companyId));
      if (existing.length === 0) {
        break;
      }
      companyId = generateCompanyId();
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique company ID");
    }
    
    const [company] = await db
      .insert(companies)
      .values({
        ...companyData,
        companyId,
        email: normalizedEmail,
        password: companyData.password, // Use password as-is (already hashed)
      })
      .returning();
    return company;
  }

  async updateCompany(id: string, data: Partial<Company>): Promise<Company> {
    const [company] = await db
      .update(companies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  async getEmployeeById(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async getCompanyById(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async deleteEmployee(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Delete related data first due to foreign key constraints
      await tx.delete(experiences).where(eq(experiences.employeeId, id));
      await tx.delete(educations).where(eq(educations.employeeId, id));
      await tx.delete(certifications).where(eq(certifications.employeeId, id));
      await tx.delete(projects).where(eq(projects.employeeId, id));
      await tx.delete(endorsements).where(eq(endorsements.employeeId, id));
      await tx.delete(workEntries).where(eq(workEntries.employeeId, id));
      await tx.delete(companyEmployees).where(eq(companyEmployees.employeeId, id));
      await tx.delete(employeeCompanies).where(eq(employeeCompanies.employeeId, id));
      await tx.delete(jobApplications).where(eq(jobApplications.employeeId, id));
      await tx.delete(savedJobs).where(eq(savedJobs.employeeId, id));
      await tx.delete(jobAlerts).where(eq(jobAlerts.employeeId, id));
      await tx.delete(profileViews).where(eq(profileViews.viewedEmployeeId, id));
      await tx.delete(userFeedback).where(eq(userFeedback.userId, id));
      
      // Finally delete the employee
      await tx.delete(employees).where(eq(employees.id, id));
    });
  }

  async deleteCompany(companyId: string): Promise<void> {
    try {
      // Use individual SQL statements to avoid batch issues
      await db.execute(sql`DELETE FROM work_entries WHERE company_id = ${companyId}`);
      await db.execute(sql`DELETE FROM company_employees WHERE company_id = ${companyId}`);
      await db.execute(sql`DELETE FROM company_invitation_codes WHERE company_id = ${companyId}`);
      
      // Handle job-related cascading deletes
      const jobIds = await db.execute(sql`SELECT id FROM job_listings WHERE company_id = ${companyId}`);
      if (jobIds.rows.length > 0) {
        await db.execute(sql`DELETE FROM job_applications WHERE job_id IN (SELECT id FROM job_listings WHERE company_id = ${companyId})`);
        await db.execute(sql`DELETE FROM saved_jobs WHERE job_id IN (SELECT id FROM job_listings WHERE company_id = ${companyId})`);
      }
      
      await db.execute(sql`DELETE FROM job_listings WHERE company_id = ${companyId}`);
      await db.execute(sql`DELETE FROM profile_views WHERE viewer_company_id = ${companyId}`);
      await db.execute(sql`DELETE FROM user_feedback WHERE user_id = ${companyId}`);
      
      // Handle employee companies by name
      const companyName = await db.execute(sql`SELECT name FROM companies WHERE id = ${companyId}`);
      if (companyName.rows.length > 0) {
        const name = (companyName.rows[0] as any).name;
        await db.execute(sql`DELETE FROM employee_companies WHERE company_name = ${name}`);
      }
      
      // Finally delete the company
      await db.execute(sql`DELETE FROM companies WHERE id = ${companyId}`);
      
    } catch (error) {
      console.error("Error deleting company:", error);
      throw error;
    }
  }

  async getEmployeeBackupData(id: string): Promise<any> {
    const employee = await this.getEmployeeById(id);
    if (!employee) return null;

    const [
      employeeExperiences,
      employeeEducations,
      employeeCertifications,
      employeeProjects,
      employeeEndorsements,
      employeeWorkEntries,
      employeeCompanyRelations,
      employeeJobApplications,
      employeeSavedJobs,
      employeeJobAlerts,
      employeeProfileViews,
      employeeFeedback
    ] = await Promise.all([
      db.select().from(experiences).where(eq(experiences.employeeId, id)),
      db.select().from(educations).where(eq(educations.employeeId, id)),
      db.select().from(certifications).where(eq(certifications.employeeId, id)),
      db.select().from(projects).where(eq(projects.employeeId, id)),
      db.select().from(endorsements).where(eq(endorsements.employeeId, id)),
      db.select().from(workEntries).where(eq(workEntries.employeeId, id)),
      db.select().from(employeeCompanies).where(eq(employeeCompanies.employeeId, id)),
      db.select().from(jobApplications).where(eq(jobApplications.employeeId, id)),
      db.select().from(savedJobs).where(eq(savedJobs.employeeId, id)),
      db.select().from(jobAlerts).where(eq(jobAlerts.employeeId, id)),
      db.select().from(profileViews).where(eq(profileViews.viewedEmployeeId, id)),
      db.select().from(userFeedback).where(eq(userFeedback.userId, id))
    ]);

    // Remove password from employee data
    const { password, ...employeeData } = employee;

    return {
      employee: employeeData,
      experiences: employeeExperiences,
      educations: employeeEducations,
      certifications: employeeCertifications,
      projects: employeeProjects,
      endorsements: employeeEndorsements,
      workEntries: employeeWorkEntries,
      companyRelations: employeeCompanyRelations,
      jobApplications: employeeJobApplications,
      savedJobs: employeeSavedJobs,
      jobAlerts: employeeJobAlerts,
      profileViews: employeeProfileViews,
      feedback: employeeFeedback,
      backupDate: new Date().toISOString(),
      backupType: 'employee_full_backup'
    };
  }

  async getCompanyBackupData(id: string): Promise<any> {
    const company = await this.getCompanyById(id);
    if (!company) return null;

    const [
      companyWorkEntries,
      companyEmployeeRelations,
      companyJobListings,
      companyInvitations,
      companyProfileViews,
      companyFeedback
    ] = await Promise.all([
      db.select().from(workEntries).where(eq(workEntries.companyId, id)),
      db.select().from(companyEmployees).where(eq(companyEmployees.companyId, id)),
      db.select().from(jobListings).where(eq(jobListings.companyId, id)),
      db.select().from(companyInvitationCodes).where(eq(companyInvitationCodes.companyId, id)),
      db.select().from(profileViews).where(eq(profileViews.viewerCompanyId, id)),
      db.select().from(userFeedback).where(eq(userFeedback.userId, id))
    ]);

    // Remove password from company data
    const { password, ...companyData } = company;

    return {
      company: companyData,
      workEntries: companyWorkEntries,
      employeeRelations: companyEmployeeRelations,
      jobListings: companyJobListings,
      invitationCodes: companyInvitations,
      profileViews: companyProfileViews,
      feedback: companyFeedback,
      backupDate: new Date().toISOString(),
      backupType: 'company_full_backup'
    };
  }

  async authenticateEmployee(email: string, password: string): Promise<Employee | null> {
    const employee = await this.getEmployeeByEmail(email);
    if (!employee) return null;
    
    const isValid = await bcrypt.compare(password, employee.password);
    return isValid ? employee : null;
  }

  async authenticateCompany(email: string, password: string): Promise<Company | null> {
    const company = await this.getCompanyByEmail(email);
    if (!company) return null;
    
    const isValid = await bcrypt.compare(password, company.password);
    return isValid ? company : null;
  }

  async changeEmployeePassword(employeeId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const employee = await this.getEmployee(employeeId);
    if (!employee) return false;

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, employee.password);
    if (!isCurrentPasswordValid) return false;

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.update(employees)
      .set({ password: hashedNewPassword, updatedAt: new Date() })
      .where(eq(employees.id, employeeId));

    return true;
  }

  async changeCompanyPassword(companyId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const company = await this.getCompany(companyId);
    if (!company) return false;

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, company.password);
    if (!isCurrentPasswordValid) return false;

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.update(companies)
      .set({ password: hashedNewPassword, updatedAt: new Date() })
      .where(eq(companies.id, companyId));

    return true;
  }

  async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
    const [employee] = await db
      .update(employees)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return employee;
  }

  async updateEmployeeProfilePicture(id: string, profilePicturePath: string): Promise<Employee> {
    return this.updateEmployee(id, { profilePhoto: profilePicturePath });
  }

  // Pending employee OTP signup methods
  async createPendingEmployee(email: string, userData: any): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    await db.insert(pendingUsers).values({
      email,
      hashedPassword,
      userType: 'employee',
      userData: userData,
      verificationToken: otp,
      tokenExpiry: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    }).onConflictDoUpdate({
      target: pendingUsers.email,
      set: {
        hashedPassword,
        userData: userData,
        verificationToken: otp,
        tokenExpiry: new Date(Date.now() + 5 * 60 * 1000),
        resendCount: sql`${pendingUsers.resendCount} + 1`,
      }
    });
    
    return otp;
  }

  async getPendingEmployeeByEmail(email: string): Promise<any | null> {
    const result = await db.select()
      .from(pendingUsers)
      .where(and(
        eq(pendingUsers.email, email),
        eq(pendingUsers.userType, 'employee'),
        sql`${pendingUsers.tokenExpiry} > NOW()`
      ))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  async deletePendingEmployeeByEmail(email: string): Promise<void> {
    await db.delete(pendingUsers)
      .where(and(
        eq(pendingUsers.email, email),
        eq(pendingUsers.userType, 'employee')
      ));
  }

  async verifyEmployeeOTP(email: string, otp: string): Promise<{ success: boolean; message: string; userData?: any }> {
    const pending = await db.select()
      .from(pendingUsers)
      .where(and(
        eq(pendingUsers.email, email),
        eq(pendingUsers.userType, 'employee'),
        eq(pendingUsers.verificationToken, otp),
        sql`${pendingUsers.tokenExpiry} > NOW()`
      ))
      .limit(1);

    if (pending.length === 0) {
      return { success: false, message: "Invalid or expired OTP code" };
    }

    return { 
      success: true, 
      message: "OTP verified successfully", 
      userData: pending[0] 
    };
  }

  // Employee Profile Data
  async getEmployeeProfile(employeeId: string): Promise<{
    experiences: Experience[];
    educations: Education[];
    certifications: Certification[];
    projects: Project[];
    endorsements: Endorsement[];
  }> {
    const [experienceList, educationList, certificationList, projectList, endorsementList] = 
      await Promise.all([
        db.select().from(experiences).where(eq(experiences.employeeId, employeeId)),
        db.select().from(educations).where(eq(educations.employeeId, employeeId)),
        db.select().from(certifications).where(eq(certifications.employeeId, employeeId)),
        db.select().from(projects).where(eq(projects.employeeId, employeeId)),
        db.select().from(endorsements).where(eq(endorsements.employeeId, employeeId)),
      ]);

    return {
      experiences: experienceList,
      educations: educationList,
      certifications: certificationList,
      projects: projectList,
      endorsements: endorsementList,
    };
  }

  // Individual employee data getters for company views
  async getEmployeeExperiences(employeeId: string): Promise<Experience[]> {
    return await db.select().from(experiences).where(eq(experiences.employeeId, employeeId));
  }

  async getEmployeeEducations(employeeId: string): Promise<Education[]> {
    return await db.select().from(educations).where(eq(educations.employeeId, employeeId));
  }

  async getEmployeeCertifications(employeeId: string): Promise<Certification[]> {
    return await db.select().from(certifications).where(eq(certifications.employeeId, employeeId));
  }

  // Experience operations
  async getExperience(id: string): Promise<Experience | undefined> {
    const [experience] = await db.select().from(experiences).where(eq(experiences.id, id));
    return experience;
  }

  async createExperience(experience: InsertExperience): Promise<Experience> {
    const [newExperience] = await db
      .insert(experiences)
      .values(experience)
      .returning();
    return newExperience;
  }

  async updateExperience(id: string, data: Partial<Experience>): Promise<Experience> {
    const [experience] = await db
      .update(experiences)
      .set(data)
      .where(eq(experiences.id, id))
      .returning();
    return experience;
  }

  async deleteExperience(id: string): Promise<void> {
    await db.delete(experiences).where(eq(experiences.id, id));
  }

  // Education operations
  async getEducation(id: string): Promise<Education | undefined> {
    const [education] = await db.select().from(educations).where(eq(educations.id, id));
    return education;
  }

  async createEducation(education: InsertEducation): Promise<Education> {
    const [newEducation] = await db
      .insert(educations)
      .values(education)
      .returning();
    return newEducation;
  }

  async updateEducation(id: string, data: Partial<Education>): Promise<Education> {
    const [education] = await db
      .update(educations)
      .set(data)
      .where(eq(educations.id, id))
      .returning();
    return education;
  }

  async deleteEducation(id: string): Promise<void> {
    await db.delete(educations).where(eq(educations.id, id));
  }

  // Certification operations
  async getCertification(id: string): Promise<Certification | undefined> {
    const [certification] = await db.select().from(certifications).where(eq(certifications.id, id));
    return certification;
  }

  async createCertification(certification: InsertCertification): Promise<Certification> {
    const [newCertification] = await db
      .insert(certifications)
      .values(certification)
      .returning();
    return newCertification;
  }

  async updateCertification(id: string, data: Partial<Certification>): Promise<Certification> {
    const [certification] = await db
      .update(certifications)
      .set(data)
      .where(eq(certifications.id, id))
      .returning();
    return certification;
  }

  async deleteCertification(id: string): Promise<void> {
    await db.delete(certifications).where(eq(certifications.id, id));
  }

  // Project operations
  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    return newProject;
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set(data)
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Endorsement operations
  async getEndorsement(id: string): Promise<Endorsement | undefined> {
    const [endorsement] = await db.select().from(endorsements).where(eq(endorsements.id, id));
    return endorsement;
  }

  async createEndorsement(endorsement: InsertEndorsement): Promise<Endorsement> {
    const [newEndorsement] = await db
      .insert(endorsements)
      .values(endorsement)
      .returning();
    return newEndorsement;
  }

  async deleteEndorsement(id: string): Promise<void> {
    await db.delete(endorsements).where(eq(endorsements.id, id));
  }

  // Employee Company operations (legacy table)
  async getEmployeeCompanies(employeeId: string): Promise<EmployeeCompany[]> {
    // This method now returns empty array since we use the new companyEmployees table
    // All data is fetched via getEmployeeCompanyRelations method
    return [];
  }

  async createEmployeeCompany(company: InsertEmployeeCompany): Promise<EmployeeCompany> {
    const [newCompany] = await db
      .insert(employeeCompanies)
      .values(company)
      .returning();
    return newCompany;
  }

  async updateEmployeeCompany(id: string, data: Partial<EmployeeCompany>): Promise<EmployeeCompany> {
    const [company] = await db
      .update(employeeCompanies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(employeeCompanies.id, id))
      .returning();
    return company;
  }

  async deleteEmployeeCompany(id: string): Promise<void> {
    await db.delete(employeeCompanies).where(eq(employeeCompanies.id, id));
  }

  // Work entry operations
  async getWorkEntries(employeeId: string, companyId?: string): Promise<WorkEntry[]> {
    if (companyId) {
      return await db.select().from(workEntries)
        .where(and(
          eq(workEntries.employeeId, employeeId),
          eq(workEntries.companyId, companyId)
        ));
    }
    return await db.select().from(workEntries).where(eq(workEntries.employeeId, employeeId));
  }

  async getWorkEntry(id: string): Promise<WorkEntry | undefined> {
    const [workEntry] = await db
      .select()
      .from(workEntries)
      .where(eq(workEntries.id, id));
    return workEntry;
  }

  async createWorkEntry(workEntry: InsertWorkEntry): Promise<WorkEntry> {
    // Find the assigned manager for this employee in this company
    const employeeRelation = await db
      .select()
      .from(companyEmployees)
      .where(and(
        eq(companyEmployees.employeeId, workEntry.employeeId),
        eq(companyEmployees.companyId, workEntry.companyId),
        eq(companyEmployees.isActive, true)
      ))
      .limit(1);

    let assignedManagerId = null;
    let assignedManagerName = null;

    if (employeeRelation.length > 0 && employeeRelation[0].assignedManagerId) {
      const manager = await db
        .select()
        .from(companyManagers)
        .where(eq(companyManagers.id, employeeRelation[0].assignedManagerId))
        .limit(1);
      
      if (manager.length > 0) {
        assignedManagerId = manager[0].id;
        assignedManagerName = manager[0].managerName;
      }
    }

    // CRITICAL FIX: Always start with pending_review approval status regardless of employee's task status
    const workEntryWithApproval = {
      ...workEntry,
      approvalStatus: "pending_review" as const, // Company must review all entries
      // Link to assigned manager if found
      ...(assignedManagerId && {
        approvedByManagerId: assignedManagerId,
        approvedByManagerName: assignedManagerName
      })
    };
    
    const [newWorkEntry] = await db
      .insert(workEntries)
      .values(workEntryWithApproval)
      .returning();
    return newWorkEntry;
  }

  async updateWorkEntry(id: string, data: Partial<WorkEntry>): Promise<WorkEntry> {
    const [workEntry] = await db
      .update(workEntries)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(workEntries.id, id))
      .returning();
    return workEntry;
  }

  async deleteWorkEntry(id: string): Promise<void> {
    await db.delete(workEntries).where(eq(workEntries.id, id));
  }


  async approveWorkEntryAsCompany(workEntryId: string, companyId: string, data: { 
    rating?: number; 
    feedback?: string; 
    approvedBy: string 
  }): Promise<WorkEntry> {
    // Company admin approval - makes entry immutable and "verified by company"
    const [workEntry] = await db
      .update(workEntries)
      .set({
        approvalStatus: "approved",
        companyRating: data.rating,
        companyFeedback: data.feedback,
        // Do NOT set verifiedBy for company approvals since it references employees table
        // Company approvals are tracked via verifiedByRole and verifiedByName
        verifiedBy: null,
        verifiedByRole: "company_admin",
        verifiedByName: "Company Admin",
        verifiedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(workEntries.id, workEntryId),
        eq(workEntries.companyId, companyId)
      ))
      .returning();
    
    return workEntry;
  }

  async approveWorkEntryAsManager(workEntryId: string, managerId: string, data: { 
    rating?: number; 
    feedback?: string 
  }): Promise<WorkEntry> {
    // Manager approval - also makes entry immutable and "verified by company" (on behalf)
    const manager = await db
      .select()
      .from(companyManagers)
      .where(eq(companyManagers.id, managerId))
      .limit(1);

    if (!manager.length) {
      throw new Error("Manager not found");
    }

    const [workEntry] = await db
      .update(workEntries)
      .set({
        approvalStatus: "approved",
        companyRating: data.rating,
        companyFeedback: data.feedback,
        verifiedBy: managerId,
        verifiedByRole: "assigned_manager",
        verifiedByName: `${manager[0].managerName} (Manager)`,
        verifiedAt: new Date(),
        managerApprovalDate: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(workEntries.id, workEntryId),
        eq(workEntries.approvedByManagerId, managerId)
      ))
      .returning();
    
    return workEntry;
  }

  async getWorkEntriesForCompany(companyId: string): Promise<any[]> {
    // Get all REVIEWED entries (approved or needs changes) - not pending review
    const result = await db
      .select({
        id: workEntries.id,
        employeeId: workEntries.employeeId,
        companyId: workEntries.companyId,
        title: workEntries.title,
        description: workEntries.description,
        startDate: workEntries.startDate,
        endDate: workEntries.endDate,
        priority: workEntries.priority,
        hours: workEntries.hours,
        actualHours: workEntries.actualHours,
        estimatedHours: workEntries.estimatedHours,
        status: workEntries.status, // Employee task status
        approvalStatus: workEntries.approvalStatus, // Company approval status
        companyFeedback: workEntries.companyFeedback,
        companyRating: workEntries.companyRating,
        // Add comprehensive work entry fields for reviewed entries too
        workType: workEntries.workType,
        category: workEntries.category,
        project: workEntries.project,
        client: workEntries.client, // Company can see but we hide in UI for privacy
        billable: workEntries.billable,
        billableRate: workEntries.billableRate,
        tags: workEntries.tags,
        achievements: workEntries.achievements,
        challenges: workEntries.challenges,
        learnings: workEntries.learnings,
        attachments: workEntries.attachments,
        createdAt: workEntries.createdAt,
        updatedAt: workEntries.updatedAt,
        employeeName: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
        employeeEmail: employees.email,
      })
      .from(workEntries)
      .innerJoin(employees, eq(workEntries.employeeId, employees.id))
      .where(and(
        eq(workEntries.companyId, companyId),
        inArray(workEntries.approvalStatus, ["approved", "needs_changes"])
      ));
      
    return result;
  }

  async getPendingWorkEntriesForCompany(companyId: string): Promise<any[]> {
    // Get all entries awaiting company review - regardless of employee task status
    const result = await db
      .select({
        id: workEntries.id,
        employeeId: workEntries.employeeId,
        companyId: workEntries.companyId,
        title: workEntries.title,
        description: workEntries.description,
        startDate: workEntries.startDate,
        endDate: workEntries.endDate,
        priority: workEntries.priority,
        hours: workEntries.hours,
        actualHours: workEntries.actualHours,
        estimatedHours: workEntries.estimatedHours,
        status: workEntries.status, // Employee task status (could be anything)
        approvalStatus: workEntries.approvalStatus, // This should be 'pending_review'
        companyFeedback: workEntries.companyFeedback,
        companyRating: workEntries.companyRating,
        // Add comprehensive work entry fields that employees fill out
        workType: workEntries.workType,
        category: workEntries.category,
        project: workEntries.project,
        client: workEntries.client, // Company can see but we hide in UI for privacy
        billable: workEntries.billable,
        billableRate: workEntries.billableRate,
        tags: workEntries.tags,
        achievements: workEntries.achievements,
        challenges: workEntries.challenges, // Key field for company review
        learnings: workEntries.learnings, // Key field for company review
        attachments: workEntries.attachments,
        createdAt: workEntries.createdAt,
        updatedAt: workEntries.updatedAt,
        employeeName: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
        employeeEmail: employees.email,
      })
      .from(workEntries)
      .innerJoin(employees, eq(workEntries.employeeId, employees.id))
      .where(and(
        eq(workEntries.companyId, companyId), 
        eq(workEntries.approvalStatus, "pending_review")
      ));
      
    return result;
  }

  async approveWorkEntry(id: string, options?: { rating?: number; feedback?: string }): Promise<WorkEntry> {
    const updateData: any = { 
      approvalStatus: "approved", // Company approval status
      status: "approved", // Also set task status to approved for immutable protection
      updatedAt: new Date() 
    };
    
    // Add rating and feedback if provided
    if (options?.rating && options.rating >= 1 && options.rating <= 5) {
      updateData.companyRating = options.rating;
    }
    
    if (options?.feedback && options.feedback.trim()) {
      updateData.companyFeedback = options.feedback.trim();
    }
    
    const [workEntry] = await db
      .update(workEntries)
      .set(updateData)
      .where(eq(workEntries.id, id))
      .returning();
    return workEntry;
  }

  async requestWorkEntryChanges(id: string, feedback: string): Promise<WorkEntry> {
    const [workEntry] = await db
      .update(workEntries)
      .set({ 
        approvalStatus: "needs_changes", // Update approval status, not task status
        companyFeedback: feedback, 
        updatedAt: new Date() 
      })
      .where(eq(workEntries.id, id))
      .returning();
    return workEntry;
  }

  // Company invitation operations
  async generateInvitationCode(companyId: string): Promise<CompanyInvitationCode> {
    // Generate unique code
    let code = generateInvitationCode();
    let attempts = 0;
    const maxAttempts = 10;
    
    // Ensure code is unique
    while (attempts < maxAttempts) {
      const existing = await db.select().from(companyInvitationCodes).where(eq(companyInvitationCodes.code, code));
      if (existing.length === 0) {
        break;
      }
      code = generateInvitationCode();
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique invitation code");
    }
    
    // Set expiration to 15 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    
    const [invitationCode] = await db
      .insert(companyInvitationCodes)
      .values({
        companyId,
        code,
        expiresAt,
      })
      .returning();
      
    return invitationCode;
  }

  async validateInvitationCode(code: string): Promise<CompanyInvitationCode | null> {
    const [invitationCode] = await db
      .select()
      .from(companyInvitationCodes)
      .where(eq(companyInvitationCodes.code, code));
      
    if (!invitationCode) {
      return null;
    }
    
    // Check if expired
    if (new Date() > invitationCode.expiresAt) {
      return null;
    }
    
    // Check if already used
    if (invitationCode.usedByEmployeeId) {
      return null;
    }
    
    return invitationCode;
  }

  async useInvitationCode(code: string, employeeId: string): Promise<CompanyEmployee> {
    // Validate the code first
    const invitationCode = await this.validateInvitationCode(code);
    if (!invitationCode) {
      throw new Error("Invalid or expired invitation code");
    }
    
    // Mark the code as used
    await db
      .update(companyInvitationCodes)
      .set({
        usedByEmployeeId: employeeId,
        usedAt: new Date(),
      })
      .where(eq(companyInvitationCodes.id, invitationCode.id));
    
    // Check if employee is already part of this company
    const existingRelation = await db
      .select()
      .from(companyEmployees)
      .where(and(
        eq(companyEmployees.companyId, invitationCode.companyId),
        eq(companyEmployees.employeeId, employeeId)
      ));
      
    if (existingRelation.length > 0) {
      // Update existing relation to active
      const [updated] = await db
        .update(companyEmployees)
        .set({ isActive: true })
        .where(eq(companyEmployees.id, existingRelation[0].id))
        .returning();
      return updated;
    }
    
    // Create new company-employee relationship
    const [companyEmployee] = await db
      .insert(companyEmployees)
      .values({
        companyId: invitationCode.companyId,
        employeeId,
        isActive: true,
        hierarchyRole: "employee", // Default role for new joiners
        verificationScope: "none", // Default verification scope
        canVerifyWork: false,
        canManageEmployees: false,
        canCreateTeams: false,
        status: "employed",
      })
      .returning();
      
    return companyEmployee;
  }

  async getCompanyEmployees(companyId: string): Promise<any[]> {
    const result = await db
      .select({
        id: companyEmployees.id,
        employeeId: companyEmployees.employeeId,
        employeeName: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
        employeeEmail: employees.email,
        position: companyEmployees.position,
        joinedAt: companyEmployees.joinedAt,
      })
      .from(companyEmployees)
      .innerJoin(employees, eq(companyEmployees.employeeId, employees.id))
      .where(
        and(
          eq(companyEmployees.companyId, companyId),
          eq(companyEmployees.isActive, true)
        )
      );
      
    return result;
  }

  async getCompanyEmployeesPaginated(companyId: string, options: {
    page: number;
    limit: number;
    search: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    status: string;
    department: string;
    tab?: string;
  }): Promise<{
    employees: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page, limit, search, sortBy, sortOrder, status, department, tab } = options;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(companyEmployees.companyId, companyId)];

    // Tab filter (overrides status filter)
    if (tab && tab !== 'all') {
      if (tab === 'active') {
        conditions.push(eq(companyEmployees.isActive, true));
      } else if (tab === 'inactive') {
        conditions.push(eq(companyEmployees.isActive, false));
      }
    } else if (status !== 'all') {
      if (status === 'active') {
        conditions.push(eq(companyEmployees.isActive, true));
      } else if (status === 'inactive') {
        conditions.push(eq(companyEmployees.isActive, false));
      }
    }

    // Department filter
    if (department !== 'all') {
      conditions.push(eq(companyEmployees.department, department));
    }

    // Search conditions
    if (search) {
      const searchConditions = [
        like(sql`LOWER(CONCAT(${employees.firstName}, ' ', ${employees.lastName}))`, `%${search.toLowerCase()}%`),
        like(sql`LOWER(${employees.email})`, `%${search.toLowerCase()}%`),
        like(sql`LOWER(${employees.id})`, `%${search.toLowerCase()}%`),
        like(sql`LOWER(${companyEmployees.position})`, `%${search.toLowerCase()}%`),
        like(sql`LOWER(${companyEmployees.department})`, `%${search.toLowerCase()}%`),
      ];
      conditions.push(or(...searchConditions));
    }

    // Build sort column
    let sortColumn;
    switch (sortBy) {
      case 'name':
        sortColumn = sql`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`;
        break;
      case 'position':
        sortColumn = companyEmployees.position;
        break;
      case 'department':
        sortColumn = companyEmployees.department;
        break;
      case 'joinedAt':
      default:
        sortColumn = companyEmployees.joinedAt;
        break;
    }

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(companyEmployees)
      .innerJoin(employees, eq(companyEmployees.employeeId, employees.id))
      .where(and(...conditions));

    const totalCount = totalResult.count;
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated results
    const employeesQuery = db
      .select({
        id: companyEmployees.id,
        employeeId: companyEmployees.employeeId,
        employeeName: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
        employeeEmail: employees.email,
        employeePhone: employees.phone,
        employeeIdNumber: employees.id,
        position: companyEmployees.position,
        department: companyEmployees.department,
        status: companyEmployees.status,
        joinedAt: companyEmployees.joinedAt,
        leftAt: companyEmployees.leftAt,
        isActive: companyEmployees.isActive,
        emailVerified: employees.emailVerified,
        profilePhoto: employees.profilePhoto,
      })
      .from(companyEmployees)
      .innerJoin(employees, eq(companyEmployees.employeeId, employees.id))
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    // Apply sorting
    if (sortOrder === 'desc') {
      employeesQuery.orderBy(desc(sortColumn));
    } else {
      employeesQuery.orderBy(asc(sortColumn));
    }

    const employeesResult = await employeesQuery;

    return {
      employees: employeesResult,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
    };
  }

  async getEmployeeCompaniesNew(employeeId: string): Promise<CompanyEmployee[]> {
    return await db
      .select()
      .from(companyEmployees)
      .where(eq(companyEmployees.employeeId, employeeId));
  }

  async leaveCompany(employeeId: string, companyId: string): Promise<CompanyEmployee> {
    const [updatedRelation] = await db
      .update(companyEmployees)
      .set({ 
        status: "ex-employee",
        leftAt: new Date(),
        isActive: false
      })
      .where(
        and(
          eq(companyEmployees.employeeId, employeeId),
          eq(companyEmployees.companyId, companyId),
          eq(companyEmployees.status, "employed")
        )
      )
      .returning();
      
    if (!updatedRelation) {
      throw new Error("Active employment relationship not found");
    }
    
    return updatedRelation;
  }

  async getEmployeeCompanyRelations(employeeId: string): Promise<any[]> {
    const relations = await db
      .select({
        id: companies.id, // CRITICAL FIX: Use companies.id as the main ID (not companyEmployees.id)
        employeeId: companyEmployees.employeeId,
        companyId: companies.id, // This is the correct company ID for work entries
        companyName: companies.name,
        name: companies.name, // Add name field for compatibility
        position: companyEmployees.position,
        department: companyEmployees.department,
        joinedAt: companyEmployees.joinedAt,
        leftAt: companyEmployees.leftAt,
        status: companyEmployees.status,
        isActive: companyEmployees.isActive,
        createdAt: companyEmployees.joinedAt,
        updatedAt: companyEmployees.joinedAt,
        isCurrent: sql<boolean>`${companyEmployees.status} = 'employed'`,
        // Add company verification fields for badges
        panVerificationStatus: companies.panVerificationStatus,
        cinVerificationStatus: companies.cinVerificationStatus
      })
      .from(companyEmployees)
      .innerJoin(companies, eq(companyEmployees.companyId, companies.id))
      .where(eq(companyEmployees.employeeId, employeeId))
      .orderBy(desc(companyEmployees.joinedAt));
      
    console.log('Employee company relations (all statuses):', relations);
    return relations;
  }

  async getCompanyEmployeeRelation(relationId: string): Promise<CompanyEmployee | null> {
    const [relation] = await db
      .select()
      .from(companyEmployees)
      .where(eq(companyEmployees.id, relationId));
      
    return relation || null;
  }

  // Job discovery operations
  async searchJobs(filters: JobSearchFilters): Promise<JobListing[]> {
    let query = db.select({
      id: jobListings.id,
      companyId: jobListings.companyId,
      title: jobListings.title,
      description: jobListings.description,
      requirements: jobListings.requirements,
      location: jobListings.location,
      remoteType: jobListings.remoteType,
      employmentType: jobListings.employmentType,
      experienceLevel: jobListings.experienceLevel,
      salaryRange: jobListings.salaryRange,
      benefits: jobListings.benefits,
      skills: jobListings.skills,
      applicationDeadline: jobListings.applicationDeadline,
      status: jobListings.status,
      views: jobListings.views,
      applicationsCount: jobListings.applicationsCount,
      createdAt: jobListings.createdAt,
      updatedAt: jobListings.updatedAt,
      companyName: companies.name,
      // Add company verification fields for badges
      panVerificationStatus: companies.panVerificationStatus,
      cinVerificationStatus: companies.cinVerificationStatus
    })
    .from(jobListings)
    .innerJoin(companies, eq(jobListings.companyId, companies.id));
    
    const conditions = [eq(jobListings.status, 'active')]; // Only show active jobs
    
    if (filters.keywords) {
      conditions.push(sql`(${jobListings.title} ILIKE ${'%' + filters.keywords + '%'} OR ${jobListings.description} ILIKE ${'%' + filters.keywords + '%'})`);
    }
    
    if (filters.location) {
      conditions.push(sql`${jobListings.location} ILIKE ${'%' + filters.location + '%'}`);
    }
    
    if (filters.employmentType && filters.employmentType.length > 0) {
      conditions.push(inArray(jobListings.employmentType, filters.employmentType));
    }
    
    if (filters.experienceLevel && filters.experienceLevel.length > 0) {
      conditions.push(inArray(jobListings.experienceLevel, filters.experienceLevel));
    }
    
    if (filters.remoteType && filters.remoteType.length > 0) {
      conditions.push(inArray(jobListings.remoteType, filters.remoteType));
    }
    
    // TODO: Implement salary filtering after adding salaryMin/salaryMax columns to database
    // For now, skip salary filtering to focus on other filter functionality
    
    if (filters.companyId) {
      conditions.push(eq(jobListings.companyId, filters.companyId));
    }
    
    return await query.where(and(...conditions)).orderBy(jobListings.createdAt);
  }

  async getJobById(id: string): Promise<JobListing | undefined> {
    const [job] = await db.select({
      id: jobListings.id,
      companyId: jobListings.companyId,
      title: jobListings.title,
      description: jobListings.description,
      requirements: jobListings.requirements,
      location: jobListings.location,
      remoteType: jobListings.remoteType,
      employmentType: jobListings.employmentType,
      experienceLevel: jobListings.experienceLevel,
      salaryRange: jobListings.salaryRange,
      benefits: jobListings.benefits,
      skills: jobListings.skills,
      applicationDeadline: jobListings.applicationDeadline,
      status: jobListings.status,
      views: jobListings.views,
      applicationsCount: jobListings.applicationsCount,
      createdAt: jobListings.createdAt,
      updatedAt: jobListings.updatedAt,
      companyName: companies.name,
      // Add company verification fields for badges
      panVerificationStatus: companies.panVerificationStatus,
      cinVerificationStatus: companies.cinVerificationStatus
    })
    .from(jobListings)
    .innerJoin(companies, eq(jobListings.companyId, companies.id))
    .where(eq(jobListings.id, id));
    return job || undefined;
  }

  async createJobListing(job: InsertJobListing): Promise<JobListing> {
    const [newJob] = await db
      .insert(jobListings)
      .values(job)
      .returning();
    return newJob;
  }

  async updateJobListing(id: string, data: Partial<JobListing>): Promise<JobListing> {
    const [job] = await db
      .update(jobListings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobListings.id, id))
      .returning();
    return job;
  }

  async deleteJobListing(id: string): Promise<void> {
    // First delete all applications for this job listing
    await db.delete(jobApplications).where(eq(jobApplications.jobId, id));
    
    // Then delete the job listing itself
    await db.delete(jobListings).where(eq(jobListings.id, id));
  }

  // Company-specific job management methods
  async getCompanyJobs(companyId: string): Promise<JobListing[]> {
    return await db.select().from(jobListings).where(eq(jobListings.companyId, companyId));
  }

  async getJobById(jobId: string): Promise<JobListing | null> {
    const [job] = await db.select().from(jobListings).where(eq(jobListings.id, jobId));
    return job || null;
  }

  // Job application operations
  async getJobApplications(employeeId: string): Promise<JobApplication[]> {
    return await db.select().from(jobApplications).where(eq(jobApplications.employeeId, employeeId));
  }

  async getJobApplicationsByEmployeeAndJob(employeeId: string, jobId: string): Promise<JobApplication[]> {
    return await db
      .select()
      .from(jobApplications)
      .where(
        and(
          eq(jobApplications.employeeId, employeeId),
          eq(jobApplications.jobId, jobId)
        )
      )
      .orderBy(desc(jobApplications.appliedAt));
  }

  async getJobApplicationsForJob(jobId: string): Promise<JobApplication[]> {
    return await db.select().from(jobApplications).where(eq(jobApplications.jobId, jobId));
  }

  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    const [newApplication] = await db
      .insert(jobApplications)
      .values(application)
      .returning();
    return newApplication;
  }

  // Company recruiter methods
  async getCompanyJobApplications(companyId: string): Promise<JobApplication[]> {
    // Get all applications for company jobs
    const allApplications = await db
      .select({
        application: jobApplications,
        job: jobListings,
        employee: employees
      })
      .from(jobApplications)
      .innerJoin(jobListings, eq(jobApplications.jobId, jobListings.id))
      .innerJoin(employees, eq(jobApplications.employeeId, employees.id))
      .where(eq(jobListings.companyId, companyId))
      .orderBy(desc(jobApplications.appliedAt));
    
    // Filter to keep only the latest application for each employee-job combination
    const applicationMap = new Map<string, any>();
    
    for (const { application, job, employee } of allApplications) {
      const key = `${application.employeeId}-${application.jobId}`;
      const existing = applicationMap.get(key);
      
      if (!existing || new Date(application.appliedAt) > new Date(existing.application.appliedAt)) {
        applicationMap.set(key, { application, job, employee });
      }
    }
    
    // Convert back to array and sort by application date
    const uniqueApplications = Array.from(applicationMap.values())
      .sort((a, b) => new Date(b.application.appliedAt).getTime() - new Date(a.application.appliedAt).getTime());
    
    return uniqueApplications.map(({ application, job, employee }) => ({
      ...application,
      job,
      employee
    })) as any;
  }

  async getJobApplicationWithEmployee(applicationId: string): Promise<JobApplication | null> {
    const [result] = await db
      .select({
        application: jobApplications,
        job: jobListings,
        employee: employees
      })
      .from(jobApplications)
      .innerJoin(jobListings, eq(jobApplications.jobId, jobListings.id))
      .innerJoin(employees, eq(jobApplications.employeeId, employees.id))
      .where(eq(jobApplications.id, applicationId));
    
    if (!result) return null;
    
    return {
      ...result.application,
      jobListing: result.job,
      employee: result.employee
    } as JobApplication;
  }

  async updateJobApplicationStatus(id: string, updates: { 
    status?: string; 
    companyNotes?: string; 
    interviewNotes?: string; 
    rejectionReason?: string;
  }): Promise<JobApplication> {
    const [application] = await db
      .update(jobApplications)
      .set({
        ...updates,
        statusUpdatedAt: new Date()
      })
      .where(eq(jobApplications.id, id))
      .returning();
    
    return application;
  }

  // Clean up duplicate applications - keeps only the latest application for each employee-job combination
  async cleanupDuplicateApplications(): Promise<{ deletedCount: number; keptCount: number }> {
    // Get all applications grouped by employee-job combination
    const allApplications = await db
      .select()
      .from(jobApplications)
      .orderBy(desc(jobApplications.appliedAt));
    
    const applicationGroups = new Map<string, JobApplication[]>();
    
    // Group applications by employee-job combination
    for (const application of allApplications) {
      const key = `${application.employeeId}-${application.jobId}`;
      if (!applicationGroups.has(key)) {
        applicationGroups.set(key, []);
      }
      applicationGroups.get(key)!.push(application);
    }
    
    const applicationsToDelete: string[] = [];
    let keptCount = 0;
    
    // For each group, keep the latest and mark others for deletion
    for (const [key, applications] of applicationGroups) {
      if (applications.length > 1) {
        // Sort by appliedAt date (latest first)
        applications.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
        
        // Keep the latest (first in sorted array)
        keptCount++;
        
        // Mark the rest for deletion
        for (let i = 1; i < applications.length; i++) {
          applicationsToDelete.push(applications[i].id);
        }
      } else {
        keptCount++;
      }
    }
    
    // Delete the duplicate applications
    if (applicationsToDelete.length > 0) {
      await db
        .delete(jobApplications)
        .where(inArray(jobApplications.id, applicationsToDelete));
    }
    
    return {
      deletedCount: applicationsToDelete.length,
      keptCount
    };
  }

  // Saved jobs operations
  async getSavedJobs(employeeId: string): Promise<SavedJob[]> {
    return await db.select().from(savedJobs).where(eq(savedJobs.employeeId, employeeId));
  }

  async saveJob(data: InsertSavedJob): Promise<SavedJob> {
    const [saved] = await db
      .insert(savedJobs)
      .values(data)
      .returning();
    return saved;
  }

  async unsaveJob(employeeId: string, jobId: string): Promise<void> {
    await db.delete(savedJobs)
      .where(and(
        eq(savedJobs.employeeId, employeeId),
        eq(savedJobs.jobId, jobId)
      ));
  }

  // Job alerts operations
  async getJobAlerts(employeeId: string): Promise<JobAlert[]> {
    return await db.select().from(jobAlerts).where(eq(jobAlerts.employeeId, employeeId));
  }

  async createJobAlert(alert: InsertJobAlert): Promise<JobAlert> {
    const [newAlert] = await db
      .insert(jobAlerts)
      .values(alert)
      .returning();
    return newAlert;
  }

  async updateJobAlert(id: string, data: Partial<JobAlert>): Promise<JobAlert> {
    const [alert] = await db
      .update(jobAlerts)
      .set(data)
      .where(eq(jobAlerts.id, id))
      .returning();
    return alert;
  }

  async deleteJobAlert(id: string): Promise<void> {
    await db.delete(jobAlerts).where(eq(jobAlerts.id, id));
  }

  // Profile views operations
  async recordProfileView(viewerCompanyId: string, viewedEmployeeId: string, context: string): Promise<ProfileView> {
    const [view] = await db
      .insert(profileViews)
      .values({
        viewerCompanyId,
        viewedEmployeeId,
        viewContext: context
      })
      .returning();
    return view;
  }

  async getProfileViews(employeeId: string): Promise<ProfileView[]> {
    return await db.select().from(profileViews).where(eq(profileViews.viewedEmployeeId, employeeId));
  }

  // Company employee access with privacy controls
  async getEmployeeCompanyRelation(employeeId: string, companyId: string): Promise<CompanyEmployee | null> {
    const [relation] = await db
      .select({
        id: companyEmployees.id,
        companyId: companyEmployees.companyId,
        employeeId: companyEmployees.employeeId,
        branchId: companyEmployees.branchId,
        teamId: companyEmployees.teamId,
        assignedManagerId: companyEmployees.assignedManagerId,
        position: companyEmployees.position,
        department: companyEmployees.department,
        hierarchyRole: companyEmployees.hierarchyRole,
        canVerifyWork: companyEmployees.canVerifyWork,
        canManageEmployees: companyEmployees.canManageEmployees,
        canCreateTeams: companyEmployees.canCreateTeams,
        verificationScope: companyEmployees.verificationScope,
        joinedAt: companyEmployees.joinedAt,
        leftAt: companyEmployees.leftAt,
        status: companyEmployees.status,
        isActive: companyEmployees.isActive
      })
      .from(companyEmployees)
      .where(
        and(
          eq(companyEmployees.employeeId, employeeId),
          eq(companyEmployees.companyId, companyId)
        )
      );
    
    return relation || null;
  }

  async hasEmployeeAppliedToCompany(employeeId: string, companyId: string): Promise<boolean> {
    const [application] = await db
      .select()
      .from(jobApplications)
      .innerJoin(jobListings, eq(jobApplications.jobId, jobListings.id))
      .where(
        and(
          eq(jobApplications.employeeId, employeeId),
          eq(jobListings.companyId, companyId)
        )
      )
      .limit(1);
    
    return !!application;
  }

  async getEmployeeApplicationsToCompany(employeeId: string, companyId: string): Promise<JobApplication[]> {
    const applications = await db
      .select({
        application: jobApplications,
        job: jobListings
      })
      .from(jobApplications)
      .innerJoin(jobListings, eq(jobApplications.jobId, jobListings.id))
      .where(
        and(
          eq(jobApplications.employeeId, employeeId),
          eq(jobListings.companyId, companyId)
        )
      )
      .orderBy(desc(jobApplications.appliedAt));
    
    return applications.map(({ application, job }) => ({
      ...application,
      job
    })) as any;
  }

  async updateEmployeeCompanyStatus(employeeId: string, companyId: string, isCurrent: boolean): Promise<CompanyEmployee> {
    const [updatedRelation] = await db
      .update(companyEmployees)
      .set({ 
        status: isCurrent ? "employed" : "ex-employee",
        isActive: isCurrent,
        ...(isCurrent ? {} : { leftAt: new Date() })
      })
      .where(
        and(
          eq(companyEmployees.employeeId, employeeId),
          eq(companyEmployees.companyId, companyId)
        )
      )
      .returning();
      
    if (!updatedRelation) {
      throw new Error("Employee company relationship not found");
    }
    
    return updatedRelation;
  }

  async getWorkEntriesForEmployeeAndCompany(employeeId: string, companyId: string): Promise<WorkEntry[]> {
    const entries = await db
      .select({
        id: workEntries.id,
        employeeId: workEntries.employeeId,
        companyId: workEntries.companyId,
        title: workEntries.title,
        description: workEntries.description,
        startDate: workEntries.startDate,
        endDate: workEntries.endDate,
        priority: workEntries.priority,
        hours: workEntries.hours,
        status: workEntries.status,
        approvalStatus: workEntries.approvalStatus,
        verifiedBy: workEntries.verifiedBy,
        approvedAt: workEntries.approvedAt,
        companyFeedback: workEntries.companyFeedback,
        createdAt: workEntries.createdAt,
        updatedAt: workEntries.updatedAt,
        estimatedHours: workEntries.estimatedHours,
        actualHours: workEntries.actualHours,
        workType: workEntries.workType,
        category: workEntries.category,
        project: workEntries.project,
        client: workEntries.client,
        billable: workEntries.billable,
        billableRate: workEntries.billableRate,
        tags: workEntries.tags,
        achievements: workEntries.achievements,
        challenges: workEntries.challenges,
        learnings: workEntries.learnings,
        companyRating: workEntries.companyRating,
        attachments: workEntries.attachments,
        location: workEntries.location,
        objectives: workEntries.objectives,
        skills: workEntries.skills,
        companyName: companies.name
      })
      .from(workEntries)
      .leftJoin(companies, eq(workEntries.companyId, companies.id))
      .where(
        and(
          eq(workEntries.employeeId, employeeId),
          eq(workEntries.companyId, companyId),
          eq(workEntries.approvalStatus, 'approved') // Only return verified/approved work entries
        )
      )
      .orderBy(desc(workEntries.createdAt));

    return entries.map(entry => ({
      ...entry,
      company: { name: entry.companyName }
    })) as WorkEntry[];
  }

  // Admin operations
  async getAdmin(id: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin || undefined;
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return admin || undefined;
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.username, username));
    return admin || undefined;
  }

  async createAdmin(adminData: InsertAdmin): Promise<Admin> {
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    
    // Generate a unique admin ID
    let adminId = generateAdminId();
    let attempts = 0;
    const maxAttempts = 10;
    
    // Ensure the admin ID is unique
    while (attempts < maxAttempts) {
      const existing = await db.select().from(admins).where(eq(admins.adminId, adminId));
      if (existing.length === 0) {
        break;
      }
      adminId = generateAdminId();
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique admin ID");
    }
    
    const [admin] = await db
      .insert(admins)
      .values({ ...adminData, adminId, password: hashedPassword })
      .returning();
    return admin;
  }

  // Professional Analytics Methods
  async getEmployeeAnalytics(employeeId: string): Promise<any> {
    try {
      // Get profile views count using correct column name
      const profileViewsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(profileViews)
        .where(eq(profileViews.viewedEmployeeId, employeeId));

      // Get job applications count
      const applicationsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(jobApplications)
        .where(eq(jobApplications.employeeId, employeeId));

      // Calculate profile completion score
      const employee = await this.getEmployee(employeeId);
      const profile = await this.getEmployeeProfile(employeeId);
      
      let profileScore = 0;
      if (employee) {
        // Basic info (20%)
        profileScore += 20;
        
        // Profile photo (10%)
        if (employee.profilePhoto) profileScore += 10;
        
        // Professional summary (20%)
        if (employee.summary) profileScore += 20;
        
        // Skills (15%)
        if (employee.skills && employee.skills.length > 0) profileScore += 15;
        
        // Experience (20%)
        if (profile.experiences && profile.experiences.length > 0) profileScore += 20;
        
        // Education (15%)
        if (profile.educations && profile.educations.length > 0) profileScore += 15;
      }

      return {
        profileViews: profileViewsCount[0]?.count || 0,
        applications: applicationsCount[0]?.count || 0,
        profileScore: Math.min(profileScore, 100)
      };
    } catch (error) {
      console.error('Error getting employee analytics:', error);
      // Return default values on error
      return {
        profileViews: 0,
        applications: 0,
        profileScore: 0
      };
    }
  }

  async getWorkEntryAnalytics(employeeId: string, companyId?: string): Promise<any> {
    const whereConditions = companyId 
      ? and(eq(workEntries.employeeId, employeeId), eq(workEntries.companyId, companyId))
      : eq(workEntries.employeeId, employeeId);

    const query = db
      .select({
        count: sql<number>`count(*)`,
        totalHours: sql<number>`coalesce(sum(${workEntries.hours}), 0)`,
        estimatedHours: sql<number>`coalesce(sum(${workEntries.estimatedHours}), 0)`,
        billableHours: sql<number>`coalesce(sum(case when ${workEntries.billable} = true then ${workEntries.actualHours} else 0 end), 0)`,
        completedCount: sql<number>`sum(case when ${workEntries.status} = 'completed' then 1 else 0 end)`
      })
      .from(workEntries)
      .where(whereConditions);

    const [analytics] = await query;
    
    const completionRate = analytics.count > 0 
      ? Math.round((analytics.completedCount / analytics.count) * 100)
      : 0;

    return {
      totalEntries: analytics.count || 0,
      totalHours: analytics.totalHours || 0,
      estimatedHours: analytics.estimatedHours || 0,
      billableHours: analytics.billableHours || 0,
      completionRate
    };
  }

  async getEmployeeCompaniesForAnalytics(employeeId: string): Promise<any[]> {
    const result = await db
      .select({
        id: companyEmployees.companyId,
        name: companies.name,
        position: companyEmployees.position,
        department: companyEmployees.department,
        joinedAt: companyEmployees.joinedAt,
        status: companyEmployees.status
      })
      .from(companyEmployees)
      .leftJoin(companies, eq(companyEmployees.companyId, companies.id))
      .where(
        and(
          eq(companyEmployees.employeeId, employeeId),
          eq(companyEmployees.status, 'employed')
        )
      );

    return result;
  }

  async updateAdmin(id: string, data: Partial<Admin>): Promise<Admin> {
    const [updated] = await db
      .update(admins)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(admins.id, id))
      .returning();
    return updated;
  }

  async authenticateAdmin(username: string, password: string): Promise<Admin | null> {
    const admin = await this.getAdminByUsername(username);
    if (!admin || !admin.isActive) return null;
    
    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) return null;
    
    // Update last login
    await this.updateAdminLastLogin(admin.id);
    
    return admin;
  }

  async updateAdminLastLogin(id: string): Promise<void> {
    await db
      .update(admins)
      .set({ lastLogin: new Date() })
      .where(eq(admins.id, id));
  }

  // Admin management operations
  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).orderBy(desc(employees.createdAt));
  }

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(desc(companies.createdAt));
  }

  // Enhanced admin employee-company management implementations
  async getEmployeeWithCompanyHistory(employeeId: string): Promise<{
    employee: Employee;
    companyHistory: CompanyEmployee[];
    currentCompany: Company | null;
  }> {
    const employee = await this.getEmployee(employeeId);
    if (!employee) throw new Error("Employee not found");

    const companyHistory = await db.select()
      .from(companyEmployees)
      .where(eq(companyEmployees.employeeId, employeeId))
      .orderBy(desc(companyEmployees.joinedAt));

    const currentRelation = companyHistory.find(relation => relation.status === 'employed');
    let currentCompany = null;
    if (currentRelation) {
      currentCompany = await this.getCompany(currentRelation.companyId);
    }

    return {
      employee,
      companyHistory,
      currentCompany
    };
  }

  async getCompanyWithEmployeeHistory(companyId: string): Promise<{
    company: Company;
    currentEmployees: (CompanyEmployee & { employee: Employee })[];
    pastEmployees: (CompanyEmployee & { employee: Employee })[];
    totalEmployeesCount: number;
  }> {
    const company = await this.getCompany(companyId);
    if (!company) throw new Error("Company not found");

    // Get current employees
    const currentEmployees = await db.select()
      .from(companyEmployees)
      .leftJoin(employees, eq(companyEmployees.employeeId, employees.id))
      .where(and(
        eq(companyEmployees.companyId, companyId),
        eq(companyEmployees.status, 'employed')
      ))
      .orderBy(desc(companyEmployees.joinedAt));

    // Get past employees
    const pastEmployees = await db.select()
      .from(companyEmployees)
      .leftJoin(employees, eq(companyEmployees.employeeId, employees.id))
      .where(and(
        eq(companyEmployees.companyId, companyId),
        eq(companyEmployees.status, 'ex-employee')
      ))
      .orderBy(desc(companyEmployees.leftAt));

    const totalEmployeesCount = currentEmployees.length + pastEmployees.length;

    return {
      company,
      currentEmployees: currentEmployees.map(row => ({
        ...row.company_employees,
        employee: row.employees!
      })),
      pastEmployees: pastEmployees.map(row => ({
        ...row.company_employees,
        employee: row.employees!
      })),
      totalEmployeesCount
    };
  }

  async getAllEmployeesWithCurrentCompany(): Promise<(Employee & {
    currentCompany?: Company;
    currentPosition?: string;
    currentStatus?: string;
  })[]> {
    const allEmployees = await db.select()
      .from(employees)
      .leftJoin(companyEmployees, and(
        eq(employees.id, companyEmployees.employeeId),
        eq(companyEmployees.status, 'employed')
      ))
      .leftJoin(companies, eq(companyEmployees.companyId, companies.id))
      .orderBy(desc(employees.createdAt));

    return allEmployees.map(row => ({
      ...row.employees,
      currentCompany: row.companies || undefined,
      currentPosition: row.company_employees?.position || undefined,
      currentStatus: row.company_employees?.status || undefined
    }));
  }

  async getAllCompaniesWithEmployeeCounts(): Promise<(Company & {
    currentEmployeesCount: number;
    totalEmployeesCount: number;
  })[]> {
    const companiesWithCounts = await db.select({
      ...getTableColumns(companies),
      currentEmployeesCount: sql<number>`COUNT(CASE WHEN ${companyEmployees.status} = 'employed' THEN 1 END)`,
      totalEmployeesCount: sql<number>`COUNT(${companyEmployees.id})`
    })
      .from(companies)
      .leftJoin(companyEmployees, eq(companies.id, companyEmployees.companyId))
      .groupBy(companies.id)
      .orderBy(desc(companies.createdAt));

    return companiesWithCounts;
  }

  async transferEmployeeBetweenCompanies(employeeId: string, fromCompanyId: string, toCompanyId: string, newPosition?: string): Promise<void> {
    const now = new Date();
    
    // Mark previous company as ex-employee
    await db.update(companyEmployees)
      .set({
        status: 'ex-employee',
        leftAt: now,
        isActive: false
      })
      .where(and(
        eq(companyEmployees.employeeId, employeeId),
        eq(companyEmployees.companyId, fromCompanyId),
        eq(companyEmployees.status, 'employed')
      ));

    // Add new company relationship
    await db.insert(companyEmployees).values({
      id: crypto.randomUUID(),
      employeeId,
      companyId: toCompanyId,
      position: newPosition,
      joinedAt: now,
      status: 'employed',
      isActive: true
    });
  }

  async updateEmployeeCompanyRelationship(relationshipId: string, updates: Partial<CompanyEmployee>): Promise<CompanyEmployee> {
    const [updated] = await db.update(companyEmployees)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companyEmployees.id, relationshipId))
      .returning();
    
    if (!updated) throw new Error("Relationship not found");
    return updated;
  }

  async getEmployeeCareerReport(employeeId: string): Promise<{
    employee: Employee;
    totalTenure: number;
    companiesWorked: number;
    longestTenure: { company: Company; days: number };
    currentPosition: string | null;
    careerHistory: (CompanyEmployee & { company: Company })[];
  }> {
    const employee = await this.getEmployee(employeeId);
    if (!employee) throw new Error("Employee not found");

    const careerHistory = await db.select()
      .from(companyEmployees)
      .leftJoin(companies, eq(companyEmployees.companyId, companies.id))
      .where(eq(companyEmployees.employeeId, employeeId))
      .orderBy(desc(companyEmployees.joinedAt));

    let totalTenure = 0;
    let longestTenure = { company: null as Company | null, days: 0 };
    let currentPosition: string | null = null;

    const history = careerHistory.map(row => {
      const relation = row.company_employees;
      const company = row.companies!;
      
      const startDate = relation.joinedAt;
      const endDate = relation.leftAt || new Date();
      const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      totalTenure += days;
      
      if (days > longestTenure.days) {
        longestTenure = { company, days };
      }
      
      if (relation.status === 'employed') {
        currentPosition = relation.position;
      }
      
      return {
        ...relation,
        company
      };
    });

    return {
      employee,
      totalTenure,
      companiesWorked: careerHistory.length,
      longestTenure: longestTenure as { company: Company; days: number },
      currentPosition,
      careerHistory: history
    };
  }

  async getCompanyEmployeeReport(companyId: string): Promise<{
    company: Company;
    currentEmployees: (CompanyEmployee & { employee: Employee })[];
    exEmployees: (CompanyEmployee & { employee: Employee })[];
    averageTenure: number;
    longestTenuredEmployee: { employee: Employee; days: number } | null;
    departmentCounts: Record<string, number>;
  }> {
    const company = await this.getCompany(companyId);
    if (!company) throw new Error("Company not found");

    const allRelations = await db.select()
      .from(companyEmployees)
      .leftJoin(employees, eq(companyEmployees.employeeId, employees.id))
      .where(eq(companyEmployees.companyId, companyId))
      .orderBy(desc(companyEmployees.joinedAt));

    const currentEmployees: (CompanyEmployee & { employee: Employee })[] = [];
    const exEmployees: (CompanyEmployee & { employee: Employee })[] = [];
    let totalTenureDays = 0;
    let longestTenuredEmployee: { employee: Employee; days: number } | null = null;
    const departmentCounts: Record<string, number> = {};

    allRelations.forEach(row => {
      const relation = row.company_employees;
      const employee = row.employees!;
      
      const startDate = relation.joinedAt;
      const endDate = relation.leftAt || new Date();
      const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      totalTenureDays += days;
      
      if (!longestTenuredEmployee || days > longestTenuredEmployee.days) {
        longestTenuredEmployee = { employee, days };
      }
      
      if (relation.department) {
        departmentCounts[relation.department] = (departmentCounts[relation.department] || 0) + 1;
      }
      
      const relationWithEmployee = { ...relation, employee };
      
      if (relation.status === 'employed') {
        currentEmployees.push(relationWithEmployee);
      } else {
        exEmployees.push(relationWithEmployee);
      }
    });

    const averageTenure = allRelations.length > 0 ? totalTenureDays / allRelations.length : 0;

    return {
      company,
      currentEmployees,
      exEmployees,
      averageTenure,
      longestTenuredEmployee,
      departmentCounts
    };
  }

  async getEmployeeCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(employees);
    return result?.count || 0;
  }

  async getCompanyCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(companies);
    return result?.count || 0;
  }

  async getJobListingCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(jobListings);
    return result?.count || 0;
  }

  async getActiveJobCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(jobListings)
      .where(eq(jobListings.status, 'active'));
    return result?.count || 0;
  }

  async getAdminCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(admins);
    return result?.count || 0;
  }

  async checkAdminExists(): Promise<boolean> {
    const count = await this.getAdminCount();
    return count > 0;
  }

  async deactivateEmployee(employeeId: string): Promise<void> {
    await db
      .update(employees)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(employees.id, employeeId));
  }

  async activateEmployee(employeeId: string): Promise<void> {
    await db
      .update(employees)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(employees.id, employeeId));
  }

  async deactivateCompany(companyId: string): Promise<void> {
    await db
      .update(companies)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(companies.id, companyId));
  }

  async activateCompany(companyId: string): Promise<void> {
    await db
      .update(companies)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(companies.id, companyId));
  }

  // Email verification operations
  async createEmailVerification(data: InsertEmailVerification): Promise<EmailVerification> {
    const [verification] = await db.insert(emailVerifications).values(data).returning();
    return verification;
  }

  async getEmailVerification(email: string, otpCode: string, purpose: string): Promise<EmailVerification | undefined> {
    const [verification] = await db.select().from(emailVerifications).where(
      and(
        eq(emailVerifications.email, email),
        eq(emailVerifications.otpCode, otpCode),
        eq(emailVerifications.purpose, purpose),
        eq(emailVerifications.isUsed, false)
      )
    );
    return verification || undefined;
  }

  async markEmailVerificationUsed(id: string): Promise<void> {
    await db.update(emailVerifications).set({ isUsed: true }).where(eq(emailVerifications.id, id));
  }

  async cleanupExpiredVerifications(): Promise<void> {
    await db.delete(emailVerifications).where(sql`expires_at < NOW()`);
  }

  async updateUserPassword(userId: string, userType: 'employee' | 'company', hashedPassword: string): Promise<void> {
    if (userType === 'employee') {
      await db.update(employees).set({ password: hashedPassword }).where(eq(employees.id, userId));
    } else {
      await db.update(companies).set({ password: hashedPassword }).where(eq(companies.id, userId));
    }
  }




  async markEmployeeEmailVerified(id: string): Promise<void> {
    await db.update(employees).set({ emailVerified: true, updatedAt: new Date() }).where(eq(employees.id, id));
  }

  async markCompanyEmailVerified(id: string): Promise<void> {
    await db.update(companies).set({ emailVerified: true, updatedAt: new Date() }).where(eq(companies.id, id));
  }

  async updateCompanyVerificationStatus(companyId: string, data: {
    verificationStatus: string;
    verificationMethod?: string;
    verificationNotes?: string;
    rejectionReason?: string;
  }): Promise<void> {
    await db
      .update(companies)
      .set({
        verificationStatus: data.verificationStatus,
        verificationMethod: data.verificationMethod,
        verificationNotes: data.verificationNotes,
        rejectionReason: data.rejectionReason,
        verificationDate: data.verificationStatus === 'verified' ? new Date() : null,
      })
      .where(eq(companies.id, companyId));
  }

  async getPendingVerifications(): Promise<Company[]> {
    return await db
      .select()
      .from(companies)
      .where(eq(companies.verificationStatus, 'pending'))
      .orderBy(desc(companies.createdAt));
  }

  async updateVerificationStatus(id: string, status: string, notes?: string, rejectionReason?: string): Promise<void> {
    const updateData: any = {
      verificationStatus: status,
      verificationNotes: notes || null,
      rejectionReason: rejectionReason || null,
      updatedAt: new Date()
    };

    if (status === 'verified') {
      updateData.verificationDate = new Date();
    }

    await db
      .update(companies)
      .set(updateData)
      .where(eq(companies.id, id));
  }

  // User feedback operations
  async createFeedback(feedback: InsertFeedback): Promise<UserFeedback> {
    const [newFeedback] = await db.insert(userFeedback).values(feedback).returning();
    return newFeedback;
  }

  async getAllFeedback(): Promise<UserFeedback[]> {
    return await db.select().from(userFeedback).orderBy(desc(userFeedback.createdAt));
  }

  async getFeedbackById(id: string): Promise<UserFeedback | undefined> {
    const [feedback] = await db.select().from(userFeedback).where(eq(userFeedback.id, id));
    return feedback;
  }

  async updateFeedbackStatus(id: string, status: string, adminResponse?: string, respondedBy?: string): Promise<UserFeedback> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (adminResponse) {
      updateData.adminResponse = adminResponse;
      updateData.respondedAt = new Date();
      updateData.respondedBy = respondedBy;
    }

    const [updatedFeedback] = await db
      .update(userFeedback)
      .set(updateData)
      .where(eq(userFeedback.id, id))
      .returning();
    
    return updatedFeedback;
  }

  async getFeedbackByStatus(status: string): Promise<UserFeedback[]> {
    return await db
      .select()
      .from(userFeedback)
      .where(eq(userFeedback.status, status))
      .orderBy(desc(userFeedback.createdAt));
  }

  async getFeedbackByType(feedbackType: string): Promise<UserFeedback[]> {
    return await db
      .select()
      .from(userFeedback)
      .where(eq(userFeedback.feedbackType, feedbackType))
      .orderBy(desc(userFeedback.createdAt));
  }

  async getFeedbackStats(): Promise<{
    total: number;
    new: number;
    inReview: number;
    inProgress: number;
    resolved: number;
    closed: number;
    byType: Record<string, number>;
  }> {
    const [totalResult] = await db.select({ count: count() }).from(userFeedback);
    const [newResult] = await db.select({ count: count() }).from(userFeedback).where(eq(userFeedback.status, 'new'));
    const [reviewResult] = await db.select({ count: count() }).from(userFeedback).where(eq(userFeedback.status, 'in_review'));
    const [progressResult] = await db.select({ count: count() }).from(userFeedback).where(eq(userFeedback.status, 'in_progress'));
    const [resolvedResult] = await db.select({ count: count() }).from(userFeedback).where(eq(userFeedback.status, 'resolved'));
    const [closedResult] = await db.select({ count: count() }).from(userFeedback).where(eq(userFeedback.status, 'closed'));
    
    const typeResults = await db
      .select({
        feedbackType: userFeedback.feedbackType,
        count: count()
      })
      .from(userFeedback)
      .groupBy(userFeedback.feedbackType);

    const byType: Record<string, number> = {};
    typeResults.forEach(result => {
      byType[result.feedbackType] = result.count;
    });

    return {
      total: totalResult.count,
      new: newResult.count,
      inReview: reviewResult.count,
      inProgress: progressResult.count,
      resolved: resolvedResult.count,
      closed: closedResult.count,
      byType
    };
  }

  // CIN verification operations
  async getCompaniesByCINVerificationStatus(status: string): Promise<Company[]> {
    return await db
      .select()
      .from(companies)
      .where(eq(companies.cinVerificationStatus, status))
      .orderBy(desc(companies.createdAt));
  }

  async updateCompanyCINVerification(companyId: string, data: {
    cinVerificationStatus: string;
    cinVerifiedAt: Date;
    cinVerifiedBy: string;
    isBasicDetailsLocked: boolean;
    verificationNotes?: string;
  }): Promise<Company> {
    const [updatedCompany] = await db
      .update(companies)
      .set({
        cinVerificationStatus: data.cinVerificationStatus,
        cinVerifiedAt: data.cinVerifiedAt,
        cinVerifiedBy: data.cinVerifiedBy,
        isBasicDetailsLocked: data.isBasicDetailsLocked,
        verificationNotes: data.verificationNotes,
        updatedAt: new Date()
      })
      .where(eq(companies.id, companyId))
      .returning();
    
    return updatedCompany;
  }

  // PAN verification operations
  async getCompaniesByPANVerificationStatus(status: string): Promise<Company[]> {
    return await db
      .select()
      .from(companies)
      .where(eq(companies.panVerificationStatus, status))
      .orderBy(desc(companies.createdAt));
  }

  async updateCompanyPANVerification(companyId: string, data: {
    panVerificationStatus: string;
    panVerifiedAt: Date;
    panVerifiedBy: string;
    isBasicDetailsLocked: boolean;
    verificationNotes?: string;
  }): Promise<Company> {
    const [updatedCompany] = await db
      .update(companies)
      .set({
        panVerificationStatus: data.panVerificationStatus,
        panVerifiedAt: data.panVerifiedAt,
        panVerifiedBy: data.panVerifiedBy,
        isBasicDetailsLocked: data.isBasicDetailsLocked,
        verificationNotes: data.verificationNotes,
        updatedAt: new Date()
      })
      .where(eq(companies.id, companyId))
      .returning();
    
    return updatedCompany;
  }

  // GST verification operations
  async getCompaniesByGSTVerificationStatus(status: string): Promise<Company[]> {
    return await db
      .select()
      .from(companies)
      .where(eq(companies.gstVerificationStatus, status))
      .orderBy(desc(companies.createdAt));
  }

  async updateCompanyGSTVerification(companyId: string, data: {
    gstVerificationStatus: string;
    gstVerifiedAt: Date;
    gstVerifiedBy: string;
    isBasicDetailsLocked: boolean;
    verificationNotes?: string;
  }): Promise<Company> {
    const [updatedCompany] = await db
      .update(companies)
      .set({
        gstVerificationStatus: data.gstVerificationStatus,
        gstVerifiedAt: data.gstVerifiedAt,
        gstVerifiedBy: data.gstVerifiedBy,
        isBasicDetailsLocked: data.isBasicDetailsLocked,
        verificationNotes: data.verificationNotes,
        updatedAt: new Date()
      })
      .where(eq(companies.id, companyId))
      .returning();
    
    return updatedCompany;
  }

  // Employee Summary Dashboard operations
  async getEmployeeSummaryDashboard(employeeId: string): Promise<{
    quickStats: {
      totalCompaniesWorked: number;
      totalApplicationsMade: number;
      totalWorkSummaries: number;
      totalLogins: number;
    };
    careerSummary: {
      currentCompany: { name: string; joinedAt: Date; position?: string } | null;
      pastCompanies: { name: string; joinedAt: Date; leftAt: Date; position?: string }[];
      totalCompanies: number;
    };
    applicationsSummary: {
      total: number;
      pending: number;
      shortlisted: number;
      interviewed: number;
      offered: number;
      rejected: number;
      recent: { jobTitle: string; companyName: string; status: string; appliedAt: Date }[];
    };
    workActivitySummary: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      recent: { title: string; companyName: string; status: string; createdAt: Date }[];
    };
    loginHistory: {
      total: number;
      recent: { loginAt: Date; deviceType?: string; location?: string }[];
    };
  }> {
    try {
      // Get total companies worked count
      const companyRelations = await db
        .select({
          companyId: companyEmployees.companyId,
          companyName: companies.name,
          joinedAt: companyEmployees.joinedAt,
          leftAt: companyEmployees.leftAt,
          status: companyEmployees.status,
          position: companyEmployees.position
        })
        .from(companyEmployees)
        .leftJoin(companies, eq(companyEmployees.companyId, companies.id))
        .where(eq(companyEmployees.employeeId, employeeId))
        .orderBy(desc(companyEmployees.joinedAt));

      const totalCompaniesWorked = companyRelations.length;
      
      // Separate current and past companies
      let currentCompany = null;
      const pastCompanies = [];
      
      for (const relation of companyRelations) {
        if (relation.companyName && relation.joinedAt) {
          if (relation.status === 'employed') {
            currentCompany = {
              name: relation.companyName,
              joinedAt: relation.joinedAt,
              position: relation.position || undefined
            };
          } else if (relation.leftAt) {
            pastCompanies.push({
              name: relation.companyName,
              joinedAt: relation.joinedAt,
              leftAt: relation.leftAt,
              position: relation.position || undefined
            });
          }
        }
      }

    // Get job applications statistics
    const [totalAppsResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(jobApplications)
      .where(eq(jobApplications.employeeId, employeeId));

    const totalApplicationsMade = totalAppsResult?.count || 0;

    // Get applications by status
    const applicationsByStatus = await db
      .select({
        status: jobApplications.status,
        count: sql<number>`COUNT(*)`
      })
      .from(jobApplications)
      .where(eq(jobApplications.employeeId, employeeId))
      .groupBy(jobApplications.status);

    const statusCounts = {
      pending: 0,
      shortlisted: 0,
      interviewed: 0,
      offered: 0,
      rejected: 0
    };

    applicationsByStatus.forEach(row => {
      if (row.status in statusCounts) {
        statusCounts[row.status as keyof typeof statusCounts] = row.count;
      }
    });

    // Get recent job applications
    const recentApplications = await db
      .select({
        jobTitle: jobListings.title,
        companyName: companies.name,
        status: jobApplications.status,
        appliedAt: jobApplications.appliedAt
      })
      .from(jobApplications)
      .leftJoin(jobListings, eq(jobApplications.jobId, jobListings.id))
      .leftJoin(companies, eq(jobListings.companyId, companies.id))
      .where(eq(jobApplications.employeeId, employeeId))
      .orderBy(desc(jobApplications.appliedAt))
      .limit(5);

    // Get work entries statistics
    const [totalWorkResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(workEntries)
      .where(eq(workEntries.employeeId, employeeId));

    const totalWorkSummaries = totalWorkResult?.count || 0;

    // Get work entries by status
    const workByStatus = await db
      .select({
        status: workEntries.status,
        count: sql<number>`COUNT(*)`
      })
      .from(workEntries)
      .where(eq(workEntries.employeeId, employeeId))
      .groupBy(workEntries.status);

    const workStatusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0
    };

    workByStatus.forEach(row => {
      if (row.status in workStatusCounts) {
        workStatusCounts[row.status as keyof typeof workStatusCounts] = row.count;
      }
    });

    // Get recent work entries
    const recentWork = await db
      .select({
        title: workEntries.title,
        companyName: companies.name,
        status: workEntries.status,
        createdAt: workEntries.createdAt
      })
      .from(workEntries)
      .leftJoin(companies, eq(workEntries.companyId, companies.id))
      .where(eq(workEntries.employeeId, employeeId))
      .orderBy(desc(workEntries.createdAt))
      .limit(5);

    // Get login sessions statistics
    const [totalLoginsResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(loginSessions)
      .where(and(
        eq(loginSessions.userId, employeeId),
        eq(loginSessions.userType, 'employee')
      ));

    const totalLogins = totalLoginsResult?.count || 0;

    // Get recent login sessions
    const recentLogins = await db
      .select({
        loginAt: loginSessions.loginAt,
        deviceType: loginSessions.deviceType,
        location: loginSessions.location
      })
      .from(loginSessions)
      .where(and(
        eq(loginSessions.userId, employeeId),
        eq(loginSessions.userType, 'employee')
      ))
      .orderBy(desc(loginSessions.loginAt))
      .limit(5);

      return {
        quickStats: {
          totalCompaniesWorked,
          totalApplicationsMade,
          totalWorkSummaries,
          totalLogins
        },
        careerSummary: {
          currentCompany,
          pastCompanies,
          totalCompanies: totalCompaniesWorked
        },
        applicationsSummary: {
          total: totalApplicationsMade,
          pending: statusCounts.pending,
          shortlisted: statusCounts.shortlisted,
          interviewed: statusCounts.interviewed,
          offered: statusCounts.offered,
          rejected: statusCounts.rejected,
          recent: recentApplications.map(app => ({
            jobTitle: app.jobTitle || 'Unknown Position',
            companyName: app.companyName || 'Unknown Company',
            status: app.status,
            appliedAt: app.appliedAt || new Date()
          }))
        },
        workActivitySummary: {
          total: totalWorkSummaries,
          pending: workStatusCounts.pending,
          approved: workStatusCounts.approved,
          rejected: workStatusCounts.rejected,
          recent: recentWork.map(work => ({
            title: work.title,
            companyName: work.companyName || 'Unknown Company',
            status: work.status,
            createdAt: work.createdAt || new Date()
          }))
        },
        loginHistory: {
          total: totalLogins,
          recent: recentLogins.map(login => ({
            loginAt: login.loginAt || new Date(),
            deviceType: login.deviceType || undefined,
            location: login.location || undefined
          }))
        }
      };
    } catch (error) {
      console.error("Employee summary dashboard error:", error);
      // Return empty dashboard data on error
      return {
        quickStats: {
          totalCompaniesWorked: 0,
          totalApplicationsMade: 0,
          totalWorkSummaries: 0,
          totalLogins: 0
        },
        careerSummary: {
          currentCompany: null,
          pastCompanies: [],
          totalCompanies: 0
        },
        applicationsSummary: {
          total: 0,
          pending: 0,
          shortlisted: 0,
          interviewed: 0,
          offered: 0,
          rejected: 0,
          recent: []
        },
        workActivitySummary: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          recent: []
        },
        loginHistory: {
          total: 0,
          recent: []
        }
      };
    }
  }

  // Login session operations
  async createLoginSession(sessionData: InsertLoginSession): Promise<LoginSession> {
    const [session] = await db.insert(loginSessions).values(sessionData).returning();
    return session;
  }

  async getLoginSessions(userId: string, userType: string): Promise<LoginSession[]> {
    return await db
      .select()
      .from(loginSessions)
      .where(and(
        eq(loginSessions.userId, userId),
        eq(loginSessions.userType, userType)
      ))
      .orderBy(desc(loginSessions.loginAt));
  }

  async updateLoginSession(sessionId: string, data: Partial<LoginSession>): Promise<LoginSession> {
    const [updatedSession] = await db
      .update(loginSessions)
      .set(data)
      .where(eq(loginSessions.sessionId, sessionId))
      .returning();
    return updatedSession;
  }

  async getLoginSessionsCount(userId: string, userType: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(loginSessions)
      .where(and(
        eq(loginSessions.userId, userId),
        eq(loginSessions.userType, userType)
      ));
    return result?.count || 0;
  }

  // Skills operations
  async getTrendingSkills(params: {
    limit?: number;
    location?: string;
    role?: string;
    experience?: string;
  } = {}): Promise<(Skill & SkillTrend)[]> {
    const { limit = 20 } = params;
    
    return await db
      .select()
      .from(skills)
      .innerJoin(skillTrends, eq(skills.id, skillTrends.skillId))
      .orderBy(desc(skillTrends.trendingScore))
      .limit(limit);
  }

  async getPersonalizedTrendingSkills(userId: string, params: {
    limit?: number;
    location?: string;
    role?: string;
    experience?: string;
  } = {}): Promise<(Skill & SkillTrend & { isPinned?: boolean; isFromProfile?: boolean })[]> {
    const { limit = 20 } = params;
    
    // Get user preferences
    const userPrefs = await db
      .select()
      .from(userSkillPreferences)
      .where(eq(userSkillPreferences.userId, userId));
    
    const pinnedSkillIds = userPrefs.filter(p => p.isPinned).map(p => p.skillId);
    const hiddenSkillIds = userPrefs.filter(p => p.isHidden).map(p => p.skillId);
    
    // Get employee profile skills
    const employee = await db
      .select({ skills: employees.skills })
      .from(employees)
      .where(eq(employees.id, userId))
      .limit(1);
    
    const profileSkills = employee[0]?.skills || [];
    
    // Get trending skills excluding hidden ones
    let query = db
      .select()
      .from(skills)
      .innerJoin(skillTrends, eq(skills.id, skillTrends.skillId));
    
    if (hiddenSkillIds.length > 0) {
      query = query.where(sql`${skills.id} NOT IN (${hiddenSkillIds.map(id => `'${id}'`).join(',')})`);
    }
    
    const trendingSkills = await query
      .orderBy(desc(skillTrends.trendingScore))
      .limit(limit * 2); // Get more to allow for personalization
    
    // Enhance with personalization flags
    const enhancedSkills = trendingSkills.map((skill: any) => ({
      ...skill.skills,
      ...skill.skill_trends,
      isPinned: pinnedSkillIds.includes(skill.skills.id),
      isFromProfile: profileSkills.some((ps: string) => 
        ps.toLowerCase().includes(skill.skills.name.toLowerCase()) ||
        skill.skills.aliases?.some((alias: string) => ps.toLowerCase().includes(alias.toLowerCase()))
      )
    }));
    
    // Sort: pinned first, then profile skills, then by trending score
    enhancedSkills.sort((a: any, b: any) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.isFromProfile && !b.isFromProfile) return -1;
      if (!a.isFromProfile && b.isFromProfile) return 1;
      return parseFloat(b.trendingScore) - parseFloat(a.trendingScore);
    });
    
    return enhancedSkills.slice(0, limit);
  }

  async pinSkill(userId: string, skillId: string): Promise<UserSkillPreference> {
    const [preference] = await db
      .insert(userSkillPreferences)
      .values({
        userId,
        skillId,
        isPinned: true,
        isHidden: false
      })
      .onConflictDoUpdate({
        target: userSkillPreferences.id,
        set: {
          isPinned: true,
          isHidden: false,
          updatedAt: new Date()
        }
      })
      .returning();
    
    return preference;
  }

  async hideSkill(userId: string, skillId: string): Promise<UserSkillPreference> {
    const [preference] = await db
      .insert(userSkillPreferences)
      .values({
        userId,
        skillId,
        isPinned: false,
        isHidden: true
      })
      .onConflictDoUpdate({
        target: userSkillPreferences.id,
        set: {
          isPinned: false,
          isHidden: true,
          updatedAt: new Date()
        }
      })
      .returning();
    
    return preference;
  }

  async searchSkills(query: string, limit: number = 50): Promise<Skill[]> {
    return await db
      .select()
      .from(skills)
      .where(
        or(
          like(skills.name, `%${query}%`),
          like(skills.description, `%${query}%`),
          sql`${skills.aliases} && ARRAY[${query}]`
        )
      )
      .limit(limit);
  }

  async logSkillAnalytics(data: InsertSkillAnalytic): Promise<SkillAnalytic> {
    const [analytics] = await db
      .insert(skillAnalytics)
      .values(data)
      .returning();
    
    return analytics;
  }

  async getSkillById(skillId: string): Promise<Skill | undefined> {
    const [skill] = await db
      .select()
      .from(skills)
      .where(eq(skills.id, skillId))
      .limit(1);
    
    return skill;
  }

  async getSkillBySlug(slug: string): Promise<Skill | undefined> {
    const [skill] = await db
      .select()
      .from(skills)
      .where(eq(skills.slug, slug))
      .limit(1);
    
    return skill;
  }

  async getUserSkillPreferences(userId: string): Promise<UserSkillPreference[]> {
    return await db
      .select()
      .from(userSkillPreferences)
      .where(eq(userSkillPreferences.userId, userId));
  }

  async updateSkillTrends(skillId: string, data: Partial<InsertSkillTrend>): Promise<SkillTrend> {
    const [trend] = await db
      .insert(skillTrends)
      .values({
        skillId,
        ...data
      })
      .onConflictDoUpdate({
        target: skillTrends.skillId,
        set: {
          ...data,
          updatedAt: new Date()
        }
      })
      .returning();
    
    return trend;
  }

  // Pending Users Methods for Signup Verification
  async createPendingUser(data: InsertPendingUser): Promise<PendingUser> {
    const [pendingUser] = await db
      .insert(pendingUsers)
      .values(data)
      .returning();
    return pendingUser;
  }

  async getPendingUserByEmail(email: string): Promise<PendingUser | undefined> {
    const [pendingUser] = await db
      .select()
      .from(pendingUsers)
      .where(eq(pendingUsers.email, email));
    return pendingUser;
  }

  async getPendingUserByToken(token: string): Promise<PendingUser | undefined> {
    const [pendingUser] = await db
      .select()
      .from(pendingUsers)
      .where(eq(pendingUsers.verificationToken, token));
    return pendingUser;
  }

  async updatePendingUser(id: string, data: Partial<InsertPendingUser>): Promise<PendingUser> {
    const [pendingUser] = await db
      .update(pendingUsers)
      .set(data)
      .where(eq(pendingUsers.id, id))
      .returning();
    return pendingUser;
  }

  async deletePendingUser(id: string): Promise<void> {
    await db
      .delete(pendingUsers)
      .where(eq(pendingUsers.id, id));
  }

  async deleteExpiredPendingUsers(): Promise<number> {
    const result = await db
      .delete(pendingUsers)
      .where(lt(pendingUsers.tokenExpiry, new Date()));
    return result.rowCount || 0;
  }

  // ==================== HIERARCHICAL COMPANY STRUCTURE IMPLEMENTATION ====================
  
  // Company Branch operations (for HDFC Surat, HDFC Mumbai, etc.)
  async getCompanyBranches(companyId: string): Promise<CompanyBranch[]> {
    return await db
      .select()
      .from(companyBranches)
      .where(eq(companyBranches.companyId, companyId))
      .orderBy(asc(companyBranches.name));
  }

  async getCompanyBranch(branchId: string): Promise<CompanyBranch | undefined> {
    const [branch] = await db
      .select()
      .from(companyBranches)
      .where(eq(companyBranches.id, branchId));
    return branch || undefined;
  }

  async createCompanyBranch(branchData: InsertCompanyBranch): Promise<CompanyBranch> {
    // Generate unique branch ID
    let branchId = generateBranchId();
    let attempts = 0;
    const maxAttempts = 10;
  
    while (attempts < maxAttempts) {
      const existing = await db.select().from(companyBranches).where(eq(companyBranches.branchId, branchId));
      if (existing.length === 0) {
        break;
      }
      branchId = generateBranchId();
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique branch ID");
    }

    const [branch] = await db
      .insert(companyBranches)
      .values({
        ...branchData,
        branchId,
      })
      .returning();
    return branch;
  }

  async updateCompanyBranch(branchId: string, data: Partial<CompanyBranch>): Promise<CompanyBranch> {
    const [branch] = await db
      .update(companyBranches)
      .set(data)
      .where(eq(companyBranches.id, branchId))
      .returning();
    return branch;
  }

  async deleteCompanyBranch(branchId: string): Promise<void> {
    await db
      .delete(companyBranches)
      .where(eq(companyBranches.id, branchId));
  }

  // Company Team operations (for teams within branches)
  async getCompanyTeams(companyId: string, branchId?: string): Promise<CompanyTeam[]> {
    let query = db
      .select()
      .from(companyTeams)
      .where(eq(companyTeams.companyId, companyId));
    
    if (branchId) {
      query = query.where(eq(companyTeams.branchId, branchId));
    }
    
    return await query.orderBy(asc(companyTeams.name));
  }

  async getCompanyTeam(teamId: string): Promise<CompanyTeam | undefined> {
    const [team] = await db
      .select()
      .from(companyTeams)
      .where(eq(companyTeams.id, teamId));
    return team || undefined;
  }

  async createCompanyTeam(teamData: InsertCompanyTeam): Promise<CompanyTeam> {
    // Generate unique team ID
    let teamId = generateTeamId();
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const existing = await db.select().from(companyTeams).where(eq(companyTeams.teamId, teamId));
      if (existing.length === 0) {
        break;
      }
      teamId = generateTeamId();
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique team ID");
    }

    const [team] = await db
      .insert(companyTeams)
      .values({
        ...teamData,
        teamId,
      })
      .returning();
    return team;
  }

  async updateCompanyTeam(teamId: string, data: Partial<CompanyTeam>): Promise<CompanyTeam> {
    const [team] = await db
      .update(companyTeams)
      .set(data)
      .where(eq(companyTeams.id, teamId))
      .returning();
    return team;
  }

  async deleteCompanyTeam(teamId: string): Promise<void> {
    // First, remove all employees from this team to avoid foreign key constraints
    await this.removeAllEmployeesFromTeam(teamId);
    
    // Then safely delete the team
    await db
      .delete(companyTeams)
      .where(eq(companyTeams.id, teamId));
  }

  async removeAllEmployeesFromTeam(teamId: string): Promise<void> {
    // Remove from team_members table
    await db
      .delete(teamMembers)
      .where(eq(teamMembers.teamId, teamId));
    
    // Remove team assignment from company_employees table
    await db
      .update(companyEmployees)
      .set({ 
        teamId: null,
        assignedManagerId: null,
        updatedAt: new Date()
      })
      .where(eq(companyEmployees.teamId, teamId));

    // IMPORTANT: Preserve work entries for company visibility
    // Set team_id to null in work entries but keep all other data intact
    // Work entries belong to the company and should remain visible in company work diary
    await db
      .update(workEntries)
      .set({ 
        teamId: null,
        updatedAt: new Date()
      })
      .where(eq(workEntries.teamId, teamId));
  }

  async getTeamMembers(teamId: string): Promise<CompanyEmployee[]> {
    return await db
      .select()
      .from(companyEmployees)
      .where(eq(companyEmployees.teamId, teamId))
      .orderBy(asc(companyEmployees.joinedAt));
  }

  // Enhanced CompanyEmployee operations with hierarchy
  async getEmployeeHierarchyInfo(employeeId: string, companyId: string): Promise<{
    employee: Employee;
    companyRole: CompanyEmployee;
    branch?: CompanyBranch;
    team?: CompanyTeam;
    permissions: {
      canVerifyWork: boolean;
      canManageEmployees: boolean;
      canCreateTeams: boolean;
      verificationScope: string;
    };
  } | null> {
    try {
      // Get employee and company relationship
      const [employee] = await db.select().from(employees).where(eq(employees.id, employeeId));
      if (!employee) return null;

      const [companyRole] = await db
        .select()
        .from(companyEmployees)
        .where(and(
          eq(companyEmployees.employeeId, employeeId),
          eq(companyEmployees.companyId, companyId)
        ));
      if (!companyRole) return null;

      // Get branch info if applicable
      let branch: CompanyBranch | undefined;
      if (companyRole.branchId) {
        const [branchResult] = await db
          .select()
          .from(companyBranches)
          .where(eq(companyBranches.id, companyRole.branchId));
        branch = branchResult || undefined;
      }

      // Get team info if applicable
      let team: CompanyTeam | undefined;
      if (companyRole.teamId) {
        const [teamResult] = await db
          .select()
          .from(companyTeams)
          .where(eq(companyTeams.id, companyRole.teamId));
        team = teamResult || undefined;
      }

      // Calculate permissions based on hierarchy role
      const permissions = {
        canVerifyWork: companyRole.canVerifyWork || false,
        canManageEmployees: companyRole.canManageEmployees || false,
        canCreateTeams: companyRole.canCreateTeams || false,
        verificationScope: companyRole.verificationScope || "none"
      };

      return {
        employee,
        companyRole,
        branch,
        team,
        permissions
      };
    } catch (error) {
      console.error("Error getting employee hierarchy info:", error);
      return null;
    }
  }

  // Role-based verification methods
  async canEmployeeVerifyWork(verifierId: string, employeeId: string, companyId: string): Promise<boolean> {
    try {
      const verifierInfo = await this.getEmployeeHierarchyInfo(verifierId, companyId);
      const employeeInfo = await this.getEmployeeHierarchyInfo(employeeId, companyId);

      if (!verifierInfo || !employeeInfo) return false;

      // Company admin can verify anyone
      if (verifierInfo.companyRole.hierarchyRole === "company_admin") {
        return true;
      }

      // Branch manager can verify employees in their branch
      if (verifierInfo.companyRole.hierarchyRole === "branch_manager" && 
          verifierInfo.companyRole.branchId === employeeInfo.companyRole.branchId) {
        return true;
      }

      // Team lead can verify employees in their team
      if (verifierInfo.companyRole.hierarchyRole === "team_lead" && 
          verifierInfo.companyRole.teamId === employeeInfo.companyRole.teamId) {
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking verification permissions:", error);
      return false;
    }
  }

  async getEmployeesVerifiableByUser(verifierId: string, companyId: string): Promise<CompanyEmployee[]> {
    try {
      const verifierInfo = await this.getEmployeeHierarchyInfo(verifierId, companyId);
      if (!verifierInfo) return [];

      let query = db.select().from(companyEmployees).where(eq(companyEmployees.companyId, companyId));

      // Filter based on verification scope
      switch (verifierInfo.companyRole.hierarchyRole) {
        case "company_admin":
          // Can verify all employees in company
          break;
        case "branch_manager":
          // Can verify employees in their branch
          if (verifierInfo.companyRole.branchId) {
            query = query.where(eq(companyEmployees.branchId, verifierInfo.companyRole.branchId));
          }
          break;
        case "team_lead":
          // Can verify employees in their team
          if (verifierInfo.companyRole.teamId) {
            query = query.where(eq(companyEmployees.teamId, verifierInfo.companyRole.teamId));
          }
          break;
        default:
          return []; // Regular employees can't verify others
      }

      return await query;
    } catch (error) {
      console.error("Error getting verifiable employees:", error);
      return [];
    }
  }

  // Hierarchical work entry operations with verification tracking
  async createWorkEntryWithHierarchy(workEntryData: InsertWorkEntry & {
    branchId?: string;
    teamId?: string;
  }): Promise<WorkEntry> {
    const [workEntry] = await db
      .insert(workEntries)
      .values(workEntryData)
      .returning();
    return workEntry;
  }

  async verifyWorkEntryHierarchical(workEntryId: string, verifierId: string, data: {
    approvalStatus: "approved" | "needs_changes";
    companyRating?: number;
    companyFeedback?: string;
  }): Promise<WorkEntry> {
    // Get verifier hierarchy info for proper attribution
    const verifierInfo = await this.getEmployeeHierarchyInfo(verifierId, ""); // Company ID will be derived from work entry
    
    const [workEntry] = await db
      .update(workEntries)
      .set({
        ...data,
        verifiedBy: verifierId,
        verifiedAt: new Date(),
        // Store hierarchy context for dual display system
        verifiedByRole: verifierInfo?.companyRole.hierarchyRole,
        verifiedByName: verifierInfo ? `${verifierInfo.employee.firstName} ${verifierInfo.employee.lastName}` : undefined
      })
      .where(eq(workEntries.id, workEntryId))
      .returning();
    
    return workEntry;
  }

  async getWorkEntriesWithHierarchy(options: {
    employeeId?: string;
    companyId?: string;
    branchId?: string;
    teamId?: string;
    verifierId?: string;
    includeHierarchyInfo?: boolean;
  }): Promise<(WorkEntry & {
    employee?: Employee;
    company?: Company;
    branch?: CompanyBranch;
    team?: CompanyTeam;
    verifier?: Employee;
    externalCompanyDisplay?: string; // "HDFC" for external view
    internalVerificationDisplay?: string; // "Manager X, HDFC Surat" for internal view
  })[]> {
    try {
      let query = db.select().from(workEntries);

      // Apply filters
      const conditions = [];
      if (options.employeeId) conditions.push(eq(workEntries.employeeId, options.employeeId));
      if (options.companyId) conditions.push(eq(workEntries.companyId, options.companyId));
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const workEntryResults = await query.orderBy(desc(workEntries.createdAt));

      if (!options.includeHierarchyInfo) {
        return workEntryResults;
      }

      // Enhance with hierarchy information
      const enhancedResults = await Promise.all(
        workEntryResults.map(async (workEntry) => {
          const enhanced: any = { ...workEntry };

          // Get employee info
          if (workEntry.employeeId) {
            const [employee] = await db.select().from(employees).where(eq(employees.id, workEntry.employeeId));
            enhanced.employee = employee;
          }

          // Get company info
          if (workEntry.companyId) {
            const [company] = await db.select().from(companies).where(eq(companies.id, workEntry.companyId));
            enhanced.company = company;
            enhanced.externalCompanyDisplay = company?.name; // External display: "HDFC"
          }

          // Get verifier info for internal display
          if (workEntry.verifiedBy) {
            const [verifier] = await db.select().from(employees).where(eq(employees.id, workEntry.verifiedBy));
            enhanced.verifier = verifier;

            // Build internal verification display: "Manager X, HDFC Surat Branch"
            if (verifier && enhanced.company) {
              let internalDisplay = verifier.name || verifier.email;
              
              // Add branch/team context if available
              if (workEntry.verifierBranchId) {
                const [branch] = await db.select().from(companyBranches).where(eq(companyBranches.id, workEntry.verifierBranchId));
                if (branch) {
                  internalDisplay += `, ${enhanced.company.name} ${branch.name}`;
                  enhanced.branch = branch;
                }
              } else if (workEntry.verifierTeamId) {
                const [team] = await db.select().from(companyTeams).where(eq(companyTeams.id, workEntry.verifierTeamId));
                if (team) {
                  internalDisplay += `, ${team.name}`;
                  enhanced.team = team;
                }
              } else {
                internalDisplay += `, ${enhanced.company.name}`;
              }

              enhanced.internalVerificationDisplay = internalDisplay;
            }
          }

          return enhanced;
        })
      );

      return enhancedResults;
    } catch (error) {
      console.error("Error getting work entries with hierarchy:", error);
      return [];
    }
  }

  // Company hierarchy reporting
  async getCompanyHierarchyStructure(companyId: string): Promise<{
    company: Company;
    branches: (CompanyBranch & {
      teams: (CompanyTeam & {
        members: CompanyEmployee[];
        teamLead?: Employee;
      })[];
      employeeCount: number;
    })[];
    headquarterTeams: (CompanyTeam & {
      members: CompanyEmployee[];
      teamLead?: Employee;
    })[];
    totalEmployees: number;
    totalBranches: number;
    totalTeams: number;
  }> {
    try {
      // Get company info
      const [company] = await db.select().from(companies).where(eq(companies.id, companyId));
      if (!company) throw new Error("Company not found");

      // Get all branches
      const branches = await this.getCompanyBranches(companyId);

      // Get branch teams and employees
      const branchesWithDetails = await Promise.all(
        branches.map(async (branch) => {
          const teams = await this.getCompanyTeams(companyId, branch.id);
          const teamsWithMembers = await Promise.all(
            teams.map(async (team) => {
              const members = await this.getTeamMembers(team.id);
              let teamLead: Employee | undefined;
              
              // Find team lead
              const leadMember = members.find(m => m.hierarchyRole === "team_lead");
              if (leadMember) {
                const [employee] = await db.select().from(employees).where(eq(employees.id, leadMember.employeeId));
                teamLead = employee;
              }
              
              return { ...team, members, teamLead };
            })
          );

          // Count total employees in branch
          const [employeeCount] = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(companyEmployees)
            .where(eq(companyEmployees.branchId, branch.id));

          return {
            ...branch,
            teams: teamsWithMembers,
            employeeCount: employeeCount?.count || 0
          };
        })
      );

      // Get headquarters teams (teams not assigned to any branch)
      const headquarterTeams = await db
        .select()
        .from(companyTeams)
        .where(and(
          eq(companyTeams.companyId, companyId),
          sql`${companyTeams.branchId} IS NULL`
        ));

      const hqTeamsWithMembers = await Promise.all(
        headquarterTeams.map(async (team) => {
          const members = await this.getTeamMembers(team.id);
          let teamLead: Employee | undefined;
          
          const leadMember = members.find(m => m.hierarchyRole === "team_lead");
          if (leadMember) {
            const [employee] = await db.select().from(employees).where(eq(employees.id, leadMember.employeeId));
            teamLead = employee;
          }
          
          return { ...team, members, teamLead };
        })
      );

      // Get total counts
      const [totalEmployeesResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(companyEmployees)
        .where(eq(companyEmployees.companyId, companyId));

      const [totalTeamsResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(companyTeams)
        .where(eq(companyTeams.companyId, companyId));

      return {
        company,
        branches: branchesWithDetails,
        headquarterTeams: hqTeamsWithMembers,
        totalEmployees: totalEmployeesResult?.count || 0,
        totalBranches: branches.length,
        totalTeams: totalTeamsResult?.count || 0
      };
    } catch (error) {
      console.error("Error getting company hierarchy structure:", error);
      throw error;
    }
  }

  // Permission management
  async updateEmployeeHierarchyRole(employeeId: string, companyId: string, updates: {
    hierarchyRole?: "company_admin" | "branch_manager" | "team_lead" | "employee";
    canVerifyWork?: boolean;
    canManageEmployees?: boolean;
    canCreateTeams?: boolean;
    verificationScope?: "none" | "team" | "branch" | "company";
    branchId?: string;
    teamId?: string;
  }): Promise<CompanyEmployee> {
    // If teamId is being updated, automatically set the assignedManagerId
    const finalUpdates = { ...updates };
    
    if (updates.teamId !== undefined) {
      if (updates.teamId === null || updates.teamId === "") {
        // Employee removed from team - clear manager assignment
        finalUpdates.assignedManagerId = null;
      } else {
        // Employee assigned to team - get team's manager
        try {
          const [team] = await db
            .select({ teamManagerId: companyTeams.teamManagerId })
            .from(companyTeams)
            .where(eq(companyTeams.id, updates.teamId));
          
          if (team?.teamManagerId) {
            finalUpdates.assignedManagerId = team.teamManagerId;
          }
        } catch (error) {
          console.error("Error getting team manager for assignment:", error);
          // Continue with update even if manager lookup fails
        }
      }
    }
    
    const [updatedRole] = await db
      .update(companyEmployees)
      .set(finalUpdates)
      .where(and(
        eq(companyEmployees.employeeId, employeeId),
        eq(companyEmployees.companyId, companyId)
      ))
      .returning();
    
    return updatedRole;
  }
  // Work verification methods

  async getAllWorkEntries(userId: string): Promise<any[]> {
    try {
      const query = db
        .select({
          id: workEntries.id,
          employeeId: workEntries.employeeId,
          title: workEntries.title,
          description: workEntries.description,
          date: workEntries.date,
          hoursWorked: workEntries.hoursWorked,
          category: workEntries.category,
          status: workEntries.status,
          verificationNote: workEntries.verificationNote,
          verifiedBy: workEntries.verifiedBy,
          verifiedByRole: workEntries.verifiedByRole,
          verifiedByName: workEntries.verifiedByName,
          createdAt: workEntries.createdAt,
          updatedAt: workEntries.updatedAt,
          employee: {
            firstName: employees.firstName,
            lastName: employees.lastName,
            email: employees.email
          }
        })
        .from(workEntries)
        .leftJoin(employees, eq(workEntries.employeeId, employees.id))
        .where(eq(workEntries.employeeId, userId))
        .orderBy(desc(workEntries.date));

      return await query;
    } catch (error) {
      console.error('Error fetching work entries:', error);
      throw new Error('Failed to fetch work entries');
    }
  }

  async getCompanyWorkEntries(companyId: string): Promise<any[]> {
    try {
      const query = db
        .select({
          id: workEntries.id,
          employeeId: workEntries.employeeId,
          title: workEntries.title,
          description: workEntries.description,
          date: workEntries.date,
          hoursWorked: workEntries.hoursWorked,
          category: workEntries.category,
          status: workEntries.status,
          verificationNote: workEntries.verificationNote,
          verifiedBy: workEntries.verifiedBy,
          verifiedByRole: workEntries.verifiedByRole,
          verifiedByName: workEntries.verifiedByName,
          createdAt: workEntries.createdAt,
          updatedAt: workEntries.updatedAt,
          employee: {
            firstName: employees.firstName,
            lastName: employees.lastName,
            email: employees.email
          }
        })
        .from(workEntries)
        .leftJoin(employees, eq(workEntries.employeeId, employees.id))
        .leftJoin(companyEmployees, eq(workEntries.employeeId, companyEmployees.employeeId))
        .where(eq(companyEmployees.companyId, companyId))
        .orderBy(desc(workEntries.date));

      return await query;
    } catch (error) {
      console.error('Error fetching company work entries:', error);
      throw new Error('Failed to fetch company work entries');
    }
  }

  async getPendingWorkVerifications(userId: string): Promise<any[]> {
    try {
      // Get user's company employee relation to determine verification scope
      const userEmployee = await db
        .select()
        .from(companyEmployees)
        .where(eq(companyEmployees.employeeId, userId))
        .limit(1);

      if (!userEmployee.length) {
        return [];
      }

      const { companyId, hierarchyRole, branchId, teamId } = userEmployee[0];

      // Build base query for pending work entries
      const baseQuery = db
        .select({
          id: workEntries.id,
          employeeId: workEntries.employeeId,
          title: workEntries.title,
          description: workEntries.description,
          date: workEntries.date,
          hoursWorked: workEntries.hoursWorked,
          category: workEntries.category,
          status: workEntries.status,
          createdAt: workEntries.createdAt,
          employee: {
            firstName: employees.firstName,
            lastName: employees.lastName,
            email: employees.email
          }
        })
        .from(workEntries)
        .leftJoin(employees, eq(workEntries.employeeId, employees.id))
        .leftJoin(companyEmployees, eq(workEntries.employeeId, companyEmployees.employeeId))
        .where(and(
          eq(workEntries.status, 'pending'),
          eq(companyEmployees.companyId, companyId)
        ));

      // Apply scope based on hierarchy role
      if (hierarchyRole === 'team_lead' && teamId) {
        return await baseQuery
          .where(and(
            eq(workEntries.status, 'pending'),
            eq(companyEmployees.companyId, companyId),
            eq(companyEmployees.teamId, teamId)
          ))
          .orderBy(desc(workEntries.createdAt));
      } else if (hierarchyRole === 'branch_manager' && branchId) {
        return await baseQuery
          .where(and(
            eq(workEntries.status, 'pending'),
            eq(companyEmployees.companyId, companyId),
            eq(companyEmployees.branchId, branchId)
          ))
          .orderBy(desc(workEntries.createdAt));
      } else if (hierarchyRole === 'company_admin') {
        return await baseQuery.orderBy(desc(workEntries.createdAt));
      }

      return [];
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      throw new Error('Failed to fetch pending verifications');
    }
  }

  async getCompanyPendingVerifications(companyId: string): Promise<any[]> {
    try {
      const query = db
        .select({
          id: workEntries.id,
          employeeId: workEntries.employeeId,
          title: workEntries.title,
          description: workEntries.description,
          date: workEntries.date,
          hoursWorked: workEntries.hoursWorked,
          category: workEntries.category,
          status: workEntries.status,
          createdAt: workEntries.createdAt,
          employee: {
            firstName: employees.firstName,
            lastName: employees.lastName,
            email: employees.email
          }
        })
        .from(workEntries)
        .leftJoin(employees, eq(workEntries.employeeId, employees.id))
        .leftJoin(companyEmployees, eq(workEntries.employeeId, companyEmployees.employeeId))
        .where(and(
          eq(workEntries.status, 'pending'),
          eq(companyEmployees.companyId, companyId)
        ))
        .orderBy(desc(workEntries.createdAt));

      return await query;
    } catch (error) {
      console.error('Error fetching company pending verifications:', error);
      throw new Error('Failed to fetch company pending verifications');
    }
  }

  async canEmployeeVerifyWork(employeeId: string, workEntryId: string): Promise<boolean> {
    try {
      // Check if employee has verification permissions in hierarchy
      const employeeRole = await db
        .select({
          hierarchyRole: companyEmployees.hierarchyRole,
          canVerifyWork: companyEmployees.canVerifyWork,
          companyId: companyEmployees.companyId,
          branchId: companyEmployees.branchId,
          teamId: companyEmployees.teamId
        })
        .from(companyEmployees)
        .where(eq(companyEmployees.employeeId, employeeId))
        .limit(1);

      if (!employeeRole.length || !employeeRole[0].canVerifyWork) {
        return false;
      }

      // Get work entry details to check if it's in their scope
      const workEntry = await db
        .select({
          employeeId: workEntries.employeeId
        })
        .from(workEntries)
        .where(eq(workEntries.id, workEntryId))
        .limit(1);

      if (!workEntry.length) {
        return false;
      }

      // Get work entry employee's hierarchy info
      const entryEmployeeRole = await db
        .select({
          companyId: companyEmployees.companyId,
          branchId: companyEmployees.branchId,
          teamId: companyEmployees.teamId
        })
        .from(companyEmployees)
        .where(eq(companyEmployees.employeeId, workEntry[0].employeeId))
        .limit(1);

      if (!entryEmployeeRole.length) {
        return false;
      }

      const verifier = employeeRole[0];
      const entryEmployee = entryEmployeeRole[0];

      // Check scope based on hierarchy role
      if (verifier.hierarchyRole === 'company_admin' && verifier.companyId === entryEmployee.companyId) {
        return true;
      } else if (verifier.hierarchyRole === 'branch_manager' && 
                 verifier.companyId === entryEmployee.companyId && 
                 verifier.branchId === entryEmployee.branchId) {
        return true;
      } else if (verifier.hierarchyRole === 'team_lead' && 
                 verifier.companyId === entryEmployee.companyId && 
                 verifier.branchId === entryEmployee.branchId && 
                 verifier.teamId === entryEmployee.teamId) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking employee verification permission:', error);
      return false;
    }
  }

  async canCompanyVerifyWork(companyId: string, workEntryId: string): Promise<boolean> {
    try {
      // Get work entry details
      const workEntry = await db
        .select({
          employeeId: workEntries.employeeId
        })
        .from(workEntries)
        .where(eq(workEntries.id, workEntryId))
        .limit(1);

      if (!workEntry.length) {
        return false;
      }

      // Check if work entry employee belongs to this company
      const employeeCompany = await db
        .select({
          companyId: companyEmployees.companyId
        })
        .from(companyEmployees)
        .where(eq(companyEmployees.employeeId, workEntry[0].employeeId))
        .limit(1);

      return employeeCompany.length > 0 && employeeCompany[0].companyId === companyId;
    } catch (error) {
      console.error('Error checking company verification permission:', error);
      return false;
    }
  }

  async verifyWorkEntry(verifierId: string, workEntryId: string, action: string, note: string): Promise<any> {
    try {
      // Check if verifier is an employee or company
      const employeeVerifier = await db
        .select({
          employee: {
            firstName: employees.firstName,
            lastName: employees.lastName
          },
          hierarchyRole: companyEmployees.hierarchyRole
        })
        .from(companyEmployees)
        .leftJoin(employees, eq(companyEmployees.employeeId, employees.id))
        .where(eq(companyEmployees.employeeId, verifierId))
        .limit(1);

      let verifierName = 'Unknown';
      let verifierRole = 'unknown';

      if (employeeVerifier.length > 0) {
        // Verifier is an employee
        const verifierInfo = employeeVerifier[0];
        verifierName = `${verifierInfo.employee?.firstName} ${verifierInfo.employee?.lastName}`;
        verifierRole = verifierInfo.hierarchyRole || 'employee';
      } else {
        // Check if verifier is a company
        const companyVerifier = await db
          .select({
            name: companies.name
          })
          .from(companies)
          .where(eq(companies.id, verifierId))
          .limit(1);

        if (companyVerifier.length > 0) {
          verifierName = companyVerifier[0].name || 'Company Admin';
          verifierRole = 'company_admin';
        }
      }

      // Update work entry
      const [updatedEntry] = await db
        .update(workEntries)
        .set({
          status: action === 'approve' ? 'approved' : 'rejected',
          verifiedBy: verifierId,
          verifiedByRole: verifierRole,
          verifiedByName: verifierName,
          verificationNote: note,
          verifiedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(workEntries.id, workEntryId))
        .returning();

      return updatedEntry;
    } catch (error) {
      console.error('Error verifying work entry:', error);
      throw new Error('Failed to verify work entry');
    }
  }

  // Manager Account Operations (CEO/Company Admin only)
  async createManager(managerData: InsertCompanyManager): Promise<CompanyManager> {
    const hashedPassword = await bcrypt.hash(managerData.password, 10);
    
    // Use provided uniqueId if available, otherwise generate one
    let uniqueId = managerData.uniqueId;
    
    if (!uniqueId) {
      // Generate unique manager ID only if not provided
      const company = await this.getCompany(managerData.companyId);
      if (!company) throw new Error('Company not found');
      
      uniqueId = generateManagerUniqueId(company.name);
      let attempts = 0;
      const maxAttempts = 10;
      
      // Ensure uniqueness
      while (attempts < maxAttempts) {
        const existing = await db.select().from(companyManagers).where(eq(companyManagers.uniqueId, uniqueId));
        if (existing.length === 0) break;
        uniqueId = generateManagerUniqueId(company.name);
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique manager ID');
      }
    }
    
    const [manager] = await db
      .insert(companyManagers)
      .values({
        ...managerData,
        uniqueId,
        password: hashedPassword,
      })
      .returning();
      
    // Create default permissions
    await this.createManagerPermissions({
      managerId: manager.id,
      canApproveWork: true,
      canEditEmployees: false,
      canViewAnalytics: true,
      canInviteEmployees: false,
      canManageTeams: false,
    });
    
    return manager;
  }

  async getManager(id: string): Promise<CompanyManager | undefined> {
    const [manager] = await db.select().from(companyManagers).where(eq(companyManagers.id, id));
    return manager || undefined;
  }

  async getManagerByUniqueId(uniqueId: string): Promise<CompanyManager | undefined> {
    const [manager] = await db.select().from(companyManagers).where(eq(companyManagers.uniqueId, uniqueId));
    return manager || undefined;
  }

  async getManagersByCompany(companyId: string): Promise<CompanyManager[]> {
    return await db
      .select()
      .from(companyManagers)
      .where(and(eq(companyManagers.companyId, companyId), eq(companyManagers.isActive, true)))
      .orderBy(companyManagers.createdAt);
  }

  async updateManager(id: string, data: Partial<CompanyManager>): Promise<CompanyManager> {
    const updateData = { ...data, updatedAt: new Date() };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    
    const [manager] = await db
      .update(companyManagers)
      .set(updateData)
      .where(eq(companyManagers.id, id))
      .returning();
    return manager;
  }

  async deleteManager(id: string): Promise<void> {
    // Soft delete - set isActive to false
    await db
      .update(companyManagers)
      .set({ isActive: false })
      .where(eq(companyManagers.id, id));
  }

  async getTeamsByManager(managerId: string): Promise<CompanyTeam[]> {
    return await db
      .select()
      .from(companyTeams)
      .where(eq(companyTeams.teamManagerId, managerId));
  }

  async resetManagerPassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db
      .update(companyManagers)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(companyManagers.id, id));
  }

  async updateManagerLastLogin(id: string): Promise<void> {
    await db
      .update(companyManagers)
      .set({ lastLoginAt: new Date() })
      .where(eq(companyManagers.id, id));
  }

  // Manager Authentication
  async authenticateManager(uniqueId: string, password: string): Promise<CompanyManager | null> {
    const manager = await this.getManagerByUniqueId(uniqueId);
    if (!manager || !manager.isActive) return null;
    
    const isValidPassword = await bcrypt.compare(password, manager.password);
    if (!isValidPassword) return null;
    
    // Skip last login update temporarily due to SQL syntax error
    // await this.updateManagerLastLogin(manager.id);
    
    return manager;
  }

  // Manager Permissions
  async createManagerPermissions(permissionData: InsertManagerPermission): Promise<ManagerPermission> {
    const [permission] = await db
      .insert(managerPermissions)
      .values(permissionData)
      .returning();
    return permission;
  }

  async getManagerPermissions(managerId: string): Promise<ManagerPermission | undefined> {
    const [permission] = await db
      .select()
      .from(managerPermissions)
      .where(eq(managerPermissions.managerId, managerId));
    return permission || undefined;
  }

  async updateManagerPermissions(managerId: string, data: Partial<ManagerPermission>): Promise<ManagerPermission> {
    const [permission] = await db
      .update(managerPermissions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(managerPermissions.managerId, managerId))
      .returning();
    return permission;
  }

  // Manager-scoped Employee Operations
  async getEmployeesAssignedToManager(managerId: string): Promise<(CompanyEmployee & { employee: Employee })[]> {
    return await db
      .select({
        ...getTableColumns(companyEmployees),
        employee: getTableColumns(employees),
      })
      .from(companyEmployees)
      .innerJoin(employees, eq(companyEmployees.employeeId, employees.id))
      .where(and(
        eq(companyEmployees.assignedManagerId, managerId),
        eq(companyEmployees.isActive, true)
      ))
      .orderBy(employees.firstName);
  }

  async assignEmployeeToManager(employeeId: string, companyId: string, managerId: string): Promise<CompanyEmployee> {
    const [relation] = await db
      .update(companyEmployees)
      .set({ assignedManagerId: managerId, updatedAt: new Date() })
      .where(and(
        eq(companyEmployees.employeeId, employeeId),
        eq(companyEmployees.companyId, companyId)
      ))
      .returning();
    return relation;
  }

  async unassignEmployeeFromManager(employeeId: string, companyId: string): Promise<CompanyEmployee> {
    const [relation] = await db
      .update(companyEmployees)
      .set({ assignedManagerId: null, updatedAt: new Date() })
      .where(and(
        eq(companyEmployees.employeeId, employeeId),
        eq(companyEmployees.companyId, companyId)
      ))
      .returning();
    return relation;
  }

  async unassignAllEmployeesFromManager(managerId: string, companyId: string): Promise<CompanyEmployee[]> {
    const relations = await db
      .update(companyEmployees)
      .set({ assignedManagerId: null, updatedAt: new Date() })
      .where(and(
        eq(companyEmployees.assignedManagerId, managerId),
        eq(companyEmployees.companyId, companyId)
      ))
      .returning();
    return relations;
  }

  async getCompanyManagers(companyId: string): Promise<CompanyManager[]> {
    return await db
      .select()
      .from(companyManagers)
      .where(eq(companyManagers.companyId, companyId))
      .orderBy(companyManagers.createdAt);
  }

  async getCompanyManagerById(managerId: string): Promise<CompanyManager | undefined> {
    const [manager] = await db
      .select()
      .from(companyManagers)
      .where(eq(companyManagers.id, managerId));
    return manager || undefined;
  }

  async updateCompanyManager(managerId: string, data: Partial<CompanyManager>): Promise<CompanyManager> {
    const [manager] = await db
      .update(companyManagers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(companyManagers.id, managerId))
      .returning();
    return manager;
  }

  // Manager-scoped Work Entry Operations
  async getWorkEntriesForManager(managerId: string, filters: {
    status?: string;
    approvalStatus?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<(WorkEntry & { employee: Employee })[]> {
    // Only show work entries that were specifically submitted to teams managed by this manager
    let query = db
      .select({
        ...getTableColumns(workEntries),
        employee: getTableColumns(employees),
      })
      .from(workEntries)
      .innerJoin(employees, eq(workEntries.employeeId, employees.id))
      .innerJoin(companyTeams, and(
        eq(workEntries.teamId, companyTeams.id),
        eq(companyTeams.teamManagerId, managerId)
      ));

    const conditions = [];
    
    if (filters.status) {
      conditions.push(eq(workEntries.status, filters.status));
    }
    
    if (filters.approvalStatus) {
      conditions.push(eq(workEntries.approvalStatus, filters.approvalStatus));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(workEntries.createdAt));
  }

  async approveWorkEntryAsManager(workEntryId: string, managerId: string, data: {
    rating?: number;
    feedback?: string;
  }): Promise<WorkEntry> {
    const manager = await this.getCompanyManagerById(managerId);
    if (!manager) throw new Error('Manager not found');
    
    // Manager approval = Company verification (delegated authority)
    const updateData: any = {
      approvalStatus: 'approved',
      // Don't set verifiedBy since it expects employee ID, not manager ID
      verifiedByRole: 'assigned_manager',
      verifiedByName: manager.managerName,
      verifiedAt: new Date(),
      companyFeedback: data.feedback,
      companyRating: data.rating,
      status: 'approved', // For immutable protection
      updatedAt: new Date(),
    };
    
    const [updatedEntry] = await db
      .update(workEntries)
      .set(updateData)
      .where(eq(workEntries.id, workEntryId))
      .returning();
      
    return updatedEntry;
  }

  // Manager Analytics
  async getManagerAnalytics(managerId: string): Promise<{
    totalEmployees: number;
    pendingWorkEntries: number;
    approvedWorkEntries: number;
    rejectedWorkEntries: number;
    teamProductivity: {
      averageHoursPerWeek: number;
      completedTasks: number;
      ongoingTasks: number;
    };
  }> {
    // Get total employees assigned to manager
    const totalEmployees = await db
      .select({ count: count() })
      .from(companyEmployees)
      .where(and(
        eq(companyEmployees.assignedManagerId, managerId),
        eq(companyEmployees.isActive, true)
      ));

    // Get work entry statistics
    const workStats = await db
      .select({
        status: workEntries.approvalStatus,
        count: count(),
        totalHours: sql<number>`SUM(COALESCE(${workEntries.actualHours}, 0))`,
      })
      .from(workEntries)
      .innerJoin(companyEmployees, and(
        eq(workEntries.employeeId, companyEmployees.employeeId),
        eq(companyEmployees.assignedManagerId, managerId)
      ))
      .groupBy(workEntries.approvalStatus);

    const pending = workStats.find(s => s.status === 'pending_review')?.count || 0;
    const approved = workStats.find(s => s.status === 'manager_approved')?.count || 0;
    const rejected = workStats.find(s => s.status === 'manager_rejected')?.count || 0;
    
    const totalHours = workStats.reduce((sum, s) => sum + (s.totalHours || 0), 0);
    const averageHoursPerWeek = totalHours / Math.max(totalEmployees[0]?.count || 1, 1);

    return {
      totalEmployees: totalEmployees[0]?.count || 0,
      pendingWorkEntries: pending,
      approvedWorkEntries: approved,
      rejectedWorkEntries: rejected,
      teamProductivity: {
        averageHoursPerWeek,
        completedTasks: approved,
        ongoingTasks: pending,
      },
    };
  }

  // Recruiter Profile operations
  async getRecruiterProfile(userId: string, userType: string): Promise<RecruiterProfile | undefined> {
    const [profile] = await db
      .select()
      .from(recruiterProfiles)
      .where(and(
        eq(recruiterProfiles.userId, userId),
        eq(recruiterProfiles.userType, userType)
      ));
    return profile || undefined;
  }

  async createRecruiterProfile(profileData: InsertRecruiterProfile): Promise<RecruiterProfile> {
    const [profile] = await db
      .insert(recruiterProfiles)
      .values(profileData)
      .returning();
    return profile;
  }

  async updateRecruiterProfile(id: string, data: Partial<RecruiterProfile>): Promise<RecruiterProfile> {
    const [profile] = await db
      .update(recruiterProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(recruiterProfiles.id, id))
      .returning();
    return profile;
  }

  async deleteRecruiterProfile(id: string): Promise<void> {
    await db.delete(recruiterProfiles).where(eq(recruiterProfiles.id, id));
  }

  async getRecruiterProfiles(): Promise<RecruiterProfile[]> {
    return await db.select().from(recruiterProfiles).where(eq(recruiterProfiles.isActive, true));
  }

  // Advanced Talent Search operations
  async searchTalent(filters: TalentSearchFilters): Promise<(Employee & { 
    verifiedWorkHistory: boolean;
    totalExperience: number; 
    latestRole: string;
    latestCompany: string;
  })[]> {
    let query = db
      .select({
        ...getTableColumns(employees),
        verifiedWorkHistory: sql<boolean>`CASE WHEN EXISTS(
          SELECT 1 FROM ${workEntries} WHERE ${workEntries.employeeId} = ${employees.id} 
          AND ${workEntries.approvalStatus} = 'company_approved'
        ) THEN true ELSE false END`,
        totalExperience: sql<number>`COALESCE((
          SELECT COUNT(DISTINCT ${experiences.company}) 
          FROM ${experiences} 
          WHERE ${experiences.employeeId} = ${employees.id}
        ), 0)`,
        latestRole: sql<string>`COALESCE((
          SELECT ${experiences.title} 
          FROM ${experiences} 
          WHERE ${experiences.employeeId} = ${employees.id} 
          ORDER BY ${experiences.startDate} DESC 
          LIMIT 1
        ), '')`,
        latestCompany: sql<string>`COALESCE((
          SELECT ${experiences.company} 
          FROM ${experiences} 
          WHERE ${experiences.employeeId} = ${employees.id} 
          ORDER BY ${experiences.startDate} DESC 
          LIMIT 1
        ), '')`
      })
      .from(employees);

    const conditions = [eq(employees.isActive, true)];

    if (filters.keywords) {
      conditions.push(
        or(
          ilike(employees.firstName, `%${filters.keywords}%`),
          ilike(employees.lastName, `%${filters.keywords}%`),
          ilike(employees.headline, `%${filters.keywords}%`),
          ilike(employees.summary, `%${filters.keywords}%`)
        )!
      );
    }

    if (filters.skills && filters.skills.length > 0) {
      conditions.push(
        or(...filters.skills.map(skill => 
          sql`${employees.skills} @> ARRAY[${skill}]`
        ))
      );
    }

    if (filters.experienceLevel && filters.experienceLevel.length > 0) {
      conditions.push(sql`${employees.experienceLevel} = ANY(${filters.experienceLevel})`);
    }

    if (filters.location) {
      conditions.push(
        or(
          ilike(employees.location, `%${filters.location}%`),
          ilike(employees.city, `%${filters.location}%`),
          ilike(employees.state, `%${filters.location}%`),
          ilike(employees.country, `%${filters.location}%`)
        )!
      );
    }

    if (filters.availability && filters.availability.length > 0) {
      conditions.push(sql`${employees.availabilityStatus} = ANY(${filters.availability})`);
    }

    if (filters.workType && filters.workType.length > 0) {
      conditions.push(sql`${employees.preferredWorkType} = ANY(${filters.workType})`);
    }

    if (filters.verifiedOnly) {
      conditions.push(sql`EXISTS(
        SELECT 1 FROM ${workEntries} WHERE ${workEntries.employeeId} = ${employees.id} 
        AND ${workEntries.approvalStatus} = 'company_approved'
      )`);
    }

    query = query.where(and(...conditions));
    return await query.orderBy(desc(employees.updatedAt));
  }

  // Candidate Pipeline operations
  async getCandidatePipelines(recruiterId: string): Promise<(CandidatePipeline & { candidate: Employee })[]> {
    return await db
      .select({
        ...getTableColumns(candidatePipelines),
        candidate: getTableColumns(employees)
      })
      .from(candidatePipelines)
      .innerJoin(employees, eq(candidatePipelines.candidateId, employees.id))
      .where(and(
        eq(candidatePipelines.recruiterId, recruiterId),
        eq(candidatePipelines.isActive, true)
      ))
      .orderBy(desc(candidatePipelines.updatedAt));
  }

  async getCandidatePipeline(id: string): Promise<CandidatePipeline | undefined> {
    const [pipeline] = await db
      .select()
      .from(candidatePipelines)
      .where(eq(candidatePipelines.id, id));
    return pipeline || undefined;
  }

  async createCandidatePipeline(pipelineData: InsertCandidatePipeline): Promise<CandidatePipeline> {
    const [pipeline] = await db
      .insert(candidatePipelines)
      .values(pipelineData)
      .returning();
    return pipeline;
  }

  async updateCandidatePipeline(id: string, data: Partial<CandidatePipeline>): Promise<CandidatePipeline> {
    const [pipeline] = await db
      .update(candidatePipelines)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(candidatePipelines.id, id))
      .returning();
    return pipeline;
  }

  async deleteCandidatePipeline(id: string): Promise<void> {
    await db.delete(candidatePipelines).where(eq(candidatePipelines.id, id));
  }

  async updateCandidateStage(pipelineId: string, stage: string): Promise<CandidatePipeline> {
    const [pipeline] = await db
      .update(candidatePipelines)
      .set({ 
        stage, 
        stageUpdatedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(candidatePipelines.id, pipelineId))
      .returning();
    return pipeline;
  }

  // Candidate Interaction operations
  async getCandidateInteractions(pipelineId: string): Promise<CandidateInteraction[]> {
    return await db
      .select()
      .from(candidateInteractions)
      .where(eq(candidateInteractions.pipelineId, pipelineId))
      .orderBy(desc(candidateInteractions.createdAt));
  }

  async createCandidateInteraction(interactionData: InsertCandidateInteraction): Promise<CandidateInteraction> {
    const [interaction] = await db
      .insert(candidateInteractions)
      .values(interactionData)
      .returning();
    return interaction;
  }

  async updateCandidateInteraction(id: string, data: Partial<CandidateInteraction>): Promise<CandidateInteraction> {
    const [interaction] = await db
      .update(candidateInteractions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(candidateInteractions.id, id))
      .returning();
    return interaction;
  }

  async deleteCandidateInteraction(id: string): Promise<void> {
    await db.delete(candidateInteractions).where(eq(candidateInteractions.id, id));
  }

  // Recruitment Analytics operations
  async getRecruitmentAnalytics(recruiterId: string, dateRange?: { start: string; end: string }): Promise<{
    totalSearches: number;
    totalContacts: number;
    totalInterviews: number;
    totalHires: number;
    pipelineBreakdown: { stage: string; count: number }[];
    performanceMetrics: { avgTimeToHire: number; conversionRate: number };
  }> {
    const conditions = [eq(recruitmentAnalytics.recruiterId, recruiterId)];
    
    if (dateRange) {
      conditions.push(
        and(
          sql`${recruitmentAnalytics.dateRecorded} >= ${dateRange.start}`,
          sql`${recruitmentAnalytics.dateRecorded} <= ${dateRange.end}`
        )!
      );
    }

    // Get metric totals
    const metricTotals = await db
      .select({
        metricType: recruitmentAnalytics.metricType,
        total: sql<number>`SUM(${recruitmentAnalytics.metricValue})`
      })
      .from(recruitmentAnalytics)
      .where(and(...conditions))
      .groupBy(recruitmentAnalytics.metricType);

    // Get pipeline breakdown
    const pipelineBreakdown = await db
      .select({
        stage: candidatePipelines.stage,
        count: count()
      })
      .from(candidatePipelines)
      .where(eq(candidatePipelines.recruiterId, recruiterId))
      .groupBy(candidatePipelines.stage);

    // Calculate performance metrics
    const totalContacts = metricTotals.find(m => m.metricType === 'contacts_made')?.total || 0;
    const totalHires = metricTotals.find(m => m.metricType === 'hires_made')?.total || 0;
    const conversionRate = totalContacts > 0 ? (totalHires / totalContacts) * 100 : 0;

    return {
      totalSearches: metricTotals.find(m => m.metricType === 'searches_performed')?.total || 0,
      totalContacts,
      totalInterviews: metricTotals.find(m => m.metricType === 'interviews_conducted')?.total || 0,
      totalHires,
      pipelineBreakdown: pipelineBreakdown.map(p => ({ stage: p.stage, count: p.count })),
      performanceMetrics: {
        avgTimeToHire: 30, // This would need more complex calculation
        conversionRate
      }
    };
  }

  async recordRecruitmentMetric(metricData: InsertRecruitmentAnalytic): Promise<RecruitmentAnalytic> {
    const [metric] = await db
      .insert(recruitmentAnalytics)
      .values(metricData)
      .returning();
    return metric;
  }

  // Saved Search operations
  async getSavedSearches(recruiterId: string): Promise<SavedSearch[]> {
    return await db
      .select()
      .from(savedSearches)
      .where(and(
        eq(savedSearches.recruiterId, recruiterId),
        eq(savedSearches.isActive, true)
      ))
      .orderBy(desc(savedSearches.updatedAt));
  }

  async createSavedSearch(searchData: InsertSavedSearch): Promise<SavedSearch> {
    const [search] = await db
      .insert(savedSearches)
      .values(searchData)
      .returning();
    return search;
  }

  async updateSavedSearch(id: string, data: Partial<SavedSearch>): Promise<SavedSearch> {
    const [search] = await db
      .update(savedSearches)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(savedSearches.id, id))
      .returning();
    return search;
  }

  async deleteSavedSearch(id: string): Promise<void> {
    await db.delete(savedSearches).where(eq(savedSearches.id, id));
  }

  async executeSavedSearch(searchId: string): Promise<Employee[]> {
    const [search] = await db
      .select()
      .from(savedSearches)
      .where(eq(savedSearches.id, searchId));
    
    if (!search) {
      throw new Error('Saved search not found');
    }

    const criteria = search.searchCriteria as TalentSearchFilters;
    const results = await this.searchTalent(criteria);
    
    // Update last executed and results count
    await db
      .update(savedSearches)
      .set({ 
        lastExecuted: new Date(),
        resultsCount: results.length,
        updatedAt: new Date()
      })
      .where(eq(savedSearches.id, searchId));

    return results.map(r => ({
      id: r.id,
      employeeId: r.employeeId,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      phone: r.phone,
      countryCode: r.countryCode,
      password: r.password,
      profilePhoto: r.profilePhoto,
      headline: r.headline,
      summary: r.summary,
      location: r.location,
      website: r.website,
      currentPosition: r.currentPosition,
      currentCompany: r.currentCompany,
      industry: r.industry,
      experienceLevel: r.experienceLevel,
      salaryExpectation: r.salaryExpectation,
      availabilityStatus: r.availabilityStatus,
      noticePeriod: r.noticePeriod,
      preferredWorkType: r.preferredWorkType,
      skills: r.skills,
      languages: r.languages,
      specializations: r.specializations,
      address: r.address,
      city: r.city,
      state: r.state,
      zipCode: r.zipCode,
      country: r.country,
      dateOfBirth: r.dateOfBirth,
      gender: r.gender,
      nationality: r.nationality,
      maritalStatus: r.maritalStatus,
      hobbies: r.hobbies,
      certifications: r.certifications,
      achievements: r.achievements,
      portfolioUrl: r.portfolioUrl,
      githubUrl: r.githubUrl,
      linkedinUrl: r.linkedinUrl,
      twitterUrl: r.twitterUrl,
      emailVerified: r.emailVerified,
      isActive: r.isActive,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }));
  }

  // Team membership operations (many-to-many relationships)
  async addEmployeeToTeam(employeeId: string, teamId: string, companyId: string, role: string = "member"): Promise<TeamMember> {
    // First, get the team's manager ID
    const team = await this.getCompanyTeam(teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Add employee to team members table
    const [teamMember] = await db
      .insert(teamMembers)
      .values({
        employeeId,
        teamId,
        companyId,
        role,
        isActive: true
      })
      .returning();

    // Update the employee's assignedManagerId in companyEmployees table
    if (team.teamManagerId) {
      await db
        .update(companyEmployees)
        .set({ 
          assignedManagerId: team.teamManagerId,
          updatedAt: new Date() 
        })
        .where(and(
          eq(companyEmployees.employeeId, employeeId),
          eq(companyEmployees.companyId, companyId)
        ));
    }

    return teamMember;
  }

  async removeEmployeeFromTeam(employeeId: string, teamId: string): Promise<void> {
    // Remove from team members table
    await db
      .update(teamMembers)
      .set({ 
        isActive: false,
        leftAt: new Date()
      })
      .where(
        and(
          eq(teamMembers.employeeId, employeeId),
          eq(teamMembers.teamId, teamId)
        )
      );

    // Check if employee is still in other teams with managers
    const remainingTeamsWithManagers = await db
      .select({ teamManagerId: companyTeams.teamManagerId })
      .from(teamMembers)
      .innerJoin(companyTeams, eq(teamMembers.teamId, companyTeams.id))
      .where(
        and(
          eq(teamMembers.employeeId, employeeId),
          eq(teamMembers.isActive, true),
          isNotNull(companyTeams.teamManagerId)
        )
      )
      .limit(1);

    // If no remaining teams with managers, clear assignedManagerId
    if (remainingTeamsWithManagers.length === 0) {
      await db
        .update(companyEmployees)
        .set({ 
          assignedManagerId: null,
          updatedAt: new Date() 
        })
        .where(eq(companyEmployees.employeeId, employeeId));
    }
  }

  async getEmployeeTeams(employeeId: string, companyId: string): Promise<CompanyTeam[]> {
    const employeeTeams = await db
      .select({
        id: companyTeams.id,
        teamId: companyTeams.teamId,
        companyId: companyTeams.companyId,
        branchId: companyTeams.branchId,
        name: companyTeams.name,
        description: companyTeams.description,
        teamManagerId: companyTeams.teamManagerId,
        maxMembers: companyTeams.maxMembers,
        isActive: companyTeams.isActive,
        createdAt: companyTeams.createdAt,
        updatedAt: companyTeams.updatedAt,
      })
      .from(teamMembers)
      .innerJoin(companyTeams, eq(teamMembers.teamId, companyTeams.id))
      .where(
        and(
          eq(teamMembers.employeeId, employeeId),
          eq(teamMembers.companyId, companyId),
          eq(teamMembers.isActive, true)
        )
      );
    return employeeTeams;
  }

  // Fix existing team assignments that don't have assignedManagerId set
  async fixExistingTeamManagerAssignments(companyId: string): Promise<{fixed: number, errors: string[]}> {
    const errors: string[] = [];
    let fixed = 0;

    try {
      // Get all active team members without assigned managers
      const membersNeedingFix = await db
        .select({
          employeeId: teamMembers.employeeId,
          teamId: teamMembers.teamId,
          teamManagerId: companyTeams.teamManagerId,
        })
        .from(teamMembers)
        .innerJoin(companyTeams, eq(teamMembers.teamId, companyTeams.id))
        .innerJoin(companyEmployees, and(
          eq(teamMembers.employeeId, companyEmployees.employeeId),
          eq(teamMembers.companyId, companyEmployees.companyId)
        ))
        .where(
          and(
            eq(teamMembers.companyId, companyId),
            eq(teamMembers.isActive, true),
            isNotNull(companyTeams.teamManagerId),
            isNull(companyEmployees.assignedManagerId)
          )
        );

      // Fix each member's assignedManagerId
      for (const member of membersNeedingFix) {
        try {
          await db
            .update(companyEmployees)
            .set({ 
              assignedManagerId: member.teamManagerId,
              updatedAt: new Date() 
            })
            .where(and(
              eq(companyEmployees.employeeId, member.employeeId),
              eq(companyEmployees.companyId, companyId)
            ));
          fixed++;
        } catch (error) {
          errors.push(`Failed to fix employee ${member.employeeId}: ${error}`);
        }
      }

      return { fixed, errors };
    } catch (error) {
      return { fixed: 0, errors: [`Failed to fix assignments: ${error}`] };
    }
  }

  async getTeamMemberships(teamId: string): Promise<any[]> {
    const memberships = await db
      .select({
        id: teamMembers.id,
        employeeId: teamMembers.employeeId,
        teamId: teamMembers.teamId,
        companyId: teamMembers.companyId,
        joinedAt: teamMembers.joinedAt,
        role: teamMembers.role,
        isActive: teamMembers.isActive,
        employee: {
          id: employees.id,
          employeeId: employees.employeeId,
          firstName: employees.firstName,
          lastName: employees.lastName,
          email: employees.email,
          profilePhoto: employees.profilePhoto,
        }
      })
      .from(teamMembers)
      .innerJoin(employees, eq(teamMembers.employeeId, employees.id))
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.isActive, true)
        )
      );
    return memberships;
  }

  async isEmployeeInTeam(employeeId: string, teamId: string): Promise<boolean> {
    const [membership] = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.employeeId, employeeId),
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.isActive, true)
        )
      )
      .limit(1);
    return !!membership;
  }

  async getEmployeeTeamCount(employeeId: string, companyId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.employeeId, employeeId),
          eq(teamMembers.companyId, companyId),
          eq(teamMembers.isActive, true)
        )
      );
    return result.count;
  }
}

export const storage = new DatabaseStorage();
