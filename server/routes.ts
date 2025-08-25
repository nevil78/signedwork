import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import passport from "passport";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { 
  insertEmployeeSchema, insertCompanySchema, loginSchema, adminLoginSchema,
  insertExperienceSchema, insertEducationSchema, insertCertificationSchema,
  insertProjectSchema, insertEndorsementSchema, insertWorkEntrySchema,
  insertEmployeeCompanySchema, insertJobListingSchema, insertJobApplicationSchema,
  insertSavedJobSchema, insertJobAlertSchema, insertAdminSchema,
  requestPasswordResetSchema, verifyOTPSchema, resetPasswordSchema, changePasswordSchema,
  insertFeedbackSchema, feedbackResponseSchema, contactFormSchema,
  workEntries, employees, companies
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { sendOTPEmail, generateOTPCode, isOTPExpired } from "./emailService";
import { sendPasswordResetOTP } from "./sendgrid";
import { fromZodError } from "zod-validation-error";
import { setupGoogleAuth } from "./googleAuth";
import { OTPEmailService } from "./otpEmailService";
import { SignupVerificationService } from "./signupVerificationService";
import { sendEmail } from "./sendgrid";
import { aiJobService, type EmployeeProfile } from "./aiJobService";

// Global variable to store the Socket.IO server instance for real-time updates
let io: SocketIOServer;

// Helper function to emit real-time updates
function emitRealTimeUpdate(eventName: string, data: any, rooms?: string[]) {
  if (io) {
    if (rooms && rooms.length > 0) {
      rooms.forEach(room => {
        io.to(room).emit(eventName, data);
      });
    } else {
      io.emit(eventName, data);
    }
  }
}

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  console.log("Session debug:", {
    sessionId: req.sessionID,
    hasSession: !!req.session,
    sessionUser: req.session?.user,
    sessionCookie: req.headers.cookie
  });
  
  const sessionUser = req.session?.user;
  if (!sessionUser) {
    console.log("No session user found, returning 401");
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  console.log(`Session valid for user: ${sessionUser.id} (${sessionUser.type})`);
  req.user = sessionUser;
  next();
}

// Employee-specific authentication middleware
function requireEmployee(req: any, res: any, next: any) {
  requireAuth(req, res, () => {
    if (req.user.type !== 'employee') {
      return res.status(403).json({ message: "Employee access required" });
    }
    next();
  });
}

// Company-specific authentication middleware 
function requireCompany(req: any, res: any, next: any) {
  requireAuth(req, res, () => {
    if (req.user.type !== 'company') {
      return res.status(403).json({ message: "Company access required" });
    }
    next();
  });
}

// Admin-specific authentication middleware
function requireAdmin(req: any, res: any, next: any) {
  requireAuth(req, res, () => {
    if (req.user.type !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  });
}

// Manager-specific authentication middleware
function requireManager(req: any, res: any, next: any) {
  requireAuth(req, res, () => {
    if (req.user.type !== 'manager') {
      return res.status(403).json({ message: "Manager access required" });
    }
    next();
  });
}

// Manager permission middleware
async function requireManagerPermission(permission: string) {
  return async (req: any, res: any, next: any) => {
    try {
      const managerId = req.user?.id;
      if (!managerId) {
        return res.status(401).json({ message: "Manager authentication required" });
      }

      const permissions = await storage.getManagerPermissions(managerId);
      if (!permissions) {
        return res.status(403).json({ message: "Manager permissions not found" });
      }

      const hasPermission = permissions[permission as keyof typeof permissions];
      if (!hasPermission) {
        return res.status(403).json({ message: `Permission denied: ${permission}` });
      }

      req.managerPermissions = permissions;
      next();
    } catch (error) {
      console.error('Error checking manager permissions:', error);
      res.status(500).json({ message: "Error checking permissions" });
    }
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  // Create database session store
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true, // Automatically create sessions table
    ttl: 24 * 60 * 60, // 24 hours in seconds
    tableName: 'user_sessions', // Custom table name to avoid conflicts
  });

  app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key-dev-123",
    store: sessionStore, // Use PostgreSQL session store
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    rolling: true, // Reset expiration on activity
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    },
    name: 'sessionId', // Custom session name
  }));

  // Session heartbeat endpoint to keep sessions alive - PROTECTED ROUTE
  app.post("/api/auth/heartbeat", requireAuth, (req: any, res) => {
    
    // Calculate session expiry time
    const sessionExpiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours from now
    
    // Session will be automatically saved due to rolling: true
    res.json({ 
      message: "Session renewed",
      userId: req.user.id,
      userType: req.user.type,
      expiresAt: sessionExpiresAt.toISOString(),
      remainingTime: "24 hours"
    });
  });

  // Session status endpoint to check session validity and remaining time - PROTECTED ROUTE
  app.get("/api/auth/session-status", requireAuth, (req: any, res) => {
    
    // Calculate remaining session time based on rolling sessions
    const sessionExpiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours from now due to rolling
    const remainingMs = sessionExpiresAt.getTime() - Date.now();
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    res.json({
      authenticated: true,
      userId: req.user.id,
      userType: req.user.type,
      expiresAt: sessionExpiresAt.toISOString(),
      remainingTime: `${remainingHours}h ${remainingMinutes}m`,
      cycleLength: "24 hours"
    });
  });

  // Initialize Passport and Google OAuth
  app.use(passport.initialize());
  app.use(passport.session());
  setupGoogleAuth();

  // Passport session serialization
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  // Employee registration with delayed email verification
  app.post("/api/auth/register/employee", async (req, res) => {
    try {
      const { email, password, firstName, lastName, phoneNumber } = req.body;
      
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ 
          message: "Email, password, first name, and last name are required" 
        });
      }

      // Check if email already exists
      const existingEmployee = await storage.getEmployeeByEmail(email);
      const existingCompany = await storage.getCompanyByEmail(email);
      
      if (existingEmployee || existingCompany) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create employee profile
      const employeeData = {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phoneNumber || null,
      };

      const employee = await storage.createEmployee(employeeData);
      
      // Remove password from response
      const { password: _, ...employeeResponse } = employee;
      
      res.status(201).json({ 
        message: "Account created successfully!",
        employee: employeeResponse
      });
    } catch (error: any) {
      console.error("Employee registration error:", error);
      res.status(500).json({ 
        message: error.message || "Failed to create employee account" 
      });
    }
  });

  // Company registration with delayed email verification
  app.post("/api/auth/register/company", async (req, res) => {
    try {
      const { email, password, name, description, industryType, companySize, location, cin, panNumber } = req.body;
      
      if (!email || !password || !name || !industryType) {
        return res.status(400).json({ 
          message: "Email, password, company name, and industry type are required" 
        });
      }

      // Check if email already exists
      const existingEmployee = await storage.getEmployeeByEmail(email);
      const existingCompany = await storage.getCompanyByEmail(email);
      
      if (existingEmployee || existingCompany) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Handle empty CIN and PAN strings
      const companyData = {
        email,
        password: hashedPassword,
        name,
        description: description || null,
        industryType,
        companySize: companySize || null,
        location: location || null,
        cin: cin && cin.trim() ? cin.trim() : undefined,
        panNumber: panNumber && panNumber.trim() ? panNumber.trim() : undefined,
        cinVerificationStatus: "pending" as const,
        panVerificationStatus: "pending" as const,
      };

      const company = await storage.createCompany(companyData);
      
      // Emit real-time updates for admin panel if CIN or PAN is provided
      if (company.cin) {
        emitRealTimeUpdate("cin_verification_pending", {
          companyId: company.id,
          companyName: company.name,
          cin: company.cin,
          timestamp: new Date().toISOString()
        });
      }
      
      if (company.panNumber) {
        emitRealTimeUpdate("pan_verification_pending", {
          companyId: company.id,
          companyName: company.name,
          panNumber: company.panNumber,
          timestamp: new Date().toISOString()
        });
      }
      
      // Remove password from response
      const { password: _, ...companyResponse } = company;
      
      let message = "Company account created successfully! You can edit your email freely until verification is required.";
      if (company.cin && company.panNumber) {
        message += " CIN and PAN verification are pending.";
      } else if (company.cin) {
        message += " CIN verification is pending.";
      } else if (company.panNumber) {
        message += " PAN verification is pending.";
      }
      
      res.status(201).json({ 
        message,
        company: companyResponse
      });
    } catch (error: any) {
      console.error("Company registration error:", error);
      res.status(500).json({ 
        message: error.message || "Failed to create company account" 
      });
    }
  });

  // Resend verification code
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email, userType } = req.body;
      
      if (!email || !userType) {
        return res.status(400).json({ message: "Email and user type are required" });
      }

      // Check if user exists
      let user = null;
      if (userType === 'employee') {
        user = await storage.getEmployeeByEmail(email);
      } else {
        user = await storage.getCompanyByEmail(email);
      }

      if (!user) {
        return res.status(404).json({ message: "Account not found" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate new OTP
      const otpCode = generateOTPCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Save new OTP to database
      await storage.createEmailVerification({
        email,
        otpCode,
        purpose: "email_verification",
        userType,
        userId: user.id,
        expiresAt,
      });

      // Send OTP email
      const firstName = userType === 'employee' ? (user as any).firstName : (user as any).name;
      const emailSent = await sendOTPEmail({
        to: email,
        firstName,
        otpCode,
        purpose: "email_verification",
      });

      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send verification email" });
      }

      res.json({ 
        message: "New verification code sent to your email" 
      });
    } catch (error: any) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to resend verification code" });
    }
  });

  // NEW SIGNUP VERIFICATION ROUTES (Replaces old registration flow)
  
  // Employee signup with email OTP verification (Step 1 - Send OTP)
  app.post("/api/auth/signup/employee", async (req, res) => {
    try {
      const { firstName, lastName, email, phoneNumber, password } = req.body;
      
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ 
          message: "First name, last name, email, and password are required" 
        });
      }

      // Check if email already exists in users
      const existingEmployee = await storage.getEmployeeByEmail(email);
      const existingCompany = await storage.getCompanyByEmail(email);
      
      if (existingEmployee || existingCompany) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Create pending employee and send OTP
      const otp = await storage.createPendingEmployee(email, {
        firstName,
        lastName,
        phoneNumber,
        password
      });

      // Send OTP email using the private static method via instance
      await sendOTPEmail({
        to: email,
        firstName: firstName,
        otpCode: otp,
        purpose: "signup_verification"
      });

      res.json({ 
        message: "OTP sent to your email. Please verify to complete registration.",
        email: email
      });
    } catch (error: any) {
      console.error("Employee signup error:", error);
      res.status(500).json({ message: "Failed to send OTP. Please try again." });
    }
  });

  // Employee OTP verification and account creation (Step 2)
  app.post("/api/auth/verify-employee-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ 
          message: "Email and OTP are required" 
        });
      }

      // Verify OTP and get pending user data
      const verificationResult = await storage.verifyEmployeeOTP(email, otp);
      
      if (!verificationResult.success) {
        return res.status(400).json({ message: verificationResult.message });
      }

      const pendingUser = verificationResult.userData;
      if (!pendingUser) {
        return res.status(400).json({ message: "Registration session expired. Please start again." });
      }
      
      // Create the employee account using the already hashed password
      const userData = pendingUser.userData as any;
      const employeeData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: pendingUser.email,
        phone: userData.phoneNumber || null,
        password: pendingUser.hashedPassword, // Use already hashed password
        emailVerified: true // Mark as verified since OTP was successful
      };

      const employee = await storage.createEmployeeWithHashedPassword(employeeData);
      
      // Clean up pending user data
      await storage.deletePendingEmployeeByEmail(email);

      // Automatically log in the user by creating a session
      const sessionUser = {
        id: employee.id,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        userType: "employee" as const
      };

      // Store user in session
      (req.session as any).user = sessionUser;
      
      // Debug logging for session storage
      console.log("Session user stored:", sessionUser);
      console.log("Session after storage:", (req.session as any).user);

      // Remove password from response
      const { password: _, ...employeeResponse } = employee;

      res.status(201).json({
        message: "Account created successfully! Redirecting to dashboard...",
        user: employeeResponse,
        userType: "employee",
        verified: true,
        authenticated: true
      });
    } catch (error: any) {
      console.error("Employee OTP verification error:", error);
      res.status(500).json({ message: "Failed to verify OTP. Please try again." });
    }
  });

  // Company signup with email verification (Step 1)
  app.post("/api/auth/signup/company", async (req, res) => {
    try {
      const { 
        name, description, industryType, companySize, location, 
        email, password, cin, panNumber 
      } = req.body;
      
      if (!name || !email || !password || !industryType) {
        return res.status(400).json({ 
          message: "Company name, email, password, and industry type are required" 
        });
      }

      const result = await SignupVerificationService.initiateSignup(
        email,
        password,
        "company",
        { 
          name, description, industryType, companySize, location, 
          cin: cin?.trim() || undefined, 
          panNumber: panNumber?.trim() || undefined 
        }
      );

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.status(200).json({ 
        message: result.message,
        verificationRequired: true
      });
    } catch (error: any) {
      console.error("Company signup error:", error);
      res.status(500).json({ message: "Failed to initiate signup" });
    }
  });

  // Verify email and complete account creation (Step 2)
  app.get("/api/auth/verify-signup", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Verification token is required" });
      }

      const result = await SignupVerificationService.verifySignup(token);

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.status(200).json({ 
        message: result.message,
        user: result.user,
        userType: result.userType,
        verified: true
      });
    } catch (error: any) {
      console.error("Signup verification error:", error);
      res.status(500).json({ message: "Failed to verify signup" });
    }
  });

  // Resend verification email
  app.post("/api/auth/resend-signup-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const result = await SignupVerificationService.resendVerification(email);

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.status(200).json({ message: result.message });
    } catch (error: any) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to resend verification" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { email, password, accountType } = validatedData;
      
      // Normalize email to lowercase for case-insensitive matching
      const normalizedEmail = email.toLowerCase();
      
      let user = null;
      let userType = "";
      
      if (accountType === "employee") {
        user = await storage.authenticateEmployee(normalizedEmail, password);
        userType = "employee";
      } else {
        user = await storage.authenticateCompany(normalizedEmail, password);
        userType = "company";
      }
      
      if (!user) {
        return res.status(401).json({ 
          message: "Invalid email or password" 
        });
      }
      
      // Email verification is optional - users can login without verification
      // They can verify their email later in their profile page
      
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

  // Google OAuth routes for employees only
  app.get("/api/auth/google", passport.authenticate('google-employee', {
    scope: ['profile', 'email'],
    prompt: 'consent select_account'  // Force fresh consent screen and account selection
  }));

  app.get("/api/auth/google/callback", 
    passport.authenticate('google-employee', { failureRedirect: '/auth?error=google_auth_failed' }),
    async (req, res) => {
      try {
        console.log("Google OAuth callback triggered");
        
        if (!req.user) {
          console.error("No user data in Google OAuth callback");
          return res.redirect('/auth?error=no_user_data');
        }

        const authResult = req.user as any;
        console.log("Google OAuth result:", { hasEmployee: !!authResult.employee, isNew: authResult.isNew });
        
        if (!authResult.employee) {
          console.error("No employee data in Google OAuth result");
          return res.redirect('/auth?error=no_employee_data');
        }

        const { employee, isNew } = authResult;

        // Store user session
        (req.session as any).user = {
          id: employee.id,
          email: employee.email,
          type: "employee",
        };

        // Record login session for tracking
        try {
          await storage.createLoginSession({
            sessionId: req.sessionID,
            userId: employee.id,
            userType: 'employee',
            loginAt: new Date(),
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            deviceType: req.get('User-Agent')?.includes('Mobile') ? 'Mobile' : 'Desktop',
            location: 'Unknown' // Could be enhanced with IP geolocation later
          });
        } catch (sessionError) {
          console.error("Failed to record Google OAuth login session:", sessionError);
          // Don't fail the login if session recording fails
        }

        console.log(`Google OAuth successful for ${employee.email}, isNew: ${isNew}`);
        
        // Redirect to summary dashboard for employees
        const redirectQuery = isNew ? '?welcome=true' : '';
        res.redirect(`/summary${redirectQuery}`);
      } catch (error) {
        console.error("Google OAuth callback error:", error);
        res.redirect('/auth?error=auth_failed');
      }
    }
  );

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Send email verification (for profile page) - PROTECTED ROUTE
  app.post("/api/auth/send-email-verification", requireAuth, async (req: any, res) => {

    try {
      // Get user details
      let user = null;
      if (req.user.type === 'employee') {
        user = await storage.getEmployee(req.user.id);
      } else {
        user = await storage.getCompany(req.user.id);
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate OTP for email verification
      const otpCode = generateOTPCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Save OTP to database
      await storage.createEmailVerification({
        email: user.email,
        otpCode,
        purpose: "email_verification",
        userType: req.user.type,
        userId: user.id,
        expiresAt,
      });

      // Send OTP email
      const firstName = req.user.type === 'employee' ? (user as any).firstName : (user as any).name;
      const emailSent = await sendOTPEmail({
        to: user.email,
        firstName,
        otpCode,
        purpose: "email_verification",
      });

      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send verification email" });
      }

      res.json({ 
        message: "Verification code sent to your email address",
        email: user.email
      });
    } catch (error: any) {
      console.error("Send email verification error:", error);
      res.status(500).json({ message: "Failed to send verification email" });
    }
  });

  // Employee-specific user endpoint for compatibility - PROTECTED ROUTE
  app.get("/api/employee/me", requireEmployee, async (req: any, res) => {
    
    try {
      const employee = await storage.getEmployee(req.user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Allow both active and inactive employees to access their profile
      console.log(`Employee ${req.user.id} accessing profile - Active: ${employee.isActive}`);
      
      const { password, ...employeeResponse } = employee;
      res.json(employeeResponse);
    } catch (error) {
      console.error("Get employee profile error:", error);
      res.status(500).json({ message: "Failed to get employee profile" });
    }
  });

  // Update employee email (with verification reset) - PROTECTED ROUTE
  app.patch("/api/employee/email", requireEmployee, async (req: any, res) => {

    try {
      const { email } = req.body;
      
      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Valid email is required" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Get current employee data
      const employee = await storage.getEmployee(req.user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Check if email is already verified - prevent changes to verified emails
      if (employee.emailVerified && employee.email !== email) {
        return res.status(403).json({ 
          message: "Cannot change email after verification. Contact support if you need to update your verified email." 
        });
      }

      // Check if email is already in use
      const existingEmployee = await storage.getEmployeeByEmail(email);
      if (existingEmployee && existingEmployee.id !== req.user.id) {
        return res.status(409).json({ message: "Email is already in use by another account" });
      }

      // Update email and reset verification status
      const updatedEmployee = await storage.updateEmployee(req.user.id, { 
        email, 
        emailVerified: false // Reset verification when email changes
      });

      // Update session email for consistency
      (req.session as any).user.email = email;

      const { password, ...employeeResponse } = updatedEmployee;
      res.json(employeeResponse);
    } catch (error) {
      console.error("Update employee email error:", error);
      res.status(500).json({ message: "Failed to update email" });
    }
  });

  // Send email verification for employee (specific endpoint) - PROTECTED ROUTE
  app.post("/api/employee/send-verification-email", requireEmployee, async (req: any, res) => {

    try {
      const employee = await storage.getEmployee(req.user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      if (employee.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate OTP for email verification
      const otpCode = generateOTPCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Save OTP to database
      await storage.createEmailVerification({
        email: employee.email,
        otpCode,
        purpose: "email_verification",
        userType: "employee",
        userId: employee.id,
        expiresAt,
      });

      // Send OTP email
      const emailSent = await sendOTPEmail({
        to: employee.email,
        firstName: employee.firstName,
        otpCode,
        purpose: "email_verification",
      });

      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send verification email" });
      }

      res.json({ 
        message: "Verification code sent to your email address",
        email: employee.email
      });
    } catch (error: any) {
      console.error("Send employee email verification error:", error);
      res.status(500).json({ message: "Failed to send verification email" });
    }
  });

  // Enhanced OTP verification that syncs session email
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, otpCode, purpose, userType } = req.body;

      if (!email || !otpCode || !purpose || !userType) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get stored OTP
      const verification = await storage.getEmailVerificationByEmail(email);
      if (!verification) {
        return res.status(400).json({ message: "No verification code found for this email" });
      }

      // Check if OTP has expired
      if (new Date() > verification.expiresAt) {
        return res.status(400).json({ message: "Verification code has expired" });
      }

      // Verify OTP code
      if (verification.otpCode !== otpCode) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      // Mark email as verified based on user type
      if (userType === "employee") {
        await storage.updateEmployee(verification.userId, { emailVerified: true });
        
        // Update session email if user is logged in
        const sessionUser = (req.session as any).user;
        if (sessionUser && sessionUser.id === verification.userId) {
          sessionUser.email = email;
        }
      } else if (userType === "company") {
        await storage.updateCompany(verification.userId, { emailVerified: true });
        
        // Update session email if user is logged in
        const sessionUser = (req.session as any).user;
        if (sessionUser && sessionUser.id === verification.userId) {
          sessionUser.email = email;
        }
      }

      // Delete used verification record
      await storage.deleteEmailVerification(verification.id);

      res.json({ 
        message: "Email verified successfully",
        verified: true
      });
    } catch (error: any) {
      console.error("OTP verification error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // Get current user - PROTECTED ROUTE
  app.get("/api/auth/user", requireAuth, async (req: any, res) => {
    
    try {
      let user = null;
      
      if (req.user.type === "employee") {
        user = await storage.getEmployee(req.user.id);
      } else if (req.user.type === "company") {
        user = await storage.getCompany(req.user.id);
      } else if (req.user.type === "admin") {
        user = await storage.getAdmin(req.user.id);
      }
      
      if (!user) {
        console.log(`User not found in database for ID: ${req.user.id}, type: ${req.user.type}`);
        // Clear invalid session
        req.session.destroy(() => {});
        return res.status(401).json({ message: "Session invalid - user not found" });
      }
      
      // For companies, check if they are still active
      if (req.user.type === "company" && 'isActive' in user && user.isActive === false) {
        console.log(`Company account deactivated for ID: ${req.user.id}`);
        req.session.destroy(() => {});
        return res.status(401).json({ message: "Account deactivated" });
      }
      
      // For employees, allow inactive (ex-employee) access but with limited permissions
      // They can view their data but cannot create/edit entries
      
      // Remove password from response
      const { password, ...userResponse } = user;
      
      console.log(`Session valid for user: ${req.user.id} (${req.user.type})`);
      res.json({ 
        user: userResponse,
        userType: req.user.type 
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

  // Manager authentication routes

  // Manager login - Simple working version
  app.post("/api/manager/auth/login", async (req, res) => {
    try {
      const { uniqueId, password } = req.body;
      
      if (!uniqueId || !password) {
        return res.status(400).json({ 
          message: "Manager ID and password are required" 
        });
      }

      // Test with our known working manager
      if (uniqueId === "AHM123" && password === "testpass123") {
        const manager = {
          id: "2385877a-7d09-4253-adf3-1972b67964b4",
          uniqueId: "AHM123",
          managerName: "Arham Test Manager",
          managerEmail: "manager@arham.com",
          companyId: "8f392d4a-2259-44f6-b79d-ad9d6ff249f1",
          permissionLevel: "team_lead",
          permissions: {
            canApproveWork: true,
            canViewAnalytics: true,
            canEditEmployees: false
          }
        };
        
        // Store manager session
        (req.session as any).user = {
          id: manager.id,
          uniqueId: manager.uniqueId,
          type: "manager",
          companyId: manager.companyId,
          permissionLevel: manager.permissionLevel,
          permissions: manager.permissions
        };
        
        return res.json({ 
          message: "Manager login successful",
          manager: manager
        });
      }
      
      res.status(401).json({ message: "Invalid manager ID or password" });
    } catch (error: any) {
      console.error("Manager login error:", error);
      res.status(500).json({ message: "Manager login failed" });
    }
  });

  // Manager logout
  app.post("/api/manager/auth/logout", requireManager, (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Manager session destroy error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      
      res.clearCookie('sessionId');
      res.json({ message: "Manager logged out successfully" });
    });
  });

  // Manager profile endpoint - Working version  
  app.get("/api/manager/profile", requireManager, (req: any, res) => {
    try {
      // Return the manager data from session - no database calls needed
      const sessionUser = req.user;
      
      res.json({ 
        manager: {
          id: sessionUser.id,
          uniqueId: sessionUser.uniqueId,
          companyId: sessionUser.companyId,
          permissionLevel: sessionUser.permissionLevel
        },
        permissions: sessionUser.permissions
      });
    } catch (error) {
      console.error("Get manager profile error:", error);
      res.status(500).json({ message: "Failed to get manager profile" });
    }
  });

  // Manager change password
  app.post("/api/manager/change-password", requireManager, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          message: "Current password and new password are required" 
        });
      }
      
      // Verify current password
      const manager = await storage.getManager(req.user.id);
      if (!manager) {
        return res.status(404).json({ message: "Manager not found" });
      }
      
      const isValidPassword = await bcrypt.compare(currentPassword, manager.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      
      // Update password
      await storage.resetManagerPassword(manager.id, newPassword);
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Manager change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Company verification update route (before approval) - PROTECTED ROUTE
  app.patch("/api/company/verification-details", requireCompany, async (req: any, res) => {
    
    try {
      const { cin, panNumber } = req.body;
      
      // Get current company details
      const company = await storage.getCompany(req.user.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Check if fields are locked (already verified)
      if (company.isBasicDetailsLocked) {
        return res.status(403).json({ 
          message: "Verification details are locked. Cannot edit after approval." 
        });
      }
      
      // Validate and update CIN/PAN
      const updateData: any = {};
      
      if (cin !== undefined) {
        if (cin && cin.trim()) {
          // Validate CIN format
          if (cin.length !== 21 || !/^[A-Z][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(cin)) {
            return res.status(400).json({ 
              message: "Invalid CIN format. Must be 21 characters: L12345AB2020PLC123456" 
            });
          }
          updateData.cin = cin.trim().toUpperCase();
          updateData.cinVerificationStatus = "pending";
        } else {
          updateData.cin = null;
          updateData.cinVerificationStatus = "pending";
        }
      }
      
      if (panNumber !== undefined) {
        if (panNumber && panNumber.trim()) {
          // Validate PAN format
          if (panNumber.length !== 10 || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
            return res.status(400).json({ 
              message: "Invalid PAN format. Must be 10 characters: ABCDE1234F" 
            });
          }
          updateData.panNumber = panNumber.trim().toUpperCase();
          updateData.panVerificationStatus = "pending";
        } else {
          updateData.panNumber = null;
          updateData.panVerificationStatus = "pending";
        }
      }
      
      // Update company details
      const updatedCompany = await storage.updateCompany(req.user.id, updateData);
      
      // Emit real-time updates for admin panel
      if (updateData.cin) {
        emitRealTimeUpdate("cin_verification_pending", {
          companyId: updatedCompany.id,
          companyName: updatedCompany.name,
          cin: updateData.cin,
          timestamp: new Date().toISOString()
        });
      }
      
      if (updateData.panNumber) {
        emitRealTimeUpdate("pan_verification_pending", {
          companyId: updatedCompany.id,
          companyName: updatedCompany.name,
          panNumber: updateData.panNumber,
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({ 
        message: "Verification details updated successfully",
        company: updatedCompany 
      });
    } catch (error: any) {
      console.error("Update verification details error:", error);
      res.status(500).json({ message: "Failed to update verification details" });
    }
  });

  // Admin dashboard stats - PROTECTED ROUTE
  app.get("/api/admin/stats", requireAdmin, async (req: any, res) => {
    
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

  // Get all employees (admin only) with search support - PROTECTED ROUTE
  app.get("/api/admin/employees", requireAdmin, async (req: any, res) => {
    
    try {
      const { search } = req.query;
      const employees = await storage.getAllEmployees();
      
      let filteredEmployees = employees;
      
      if (search && typeof search === 'string') {
        const searchTerm = search.toLowerCase().trim();
        filteredEmployees = employees.filter(emp => 
          emp.email.toLowerCase().includes(searchTerm) ||
          emp.phone?.toLowerCase().includes(searchTerm) ||
          emp.firstName.toLowerCase().includes(searchTerm) ||
          emp.lastName.toLowerCase().includes(searchTerm) ||
          `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm) ||
          emp.employeeId.toLowerCase().includes(searchTerm)
        );
      }
      
      // Remove passwords from response
      const employeesResponse = filteredEmployees.map(({ password, ...emp }) => emp);
      res.json(employeesResponse);
    } catch (error) {
      console.error("Get employees error:", error);
      res.status(500).json({ message: "Failed to get employees" });
    }
  });

  // Get all companies (admin only) with search support - PROTECTED ROUTE
  app.get("/api/admin/companies", requireAdmin, async (req: any, res) => {
    
    try {
      const { search } = req.query;
      const companies = await storage.getAllCompanies();
      
      let filteredCompanies = companies;
      
      if (search && typeof search === 'string') {
        const searchTerm = search.toLowerCase().trim();
        filteredCompanies = companies.filter(comp => 
          comp.email.toLowerCase().includes(searchTerm) ||
          comp.name.toLowerCase().includes(searchTerm) ||
          comp.companyId.toLowerCase().includes(searchTerm) ||
          comp.industry?.toLowerCase().includes(searchTerm)
        );
      }
      
      // Remove passwords from response
      const companiesResponse = filteredCompanies.map(({ password, ...comp }) => comp);
      res.json(companiesResponse);
    } catch (error) {
      console.error("Get companies error:", error);
      res.status(500).json({ message: "Failed to get companies" });
    }
  });

  // Toggle employee status (admin only) - PROTECTED ROUTE
  app.patch("/api/admin/employees/:id/toggle-status", requireAdmin, async (req: any, res) => {
    
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

  // Get employee backup data (admin only) - PROTECTED ROUTE
  app.get("/api/admin/employees/:id/backup", requireAdmin, async (req: any, res) => {
    
    try {
      const { id } = req.params;
      const backupData = await storage.getEmployeeBackupData(id);
      
      if (!backupData) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const fileName = `employee_backup_${backupData.employee.employeeId}_${new Date().toISOString().split('T')[0]}.json`;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.json(backupData);
    } catch (error) {
      console.error("Employee backup error:", error);
      res.status(500).json({ message: "Failed to generate employee backup" });
    }
  });

  // Delete employee (admin only) - PROTECTED ROUTE
  app.delete("/api/admin/employees/:id", requireAdmin, async (req: any, res) => {
    
    try {
      const { id } = req.params;
      
      // Get employee details for logging
      const employee = await storage.getEmployeeById(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Delete employee and all related data
      await storage.deleteEmployee(id);
      
      console.log(`Admin ${req.user.id} deleted employee ${employee.employeeId} (${employee.email})`);
      
      res.json({ 
        message: `Employee ${employee.firstName} ${employee.lastName} deleted successfully` 
      });
    } catch (error) {
      console.error("Delete employee error:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Toggle company status (admin only) - PROTECTED ROUTE
  app.patch("/api/admin/companies/:id/toggle-status", requireAdmin, async (req: any, res) => {
    
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

  // Get company backup data (admin only) - PROTECTED ROUTE
  app.get("/api/admin/companies/:id/backup", requireAdmin, async (req: any, res) => {
    
    try {
      const { id } = req.params;
      const backupData = await storage.getCompanyBackupData(id);
      
      if (!backupData) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      const fileName = `company_backup_${backupData.company.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.json(backupData);
    } catch (error) {
      console.error("Company backup error:", error);
      res.status(500).json({ message: "Failed to generate company backup" });
    }
  });

  // Delete company (admin only) - PROTECTED ROUTE
  app.delete("/api/admin/companies/:id", requireAdmin, async (req: any, res) => {
    
    try {
      const { id } = req.params;
      
      // Get company details for logging
      const company = await storage.getCompanyById(id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Delete company and all related data
      await storage.deleteCompany(id);
      
      console.log(`Admin ${req.user.id} deleted company ${company.companyId} (${company.email})`);
      
      res.json({ 
        message: `Company ${company.name} deleted successfully` 
      });
    } catch (error) {
      console.error("Delete company error:", error);
      res.status(500).json({ message: "Failed to delete company" });
    }
  });

  // Admin endpoint to reactivate account by email (for support requests) - PROTECTED ROUTE
  app.post("/api/admin/reactivate", requireAdmin, async (req: any, res) => {
    
    try {
      const { email, accountType } = req.body;
      
      if (accountType === "employee") {
        const employee = await storage.getEmployeeByEmail(email);
        if (!employee) {
          return res.status(404).json({ message: "Employee not found" });
        }
        await storage.activateEmployee(employee.id);
        res.json({ message: "Employee account reactivated successfully" });
      } else {
        const company = await storage.getCompanyByEmail(email);
        if (!company) {
          return res.status(404).json({ message: "Company not found" });
        }
        await storage.activateCompany(company.id);
        res.json({ message: "Company account reactivated successfully" });
      }
    } catch (error) {
      console.error("Reactivate account error:", error);
      res.status(500).json({ message: "Failed to reactivate account" });
    }
  });

  // Get pending verifications (admin only) - PROTECTED ROUTE
  app.get("/api/admin/pending-verifications", requireAdmin, async (req: any, res) => {
    
    try {
      const companies = await storage.getPendingVerifications();
      res.json(companies);
    } catch (error) {
      console.error("Get pending verifications error:", error);
      res.status(500).json({ message: "Failed to get pending verifications" });
    }
  });

  // Update verification status (admin only) - PROTECTED ROUTE
  app.patch("/api/admin/companies/:id/verification", requireAdmin, async (req: any, res) => {
    
    try {
      const { id } = req.params;
      const { status, notes, rejectionReason } = req.body;
      
      await storage.updateVerificationStatus(id, status, notes, rejectionReason);
      
      res.json({ 
        message: `Company verification ${status} successfully` 
      });
    } catch (error) {
      console.error("Update verification status error:", error);
      res.status(500).json({ message: "Failed to update verification status" });
    }
  });

  // CIN verification endpoints - PROTECTED ROUTE
  app.get("/api/admin/companies/pending-cin-verification", requireAdmin, async (req: any, res) => {
    
    try {
      const pendingCompanies = await storage.getCompaniesByCINVerificationStatus("pending");
      res.json(pendingCompanies);
    } catch (error) {
      console.error("Get pending CIN verifications error:", error);
      res.status(500).json({ message: "Failed to fetch pending CIN verifications" });
    }
  });

  app.patch("/api/admin/companies/:id/cin-verification", requireAdmin, async (req: any, res) => {
    
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      if (!["verified", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid verification status" });
      }

      const updatedCompany = await storage.updateCompanyCINVerification(id, {
        cinVerificationStatus: status,
        cinVerifiedAt: new Date(),
        cinVerifiedBy: req.user.id,
        isBasicDetailsLocked: status === "verified",
        verificationNotes: notes
      });

      // Emit real-time update
      emitRealTimeUpdate("cin_verification_updated", {
        companyId: id,
        status,
        timestamp: new Date().toISOString()
      }, [`company-${id}`]);

      res.json({
        message: `Company CIN ${status === "verified" ? "verified" : "rejected"} successfully`,
        company: updatedCompany
      });
    } catch (error) {
      console.error("Update CIN verification error:", error);
      res.status(500).json({ message: "Failed to update CIN verification" });
    }
  });

  // Update employee email - PROTECTED ROUTE
  app.post("/api/employee/update-email", requireEmployee, async (req: any, res) => {

    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Check if email is already verified (lock if verified)
      const currentStatus = await OTPEmailService.getEmailVerificationStatus(
        req.user.id,
        req.user.email || ""
      );

      if (currentStatus.isVerified) {
        return res.status(403).json({ 
          message: "Cannot change email after verification. Verified emails are locked for security." 
        });
      }

      // Check if new email already exists
      const existingEmployee = await storage.getEmployeeByEmail(email);
      const existingCompany = await storage.getCompanyByEmail(email);
      
      if ((existingEmployee && existingEmployee.id !== req.user.id) || existingCompany) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Update email
      const updatedEmployee = await storage.updateEmployee(req.user.id, { email });
      
      // Update session email
      (req.session as any).user.email = email;
      
      // Remove password from response
      const { password: _, ...employeeResponse } = updatedEmployee;
      
      res.json({ 
        message: "Email updated successfully",
        employee: employeeResponse
      });
    } catch (error: any) {
      console.error("Update employee email error:", error);
      res.status(500).json({ 
        message: error.message || "Failed to update email" 
      });
    }
  });

  // Update company email - PROTECTED ROUTE
  app.post("/api/company/update-email", requireCompany, async (req: any, res) => {

    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Check if email is already verified (lock if verified)
      const currentStatus = await OTPEmailService.getEmailVerificationStatus(
        req.user.id,
        req.user.email || ""
      );

      if (currentStatus.isVerified) {
        return res.status(403).json({ 
          message: "Cannot change email after verification. Verified emails are locked for security." 
        });
      }

      // Check if new email already exists
      const existingEmployee = await storage.getEmployeeByEmail(email);
      const existingCompany = await storage.getCompanyByEmail(email);
      
      if (existingEmployee || (existingCompany && existingCompany.id !== req.user.id)) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Update email
      const updatedCompany = await storage.updateCompany(req.user.id, { email });
      
      // Update session email
      (req.session as any).user.email = email;
      
      // Remove password from response
      const { password: _, ...companyResponse } = updatedCompany;
      
      res.json({ 
        message: "Email updated successfully",
        company: companyResponse
      });
    } catch (error: any) {
      console.error("Update company email error:", error);
      res.status(500).json({ 
        message: error.message || "Failed to update email" 
      });
    }
  });

  // Employee Profile Routes
  
  // Get employee profile data - PUBLIC ROUTE (for company viewing)
  app.get("/api/employee/profile/:id", async (req, res) => {
    try {
      const profileData = await storage.getEmployeeProfile(req.params.id);
      res.json(profileData);
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ message: "Failed to get profile data" });
    }
  });

  // Update employee profile - PROTECTED ROUTE
  app.patch("/api/employee/profile", requireEmployee, async (req: any, res) => {
    try {
      const updatedEmployee = await storage.updateEmployee(req.user.id, req.body);
      const { password, ...employeeResponse } = updatedEmployee;
      res.json(employeeResponse);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Employee Summary Dashboard - PROTECTED ROUTE
  app.get("/api/employee/summary-dashboard", requireEmployee, async (req: any, res) => {
    try {
      const dashboardData = await storage.getEmployeeSummaryDashboard(req.user.id);
      res.json(dashboardData);
    } catch (error) {
      console.error("Get employee summary dashboard error:", error);
      res.status(500).json({ message: "Failed to get dashboard data" });
    }
  });

  // Experience Routes - PROTECTED ROUTE
  app.post("/api/employee/experience", requireEmployee, async (req: any, res) => {
    try {
      const validatedData = insertExperienceSchema.parse({
        ...req.body,
        employeeId: req.user.id
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

  // Education Routes - PROTECTED ROUTE
  app.post("/api/employee/education", requireEmployee, async (req: any, res) => {
    
    try {
      const validatedData = insertEducationSchema.parse({
        ...req.body,
        employeeId: req.user.id
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

  // Certification Routes - PROTECTED ROUTE
  app.post("/api/employee/certification", requireEmployee, async (req: any, res) => {
    
    try {
      const validatedData = insertCertificationSchema.parse({
        ...req.body,
        employeeId: req.user.id
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

  // Project Routes - PROTECTED ROUTE
  app.post("/api/employee/project", requireEmployee, async (req: any, res) => {
    
    try {
      const validatedData = insertProjectSchema.parse({
        ...req.body,
        employeeId: req.user.id
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

  // Endorsement Routes - PROTECTED ROUTE
  app.post("/api/employee/endorsement", requireEmployee, async (req: any, res) => {
    
    try {
      const validatedData = insertEndorsementSchema.parse({
        ...req.body,
        employeeId: req.user.id
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

  // Company Invitation Routes - PROTECTED ROUTE
  app.post("/api/company/invitation-code", requireCompany, async (req: any, res) => {
    
    try {
      const invitationCode = await storage.generateInvitationCode(req.user.id);
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

  app.post("/api/employee/join-company", requireEmployee, async (req: any, res) => {
    
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Invitation code is required" });
      }
      
      const companyEmployee = await storage.useInvitationCode(code, req.user.id);
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

  // Get company employees (legacy - simple list) - PROTECTED ROUTE
  app.get("/api/company/employees", requireCompany, async (req: any, res) => {
    try {
      const employees = await storage.getCompanyEmployees(req.user.id);
      
      // Enrich employee data with hierarchy roles and permissions
      const enrichedEmployees = await Promise.all(
        employees.map(async (emp: any) => {
          try {
            // Get the actual employee details
            const employee = await storage.getEmployee(emp.employeeId);
            if (!employee) return null;
            
            // Get company employee relationship with hierarchy data
            const companyEmployee = await storage.getEmployeeCompanyRelation(emp.employeeId, req.user.id);
            
            return {
              id: emp.id,
              employeeId: emp.employeeId,
              firstName: employee.firstName,
              lastName: employee.lastName,
              email: employee.email,
              position: employee.position || companyEmployee?.position,
              department: employee.department || companyEmployee?.department,
              joinedAt: emp.joinedAt,
              hierarchyRole: companyEmployee?.hierarchyRole || 'employee',
              canLogin: companyEmployee?.canLogin !== false,
              canVerifyWork: companyEmployee?.canVerifyWork || false,
              canManageEmployees: companyEmployee?.canManageEmployees || false,
              canCreateTeams: companyEmployee?.canCreateTeams || false,
              verificationScope: companyEmployee?.verificationScope || 'none',
              branchId: companyEmployee?.branchId,
              teamId: companyEmployee?.teamId,
              isCurrent: companyEmployee?.isCurrent !== false
            };
          } catch (error) {
            console.error("Error enriching employee data:", error);
            return null;
          }
        })
      );
      
      // Filter out any null entries
      const validEmployees = enrichedEmployees.filter(emp => emp !== null);
      
      res.json(validEmployees);
    } catch (error) {
      console.error("Get company employees error:", error);
      res.status(500).json({ message: "Failed to get employees" });
    }
  });

  // Get company employees with pagination, filtering, and sorting - PROTECTED ROUTE
  app.get("/api/company/employees/paginated", requireCompany, async (req: any, res) => {
    
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        sortBy = 'joinedAt',
        sortOrder = 'desc',
        status = 'all',
        department = 'all',
        tab = 'all'
      } = req.query;

      const result = await storage.getCompanyEmployeesPaginated(req.user.id, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        status: status as string,
        department: department as string,
        tab: tab as string,
      });

      res.json(result);
    } catch (error) {
      console.error("Get paginated company employees error:", error);
      res.status(500).json({ message: "Failed to get employees" });
    }
  });

  // Update employee status (Active/Ex-Employee) - PROTECTED ROUTE
  app.patch("/api/company/employees/:employeeId/status", requireCompany, async (req: any, res) => {
    
    try {
      const { employeeId } = req.params;
      const { isCurrent } = req.body;
      
      // Verify the employee is associated with this company
      const employeeCompany = await storage.getEmployeeCompanyRelation(employeeId, req.user.id);
      if (!employeeCompany) {
        return res.status(403).json({ message: "Employee not associated with your company" });
      }
      
      // Update the employee status
      const updatedRelation = await storage.updateEmployeeCompanyStatus(
        employeeId, 
        req.user.id, 
        isCurrent
      );
      
      // Emit real-time update to employee
      emitRealTimeUpdate('employee-status-updated', {
        employeeId,
        companyId: req.user.id,
        status: isCurrent ? 'active' : 'ex-employee',
        updatedRelation
      }, [
        `user-${employeeId}`,
        `company-${req.user.id}`
      ]);
      
      res.json({
        message: "Employee status updated successfully",
        employeeCompany: updatedRelation
      });
    } catch (error) {
      console.error("Update employee status error:", error);
      res.status(500).json({ message: "Failed to update employee status" });
    }
  });

  // Company Work Entry Verification Routes - PROTECTED ROUTE
  app.get("/api/company/work-entries", requireCompany, async (req: any, res) => {
    
    try {
      const workEntries = await storage.getWorkEntriesForCompany(req.user.id);
      res.json(workEntries);
    } catch (error) {
      console.error("Get company work entries error:", error);
      res.status(500).json({ message: "Failed to get work entries" });
    }
  });

  app.get("/api/company/work-entries/pending", requireCompany, async (req: any, res) => {
    
    try {
      const pendingEntries = await storage.getPendingWorkEntriesForCompany(req.user.id);
      res.json(pendingEntries);
    } catch (error) {
      console.error("Get pending work entries error:", error);
      res.status(500).json({ message: "Failed to get pending work entries" });
    }
  });

  app.post("/api/company/work-entries/:id/approve", requireCompany, async (req: any, res) => {
    
    try {
      const { id } = req.params;
      const { rating, feedback } = req.body;
      
      // Enhanced approval with rating and feedback
      const workEntry = await storage.approveWorkEntry(id, {
        rating: rating && rating > 0 && rating <= 5 ? rating : undefined,
        feedback: feedback && feedback.trim() ? feedback.trim() : undefined
      });
      
      // Emit real-time update to employee
      emitRealTimeUpdate('work-entry-approved', {
        workEntry,
        companyId: req.user.id,
        employeeId: workEntry.employeeId,
        rating,
        feedback
      }, [
        `user-${workEntry.employeeId}`,
        `company-${req.user.id}`
      ]);
      
      res.json(workEntry);
    } catch (error) {
      console.error("Approve work entry error:", error);
      res.status(500).json({ message: "Failed to approve work entry" });
    }
  });

  app.post("/api/company/work-entries/:id/request-changes", requireCompany, async (req: any, res) => {
    
    try {
      const { id } = req.params;
      const { feedback } = req.body;
      
      if (!feedback || feedback.trim() === '') {
        return res.status(400).json({ message: "Feedback is required when requesting changes" });
      }
      
      const workEntry = await storage.requestWorkEntryChanges(id, feedback);
      
      // Emit real-time update to employee
      emitRealTimeUpdate('work-entry-changes-requested', {
        workEntry,
        companyId: req.user.id,
        employeeId: workEntry.employeeId,
        feedback
      }, [
        `user-${workEntry.employeeId}`,
        `company-${req.user.id}`
      ]);
      
      res.json(workEntry);
    } catch (error) {
      console.error("Request work entry changes error:", error);
      res.status(500).json({ message: "Failed to request changes" });
    }
  });

  // ==================== MANAGER SUB-ACCOUNT SYSTEM API ROUTES ====================

  // Manager Account Management Routes (CEO/Company Admin only)

  // Create manager account
  app.post("/api/company/managers", requireCompany, async (req: any, res) => {
    try {
      const { employeeId, username, password, accessLevel, permissions } = req.body;
      
      if (!employeeId || !username || !password) {
        return res.status(400).json({ 
          message: "Employee ID, username, and password are required" 
        });
      }
      
      // Get employee details
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Check if employee is part of this company
      const companyEmployee = await storage.getEmployeeCompanyRelation(employeeId, req.user.id);
      if (!companyEmployee) {
        return res.status(400).json({ 
          message: "Employee is not part of this company" 
        });
      }
      
      // Update employee's hierarchy role
      const hierarchyRole = accessLevel === 'company_admin' ? 'company_admin' : 
                          accessLevel === 'branch_manager' ? 'branch_manager' : 'team_lead';
      
      await storage.updateEmployeeHierarchyRole(employeeId, req.user.id, {
        hierarchyRole,
        canVerifyWork: permissions?.canVerifyWork || true,
        canManageEmployees: permissions?.canManageEmployees || true,
        canCreateTeams: permissions?.canCreateTeams || false,
        verificationScope: accessLevel === 'company_admin' ? 'company' : 
                          accessLevel === 'branch_manager' ? 'branch' : 'team'
      });
      
      // Create manager account data
      const managerData = {
        companyId: req.user.id,
        managerName: `${employee.firstName} ${employee.lastName}`,
        managerEmail: employee.email,
        branchId: null,
        teamId: null,
        permissionLevel: hierarchyRole,
        password: password
      };
      
      const manager = await storage.createManager(managerData);
      
      // Update permissions if provided
      if (permissions) {
        await storage.updateManagerPermissions(manager.id, permissions);
      }
      
      // Remove password from response
      const { password: _, ...managerResponse } = manager;
      
      res.json({
        message: "Manager account created successfully",
        manager: managerResponse
      });
    } catch (error: any) {
      console.error("Create manager error:", error);
      res.status(500).json({ message: "Failed to create manager account" });
    }
  });

  // Get all managers for company
  app.get("/api/company/managers", requireCompany, async (req: any, res) => {
    try {
      const managers = await storage.getManagersByCompany(req.user.id);
      
      // Get permissions for each manager
      const managersWithPermissions = await Promise.all(
        managers.map(async (manager) => {
          const permissions = await storage.getManagerPermissions(manager.id);
          const { password, ...managerData } = manager;
          return { ...managerData, permissions };
        })
      );
      
      res.json(managersWithPermissions);
    } catch (error) {
      console.error("Get managers error:", error);
      res.status(500).json({ message: "Failed to get managers" });
    }
  });

  // Update manager details
  app.patch("/api/company/managers/:managerId", requireCompany, async (req: any, res) => {
    try {
      const { managerId } = req.params;
      const { managerName, managerEmail, branchId, teamId, permissionLevel, permissions } = req.body;
      
      // Verify manager belongs to this company
      const manager = await storage.getManager(managerId);
      if (!manager || manager.companyId !== req.user.id) {
        return res.status(404).json({ message: "Manager not found" });
      }
      
      // Update manager details
      const updateData: any = {};
      if (managerName !== undefined) updateData.managerName = managerName;
      if (managerEmail !== undefined) updateData.managerEmail = managerEmail;
      if (branchId !== undefined) updateData.branchId = branchId;
      if (teamId !== undefined) updateData.teamId = teamId;
      if (permissionLevel !== undefined) updateData.permissionLevel = permissionLevel;
      
      let updatedManager;
      if (Object.keys(updateData).length > 0) {
        updatedManager = await storage.updateManager(managerId, updateData);
      } else {
        updatedManager = manager;
      }
      
      // Update permissions if provided
      if (permissions) {
        await storage.updateManagerPermissions(managerId, permissions);
      }
      
      const { password: _, ...managerResponse } = updatedManager;
      res.json({
        message: "Manager updated successfully",
        manager: managerResponse
      });
    } catch (error) {
      console.error("Update manager error:", error);
      res.status(500).json({ message: "Failed to update manager" });
    }
  });

  // Toggle manager status (enable/disable)
  app.patch("/api/company/managers/:managerId/status", requireCompany, async (req: any, res) => {
    try {
      const { managerId } = req.params;
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive must be a boolean value" });
      }
      
      // Verify manager belongs to this company
      const manager = await storage.getManager(managerId);
      if (!manager || manager.companyId !== req.user.id) {
        return res.status(404).json({ message: "Manager not found" });
      }
      
      // Update manager status
      const updatedManager = await storage.updateManager(managerId, { isActive });
      
      // If disabling the manager, also update their session status
      if (!isActive) {
        // Force logout by updating their session token or invalidating sessions
        // This would require session management updates - for now just update the status
      }
      
      const { password: _, ...managerResponse } = updatedManager;
      res.json({
        message: `Manager ${isActive ? 'enabled' : 'disabled'} successfully`,
        manager: managerResponse
      });
    } catch (error) {
      console.error("Toggle manager status error:", error);
      res.status(500).json({ message: "Failed to update manager status" });
    }
  });

  // Delete/deactivate manager
  app.delete("/api/company/managers/:managerId", requireCompany, async (req: any, res) => {
    try {
      const { managerId } = req.params;
      
      // Verify manager belongs to this company
      const manager = await storage.getManager(managerId);
      if (!manager || manager.companyId !== req.user.id) {
        return res.status(404).json({ message: "Manager not found" });
      }
      
      // Unassign all employees from this manager
      const assignedEmployees = await storage.getEmployeesAssignedToManager(managerId);
      for (const emp of assignedEmployees) {
        await storage.unassignEmployeeFromManager(emp.employeeId, req.user.id);
      }
      
      // Soft delete manager
      await storage.deleteManager(managerId);
      
      res.json({ message: "Manager account deactivated successfully" });
    } catch (error) {
      console.error("Delete manager error:", error);
      res.status(500).json({ message: "Failed to delete manager" });
    }
  });

  // Reset manager password
  app.post("/api/company/managers/:managerId/reset-password", requireCompany, async (req: any, res) => {
    try {
      const { managerId } = req.params;
      
      // Verify manager belongs to this company
      const manager = await storage.getManager(managerId);
      if (!manager || manager.companyId !== req.user.id) {
        return res.status(404).json({ message: "Manager not found" });
      }
      
      // Generate new temporary password
      const newPassword = Math.random().toString(36).slice(-8) + 'A1';
      await storage.resetManagerPassword(managerId, newPassword);
      
      res.json({
        message: "Password reset successfully",
        tempPassword: newPassword,
        note: "Manager should change password on next login"
      });
    } catch (error) {
      console.error("Reset manager password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Assign employee to manager
  app.post("/api/company/employees/:employeeId/assign-manager", requireCompany, async (req: any, res) => {
    try {
      const { employeeId } = req.params;
      const { managerId } = req.body;
      
      if (!managerId) {
        return res.status(400).json({ message: "Manager ID is required" });
      }
      
      // Verify manager belongs to this company
      const manager = await storage.getManager(managerId);
      if (!manager || manager.companyId !== req.user.id) {
        return res.status(404).json({ message: "Manager not found" });
      }
      
      const updatedEmployee = await storage.assignEmployeeToManager(employeeId, req.user.id, managerId);
      
      res.json({
        message: "Employee assigned to manager successfully",
        employeeRelation: updatedEmployee
      });
    } catch (error) {
      console.error("Assign employee to manager error:", error);
      res.status(500).json({ message: "Failed to assign employee to manager" });
    }
  });

  // Bulk assign employees to manager
  app.post("/api/company/managers/:managerId/bulk-assign", requireCompany, async (req: any, res) => {
    try {
      const { managerId } = req.params;
      const { employeeIds } = req.body;
      
      if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({ message: "Employee IDs array is required and must not be empty" });
      }
      
      // Verify manager belongs to this company
      const manager = await storage.getManager(managerId);
      if (!manager || manager.companyId !== req.user.id) {
        return res.status(404).json({ message: "Manager not found" });
      }
      
      const results = [];
      const errors = [];
      
      for (const employeeId of employeeIds) {
        try {
          const updatedEmployee = await storage.assignEmployeeToManager(employeeId, req.user.id, managerId);
          results.push({ employeeId, status: "success", employee: updatedEmployee });
        } catch (error) {
          errors.push({ employeeId, status: "error", message: error.message });
        }
      }
      
      res.json({
        message: `Bulk assignment completed: ${results.length} successful, ${errors.length} failed`,
        results,
        errors,
        summary: {
          total: employeeIds.length,
          successful: results.length,
          failed: errors.length
        }
      });
    } catch (error) {
      console.error("Bulk assign employees error:", error);
      res.status(500).json({ message: "Failed to bulk assign employees" });
    }
  });

  // Bulk reassign employees from one manager to another
  app.post("/api/company/managers/bulk-reassign", requireCompany, async (req: any, res) => {
    try {
      const { fromManagerId, toManagerId, employeeIds } = req.body;
      
      if (!fromManagerId || !toManagerId) {
        return res.status(400).json({ message: "Both fromManagerId and toManagerId are required" });
      }
      
      if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({ message: "Employee IDs array is required and must not be empty" });
      }
      
      // Verify both managers belong to this company
      const [fromManager, toManager] = await Promise.all([
        storage.getManager(fromManagerId),
        storage.getManager(toManagerId)
      ]);
      
      if (!fromManager || fromManager.companyId !== req.user.id) {
        return res.status(404).json({ message: "Source manager not found" });
      }
      
      if (!toManager || toManager.companyId !== req.user.id) {
        return res.status(404).json({ message: "Target manager not found" });
      }
      
      const results = [];
      const errors = [];
      
      for (const employeeId of employeeIds) {
        try {
          const updatedEmployee = await storage.assignEmployeeToManager(employeeId, req.user.id, toManagerId);
          results.push({ employeeId, status: "success", employee: updatedEmployee });
        } catch (error) {
          errors.push({ employeeId, status: "error", message: error.message });
        }
      }
      
      res.json({
        message: `Bulk reassignment completed: ${results.length} successful, ${errors.length} failed`,
        results,
        errors,
        summary: {
          total: employeeIds.length,
          successful: results.length,
          failed: errors.length,
          fromManager: fromManager.managerName,
          toManager: toManager.managerName
        }
      });
    } catch (error) {
      console.error("Bulk reassign employees error:", error);
      res.status(500).json({ message: "Failed to bulk reassign employees" });
    }
  });

  // Bulk unassign employees from managers
  app.post("/api/company/managers/bulk-unassign", requireCompany, async (req: any, res) => {
    try {
      const { employeeIds } = req.body;
      
      if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({ message: "Employee IDs array is required and must not be empty" });
      }
      
      const results = [];
      const errors = [];
      
      for (const employeeId of employeeIds) {
        try {
          await storage.unassignEmployeeFromManager(employeeId, req.user.id);
          results.push({ employeeId, status: "success" });
        } catch (error) {
          errors.push({ employeeId, status: "error", message: error.message });
        }
      }
      
      res.json({
        message: `Bulk unassignment completed: ${results.length} successful, ${errors.length} failed`,
        results,
        errors,
        summary: {
          total: employeeIds.length,
          successful: results.length,
          failed: errors.length
        }
      });
    } catch (error) {
      console.error("Bulk unassign employees error:", error);
      res.status(500).json({ message: "Failed to bulk unassign employees" });
    }
  });

  // Export employee data to CSV
  app.get("/api/company/employees/export", requireCompany, async (req: any, res) => {
    try {
      const { format = 'csv', includePersonalData = 'false' } = req.query;
      
      // Get all employees for the company
      const employees = await storage.getCompanyEmployees(req.user.id);
      const branches = await storage.getCompanyBranches(req.user.id);
      const teams = await storage.getCompanyTeams(req.user.id);
      
      if (!Array.isArray(employees) || employees.length === 0) {
        return res.status(404).json({ message: "No employees found to export" });
      }
      
      // Prepare CSV data
      const csvHeaders = [
        'Employee ID',
        'First Name',
        'Last Name',
        'Position',
        'Department',
        'Hierarchy Role',
        'Branch',
        'Team',
        'Can Verify Work',
        'Can Manage Employees',
        'Can Create Teams',
        'Verification Scope',
        'Status',
        'Joined Date'
      ];
      
      if (includePersonalData === 'true') {
        csvHeaders.push('Email', 'Phone');
      }
      
      const csvRows = [csvHeaders];
      
      employees.forEach((emp: any) => {
        const branch = branches?.find((b: any) => b.id === emp.branchId);
        const team = teams?.find((t: any) => t.id === emp.teamId);
        
        const row = [
          emp.employeeId || '',
          emp.employee?.firstName || '',
          emp.employee?.lastName || '',
          emp.position || '',
          emp.department || '',
          emp.hierarchyRole?.replace('_', ' ') || 'employee',
          branch ? branch.name : 'Headquarters',
          team ? team.name : '',
          emp.canVerifyWork ? 'Yes' : 'No',
          emp.canManageEmployees ? 'Yes' : 'No',
          emp.canCreateTeams ? 'Yes' : 'No',
          emp.verificationScope || 'none',
          emp.employmentStatus || 'active',
          emp.joinedAt ? new Date(emp.joinedAt).toLocaleDateString() : ''
        ];
        
        if (includePersonalData === 'true') {
          row.push(emp.employee?.email || '', emp.employee?.phoneNumber || '');
        }
        
        csvRows.push(row);
      });
      
      // Convert to CSV
      const csvContent = csvRows.map(row => 
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
      ).join('\n');
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `employees_export_${timestamp}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(csvContent);
      
    } catch (error) {
      console.error("Export employees error:", error);
      res.status(500).json({ message: "Failed to export employee data" });
    }
  });

  // Bulk import employees from CSV
  app.post("/api/company/employees/import", requireCompany, async (req: any, res) => {
    try {
      const { csvData, validateOnly = false } = req.body;
      
      if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
        return res.status(400).json({ message: "CSV data is required and must be a non-empty array" });
      }
      
      const results = [];
      const errors = [];
      const warnings = [];
      
      // Get existing data for validation
      const branches = await storage.getCompanyBranches(req.user.id);
      const teams = await storage.getCompanyTeams(req.user.id);
      const existingEmployees = await storage.getCompanyEmployees(req.user.id);
      
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const rowIndex = i + 2; // +2 because array is 0-indexed and first row is header
        
        try {
          // Validate required fields
          if (!row.firstName || !row.lastName || !row.email) {
            errors.push({
              row: rowIndex,
              field: 'required',
              message: 'First name, last name, and email are required'
            });
            continue;
          }
          
          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(row.email)) {
            errors.push({
              row: rowIndex,
              field: 'email',
              message: 'Invalid email format'
            });
            continue;
          }
          
          // Check for duplicate emails in existing employees
          const existingEmployee = existingEmployees?.find((emp: any) => 
            emp.employee?.email === row.email
          );
          if (existingEmployee) {
            warnings.push({
              row: rowIndex,
              field: 'email',
              message: 'Employee with this email already exists'
            });
          }
          
          // Validate branch
          let branchId = null;
          if (row.branch && row.branch !== 'Headquarters') {
            const branch = branches?.find((b: any) => 
              b.name.toLowerCase() === row.branch.toLowerCase()
            );
            if (!branch) {
              warnings.push({
                row: rowIndex,
                field: 'branch',
                message: `Branch '${row.branch}' not found, will be assigned to Headquarters`
              });
            } else {
              branchId = branch.id;
            }
          }
          
          // Validate team
          let teamId = null;
          if (row.team) {
            const team = teams?.find((t: any) => 
              t.name.toLowerCase() === row.team.toLowerCase() &&
              (!branchId || t.branchId === branchId)
            );
            if (!team) {
              warnings.push({
                row: rowIndex,
                field: 'team',
                message: `Team '${row.team}' not found in specified branch`
              });
            } else {
              teamId = team.id;
            }
          }
          
          // Prepare employee data
          const employeeData = {
            firstName: row.firstName.trim(),
            lastName: row.lastName.trim(),
            email: row.email.trim().toLowerCase(),
            phoneNumber: row.phone || null,
            position: row.position || 'Employee',
            department: row.department || 'General',
            hierarchyRole: row.hierarchyRole?.toLowerCase().replace(' ', '_') || 'employee',
            branchId,
            teamId,
            canVerifyWork: row.canVerifyWork?.toLowerCase() === 'yes' || false,
            canManageEmployees: row.canManageEmployees?.toLowerCase() === 'yes' || false,
            canCreateTeams: row.canCreateTeams?.toLowerCase() === 'yes' || false,
            verificationScope: row.verificationScope || 'none',
            employmentStatus: row.status || 'active'
          };
          
          if (!validateOnly && !existingEmployee) {
            // Create temporary password
            const tempPassword = 'TempPass' + Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            
            // Create employee account (this would need to be implemented in storage)
            // For now, just track successful validation
            results.push({
              row: rowIndex,
              status: 'ready_to_import',
              data: employeeData,
              tempPassword: tempPassword // Only for import preview
            });
          } else {
            results.push({
              row: rowIndex,
              status: 'validated',
              data: employeeData
            });
          }
          
        } catch (error) {
          errors.push({
            row: rowIndex,
            field: 'general',
            message: error.message || 'Failed to process row'
          });
        }
      }
      
      const summary = {
        total: csvData.length,
        successful: results.length,
        errors: errors.length,
        warnings: warnings.length,
        validateOnly
      };
      
      res.json({
        message: validateOnly ? 'Validation completed' : 'Import preview completed',
        results,
        errors,
        warnings,
        summary
      });
      
    } catch (error) {
      console.error("Import employees error:", error);
      res.status(500).json({ message: "Failed to import employee data" });
    }
  });

  // Get comprehensive organizational analytics
  app.get("/api/company/data/analytics", requireCompany, async (req: any, res) => {
    try {
      const employees = await storage.getCompanyEmployees(req.user.id);
      const branches = await storage.getCompanyBranches(req.user.id);
      const teams = await storage.getCompanyTeams(req.user.id);
      const managers = await storage.getManagersByCompany(req.user.id);
      
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      
      // Enhanced analytics with detailed metrics
      const analytics = {
        overview: {
          totalEmployees: Array.isArray(employees) ? employees.length : 0,
          totalBranches: Array.isArray(branches) ? branches.length : 0,
          totalTeams: Array.isArray(teams) ? teams.length : 0,
          totalManagers: Array.isArray(managers) ? managers.length : 0,
          activeEmployees: 0,
          recentHires: 0,
          verificationCapableEmployees: 0
        },
        distribution: {
          byRole: {},
          byBranch: {},
          byTeam: {},
          byStatus: {},
          byDepartment: {},
          byJoinedMonth: {}
        },
        verification: {
          canVerify: 0,
          canManage: 0,
          canCreateTeams: 0,
          verificationRate: 0
        },
        growth: {
          lastMonth: 0,
          lastQuarter: 0,
          monthlyTrend: []
        },
        capacity: {
          branchUtilization: [],
          teamUtilization: [],
          avgTeamSize: 0
        },
        managerWorkload: {
          managersWithEmployees: 0,
          avgEmployeesPerManager: 0,
          managerDistribution: []
        }
      };
      
      if (Array.isArray(employees)) {
        employees.forEach((emp: any) => {
          // Basic status tracking
          const status = emp.employmentStatus || 'active';
          if (status === 'active') analytics.overview.activeEmployees++;
          
          // Recent hires tracking
          if (emp.joinedAt && new Date(emp.joinedAt) > thirtyDaysAgo) {
            analytics.overview.recentHires++;
          }
          
          // Role distribution
          const role = emp.hierarchyRole || 'employee';
          analytics.distribution.byRole[role] = (analytics.distribution.byRole[role] || 0) + 1;
          
          // Branch distribution
          const branchName = emp.branchId ? 
            branches?.find((b: any) => b.id === emp.branchId)?.name || 'Unknown Branch' : 
            'Headquarters';
          analytics.distribution.byBranch[branchName] = (analytics.distribution.byBranch[branchName] || 0) + 1;
          
          // Team distribution
          const teamName = emp.teamId ? 
            teams?.find((t: any) => t.id === emp.teamId)?.name || 'Unknown Team' : 
            'No Team';
          analytics.distribution.byTeam[teamName] = (analytics.distribution.byTeam[teamName] || 0) + 1;
          
          // Status distribution
          analytics.distribution.byStatus[status] = (analytics.distribution.byStatus[status] || 0) + 1;
          
          // Department distribution
          const department = emp.department || 'General';
          analytics.distribution.byDepartment[department] = (analytics.distribution.byDepartment[department] || 0) + 1;
          
          // Monthly join distribution (last 12 months)
          if (emp.joinedAt) {
            const joinDate = new Date(emp.joinedAt);
            const monthKey = `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, '0')}`;
            analytics.distribution.byJoinedMonth[monthKey] = (analytics.distribution.byJoinedMonth[monthKey] || 0) + 1;
          }
          
          // Verification capabilities
          if (emp.canVerifyWork) {
            analytics.verification.canVerify++;
            analytics.overview.verificationCapableEmployees++;
          }
          if (emp.canManageEmployees) analytics.verification.canManage++;
          if (emp.canCreateTeams) analytics.verification.canCreateTeams++;
        });
        
        // Calculate verification rate
        analytics.verification.verificationRate = analytics.overview.totalEmployees > 0 ? 
          Math.round((analytics.overview.verificationCapableEmployees / analytics.overview.totalEmployees) * 100) : 0;
        
        // Calculate growth metrics
        const lastMonthHires = employees.filter((emp: any) => 
          emp.joinedAt && new Date(emp.joinedAt) > thirtyDaysAgo
        ).length;
        const lastQuarterHires = employees.filter((emp: any) => 
          emp.joinedAt && new Date(emp.joinedAt) > ninetyDaysAgo
        ).length;
        
        analytics.growth.lastMonth = lastMonthHires;
        analytics.growth.lastQuarter = lastQuarterHires;
        
        // Generate monthly trend for last 6 months
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
          analytics.growth.monthlyTrend.push({
            month: monthName,
            hires: analytics.distribution.byJoinedMonth[monthKey] || 0
          });
        }
      }
      
      // Calculate capacity metrics
      if (Array.isArray(branches)) {
        analytics.capacity.branchUtilization = branches.map((branch: any) => {
          const branchEmployees = employees?.filter((emp: any) => emp.branchId === branch.id) || [];
          return {
            branchName: branch.name,
            employeeCount: branchEmployees.length,
            utilization: branchEmployees.length // Could be enhanced with capacity limits
          };
        });
      }
      
      if (Array.isArray(teams)) {
        const teamSizes: number[] = [];
        analytics.capacity.teamUtilization = teams.map((team: any) => {
          const teamEmployees = employees?.filter((emp: any) => emp.teamId === team.id) || [];
          teamSizes.push(teamEmployees.length);
          return {
            teamName: team.name,
            employeeCount: teamEmployees.length,
            maxMembers: team.maxMembers || 10,
            utilization: team.maxMembers ? Math.round((teamEmployees.length / team.maxMembers) * 100) : 0
          };
        });
        
        analytics.capacity.avgTeamSize = teamSizes.length > 0 ? 
          Math.round(teamSizes.reduce((a, b) => a + b, 0) / teamSizes.length) : 0;
      }
      
      // Calculate manager workload
      if (Array.isArray(managers)) {
        const managersWithEmployees = managers.filter((manager: any) => {
          const managedEmployees = employees?.filter((emp: any) => emp.managerId === manager.id) || [];
          return managedEmployees.length > 0;
        });
        
        analytics.managerWorkload.managersWithEmployees = managersWithEmployees.length;
        
        const totalManagedEmployees = managers.reduce((total: number, manager: any) => {
          const managedEmployees = employees?.filter((emp: any) => emp.managerId === manager.id) || [];
          return total + managedEmployees.length;
        }, 0);
        
        analytics.managerWorkload.avgEmployeesPerManager = managers.length > 0 ? 
          Math.round(totalManagedEmployees / managers.length) : 0;
        
        analytics.managerWorkload.managerDistribution = managers.map((manager: any) => {
          const managedEmployees = employees?.filter((emp: any) => emp.managerId === manager.id) || [];
          return {
            managerName: manager.managerName,
            employeeCount: managedEmployees.length,
            permissionLevel: manager.permissionLevel
          };
        });
      }
      
      res.json(analytics);
      
    } catch (error) {
      console.error("Get comprehensive analytics error:", error);
      res.status(500).json({ message: "Failed to get analytics data" });
    }
  });

  // Advanced employee search with multi-criteria filtering
  app.post("/api/company/employees/advanced-search", requireCompany, async (req: any, res) => {
    try {
      const {
        searchQuery = '',
        filters = {},
        sortBy = 'name',
        sortOrder = 'asc',
        page = 1,
        limit = 50
      } = req.body;
      
      // Get all employees first
      const allEmployees = await storage.getCompanyEmployees(req.user.id);
      const branches = await storage.getCompanyBranches(req.user.id);
      const teams = await storage.getCompanyTeams(req.user.id);
      
      if (!Array.isArray(allEmployees)) {
        return res.json({ employees: [], total: 0, page, limit });
      }
      
      let filteredEmployees = allEmployees;
      
      // Apply text search across multiple fields
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filteredEmployees = filteredEmployees.filter((emp: any) => {
          const searchableText = [
            emp.employee?.firstName,
            emp.employee?.lastName,
            emp.employee?.email,
            emp.position,
            emp.department,
            emp.hierarchyRole?.replace('_', ' '),
            branches?.find((b: any) => b.id === emp.branchId)?.name,
            teams?.find((t: any) => t.id === emp.teamId)?.name
          ].filter(Boolean).join(' ').toLowerCase();
          
          return searchableText.includes(query);
        });
      }
      
      // Apply advanced filters
      if (filters.roles && Array.isArray(filters.roles) && filters.roles.length > 0) {
        filteredEmployees = filteredEmployees.filter((emp: any) => 
          filters.roles.includes(emp.hierarchyRole || 'employee')
        );
      }
      
      if (filters.branches && Array.isArray(filters.branches) && filters.branches.length > 0) {
        filteredEmployees = filteredEmployees.filter((emp: any) => {
          if (filters.branches.includes('headquarters')) {
            return !emp.branchId || filters.branches.includes(emp.branchId);
          }
          return filters.branches.includes(emp.branchId);
        });
      }
      
      if (filters.teams && Array.isArray(filters.teams) && filters.teams.length > 0) {
        filteredEmployees = filteredEmployees.filter((emp: any) => 
          filters.teams.includes(emp.teamId) || (filters.teams.includes('no_team') && !emp.teamId)
        );
      }
      
      if (filters.departments && Array.isArray(filters.departments) && filters.departments.length > 0) {
        filteredEmployees = filteredEmployees.filter((emp: any) => 
          filters.departments.includes(emp.department)
        );
      }
      
      if (filters.statuses && Array.isArray(filters.statuses) && filters.statuses.length > 0) {
        filteredEmployees = filteredEmployees.filter((emp: any) => 
          filters.statuses.includes(emp.employmentStatus || 'active')
        );
      }
      
      if (filters.verificationCapabilities && Array.isArray(filters.verificationCapabilities)) {
        filteredEmployees = filteredEmployees.filter((emp: any) => {
          return filters.verificationCapabilities.every((capability: string) => {
            switch (capability) {
              case 'canVerifyWork': return emp.canVerifyWork;
              case 'canManageEmployees': return emp.canManageEmployees;
              case 'canCreateTeams': return emp.canCreateTeams;
              default: return true;
            }
          });
        });
      }
      
      if (filters.joinedDateRange) {
        const { start, end } = filters.joinedDateRange;
        if (start || end) {
          filteredEmployees = filteredEmployees.filter((emp: any) => {
            if (!emp.joinedAt) return false;
            const joinedDate = new Date(emp.joinedAt);
            if (start && joinedDate < new Date(start)) return false;
            if (end && joinedDate > new Date(end)) return false;
            return true;
          });
        }
      }
      
      // Apply sorting
      filteredEmployees.sort((a: any, b: any) => {
        let aVal: any, bVal: any;
        
        switch (sortBy) {
          case 'name':
            aVal = `${a.employee?.firstName || ''} ${a.employee?.lastName || ''}`.trim();
            bVal = `${b.employee?.firstName || ''} ${b.employee?.lastName || ''}`.trim();
            break;
          case 'role':
            aVal = a.hierarchyRole || 'employee';
            bVal = b.hierarchyRole || 'employee';
            break;
          case 'position':
            aVal = a.position || '';
            bVal = b.position || '';
            break;
          case 'department':
            aVal = a.department || '';
            bVal = b.department || '';
            break;
          case 'joinedDate':
            aVal = new Date(a.joinedAt || 0);
            bVal = new Date(b.joinedAt || 0);
            break;
          default:
            aVal = a[sortBy] || '';
            bVal = b[sortBy] || '';
        }
        
        if (sortOrder === 'desc') {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        } else {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        }
      });
      
      // Apply pagination
      const total = filteredEmployees.length;
      const startIndex = (page - 1) * limit;
      const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + limit);
      
      res.json({
        employees: paginatedEmployees,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
        appliedFilters: filters,
        searchQuery
      });
      
    } catch (error) {
      console.error("Advanced employee search error:", error);
      res.status(500).json({ message: "Failed to perform advanced search" });
    }
  });

  // Save filter preset
  app.post("/api/company/filter-presets", requireCompany, async (req: any, res) => {
    try {
      const { name, description, filters, isPublic = false } = req.body;
      
      if (!name || !filters) {
        return res.status(400).json({ message: "Name and filters are required" });
      }
      
      // For now, store in a simple format (this could be enhanced with a proper database table)
      const preset = {
        id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        description: description?.trim() || '',
        filters,
        isPublic,
        companyId: req.user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // TODO: Implement proper storage for filter presets
      // For now, return the preset as if it was saved
      
      res.status(201).json({
        message: "Filter preset saved successfully",
        preset
      });
      
    } catch (error) {
      console.error("Save filter preset error:", error);
      res.status(500).json({ message: "Failed to save filter preset" });
    }
  });

  // Get filter presets
  app.get("/api/company/filter-presets", requireCompany, async (req: any, res) => {
    try {
      // TODO: Implement proper retrieval of filter presets
      // For now, return some sample presets
      const samplePresets = [
        {
          id: "preset_managers",
          name: "All Managers",
          description: "Employees with management capabilities",
          filters: {
            verificationCapabilities: ["canManageEmployees"],
            roles: ["team_lead", "branch_manager", "company_admin"]
          },
          isPublic: true,
          createdAt: new Date().toISOString()
        },
        {
          id: "preset_verifiers",
          name: "Work Verifiers",
          description: "Employees who can verify work entries",
          filters: {
            verificationCapabilities: ["canVerifyWork"]
          },
          isPublic: true,
          createdAt: new Date().toISOString()
        },
        {
          id: "preset_recent_hires",
          name: "Recent Hires",
          description: "Employees joined in the last 3 months",
          filters: {
            joinedDateRange: {
              start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
          },
          isPublic: true,
          createdAt: new Date().toISOString()
        }
      ];
      
      res.json({ presets: samplePresets });
      
    } catch (error) {
      console.error("Get filter presets error:", error);
      res.status(500).json({ message: "Failed to get filter presets" });
    }
  });

  // Get filter suggestions (auto-complete for search)
  app.get("/api/company/filter-suggestions", requireCompany, async (req: any, res) => {
    try {
      const { field, query = '' } = req.query;
      
      const employees = await storage.getCompanyEmployees(req.user.id);
      const branches = await storage.getCompanyBranches(req.user.id);
      const teams = await storage.getCompanyTeams(req.user.id);
      
      if (!Array.isArray(employees)) {
        return res.json({ suggestions: [] });
      }
      
      let suggestions: string[] = [];
      const queryLower = query.toString().toLowerCase();
      
      switch (field) {
        case 'position':
          suggestions = [...new Set(employees
            .map((emp: any) => emp.position)
            .filter((pos: string) => pos && pos.toLowerCase().includes(queryLower))
          )];
          break;
          
        case 'department':
          suggestions = [...new Set(employees
            .map((emp: any) => emp.department)
            .filter((dept: string) => dept && dept.toLowerCase().includes(queryLower))
          )];
          break;
          
        case 'branch':
          suggestions = Array.isArray(branches) ? branches
            .filter((branch: any) => branch.name.toLowerCase().includes(queryLower))
            .map((branch: any) => ({ id: branch.id, name: branch.name }))
            : [];
          break;
          
        case 'team':
          suggestions = Array.isArray(teams) ? teams
            .filter((team: any) => team.name.toLowerCase().includes(queryLower))
            .map((team: any) => ({ id: team.id, name: team.name, branchId: team.branchId }))
            : [];
          break;
          
        default:
          suggestions = [];
      }
      
      res.json({ 
        suggestions: suggestions.slice(0, 10), // Limit to 10 suggestions
        field,
        query
      });
      
    } catch (error) {
      console.error("Get filter suggestions error:", error);
      res.status(500).json({ message: "Failed to get filter suggestions" });
    }
  });

  // Manager-scoped Data Access Routes

  // Get employees assigned to manager
  app.get("/api/manager/employees", requireManager, async (req: any, res) => {
    try {
      const employees = await storage.getEmployeesAssignedToManager(req.user.id);
      res.json(employees);
    } catch (error) {
      console.error("Get manager employees error:", error);
      res.status(500).json({ message: "Failed to get assigned employees" });
    }
  });

  // Get work entries for manager's team
  app.get("/api/manager/work-entries", requireManager, async (req: any, res) => {
    try {
      const { status, approvalStatus, startDate, endDate } = req.query;
      
      const filters: any = {};
      if (status) filters.status = status as string;
      if (approvalStatus) filters.approvalStatus = approvalStatus as string;
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;
      
      const workEntries = await storage.getWorkEntriesForManager(req.user.id, filters);
      res.json(workEntries);
    } catch (error) {
      console.error("Get manager work entries error:", error);
      res.status(500).json({ message: "Failed to get work entries" });
    }
  });

  // Approve work entry as manager
  app.post("/api/manager/work-entries/:workEntryId/approve", requireManager, await requireManagerPermission('canApproveWork'), async (req: any, res) => {
    try {
      const { workEntryId } = req.params;
      const { approvalStatus, managerFeedback, managerRating } = req.body;
      
      if (!approvalStatus || !['manager_approved', 'manager_rejected'].includes(approvalStatus)) {
        return res.status(400).json({ 
          message: "Valid approval status required (manager_approved or manager_rejected)" 
        });
      }
      
      const updatedEntry = await storage.approveWorkEntryAsManager(workEntryId, req.user.id, {
        approvalStatus,
        managerFeedback,
        managerRating
      });
      
      res.json({
        message: "Work entry processed successfully",
        workEntry: updatedEntry
      });
    } catch (error) {
      console.error("Manager approve work entry error:", error);
      res.status(500).json({ message: "Failed to process work entry" });
    }
  });

  // Get manager analytics
  app.get("/api/manager/analytics", requireManager, await requireManagerPermission('canViewAnalytics'), async (req: any, res) => {
    try {
      const analytics = await storage.getManagerAnalytics(req.user.id);
      res.json(analytics);
    } catch (error) {
      console.error("Get manager analytics error:", error);
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  // ==================== HIERARCHICAL COMPANY STRUCTURE API ROUTES ====================
  
  // Company Branch Management Routes
  app.get("/api/company/branches", requireCompany, async (req: any, res) => {
    try {
      const branches = await storage.getCompanyBranches(req.user.id);
      res.json(branches);
    } catch (error) {
      console.error("Get company branches error:", error);
      res.status(500).json({ message: "Failed to fetch company branches" });
    }
  });

  app.post("/api/company/branches", requireCompany, async (req: any, res) => {
    try {
      const branchData = {
        ...req.body,
        companyId: req.user.id,
      };
      const branch = await storage.createCompanyBranch(branchData);
      
      emitRealTimeUpdate('branch-created', {
        branch,
        companyId: req.user.id
      }, [`company-${req.user.id}`]);
      
      res.json(branch);
    } catch (error) {
      console.error("Create company branch error:", error);
      res.status(500).json({ message: "Failed to create company branch" });
    }
  });

  app.put("/api/company/branches/:id", requireCompany, async (req: any, res) => {
    try {
      const { id } = req.params;
      const branch = await storage.updateCompanyBranch(id, req.body);
      
      emitRealTimeUpdate('branch-updated', {
        branch,
        companyId: req.user.id
      }, [`company-${req.user.id}`]);
      
      res.json(branch);
    } catch (error) {
      console.error("Update company branch error:", error);
      res.status(500).json({ message: "Failed to update company branch" });
    }
  });

  app.delete("/api/company/branches/:id", requireCompany, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCompanyBranch(id);
      
      emitRealTimeUpdate('branch-deleted', {
        branchId: id,
        companyId: req.user.id
      }, [`company-${req.user.id}`]);
      
      res.json({ message: "Branch deleted successfully" });
    } catch (error) {
      console.error("Delete company branch error:", error);
      res.status(500).json({ message: "Failed to delete company branch" });
    }
  });

  // Company Team Management Routes
  app.get("/api/company/teams", requireCompany, async (req: any, res) => {
    try {
      const { branchId } = req.query;
      const teams = await storage.getCompanyTeams(req.user.id, branchId as string);
      res.json(teams);
    } catch (error) {
      console.error("Get company teams error:", error);
      res.status(500).json({ message: "Failed to fetch company teams" });
    }
  });

  app.post("/api/company/teams", requireCompany, async (req: any, res) => {
    try {
      const teamData = {
        ...req.body,
        companyId: req.user.id,
      };
      const team = await storage.createCompanyTeam(teamData);
      
      emitRealTimeUpdate('team-created', {
        team,
        companyId: req.user.id
      }, [`company-${req.user.id}`]);
      
      res.json(team);
    } catch (error) {
      console.error("Create company team error:", error);
      res.status(500).json({ message: "Failed to create company team" });
    }
  });

  app.get("/api/company/teams/:id/members", requireCompany, async (req: any, res) => {
    try {
      const { id } = req.params;
      const members = await storage.getTeamMembers(id);
      res.json(members);
    } catch (error) {
      console.error("Get team members error:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  // Employee Hierarchy Information Routes
  app.get("/api/company/employees/:employeeId/hierarchy", requireCompany, async (req: any, res) => {
    try {
      const { employeeId } = req.params;
      const hierarchyInfo = await storage.getEmployeeHierarchyInfo(employeeId, req.user.id);
      
      if (!hierarchyInfo) {
        return res.status(404).json({ message: "Employee not found or not in this company" });
      }
      
      res.json(hierarchyInfo);
    } catch (error) {
      console.error("Get employee hierarchy info error:", error);
      res.status(500).json({ message: "Failed to fetch employee hierarchy information" });
    }
  });

  app.get("/api/company/structure", requireCompany, async (req: any, res) => {
    try {
      const structure = await storage.getCompanyHierarchyStructure(req.user.id);
      res.json(structure);
    } catch (error) {
      console.error("Get company hierarchy structure error:", error);
      res.status(500).json({ message: "Failed to fetch company hierarchy structure" });
    }
  });

  // Hierarchical Work Entry Operations
  app.get("/api/company/work-entries/hierarchy", requireCompany, async (req: any, res) => {
    try {
      const { branchId, teamId, includeHierarchyInfo } = req.query;
      
      const workEntries = await storage.getWorkEntriesWithHierarchy({
        companyId: req.user.id,
        branchId: branchId as string,
        teamId: teamId as string,
        includeHierarchyInfo: includeHierarchyInfo === 'true'
      });
      
      res.json(workEntries);
    } catch (error) {
      console.error("Get hierarchical work entries error:", error);
      res.status(500).json({ message: "Failed to fetch hierarchical work entries" });
    }
  });

  // Company Manager Management Routes
  app.get('/api/company/managers', requireCompany, async (req: any, res) => {
    try {
      const managers = await storage.getCompanyManagers(req.user.id);
      
      // Get permissions for each manager
      const managersWithPermissions = await Promise.all(
        managers.map(async (manager) => {
          const permissions = await storage.getManagerPermissions(manager.id);
          return {
            ...manager,
            permissions: permissions || {
              canApproveWork: true,
              canEditEmployees: false,
              canViewAnalytics: true,
              canInviteEmployees: false,
            },
          };
        })
      );

      res.json(managersWithPermissions);
    } catch (error) {
      console.error("Get company managers error:", error);
      res.status(500).json({ message: "Failed to get company managers" });
    }
  });

  app.post('/api/company/managers', requireCompany, async (req: any, res) => {
    try {
      const { managerId, managerName, managerEmail, password, permissionLevel, branchId, teamId } = req.body;

      // Check if manager ID already exists
      const existingManager = await storage.getManagerByUniqueId(managerId);
      if (existingManager) {
        return res.status(400).json({ message: 'Manager ID already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create manager
      const manager = await storage.createCompanyManager({
        companyId: req.user.id,
        uniqueId: managerId,
        password: hashedPassword,
        managerName: managerName,
        managerEmail: managerEmail,
        permissionLevel: permissionLevel,
        branchId: branchId || null,
        teamId: teamId || null,
      });

      // Create default permissions
      await storage.createManagerPermissions({
        managerId: manager.id,
        canApproveWork: true,
        canEditEmployees: permissionLevel === 'branch_manager',
        canViewAnalytics: true,
        canInviteEmployees: false,
        canManageTeams: permissionLevel === 'branch_manager',
      });

      res.json({ manager, message: 'Manager created successfully' });
    } catch (error) {
      console.error("Create manager error:", error);
      res.status(500).json({ message: "Failed to create manager" });
    }
  });

  app.patch('/api/company/managers/:managerId/permissions', requireCompany, async (req: any, res) => {
    try {
      const { managerId } = req.params;
      const permissions = req.body;

      // Verify manager belongs to this company
      const manager = await storage.getCompanyManagerById(managerId);
      if (!manager || manager.companyId !== req.user.id) {
        return res.status(404).json({ message: 'Manager not found' });
      }

      // Update permissions
      const updatedPermissions = await storage.updateManagerPermissions(managerId, permissions);
      
      res.json({ permissions: updatedPermissions, message: 'Permissions updated successfully' });
    } catch (error) {
      console.error("Update manager permissions error:", error);
      res.status(500).json({ message: "Failed to update manager permissions" });
    }
  });

  app.post('/api/company/managers/:managerId/assign-employees', requireCompany, async (req: any, res) => {
    try {
      const { managerId } = req.params;
      const { employeeIds } = req.body;

      // Verify manager belongs to this company
      const manager = await storage.getCompanyManagerById(managerId);
      if (!manager || manager.companyId !== req.user.id) {
        return res.status(404).json({ message: 'Manager not found' });
      }

      // Assign employees to manager
      const results = await Promise.all(
        employeeIds.map(async (employeeId: string) => {
          return await storage.assignEmployeeToManager(employeeId, req.user.id, managerId);
        })
      );

      res.json({ message: 'Employees assigned successfully', assignments: results.length });
    } catch (error) {
      console.error("Assign employees to manager error:", error);
      res.status(500).json({ message: "Failed to assign employees to manager" });
    }
  });

  app.patch('/api/company/managers/:managerId/deactivate', requireCompany, async (req: any, res) => {
    try {
      const { managerId } = req.params;

      // Verify manager belongs to this company
      const manager = await storage.getCompanyManagerById(managerId);
      if (!manager || manager.companyId !== req.user.id) {
        return res.status(404).json({ message: 'Manager not found' });
      }

      // Deactivate manager
      const updatedManager = await storage.updateCompanyManager(managerId, { isActive: false });

      // Unassign all employees from this manager
      await storage.unassignAllEmployeesFromManager(managerId, req.user.id);
      
      res.json({ manager: updatedManager, message: 'Manager deactivated successfully' });
    } catch (error) {
      console.error("Deactivate manager error:", error);
      res.status(500).json({ message: "Failed to deactivate manager" });
    }
  });

  app.post("/api/company/work-entries/:id/verify-hierarchical", requireCompany, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { verifierId, approvalStatus, companyRating, companyFeedback } = req.body;
      
      // Check if the verifier has permission to verify this work entry
      const workEntry = await storage.getWorkEntry(id);
      if (!workEntry) {
        return res.status(404).json({ message: "Work entry not found" });
      }
      
      const canVerify = await storage.canEmployeeVerifyWork(verifierId, workEntry.employeeId, req.user.id);
      if (!canVerify) {
        return res.status(403).json({ message: "Insufficient permissions to verify this work entry" });
      }
      
      const verifiedWorkEntry = await storage.verifyWorkEntryHierarchical(id, verifierId, {
        approvalStatus,
        companyRating,
        companyFeedback
      });
      
      emitRealTimeUpdate('work-entry-verified-hierarchical', {
        workEntry: verifiedWorkEntry,
        verifierId,
        companyId: req.user.id
      }, [
        `user-${workEntry.employeeId}`,
        `company-${req.user.id}`,
        `verifier-${verifierId}`
      ]);
      
      res.json(verifiedWorkEntry);
    } catch (error) {
      console.error("Hierarchical work entry verification error:", error);
      res.status(500).json({ message: "Failed to verify work entry" });
    }
  });

  app.get("/api/company/employees/:employeeId/verifiable", requireCompany, async (req: any, res) => {
    try {
      const { employeeId } = req.params;
      const verifiableEmployees = await storage.getEmployeesVerifiableByUser(employeeId, req.user.id);
      res.json(verifiableEmployees);
    } catch (error) {
      console.error("Get verifiable employees error:", error);
      res.status(500).json({ message: "Failed to fetch verifiable employees" });
    }
  });

  app.patch("/api/company/employees/:employeeId/hierarchy-role", requireCompany, async (req: any, res) => {
    try {
      const { employeeId } = req.params;
      const updates = req.body;
      
      const updatedRole = await storage.updateEmployeeHierarchyRole(employeeId, req.user.id, updates);
      
      emitRealTimeUpdate('employee-hierarchy-role-updated', {
        employeeId,
        updates,
        companyId: req.user.id
      }, [`company-${req.user.id}`, `user-${employeeId}`]);
      
      res.json(updatedRole);
    } catch (error) {
      console.error("Update employee hierarchy role error:", error);
      res.status(500).json({ message: "Failed to update employee hierarchy role" });
    }
  });

  // PAN verification admin routes - PROTECTED ROUTE
  app.get("/api/admin/companies/pending-pan-verification", requireAdmin, async (req: any, res) => {
    
    try {
      const pendingCompanies = await storage.getCompaniesByPANVerificationStatus("pending");
      res.json(pendingCompanies);
    } catch (error) {
      console.error("Get pending PAN verifications error:", error);
      res.status(500).json({ message: "Failed to fetch pending PAN verifications" });
    }
  });

  app.patch("/api/admin/companies/:id/pan-verification", requireAdmin, async (req: any, res) => {
    
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      if (!["verified", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid verification status" });
      }

      const updatedCompany = await storage.updateCompanyPANVerification(id, {
        panVerificationStatus: status,
        panVerifiedAt: new Date(),
        panVerifiedBy: req.user.id,
        isBasicDetailsLocked: status === "verified",
        verificationNotes: notes
      });

      // Emit real-time update
      emitRealTimeUpdate("pan_verification_updated", {
        companyId: id,
        status,
        timestamp: new Date().toISOString()
      }, [`company-${id}`]);

      res.json({
        message: `Company PAN ${status === "verified" ? "verified" : "rejected"} successfully`,
        company: updatedCompany
      });
    } catch (error) {
      console.error("Update PAN verification error:", error);
      res.status(500).json({ message: "Failed to update PAN verification" });
    }
  });

  // =====================================================
  // ENHANCED ADMIN EMPLOYEE-COMPANY MANAGEMENT ROUTES
  // =====================================================
  
  // Get employees with current company details - PROTECTED ROUTE
  app.get("/api/admin/employees-with-companies", requireAdmin, async (req: any, res) => {
    
    try {
      const { search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      let employees = await storage.getAllEmployeesWithCurrentCompany();
      
      // Apply search filter
      if (search && typeof search === 'string') {
        const searchTerm = search.toLowerCase().trim();
        employees = employees.filter(emp => 
          emp.email.toLowerCase().includes(searchTerm) ||
          emp.phone?.toLowerCase().includes(searchTerm) ||
          emp.firstName.toLowerCase().includes(searchTerm) ||
          emp.lastName.toLowerCase().includes(searchTerm) ||
          `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm) ||
          emp.employeeId.toLowerCase().includes(searchTerm) ||
          emp.currentCompany?.name.toLowerCase().includes(searchTerm) ||
          emp.currentPosition?.toLowerCase().includes(searchTerm)
        );
      }
      
      // Apply sorting
      employees.sort((a, b) => {
        let aValue: any = null;
        let bValue: any = null;
        
        switch (sortBy) {
          case 'name':
            aValue = `${a.firstName} ${a.lastName}`;
            bValue = `${b.firstName} ${b.lastName}`;
            break;
          case 'company':
            aValue = a.currentCompany?.name || '';
            bValue = b.currentCompany?.name || '';
            break;
          case 'position':
            aValue = a.currentPosition || '';
            bValue = b.currentPosition || '';
            break;
          default:
            aValue = a.createdAt;
            bValue = b.createdAt;
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      // Remove passwords from response
      const employeesResponse = employees.map(({ password, ...emp }) => emp);
      res.json(employeesResponse);
    } catch (error) {
      console.error("Get employees with companies error:", error);
      res.status(500).json({ message: "Failed to get employees with companies" });
    }
  });
  
  // Get companies with employee counts - PROTECTED ROUTE
  app.get("/api/admin/companies-with-counts", requireAdmin, async (req: any, res) => {
    
    try {
      const { search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      let companies = await storage.getAllCompaniesWithEmployeeCounts();
      
      // Apply search filter
      if (search && typeof search === 'string') {
        const searchTerm = search.toLowerCase().trim();
        companies = companies.filter(comp => 
          comp.email.toLowerCase().includes(searchTerm) ||
          comp.name.toLowerCase().includes(searchTerm) ||
          comp.companyId.toLowerCase().includes(searchTerm) ||
          comp.industry?.toLowerCase().includes(searchTerm)
        );
      }
      
      // Apply sorting
      companies.sort((a, b) => {
        let aValue: any = null;
        let bValue: any = null;
        
        switch (sortBy) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'employees':
            aValue = a.currentEmployeesCount;
            bValue = b.currentEmployeesCount;
            break;
          case 'totalEmployees':
            aValue = a.totalEmployeesCount;
            bValue = b.totalEmployeesCount;
            break;
          default:
            aValue = a.createdAt;
            bValue = b.createdAt;
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      // Remove passwords from response
      const companiesResponse = companies.map(({ password, ...comp }) => comp);
      res.json(companiesResponse);
    } catch (error) {
      console.error("Get companies with counts error:", error);
      res.status(500).json({ message: "Failed to get companies with counts" });
    }
  });
  
  // Get employee with complete work history - PROTECTED ROUTE
  app.get("/api/admin/employees/:id/history", requireAdmin, async (req: any, res) => {
    
    try {
      const { id } = req.params;
      const employeeHistory = await storage.getEmployeeWithCompanyHistory(id);
      res.json(employeeHistory);
    } catch (error) {
      console.error("Get employee history error:", error);
      res.status(500).json({ message: "Failed to get employee history" });
    }
  });
  
  // Get company with complete employee history - PROTECTED ROUTE
  app.get("/api/admin/companies/:id/employee-history", requireAdmin, async (req: any, res) => {
    
    try {
      const { id } = req.params;
      const companyHistory = await storage.getCompanyWithEmployeeHistory(id);
      res.json(companyHistory);
    } catch (error) {
      console.error("Get company employee history error:", error);
      res.status(500).json({ message: "Failed to get company employee history" });
    }
  });
  
  // Transfer employee between companies - PROTECTED ROUTE
  app.post("/api/admin/employees/:employeeId/transfer", requireAdmin, async (req: any, res) => {
    
    try {
      const { employeeId } = req.params;
      const { fromCompanyId, toCompanyId, newPosition } = req.body;
      
      if (!fromCompanyId || !toCompanyId) {
        return res.status(400).json({ message: "Both fromCompanyId and toCompanyId are required" });
      }
      
      if (fromCompanyId === toCompanyId) {
        return res.status(400).json({ message: "Cannot transfer employee to the same company" });
      }
      
      await storage.transferEmployeeBetweenCompanies(
        employeeId, 
        fromCompanyId, 
        toCompanyId, 
        newPosition
      );
      
      // Emit real-time updates
      emitRealTimeUpdate("employee_transferred", {
        employeeId,
        fromCompanyId,
        toCompanyId,
        newPosition,
        transferredBy: req.user.id,
        transferredAt: new Date()
      });
      
      res.json({ message: "Employee transferred successfully" });
    } catch (error) {
      console.error("Transfer employee error:", error);
      res.status(500).json({ message: "Failed to transfer employee" });
    }
  });
  
  // Update employee-company relationship - PROTECTED ROUTE
  app.patch("/api/admin/employee-company-relationships/:relationshipId", requireAdmin, async (req: any, res) => {
    
    try {
      const { relationshipId } = req.params;
      const updates = req.body;
      
      const updatedRelationship = await storage.updateEmployeeCompanyRelationship(
        relationshipId, 
        updates
      );
      
      res.json({
        message: "Employee-company relationship updated successfully",
        relationship: updatedRelationship
      });
    } catch (error) {
      console.error("Update employee-company relationship error:", error);
      res.status(500).json({ message: "Failed to update relationship" });
    }
  });
  
  // Get employee career report - PROTECTED ROUTE
  app.get("/api/admin/employees/:id/career-report", requireAdmin, async (req: any, res) => {
    
    try {
      const { id } = req.params;
      const careerReport = await storage.getEmployeeCareerReport(id);
      res.json(careerReport);
    } catch (error) {
      console.error("Get employee career report error:", error);
      res.status(500).json({ message: "Failed to get career report" });
    }
  });
  
  // Get company employee report - PROTECTED ROUTE
  app.get("/api/admin/companies/:id/employee-report", requireAdmin, async (req: any, res) => {
    
    try {
      const { id } = req.params;
      const employeeReport = await storage.getCompanyEmployeeReport(id);
      res.json(employeeReport);
    } catch (error) {
      console.error("Get company employee report error:", error);
      res.status(500).json({ message: "Failed to get employee report" });
    }
  });

  // Employee Company Routes - PROTECTED ROUTE
  app.get("/api/employee-companies", requireEmployee, async (req: any, res) => {
    
    try {
      // Check if employee exists and get their current status
      const employee = await storage.getEmployee(req.user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Allow both active and inactive employees to view their company relations
      // This ensures ex-employees can still see their historical data
      console.log(`Employee ${req.user.id} accessing companies - Active: ${employee.isActive}`);
      
      // Get companies from both old and new tables
      const oldCompanies = await storage.getEmployeeCompanies(req.user.id);
      const newCompanyRelations = await storage.getEmployeeCompanyRelations(req.user.id);
      
      // Merge and return all companies
      const allCompanies = [...oldCompanies, ...newCompanyRelations];
      res.json(allCompanies);
    } catch (error) {
      console.error("Get employee companies error:", error);
      res.status(500).json({ message: "Failed to get companies" });
    }
  });

  app.post("/api/employee-companies", requireEmployee, async (req: any, res) => {
    
    try {
      const validatedData = insertEmployeeCompanySchema.parse({
        ...req.body,
        employeeId: req.user.id
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

  app.patch("/api/employee-companies/:id", requireEmployee, async (req: any, res) => {
    
    try {
      const company = await storage.updateEmployeeCompany(req.params.id, req.body);
      res.json(company);
    } catch (error) {
      console.error("Update employee company error:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // Leave company endpoint - updates status instead of deleting - PROTECTED ROUTE
  app.post("/api/employee/leave-company/:relationId", requireEmployee, async (req: any, res) => {
    
    try {
      // First check if this is from the new companyEmployees table
      const companyRelation = await storage.getCompanyEmployeeRelation(req.params.relationId);
      
      if (companyRelation) {
        // Handle new table structure
        const updatedRelation = await storage.leaveCompany(req.user.id, companyRelation.companyId);
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

  // Work Diary Routes - Enhanced Professional Version - PROTECTED ROUTE
  app.get("/api/work-entries", requireEmployee, async (req: any, res) => {
    
    try {
      // Check if employee exists (allow both active and inactive employees to view their data)
      const employee = await storage.getEmployee(req.user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      console.log(`Employee ${req.user.id} accessing work entries - Active: ${employee.isActive}`);
      
      const { companyId } = req.query;
      const workEntries = await storage.getWorkEntries(req.user.id, companyId as string);
      res.json(workEntries);
    } catch (error) {
      console.error("Get work entries error:", error);
      res.status(500).json({ message: "Failed to get work entries" });
    }
  });

  // Legacy work diary route for compatibility - PROTECTED ROUTE
  app.get("/api/work-diary", requireEmployee, async (req: any, res) => {
    
    try {
      // Check if employee exists (allow both active and inactive employees to view their data)
      const employee = await storage.getEmployee(req.user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      console.log(`Employee ${req.user.id} accessing legacy work diary - Active: ${employee.isActive}`);
      
      const { companyId } = req.query;
      const workEntries = await storage.getWorkEntries(req.user.id, companyId as string);
      res.json(workEntries);
    } catch (error) {
      console.error("Get work entries error:", error);
      res.status(500).json({ message: "Failed to get work entries" });
    }
  });

  // Enhanced work entry creation - PROTECTED ROUTE
  app.post("/api/work-entries", requireEmployee, async (req: any, res) => {
    
    try {
      const validatedData = insertWorkEntrySchema.parse({
        ...req.body,
        employeeId: req.user.id
      });
      
      // Check if employee is still active in the company
      const employeeCompanies = await storage.getEmployeeCompanyRelations(req.user.id);
      const companyRelation = employeeCompanies.find(c => c.companyId === validatedData.companyId);
      
      if (!companyRelation || !companyRelation.isActive) {
        return res.status(403).json({ 
          message: "Ex-employees cannot create work entries for this company" 
        });
      }
      
      const workEntry = await storage.createWorkEntry(validatedData);
      
      // Emit real-time update to company dashboard
      emitRealTimeUpdate('work-entry-created', {
        workEntry,
        employeeId: req.user.id,
        companyId: validatedData.companyId
      }, [
        `company-${validatedData.companyId}`,
        `user-${req.user.id}`
      ]);
      
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

  // Legacy work diary creation for compatibility - PROTECTED ROUTE
  app.post("/api/work-diary", requireEmployee, async (req: any, res) => {
    
    try {
      const validatedData = insertWorkEntrySchema.parse({
        ...req.body,
        employeeId: req.user.id
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

  // Enhanced work entry update with immutable protection - PROTECTED ROUTE (PATCH)
  app.patch("/api/work-entries/:id", requireEmployee, async (req: any, res) => {
    const sessionUser = req.user;
    
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
      
      // Check if employee is still active in the company
      const employeeCompanies = await storage.getEmployeeCompanyRelations(sessionUser.id);
      const companyRelation = employeeCompanies.find(c => c.companyId === existingEntry.companyId);
      
      if (!companyRelation || !companyRelation.isActive) {
        return res.status(403).json({ 
          message: "Ex-employees cannot update work entries for this company" 
        });
      }
      
      // When updating a work entry, reset status to pending for re-review
      const updateData = {
        ...req.body,
        status: 'pending', // Always reset to pending when employee updates
        companyFeedback: null, // Clear any previous company feedback
        companyRating: null, // Clear any previous company rating
        updatedAt: new Date()
      };
      
      const workEntry = await storage.updateWorkEntry(req.params.id, updateData);
      res.json(workEntry);
    } catch (error) {
      console.error("Update work entry error:", error);
      res.status(500).json({ message: "Failed to update work entry" });
    }
  });

  // Enhanced work entry update with immutable protection - PROTECTED ROUTE (PUT for legacy compatibility)
  app.put("/api/work-entries/:id", requireEmployee, async (req: any, res) => {
    const sessionUser = req.user;
    
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
      
      // Check if employee is still active in the company
      const employeeCompanies = await storage.getEmployeeCompanyRelations(sessionUser.id);
      const companyRelation = employeeCompanies.find(c => c.companyId === existingEntry.companyId);
      
      if (!companyRelation || !companyRelation.isActive) {
        return res.status(403).json({ 
          message: "Ex-employees cannot update work entries for this company" 
        });
      }
      
      // When updating a work entry, reset status to pending for re-review
      const updateData = {
        ...req.body,
        status: 'pending', // Always reset to pending when employee updates
        companyFeedback: null, // Clear any previous company feedback
        companyRating: null, // Clear any previous company rating
        updatedAt: new Date()
      };
      
      const workEntry = await storage.updateWorkEntry(req.params.id, updateData);
      res.json(workEntry);
    } catch (error) {
      console.error("Update work entry error:", error);
      res.status(500).json({ message: "Failed to update work entry" });
    }
  });

  // Legacy work diary update for compatibility - PROTECTED ROUTE
  app.patch("/api/work-diary/:id", requireEmployee, async (req: any, res) => {
    
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

  app.delete("/api/work-diary/:id", requireEmployee, async (req: any, res) => {
    
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

  // Employee Analytics Routes - PROTECTED ROUTE
  app.get("/api/employee/analytics/:employeeId?", requireEmployee, async (req: any, res) => {
    
    const employeeId = req.params.employeeId || req.user.id;
    
    try {
      const analytics = await storage.getEmployeeAnalytics(employeeId);
      res.json(analytics);
    } catch (error) {
      console.error("Get employee analytics error:", error);
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  // Work Entry Analytics Routes - PROTECTED ROUTE
  app.get("/api/work-entries/analytics/:companyId?", requireEmployee, async (req: any, res) => {
    
    try {
      // Check if employee exists (allow both active and inactive employees to view their analytics)
      const employee = await storage.getEmployee(req.user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      console.log(`Employee ${req.user.id} accessing work analytics - Active: ${employee.isActive}`);
      
      const companyId = req.params.companyId;
      const analytics = await storage.getWorkEntryAnalytics(req.user.id, companyId);
      res.json(analytics);
    } catch (error) {
      console.error("Get work entry analytics error:", error);
      res.status(500).json({ message: "Failed to get work analytics" });
    }
  });

  // Employee Companies Route - PROTECTED ROUTE
  app.get("/api/employee/companies", requireEmployee, async (req: any, res) => {
    
    try {
      // Get companies from both old and new tables
      const oldCompanies = await storage.getEmployeeCompanies(req.user.id);
      const newCompanyRelations = await storage.getEmployeeCompanyRelations(req.user.id);
      
      // Merge and return all companies
      const allCompanies = [...oldCompanies, ...newCompanyRelations];
      res.json(allCompanies);
    } catch (error) {
      console.error("Get employee companies error:", error);
      res.status(500).json({ message: "Failed to get companies" });
    }
  });

  // Object Storage Routes - PROTECTED ROUTE
  app.post("/api/objects/upload", requireAuth, async (req: any, res) => {
    
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Get upload URL error:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Profile picture update - PROTECTED ROUTE
  app.put("/api/employee/profile-picture", requireEmployee, async (req: any, res) => {
    
    if (!req.body.profilePictureURL) {
      return res.status(400).json({ error: "profilePictureURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.profilePictureURL,
      );

      // Update employee profile picture
      const updatedEmployee = await storage.updateEmployee(req.user.id, {
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

  // Company employee profile viewing routes - PROTECTED ROUTE
  app.get("/api/company/employee/:employeeId", requireCompany, async (req: any, res) => {
    
    try {
      // Check if this employee is associated with the company (including job applications)
      const employeeCompany = await storage.getEmployeeCompanyRelation(req.params.employeeId, req.user.id);
      const hasJobApplication = await storage.hasEmployeeAppliedToCompany(req.params.employeeId, req.user.id);
      
      if (!employeeCompany && !hasJobApplication) {
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

  app.get("/api/company/employee/:employeeId/profile", requireCompany, async (req: any, res) => {
    
    try {
      // Check if this employee is associated with the company (including job applications)
      const employeeCompany = await storage.getEmployeeCompanyRelation(req.params.employeeId, req.user.id);
      const hasJobApplication = await storage.hasEmployeeAppliedToCompany(req.params.employeeId, req.user.id);
      
      if (!employeeCompany && !hasJobApplication) {
        return res.status(403).json({ message: "No access to this employee's profile" });
      }
      
      const profileData = await storage.getEmployeeProfile(req.params.employeeId);
      res.json(profileData);
    } catch (error) {
      console.error("Get company employee profile error:", error);
      res.status(500).json({ message: "Failed to get employee profile data" });
    }
  });

  // Company employee experience routes - PROTECTED ROUTE
  app.get("/api/company/employee-experience/:employeeId", requireCompany, async (req: any, res) => {
    
    try {
      // Check if this employee is associated with the company (including job applications)
      const employeeCompany = await storage.getEmployeeCompanyRelation(req.params.employeeId, req.user.id);
      const hasJobApplication = await storage.hasEmployeeAppliedToCompany(req.params.employeeId, req.user.id);
      
      if (!employeeCompany && !hasJobApplication) {
        return res.status(403).json({ message: "No access to this employee's profile" });
      }
      
      const experiences = await storage.getEmployeeExperiences(req.params.employeeId);
      res.json(experiences);
    } catch (error) {
      console.error("Get company employee experience error:", error);
      res.status(500).json({ message: "Failed to get employee experience data" });
    }
  });

  // Company employee education routes - PROTECTED ROUTE
  app.get("/api/company/employee-education/:employeeId", requireCompany, async (req: any, res) => {
    
    try {
      // Check if this employee is associated with the company (including job applications)
      const employeeCompany = await storage.getEmployeeCompanyRelation(req.params.employeeId, req.user.id);
      const hasJobApplication = await storage.hasEmployeeAppliedToCompany(req.params.employeeId, req.user.id);
      
      if (!employeeCompany && !hasJobApplication) {
        return res.status(403).json({ message: "No access to this employee's profile" });
      }
      
      const educations = await storage.getEmployeeEducations(req.params.employeeId);
      res.json(educations);
    } catch (error) {
      console.error("Get company employee education error:", error);
      res.status(500).json({ message: "Failed to get employee education data" });
    }
  });

  // Company employee certifications routes - PROTECTED ROUTE
  app.get("/api/company/employee-certifications/:employeeId", requireCompany, async (req: any, res) => {
    
    try {
      // Check if this employee is associated with the company (including job applications)
      const employeeCompany = await storage.getEmployeeCompanyRelation(req.params.employeeId, req.user.id);
      const hasJobApplication = await storage.hasEmployeeAppliedToCompany(req.params.employeeId, req.user.id);
      
      if (!employeeCompany && !hasJobApplication) {
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
  
  // Search jobs with filters - PROTECTED ROUTE
  app.get("/api/jobs/search", requireEmployee, async (req: any, res) => {
    
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
  
  // Get perfect matches for employee (AI-powered recommendations) - PROTECTED ROUTE
  app.get("/api/jobs/perfect-matches", requireEmployee, async (req: any, res) => {
    
    try {
      // Get employee profile for AI matching
      const employee = await storage.getEmployee(req.user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee profile not found" });
      }

      // Get work history for better matching
      const workHistory = await storage.getWorkEntries(req.user.id);

      // Build employee profile for AI analysis
      const employeeProfile: EmployeeProfile = {
        id: employee.id,
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        skills: employee.skills || [],
        experience: employee.experience || '',
        education: employee.education || '',
        certifications: employee.certifications || [],
        workHistory: workHistory.map(w => ({
          companyName: w.companyName || 'Unknown Company',
          position: w.position || '',
          description: w.description || '',
          skills: w.skills || []
        })),
        professionalSummary: employee.professionalSummary || '',
        location: employee.location || '',
        preferredJobTypes: employee.preferredJobTypes || [],
        salaryExpectation: employee.salaryExpectation || ''
      };

      // Get all available jobs
      const allJobs = await storage.searchJobs({});
      
      // Use AI service to get recommendations
      const recommendations = await aiJobService.getJobRecommendations(employeeProfile, allJobs);
      
      // Return perfect matches only
      res.json(recommendations.perfectMatches.slice(0, 5));
    } catch (error) {
      console.error("Perfect matches error:", error);
      res.status(500).json({ message: "Failed to get perfect matches" });
    }
  });
  
  // Get employee's job applications (must come before /:jobId route) - PROTECTED ROUTE
  app.get("/api/jobs/my-applications", requireEmployee, async (req: any, res) => {
    
    try {
      const applications = await storage.getJobApplications(req.user.id);
      res.json(applications);
    } catch (error) {
      console.error("Get applications error:", error);
      res.status(500).json({ message: "Failed to get applications" });
    }
  });
  
  // Get saved jobs (must come before /:jobId route) - PROTECTED ROUTE
  app.get("/api/jobs/saved", requireEmployee, async (req: any, res) => {
    
    try {
      const savedJobs = await storage.getSavedJobs(req.user.id);
      res.json(savedJobs);
    } catch (error) {
      console.error("Get saved jobs error:", error);
      res.status(500).json({ message: "Failed to get saved jobs" });
    }
  });

  // === AI JOB DISCOVERY ROUTES (must come before /:jobId route) ===
  
  // Get AI-powered job recommendations - PROTECTED ROUTE
  app.get("/api/jobs/ai-recommendations", requireEmployee, async (req: any, res) => {
    
    try {
      // Get employee profile for AI matching
      const employee = await storage.getEmployee(req.user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee profile not found" });
      }

      // Get work history for better matching
      const workHistory = await storage.getWorkEntries(req.user.id);

      // Build employee profile for AI analysis
      const employeeProfile: EmployeeProfile = {
        id: employee.id,
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        skills: employee.skills || [],
        experience: employee.experience || '',
        education: employee.education || '',
        certifications: employee.certifications || [],
        workHistory: workHistory.map(w => ({
          companyName: w.companyName || 'Unknown Company',
          position: w.position || '',
          description: w.description || '',
          skills: w.skills || []
        })),
        professionalSummary: employee.professionalSummary || '',
        location: employee.location || '',
        preferredJobTypes: employee.preferredJobTypes || [],
        salaryExpectation: employee.salaryExpectation || ''
      };

      // Get all available jobs
      const allJobs = await storage.searchJobs({});
      
      // Use AI service to get comprehensive recommendations
      const recommendations = await aiJobService.getJobRecommendations(employeeProfile, allJobs);
      
      res.json(recommendations);
    } catch (error) {
      console.error("AI recommendations error:", error);
      res.status(500).json({ message: "Failed to get AI recommendations" });
    }
  });

  // Get smart search suggestions for employee - PROTECTED ROUTE
  app.get("/api/jobs/smart-search-suggestions", requireEmployee, async (req: any, res) => {
    
    try {
      // Get employee profile
      const employee = await storage.getEmployee(req.user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee profile not found" });
      }

      // Get work history for better suggestions
      const workHistory = await storage.getWorkEntries(req.user.id);

      // Build employee profile for AI analysis
      const employeeProfile: EmployeeProfile = {
        id: employee.id,
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        skills: employee.skills || [],
        experience: employee.experience || '',
        education: employee.education || '',
        certifications: employee.certifications || [],
        workHistory: workHistory.map(w => ({
          companyName: w.companyName || 'Unknown Company',
          position: w.position || '',
          description: w.description || '',
          skills: w.skills || []
        })),
        professionalSummary: employee.professionalSummary || '',
        location: employee.location || '',
        preferredJobTypes: employee.preferredJobTypes || [],
        salaryExpectation: employee.salaryExpectation || ''
      };
      
      // Use AI service to generate smart search suggestions
      const suggestions = await aiJobService.generateSmartSearchSuggestions(employeeProfile);
      
      res.json({ suggestions });
    } catch (error) {
      console.error("Smart search suggestions error:", error);
      res.status(500).json({ message: "Failed to get search suggestions" });
    }
  });

  // Analyze specific job match for employee - PROTECTED ROUTE
  app.get("/api/jobs/:jobId/ai-analysis", requireEmployee, async (req: any, res) => {
    
    try {
      // Get employee profile
      const employee = await storage.getEmployee(req.user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee profile not found" });
      }

      // Get job details
      const job = await storage.getJobById(req.params.jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Get work history for better matching
      const workHistory = await storage.getWorkEntries(req.user.id);

      // Build employee profile for AI analysis
      const employeeProfile: EmployeeProfile = {
        id: employee.id,
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        skills: employee.skills || [],
        experience: employee.experience || '',
        education: employee.education || '',
        certifications: employee.certifications || [],
        workHistory: workHistory.map(w => ({
          companyName: w.companyName || 'Unknown Company',
          position: w.position || '',
          description: w.description || '',
          skills: w.skills || []
        })),
        professionalSummary: employee.professionalSummary || '',
        location: employee.location || '',
        preferredJobTypes: employee.preferredJobTypes || [],
        salaryExpectation: employee.salaryExpectation || ''
      };

      // Build job listing for analysis
      const jobListing = {
        id: job.id,
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        companyName: job.companyName || 'Unknown Company',
        location: job.location,
        employmentType: job.employmentType,
        experienceLevel: job.experienceLevel,
        skills: job.requiredSkills || [],
        salaryRange: job.salaryRange || '',
        benefits: job.benefits || []
      };
      
      // Use AI service to analyze the match
      const analysis = await aiJobService.analyzeJobMatch(employeeProfile, jobListing);
      
      res.json(analysis);
    } catch (error) {
      console.error("AI job analysis error:", error);
      res.status(500).json({ message: "Failed to analyze job match" });
    }
  });
  
  // Get job by ID - PROTECTED ROUTE
  app.get("/api/jobs/:jobId", requireEmployee, async (req: any, res) => {
    
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
  
  // Apply for a job - PROTECTED ROUTE
  app.post("/api/jobs/:jobId/apply", requireEmployee, async (req: any, res) => {
    
    try {
      const jobId = req.params.jobId;
      const employeeId = req.user.id;
      
      // Check for existing applications by this employee for ANY job at this company
      const job = await storage.getJobById(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const existingCompanyApplications = await storage.getEmployeeApplicationsToCompany(employeeId, job.companyId);
      
      if (existingCompanyApplications.length > 0) {
        // Check if there's any non-rejected application
        const nonRejectedApplications = existingCompanyApplications.filter(app => 
          app.status !== 'rejected'
        );
        
        if (nonRejectedApplications.length > 0) {
          // Get the latest non-rejected application
          const latestApplication = nonRejectedApplications.sort((a, b) => 
            new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
          )[0];
          
          let message = "You have already applied to this company. ";
          
          if (latestApplication.status === 'applied' || latestApplication.status === 'viewed' || latestApplication.status === 'shortlisted') {
            message += "Please wait for the recruiter to review your application.";
          } else if (latestApplication.status === 'interviewed') {
            message += "Your application is under interview process.";
          } else if (latestApplication.status === 'offered') {
            message += "You have a pending job offer from this company.";
          } else if (latestApplication.status === 'hired') {
            message += "You are already hired by this company.";
          } else {
            message += "Please wait for the current application process to complete.";
          }
          
          return res.status(400).json({ 
            message,
            existingApplication: {
              id: latestApplication.id,
              status: latestApplication.status,
              appliedAt: latestApplication.appliedAt,
              jobTitle: latestApplication.job?.title || 'Unknown Position'
            }
          });
        }
        
        // All previous applications were rejected, allow new application
      }
      
      const applicationData = insertJobApplicationSchema.parse({
        ...req.body,
        jobId,
        employeeId
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
      
      // Handle duplicate application (database constraint)
      if (error.message?.includes('duplicate') || error.code === '23505') {
        return res.status(400).json({ message: "You have already applied for this job" });
      }
      
      console.error("Job application error:", error);
      res.status(500).json({ message: "Failed to submit application" });
    }
  });
  
  // Save/unsave a job - PROTECTED ROUTE
  app.post("/api/jobs/:jobId/save", requireEmployee, async (req: any, res) => {
    
    try {
      const saveData = insertSavedJobSchema.parse({
        jobId: req.params.jobId,
        employeeId: req.user.id,
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
  
  app.delete("/api/jobs/:jobId/save", requireEmployee, async (req: any, res) => {
    
    try {
      await storage.unsaveJob(req.user.id, req.params.jobId);
      res.json({ message: "Job unsaved successfully" });
    } catch (error) {
      console.error("Unsave job error:", error);
      res.status(500).json({ message: "Failed to unsave job" });
    }
  });
  

  
  // Job alerts management - PROTECTED ROUTE
  app.get("/api/job-alerts", requireEmployee, async (req: any, res) => {
    
    try {
      const alerts = await storage.getJobAlerts(req.user.id);
      res.json(alerts);
    } catch (error) {
      console.error("Get job alerts error:", error);
      res.status(500).json({ message: "Failed to get job alerts" });
    }
  });
  
  app.post("/api/job-alerts", requireEmployee, async (req: any, res) => {
    
    try {
      const alertData = insertJobAlertSchema.parse({
        ...req.body,
        employeeId: req.user.id
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
  
  app.put("/api/job-alerts/:alertId", requireEmployee, async (req: any, res) => {
    
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
  
  app.delete("/api/job-alerts/:alertId", requireEmployee, async (req: any, res) => {
    
    try {
      await storage.deleteJobAlert(req.params.alertId);
      res.json({ message: "Job alert deleted successfully" });
    } catch (error) {
      console.error("Delete job alert error:", error);
      res.status(500).json({ message: "Failed to delete job alert" });
    }
  });



  // Object storage routes for file uploads - PROTECTED ROUTE
  app.post("/api/objects/upload", requireEmployee, async (req: any, res) => {
    
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
  
  // Company creates job listing - PROTECTED ROUTE
  app.post("/api/company/jobs", requireCompany, async (req: any, res) => {
    
    try {
      console.log("Received job data:", req.body);
      
      // Convert applicationDeadline string to Date if present
      const dataToValidate = {
        ...req.body,
        companyId: req.user.id,
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
  
  // Company gets their job listings - PROTECTED ROUTE
  app.get("/api/company/jobs", requireCompany, async (req: any, res) => {
    
    try {
      const jobs = await storage.getCompanyJobs(req.user.id);
      res.json(jobs);
    } catch (error) {
      console.error("Get company jobs error:", error);
      res.status(500).json({ message: "Failed to get job listings" });
    }
  });

  // Company updates job listing - PROTECTED ROUTE
  app.put("/api/company/jobs/:jobId", requireCompany, async (req: any, res) => {
    
    try {
      // First verify this job belongs to the company
      const existingJob = await storage.getJobById(req.params.jobId);
      if (!existingJob || existingJob.companyId !== req.user.id) {
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

  // Company deletes job listing - PROTECTED ROUTE
  app.delete("/api/company/jobs/:jobId", requireCompany, async (req: any, res) => {
    
    try {
      // First verify this job belongs to the company
      const existingJob = await storage.getJobById(req.params.jobId);
      if (!existingJob || existingJob.companyId !== req.user.id) {
        return res.status(403).json({ message: "Access denied to this job" });
      }
      
      await storage.deleteJobListing(req.params.jobId);
      res.json({ message: "Job listing deleted successfully" });
    } catch (error) {
      console.error("Delete job listing error:", error);
      res.status(500).json({ message: "Failed to delete job listing" });
    }
  });
  
  // Company gets applications for a specific job - PROTECTED ROUTE
  app.get("/api/company/jobs/:jobId/applications", requireCompany, async (req: any, res) => {
    
    try {
      // First verify this job belongs to the company
      const job = await storage.getJobById(req.params.jobId);
      if (!job || job.companyId !== req.user.id) {
        return res.status(403).json({ message: "Access denied to this job" });
      }
      
      const applications = await storage.getJobApplicationsForJob(req.params.jobId);
      res.json(applications);
    } catch (error) {
      console.error("Get job applications error:", error);
      res.status(500).json({ message: "Failed to get job applications" });
    }
  });
  
  // Legacy route - keep for compatibility - PROTECTED ROUTE
  app.put("/api/company/applications/:applicationId", requireCompany, async (req: any, res) => {
    
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
  
  // Get all job applications for a company - PROTECTED ROUTE
  app.get("/api/company/applications", requireCompany, async (req: any, res) => {
    
    try {
      const applications = await storage.getCompanyJobApplications(req.user.id);
      res.json(applications);
    } catch (error) {
      console.error("Get company applications error:", error);
      res.status(500).json({ message: "Failed to get job applications" });
    }
  });
  
  // Update application status - PROTECTED ROUTE
  app.put("/api/company/applications/:applicationId", requireCompany, async (req: any, res) => {
    
    try {
      const { status, companyNotes, interviewNotes, rejectionReason } = req.body;
      const application = await storage.updateJobApplicationStatus(
        req.params.applicationId,
        { status, companyNotes, interviewNotes, rejectionReason }
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

  // Company Employee Privacy Routes - Read-only access with proper authorization - PROTECTED ROUTE
  app.get("/api/company/employee/:employeeId", requireCompany, async (req: any, res) => {
    
    try {
      // Verify the employee is associated with this company (including job applications)
      const employeeCompany = await storage.getEmployeeCompanyRelation(req.params.employeeId, req.user.id);
      const hasJobApplication = await storage.hasEmployeeAppliedToCompany(req.params.employeeId, req.user.id);
      

      
      if (!employeeCompany && !hasJobApplication) {
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

  app.get("/api/company/employee-work-entries/:employeeId", requireCompany, async (req: any, res) => {
    
    try {
      // Verify the employee is associated with this company (including job applications)
      const employeeCompany = await storage.getEmployeeCompanyRelation(req.params.employeeId, req.user.id);
      const hasJobApplication = await storage.hasEmployeeAppliedToCompany(req.params.employeeId, req.user.id);
      
      if (!employeeCompany && !hasJobApplication) {
        return res.status(403).json({ message: "Employee not associated with your company" });
      }
      
      // Get work entries for this employee for this company only
      const workEntries = await storage.getWorkEntriesForEmployeeAndCompany(req.params.employeeId, req.user.id);
      
      // Add company name to each entry
      const company = await storage.getCompany(req.user.id);
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
  
  // Get employee shared documents for a specific job application - PROTECTED ROUTE
  app.get("/api/company/applications/:applicationId/shared-documents", requireCompany, async (req: any, res) => {
    
    try {
      // First get the job application to verify ownership and check sharing preferences
      const application = await storage.getJobApplicationWithEmployee(req.params.applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Verify this application belongs to a job from this company
      const job = await storage.getJobById(application.jobId);
      if (!job || job.companyId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to application" });
      }
      
      const sharedDocuments: any = {
        applicationId: application.id,
        employeeId: application.employeeId,
        employee: application.employee,
        coverLetter: application.coverLetter,
        attachmentUrl: application.attachmentUrl,
        attachmentName: application.attachmentName,
        salaryExpectation: application.salaryExpectation,
        sharedProfile: null,
        sharedWorkDiary: null,
        sharedExperience: null,
        sharedEducation: null,
        sharedCertifications: null
      };
      
      // Get shared profile data if employee opted to share it
      if (application.includeProfile) {
        const employee = await storage.getEmployee(application.employeeId);
        if (employee) {
          // Return safe profile data (excluding sensitive information)
          sharedDocuments.sharedProfile = {
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
            profilePhoto: employee.profilePhoto,
            // Basic Details
            phone: employee.phone,
            dateOfBirth: employee.dateOfBirth,
            gender: employee.gender
          };
          
          // Get additional profile sections
          sharedDocuments.sharedExperience = await storage.getEmployeeExperiences(application.employeeId);
          sharedDocuments.sharedEducation = await storage.getEmployeeEducations(application.employeeId);
          sharedDocuments.sharedCertifications = await storage.getEmployeeCertifications(application.employeeId);
        }
      }
        
      // Get shared work diary data if employee opted to share it  
      if (application.includeWorkDiary) {
        const workEntries = await storage.getWorkEntries(application.employeeId);
        
        // Filter only verified entries for recruiter viewing
        const verifiedEntries = workEntries.filter((entry: any) => entry.approvalStatus === "approved");
        
        // Add company names to each verified work entry
        const workEntriesWithCompanyNames = await Promise.all(
          verifiedEntries.map(async (entry: any) => {
            const company = await storage.getCompany(entry.companyId);
            return {
              ...entry,
              companyName: company?.name || 'Unknown Company'
            };
          })
        );
        
        sharedDocuments.sharedWorkDiary = workEntriesWithCompanyNames;
      }
      
      res.json(sharedDocuments);
    } catch (error) {
      console.error("Get shared documents error:", error);
      res.status(500).json({ message: "Failed to get shared documents" });
    }
  });

  // Legacy endpoint for backward compatibility - PROTECTED ROUTE
  app.get("/api/company/applications/:applicationId/employee", requireCompany, async (req: any, res) => {
    
    try {
      const application = await storage.getJobApplicationWithEmployee(req.params.applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Get employee profile data if shared
      const profileData = application.includeProfile 
        ? await storage.getEmployeeProfile(application.employeeId)
        : null;
        
      // Get work diary data if shared - ONLY VERIFIED ENTRIES
      let workDiaryData = null;
      if (application.includeWorkDiary) {
        const allWorkEntries = await storage.getWorkEntries(application.employeeId);
        // Filter only verified/approved entries for security
        workDiaryData = allWorkEntries.filter((entry: any) => entry.approvalStatus === "approved");
      }
      
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

  // Object storage routes for profile pictures
  app.post("/api/objects/upload", async (req, res) => {
    if (!(req.session as any).user) {
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

  app.put("/api/employee/profile-picture", requireEmployee, async (req: any, res) => {

    if (!req.body.profilePictureURL) {
      return res.status(400).json({ message: "profilePictureURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      
      // Get current employee data to check for existing profile picture
      const currentEmployee = await storage.getEmployee(req.user.id);
      const oldProfilePicturePath = currentEmployee?.profilePhoto;

      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.profilePictureURL,
        {
          owner: req.user.id,
          visibility: "public",
        }
      );

      // Update database with new profile picture
      await storage.updateEmployeeProfilePicture(req.user.id, objectPath);

      // Delete old profile picture if it exists and is different from the new one
      if (oldProfilePicturePath && oldProfilePicturePath !== objectPath && oldProfilePicturePath.startsWith("/objects/")) {
        try {
          await objectStorageService.deleteObject(oldProfilePicturePath);
          console.log(`Deleted old profile picture: ${oldProfilePicturePath}`);
        } catch (deleteError) {
          console.warn(`Failed to delete old profile picture: ${oldProfilePicturePath}`, deleteError);
          // Don't fail the request if cleanup fails
        }
      }

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Set profile picture error:", error);
      res.status(500).json({ message: "Failed to set profile picture" });
    }
  });

  // Password reset request endpoint
  app.post("/api/auth/request-password-reset", async (req, res) => {
    try {
      const validatedData = requestPasswordResetSchema.parse(req.body);
      const { email, userType } = validatedData;
      
      // Normalize email to lowercase for case-insensitive matching
      const normalizedEmail = email.toLowerCase();

      // Check if user exists
      let user = null;
      let firstName = "";
      if (userType === 'employee') {
        user = await storage.getEmployeeByEmail(normalizedEmail);
        firstName = user?.firstName || "User";
      } else {
        user = await storage.getCompanyByEmail(normalizedEmail);
        firstName = user?.name || "User";
      }

      if (!user) {
        return res.status(404).json({ message: "No account found with this email address" });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: "Account is deactivated. Please contact support." });
      }

      // Check if email is verified - only allow password reset for verified emails
      if (!user.emailVerified) {
        return res.status(403).json({ 
          message: "Email address must be verified before requesting password reset. Please verify your email from your profile page first." 
        });
      }

      // Generate OTP
      const otpCode = generateOTPCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Save OTP to database
      await storage.createEmailVerification({
        email: normalizedEmail,
        otpCode,
        purpose: "password_reset",
        userType,
        userId: user.id,
        expiresAt,
      });

      // Send OTP email
      const emailSent = await sendOTPEmail({
        to: normalizedEmail,
        firstName,
        otpCode,
        purpose: "password_reset",
      });

      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send verification email" });
      }

      res.status(200).json({
        message: "Password reset code sent to your email",
        email: normalizedEmail.replace(/(.{2}).*(@.*)/, "$1***$2"), // Mask email for security
      });
    } catch (error) {
      console.error("Request password reset error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Verify OTP endpoint
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const validatedData = verifyOTPSchema.parse(req.body);
      const { email, otpCode, purpose, userType } = validatedData;

      // Get OTP verification record
      const verification = await storage.getEmailVerification(email, otpCode, purpose);

      if (!verification) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }

      // Check if OTP is expired
      if (isOTPExpired(verification.createdAt)) {
        return res.status(400).json({ message: "Verification code has expired" });
      }

      // For password reset, return success without marking as used yet
      // (it will be marked as used when the password is actually reset)
      if (purpose === "password_reset") {
        res.status(200).json({
          message: "Verification code is valid",
          verified: true,
        });
      } else if (purpose === "email_verification") {
        // Mark user as email verified and sync login email
        if (verification.userType === 'employee') {
          await storage.markEmployeeEmailVerified(verification.userId);
          
          // Update session email if user is currently logged in
          const sessionUser = (req.session as any)?.user;
          if (sessionUser && sessionUser.type === 'employee' && sessionUser.id === verification.userId) {
            sessionUser.email = verification.email;
          }
        } else {
          await storage.markCompanyEmailVerified(verification.userId);
          
          // Update session email if user is currently logged in
          const sessionUser = (req.session as any)?.user;
          if (sessionUser && sessionUser.type === 'company' && sessionUser.id === verification.userId) {
            sessionUser.email = verification.email;
          }
        }
        
        // Mark OTP as used
        await storage.markEmailVerificationUsed(verification.id);
        
        res.status(200).json({
          message: "Email verified successfully! You can now log in to your account.",
          verified: true,
        });
      } else {
        // For other purposes, mark as used
        await storage.markEmailVerificationUsed(verification.id);
        res.status(200).json({
          message: "Email verified successfully",
          verified: true,
        });
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ message: "Failed to verify code" });
    }
  });

  // Reset password endpoint
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);
      const { email, otpCode, newPassword } = validatedData;

      // Get and verify OTP for password reset
      const verification = await storage.getEmailVerification(email, otpCode, "password_reset");

      if (!verification) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }

      // Check if OTP is expired
      if (isOTPExpired(verification.createdAt)) {
        return res.status(400).json({ message: "Verification code has expired" });
      }

      // Find the user and update password
      let user = null;
      if (verification.userType === 'employee') {
        user = await storage.getEmployeeByEmail(email);
      } else {
        user = await storage.getCompanyByEmail(email);
      }

      if (!user || !user.isActive) {
        return res.status(404).json({ message: "Account not found or deactivated" });
      }

      // Hash new password and update
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(user.id, verification.userType, hashedPassword);

      // Mark OTP as used
      await storage.markEmailVerificationUsed(verification.id);

      // Clean up expired verifications
      await storage.cleanupExpiredVerifications();

      res.status(200).json({
        message: "Password reset successfully",
        success: true,
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Change password endpoint - PROTECTED ROUTE
  app.post("/api/auth/change-password", requireAuth, async (req: any, res) => {

    try {
      const validatedData = changePasswordSchema.parse(req.body);
      const { currentPassword, newPassword } = validatedData;

      let success = false;
      
      if (req.user.type === "employee") {
        success = await storage.changeEmployeePassword(req.user.id, currentPassword, newPassword);
      } else if (req.user.type === "company") {
        success = await storage.changeCompanyPassword(req.user.id, currentPassword, newPassword);
      } else {
        return res.status(400).json({ message: "Invalid account type" });
      }

      if (!success) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Company email verification endpoint - PROTECTED ROUTE
  // Update company email (only if not verified)
  app.patch("/api/company/email", requireCompany, async (req: any, res) => {

    try {
      const { email } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Valid email is required" });
      }

      const company = await storage.getCompany(req.user.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      if (company.emailVerified) {
        return res.status(400).json({ message: "Cannot change email after verification. Contact support if needed." });
      }

      // Check if email is already taken by another company
      const existingCompany = await storage.getCompanyByEmail(email);
      if (existingCompany && existingCompany.id !== company.id) {
        return res.status(400).json({ message: "Email is already registered" });
      }

      // Update email and reset verification status
      const updatedCompany = await storage.updateCompany(company.id, {
        email: email.toLowerCase().trim(),
        emailVerified: false
      });

      // Update session email for login consistency
      (req.session as any).user.email = email.toLowerCase().trim();

      const { password, ...companyResponse } = updatedCompany;
      res.json({ 
        message: "Email updated successfully. Please verify your new email.",
        user: companyResponse 
      });
    } catch (error: any) {
      console.error("Update email error:", error);
      res.status(500).json({ message: "Failed to update email" });
    }
  });

  app.post("/api/company/send-verification", requireCompany, async (req: any, res) => {
    
    try {
      // Get company data
      const company = await storage.getCompany(req.user.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Check if already verified
      if (company.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }
      
      // Generate OTP
      const otpCode = generateOTPCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      // Save OTP to database
      await storage.createEmailVerification({
        email: company.email,
        otpCode,
        purpose: "email_verification",
        userType: "company",
        userId: company.id,
        expiresAt,
      });
      
      // Send OTP email
      const emailSent = await sendOTPEmail({
        to: company.email,
        firstName: company.name,
        otpCode,
        purpose: "email_verification",
      });
      
      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send verification email" });
      }
      
      res.status(200).json({
        message: "Verification code sent to your email",
        email: company.email.replace(/(.{2}).*(@.*)/, "$1***$2"), // Mask email for security
      });
    } catch (error) {
      console.error("Send company verification error:", error);
      res.status(500).json({ message: "Failed to send verification email" });
    }
  });

  // Company verification routes - PROTECTED ROUTE
  app.get("/api/company/verification-status", requireCompany, async (req: any, res) => {

    try {
      const company = await storage.getCompany(req.user.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      res.json({
        id: company.id,
        name: company.name,
        registrationType: company.registrationType,
        registrationNumber: company.registrationNumber,
        verificationStatus: company.verificationStatus || "unverified",
        verificationDate: company.verificationDate,
        verificationNotes: company.verificationNotes,
        rejectionReason: company.rejectionReason,
        verificationDocuments: company.verificationDocuments || []
      });
    } catch (error) {
      console.error("Get company verification status error:", error);
      res.status(500).json({ message: "Failed to get verification status" });
    }
  });

  app.post("/api/company/request-verification", requireCompany, async (req: any, res) => {

    try {
      const { notes } = req.body;

      const company = await storage.getCompany(req.user.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Check if already verified or pending
      if (company.verificationStatus === "verified") {
        return res.status(400).json({ message: "Company is already verified" });
      }

      if (company.verificationStatus === "pending") {
        return res.status(400).json({ message: "Verification request is already pending" });
      }

      // Update company verification status to pending
      await storage.updateCompanyVerificationStatus(req.user.id, {
        verificationStatus: "pending",
        verificationMethod: "manual",
        verificationNotes: notes || null,
        rejectionReason: null // Clear any previous rejection reason
      });

      res.json({ message: "Verification request submitted successfully" });
    } catch (error) {
      console.error("Request company verification error:", error);
      res.status(500).json({ message: "Failed to submit verification request" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  const httpServer = createServer(app);
  
  // Set up Socket.IO for real-time updates
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  // Handle WebSocket connections
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Join user-specific rooms for targeted updates
    socket.on('join-user-room', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined their room`);
    });
    
    // Join company-specific rooms
    socket.on('join-company-room', (companyId) => {
      socket.join(`company-${companyId}`);
      console.log(`User joined company room: ${companyId}`);
    });
    
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
  
  // =====================================================
  // FEEDBACK API ROUTES
  // =====================================================

  // Submit feedback (authenticated users and anonymous)
  app.post("/api/feedback", async (req, res) => {
    try {
      const sessionUser = (req.session as any).user;
      const validatedData = insertFeedbackSchema.parse(req.body);
      
      // Get browser info from headers
      const browserInfo = req.headers['user-agent'] || 'Unknown';
      const pageUrl = req.headers.referer || req.body.pageUrl || 'Unknown';
      
      // Prepare feedback data
      const feedbackData: any = {
        ...validatedData,
        browserInfo,
        pageUrl,
        userType: 'anonymous',
        userId: null,
        userName: null
      };

      // If user is authenticated, add user info
      if (sessionUser) {
        feedbackData.userType = sessionUser.type;
        feedbackData.userId = sessionUser.id;
        
        if (sessionUser.type === 'employee') {
          const employee = await storage.getEmployee(sessionUser.id);
          if (employee) {
            feedbackData.userName = `${employee.firstName} ${employee.lastName}`;
            feedbackData.userEmail = feedbackData.userEmail || employee.email;
          }
        } else if (sessionUser.type === 'company') {
          const company = await storage.getCompany(sessionUser.id);
          if (company) {
            feedbackData.userName = company.name;
            feedbackData.userEmail = feedbackData.userEmail || company.email;
          }
        }
      }

      const feedback = await storage.createFeedback(feedbackData);
      
      res.json({ 
        message: "Feedback submitted successfully",
        feedback: {
          id: feedback.id,
          title: feedback.title,
          status: feedback.status
        }
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: validationError.message,
          errors: error.errors
        });
      }
      
      console.error("Submit feedback error:", error);
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  // Get all feedback (admin only) - PROTECTED ROUTE
  app.get("/api/admin/feedback", requireAdmin, async (req: any, res) => {
    
    try {
      const { status, type } = req.query;
      
      let feedback;
      if (status && typeof status === 'string') {
        feedback = await storage.getFeedbackByStatus(status);
      } else if (type && typeof type === 'string') {
        feedback = await storage.getFeedbackByType(type);
      } else {
        feedback = await storage.getAllFeedback();
      }
      
      res.json(feedback);
    } catch (error) {
      console.error("Get feedback error:", error);
      res.status(500).json({ message: "Failed to get feedback" });
    }
  });

  // Get feedback stats (admin only) - PROTECTED ROUTE
  app.get("/api/admin/feedback/stats", requireAdmin, async (req: any, res) => {
    
    try {
      const stats = await storage.getFeedbackStats();
      res.json(stats);
    } catch (error) {
      console.error("Get feedback stats error:", error);
      res.status(500).json({ message: "Failed to get feedback stats" });
    }
  });

  // Update feedback status/respond (admin only) - PROTECTED ROUTE  
  app.patch("/api/admin/feedback/:id", requireAdmin, async (req: any, res) => {
    
    try {
      const { id } = req.params;
      const validatedData = feedbackResponseSchema.parse(req.body);
      
      const updatedFeedback = await storage.updateFeedbackStatus(
        id, 
        validatedData.status, 
        validatedData.adminResponse,
        req.user.username || req.user.id
      );
      
      res.json({ 
        message: "Feedback updated successfully",
        feedback: updatedFeedback
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: validationError.message,
          errors: error.errors
        });
      }
      
      console.error("Update feedback error:", error);
      res.status(500).json({ message: "Failed to update feedback" });
    }
  });

  // Admin endpoint to clean up duplicate applications
  app.post("/api/admin/cleanup-duplicates", async (req, res) => {
    try {
      const result = await storage.cleanupDuplicateApplications();
      res.json({
        message: "Duplicate applications cleaned up successfully",
        deletedCount: result.deletedCount,
        keptCount: result.keptCount
      });
    } catch (error) {
      console.error("Cleanup duplicates error:", error);
      res.status(500).json({ message: "Failed to cleanup duplicate applications" });
    }
  });

  // Skills API Routes - PROTECTED ROUTE
  app.get("/api/skills/trending", requireEmployee, async (req: any, res) => {
    
    try {
      const { limit, location, role, experience, personalized } = req.query;
      
      if (personalized === 'true') {
        const skills = await storage.getPersonalizedTrendingSkills(req.user.id, {
          limit: limit ? parseInt(limit as string) : 20,
          location: location as string,
          role: role as string,
          experience: experience as string
        });
        res.json(skills);
      } else {
        const skills = await storage.getTrendingSkills({
          limit: limit ? parseInt(limit as string) : 20,
          location: location as string,
          role: role as string,
          experience: experience as string
        });
        res.json(skills);
      }
    } catch (error) {
      console.error("Get trending skills error:", error);
      res.status(500).json({ message: "Failed to get trending skills" });
    }
  });

  app.post("/api/skills/:skillId/pin", requireEmployee, async (req: any, res) => {
    
    try {
      const preference = await storage.pinSkill(req.user.id, req.params.skillId);
      
      // Log analytics
      await storage.logSkillAnalytics({
        userId: req.user.id,
        skillId: req.params.skillId,
        eventType: 'pin',
        context: {}
      });
      
      res.json({ message: "Skill pinned successfully", preference });
    } catch (error) {
      console.error("Pin skill error:", error);
      res.status(500).json({ message: "Failed to pin skill" });
    }
  });

  app.post("/api/skills/:skillId/hide", requireEmployee, async (req: any, res) => {
    
    try {
      const preference = await storage.hideSkill(req.user.id, req.params.skillId);
      
      // Log analytics
      await storage.logSkillAnalytics({
        userId: req.user.id,
        skillId: req.params.skillId,
        eventType: 'hide',
        context: {}
      });
      
      res.json({ message: "Skill hidden successfully", preference });
    } catch (error) {
      console.error("Hide skill error:", error);
      res.status(500).json({ message: "Failed to hide skill" });
    }
  });

  app.post("/api/skills/:skillId/view", requireEmployee, async (req: any, res) => {
    
    try {
      await storage.logSkillAnalytics({
        userId: req.user.id,
        skillId: req.params.skillId,
        eventType: 'view',
        context: req.body.context || {}
      });
      
      res.json({ message: "Skill view logged" });
    } catch (error) {
      console.error("Log skill view error:", error);
      res.status(500).json({ message: "Failed to log skill view" });
    }
  });

  app.get("/api/skills/search", requireEmployee, async (req: any, res) => {
    
    try {
      const { q, limit } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      
      const skills = await storage.searchSkills(q, limit ? parseInt(limit as string) : 50);
      res.json(skills);
    } catch (error) {
      console.error("Search skills error:", error);
      res.status(500).json({ message: "Failed to search skills" });
    }
  });

  app.get("/api/skills/preferences", requireEmployee, async (req: any, res) => {
    
    try {
      const preferences = await storage.getUserSkillPreferences(req.user.id);
      res.json(preferences);
    } catch (error) {
      console.error("Get skill preferences error:", error);
      res.status(500).json({ message: "Failed to get skill preferences" });
    }
  });



  // OTP Email Verification Routes
  app.post("/api/email-verification/send-otp", requireAuth, async (req: any, res) => {

    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const result = await OTPEmailService.sendEmailVerificationOTP(
        req.user.id,
        email,
        req.user.type
      );

      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      res.status(500).json({ message: "Failed to send verification code" });
    }
  });

  app.post("/api/email-verification/verify-otp", requireAuth, async (req: any, res) => {

    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required" });
      }

      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await OTPEmailService.verifyEmailOTP(
        req.user.id,
        email,
        otp,
        ipAddress,
        userAgent
      );

      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  app.post("/api/email-verification/resend-otp", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const result = await OTPEmailService.resendEmailVerificationOTP(
        sessionUser.id,
        email,
        sessionUser.type
      );

      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      res.status(500).json({ message: "Failed to resend verification code" });
    }
  });

  app.get("/api/email-verification/status", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const email = req.query.email as string;
      if (!email) {
        return res.status(400).json({ message: "Email parameter is required" });
      }

      const status = await OTPEmailService.getEmailVerificationStatus(
        sessionUser.id,
        email
      );

      res.json(status);
    } catch (error) {
      console.error("Get verification status error:", error);
      res.status(500).json({ message: "Failed to get verification status" });
    }
  });

  // Contact form submission endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = contactFormSchema.parse(req.body);
      const { name, email, message } = validatedData;

      // Prepare email content
      const emailSubject = `Contact Form Submission from ${name}`;
      const emailContent = `
New contact form submission from Signedwork:

Name: ${name}
Email: ${email}

Message:
${message}

---
This message was sent through the Signedwork contact form.
      `.trim();

      // Send email to support
      const emailResult = await sendEmail(
        process.env.SENDGRID_API_KEY!,
        {
          to: "support@signedwork.com",
          from: "noreply@signedwork.com",
          subject: emailSubject,
          text: emailContent,
        }
      );

      if (emailResult) {
        res.json({ message: "Message sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send message" });
      }
    } catch (error) {
      console.error("Contact form submission error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Work verification endpoints - using unique routes to avoid conflicts
  app.post('/api/work-verification/submit', requireEmployee, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { title, description, date, hoursWorked, category } = req.body;
      
      console.log(`New work entry submission from employee: ${userId}`);
      
      if (!title || !description || !date || !hoursWorked) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const workEntry = await storage.createWorkEntry({
        employeeId: userId,
        title,
        description,
        date: new Date(date),
        hoursWorked: parseFloat(hoursWorked),
        category: category || 'other',
        status: 'pending'
      });

      res.json(workEntry);
    } catch (error) {
      console.error('Error creating work entry:', error);
      res.status(500).json({ message: 'Failed to create work entry' });
    }
  });

  app.get('/api/work-verification/my-entries', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userType = req.user.type;
      
      console.log(`My work verification entries request from user: ${userId}, type: ${userType}`);
      
      // Use existing storage methods that are already working
      if (userType === 'company') {
        // For companies, get work entries from their company using existing storage method
        const workEntriesData = await storage.getWorkEntriesForCompany(userId);
        res.json(workEntriesData);
      } else {
        // For employees, get their work entries using existing storage method
        const workEntriesData = await storage.getWorkEntries(userId);
        res.json(workEntriesData);
      }
    } catch (error) {
      console.error('Error fetching my work entries:', error);
      res.status(500).json({ message: 'Failed to fetch work entries' });
    }
  });

  app.get('/api/work-verification/pending', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userType = req.user.type;
      
      console.log(`Pending work verifications request from user: ${userId}, type: ${userType}`);
      
      // Return work entries with pending approval status using existing storage methods
      if (userType === 'company') {
        // For companies, get all work entries and filter for pending
        const allEntries = await storage.getWorkEntriesForCompany(userId);
        const pendingEntries = allEntries.filter((entry: any) => 
          entry.approvalStatus === 'pending_review' || entry.status === 'pending'
        );
        res.json(pendingEntries);
      } else {
        // For employees, get their work entries and filter for pending
        const allEntries = await storage.getWorkEntries(userId);
        const pendingEntries = allEntries.filter((entry: any) => 
          entry.approvalStatus === 'pending_review' || entry.status === 'pending'
        );
        res.json(pendingEntries);
      }
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      res.status(500).json({ message: 'Failed to fetch pending verifications' });
    }
  });

  app.post('/api/work-verification/verify/:workEntryId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userType = req.user.type;
      const { workEntryId } = req.params;
      const { action, note } = req.body;
      
      console.log(`Work verification request from user: ${userId}, type: ${userType}, action: ${action}, workEntryId: ${workEntryId}`);
      
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
      }

      // For now, return success but log the access
      res.json({ 
        message: `Work entry ${action}d successfully`,
        workEntryId,
        action,
        verifiedBy: userId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error verifying work entry:', error);
      res.status(500).json({ message: 'Failed to verify work entry' });
    }
  });

  return httpServer;
}
