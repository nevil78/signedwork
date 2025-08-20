import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, numeric, jsonb, index } from "drizzle-orm/pg-core";
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
  title: text("title").notNull(),
  description: text("description"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  hours: integer("hours"), // optional hours field
  estimatedHours: integer("estimated_hours"), // estimated time to complete
  actualHours: integer("actual_hours"), // actual time spent
  status: text("status").notNull().default("pending"), // Employee task status: pending, in_progress, completed, on_hold
  approvalStatus: text("approval_status").notNull().default("pending_review"), // Company approval: pending_review, approved, needs_changes
  workType: text("work_type").notNull().default("task"), // task, meeting, project, research, documentation, training
  category: text("category"), // development, design, management, client_work, etc.
  project: text("project"), // project name or identifier
  client: text("client"), // if work is client-specific
  billable: boolean("billable").default(false), // whether this work is billable
  billableRate: integer("billable_rate"), // hourly rate if billable
  tags: text("tags").array().default(sql`'{}'::text[]`), // tags for categorization
  achievements: text("achievements").array().default(sql`'{}'::text[]`), // key accomplishments
  challenges: text("challenges"), // challenges faced during work
  learnings: text("learnings"), // what was learned from this work
  companyFeedback: text("company_feedback"), // feedback from company when requesting changes
  companyRating: integer("company_rating"), // 1-5 rating from company
  attachments: text("attachments").array().default(sql`'{}'::text[]`), // file URLs or paths
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
  registrationType: text("registration_type"), // CIN or PAN (optional)
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
  isBasicDetailsLocked: boolean("is_basic_details_locked").default(false),
  industry: text("industry").notNull(),
  email: text("email").notNull().unique(),
  size: text("size").notNull(),
  establishmentYear: integer("establishment_year").notNull(),
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

// New table for company-employee relationships
export const companyEmployees = pgTable("company_employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  position: text("position"),
  department: text("department"),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  status: varchar("status", { length: 20 }).default("employed").notNull(), // "employed" or "ex-employee"
  isActive: boolean("is_active").default(true),
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
  userType: varchar("user_type", { length: 10 }).notNull(), // 'employee' or 'company'
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

export const employeeCompaniesRelations = relations(employeeCompanies, ({ one, many }) => ({
  employee: one(employees, {
    fields: [employeeCompanies.employeeId],
    references: [employees.id],
  }),
  workEntries: many(workEntries),
}));

export const workEntriesRelations = relations(workEntries, ({ one }) => ({
  employee: one(employees, {
    fields: [workEntries.employeeId],
    references: [employees.id],
  }),
  company: one(employeeCompanies, {
    fields: [workEntries.companyId],
    references: [employeeCompanies.id],
  }),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  jobListings: many(jobListings),
  profileViews: many(profileViews),
  companyEmployees: many(companyEmployees),
  invitationCodes: many(companyInvitationCodes),
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
    .max(12)
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

export const insertWorkEntrySchema = createInsertSchema(workEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
    .max(12)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  pincode: z.string().min(5, "Pincode must be at least 5 digits"),
  registrationType: z.enum(["CIN", "PAN"]).optional(),
  registrationNumber: z.string().optional(),
  industry: z.string().min(1, "Please select an industry"),
  establishmentYear: z.number()
    .min(1800, "Invalid establishment year")
    .max(new Date().getFullYear(), "Invalid establishment year"),
  cin: z.string()
    .optional()
    .refine((val) => !val || val.length === 21, "CIN must be exactly 21 characters")
    .refine((val) => !val || /^[A-Z][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(val), "Invalid CIN format. Example: L12345AB2020PLC123456"),
  panNumber: z.string()
    .optional()
    .refine((val) => !val || val.length === 10, "PAN must be exactly 10 characters")
    .refine((val) => !val || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val), "Invalid PAN format. Example: ABCDE1234F"),
});

export const insertCompanyInvitationCodeSchema = createInsertSchema(companyInvitationCodes).omit({
  id: true,
  code: true,
  expiresAt: true,
  usedByEmployeeId: true,
  usedAt: true,
  createdAt: true,
});

export const insertCompanyEmployeeSchema = createInsertSchema(companyEmployees).omit({
  id: true,
  joinedAt: true,
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
    .max(12)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  username: z.string().min(3, "Username must be at least 3 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  accountType: z.enum(["employee", "company"], {
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
  adminResponse: z.string().min(1, "Response is required"),
  status: z.enum(["in_review", "in_progress", "resolved", "closed", "rejected"]),
});

export const insertEmailVerificationSchema = createInsertSchema(emailVerifications).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email("Invalid email format"),
  otpCode: z.string().length(6, "OTP code must be 6 digits"),
  purpose: z.enum(["password_reset", "email_verification"]),
  userType: z.enum(["employee", "company"]),
});

export const insertLoginSessionSchema = createInsertSchema(loginSessions).omit({
  id: true,
  createdAt: true,
});

export const verifyOTPSchema = z.object({
  email: z.string().email("Invalid email format"),
  otpCode: z.string().length(6, "OTP code must be 6 digits"),
  purpose: z.enum(["password_reset", "email_verification"]),
  userType: z.enum(["employee", "company"]),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  otpCode: z.string().length(6, "OTP code must be 6 digits"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(12)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  userType: z.enum(["employee", "company"]),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email("Invalid email format"),
  userType: z.enum(["employee", "company"]),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(12)
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

export const companyEmployeesRelations = relations(companyEmployees, ({ one }) => ({
  company: one(companies, {
    fields: [companyEmployees.companyId],
    references: [companies.id],
  }),
  employee: one(employees, {
    fields: [companyEmployees.employeeId],
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

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type InsertExperience = z.infer<typeof insertExperienceSchema>;
export type InsertEducation = z.infer<typeof insertEducationSchema>;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertEndorsement = z.infer<typeof insertEndorsementSchema>;
export type InsertEmployeeCompany = z.infer<typeof insertEmployeeCompanySchema>;
export type InsertWorkEntry = z.infer<typeof insertWorkEntrySchema>;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertCompanyInvitationCode = z.infer<typeof insertCompanyInvitationCodeSchema>;
export type InsertCompanyEmployee = z.infer<typeof insertCompanyEmployeeSchema>;
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
