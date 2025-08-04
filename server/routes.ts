import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { 
  insertEmployeeSchema, insertCompanySchema, loginSchema,
  insertExperienceSchema, insertEducationSchema, insertCertificationSchema,
  insertProjectSchema, insertEndorsementSchema, insertWorkEntrySchema,
  insertEmployeeCompanySchema
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
      } else {
        user = await storage.getCompany(sessionUser.id);
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

  const httpServer = createServer(app);
  return httpServer;
}
