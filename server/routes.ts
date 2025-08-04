import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { 
  insertEmployeeSchema, insertCompanySchema, loginSchema, adminLoginSchema,
  insertExperienceSchema, insertEducationSchema, insertCertificationSchema,
  insertProjectSchema, insertEndorsementSchema, insertWorkEntrySchema,
  insertEmployeeCompanySchema, insertJobListingSchema, insertJobApplicationSchema,
  insertSavedJobSchema, insertJobAlertSchema, insertAdminSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key-dev-123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    },
  }));

  // Employee registration
  app.post("/api/auth/register/employee", async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      
      // Check if employee already exists
      const existingEmployee = await storage.getEmployeeByEmail(validatedData.email);
      if (existingEmployee) {
        return res.status(400).json({ 
          message: "An account with this email already exists",
          field: "email"
        });
      }
      
      const employee = await storage.createEmployee(validatedData);
      
      // Remove password from response
      const { password, ...employeeResponse } = employee;
      
      res.status(201).json({ 
        message: "Employee account created successfully",
        employee: employeeResponse 
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: validationError.message,
          errors: error.errors
        });
      }
      
      console.error("Employee registration error:", error);
      res.status(500).json({ message: "Failed to create employee account" });
    }
  });

  // Company registration
  app.post("/api/auth/register/company", async (req, res) => {
    try {
      const validatedData = insertCompanySchema.parse(req.body);
      
      // Check if company already exists
      const existingCompany = await storage.getCompanyByEmail(validatedData.email);
      if (existingCompany) {
        return res.status(400).json({ 
          message: "An account with this email already exists",
          field: "email"
        });
      }
      
      const company = await storage.createCompany(validatedData);
      
      // Remove password from response
      const { password, ...companyResponse } = company;
      
      res.status(201).json({ 
        message: "Company account created successfully",
        company: companyResponse 
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: validationError.message,
          errors: error.errors
        });
      }
      
      console.error("Company registration error:", error);
      res.status(500).json({ message: "Failed to create company account" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { email, password, accountType } = validatedData;
      
      let user = null;
      let userType = "";
      
      if (accountType === "employee") {
        user = await storage.authenticateEmployee(email, password);
        userType = "employee";
      } else {
        user = await storage.authenticateCompany(email, password);
        userType = "company";
      }
      
      if (!user) {
        return res.status(401).json({ 
          message: "Invalid email or password" 
        });
      }
      
      // Store user session
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        type: userType,
      };
      
      // Remove password from response
      const { password: _, ...userResponse } = user;
      
      res.json({ 
        message: "Login successful",
        user: userResponse,
        userType 
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: validationError.message,
          errors: error.errors
        });
      }
      
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Get current user
  app.get("/api/auth/user", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      let user = null;
      
      if (sessionUser.type === "employee") {
        user = await storage.getEmployee(sessionUser.id);
      } else if (sessionUser.type === "company") {
        user = await storage.getCompany(sessionUser.id);
      } else if (sessionUser.type === "admin") {
        user = await storage.getAdmin(sessionUser.id);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userResponse } = user;
      
      res.json({ 
        user: userResponse,
        userType: sessionUser.type 
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });

  // Admin authentication routes
  
  // Create first admin
  app.post("/api/admin/auth/create-first", async (req, res) => {
    try {
      const adminExists = await storage.checkAdminExists();
      if (adminExists) {
        return res.status(409).json({ message: "Admin already exists" });
      }

      const { username, email, password } = req.body;

      const admin = await storage.createAdmin({
        username,
        email,
        password, // Let storage.createAdmin handle the hashing
        role: "super_admin"
      });

      res.json({ message: "Admin created successfully", admin });
    } catch (error) {
      console.error("Create admin error:", error);
      res.status(500).json({ message: "Failed to create admin" });
    }
  });

  // Admin login
  app.post("/api/admin/auth/login", async (req, res) => {
    try {
      const validatedData = adminLoginSchema.parse(req.body);
      
      const admin = await storage.authenticateAdmin(
        validatedData.username, 
        validatedData.password
      );
      
      if (!admin) {
        return res.status(401).json({ 
          message: "Invalid username or password" 
        });
      }
      
      // Store admin session
      (req.session as any).user = {
        id: admin.id,
        username: admin.username,
        type: "admin",
        role: admin.role,
        permissions: admin.permissions
      };
      
      // Remove password from response
      const { password, ...adminResponse } = admin;
      
      res.json({ 
        message: "Admin login successful",
        user: adminResponse
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: validationError.message,
          errors: error.errors
        });
      }
      
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Admin login failed" });
    }
  });

  // Admin dashboard stats
  app.get("/api/admin/stats", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
    try {
      const [
        employeeCount,
        companyCount,
        jobListingCount,
        activeJobCount
      ] = await Promise.all([
        storage.getEmployeeCount(),
        storage.getCompanyCount(),
        storage.getJobListingCount(),
        storage.getActiveJobCount()
      ]);
      
      res.json({
        employees: employeeCount,
        companies: companyCount,
        totalJobs: jobListingCount,
        activeJobs: activeJobCount
      });
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ message: "Failed to get statistics" });
    }
  });

  // Get all employees (admin only)
  app.get("/api/admin/employees", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
    try {
      const employees = await storage.getAllEmployees();
      // Remove passwords from response
      const employeesResponse = employees.map(({ password, ...emp }) => emp);
      res.json(employeesResponse);
    } catch (error) {
      console.error("Get employees error:", error);
      res.status(500).json({ message: "Failed to get employees" });
    }
  });

  // Get all companies (admin only)
  app.get("/api/admin/companies", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
    try {
      const companies = await storage.getAllCompanies();
      // Remove passwords from response
      const companiesResponse = companies.map(({ password, ...comp }) => comp);
      res.json(companiesResponse);
    } catch (error) {
      console.error("Get companies error:", error);
      res.status(500).json({ message: "Failed to get companies" });
    }
  });

  // Toggle employee status (admin only)
  app.patch("/api/admin/employees/:id/toggle-status", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      if (isActive) {
        await storage.activateEmployee(id);
      } else {
        await storage.deactivateEmployee(id);
      }
      
      res.json({ 
        message: `Employee ${isActive ? 'activated' : 'deactivated'} successfully` 
      });
    } catch (error) {
      console.error("Toggle employee status error:", error);
      res.status(500).json({ message: "Failed to update employee status" });
    }
  });

  // Toggle company status (admin only)
  app.patch("/api/admin/companies/:id/toggle-status", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      if (isActive) {
        await storage.activateCompany(id);
      } else {
        await storage.deactivateCompany(id);
      }
      
      res.json({ 
        message: `Company ${isActive ? 'activated' : 'deactivated'} successfully` 
      });
    } catch (error) {
      console.error("Toggle company status error:", error);
      res.status(500).json({ message: "Failed to update company status" });
    }
  });

  // Employee Profile Routes
  
  // Get employee profile data
  app.get("/api/employee/profile/:id", async (req, res) => {
    try {
      const profileData = await storage.getEmployeeProfile(req.params.id);
      res.json(profileData);
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ message: "Failed to get profile data" });
    }
  });

  // Update employee profile
  app.patch("/api/employee/profile", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const updatedEmployee = await storage.updateEmployee(sessionUser.id, req.body);
      const { password, ...employeeResponse } = updatedEmployee;
      res.json(employeeResponse);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Experience Routes
  app.post("/api/employee/experience", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const validatedData = insertExperienceSchema.parse({
        ...req.body,
        employeeId: sessionUser.id
      });
      
      const experience = await storage.createExperience(validatedData);
      res.status(201).json(experience);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: validationError.message,
          errors: error.errors
        });
      }
      
      console.error("Create experience error:", error);
      res.status(500).json({ message: "Failed to create experience" });
    }
  });

  app.patch("/api/employee/experience/:id", async (req, res) => {
    try {
      const experience = await storage.updateExperience(req.params.id, req.body);
      res.json(experience);
    } catch (error) {
      console.error("Update experience error:", error);
      res.status(500).json({ message: "Failed to update experience" });
    }
  });

  app.delete("/api/employee/experience/:id", async (req, res) => {
    try {
      await storage.deleteExperience(req.params.id);
      res.json({ message: "Experience deleted successfully" });
    } catch (error) {
      console.error("Delete experience error:", error);
      res.status(500).json({ message: "Failed to delete experience" });
    }
  });

  // Education Routes
  app.post("/api/employee/education", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const validatedData = insertEducationSchema.parse({
        ...req.body,
        employeeId: sessionUser.id
      });
      
      const education = await storage.createEducation(validatedData);
      res.status(201).json(education);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: validationError.message,
          errors: error.errors
        });
      }
      
      console.error("Create education error:", error);
      res.status(500).json({ message: "Failed to create education" });
    }
  });

  app.patch("/api/employee/education/:id", async (req, res) => {
    try {
      const education = await storage.updateEducation(req.params.id, req.body);
      res.json(education);
    } catch (error) {
      console.error("Update education error:", error);
      res.status(500).json({ message: "Failed to update education" });
    }
  });

  app.delete("/api/employee/education/:id", async (req, res) => {
    try {
      await storage.deleteEducation(req.params.id);
      res.json({ message: "Education deleted successfully" });
    } catch (error) {
      console.error("Delete education error:", error);
      res.status(500).json({ message: "Failed to delete education" });
    }
  });

  // Certification Routes
  app.post("/api/employee/certification", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const validatedData = insertCertificationSchema.parse({
        ...req.body,
        employeeId: sessionUser.id
      });
      
      const certification = await storage.createCertification(validatedData);
      res.status(201).json(certification);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: validationError.message,
          errors: error.errors
        });
      }
      
      console.error("Create certification error:", error);
      res.status(500).json({ message: "Failed to create certification" });
    }
  });

  app.patch("/api/employee/certification/:id", async (req, res) => {
    try {
      const certification = await storage.updateCertification(req.params.id, req.body);
      res.json(certification);
    } catch (error) {
      console.error("Update certification error:", error);
      res.status(500).json({ message: "Failed to update certification" });
    }
  });

  app.delete("/api/employee/certification/:id", async (req, res) => {
    try {
      await storage.deleteCertification(req.params.id);
      res.json({ message: "Certification deleted successfully" });
    } catch (error) {
      console.error("Delete certification error:", error);
      res.status(500).json({ message: "Failed to delete certification" });
    }
  });

  // Project Routes
  app.post("/api/employee/project", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const validatedData = insertProjectSchema.parse({
        ...req.body,
        employeeId: sessionUser.id
      });
      
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: validationError.message,
          errors: error.errors
        });
      }
      
      console.error("Create project error:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch("/api/employee/project/:id", async (req, res) => {
    try {
      const project = await storage.updateProject(req.params.id, req.body);
      res.json(project);
    } catch (error) {
      console.error("Update project error:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/employee/project/:id", async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Delete project error:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Endorsement Routes
  app.post("/api/employee/endorsement", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const validatedData = insertEndorsementSchema.parse({
        ...req.body,
        employeeId: sessionUser.id
      });
      
      const endorsement = await storage.createEndorsement(validatedData);
      res.status(201).json(endorsement);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: validationError.message,
          errors: error.errors
        });
      }
      
      console.error("Create endorsement error:", error);
      res.status(500).json({ message: "Failed to create endorsement" });
    }
  });

  app.delete("/api/employee/endorsement/:id", async (req, res) => {
    try {
      await storage.deleteEndorsement(req.params.id);
      res.json({ message: "Endorsement deleted successfully" });
    } catch (error) {
      console.error("Delete endorsement error:", error);
      res.status(500).json({ message: "Failed to delete endorsement" });
    }
  });

  // Company Invitation Routes
  app.post("/api/company/invitation-code", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      const invitationCode = await storage.generateInvitationCode(sessionUser.id);
      res.json({
        code: invitationCode.code,
        expiresAt: invitationCode.expiresAt,
        message: "Invitation code generated successfully. Valid for 15 minutes."
      });
    } catch (error) {
      console.error("Generate invitation code error:", error);
      res.status(500).json({ message: "Failed to generate invitation code" });
    }
  });

  app.post("/api/employee/join-company", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Invitation code is required" });
      }
      
      const companyEmployee = await storage.useInvitationCode(code, sessionUser.id);
      res.json({
        message: "Successfully joined the company",
        companyEmployee
      });
    } catch (error: any) {
      if (error.message === "Invalid or expired invitation code") {
        return res.status(400).json({ message: error.message });
      }
      console.error("Join company error:", error);
      res.status(500).json({ message: "Failed to join company" });
    }
  });

  app.get("/api/company/employees", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      const employees = await storage.getCompanyEmployees(sessionUser.id);
      res.json(employees);
    } catch (error) {
      console.error("Get company employees error:", error);
      res.status(500).json({ message: "Failed to get employees" });
    }
  });

  // Company Work Entry Verification Routes
  app.get("/api/company/work-entries", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      const workEntries = await storage.getWorkEntriesForCompany(sessionUser.id);
      res.json(workEntries);
    } catch (error) {
      console.error("Get company work entries error:", error);
      res.status(500).json({ message: "Failed to get work entries" });
    }
  });

  app.get("/api/company/work-entries/pending", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      const pendingEntries = await storage.getPendingWorkEntriesForCompany(sessionUser.id);
      res.json(pendingEntries);
    } catch (error) {
      console.error("Get pending work entries error:", error);
      res.status(500).json({ message: "Failed to get pending work entries" });
    }
  });

  app.post("/api/company/work-entries/:id/approve", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      const { id } = req.params;
      const workEntry = await storage.approveWorkEntry(id);
      res.json(workEntry);
    } catch (error) {
      console.error("Approve work entry error:", error);
      res.status(500).json({ message: "Failed to approve work entry" });
    }
  });

  app.post("/api/company/work-entries/:id/request-changes", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      const { id } = req.params;
      const { feedback } = req.body;
      
      if (!feedback || feedback.trim() === '') {
        return res.status(400).json({ message: "Feedback is required when requesting changes" });
      }
      
      const workEntry = await storage.requestWorkEntryChanges(id, feedback);
      res.json(workEntry);
    } catch (error) {
      console.error("Request work entry changes error:", error);
      res.status(500).json({ message: "Failed to request changes" });
    }
  });

  // Employee Company Routes  
  app.get("/api/employee-companies", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      // Get companies from both old and new tables
      const oldCompanies = await storage.getEmployeeCompanies(sessionUser.id);
      const newCompanyRelations = await storage.getEmployeeCompanyRelations(sessionUser.id);
      
      // Merge and return all companies
      const allCompanies = [...oldCompanies, ...newCompanyRelations];
      res.json(allCompanies);
    } catch (error) {
      console.error("Get employee companies error:", error);
      res.status(500).json({ message: "Failed to get companies" });
    }
  });

  app.post("/api/employee-companies", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const validatedData = insertEmployeeCompanySchema.parse({
        ...req.body,
        employeeId: sessionUser.id
      });
      
      const company = await storage.createEmployeeCompany(validatedData);
      res.status(201).json(company);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: validationError.message,
          errors: error.errors
        });
      }
      
      console.error("Create employee company error:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.patch("/api/employee-companies/:id", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const company = await storage.updateEmployeeCompany(req.params.id, req.body);
      res.json(company);
    } catch (error) {
      console.error("Update employee company error:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // Leave company endpoint - updates status instead of deleting
  app.post("/api/employee/leave-company/:relationId", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      // First check if this is from the new companyEmployees table
      const companyRelation = await storage.getCompanyEmployeeRelation(req.params.relationId);
      
      if (companyRelation) {
        // Handle new table structure
        const updatedRelation = await storage.leaveCompany(sessionUser.id, companyRelation.companyId);
        res.json({ message: "Successfully left the company", relation: updatedRelation });
      } else {
        // Handle old table - just mark as inactive
        await storage.deleteEmployeeCompany(req.params.relationId);
        res.json({ message: "Successfully left the company" });
      }
    } catch (error) {
      console.error("Leave company error:", error);
      res.status(500).json({ message: "Failed to leave company" });
    }
  });

  // Work Diary Routes
  app.get("/api/work-diary", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const { companyId } = req.query;
      const workEntries = await storage.getWorkEntries(sessionUser.id, companyId as string);
      res.json(workEntries);
    } catch (error) {
      console.error("Get work entries error:", error);
      res.status(500).json({ message: "Failed to get work entries" });
    }
  });

  app.post("/api/work-diary", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const validatedData = insertWorkEntrySchema.parse({
        ...req.body,
        employeeId: sessionUser.id
      });
      
      const workEntry = await storage.createWorkEntry(validatedData);
      res.status(201).json(workEntry);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: validationError.message,
          errors: error.errors
        });
      }
      
      console.error("Create work entry error:", error);
      res.status(500).json({ message: "Failed to create work entry" });
    }
  });

  app.patch("/api/work-diary/:id", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      // First check if the work entry is approved (immutable)
      const existingEntry = await storage.getWorkEntry(req.params.id);
      if (!existingEntry) {
        return res.status(404).json({ message: "Work entry not found" });
      }
      
      if (existingEntry.status === 'approved') {
        return res.status(403).json({ 
          message: "Cannot edit approved work entry. Approved entries are immutable." 
        });
      }
      
      // When updating a work entry, reset status to pending for re-review
      const updateData = {
        ...req.body,
        status: 'pending', // Always reset to pending when employee updates
        companyFeedback: null, // Clear any previous company feedback
        updatedAt: new Date()
      };
      
      const workEntry = await storage.updateWorkEntry(req.params.id, updateData);
      res.json(workEntry);
    } catch (error) {
      console.error("Update work entry error:", error);
      res.status(500).json({ message: "Failed to update work entry" });
    }
  });

  app.delete("/api/work-diary/:id", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      // First check if the work entry is approved (immutable)
      const existingEntry = await storage.getWorkEntry(req.params.id);
      if (!existingEntry) {
        return res.status(404).json({ message: "Work entry not found" });
      }
      
      if (existingEntry.status === 'approved') {
        return res.status(403).json({ 
          message: "Cannot delete approved work entry. Approved entries are immutable." 
        });
      }
      
      await storage.deleteWorkEntry(req.params.id);
      res.json({ message: "Work entry deleted successfully" });
    } catch (error) {
      console.error("Delete work entry error:", error);
      res.status(500).json({ message: "Failed to delete work entry" });
    }
  });

  // Object Storage Routes
  app.post("/api/objects/upload", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Get upload URL error:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Profile picture update
  app.put("/api/employee/profile-picture", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    if (!req.body.profilePictureURL) {
      return res.status(400).json({ error: "profilePictureURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.profilePictureURL,
      );

      // Update employee profile picture
      const updatedEmployee = await storage.updateEmployee(sessionUser.id, {
        profilePhoto: objectPath
      });
      
      const { password, ...employeeResponse } = updatedEmployee;
      
      res.status(200).json({
        objectPath: objectPath,
        employee: employeeResponse
      });
    } catch (error) {
      console.error("Error setting profile picture:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Company employee profile viewing routes
  app.get("/api/company/employee/:employeeId", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      // Check if this employee is associated with the company
      const employees = await storage.getCompanyEmployees(sessionUser.id);
      const hasAccess = employees.some(emp => emp.employeeId === req.params.employeeId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "No access to this employee's profile" });
      }
      
      const employee = await storage.getEmployee(req.params.employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Remove sensitive data like password
      const { password, ...employeeData } = employee;
      res.json(employeeData);
    } catch (error) {
      console.error("Get company employee error:", error);
      res.status(500).json({ message: "Failed to get employee profile" });
    }
  });

  app.get("/api/company/employee/:employeeId/profile", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      // Check if this employee is associated with the company
      const employees = await storage.getCompanyEmployees(sessionUser.id);
      const hasAccess = employees.some(emp => emp.employeeId === req.params.employeeId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "No access to this employee's profile" });
      }
      
      const profileData = await storage.getEmployeeProfile(req.params.employeeId);
      res.json(profileData);
    } catch (error) {
      console.error("Get company employee profile error:", error);
      res.status(500).json({ message: "Failed to get employee profile data" });
    }
  });

  // Company employee experience routes
  app.get("/api/company/employee-experience/:employeeId", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      // Check if this employee is associated with the company
      const employees = await storage.getCompanyEmployees(sessionUser.id);
      const hasAccess = employees.some(emp => emp.employeeId === req.params.employeeId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "No access to this employee's profile" });
      }
      
      const experiences = await storage.getEmployeeExperiences(req.params.employeeId);
      res.json(experiences);
    } catch (error) {
      console.error("Get company employee experience error:", error);
      res.status(500).json({ message: "Failed to get employee experience data" });
    }
  });

  // Company employee education routes
  app.get("/api/company/employee-education/:employeeId", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      // Check if this employee is associated with the company
      const employees = await storage.getCompanyEmployees(sessionUser.id);
      const hasAccess = employees.some(emp => emp.employeeId === req.params.employeeId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "No access to this employee's profile" });
      }
      
      const educations = await storage.getEmployeeEducations(req.params.employeeId);
      res.json(educations);
    } catch (error) {
      console.error("Get company employee education error:", error);
      res.status(500).json({ message: "Failed to get employee education data" });
    }
  });

  // Company employee certifications routes
  app.get("/api/company/employee-certifications/:employeeId", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      // Check if this employee is associated with the company
      const employees = await storage.getCompanyEmployees(sessionUser.id);
      const hasAccess = employees.some(emp => emp.employeeId === req.params.employeeId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "No access to this employee's profile" });
      }
      
      const certifications = await storage.getEmployeeCertifications(req.params.employeeId);
      res.json(certifications);
    } catch (error) {
      console.error("Get company employee certifications error:", error);
      res.status(500).json({ message: "Failed to get employee certifications data" });
    }
  });

  // === JOB DISCOVERY ROUTES ===
  
  // Search jobs with filters
  app.get("/api/jobs/search", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const filters = {
        keywords: req.query.keywords as string,
        location: req.query.location as string,
        employmentType: req.query.employmentType ? (req.query.employmentType as string).split(',') : undefined,
        experienceLevel: req.query.experienceLevel ? (req.query.experienceLevel as string).split(',') : undefined,
        remoteType: req.query.remoteType ? (req.query.remoteType as string).split(',') : undefined,
        salaryMin: req.query.salaryMin ? parseInt(req.query.salaryMin as string) : undefined,
        salaryMax: req.query.salaryMax ? parseInt(req.query.salaryMax as string) : undefined,
      };
      
      const jobs = await storage.searchJobs(filters);
      res.json(jobs);
    } catch (error) {
      console.error("Job search error:", error);
      res.status(500).json({ message: "Failed to search jobs" });
    }
  });
  
  // Get job by ID
  app.get("/api/jobs/:jobId", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const job = await storage.getJobById(req.params.jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Get job error:", error);
      res.status(500).json({ message: "Failed to get job details" });
    }
  });
  
  // Apply for a job
  app.post("/api/jobs/:jobId/apply", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const applicationData = insertJobApplicationSchema.parse({
        ...req.body,
        jobId: req.params.jobId,
        employeeId: sessionUser.id
      });
      
      const application = await storage.createJobApplication(applicationData);
      res.status(201).json({
        message: "Application submitted successfully",
        application
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: validationError.message,
          errors: error.errors
        });
      }
      
      // Handle duplicate application
      if (error.message?.includes('duplicate') || error.code === '23505') {
        return res.status(400).json({ message: "You have already applied for this job" });
      }
      
      console.error("Job application error:", error);
      res.status(500).json({ message: "Failed to submit application" });
    }
  });
  
  // Get employee's job applications
  app.get("/api/jobs/my-applications", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const applications = await storage.getJobApplications(sessionUser.id);
      res.json(applications);
    } catch (error) {
      console.error("Get applications error:", error);
      res.status(500).json({ message: "Failed to get applications" });
    }
  });
  
  // Save/unsave a job
  app.post("/api/jobs/:jobId/save", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const saveData = insertSavedJobSchema.parse({
        jobId: req.params.jobId,
        employeeId: sessionUser.id,
        notes: req.body.notes
      });
      
      const savedJob = await storage.saveJob(saveData);
      res.status(201).json({
        message: "Job saved successfully",
        savedJob
      });
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.code === '23505') {
        return res.status(400).json({ message: "Job already saved" });
      }
      
      console.error("Save job error:", error);
      res.status(500).json({ message: "Failed to save job" });
    }
  });
  
  app.delete("/api/jobs/:jobId/save", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      await storage.unsaveJob(sessionUser.id, req.params.jobId);
      res.json({ message: "Job unsaved successfully" });
    } catch (error) {
      console.error("Unsave job error:", error);
      res.status(500).json({ message: "Failed to unsave job" });
    }
  });
  
  // Get saved jobs
  app.get("/api/jobs/saved", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const savedJobs = await storage.getSavedJobs(sessionUser.id);
      res.json(savedJobs);
    } catch (error) {
      console.error("Get saved jobs error:", error);
      res.status(500).json({ message: "Failed to get saved jobs" });
    }
  });
  
  // Job alerts management
  app.get("/api/job-alerts", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const alerts = await storage.getJobAlerts(sessionUser.id);
      res.json(alerts);
    } catch (error) {
      console.error("Get job alerts error:", error);
      res.status(500).json({ message: "Failed to get job alerts" });
    }
  });
  
  app.post("/api/job-alerts", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const alertData = insertJobAlertSchema.parse({
        ...req.body,
        employeeId: sessionUser.id
      });
      
      const alert = await storage.createJobAlert(alertData);
      res.status(201).json({
        message: "Job alert created successfully",
        alert
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: validationError.message,
          errors: error.errors
        });
      }
      
      console.error("Create job alert error:", error);
      res.status(500).json({ message: "Failed to create job alert" });
    }
  });
  
  app.put("/api/job-alerts/:alertId", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const alert = await storage.updateJobAlert(req.params.alertId, req.body);
      res.json({
        message: "Job alert updated successfully",
        alert
      });
    } catch (error) {
      console.error("Update job alert error:", error);
      res.status(500).json({ message: "Failed to update job alert" });
    }
  });
  
  app.delete("/api/job-alerts/:alertId", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      await storage.deleteJobAlert(req.params.alertId);
      res.json({ message: "Job alert deleted successfully" });
    } catch (error) {
      console.error("Delete job alert error:", error);
      res.status(500).json({ message: "Failed to delete job alert" });
    }
  });

  // Object storage routes for file uploads
  app.post("/api/objects/upload", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Get upload URL error:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // === COMPANY JOB MANAGEMENT ROUTES ===
  
  // Company creates job listing
  app.post("/api/company/jobs", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      console.log("Received job data:", req.body);
      
      // Convert applicationDeadline string to Date if present
      const dataToValidate = {
        ...req.body,
        companyId: sessionUser.id,
        applicationDeadline: req.body.applicationDeadline ? new Date(req.body.applicationDeadline) : null
      };
      
      const jobData = insertJobListingSchema.parse(dataToValidate);
      
      console.log("Parsed job data:", jobData);
      
      const job = await storage.createJobListing(jobData);
      res.status(201).json({
        message: "Job listing created successfully",
        job
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        console.error("Validation error:", error.errors);
        return res.status(400).json({ 
          message: validationError.message,
          errors: error.errors
        });
      }
      
      console.error("Create job listing error:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ message: "Failed to create job listing" });
    }
  });
  
  // Company gets their job listings
  app.get("/api/company/jobs", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      const jobs = await storage.getCompanyJobs(sessionUser.id);
      res.json(jobs);
    } catch (error) {
      console.error("Get company jobs error:", error);
      res.status(500).json({ message: "Failed to get job listings" });
    }
  });

  // Company updates job listing
  app.put("/api/company/jobs/:jobId", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      // First verify this job belongs to the company
      const existingJob = await storage.getJobById(req.params.jobId);
      if (!existingJob || existingJob.companyId !== sessionUser.id) {
        return res.status(403).json({ message: "Access denied to this job" });
      }
      
      // Convert applicationDeadline string to Date if present
      const updateData = {
        ...req.body,
        applicationDeadline: req.body.applicationDeadline ? new Date(req.body.applicationDeadline) : null
      };
      
      const job = await storage.updateJobListing(req.params.jobId, updateData);
      res.json({
        message: "Job listing updated successfully",
        job
      });
    } catch (error) {
      console.error("Update job listing error:", error);
      res.status(500).json({ message: "Failed to update job listing" });
    }
  });

  // Company deletes job listing
  app.delete("/api/company/jobs/:jobId", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      // First verify this job belongs to the company
      const existingJob = await storage.getJobById(req.params.jobId);
      if (!existingJob || existingJob.companyId !== sessionUser.id) {
        return res.status(403).json({ message: "Access denied to this job" });
      }
      
      await storage.deleteJobListing(req.params.jobId);
      res.json({ message: "Job listing deleted successfully" });
    } catch (error) {
      console.error("Delete job listing error:", error);
      res.status(500).json({ message: "Failed to delete job listing" });
    }
  });
  
  // Company gets applications for a specific job
  app.get("/api/company/jobs/:jobId/applications", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      // First verify this job belongs to the company
      const job = await storage.getJobById(req.params.jobId);
      if (!job || job.companyId !== sessionUser.id) {
        return res.status(403).json({ message: "Access denied to this job" });
      }
      
      const applications = await storage.getJobApplicationsForJob(req.params.jobId);
      res.json(applications);
    } catch (error) {
      console.error("Get job applications error:", error);
      res.status(500).json({ message: "Failed to get job applications" });
    }
  });
  
  // Legacy route - keep for compatibility
  app.put("/api/company/applications/:applicationId", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      const { status, notes, companyNotes, interviewNotes } = req.body;
      const application = await storage.updateJobApplicationStatus(req.params.applicationId, {
        status, 
        companyNotes: companyNotes || notes, 
        interviewNotes
      });
      res.json({
        message: "Application status updated successfully",
        application
      });
    } catch (error) {
      console.error("Update application status error:", error);
      res.status(500).json({ message: "Failed to update application status" });
    }
  });

  // Serve uploaded objects
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        `/objects/${req.params.objectPath}`,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error downloading object:", error);
      return res.sendStatus(404);
    }
  });

  // === COMPANY RECRUITER ROUTES ===
  
  // Get all job applications for a company
  app.get("/api/company/applications", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      const applications = await storage.getCompanyJobApplications(sessionUser.id);
      res.json(applications);
    } catch (error) {
      console.error("Get company applications error:", error);
      res.status(500).json({ message: "Failed to get job applications" });
    }
  });
  
  // Update application status
  app.put("/api/company/applications/:applicationId", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      const { status, companyNotes, interviewNotes } = req.body;
      const application = await storage.updateJobApplicationStatus(
        req.params.applicationId,
        { status, companyNotes, interviewNotes }
      );
      
      res.json({
        message: "Application status updated successfully",
        application
      });
    } catch (error) {
      console.error("Update application status error:", error);
      res.status(500).json({ message: "Failed to update application status" });
    }
  });

  // Company Employee Privacy Routes - Read-only access with proper authorization
  app.get("/api/company/employee/:employeeId", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      // Verify the employee is associated with this company
      const employeeCompany = await storage.getEmployeeCompanyRelation(req.params.employeeId, sessionUser.id);
      if (!employeeCompany) {
        return res.status(403).json({ message: "Employee not associated with your company" });
      }
      
      const employee = await storage.getEmployee(req.params.employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Return only safe, professional information
      const safeEmployeeData = {
        id: employee.id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        headline: employee.headline,
        summary: employee.summary,
        currentPosition: employee.currentPosition,
        currentCompany: employee.currentCompany,
        industry: employee.industry,
        skills: employee.skills,
        languages: employee.languages,
        achievements: employee.achievements,
        website: employee.website,
        portfolioUrl: employee.portfolioUrl,
        githubUrl: employee.githubUrl,
        linkedinUrl: employee.linkedinUrl,
        // Exclude sensitive personal data like address, phone, DOB, etc.
      };
      
      res.json(safeEmployeeData);
    } catch (error) {
      console.error("Get employee error:", error);
      res.status(500).json({ message: "Failed to get employee" });
    }
  });

  app.get("/api/company/employee-work-entries/:employeeId", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      // Verify the employee is associated with this company
      const employeeCompany = await storage.getEmployeeCompanyRelation(req.params.employeeId, sessionUser.id);
      if (!employeeCompany) {
        return res.status(403).json({ message: "Employee not associated with your company" });
      }
      
      // Get work entries for this employee for this company only
      const workEntries = await storage.getWorkEntriesForEmployeeAndCompany(req.params.employeeId, sessionUser.id);
      
      // Add company name to each entry
      const company = await storage.getCompany(sessionUser.id);
      const entriesWithCompany = workEntries.map((entry: any) => ({
        ...entry,
        companyName: company?.name || 'Unknown Company'
      }));
      
      res.json(entriesWithCompany);
    } catch (error) {
      console.error("Get employee work entries error:", error);
      res.status(500).json({ message: "Failed to get employee work entries" });
    }
  });
  
  // Get employee profile for recruiter view (with application data)
  app.get("/api/company/applications/:applicationId/employee", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      const application = await storage.getJobApplicationWithEmployee(req.params.applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Get employee profile data if shared
      const profileData = application.includeProfile 
        ? await storage.getEmployeeProfile(application.employeeId)
        : null;
        
      // Get work diary data if shared  
      const workDiaryData = application.includeWorkDiary
        ? await storage.getWorkEntries(application.employeeId)
        : null;
      
      res.json({
        application,
        profile: profileData,
        workDiary: workDiaryData
      });
    } catch (error) {
      console.error("Get employee application data error:", error);
      res.status(500).json({ message: "Failed to get employee data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
