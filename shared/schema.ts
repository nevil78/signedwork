import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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

export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  pincode: text("pincode").notNull(),
  registrationNumber: text("registration_number").notNull(),
  email: text("email").notNull().unique(),
  size: text("size").notNull(),
  establishmentYear: integer("establishment_year").notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const employeesRelations = relations(employees, ({ many }) => ({
  experiences: many(experiences),
  educations: many(educations),
  certifications: many(certifications),
  projects: many(projects),
  endorsements: many(endorsements),
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

// Insert schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
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

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  pincode: z.string().min(5, "Pincode must be at least 5 digits"),
  establishmentYear: z.number()
    .min(1800, "Invalid establishment year")
    .max(new Date().getFullYear(), "Invalid establishment year"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  accountType: z.enum(["employee", "company"], {
    required_error: "Please select an account type",
  }),
});

// Type exports
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;

export type Experience = typeof experiences.$inferSelect;
export type InsertExperience = z.infer<typeof insertExperienceSchema>;
export type Education = typeof educations.$inferSelect;
export type InsertEducation = z.infer<typeof insertEducationSchema>;
export type Certification = typeof certifications.$inferSelect;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Endorsement = typeof endorsements.$inferSelect;
export type InsertEndorsement = z.infer<typeof insertEndorsementSchema>;
