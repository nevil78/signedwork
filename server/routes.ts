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
  insertFeedbackSchema, feedbackResponseSchema
} from "@shared/schema";
import { sendOTPEmail, generateOTPCode, isOTPExpired } from "./emailService";
import { sendPasswordResetOTP } from "./sendgrid";
import { fromZodError } from "zod-validation-error";
import { setupGoogleAuth } from "./googleAuth";
import { OTPEmailService } from "./otpEmailService";
import { SignupVerificationService } from "./signupVerificationService";
import { sendEmail } from "./sendgrid";

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

  // Session heartbeat endpoint to keep sessions alive
  app.post("/api/auth/heartbeat", (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Calculate session expiry time
    const sessionExpiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours from now
    
    // Session will be automatically saved due to rolling: true
    res.json({ 
      message: "Session renewed",
      userId: sessionUser.id,
      userType: sessionUser.type,
      expiresAt: sessionExpiresAt.toISOString(),
      remainingTime: "24 hours"
    });
  });

  // Session status endpoint to check session validity and remaining time
  app.get("/api/auth/session-status", (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser) {
      return res.status(401).json({ 
        message: "Not authenticated",
        authenticated: false
      });
    }
    
    // Calculate remaining session time based on rolling sessions
    const sessionExpiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours from now due to rolling
    const remainingMs = sessionExpiresAt.getTime() - Date.now();
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    res.json({
      authenticated: true,
      userId: sessionUser.id,
      userType: sessionUser.type,
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

      // Remove password from response
      const { password: _, ...employeeResponse } = employee;

      res.status(201).json({
        message: "Account created successfully! You can now login.",
        user: employeeResponse,
        userType: "employee",
        verified: true
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

  // Send email verification (for profile page)
  app.post("/api/auth/send-email-verification", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      // Get user details
      let user = null;
      if (sessionUser.type === 'employee') {
        user = await storage.getEmployee(sessionUser.id);
      } else {
        user = await storage.getCompany(sessionUser.id);
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
        userType: sessionUser.type,
        userId: user.id,
        expiresAt,
      });

      // Send OTP email
      const firstName = sessionUser.type === 'employee' ? (user as any).firstName : (user as any).name;
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

  // Employee-specific user endpoint for compatibility
  app.get("/api/employee/me", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const employee = await storage.getEmployee(sessionUser.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Allow both active and inactive employees to access their profile
      console.log(`Employee ${sessionUser.id} accessing profile - Active: ${employee.isActive}`);
      
      const { password, ...employeeResponse } = employee;
      res.json(employeeResponse);
    } catch (error) {
      console.error("Get employee profile error:", error);
      res.status(500).json({ message: "Failed to get employee profile" });
    }
  });

  // Update employee email (with verification reset)
  app.patch("/api/employee/email", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }

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
      const employee = await storage.getEmployee(sessionUser.id);
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
      if (existingEmployee && existingEmployee.id !== sessionUser.id) {
        return res.status(409).json({ message: "Email is already in use by another account" });
      }

      // Update email and reset verification status
      const updatedEmployee = await storage.updateEmployee(sessionUser.id, { 
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

  // Send email verification for employee (specific endpoint)
  app.post("/api/employee/send-verification-email", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }

    try {
      const employee = await storage.getEmployee(sessionUser.id);
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

  // Get current user
  app.get("/api/auth/user", async (req, res) => {
    // Debug session information
    console.log("Session debug:", {
      sessionId: req.sessionID,
      hasSession: !!req.session,
      sessionUser: (req.session as any)?.user,
      sessionCookie: req.headers.cookie
    });
    
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser) {
      console.log("No session user found, returning 401");
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
        console.log(`User not found in database for ID: ${sessionUser.id}, type: ${sessionUser.type}`);
        // Clear invalid session
        req.session.destroy(() => {});
        return res.status(401).json({ message: "Session invalid - user not found" });
      }
      
      // For companies, check if they are still active
      if (sessionUser.type === "company" && 'isActive' in user && user.isActive === false) {
        console.log(`Company account deactivated for ID: ${sessionUser.id}`);
        req.session.destroy(() => {});
        return res.status(401).json({ message: "Account deactivated" });
      }
      
      // For employees, allow inactive (ex-employee) access but with limited permissions
      // They can view their data but cannot create/edit entries
      
      // Remove password from response
      const { password, ...userResponse } = user;
      
      console.log(`Session valid for user: ${sessionUser.id} (${sessionUser.type})`);
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

  // Company verification update route (before approval)
  app.patch("/api/company/verification-details", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      const { cin, panNumber } = req.body;
      
      // Get current company details
      const company = await storage.getCompany(sessionUser.id);
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
      const updatedCompany = await storage.updateCompany(sessionUser.id, updateData);
      
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

  // Get all employees (admin only) with search support
  app.get("/api/admin/employees", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
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

  // Get all companies (admin only) with search support
  app.get("/api/admin/companies", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
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

  // Admin endpoint to reactivate account by email (for support requests)
  app.post("/api/admin/reactivate", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
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

  // Get pending verifications (admin only)
  app.get("/api/admin/pending-verifications", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
    try {
      const companies = await storage.getPendingVerifications();
      res.json(companies);
    } catch (error) {
      console.error("Get pending verifications error:", error);
      res.status(500).json({ message: "Failed to get pending verifications" });
    }
  });

  // Update verification status (admin only)
  app.patch("/api/admin/companies/:id/verification", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
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

  // CIN verification endpoints
  app.get("/api/admin/companies/pending-cin-verification", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
    try {
      const pendingCompanies = await storage.getCompaniesByCINVerificationStatus("pending");
      res.json(pendingCompanies);
    } catch (error) {
      console.error("Get pending CIN verifications error:", error);
      res.status(500).json({ message: "Failed to fetch pending CIN verifications" });
    }
  });

  app.patch("/api/admin/companies/:id/cin-verification", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      if (!["verified", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid verification status" });
      }

      const updatedCompany = await storage.updateCompanyCINVerification(id, {
        cinVerificationStatus: status,
        cinVerifiedAt: new Date(),
        cinVerifiedBy: sessionUser.id,
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

  // Update employee email
  app.post("/api/employee/update-email", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }

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
        sessionUser.id,
        sessionUser.email || ""
      );

      if (currentStatus.isVerified) {
        return res.status(403).json({ 
          message: "Cannot change email after verification. Verified emails are locked for security." 
        });
      }

      // Check if new email already exists
      const existingEmployee = await storage.getEmployeeByEmail(email);
      const existingCompany = await storage.getCompanyByEmail(email);
      
      if ((existingEmployee && existingEmployee.id !== sessionUser.id) || existingCompany) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Update email
      const updatedEmployee = await storage.updateEmployee(sessionUser.id, { email });
      
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

  // Update company email
  app.post("/api/company/update-email", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }

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
        sessionUser.id,
        sessionUser.email || ""
      );

      if (currentStatus.isVerified) {
        return res.status(403).json({ 
          message: "Cannot change email after verification. Verified emails are locked for security." 
        });
      }

      // Check if new email already exists
      const existingEmployee = await storage.getEmployeeByEmail(email);
      const existingCompany = await storage.getCompanyByEmail(email);
      
      if (existingEmployee || (existingCompany && existingCompany.id !== sessionUser.id)) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Update email
      const updatedCompany = await storage.updateCompany(sessionUser.id, { email });
      
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

  // Employee Summary Dashboard
  app.get("/api/employee/summary-dashboard", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const dashboardData = await storage.getEmployeeSummaryDashboard(sessionUser.id);
      res.json(dashboardData);
    } catch (error) {
      console.error("Get employee summary dashboard error:", error);
      res.status(500).json({ message: "Failed to get dashboard data" });
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

  // Get company employees (legacy - simple list)
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

  // Get company employees with pagination, filtering, and sorting
  app.get("/api/company/employees/paginated", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
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

      const result = await storage.getCompanyEmployeesPaginated(sessionUser.id, {
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

  // Update employee status (Active/Ex-Employee)
  app.patch("/api/company/employees/:employeeId/status", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      const { employeeId } = req.params;
      const { isCurrent } = req.body;
      
      // Verify the employee is associated with this company
      const employeeCompany = await storage.getEmployeeCompanyRelation(employeeId, sessionUser.id);
      if (!employeeCompany) {
        return res.status(403).json({ message: "Employee not associated with your company" });
      }
      
      // Update the employee status
      const updatedRelation = await storage.updateEmployeeCompanyStatus(
        employeeId, 
        sessionUser.id, 
        isCurrent
      );
      
      // Emit real-time update to employee
      emitRealTimeUpdate('employee-status-updated', {
        employeeId,
        companyId: sessionUser.id,
        status: isCurrent ? 'active' : 'ex-employee',
        updatedRelation
      }, [
        `user-${employeeId}`,
        `company-${sessionUser.id}`
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
      const { rating, feedback } = req.body;
      
      // Enhanced approval with rating and feedback
      const workEntry = await storage.approveWorkEntry(id, {
        rating: rating && rating > 0 && rating <= 5 ? rating : undefined,
        feedback: feedback && feedback.trim() ? feedback.trim() : undefined
      });
      
      // Emit real-time update to employee
      emitRealTimeUpdate('work-entry-approved', {
        workEntry,
        companyId: sessionUser.id,
        employeeId: workEntry.employeeId,
        rating,
        feedback
      }, [
        `user-${workEntry.employeeId}`,
        `company-${sessionUser.id}`
      ]);
      
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
      
      // Emit real-time update to employee
      emitRealTimeUpdate('work-entry-changes-requested', {
        workEntry,
        companyId: sessionUser.id,
        employeeId: workEntry.employeeId,
        feedback
      }, [
        `user-${workEntry.employeeId}`,
        `company-${sessionUser.id}`
      ]);
      
      res.json(workEntry);
    } catch (error) {
      console.error("Request work entry changes error:", error);
      res.status(500).json({ message: "Failed to request changes" });
    }
  });

  // PAN verification admin routes
  app.get("/api/admin/companies/pending-pan-verification", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
    try {
      const pendingCompanies = await storage.getCompaniesByPANVerificationStatus("pending");
      res.json(pendingCompanies);
    } catch (error) {
      console.error("Get pending PAN verifications error:", error);
      res.status(500).json({ message: "Failed to fetch pending PAN verifications" });
    }
  });

  app.patch("/api/admin/companies/:id/pan-verification", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      if (!["verified", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid verification status" });
      }

      const updatedCompany = await storage.updateCompanyPANVerification(id, {
        panVerificationStatus: status,
        panVerifiedAt: new Date(),
        panVerifiedBy: sessionUser.id,
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
  
  // Get employees with current company details
  app.get("/api/admin/employees-with-companies", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
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
  
  // Get companies with employee counts
  app.get("/api/admin/companies-with-counts", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
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
  
  // Get employee with complete work history
  app.get("/api/admin/employees/:id/history", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
    try {
      const { id } = req.params;
      const employeeHistory = await storage.getEmployeeWithCompanyHistory(id);
      res.json(employeeHistory);
    } catch (error) {
      console.error("Get employee history error:", error);
      res.status(500).json({ message: "Failed to get employee history" });
    }
  });
  
  // Get company with complete employee history  
  app.get("/api/admin/companies/:id/employee-history", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
    try {
      const { id } = req.params;
      const companyHistory = await storage.getCompanyWithEmployeeHistory(id);
      res.json(companyHistory);
    } catch (error) {
      console.error("Get company employee history error:", error);
      res.status(500).json({ message: "Failed to get company employee history" });
    }
  });
  
  // Transfer employee between companies
  app.post("/api/admin/employees/:employeeId/transfer", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
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
        transferredBy: sessionUser.id,
        transferredAt: new Date()
      });
      
      res.json({ message: "Employee transferred successfully" });
    } catch (error) {
      console.error("Transfer employee error:", error);
      res.status(500).json({ message: "Failed to transfer employee" });
    }
  });
  
  // Update employee-company relationship
  app.patch("/api/admin/employee-company-relationships/:relationshipId", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
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
  
  // Get employee career report
  app.get("/api/admin/employees/:id/career-report", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
    try {
      const { id } = req.params;
      const careerReport = await storage.getEmployeeCareerReport(id);
      res.json(careerReport);
    } catch (error) {
      console.error("Get employee career report error:", error);
      res.status(500).json({ message: "Failed to get career report" });
    }
  });
  
  // Get company employee report
  app.get("/api/admin/companies/:id/employee-report", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
    try {
      const { id } = req.params;
      const employeeReport = await storage.getCompanyEmployeeReport(id);
      res.json(employeeReport);
    } catch (error) {
      console.error("Get company employee report error:", error);
      res.status(500).json({ message: "Failed to get employee report" });
    }
  });

  // Employee Company Routes  
  app.get("/api/employee-companies", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      // Check if employee exists and get their current status
      const employee = await storage.getEmployee(sessionUser.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Allow both active and inactive employees to view their company relations
      // This ensures ex-employees can still see their historical data
      console.log(`Employee ${sessionUser.id} accessing companies - Active: ${employee.isActive}`);
      
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

  // Work Diary Routes - Enhanced Professional Version
  app.get("/api/work-entries", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      // Check if employee exists (allow both active and inactive employees to view their data)
      const employee = await storage.getEmployee(sessionUser.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      console.log(`Employee ${sessionUser.id} accessing work entries - Active: ${employee.isActive}`);
      
      const { companyId } = req.query;
      const workEntries = await storage.getWorkEntries(sessionUser.id, companyId as string);
      res.json(workEntries);
    } catch (error) {
      console.error("Get work entries error:", error);
      res.status(500).json({ message: "Failed to get work entries" });
    }
  });

  // Legacy work diary route for compatibility
  app.get("/api/work-diary", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      // Check if employee exists (allow both active and inactive employees to view their data)
      const employee = await storage.getEmployee(sessionUser.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      console.log(`Employee ${sessionUser.id} accessing legacy work diary - Active: ${employee.isActive}`);
      
      const { companyId } = req.query;
      const workEntries = await storage.getWorkEntries(sessionUser.id, companyId as string);
      res.json(workEntries);
    } catch (error) {
      console.error("Get work entries error:", error);
      res.status(500).json({ message: "Failed to get work entries" });
    }
  });

  // Enhanced work entry creation
  app.post("/api/work-entries", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const validatedData = insertWorkEntrySchema.parse({
        ...req.body,
        employeeId: sessionUser.id
      });
      
      // Check if employee is still active in the company
      const employeeCompanies = await storage.getEmployeeCompanyRelations(sessionUser.id);
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
        employeeId: sessionUser.id,
        companyId: validatedData.companyId
      }, [
        `company-${validatedData.companyId}`,
        `user-${sessionUser.id}`
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

  // Legacy work diary creation for compatibility
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

  // Enhanced work entry update with immutable protection
  app.put("/api/work-entries/:id", async (req, res) => {
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

  // Legacy work diary update for compatibility
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

  // Employee Analytics Routes
  app.get("/api/employee/analytics/:employeeId?", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    const employeeId = req.params.employeeId || sessionUser.id;
    
    try {
      const analytics = await storage.getEmployeeAnalytics(employeeId);
      res.json(analytics);
    } catch (error) {
      console.error("Get employee analytics error:", error);
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  // Work Entry Analytics Routes
  app.get("/api/work-entries/analytics/:companyId?", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      // Check if employee exists (allow both active and inactive employees to view their analytics)
      const employee = await storage.getEmployee(sessionUser.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      console.log(`Employee ${sessionUser.id} accessing work analytics - Active: ${employee.isActive}`);
      
      const companyId = req.params.companyId;
      const analytics = await storage.getWorkEntryAnalytics(sessionUser.id, companyId);
      res.json(analytics);
    } catch (error) {
      console.error("Get work entry analytics error:", error);
      res.status(500).json({ message: "Failed to get work analytics" });
    }
  });

  // Employee Companies Route
  app.get("/api/employee/companies", async (req, res) => {
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
      // Check if this employee is associated with the company (including job applications)
      const employeeCompany = await storage.getEmployeeCompanyRelation(req.params.employeeId, sessionUser.id);
      const hasJobApplication = await storage.hasEmployeeAppliedToCompany(req.params.employeeId, sessionUser.id);
      
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

  app.get("/api/company/employee/:employeeId/profile", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      // Check if this employee is associated with the company (including job applications)
      const employeeCompany = await storage.getEmployeeCompanyRelation(req.params.employeeId, sessionUser.id);
      const hasJobApplication = await storage.hasEmployeeAppliedToCompany(req.params.employeeId, sessionUser.id);
      
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

  // Company employee experience routes
  app.get("/api/company/employee-experience/:employeeId", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      // Check if this employee is associated with the company (including job applications)
      const employeeCompany = await storage.getEmployeeCompanyRelation(req.params.employeeId, sessionUser.id);
      const hasJobApplication = await storage.hasEmployeeAppliedToCompany(req.params.employeeId, sessionUser.id);
      
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

  // Company employee education routes
  app.get("/api/company/employee-education/:employeeId", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      // Check if this employee is associated with the company (including job applications)
      const employeeCompany = await storage.getEmployeeCompanyRelation(req.params.employeeId, sessionUser.id);
      const hasJobApplication = await storage.hasEmployeeAppliedToCompany(req.params.employeeId, sessionUser.id);
      
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

  // Company employee certifications routes
  app.get("/api/company/employee-certifications/:employeeId", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      // Check if this employee is associated with the company (including job applications)
      const employeeCompany = await storage.getEmployeeCompanyRelation(req.params.employeeId, sessionUser.id);
      const hasJobApplication = await storage.hasEmployeeAppliedToCompany(req.params.employeeId, sessionUser.id);
      
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
  
  // Get perfect matches for employee (AI-powered recommendations)
  app.get("/api/jobs/perfect-matches", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      // Get employee profile for better matching
      const employee = await storage.getEmployee(sessionUser.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee profile not found" });
      }
      
      // For now, return jobs that match employee's skills or experience
      // This could be enhanced with ML algorithms in the future
      const filters = {
        keywords: employee.skills?.join(' ') || '',
        experienceLevel: employee.experienceLevel ? [employee.experienceLevel] : undefined
      };
      
      const jobs = await storage.searchJobs(filters);
      res.json(jobs.slice(0, 5)); // Return top 5 matches
    } catch (error) {
      console.error("Perfect matches error:", error);
      res.status(500).json({ message: "Failed to get perfect matches" });
    }
  });
  
  // Get employee's job applications (must come before /:jobId route)
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
  
  // Get saved jobs (must come before /:jobId route)
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

  // Company Employee Privacy Routes - Read-only access with proper authorization
  app.get("/api/company/employee/:employeeId", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      // Verify the employee is associated with this company (including job applications)
      const employeeCompany = await storage.getEmployeeCompanyRelation(req.params.employeeId, sessionUser.id);
      const hasJobApplication = await storage.hasEmployeeAppliedToCompany(req.params.employeeId, sessionUser.id);
      

      
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

  app.get("/api/company/employee-work-entries/:employeeId", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      // Verify the employee is associated with this company (including job applications)
      const employeeCompany = await storage.getEmployeeCompanyRelation(req.params.employeeId, sessionUser.id);
      const hasJobApplication = await storage.hasEmployeeAppliedToCompany(req.params.employeeId, sessionUser.id);
      
      if (!employeeCompany && !hasJobApplication) {
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
  
  // Get employee shared documents for a specific job application
  app.get("/api/company/applications/:applicationId/shared-documents", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      // First get the job application to verify ownership and check sharing preferences
      const application = await storage.getJobApplicationWithEmployee(req.params.applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Verify this application belongs to a job from this company
      const job = await storage.getJobById(application.jobId);
      if (!job || job.companyId !== sessionUser.id) {
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
            profilePhoto: employee.profilePhoto
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

  // Legacy endpoint for backward compatibility
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

  app.put("/api/employee/profile-picture", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }

    if (!req.body.profilePictureURL) {
      return res.status(400).json({ message: "profilePictureURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      
      // Get current employee data to check for existing profile picture
      const currentEmployee = await storage.getEmployee(sessionUser.id);
      const oldProfilePicturePath = currentEmployee?.profilePhoto;

      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.profilePictureURL,
        {
          owner: sessionUser.id,
          visibility: "public",
        }
      );

      // Update database with new profile picture
      await storage.updateEmployeeProfilePicture(sessionUser.id, objectPath);

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

  // Change password endpoint
  app.post("/api/auth/change-password", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const validatedData = changePasswordSchema.parse(req.body);
      const { currentPassword, newPassword } = validatedData;

      let success = false;
      
      if (sessionUser.type === "employee") {
        success = await storage.changeEmployeePassword(sessionUser.id, currentPassword, newPassword);
      } else if (sessionUser.type === "company") {
        success = await storage.changeCompanyPassword(sessionUser.id, currentPassword, newPassword);
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

  // Company email verification endpoint
  // Update company email (only if not verified)
  app.patch("/api/company/email", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== 'company') {
      return res.status(401).json({ message: "Not authenticated as company" });
    }

    try {
      const { email } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Valid email is required" });
      }

      const company = await storage.getCompany(sessionUser.id);
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

  app.post("/api/company/send-verification", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }
    
    try {
      // Get company data
      const company = await storage.getCompany(sessionUser.id);
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

  // Company verification routes
  app.get("/api/company/verification-status", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }

    try {
      const company = await storage.getCompany(sessionUser.id);
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

  app.post("/api/company/request-verification", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser || sessionUser.type !== "company") {
      return res.status(401).json({ message: "Not authenticated as company" });
    }

    try {
      const { notes } = req.body;

      const company = await storage.getCompany(sessionUser.id);
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
      await storage.updateCompanyVerificationStatus(sessionUser.id, {
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

  // Get all feedback (admin only)
  app.get("/api/admin/feedback", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
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

  // Get feedback stats (admin only)
  app.get("/api/admin/feedback/stats", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
    try {
      const stats = await storage.getFeedbackStats();
      res.json(stats);
    } catch (error) {
      console.error("Get feedback stats error:", error);
      res.status(500).json({ message: "Failed to get feedback stats" });
    }
  });

  // Update feedback status/respond (admin only)
  app.patch("/api/admin/feedback/:id", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "admin") {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }
    
    try {
      const { id } = req.params;
      const validatedData = feedbackResponseSchema.parse(req.body);
      
      const updatedFeedback = await storage.updateFeedbackStatus(
        id, 
        validatedData.status, 
        validatedData.adminResponse,
        sessionUser.username || sessionUser.id
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

  // Skills API Routes
  app.get("/api/skills/trending", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const { limit, location, role, experience, personalized } = req.query;
      
      if (personalized === 'true') {
        const skills = await storage.getPersonalizedTrendingSkills(sessionUser.id, {
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

  app.post("/api/skills/:skillId/pin", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const preference = await storage.pinSkill(sessionUser.id, req.params.skillId);
      
      // Log analytics
      await storage.logSkillAnalytics({
        userId: sessionUser.id,
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

  app.post("/api/skills/:skillId/hide", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const preference = await storage.hideSkill(sessionUser.id, req.params.skillId);
      
      // Log analytics
      await storage.logSkillAnalytics({
        userId: sessionUser.id,
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

  app.post("/api/skills/:skillId/view", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      await storage.logSkillAnalytics({
        userId: sessionUser.id,
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

  app.get("/api/skills/search", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
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

  app.get("/api/skills/preferences", async (req, res) => {
    const sessionUser = (req.session as any).user;
    
    if (!sessionUser || sessionUser.type !== "employee") {
      return res.status(401).json({ message: "Not authenticated as employee" });
    }
    
    try {
      const preferences = await storage.getUserSkillPreferences(sessionUser.id);
      res.json(preferences);
    } catch (error) {
      console.error("Get skill preferences error:", error);
      res.status(500).json({ message: "Failed to get skill preferences" });
    }
  });



  // OTP Email Verification Routes
  app.post("/api/email-verification/send-otp", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const result = await OTPEmailService.sendEmailVerificationOTP(
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
      console.error("Send OTP error:", error);
      res.status(500).json({ message: "Failed to send verification code" });
    }
  });

  app.post("/api/email-verification/verify-otp", async (req, res) => {
    const sessionUser = (req.session as any).user;
    if (!sessionUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required" });
      }

      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await OTPEmailService.verifyEmailOTP(
        sessionUser.id,
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



  return httpServer;
}
