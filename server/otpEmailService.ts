import { db } from "./db";
import { emails, emailChangeLogs, employees, companies } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { sendEmail } from "./sendgrid";
import crypto from "crypto";

export class OTPEmailService {
  // Generate a 6-digit OTP code
  private static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate verification token
  private static generateVerificationToken(): string {
    return crypto.randomUUID();
  }

  // Send OTP verification email
  private static async sendOTPVerificationEmail(email: string, otp: string, userType: 'employee' | 'company'): Promise<void> {
    const subject = "Verify Your Email Address - Signedwork";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">Signedwork</h1>
          <h2 style="color: #374151; margin: 10px 0;">Email Verification</h2>
        </div>
        
        <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0;">Your Verification Code</h3>
          <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 6px; font-family: 'Courier New', monospace;">
            ${otp}
          </div>
          <p style="color: #6b7280; margin: 15px 0 0 0; font-size: 14px;">
            This code expires in 10 minutes
          </p>
        </div>

        <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
          <h4 style="color: #92400e; margin: 0 0 10px 0;">Important Security Notice</h4>
          <ul style="color: #92400e; margin: 0; padding-left: 20px; font-size: 14px;">
            <li>Never share this OTP code with anyone</li>
            <li>Signedwork will never ask for your OTP via phone or email</li>
            <li>If you didn't request this verification, please ignore this email</li>
          </ul>
        </div>

        <div style="text-align: center;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Having trouble? Contact our support team at support@signedwork.com
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      to: email,
      from: "noreply@signedwork.com",
      subject,
      html,
    });
  }

  // Send OTP for email verification
  static async sendEmailVerificationOTP(
    userId: string, 
    email: string, 
    userType: 'employee' | 'company'
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if email is already verified by another user
      const existingVerified = await db.select()
        .from(emails)
        .where(and(
          eq(emails.email, email),
          sql`${emails.verifiedAt} IS NOT NULL`
        ))
        .limit(1);

      if (existingVerified.length > 0 && existingVerified[0].userId !== userId) {
        return { 
          success: false, 
          message: "This email is already verified by another account" 
        };
      }

      // Generate OTP and expiry (10 minutes)
      const otp = this.generateOTP();
      const verificationToken = this.generateVerificationToken();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Update or create email record
      const existingEmail = await db.select()
        .from(emails)
        .where(and(
          eq(emails.userId, userId),
          eq(emails.email, email)
        ))
        .limit(1);

      if (existingEmail.length > 0) {
        // Update existing email record
        await db.update(emails)
          .set({
            verificationToken: otp, // Store OTP as verification token
            verificationExpiresAt: expiresAt,
            status: "pending_verification",
            updatedAt: new Date(),
          })
          .where(eq(emails.id, existingEmail[0].id));
      } else {
        // Create new email record
        await db.insert(emails).values({
          userId,
          email,
          status: "pending_verification",
          verificationToken: otp,
          verificationExpiresAt: expiresAt,
        });
      }

      // Send OTP email
      await this.sendOTPVerificationEmail(email, otp, userType);

      // Log the OTP request
      await db.insert(emailChangeLogs).values({
        userId,
        oldEmail: existingEmail[0]?.email || "",
        newEmail: email,
        changeType: 'otp_verification_sent',
        status: 'pending',
        verificationToken: otp,
      });

      return { 
        success: true, 
        message: "Verification code sent to your email. Please check your inbox." 
      };
    } catch (error) {
      console.error("Send OTP error:", error);
      return { 
        success: false, 
        message: "Failed to send verification code. Please try again." 
      };
    }
  }

  // Verify OTP and activate email
  static async verifyEmailOTP(
    userId: string,
    email: string,
    otp: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const now = new Date();

      // Find email record with matching OTP
      const emailRecord = await db.select()
        .from(emails)
        .where(and(
          eq(emails.userId, userId),
          eq(emails.email, email),
          eq(emails.verificationToken, otp),
          sql`${emails.verificationExpiresAt} > ${now}`
        ))
        .limit(1);

      if (emailRecord.length === 0) {
        return { 
          success: false, 
          message: "Invalid or expired verification code" 
        };
      }

      const email_record = emailRecord[0];

      return await db.transaction(async (tx) => {
        // Mark email as verified
        await tx.update(emails)
          .set({
            status: "primary",
            verifiedAt: now,
            verificationToken: null,
            verificationExpiresAt: null,
            updatedAt: now,
          })
          .where(eq(emails.id, email_record.id));

        // Update user's primary email
        if (await this.isEmployee(email_record.userId)) {
          await tx.update(employees)
            .set({ 
              email: email,
              updatedAt: now,
            })
            .where(eq(employees.id, email_record.userId));
        } else {
          await tx.update(companies)
            .set({ 
              email: email,
              updatedAt: now,
            })
            .where(eq(companies.id, email_record.userId));
        }

        // Log successful verification
        await tx.insert(emailChangeLogs).values({
          userId: email_record.userId,
          oldEmail: email_record.email,
          newEmail: email,
          changeType: 'otp_verification_completed',
          status: 'verified',
          verificationToken: otp,
          ipAddress,
          userAgent,
        });

        return { 
          success: true, 
          message: "Email verified successfully!" 
        };
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      return { 
        success: false, 
        message: "Verification failed. Please try again." 
      };
    }
  }

  // Check if user is employee (helper method)
  private static async isEmployee(userId: string): Promise<boolean> {
    const employee = await db.select()
      .from(employees)
      .where(eq(employees.id, userId))
      .limit(1);
    return employee.length > 0;
  }

  // Resend OTP verification code
  static async resendEmailVerificationOTP(
    userId: string,
    email: string,
    userType: 'employee' | 'company'
  ): Promise<{ success: boolean; message: string }> {
    return await this.sendEmailVerificationOTP(userId, email, userType);
  }

  // Get email verification status
  static async getEmailVerificationStatus(userId: string, email: string): Promise<{
    isVerified: boolean;
    hasPendingVerification: boolean;
    canResend: boolean;
    timeUntilResend?: number;
  }> {
    try {
      const emailRecord = await db.select()
        .from(emails)
        .where(and(
          eq(emails.userId, userId),
          eq(emails.email, email)
        ))
        .limit(1);

      if (emailRecord.length === 0) {
        return {
          isVerified: false,
          hasPendingVerification: false,
          canResend: true
        };
      }

      const record = emailRecord[0];
      const isVerified = !!record.verifiedAt;
      const hasPendingVerification = record.status === "pending_verification" && 
                                   record.verificationExpiresAt && 
                                   record.verificationExpiresAt > new Date();

      // Check if can resend (wait 1 minute between sends)
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const canResend = !record.updatedAt || record.updatedAt < oneMinuteAgo;
      const timeUntilResend = canResend ? 0 : 60 - Math.floor((Date.now() - (record.updatedAt?.getTime() || 0)) / 1000);

      return {
        isVerified,
        hasPendingVerification,
        canResend: !!canResend,
        timeUntilResend
      };
    } catch (error) {
      console.error("Get verification status error:", error);
      return {
        isVerified: false,
        hasPendingVerification: false,
        canResend: true
      };
    }
  }
}