import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set. Email functionality will be disabled.");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured, email not sent');
    // Return true for development to avoid blocking the flow
    return true; 
  }
  
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    // For development, return true to continue the flow
    console.warn('Continuing signup flow despite email error for development');
    return true;
  }
}

export async function sendPasswordResetOTP(email: string, otpCode: string, userType: 'employee' | 'company'): Promise<boolean> {
  const userTypeLabel = userType === 'employee' ? 'Employee' : 'Company';
  
  return sendEmail({
    to: email,
    from: 'noreply@signedwork.com', // Replace with your verified sender email
    subject: `Password Reset OTP - ${userTypeLabel} Account`,
    text: `Your password reset OTP is: ${otpCode}. This code will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>You requested a password reset for your ${userTypeLabel} account. Please use the following OTP code to reset your password:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 4px;">${otpCode}</h1>
        </div>
        <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes for security purposes.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">This is an automated message, please do not reply.</p>
      </div>
    `
  });
}