import { 
  employees, companies, experiences, educations, certifications, projects, endorsements, workEntries, employeeCompanies,
  companyInvitationCodes, companyEmployees, jobListings, jobApplications, savedJobs, jobAlerts, profileViews, admins,
  type Employee, type Company, type InsertEmployee, type InsertCompany,
  type Experience, type Education, type Certification, type Project, type Endorsement, type WorkEntry, type EmployeeCompany,
  type InsertExperience, type InsertEducation, type InsertCertification, 
  type InsertProject, type InsertEndorsement, type InsertWorkEntry, type InsertEmployeeCompany,
  type CompanyInvitationCode, type CompanyEmployee, type InsertCompanyInvitationCode, type InsertCompanyEmployee,
  type JobListing, type JobApplication, type SavedJob, type JobAlert, type ProfileView,
  type InsertJobListing, type InsertJobApplication, type InsertSavedJob, type InsertJobAlert,
  type Admin, type InsertAdmin
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
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

export interface IStorage {
  // Employee operations
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, data: Partial<Employee>): Promise<Employee>;
  
  // Company operations
  getCompany(id: string): Promise<Company | undefined>;
  getCompanyByEmail(email: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  
  // Authentication
  authenticateEmployee(email: string, password: string): Promise<Employee | null>;
  authenticateCompany(email: string, password: string): Promise<Company | null>;
  
  // Employee Profile Data
  getEmployeeProfile(employeeId: string): Promise<{
    experiences: Experience[];
    educations: Education[];
    certifications: Certification[];
    projects: Project[];
    endorsements: Endorsement[];
  }>;
  
  // Experience operations
  createExperience(experience: InsertExperience): Promise<Experience>;
  updateExperience(id: string, data: Partial<Experience>): Promise<Experience>;
  deleteExperience(id: string): Promise<void>;
  
  // Education operations
  createEducation(education: InsertEducation): Promise<Education>;
  updateEducation(id: string, data: Partial<Education>): Promise<Education>;
  deleteEducation(id: string): Promise<void>;
  
  // Certification operations
  createCertification(certification: InsertCertification): Promise<Certification>;
  updateCertification(id: string, data: Partial<Certification>): Promise<Certification>;
  deleteCertification(id: string): Promise<void>;
  
  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, data: Partial<Project>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Endorsement operations
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
  
  // Company invitation operations
  generateInvitationCode(companyId: string): Promise<CompanyInvitationCode>;
  validateInvitationCode(code: string): Promise<CompanyInvitationCode | null>;
  useInvitationCode(code: string, employeeId: string): Promise<CompanyEmployee>;
  
  // Company employees operations
  getCompanyEmployees(companyId: string): Promise<CompanyEmployee[]>;
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

export class DatabaseStorage implements IStorage {
  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.email, email));
    return employee || undefined;
  }

  async createEmployee(employeeData: InsertEmployee): Promise<Employee> {
    const hashedPassword = await bcrypt.hash(employeeData.password, 10);
    
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
        password: hashedPassword,
      })
      .returning();
    return employee;
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async getCompanyByEmail(email: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.email, email));
    return company || undefined;
  }

  async createCompany(companyData: InsertCompany): Promise<Company> {
    const hashedPassword = await bcrypt.hash(companyData.password, 10);
    
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
        password: hashedPassword,
      })
      .returning();
    return company;
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

  async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
    const [employee] = await db
      .update(employees)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return employee;
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
    return await db.select().from(employeeCompanies).where(eq(employeeCompanies.employeeId, employeeId));
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
    const [newWorkEntry] = await db
      .insert(workEntries)
      .values(workEntry)
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

  async getWorkEntriesForCompany(companyId: string): Promise<any[]> {
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
        status: workEntries.status,
        companyFeedback: workEntries.companyFeedback,
        createdAt: workEntries.createdAt,
        updatedAt: workEntries.updatedAt,
        employeeName: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
        employeeEmail: employees.email,
      })
      .from(workEntries)
      .innerJoin(employees, eq(workEntries.employeeId, employees.id))
      .where(eq(workEntries.companyId, companyId));
      
    return result;
  }

  async getPendingWorkEntriesForCompany(companyId: string): Promise<any[]> {
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
        status: workEntries.status,
        companyFeedback: workEntries.companyFeedback,
        createdAt: workEntries.createdAt,
        updatedAt: workEntries.updatedAt,
        employeeName: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
        employeeEmail: employees.email,
      })
      .from(workEntries)
      .innerJoin(employees, eq(workEntries.employeeId, employees.id))
      .where(and(eq(workEntries.companyId, companyId), eq(workEntries.status, "pending")));
      
    return result;
  }

  async approveWorkEntry(id: string): Promise<WorkEntry> {
    const [workEntry] = await db
      .update(workEntries)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(workEntries.id, id))
      .returning();
    return workEntry;
  }

  async requestWorkEntryChanges(id: string, feedback: string): Promise<WorkEntry> {
    const [workEntry] = await db
      .update(workEntries)
      .set({ status: "needs_changes", companyFeedback: feedback, updatedAt: new Date() })
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
        id: companyEmployees.id,
        employeeId: companyEmployees.employeeId,
        companyId: companies.id,
        companyName: companies.name,
        position: companyEmployees.position,
        createdAt: companyEmployees.joinedAt,
        updatedAt: companyEmployees.joinedAt,
        isCurrent: sql<boolean>`${companyEmployees.status} = 'employed'`,
      })
      .from(companyEmployees)
      .innerJoin(companies, eq(companyEmployees.companyId, companies.id))
      .where(
        and(
          eq(companyEmployees.employeeId, employeeId),
          eq(companyEmployees.status, "employed")
        )
      );
      
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
    let query = db.select().from(jobListings);
    
    const conditions = [];
    
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
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }
    
    return await query;
  }

  async getJobById(id: string): Promise<JobListing | undefined> {
    const [job] = await db.select().from(jobListings).where(eq(jobListings.id, id));
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
    await db.delete(jobListings).where(eq(jobListings.id, id));
  }

  // Company-specific job management methods
  async getCompanyJobs(companyId: string): Promise<JobListing[]> {
    return await db.select().from(jobListings).where(eq(jobListings.companyId, companyId));
  }

  // Job application operations
  async getJobApplications(employeeId: string): Promise<JobApplication[]> {
    return await db.select().from(jobApplications).where(eq(jobApplications.employeeId, employeeId));
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
    const applications = await db
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
    
    return applications.map(({ application, job, employee }) => ({
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
  async recordProfileView(companyId: string, employeeId: string, jobId?: string): Promise<ProfileView> {
    const [view] = await db
      .insert(profileViews)
      .values({
        companyId: companyId,
        employeeId: employeeId,
        jobId: jobId || null
      })
      .returning();
    return view;
  }

  async getProfileViews(employeeId: string): Promise<ProfileView[]> {
    return await db.select().from(profileViews).where(eq(profileViews.employeeId, employeeId));
  }

  // Company employee access with privacy controls
  async getEmployeeCompanyRelation(employeeId: string, companyId: string): Promise<CompanyEmployee | null> {
    const [relation] = await db
      .select()
      .from(companyEmployees)
      .where(
        and(
          eq(companyEmployees.employeeId, employeeId),
          eq(companyEmployees.companyId, companyId),
          eq(companyEmployees.status, 'employed')
        )
      );
    
    return relation || null;
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
        companyName: companies.name
      })
      .from(workEntries)
      .leftJoin(companies, eq(workEntries.companyId, companies.id))
      .where(
        and(
          eq(workEntries.employeeId, employeeId),
          eq(workEntries.companyId, companyId)
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
}

export const storage = new DatabaseStorage();
