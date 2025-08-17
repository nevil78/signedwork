import { users, emails, emailChangeLogs, type User, type Email, type EmailChangeLog } from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, or, lt, ne } from "drizzle-orm";
import { sendEmail } from "./sendgrid";
import crypto from "crypto";

export class SecureEmailService {
  
  // Check if an email is available for registration (not in grace period)
  static async isEmailAvailableForSignup(email: string): Promise<{ available: boolean; reason?: string }> {
    const now = new Date();
    
    // Check if email is currently primary or pending verification
    const activeEmail = await db.select()
      .from(emails)
      .where(
        and(
          eq(emails.email, email),
          or(
            eq(emails.status, "primary"),
            eq(emails.status, "pending_verification")
          )
        )
      )
      .limit(1);

    if (activeEmail.length > 0) {
      return { available: false, reason: "Email is currently in use" };
    }

    // Check if email is in grace period
    const detachedEmail = await db.select()
      .from(emails)
      .where(
        and(
          eq(emails.email, email),
          eq(emails.status, "detached"),
          sql`${emails.graceExpiresAt} > ${now}`
        )
      )
      .limit(1);

    if (detachedEmail.length > 0) {
      const daysLeft = Math.ceil((detachedEmail[0].graceExpiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { 
        available: false, 
        reason: `Email is in ${daysLeft}-day grace period after being detached` 
      };
    }

    return { available: true };
  }

  // Generate a secure verification token
  static generateVerificationToken(): string {
    return crypto.randomUUID();
  }

  // Create a new user with unverified email (delayed verification)
  static async createUserWithUnverifiedEmail(
    email: string, 
    passwordHash: string, 
    accountType: 'employee' | 'company'
  ): Promise<{ user: User; emailRecord: Email }> {
    
    // Check if email is already verified by another user
    const existingVerified = await db.select()
      .from(emails)
      .where(and(
        eq(emails.email, email),
        sql`${emails.verifiedAt} IS NOT NULL`
      ))
      .limit(1);

    if (existingVerified.length > 0) {
      throw new Error("Email is already verified and in use by another account");
    }

    return await db.transaction(async (tx) => {
      // Create user without primary email
      const [user] = await tx.insert(users).values({
        primaryEmail: email, // This will be updated once verified
        passwordHash,
        accountType,
      }).returning();

      // Remove any existing unverified entries for this email
      await tx.delete(emails)
        .where(and(
          eq(emails.email, email),
          sql`${emails.verifiedAt} IS NULL`
        ));

      // Create unverified email record
      const [emailRecord] = await tx.insert(emails).values({
        userId: user.id,
        email,
        status: "unverified",
      }).returning();

      // Log the email initialization
      await tx.insert(emailChangeLogs).values({
        userId: user.id,
        oldEmail: "",
        newEmail: email,
        changeType: 'signup_unverified',
        status: 'pending',
      });

      return { user, emailRecord };
    });
  }

  // Update unverified email (allowed until first verification)
  static async updateUnverifiedEmail(
    userId: string, 
    newEmail: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<Email> {
    // Check if user has any verified emails
    const verifiedEmails = await db.select()
      .from(emails)
      .where(and(
        eq(emails.userId, userId),
        sql`${emails.verifiedAt} IS NOT NULL`
      ))
      .limit(1);

    if (verifiedEmails.length > 0) {
      throw new Error("Cannot freely edit email - you have verified emails. Use secure change flow instead.");
    }

    // Check if new email is already verified by another user
    const existingVerified = await db.select()
      .from(emails)
      .where(and(
        eq(emails.email, newEmail),
        sql`${emails.verifiedAt} IS NOT NULL`,
        ne(emails.userId, userId)
      ))
      .limit(1);

    if (existingVerified.length > 0) {
      throw new Error("Email is already verified and in use by another account");
    }

    return await db.transaction(async (tx) => {
      // Get current unverified email
      const currentEmail = await tx.select()
        .from(emails)
        .where(and(
          eq(emails.userId, userId),
          sql`${emails.verifiedAt} IS NULL`
        ))
        .limit(1);

      const oldEmail = currentEmail[0]?.email;

      // Remove any existing unverified entries for this email
      await tx.delete(emails)
        .where(and(
          eq(emails.email, newEmail),
          sql`${emails.verifiedAt} IS NULL`
        ));

      // Update the user's unverified email
      const [updatedEmail] = await tx.update(emails)
        .set({
          email: newEmail,
          updatedAt: new Date(),
        })
        .where(and(
          eq(emails.userId, userId),
          sql`${emails.verifiedAt} IS NULL`
        ))
        .returning();

      // Update user's primary email field
      await tx.update(users)
        .set({ primaryEmail: newEmail })
        .where(eq(users.id, userId));

      // Log the email update
      await tx.insert(emailChangeLogs).values({
        userId,
        oldEmail: oldEmail || "",
        newEmail,
        changeType: 'update_unverified',
        status: 'pending',
        ipAddress,
        userAgent,
      });

      return updatedEmail;
    });
  }

  // Trigger email verification when required (before critical actions)
  static async requireEmailVerification(userId: string): Promise<{ requiresVerification: boolean; verificationToken?: string }> {
    // Check if user has any verified emails
    const verifiedEmails = await db.select()
      .from(emails)
      .where(and(
        eq(emails.userId, userId),
        sql`${emails.verifiedAt} IS NOT NULL`
      ))
      .limit(1);

    if (verifiedEmails.length > 0) {
      return { requiresVerification: false };
    }

    // Get user's current unverified email
    const unverifiedEmail = await db.select()
      .from(emails)
      .where(and(
        eq(emails.userId, userId),
        sql`${emails.verifiedAt} IS NULL`
      ))
      .limit(1);

    if (unverifiedEmail.length === 0) {
      throw new Error("No email found for user");
    }

    const emailRecord = unverifiedEmail[0];
    
    // Generate verification token and expiry
    const verificationToken = this.generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update email with verification token
    await db.update(emails)
      .set({
        verificationToken,
        verificationExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(emails.id, emailRecord.id));

    // Send verification email
    await this.sendDelayedVerificationEmail(emailRecord.email, verificationToken);

    // Log the verification requirement
    await db.insert(emailChangeLogs).values({
      userId,
      oldEmail: emailRecord.email,
      newEmail: emailRecord.email,
      changeType: 'verification_required',
      status: 'pending',
      verificationToken,
    });

    return { requiresVerification: true, verificationToken };
  }

  // Verify email and make it primary (first-time verification)
  static async verifyEmailAndMakePrimary(
    verificationToken: string, 
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; user?: User }> {
    
    const now = new Date();

    return await db.transaction(async (tx) => {
      // Find the email record with this verification token
      const emailRecord = await tx.select()
        .from(emails)
        .where(
          and(
            eq(emails.verificationToken, verificationToken),
            eq(emails.email, email),
            sql`${emails.verifiedAt} IS NULL`,
            sql`${emails.verificationExpiresAt} > ${now}`
          )
        )
        .limit(1);

      if (emailRecord.length === 0) {
        return { success: false };
      }

      const email_record = emailRecord[0];

      // Get the user
      const [user] = await tx.select()
        .from(users)
        .where(eq(users.id, email_record.userId))
        .limit(1);

      if (!user) {
        return { success: false };
      }

      // Update email status to primary
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
      await tx.update(users)
        .set({
          primaryEmail: email,
          updatedAt: now,
        })
        .where(eq(users.id, user.id));

      // Log the verification
      await tx.insert(emailChangeLogs).values({
        userId: user.id,
        oldEmail: user.primaryEmail,
        newEmail: email,
        changeType: "verification_completed",
        ipAddress,
        userAgent,
        verificationToken,
        status: "verified",
      });

      return { success: true, user };
    });
  }

  // Request email change with security checks
  static async requestEmailChange(
    userId: string,
    newEmail: string,
    currentPassword: string,
    twoFactorCode?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; verificationToken?: string; error?: string }> {
    
    // Check if new email is available
    const availability = await this.isEmailAvailableForSignup(newEmail);
    if (!availability.available) {
      return { success: false, error: availability.reason };
    }

    // Get user and verify password
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // TODO: Add password verification here (would need bcrypt.compare)
    // TODO: Add 2FA verification if enabled

    const verificationToken = this.generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return await db.transaction(async (tx) => {
      // Create new email record with pending verification
      await tx.insert(emails).values({
        userId,
        email: newEmail,
        status: "pending_verification",
        verificationToken,
        verificationExpiresAt: expiresAt,
      });

      // Log the change request
      await tx.insert(emailChangeLogs).values({
        userId,
        oldEmail: user.primaryEmail,
        newEmail,
        changeType: "verification_requested",
        ipAddress,
        userAgent,
        twoFactorUsed: !!twoFactorCode,
        verificationToken,
        status: "pending",
      });

      // Send verification email to new address
      await this.sendEmailChangeVerification(newEmail, verificationToken);
      
      // Send notification to old email
      await this.sendEmailChangeNotification(user.primaryEmail, newEmail);

      return { success: true, verificationToken };
    });
  }

  // Complete email change after verification
  static async completeEmailChange(
    verificationToken: string,
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; user?: User }> {
    
    const now = new Date();

    return await db.transaction(async (tx) => {
      // Find pending email verification
      const emailRecord = await tx.select()
        .from(emails)
        .where(
          and(
            eq(emails.verificationToken, verificationToken),
            eq(emails.email, email),
            eq(emails.status, "pending_verification"),
            sql`${emails.verificationExpiresAt} > ${now}`
          )
        )
        .limit(1);

      if (emailRecord.length === 0) {
        return { success: false };
      }

      const newEmailRecord = emailRecord[0];

      // Get user
      const [user] = await tx.select()
        .from(users)
        .where(eq(users.id, newEmailRecord.userId))
        .limit(1);

      if (!user) {
        return { success: false };
      }

      // Get current primary email
      const [currentPrimaryEmail] = await tx.select()
        .from(emails)
        .where(
          and(
            eq(emails.userId, user.id),
            eq(emails.status, "primary")
          )
        )
        .limit(1);

      // Detach current primary email
      if (currentPrimaryEmail) {
        const graceExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        
        await tx.update(emails)
          .set({
            status: "detached",
            detachedAt: now,
            graceExpiresAt,
            updatedAt: now,
          })
          .where(eq(emails.id, currentPrimaryEmail.id));
      }

      // Make new email primary
      await tx.update(emails)
        .set({
          status: "primary",
          verifiedAt: now,
          verificationToken: null,
          verificationExpiresAt: null,
          updatedAt: now,
        })
        .where(eq(emails.id, newEmailRecord.id));

      // Update user's primary email
      await tx.update(users)
        .set({
          primaryEmail: email,
          updatedAt: now,
        })
        .where(eq(users.id, user.id));

      // Update change log
      await tx.update(emailChangeLogs)
        .set({
          status: "verified",
        })
        .where(eq(emailChangeLogs.verificationToken, verificationToken));

      // Log the completion
      await tx.insert(emailChangeLogs).values({
        userId: user.id,
        oldEmail: user.primaryEmail,
        newEmail: email,
        changeType: "primary_change",
        ipAddress,
        userAgent,
        status: "verified",
      });

      return { success: true, user };
    });
  }

  // Clean up expired grace periods
  static async cleanupExpiredGracePeriods(): Promise<void> {
    const now = new Date();
    
    await db.delete(emails)
      .where(
        and(
          eq(emails.status, "detached"),
          lt(emails.graceExpiresAt, now)
        )
      );
  }

  // Send email change verification
  private static async sendEmailChangeVerification(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/verify-email-change?token=${token}&email=${encodeURIComponent(email)}`;
    
    const subject = "Verify Your New Email Address - Signedwork";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Verify Your New Email Address</h2>
        <p>You requested to change your email address on Signedwork. Please click the link below to verify your new email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify New Email</a>
        </div>
        <p><strong>Important Security Information:</strong></p>
        <ul>
          <li>This link expires in 24 hours</li>
          <li>Once verified, this email will become your primary login email</li>
          <li>Your old email will be detached and cannot be used for 30 days</li>
        </ul>
        <p style="color: #666; font-size: 14px;">If you didn't request this change, please contact our support immediately.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      from: "noreply@signedwork.com",
      subject,
      html,
    });
  }

  // Send delayed verification email (when verification is required)
  private static async sendDelayedVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
    
    const subject = "Verify Your Email Address - Signedwork";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Email Verification Required</h2>
        <p>To proceed with critical actions on Signedwork (applying to jobs, submitting work, receiving payments), you need to verify your email address.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email Address</a>
        </div>
        <p><strong>Important:</strong></p>
        <ul>
          <li>This link expires in 24 hours</li>
          <li>Once verified, this email becomes your locked primary email</li>
          <li>Changes to verified emails require password + 2FA confirmation</li>
        </ul>
        <p style="color: #666; font-size: 14px;">If you didn't request this verification, please ignore this email.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      from: "noreply@signedwork.com",
      subject,
      html,
    });
  }

  // Send notification to old email
  private static async sendEmailChangeNotification(oldEmail: string, newEmail: string): Promise<void> {
    const subject = "Email Change Request - Signedwork Security Alert";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Security Alert: Email Change Request</h2>
        <p>Someone requested to change the email address for your Signedwork account from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>.</p>
        
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #dc2626; margin: 0 0 10px 0;">What happens next:</h3>
          <ul style="margin: 0; color: #666;">
            <li>A verification email was sent to the new address</li>
            <li>If verified, your login email will change</li>
            <li>This email (${oldEmail}) will be detached for 30 days</li>
          </ul>
        </div>

        <p><strong>If you didn't request this change:</strong></p>
        <ol>
          <li>Change your password immediately</li>
          <li>Enable 2FA if not already active</li>
          <li>Contact our support team</li>
        </ol>
        
        <p style="color: #666; font-size: 14px;">This is an automated security notification from Signedwork.</p>
      </div>
    `;

    await sendEmail({
      to: oldEmail,
      from: "security@signedwork.com",
      subject,
      html,
    });
  }

  // Get email change history for a user
  static async getEmailChangeHistory(userId: string): Promise<EmailChangeLog[]> {
    return await db.select()
      .from(emailChangeLogs)
      .where(eq(emailChangeLogs.userId, userId))
      .orderBy(sql`${emailChangeLogs.timestamp} DESC`);
  }

  // Get all emails for a user
  static async getUserEmails(userId: string): Promise<Email[]> {
    return await db.select()
      .from(emails)
      .where(eq(emails.userId, userId))
      .orderBy(sql`${emails.createdAt} DESC`);
  }
}