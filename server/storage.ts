import { employees, companies, type Employee, type Company, type InsertEmployee, type InsertCompany } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Employee operations
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  
  // Company operations
  getCompany(id: string): Promise<Company | undefined>;
  getCompanyByEmail(email: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  
  // Authentication
  authenticateEmployee(email: string, password: string): Promise<Employee | null>;
  authenticateCompany(email: string, password: string): Promise<Company | null>;
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
    const [employee] = await db
      .insert(employees)
      .values({
        ...employeeData,
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
}

export const storage = new DatabaseStorage();
