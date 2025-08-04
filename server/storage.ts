import { 
  employees, companies, experiences, educations, certifications, projects, endorsements, workEntries, employeeCompanies,
  companyInvitationCodes, companyEmployees,
  type Employee, type Company, type InsertEmployee, type InsertCompany,
  type Experience, type Education, type Certification, type Project, type Endorsement, type WorkEntry, type EmployeeCompany,
  type InsertExperience, type InsertEducation, type InsertCertification, 
  type InsertProject, type InsertEndorsement, type InsertWorkEntry, type InsertEmployeeCompany,
  type CompanyInvitationCode, type CompanyEmployee, type InsertCompanyInvitationCode, type InsertCompanyEmployee
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
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

  // Employee Company operations
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

  async getWorkEntriesForCompany(companyId: string): Promise<WorkEntry[]> {
    return await db.select().from(workEntries).where(eq(workEntries.companyId, companyId));
  }

  async getPendingWorkEntriesForCompany(companyId: string): Promise<WorkEntry[]> {
    return await db.select().from(workEntries)
      .where(and(eq(workEntries.companyId, companyId), eq(workEntries.status, "pending")));
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
}

export const storage = new DatabaseStorage();
