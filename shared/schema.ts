import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, numeric, jsonb, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Pending user verification table for signup process
export const pendingUsers = pgTable("pending_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
  userType: text("user_type").notNull(), // 'employee' or 'company'
  userData: jsonb("user_data").notNull(), // Store all signup data as JSON
  verificationToken: varchar("verification_token").notNull().unique(),
  tokenExpiry: timestamp("token_expiry").notNull(),
  resendCount: integer("resend_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("pending_users_email_idx").on(table.email),
  index("pending_users_token_idx").on(table.verificationToken),
]);

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  countryCode: text("country_code").notNull().default("+1"),
  password: text("password").notNull(),
  profilePhoto: text("profile_photo"),
  headline: text("headline"),
  summary: text("summary"),
  location: text("location"),
  website: text("website"),
  currentPosition: text("current_position"),
  currentCompany: text("current_company"),
  industry: text("industry"),
  experienceLevel: text("experience_level"), // entry, mid, senior, lead, director, executive
  salaryExpectation: text("salary_expectation"),
  availabilityStatus: text("availability_status").default("open"), // open, not_looking, passive
  noticePeriod: text("notice_period"), // immediate, 1_month, 2_months, 3_months
  preferredWorkType: text("preferred_work_type"), // remote, office, hybrid
  skills: text("skills").array(),
  languages: text("languages").array(),
  specializations: text("specializations").array(), // specific areas of expertise
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"), // male, female, not_prefer_to_say
  nationality: text("nationality"),
  maritalStatus: text("marital_status"),
  hobbies: text("hobbies").array(),
  certifications: text("certifications").array(),
  achievements: text("achievements").array(),
  portfolioUrl: text("portfolio_url"),
  githubUrl: text("github_url"),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  emailVerified: boolean("email_verified").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const experiences = pgTable("experiences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  isCurrent: boolean("is_current").default(false),
  description: text("description"),
  achievements: text("achievements").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const educations = pgTable("educations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  institution: text("institution").notNull(),
  degree: text("degree").notNull(),
  fieldOfStudy: text("field_of_study"),
  category: text("category"),
  startYear: integer("start_year").notNull(),
  endYear: integer("end_year"),
  grade: text("grade"),
  activities: text("activities"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const certifications = pgTable("certifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  issuingOrganization: text("issuing_organization").notNull(),
  issueDate: text("issue_date").notNull(),
  expirationDate: text("expiration_date"),
  credentialId: text("credential_id"),
  credentialUrl: text("credential_url"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  projectUrl: text("project_url"),
  repositoryUrl: text("repository_url"),
  technologies: text("technologies").array(),
  teamSize: integer("team_size"),
  role: text("role"),
  achievements: text("achievements").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const endorsements = pgTable("endorsements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  endorserName: text("endorser_name").notNull(),
  endorserPosition: text("endorser_position"),
  endorserCompany: text("endorser_company"),
  relationship: text("relationship").notNull(),
  endorsementText: text("endorsement_text").notNull(),
  endorsementDate: text("endorsement_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employeeCompanies = pgTable("employee_companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  position: text("position"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  isCurrent: boolean("is_current").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workEntries = pgTable("work_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  teamId: varchar("team_id").references(() => companyTeams.id), // Employee's team when work was done
  
  // Core 7 simplified fields for maximum adoption
  title: text("title").notNull(),
  roleType: text("role_type").notNull(), // Developer, Sales, Marketing, etc
  difficultyLevel: text("difficulty_level").notNull(), // Low, Medium, High, Extreme
  completionTime: integer("completion_time").notNull(), // Hours taken to complete
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  description: text("description"),
  challenges: text("challenges"), // What challenges did you face?
  learnings: text("learnings"), // What did you learn?
  
  // Simple metadata
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  achievements: text("achievements").array().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().unique(), // Human-readable unique ID like CMP-ABC123
  name: text("name").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  registrationType: text("registration_type"), // CIN, PAN, or GST (optional)
  registrationNumber: text("registration_number"), // Registration number (optional)
  cin: text("cin").unique(), // Corporate Identification Number (21 characters) - Optional
  cinVerificationStatus: text("cin_verification_status", { 
    enum: ["pending", "verified", "rejected"] 
  }).default("pending"),
  cinVerifiedAt: timestamp("cin_verified_at"),
  cinVerifiedBy: varchar("cin_verified_by"), // Admin ID who verified
  panNumber: text("pan_number"), // PAN Number (10 characters) - Optional
  panVerificationStatus: text("pan_verification_status", { 
    enum: ["pending", "verified", "rejected"] 
  }).default("pending"),
  panVerifiedAt: timestamp("pan_verified_at"),
  panVerifiedBy: varchar("pan_verified_by"), // Admin ID who verified
  // GST verification fields
  gstNumber: text("gst_number"), // GST Number (15 characters) - Optional
  gstVerificationStatus: text("gst_verification_status", {
    enum: ["pending", "verified", "rejected"]
  }).default("pending"),
  gstVerifiedAt: timestamp("gst_verified_at"),
  gstVerifiedBy: varchar("gst_verified_by"), // Admin ID who verified
  isBasicDetailsLocked: boolean("is_basic_details_locked").default(false),
  industry: text("industry").notNull(),
  email: text("email").notNull().unique(),
  size: text("size").notNull(),
  establishmentYear: text("establishment_year").notNull(),
  password: text("password").notNull(),
  emailVerified: boolean("email_verified").default(false),
  // PAN/CIN Verification fields
  verificationStatus: text("verification_status").default("unverified"), // unverified, pending, verified, rejected
  verificationMethod: text("verification_method"), // manual, api, document_upload
  verificationDate: timestamp("verification_date"),
  verificationNotes: text("verification_notes"), // For admin notes
  verificationDocuments: text("verification_documents").array().default(sql`'{}'::text[]`), // Uploaded document URLs
  rejectionReason: text("rejection_reason"), // If verification is rejected
  isActive: boolean("is_active").default(true),
  work_diary_access: boolean("work_diary_access").default(false), // Admin-controlled access to work diary features
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// New table for company invitation codes
export const companyInvitationCodes = pgTable("company_invitation_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 8 }).notNull().unique(), // 8-character unique code
  expiresAt: timestamp("expires_at").notNull(),
  usedByEmployeeId: varchar("used_by_employee_id").references(() => employees.id),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Company branches table for hierarchical structure (HDFC Surat, HDFC Mumbai, etc.)
export const companyBranches = pgTable("company_branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  branchId: varchar("branch_id").notNull().unique(), // BRN-ABC123 format
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "HDFC Surat Branch"
  location: text("location"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  managerEmployeeId: varchar("manager_employee_id"), // Branch manager's employee ID
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teams within branches (Manager + team structure)
export const companyTeams = pgTable("company_teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().unique(), // TM-ABC123 format
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  branchId: varchar("branch_id").references(() => companyBranches.id, { onDelete: "cascade" }), // Can be null for HQ teams
  name: text("name").notNull(), // "Sales Team A", "Development Team 1"
  description: text("description"),
  teamManagerId: varchar("team_manager_id"), // Team manager ID - reference added in relations
  maxMembers: integer("max_members").default(10), // Team size limit
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced company-employee relationships with hierarchy and roles
export const companyEmployees = pgTable("company_employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  branchId: varchar("branch_id").references(() => companyBranches.id), // Employee's branch (null for HQ)
  teamId: varchar("team_id").references(() => companyTeams.id), // Employee's team (null if not assigned)
  assignedManagerId: varchar("assigned_manager_id").references(() => companyManagers.id), // Manager responsible for this employee
  position: text("position"),
  department: text("department"),
  // Enhanced role system for hierarchy
  hierarchyRole: varchar("hierarchy_role", { length: 20 }).notNull().default("employee"), 
  // Roles: "company_admin", "branch_manager", "team_lead", "employee"
  // Permissions for verification and management
  canVerifyWork: boolean("can_verify_work").default(false), // Can approve work entries
  canManageEmployees: boolean("can_manage_employees").default(false), // Can manage team members
  canCreateTeams: boolean("can_create_teams").default(false), // Can create teams/branches
  // Verification scope (who they can verify)
  verificationScope: text("verification_scope").default("none"), // "none", "team", "branch", "company"
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  status: varchar("status", { length: 20 }).default("employed").notNull(), // "employed" or "ex-employee"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team members junction table for many-to-many relationship
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => companyTeams.id, { onDelete: "cascade" }),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  isActive: boolean("is_active").default(true),
  role: varchar("role", { length: 50 }).default("member"), // "member", "lead", etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    // Ensure unique team-employee combination per company
    uniqueTeamEmployee: unique().on(table.teamId, table.employeeId),
  };
});

// Company managers table for sub-account system
export const companyManagers = pgTable("company_managers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  uniqueId: varchar("unique_id", { length: 8 }).notNull().unique(), // YP123 format
  password: text("password").notNull(), // Hashed password
  managerName: text("manager_name").notNull(),
  managerEmail: text("manager_email").notNull(),
  branchId: varchar("branch_id").references(() => companyBranches.id), // Manager's branch (null for HQ)
  teamId: varchar("team_id"), // Manager's team (null if branch-level) - reference added in relations
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Manager permissions table for granular access control
export const managerPermissions = pgTable("manager_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  managerId: varchar("manager_id").notNull().references(() => companyManagers.id, { onDelete: "cascade" }),
  canApproveWork: boolean("can_approve_work").default(true),
  canEditEmployees: boolean("can_edit_employees").default(false),
  canViewAnalytics: boolean("can_view_analytics").default(true),
  canInviteEmployees: boolean("can_invite_employees").default(false),
  canManageTeams: boolean("can_manage_teams").default(false),
});

// ====================
// FREELANCER MARKETPLACE TABLES
// ====================

// Clients table for individual users who hire employees for freelance projects
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().unique(), // CLI-ABC123 format
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  countryCode: text("country_code").notNull().default("+1"),
  password: text("password").notNull(),
  profilePhoto: text("profile_photo"),
  company: text("company"), // Optional - client's company name
  jobTitle: text("job_title"), // Optional - client's job title
  location: text("location"),
  timezone: text("timezone"),
  bio: text("bio"), // Short description about the client
  website: text("website"),
  linkedinUrl: text("linkedin_url"),
  // Client preferences
  projectTypes: text("project_types").array(), // Types of projects they usually post
  budgetRange: text("budget_range"), // Typical budget range
  communicationStyle: text("communication_style"), // How they prefer to communicate
  workingHours: text("working_hours"), // Preferred working hours
  // Verification and trust
  emailVerified: boolean("email_verified").default(false),
  phoneVerified: boolean("phone_verified").default(false),
  identityVerified: boolean("identity_verified").default(false),
  // Account status
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Freelance projects posted by clients
export const freelanceProjects = pgTable("freelance_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().unique(), // FP-ABC123 format
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  skillsRequired: text("skills_required").array(),
  projectType: text("project_type").notNull(), // fixed_price, hourly, milestone_based
  budgetType: text("budget_type").notNull(), // fixed, range, hourly_rate
  budgetAmount: integer("budget_amount"), // In cents for fixed/hourly rate
  budgetMin: integer("budget_min"), // In cents for range
  budgetMax: integer("budget_max"), // In cents for range
  currency: text("currency").notNull().default("USD"),
  duration: text("duration"), // estimated project duration
  urgency: text("urgency").notNull().default("medium"), // low, medium, high, urgent
  experience_level: text("experience_level").notNull(), // entry, intermediate, expert
  // Project specifics
  category: text("category").notNull(), // development, design, writing, marketing, etc.
  subcategory: text("subcategory"),
  location_requirement: text("location_requirement").default("remote"), // remote, onsite, hybrid
  time_zone_requirement: text("time_zone_requirement"),
  // Status and lifecycle
  status: text("status").notNull().default("active"), // draft, active, paused, closed, cancelled, completed
  proposals_count: integer("proposals_count").default(0),
  views_count: integer("views_count").default(0),
  // Dates
  deadline: timestamp("deadline"),
  starts_at: timestamp("starts_at"),
  posted_at: timestamp("posted_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  // Project attachments and references
  attachments: text("attachments").array().default(sql`'{}'::text[]`),
  reference_links: text("reference_links").array().default(sql`'{}'::text[]`),
});

// Proposals submitted by employees for freelance projects
export const projectProposals = pgTable("project_proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proposalId: varchar("proposal_id").notNull().unique(), // PP-ABC123 format
  projectId: varchar("project_id").notNull().references(() => freelanceProjects.id, { onDelete: "cascade" }),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  // Proposal content
  coverLetter: text("cover_letter").notNull(),
  proposedRate: integer("proposed_rate"), // In cents - hourly rate or total amount
  rateType: text("rate_type").notNull(), // hourly, fixed, milestone
  estimatedDuration: text("estimated_duration"),
  milestones: jsonb("milestones"), // For milestone-based projects
  // Employee's approach and value proposition
  approach: text("approach"), // How they plan to complete the project
  relevant_experience: text("relevant_experience"),
  portfolio_samples: text("portfolio_samples").array().default(sql`'{}'::text[]`),
  questions_for_client: text("questions_for_client"),
  // Availability and timing
  availability: text("availability"), // When can start
  weekly_hours: integer("weekly_hours"), // Hours per week they can dedicate
  // Status tracking
  status: text("status").notNull().default("submitted"), // submitted, shortlisted, interviewed, accepted, declined, withdrawn
  client_feedback: text("client_feedback"), // Client's notes about this proposal
  // Timestamps
  submitted_at: timestamp("submitted_at").defaultNow(),
  status_updated_at: timestamp("status_updated_at").defaultNow(),
  client_viewed_at: timestamp("client_viewed_at"),
  // Communication tracking
  messages_count: integer("messages_count").default(0),
  last_message_at: timestamp("last_message_at"),
});

// Active freelance contracts between clients and employees
export const freelanceContracts = pgTable("freelance_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().unique(), // FC-ABC123 format
  projectId: varchar("project_id").notNull().references(() => freelanceProjects.id, { onDelete: "cascade" }),
  proposalId: varchar("proposal_id").notNull().references(() => projectProposals.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  // Contract terms
  contractType: text("contract_type").notNull(), // hourly, fixed_price, milestone_based
  totalValue: integer("total_value"), // In cents - total contract value
  hourlyRate: integer("hourly_rate"), // In cents - for hourly contracts
  currency: text("currency").notNull().default("USD"),
  // Timeline
  startDate: timestamp("start_date").notNull(),
  deadline: timestamp("deadline"),
  estimatedHours: integer("estimated_hours"), // For hourly contracts
  // Contract status
  status: text("status").notNull().default("active"), // active, paused, completed, terminated, dispute
  completionPercentage: integer("completion_percentage").default(0),
  // Work tracking
  totalHoursWorked: integer("total_hours_worked").default(0),
  totalAmountEarned: integer("total_amount_earned").default(0), // In cents
  // Payment and billing
  paymentSchedule: text("payment_schedule"), // weekly, bi_weekly, upon_completion, milestone_based
  lastPaymentDate: timestamp("last_payment_date"),
  nextPaymentDue: timestamp("next_payment_due"),
  // Ratings and feedback (populated after completion)
  clientRating: integer("client_rating"), // 1-5 stars from client
  employeeRating: integer("employee_rating"), // 1-5 stars from employee
  clientFeedback: text("client_feedback"),
  employeeFeedback: text("employee_feedback"),
  // Contract lifecycle
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Live Monitor sessions for real-time work tracking (Upwork-style)
export const liveMonitorSessions = pgTable("live_monitor_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().unique(), // LM-ABC123 format
  contractId: varchar("contract_id").notNull().references(() => freelanceContracts.id, { onDelete: "cascade" }),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  // Session details
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration").default(0), // Duration in minutes
  status: text("status").notNull().default("active"), // active, paused, stopped, completed
  // Work description
  workDescription: text("work_description"),
  tasksCompleted: text("tasks_completed").array().default(sql`'{}'::text[]`),
  // Activity tracking
  activityLevel: integer("activity_level").default(0), // 0-100 percentage
  keyboardEvents: integer("keyboard_events").default(0),
  mouseEvents: integer("mouse_events").default(0),
  activeMinutes: integer("active_minutes").default(0),
  idleMinutes: integer("idle_minutes").default(0),
  // Screenshots and monitoring (stored as file references)
  screenshots: jsonb("screenshots"), // Array of screenshot metadata
  screenshotInterval: integer("screenshot_interval").default(10), // Minutes between screenshots
  // Billing
  billableMinutes: integer("billable_minutes").default(0),
  manualTimeAdjustment: integer("manual_time_adjustment").default(0), // In minutes
  adjustmentReason: text("adjustment_reason"),
  // Client review and approval
  clientReviewed: boolean("client_reviewed").default(false),
  clientApproved: boolean("client_approved").default(false),
  clientFeedback: text("client_feedback"),
  reviewedAt: timestamp("reviewed_at"),
  // Session metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Freelance Work Diary - project completion reports for freelance work
export const freelanceWorkDiary = pgTable("freelance_work_diary", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entryId: varchar("entry_id").notNull().unique(), // FWD-ABC123 format
  contractId: varchar("contract_id").notNull().references(() => freelanceContracts.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  // Work summary
  title: text("title").notNull(),
  description: text("description").notNull(),
  workCompleted: text("work_completed").notNull(),
  deliverables: text("deliverables").array().default(sql`'{}'::text[]`),
  achievements: text("achievements").array().default(sql`'{}'::text[]`),
  challenges: text("challenges"),
  learnings: text("learnings"),
  nextSteps: text("next_steps"),
  // Time and effort
  totalHoursSpent: integer("total_hours_spent").notNull(),
  workStartDate: timestamp("work_start_date").notNull(),
  workEndDate: timestamp("work_end_date").notNull(),
  // Quality and metrics
  qualityScore: integer("quality_score"), // Self-assessed quality 1-10
  complexityLevel: text("complexity_level"), // low, medium, high, expert
  toolsUsed: text("tools_used").array().default(sql`'{}'::text[]`),
  // Client feedback and verification
  clientReviewed: boolean("client_reviewed").default(false),
  clientApproved: boolean("client_approved").default(false),
  clientRating: integer("client_rating"), // 1-5 stars
  clientFeedback: text("client_feedback"),
  verifiedAt: timestamp("verified_at"),
  // Attachments and references
  attachments: text("attachments").array().default(sql`'{}'::text[]`),
  screenshots: text("screenshots").array().default(sql`'{}'::text[]`),
  codeRepositories: text("code_repositories").array().default(sql`'{}'::text[]`),
  liveLinks: text("live_links").array().default(sql`'{}'::text[]`),
  // Status
  status: text("status").notNull().default("submitted"), // submitted, reviewed, approved, needs_revision
  // Timestamps
  submittedAt: timestamp("submitted_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job listings table for job discovery
export const jobListings = pgTable("job_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  location: text("location").notNull(),
  remoteType: text("remote_type").notNull().default("office"), // office, remote, hybrid
  employmentType: text("employment_type").notNull(), // full-time, part-time, contract, internship
  experienceLevel: text("experience_level").notNull(), // entry, mid, senior, executive
  salaryRange: text("salary_range"),
  benefits: text("benefits").array().default(sql`'{}'::text[]`),
  skills: text("skills").array().default(sql`'{}'::text[]`),
  applicationDeadline: timestamp("application_deadline"),
  status: text("status").notNull().default("active"), // active, paused, closed
  views: integer("views").default(0),
  applicationsCount: integer("applications_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job applications table
export const jobApplications = pgTable("job_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobListings.id, { onDelete: "cascade" }),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("applied"), // applied, viewed, shortlisted, interviewed, offered, rejected, withdrawn
  coverLetter: text("cover_letter"),
  resumeUrl: text("resume_url"),
  attachmentUrl: text("attachment_url"), // For additional documents, portfolio files, etc.
  attachmentName: text("attachment_name"), // Original filename for the attachment
  includeProfile: boolean("include_profile").default(true), // Share profile page as CV
  includeWorkDiary: boolean("include_work_diary").default(true), // Share work diary as experience
  appliedAt: timestamp("applied_at").defaultNow(),
  statusUpdatedAt: timestamp("status_updated_at").defaultNow(),
  companyNotes: text("company_notes"),
  interviewNotes: text("interview_notes"),
  rejectionReason: text("rejection_reason"), // For tracking why candidates were rejected
  salaryExpectation: text("salary_expectation"),
});

// Job saved/bookmarked by employees
export const savedJobs = pgTable("saved_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobListings.id, { onDelete: "cascade" }),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  savedAt: timestamp("saved_at").defaultNow(),
});

// Job alerts/preferences for employees
export const jobAlerts = pgTable("job_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  alertName: text("alert_name").notNull(),
  keywords: text("keywords").array().default(sql`'{}'::text[]`),
  locations: text("locations").array().default(sql`'{}'::text[]`),
  employmentTypes: text("employment_types").array().default(sql`'{}'::text[]`),
  experienceLevels: text("experience_levels").array().default(sql`'{}'::text[]`),
  salaryMin: integer("salary_min"),
  industries: text("industries").array().default(sql`'{}'::text[]`),
  isActive: boolean("is_active").default(true),
  emailNotifications: boolean("email_notifications").default(true),
  frequency: text("frequency").default("daily"), // instant, daily, weekly
  lastSent: timestamp("last_sent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email verification and OTP table
export const emailVerifications = pgTable("email_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  otpCode: varchar("otp_code", { length: 6 }).notNull(),
  purpose: varchar("purpose", { length: 20 }).notNull(), // 'password_reset' or 'email_verification'
  userType: varchar("user_type", { length: 10 }).notNull(), // 'employee', 'company', or 'client'
  userId: varchar("user_id"), // Can be null for new registrations
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Employee profile views by companies (analytics)
export const profileViews = pgTable("profile_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  viewerCompanyId: varchar("viewer_company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  viewedEmployeeId: varchar("viewed_employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewed_at").defaultNow(),
  viewContext: varchar("view_context"),
});

// Admin table for platform management
export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().unique(), // ADM-ABC123 format
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"), // admin, super_admin
  permissions: text("permissions").array().default(sql`'{}'::text[]`), // specific permissions
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User feedback table for collecting app feedback
export const userFeedback = pgTable("user_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userType: varchar("user_type", { length: 10 }).notNull(), // 'employee', 'company', 'admin', 'anonymous'
  userId: varchar("user_id"), // References the user ID, null for anonymous feedback
  userEmail: text("user_email"), // Email address for follow-up
  userName: text("user_name"), // User's name for context
  feedbackType: varchar("feedback_type", { length: 20 }).notNull(), // 'bug_report', 'feature_request', 'general', 'complaint', 'compliment'
  category: varchar("category", { length: 30 }).notNull(), // 'ui_ux', 'performance', 'functionality', 'content', 'security', 'other'
  title: text("title").notNull(), // Brief title/subject
  description: text("description").notNull(), // Detailed feedback description
  priority: varchar("priority", { length: 10 }).default("medium"), // 'low', 'medium', 'high', 'urgent'
  status: varchar("status", { length: 15 }).default("new"), // 'new', 'in_review', 'in_progress', 'resolved', 'closed', 'rejected'
  browserInfo: text("browser_info"), // Browser and device information
  pageUrl: text("page_url"), // Page where feedback was submitted
  attachments: text("attachments").array().default(sql`'{}'::text[]`), // Screenshots or file attachments
  adminNotes: text("admin_notes"), // Admin internal notes
  adminResponse: text("admin_response"), // Response sent to user
  respondedAt: timestamp("responded_at"), // When admin responded
  respondedBy: varchar("responded_by"), // Admin who responded
  rating: integer("rating"), // 1-5 rating if applicable
  isPublic: boolean("is_public").default(false), // Whether feedback can be shown publicly
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Login sessions table for tracking user login history
export const loginSessions = pgTable("login_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userType: varchar("user_type", { length: 10 }).notNull(), // 'employee', 'company', 'admin'
  userId: varchar("user_id").notNull(), // References the user ID
  sessionId: varchar("session_id").notNull(),
  loginAt: timestamp("login_at").defaultNow(),
  logoutAt: timestamp("logout_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  browserInfo: text("browser_info"),
  deviceType: text("device_type"), // 'desktop', 'mobile', 'tablet'
  location: text("location"), // Inferred from IP if available
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const employeesRelations = relations(employees, ({ many }) => ({
  experiences: many(experiences),
  educations: many(educations),
  certifications: many(certifications),
  projects: many(projects),
  endorsements: many(endorsements),
  employeeCompanies: many(employeeCompanies),
  workEntries: many(workEntries),
  companyEmployees: many(companyEmployees),
  teamMemberships: many(teamMembers), // New relation for team memberships
  jobApplications: many(jobApplications),
  savedJobs: many(savedJobs),
  jobAlerts: many(jobAlerts),
  profileViews: many(profileViews),
}));

export const experiencesRelations = relations(experiences, ({ one }) => ({
  employee: one(employees, {
    fields: [experiences.employeeId],
    references: [employees.id],
  }),
}));

export const educationsRelations = relations(educations, ({ one }) => ({
  employee: one(employees, {
    fields: [educations.employeeId],
    references: [employees.id],
  }),
}));

export const certificationsRelations = relations(certifications, ({ one }) => ({
  employee: one(employees, {
    fields: [certifications.employeeId],
    references: [employees.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  employee: one(employees, {
    fields: [projects.employeeId],
    references: [employees.id],
  }),
}));

export const endorsementsRelations = relations(endorsements, ({ one }) => ({
  employee: one(employees, {
    fields: [endorsements.employeeId],
    references: [employees.id],
  }),
}));

export const companyEmployeesRelations = relations(companyEmployees, ({ one, many }) => ({
  employee: one(employees, {
    fields: [companyEmployees.employeeId],
    references: [employees.id],
  }),
  company: one(companies, {
    fields: [companyEmployees.companyId],
    references: [companies.id],
  }),
  branch: one(companyBranches, {
    fields: [companyEmployees.branchId],
    references: [companyBranches.id],
  }),
  team: one(companyTeams, {
    fields: [companyEmployees.teamId],
    references: [companyTeams.id],
  }),
  workEntries: many(workEntries),
}));

export const workEntriesRelations = relations(workEntries, ({ one }) => ({
  employee: one(employees, {
    fields: [workEntries.employeeId],
    references: [employees.id],
  }),
  company: one(companies, {
    fields: [workEntries.companyId],
    references: [companies.id],
  }),
  team: one(companyTeams, {
    fields: [workEntries.teamId],
    references: [companyTeams.id],
  }),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  jobListings: many(jobListings),
  profileViews: many(profileViews),
  companyEmployees: many(companyEmployees),
  teamMembers: many(teamMembers), // New relation for team members
  invitationCodes: many(companyInvitationCodes),
  branches: many(companyBranches),
  teams: many(companyTeams),
  workEntries: many(workEntries),
  managers: many(companyManagers),
}));

// New hierarchy relations
export const companyBranchesRelations = relations(companyBranches, ({ one, many }) => ({
  company: one(companies, {
    fields: [companyBranches.companyId],
    references: [companies.id],
  }),
  teams: many(companyTeams),
  employees: many(companyEmployees),
  workEntries: many(workEntries),
}));

export const companyTeamsRelations = relations(companyTeams, ({ one, many }) => ({
  company: one(companies, {
    fields: [companyTeams.companyId],
    references: [companies.id],
  }),
  branch: one(companyBranches, {
    fields: [companyTeams.branchId],
    references: [companyBranches.id],
  }),
  teamManager: one(companyManagers, {
    fields: [companyTeams.teamManagerId],
    references: [companyManagers.id],
  }),
  members: many(companyEmployees),
  teamMembers: many(teamMembers), // New many-to-many relation
  workEntries: many(workEntries),
  managers: many(companyManagers),
}));

// Team members relations
export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(companyTeams, {
    fields: [teamMembers.teamId],
    references: [companyTeams.id],
  }),
  employee: one(employees, {
    fields: [teamMembers.employeeId],
    references: [employees.id],
  }),
  company: one(companies, {
    fields: [teamMembers.companyId],
    references: [companies.id],
  }),
}));

// Manager relations
export const companyManagersRelations = relations(companyManagers, ({ one, many }) => ({
  company: one(companies, {
    fields: [companyManagers.companyId],
    references: [companies.id],
  }),
  branch: one(companyBranches, {
    fields: [companyManagers.branchId],
    references: [companyBranches.id],
  }),
  team: one(companyTeams, {
    fields: [companyManagers.teamId],
    references: [companyTeams.id],
  }),
  permissions: one(managerPermissions),
  managedEmployees: many(companyEmployees),
  approvedWorkEntries: many(workEntries),
}));

export const managerPermissionsRelations = relations(managerPermissions, ({ one }) => ({
  manager: one(companyManagers, {
    fields: [managerPermissions.managerId],
    references: [companyManagers.id],
  }),
}));

export const jobListingsRelations = relations(jobListings, ({ one, many }) => ({
  company: one(companies, {
    fields: [jobListings.companyId],
    references: [companies.id],
  }),
  applications: many(jobApplications),
  savedJobs: many(savedJobs),
}));

export const jobApplicationsRelations = relations(jobApplications, ({ one }) => ({
  job: one(jobListings, {
    fields: [jobApplications.jobId],
    references: [jobListings.id],
  }),
  employee: one(employees, {
    fields: [jobApplications.employeeId],
    references: [employees.id],
  }),
}));

export const savedJobsRelations = relations(savedJobs, ({ one }) => ({
  job: one(jobListings, {
    fields: [savedJobs.jobId],
    references: [jobListings.id],
  }),
  employee: one(employees, {
    fields: [savedJobs.employeeId],
    references: [employees.id],
  }),
}));

export const jobAlertsRelations = relations(jobAlerts, ({ one }) => ({
  employee: one(employees, {
    fields: [jobAlerts.employeeId],
    references: [employees.id],
  }),
}));

export const profileViewsRelations = relations(profileViews, ({ one }) => ({
  viewedEmployee: one(employees, {
    fields: [profileViews.viewedEmployeeId],
    references: [employees.id],
  }),
  viewerCompany: one(companies, {
    fields: [profileViews.viewerCompanyId],
    references: [companies.id],
  }),
}));

// ====================
// FREELANCER MARKETPLACE RELATIONS
// ====================

export const clientsRelations = relations(clients, ({ many }) => ({
  freelanceProjects: many(freelanceProjects),
  freelanceContracts: many(freelanceContracts),
  freelanceWorkDiary: many(freelanceWorkDiary),
}));

export const freelanceProjectsRelations = relations(freelanceProjects, ({ one, many }) => ({
  client: one(clients, {
    fields: [freelanceProjects.clientId],
    references: [clients.id],
  }),
  proposals: many(projectProposals),
  contracts: many(freelanceContracts),
}));

export const projectProposalsRelations = relations(projectProposals, ({ one }) => ({
  project: one(freelanceProjects, {
    fields: [projectProposals.projectId],
    references: [freelanceProjects.id],
  }),
  employee: one(employees, {
    fields: [projectProposals.employeeId],
    references: [employees.id],
  }),
  contract: one(freelanceContracts, {
    fields: [projectProposals.id],
    references: [freelanceContracts.proposalId],
  }),
}));

export const freelanceContractsRelations = relations(freelanceContracts, ({ one, many }) => ({
  project: one(freelanceProjects, {
    fields: [freelanceContracts.projectId],
    references: [freelanceProjects.id],
  }),
  proposal: one(projectProposals, {
    fields: [freelanceContracts.proposalId],
    references: [projectProposals.id],
  }),
  client: one(clients, {
    fields: [freelanceContracts.clientId],
    references: [clients.id],
  }),
  employee: one(employees, {
    fields: [freelanceContracts.employeeId],
    references: [employees.id],
  }),
  liveMonitorSessions: many(liveMonitorSessions),
  workDiaryEntries: many(freelanceWorkDiary),
}));

export const liveMonitorSessionsRelations = relations(liveMonitorSessions, ({ one }) => ({
  contract: one(freelanceContracts, {
    fields: [liveMonitorSessions.contractId],
    references: [freelanceContracts.id],
  }),
  employee: one(employees, {
    fields: [liveMonitorSessions.employeeId],
    references: [employees.id],
  }),
}));

export const freelanceWorkDiaryRelations = relations(freelanceWorkDiary, ({ one }) => ({
  contract: one(freelanceContracts, {
    fields: [freelanceWorkDiary.contractId],
    references: [freelanceContracts.id],
  }),
  client: one(clients, {
    fields: [freelanceWorkDiary.clientId],
    references: [clients.id],
  }),
  employee: one(employees, {
    fields: [freelanceWorkDiary.employeeId],
    references: [employees.id],
  }),
}));

// Update existing employee relations to include freelancer marketplace
export const employeesRelationsUpdated = relations(employees, ({ many }) => ({
  experiences: many(experiences),
  educations: many(educations),
  certifications: many(certifications),
  projects: many(projects),
  endorsements: many(endorsements),
  employeeCompanies: many(employeeCompanies),
  workEntries: many(workEntries),
  companyEmployees: many(companyEmployees),
  teamMemberships: many(teamMembers),
  jobApplications: many(jobApplications),
  savedJobs: many(savedJobs),
  jobAlerts: many(jobAlerts),
  profileViews: many(profileViews),
  // New freelancer marketplace relations
  projectProposals: many(projectProposals),
  freelanceContracts: many(freelanceContracts),
  liveMonitorSessions: many(liveMonitorSessions),
  freelanceWorkDiary: many(freelanceWorkDiary),
}));

// Insert schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  employeeId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(12, "Password max length should be 12")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  phone: z.string()
    .refine((val: string) => {
      // Remove all non-digit characters for validation
      const digits = val.replace(/\D/g, '');
      // Basic validation - must have at least 7 digits and at most 15
      return digits.length >= 7 && digits.length <= 15;
    }, "Phone number must be 7-15 digits"),
});

export const insertExperienceSchema = createInsertSchema(experiences).omit({
  id: true,
  createdAt: true,
});

export const insertEducationSchema = createInsertSchema(educations).omit({
  id: true,
  createdAt: true,
});

export const insertCertificationSchema = createInsertSchema(certifications).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertEndorsementSchema = createInsertSchema(endorsements).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeCompanySchema = createInsertSchema(employeeCompanies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;

export const insertWorkEntrySchema = createInsertSchema(workEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  employeeId: true
}).extend({
  companyId: z.string().min(1, "Company selection is required"),
  title: z.string().min(1, "Work title is required").max(100, "Work title is too long"),
  roleType: z.string().min(1, "Role type is required"),
  difficultyLevel: z.string().min(1, "Difficulty level is required"), 
  completionTime: z.number().min(1, "Completion time is required"),
  startDate: z.string().refine((val) => dateRegex.test(val), {
    message: "Start date must be in dd/mm/yyyy format"
  }),
  endDate: z.string().refine((val) => dateRegex.test(val), {
    message: "End date must be in dd/mm/yyyy format"
  }),
  description: z.string().optional(),
  challenges: z.string().optional(),
  learnings: z.string().optional(),
  tags: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
}).refine((data) => {
  const [sd, sm, sy] = data.startDate.split("/").map(Number);
  const [ed, em, ey] = data.endDate.split("/").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  return start <= end;
}, {
  message: "Start date must be earlier than end date",
  path: ["endDate"],
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  companyId: true,
  createdAt: true,
  updatedAt: true,
  emailVerified: true,
  verificationStatus: true,
  verificationMethod: true,
  verificationDate: true,
  verificationNotes: true,
  verificationDocuments: true,
  rejectionReason: true,
  isActive: true,
  cinVerificationStatus: true,
  cinVerifiedAt: true,
  cinVerifiedBy: true,
  isBasicDetailsLocked: true,
}).extend({
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(12, "Password max length should be 12")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  pincode: z.string().min(5, "Pincode must be at least 5 digits"),
  registrationNumber: z.string().optional(),
  industry: z.string().min(1, "Please select an industry"),
  establishmentYear: z.string()
    .min(1, "Establishment year is required")
    .refine((val) => {
      const year = parseInt(val);
      return !isNaN(year) && year >= 1800 && year <= new Date().getFullYear();
    }, "Invalid establishment year"),
  cin: z.string()
    .optional()
    .refine((val) => !val || val.length === 21, "CIN must be exactly 21 characters")
    .refine((val) => !val || /^[A-Z][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(val), "Invalid CIN format. Example: L12345AB2020PLC123456"),
  panNumber: z.string()
    .optional()
    .refine((val) => !val || val.length === 10, "PAN must be exactly 10 characters")
    .refine((val) => !val || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val), "Invalid PAN format. Example: ABCDE1234F"),
});

// Insert schemas for hierarchy tables
export const insertCompanyBranchSchema = createInsertSchema(companyBranches).omit({
  id: true,
  branchId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanyTeamSchema = createInsertSchema(companyTeams).omit({
  id: true,
  teamId: true,
  createdAt: true,
  updatedAt: true,
});

// Manager insert schemas
export const insertCompanyManagerSchema = createInsertSchema(companyManagers).omit({
  id: true,
  createdAt: true,
}).extend({
  managerName: z.string().min(2, "Manager name must be at least 2 characters"),
  managerEmail: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(12, "Password max length should be 12")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),
});

export const insertManagerPermissionSchema = createInsertSchema(managerPermissions).omit({
  id: true,
});

export const insertCompanyEmployeeSchema = createInsertSchema(companyEmployees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanyInvitationCodeSchema = createInsertSchema(companyInvitationCodes).omit({
  id: true,
  code: true,
  expiresAt: true,
  usedByEmployeeId: true,
  usedAt: true,
  createdAt: true,
});



export const insertJobListingSchema = createInsertSchema(jobListings).omit({
  id: true,
  views: true,
  applicationsCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  appliedAt: true,
  statusUpdatedAt: true,
});

export const insertSavedJobSchema = createInsertSchema(savedJobs).omit({
  id: true,
  savedAt: true,
});

export const insertJobAlertSchema = createInsertSchema(jobAlerts).omit({
  id: true,
  lastSent: true,
  createdAt: true,
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  adminId: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(12, "Password max length should be 12")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  username: z.string().min(3, "Username must be at least 3 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  accountType: z.enum(["employee", "company", "client"], {
    required_error: "Please select an account type",
  }),
});

export const insertFeedbackSchema = createInsertSchema(userFeedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  respondedAt: true,
  respondedBy: true,
}).extend({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description too long"),
  userEmail: z.string().email("Invalid email format").optional(),
  userType: z.enum(["employee", "company", "admin", "anonymous"]).optional(),
  feedbackType: z.enum(["bug_report", "feature_request", "general", "complaint", "compliment"]),
  category: z.enum(["ui_ux", "performance", "functionality", "content", "security", "other"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  rating: z.number().min(1).max(5).optional(),
});

export const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const feedbackResponseSchema = z.object({
  adminResponse: z.string().optional(),
  status: z.enum(["in_review", "in_progress", "resolved", "closed", "rejected"]),
});

export const insertEmailVerificationSchema = createInsertSchema(emailVerifications).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email("Invalid email format"),
  otpCode: z.string().length(6, "OTP code must be 6 digits"),
  purpose: z.enum(["password_reset", "email_verification"]),
  userType: z.enum(["employee", "company", "client"]),
});

export const insertLoginSessionSchema = createInsertSchema(loginSessions).omit({
  id: true,
  createdAt: true,
});

export const verifyOTPSchema = z.object({
  email: z.string().email("Invalid email format"),
  otpCode: z.string().length(6, "OTP code must be 6 digits"),
  purpose: z.enum(["password_reset", "email_verification"]),
  userType: z.enum(["employee", "company", "client"]),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  otpCode: z.string().length(6, "OTP code must be 6 digits"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(12, "Password max length should be 12")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  userType: z.enum(["employee", "company", "client"]),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email("Invalid email format"),
  userType: z.enum(["employee", "company", "client"]),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(12, "Password max length should be 12")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});





export const companyInvitationCodesRelations = relations(companyInvitationCodes, ({ one }) => ({
  company: one(companies, {
    fields: [companyInvitationCodes.companyId],
    references: [companies.id],
  }),
  usedByEmployee: one(employees, {
    fields: [companyInvitationCodes.usedByEmployeeId],
    references: [employees.id],
  }),
}));





// Export types
export type Employee = typeof employees.$inferSelect;
export type Experience = typeof experiences.$inferSelect;
export type Education = typeof educations.$inferSelect;
export type Certification = typeof certifications.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Endorsement = typeof endorsements.$inferSelect;
export type EmployeeCompany = typeof employeeCompanies.$inferSelect;
export type WorkEntry = typeof workEntries.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type CompanyInvitationCode = typeof companyInvitationCodes.$inferSelect;
export type CompanyEmployee = typeof companyEmployees.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type CompanyBranch = typeof companyBranches.$inferSelect;
export type CompanyTeam = typeof companyTeams.$inferSelect;
export type CompanyManager = typeof companyManagers.$inferSelect;
export type ManagerPermission = typeof managerPermissions.$inferSelect;

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type InsertExperience = z.infer<typeof insertExperienceSchema>;
export type InsertEducation = z.infer<typeof insertEducationSchema>;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertEndorsement = z.infer<typeof insertEndorsementSchema>;
export type InsertEmployeeCompany = z.infer<typeof insertEmployeeCompanySchema>;
export type InsertCompanyManager = z.infer<typeof insertCompanyManagerSchema>;
export type InsertManagerPermission = z.infer<typeof insertManagerPermissionSchema>;
export type InsertWorkEntry = z.infer<typeof insertWorkEntrySchema>;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertCompanyInvitationCode = z.infer<typeof insertCompanyInvitationCodeSchema>;
export type InsertCompanyEmployee = z.infer<typeof insertCompanyEmployeeSchema>;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type InsertCompanyBranch = z.infer<typeof insertCompanyBranchSchema>;
export type InsertCompanyTeam = z.infer<typeof insertCompanyTeamSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type RequestPasswordResetData = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type VerifyOTPData = z.infer<typeof verifyOTPSchema>;

// Job-related types
export type JobListing = typeof jobListings.$inferSelect;
export type JobApplication = typeof jobApplications.$inferSelect;
export type SavedJob = typeof savedJobs.$inferSelect;
export type JobAlert = typeof jobAlerts.$inferSelect;
export type ProfileView = typeof profileViews.$inferSelect;

export type InsertJobListing = z.infer<typeof insertJobListingSchema>;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type InsertSavedJob = z.infer<typeof insertSavedJobSchema>;
export type InsertJobAlert = z.infer<typeof insertJobAlertSchema>;

// Admin types
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;

// Login session types
export type LoginSession = typeof loginSessions.$inferSelect;
export type InsertLoginSession = z.infer<typeof insertLoginSessionSchema>;

// Feedback types
export type UserFeedback = typeof userFeedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

// Secure Email Management System Tables

// Users table with primary_email concept
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  primaryEmail: text("primary_email").notNull().unique(), // The email used for login and notifications
  passwordHash: text("password_hash").notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"), // TOTP secret
  accountType: text("account_type").notNull(), // 'employee' or 'company'
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Emails table - tracks all emails associated with a user
export const emails = pgTable("emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  status: text("status").notNull(), // 'primary', 'detached', 'pending_verification'
  verificationToken: text("verification_token"), // UUID for email verification
  verificationExpiresAt: timestamp("verification_expires_at"),
  verifiedAt: timestamp("verified_at"),
  detachedAt: timestamp("detached_at"), // When email became detached
  graceExpiresAt: timestamp("grace_expires_at"), // When 30-day grace period ends
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_emails_user_id").on(table.userId),
  index("idx_emails_status").on(table.status),
  index("idx_emails_verification_token").on(table.verificationToken),
]);

// Email change logs - comprehensive audit trail
export const emailChangeLogs = pgTable("email_change_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  oldEmail: text("old_email").notNull(),
  newEmail: text("new_email").notNull(),
  changeType: text("change_type").notNull(), // 'primary_change', 'verification_requested', 'verification_completed'
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  twoFactorUsed: boolean("two_factor_used").default(false),
  verificationToken: text("verification_token"), // Reference to verification
  status: text("status").notNull().default("pending"), // 'pending', 'verified', 'failed', 'expired'
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("idx_email_change_logs_user_id").on(table.userId),
  index("idx_email_change_logs_timestamp").on(table.timestamp),
]);

// Secure Email Management Schemas (after table definitions)
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailSchema = createInsertSchema(emails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailChangeLogSchema = createInsertSchema(emailChangeLogs).omit({
  id: true,
  timestamp: true,
});

// Email change request schema with security requirements
export const emailChangeRequestSchema = z.object({
  newEmail: z.string().email("Invalid email format"),
  currentPassword: z.string().min(1, "Current password is required"),
  twoFactorCode: z.string().optional(), // Optional TOTP code if 2FA is enabled
});

// Email verification schema
export const emailVerificationSchema = z.object({
  verificationToken: z.string().uuid("Invalid verification token"),
  email: z.string().email("Invalid email format"),
});

// Email ownership verification for signup blocking
export const emailOwnershipCheckSchema = z.object({
  email: z.string().email("Invalid email format"),
});

// Account recovery schema
export const accountRecoverySchema = z.object({
  email: z.string().email("Invalid email format"),
  twoFactorCode: z.string().optional(),
});

// Email Management Relations (after all table definitions)
export const usersRelations = relations(users, ({ many }) => ({
  emails: many(emails),
  emailChangeLogs: many(emailChangeLogs),
}));

export const emailsRelations = relations(emails, ({ one }) => ({
  user: one(users, {
    fields: [emails.userId],
    references: [users.id],
  }),
}));

export const emailChangeLogsRelations = relations(emailChangeLogs, ({ one }) => ({
  user: one(users, {
    fields: [emailChangeLogs.userId],
    references: [users.id],
  }),
}));

// Secure Email Management Types
export type User = typeof users.$inferSelect;
export type Email = typeof emails.$inferSelect;
export type EmailChangeLog = typeof emailChangeLogs.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type InsertEmailChangeLog = z.infer<typeof insertEmailChangeLogSchema>;

export type EmailChangeRequestData = z.infer<typeof emailChangeRequestSchema>;
export type EmailVerificationData = z.infer<typeof emailVerificationSchema>;
export type EmailOwnershipCheckData = z.infer<typeof emailOwnershipCheckSchema>;
export type AccountRecoveryData = z.infer<typeof accountRecoverySchema>;

// Skills taxonomy and trending data
export const skills = pgTable("skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").unique().notNull(),
  category: varchar("category").notNull(), // e.g., "technical", "soft", "language", "tool"
  aliases: text("aliases").array().default([]), // Alternative names/spellings
  relatedSkillIds: text("related_skill_ids").array().default([]),
  isTechnical: boolean("is_technical").default(true),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const skillTrends = pgTable("skill_trends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  skillId: varchar("skill_id").references(() => skills.id, { onDelete: "cascade" }).notNull(),
  jobCount7d: integer("job_count_7d").default(0),
  jobCount30d: integer("job_count_30d").default(0),
  jobCountTotal: integer("job_count_total").default(0),
  growthPct: numeric("growth_pct", { precision: 5, scale: 2 }).default('0'),
  clickThruRate: numeric("click_thru_rate", { precision: 5, scale: 4 }).default('0'),
  applyRateFromSkill: numeric("apply_rate_from_skill", { precision: 5, scale: 4 }).default('0'),
  trendingScore: numeric("trending_score", { precision: 5, scale: 4 }).default('0'),
  region: varchar("region"), // Optional regional trends
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("skill_trends_skill_id_idx").on(table.skillId),
  index("skill_trends_trending_score_idx").on(table.trendingScore),
]);

// User skill preferences
export const userSkillPreferences = pgTable("user_skill_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  skillId: varchar("skill_id").references(() => skills.id, { onDelete: "cascade" }).notNull(),
  isPinned: boolean("is_pinned").default(false),
  isHidden: boolean("is_hidden").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("user_skill_prefs_user_id_idx").on(table.userId),
  index("user_skill_prefs_skill_id_idx").on(table.skillId),
]);

// Analytics events for skills
export const skillAnalytics = pgTable("skill_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => employees.id, { onDelete: "cascade" }),
  skillId: varchar("skill_id").references(() => skills.id, { onDelete: "cascade" }),
  eventType: varchar("event_type").notNull(), // trending_view, skill_chip_click, etc.
  context: jsonb("context"), // Additional event data
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("skill_analytics_user_id_idx").on(table.userId),
  index("skill_analytics_skill_id_idx").on(table.skillId),
  index("skill_analytics_event_type_idx").on(table.eventType),
]);

export type Skill = typeof skills.$inferSelect;
export type SkillTrend = typeof skillTrends.$inferSelect;
export type UserSkillPreference = typeof userSkillPreferences.$inferSelect;
export type SkillAnalytic = typeof skillAnalytics.$inferSelect;

export const insertSkillSchema = createInsertSchema(skills);
export const insertSkillTrendSchema = createInsertSchema(skillTrends);
export const insertUserSkillPreferenceSchema = createInsertSchema(userSkillPreferences);
export const insertSkillAnalyticSchema = createInsertSchema(skillAnalytics);

export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type InsertSkillTrend = z.infer<typeof insertSkillTrendSchema>;
export type InsertUserSkillPreference = z.infer<typeof insertUserSkillPreferenceSchema>;
export type InsertSkillAnalytic = z.infer<typeof insertSkillAnalyticSchema>;

// Pending user types for signup verification
export type InsertPendingUser = typeof pendingUsers.$inferInsert;
export type PendingUser = typeof pendingUsers.$inferSelect;
export const insertPendingUserSchema = createInsertSchema(pendingUsers);

// Contact form schema
export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// Recruiter functionality tables
export const recruiterProfiles = pgTable("recruiter_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // References either company.id or employee.id
  userType: text("user_type").notNull(), // 'company' or 'employee' (independent recruiters)
  recruiterType: text("recruiter_type").notNull().default("internal"), // internal, external, agency
  companyName: text("company_name"),
  agencyName: text("agency_name"),
  specializations: text("specializations").array(), // industries/roles they focus on
  experienceLevel: text("experience_level"), // junior, senior, lead, director
  activePositions: integer("active_positions").default(0),
  successfulPlacements: integer("successful_placements").default(0),
  averageTimeToHire: integer("average_time_to_hire").default(30), // days
  subscriptionTier: text("subscription_tier").default("free"), // free, basic, pro, enterprise
  subscriptionStatus: text("subscription_status").default("active"), // active, inactive, trial
  subscriptionExpiry: timestamp("subscription_expiry"),
  monthlySearchLimit: integer("monthly_search_limit").default(50),
  monthlyContactLimit: integer("monthly_contact_limit").default(25),
  usedSearches: integer("used_searches").default(0),
  usedContacts: integer("used_contacts").default(0),
  lastResetDate: timestamp("last_reset_date").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("recruiter_profiles_user_id_idx").on(table.userId),
  index("recruiter_profiles_user_type_idx").on(table.userType),
  index("recruiter_profiles_subscription_tier_idx").on(table.subscriptionTier),
]);

export const candidatePipelines = pgTable("candidate_pipelines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recruiterId: varchar("recruiter_id").notNull().references(() => recruiterProfiles.id, { onDelete: "cascade" }),
  candidateId: varchar("candidate_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  positionTitle: text("position_title").notNull(),
  companyName: text("company_name").notNull(),
  stage: text("stage").notNull().default("sourced"), // sourced, contacted, screening, interview, final_round, offer, hired, rejected
  priority: text("priority").default("medium"), // low, medium, high, urgent
  source: text("source"), // linkedin, referral, direct_search, job_board
  expectedSalary: text("expected_salary"),
  currentSalary: text("current_salary"),
  noticePeriod: text("notice_period"),
  location: text("location"),
  workType: text("work_type"), // remote, hybrid, onsite
  skills: text("skills").array(),
  matchScore: integer("match_score"), // 1-100 algorithm-based matching score
  notes: text("notes"),
  nextFollowUp: timestamp("next_follow_up"),
  stageUpdatedAt: timestamp("stage_updated_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("candidate_pipelines_recruiter_id_idx").on(table.recruiterId),
  index("candidate_pipelines_candidate_id_idx").on(table.candidateId),
  index("candidate_pipelines_stage_idx").on(table.stage),
  index("candidate_pipelines_priority_idx").on(table.priority),
  index("candidate_pipelines_next_follow_up_idx").on(table.nextFollowUp),
]);

export const candidateInteractions = pgTable("candidate_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pipelineId: varchar("pipeline_id").notNull().references(() => candidatePipelines.id, { onDelete: "cascade" }),
  recruiterId: varchar("recruiter_id").notNull().references(() => recruiterProfiles.id, { onDelete: "cascade" }),
  candidateId: varchar("candidate_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  interactionType: text("interaction_type").notNull(), // email, call, message, interview, meeting, note
  title: text("title").notNull(),
  content: text("content"),
  outcome: text("outcome"), // positive, neutral, negative, no_response
  scheduledAt: timestamp("scheduled_at"),
  duration: integer("duration"), // minutes for calls/meetings
  attendees: text("attendees").array(), // for interviews/meetings
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  attachments: jsonb("attachments"), // file references, email threads, etc.
  metadata: jsonb("metadata"), // additional structured data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("candidate_interactions_pipeline_id_idx").on(table.pipelineId),
  index("candidate_interactions_recruiter_id_idx").on(table.recruiterId),
  index("candidate_interactions_candidate_id_idx").on(table.candidateId),
  index("candidate_interactions_type_idx").on(table.interactionType),
  index("candidate_interactions_scheduled_at_idx").on(table.scheduledAt),
]);

export const recruitmentAnalytics = pgTable("recruitment_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recruiterId: varchar("recruiter_id").notNull().references(() => recruiterProfiles.id, { onDelete: "cascade" }),
  metricType: text("metric_type").notNull(), // searches_performed, contacts_made, interviews_conducted, hires_made
  metricValue: integer("metric_value").notNull(),
  dateRecorded: timestamp("date_recorded").defaultNow(),
  metadata: jsonb("metadata"), // additional context like position_type, industry, etc.
}, (table) => [
  index("recruitment_analytics_recruiter_id_idx").on(table.recruiterId),
  index("recruitment_analytics_metric_type_idx").on(table.metricType),
  index("recruitment_analytics_date_idx").on(table.dateRecorded),
]);

export const savedSearches = pgTable("saved_searches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recruiterId: varchar("recruiter_id").notNull().references(() => recruiterProfiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  searchCriteria: jsonb("search_criteria").notNull(), // filters, keywords, etc.
  alertsEnabled: boolean("alerts_enabled").default(false),
  alertFrequency: text("alert_frequency").default("daily"), // daily, weekly, monthly
  lastExecuted: timestamp("last_executed"),
  resultsCount: integer("results_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("saved_searches_recruiter_id_idx").on(table.recruiterId),
  index("saved_searches_alerts_enabled_idx").on(table.alertsEnabled),
]);

// Type exports for recruiter functionality
export type RecruiterProfile = typeof recruiterProfiles.$inferSelect;
export type CandidatePipeline = typeof candidatePipelines.$inferSelect;
export type CandidateInteraction = typeof candidateInteractions.$inferSelect;
export type RecruitmentAnalytic = typeof recruitmentAnalytics.$inferSelect;
export type SavedSearch = typeof savedSearches.$inferSelect;

// Insert schemas for recruiter functionality
export const insertRecruiterProfileSchema = createInsertSchema(recruiterProfiles);
export const insertCandidatePipelineSchema = createInsertSchema(candidatePipelines);
export const insertCandidateInteractionSchema = createInsertSchema(candidateInteractions);
export const insertRecruitmentAnalyticSchema = createInsertSchema(recruitmentAnalytics);
export const insertSavedSearchSchema = createInsertSchema(savedSearches);

// Insert types for recruiter functionality
export type InsertRecruiterProfile = z.infer<typeof insertRecruiterProfileSchema>;
export type InsertCandidatePipeline = z.infer<typeof insertCandidatePipelineSchema>;
export type InsertCandidateInteraction = z.infer<typeof insertCandidateInteractionSchema>;
export type InsertRecruitmentAnalytic = z.infer<typeof insertRecruitmentAnalyticSchema>;
export type InsertSavedSearch = z.infer<typeof insertSavedSearchSchema>;

// ====================
// FREELANCER MARKETPLACE INSERT SCHEMAS & TYPES
// ====================

// Client authentication and account management
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  clientId: true,
  createdAt: true,
  updatedAt: true,
  emailVerified: true,
  phoneVerified: true,
  identityVerified: true,
  isActive: true,
  lastLoginAt: true,
}).extend({
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(12, "Password max length should be 12")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  phone: z.string()
    .refine((val: string) => {
      const digits = val.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 15;
    }, "Phone number must be 7-15 digits"),
});

// Project management schemas
export const insertFreelanceProjectSchema = createInsertSchema(freelanceProjects).omit({
  id: true,
  projectId: true,
  posted_at: true,
  updated_at: true,
  proposals_count: true,
  views_count: true,
}).extend({
  title: z.string().min(10, "Project title must be at least 10 characters").max(100, "Title too long"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  requirements: z.string().min(20, "Requirements must be at least 20 characters"),
  budgetAmount: z.number().min(500, "Minimum budget is $5.00").optional(),
  budgetMin: z.number().min(500, "Minimum budget is $5.00").optional(),
  budgetMax: z.number().min(1000, "Maximum budget must be at least $10.00").optional(),
});

export const insertProjectProposalSchema = createInsertSchema(projectProposals).omit({
  id: true,
  proposalId: true,
  submitted_at: true,
  status_updated_at: true,
  client_viewed_at: true,
  messages_count: true,
  last_message_at: true,
}).extend({
  coverLetter: z.string().min(100, "Cover letter must be at least 100 characters"),
  proposedRate: z.number().min(500, "Minimum rate is $5.00"),
  estimatedDuration: z.string().min(3, "Please provide estimated duration"),
});

export const insertFreelanceContractSchema = createInsertSchema(freelanceContracts).omit({
  id: true,
  contractId: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  totalHoursWorked: true,
  totalAmountEarned: true,
  completionPercentage: true,
});

export const insertLiveMonitorSessionSchema = createInsertSchema(liveMonitorSessions).omit({
  id: true,
  sessionId: true,
  createdAt: true,
  updatedAt: true,
  duration: true,
  activityLevel: true,
  keyboardEvents: true,
  mouseEvents: true,
  activeMinutes: true,
  idleMinutes: true,
  billableMinutes: true,
  clientReviewed: true,
  clientApproved: true,
  reviewedAt: true,
});

export const insertFreelanceWorkDiarySchema = createInsertSchema(freelanceWorkDiary).omit({
  id: true,
  entryId: true,
  submittedAt: true,
  updatedAt: true,
  clientReviewed: true,
  clientApproved: true,
  verifiedAt: true,
}).extend({
  title: z.string().min(10, "Title must be at least 10 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  workCompleted: z.string().min(30, "Work completed must be at least 30 characters"),
  totalHoursSpent: z.number().min(1, "Must log at least 1 hour"),
});

// Types for freelancer marketplace
export type Client = typeof clients.$inferSelect;
export type FreelanceProject = typeof freelanceProjects.$inferSelect;
export type ProjectProposal = typeof projectProposals.$inferSelect;
export type FreelanceContract = typeof freelanceContracts.$inferSelect;
export type LiveMonitorSession = typeof liveMonitorSessions.$inferSelect;
export type FreelanceWorkDiary = typeof freelanceWorkDiary.$inferSelect;

// Insert types
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertFreelanceProject = z.infer<typeof insertFreelanceProjectSchema>;
export type InsertProjectProposal = z.infer<typeof insertProjectProposalSchema>;
export type InsertFreelanceContract = z.infer<typeof insertFreelanceContractSchema>;
export type InsertLiveMonitorSession = z.infer<typeof insertLiveMonitorSessionSchema>;
export type InsertFreelanceWorkDiary = z.infer<typeof insertFreelanceWorkDiarySchema>;

// Additional client auth schemas
export const clientSignupSchema = insertClientSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ClientSignupData = z.infer<typeof clientSignupSchema>;
