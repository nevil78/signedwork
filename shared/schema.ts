import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  skills: text("skills").array(),
  languages: text("languages").array(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country"),
  dateOfBirth: text("date_of_birth"),
  nationality: text("nationality"),
  maritalStatus: text("marital_status"),
  hobbies: text("hobbies").array(),
  certifications: text("certifications").array(),
  achievements: text("achievements").array(),
  portfolioUrl: text("portfolio_url"),
  githubUrl: text("github_url"),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
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
  priority: text("priority").notNull().default("medium"), // low, medium, high
  hours: integer("hours"), // optional hours field
  status: text("status").notNull().default("pending"), // pending, approved, needs_changes
  companyFeedback: text("company_feedback"), // feedback from company when requesting changes
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
  registrationType: text("registration_type").notNull(), // CIN or PAN
  registrationNumber: text("registration_number").notNull(),
  industry: text("industry").notNull(),
  email: text("email").notNull().unique(),
  size: text("size").notNull(),
  establishmentYear: integer("establishment_year").notNull(),
  password: text("password").notNull(),
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
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
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
}).extend({
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  pincode: z.string().min(5, "Pincode must be at least 5 digits"),
  registrationType: z.enum(["CIN", "PAN"], {
    required_error: "Please select registration type",
  }),
  industry: z.string().min(1, "Please select an industry"),
  establishmentYear: z.number()
    .min(1800, "Invalid establishment year")
    .max(new Date().getFullYear(), "Invalid establishment year"),
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

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  accountType: z.enum(["employee", "company"], {
    required_error: "Please select an account type",
  }),
});

export const companiesRelations = relations(companies, ({ many }) => ({
  invitationCodes: many(companyInvitationCodes),
  companyEmployees: many(companyEmployees),
}));

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
