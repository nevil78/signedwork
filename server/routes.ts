import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { insertEmployeeSchema, insertCompanySchema, loginSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
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

  const httpServer = createServer(app);
  return httpServer;
}
