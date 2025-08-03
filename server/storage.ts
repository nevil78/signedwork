import { 
  employees, companies, experiences, educations, certifications, projects, endorsements,
  type Employee, type Company, type InsertEmployee, type InsertCompany,
  type Experience, type Education, type Certification, type Project, type Endorsement,
  type InsertExperience, type InsertEducation, type InsertCertification, 
  type InsertProject, type InsertEndorsement
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
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
    const [company] = await db
      .insert(companies)
      .values({
        ...companyData,
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
}

export const storage = new DatabaseStorage();
