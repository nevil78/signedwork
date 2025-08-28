import { nanoid } from "nanoid";
import bcrypt from "bcrypt";
import { sendEmail } from "./sendgrid";
import { storage } from "./storage";
import type { InsertPendingUser } from "@shared/schema";

export class SignupVerificationService {
  private static TOKEN_EXPIRY_MINUTES = 15;
  private static MAX_RESEND_COUNT = 3;

  /**
   * Generate a verification token and expiry
   */
  private static generateVerificationToken(): { token: string; expiry: Date } {
    const token = nanoid(32);
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + this.TOKEN_EXPIRY_MINUTES);
    
    return { token, expiry };
  }

  /**
   * 🚨 FRAUD DETECTION: Detect suspicious company registration patterns
   * This helps prevent self-verification schemes where someone creates both employee + company accounts
   */
  private static async detectSuspiciousCompanyRegistration(
    email: string, 
    companyName: string, 
    userData: any
  ): Promise<{ isSuspicious: boolean; reason?: string }> {
    try {
      const suspiciousReasons: string[] = [];
      
      // Check 1: Company name suspiciously similar to existing employee names
      const emailPrefix = email.split('@')[0].toLowerCase();
      const employees = await storage.getAllEmployees(); // Get recent employees for pattern matching
      
      for (const employee of employees.slice(-50)) { // Check last 50 employees for performance
        const employeeName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
        const employeeEmailPrefix = employee.email.split('@')[0].toLowerCase();
        
        // Pattern 1: Company name matches employee name closely
        if (companyName && this.calculateSimilarity(companyName, employeeName) > 0.7) {
          suspiciousReasons.push(`Company name "${companyName}" highly similar to employee "${employeeName}"`);
        }
        
        // Pattern 2: Email prefixes are suspiciously similar
        if (this.calculateSimilarity(emailPrefix, employeeEmailPrefix) > 0.8) {
          suspiciousReasons.push(`Email prefix similarity detected: ${emailPrefix} vs ${employeeEmailPrefix}`);
        }
      }
      
      // Check 2: Rapid succession registration pattern (same day employee + company signup)
      const recentEmployees = employees.filter(emp => {
        const timeDiff = new Date().getTime() - new Date(emp.createdAt).getTime();
        return timeDiff < 24 * 60 * 60 * 1000; // Last 24 hours
      });
      
      if (recentEmployees.length > 0) {
        suspiciousReasons.push(`Rapid succession pattern: ${recentEmployees.length} employee(s) registered in last 24h`);
      }
      
      // Check 3: Company name contains personal indicators
      const personalIndicators = ['personal', 'self', 'freelance', 'individual', 'myself', 'own'];
      const containsPersonalIndicator = personalIndicators.some(indicator => 
        companyName?.toLowerCase().includes(indicator)
      );
      
      if (containsPersonalIndicator) {
        suspiciousReasons.push(`Company name contains personal indicators: "${companyName}"`);
      }
      
      return {
        isSuspicious: suspiciousReasons.length > 0,
        reason: suspiciousReasons.join('; ')
      };
      
    } catch (error) {
      console.error('Error in fraud detection:', error);
      return { isSuspicious: false };
    }
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1.0;
    
    const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    return (maxLen - distance) / maxLen;
  }
  
  /**
   * Levenshtein distance implementation for similarity detection
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Store user data temporarily and send verification email
   */
  static async initiateSignup(
    email: string,
    password: string,
    userType: "employee" | "company",
    userData: any
  ): Promise<{ success: boolean; message: string; token?: string }> {
    try {
      // 🚨 ENHANCED SECURITY: Multi-layer identity verification to prevent self-verification fraud
      
      // Check if email already exists in main tables
      const existingEmployee = await storage.getEmployeeByEmail(email);
      const existingCompany = await storage.getCompanyByEmail(email);
      
      if (existingEmployee || existingCompany) {
        return {
          success: false,
          message: "Email already registered. Please use a different email or login."
        };
      }

      // 🚨 FRAUD DETECTION: Cross-account identity verification
      if (userType === "company") {
        // Check if someone is trying to create a company account with similar personal info
        const companyName = userData.name?.toLowerCase().trim();
        const suspiciousPattern = await this.detectSuspiciousCompanyRegistration(email, companyName, userData);
        
        if (suspiciousPattern.isSuspicious) {
          console.warn(`🚨 Suspicious company registration detected:`, {
            email,
            reason: suspiciousPattern.reason,
            companyName,
            timestamp: new Date()
          });
          
          // For now, just log - later can add admin review
          // return {
          //   success: false,
          //   message: "Your registration requires additional verification. Please contact support."
          // };
        }
      }

      // Check if there's already a pending signup for this email
      let pendingUser = await storage.getPendingUserByEmail(email);
      
      if (pendingUser) {
        // Check if too many resend attempts
        if (pendingUser.resendCount >= this.MAX_RESEND_COUNT) {
          return {
            success: false,
            message: "Too many verification attempts. Please try again in 24 hours."
          };
        }

        // Check if token is still valid
        if (new Date() < pendingUser.tokenExpiry) {
          return {
            success: false,
            message: `Verification email already sent. Please check your email or wait ${Math.ceil((pendingUser.tokenExpiry.getTime() - new Date().getTime()) / 60000)} minutes before requesting a new one.`
          };
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Generate verification token
      const { token, expiry } = this.generateVerificationToken();

      // Store pending user data
      const pendingUserData: InsertPendingUser = {
        email,
        hashedPassword,
        userType,
        userData: userData,
        verificationToken: token,
        tokenExpiry: expiry,
        resendCount: pendingUser ? pendingUser.resendCount + 1 : 0,
      };

      if (pendingUser) {
        // Update existing pending user
        await storage.updatePendingUser(pendingUser.id, pendingUserData);
      } else {
        // Create new pending user
        await storage.createPendingUser(pendingUserData);
      }

      // Send verification email
      const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
      
      const emailSent = await sendEmail({
        to: email,
        from: "noreply@signedwork.com",
        subject: "Verify Your Signedwork Account",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Welcome to Signedwork!</h2>
            <p>Thank you for signing up. Please verify your email address to complete your account setup.</p>
            
            <div style="margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="color: #6b7280; word-break: break-all;">${verificationLink}</p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
              <p>This verification link will expire in ${this.TOKEN_EXPIRY_MINUTES} minutes.</p>
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
          </div>
        `
      });

      if (!emailSent) {
        // For development, show verification link directly when email fails
        console.log(`\n🔗 VERIFICATION LINK (for development): ${verificationLink}\n`);
        return {
          success: true,
          message: `Verification email sent to ${email}. Check your email or use this link: ${verificationLink}`,
          token
        };
      }

      return {
        success: true,
        message: `Verification email sent to ${email}. Please check your email and click the verification link to complete your signup.`,
        token
      };

    } catch (error) {
      console.error("Signup initiation error:", error);
      return {
        success: false,
        message: "Failed to initiate signup. Please try again."
      };
    }
  }

  /**
   * Verify the token and complete account creation
   */
  static async verifySignup(token: string): Promise<{ 
    success: boolean; 
    message: string; 
    user?: any;
    userType?: "employee" | "company";
  }> {
    try {
      // Find pending user by token
      const pendingUser = await storage.getPendingUserByToken(token);
      
      if (!pendingUser) {
        return {
          success: false,
          message: "Invalid verification link. Please request a new verification email."
        };
      }

      // Check if token is expired
      if (new Date() > pendingUser.tokenExpiry) {
        return {
          success: false,
          message: "Verification link has expired. Please request a new verification email."
        };
      }

      // Parse user data - it's already an object from JSONB storage
      const userData = pendingUser.userData;

      // Create the actual user account
      let createdUser;
      
      if (pendingUser.userType === "employee") {
        // Generate employee ID
        const employeeId = `EMP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        createdUser = await storage.createEmployeeWithHashedPassword({
          employeeId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: pendingUser.email,
          phone: userData.phoneNumber || "+1000000000",
          password: pendingUser.hashedPassword,
          emailVerified: true, // Mark as verified since they completed email verification
        });
      } else if (pendingUser.userType === "company") {
        createdUser = await storage.createCompanyWithHashedPassword({
          name: userData.name,
          email: pendingUser.email,
          password: pendingUser.hashedPassword,
          industry: userData.industryType,
          size: userData.companySize || "1-10",
          address: userData.location || "Not Specified",
          city: "Not Specified",
          state: "Not Specified", 
          pincode: "000000",
          establishmentYear: new Date().getFullYear(),
          description: userData.description || null,
          cin: userData.cin || undefined,
          panNumber: userData.panNumber || undefined,
          cinVerificationStatus: "pending" as const,
          panVerificationStatus: "pending" as const,
        });
      } else {
        return {
          success: false,
          message: "Invalid user type."
        };
      }

      // Remove from pending users table
      await storage.deletePendingUser(pendingUser.id);

      // Remove password from response
      const { password: _, ...userResponse } = createdUser;

      return {
        success: true,
        message: "Email verified successfully! Your account has been created and you can now login.",
        user: userResponse,
        userType: pendingUser.userType
      };

    } catch (error) {
      console.error("Signup verification error:", error);
      return {
        success: false,
        message: "Failed to verify signup. Please try again."
      };
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerification(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const pendingUser = await storage.getPendingUserByEmail(email);
      
      if (!pendingUser) {
        return {
          success: false,
          message: "No pending signup found for this email."
        };
      }

      if (pendingUser.resendCount >= this.MAX_RESEND_COUNT) {
        return {
          success: false,
          message: "Too many verification attempts. Please try again in 24 hours."
        };
      }

      // Generate new token
      const { token, expiry } = this.generateVerificationToken();

      // Update pending user with new token
      await storage.updatePendingUser(pendingUser.id, {
        verificationToken: token,
        tokenExpiry: expiry,
        resendCount: pendingUser.resendCount + 1,
      });

      // Send verification email
      const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
      
      const emailSent = await sendEmail(process.env.SENDGRID_API_KEY!, {
        to: email,
        from: "noreply@signedwork.com",
        subject: "Verify Your Signedwork Account",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Verify Your Email</h2>
            <p>Here's your new verification link for your Signedwork account.</p>
            
            <div style="margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="color: #6b7280; word-break: break-all;">${verificationLink}</p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
              <p>This verification link will expire in ${this.TOKEN_EXPIRY_MINUTES} minutes.</p>
              <p>Verification attempts remaining: ${this.MAX_RESEND_COUNT - pendingUser.resendCount}</p>
            </div>
          </div>
        `
      });

      if (!emailSent) {
        return {
          success: false,
          message: "Failed to send verification email. Please try again."
        };
      }

      return {
        success: true,
        message: "Verification email resent successfully. Please check your email."
      };

    } catch (error) {
      console.error("Resend verification error:", error);
      return {
        success: false,
        message: "Failed to resend verification email. Please try again."
      };
    }
  }

  /**
   * Clean up expired pending users (should be run periodically)
   */
  static async cleanupExpiredPendingUsers(): Promise<number> {
    try {
      return await storage.deleteExpiredPendingUsers();
    } catch (error) {
      console.error("Cleanup expired pending users error:", error);
      return 0;
    }
  }
}