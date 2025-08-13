import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

export interface EmailOTPParams {
  to: string;
  firstName: string;
  otpCode: string;
  purpose: 'password_reset' | 'email_verification';
}

export async function sendOTPEmail(params: EmailOTPParams): Promise<boolean> {
  try {
    const { to, firstName, otpCode, purpose } = params;
    
    const subject = purpose === 'password_reset' 
      ? 'Password Reset Verification Code'
      : 'Email Verification Code';
      
    const purposeText = purpose === 'password_reset'
      ? 'reset your password'
      : 'verify your email address';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Signedwork</h1>
        </div>
        
        <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hi ${firstName}!</h2>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            You requested to ${purposeText}. Please use the verification code below:
          </p>
          
          <div style="background: #f8f9fa; border: 2px dashed #dee2e6; padding: 25px; text-align: center; margin: 30px 0; border-radius: 8px;">
            <div style="font-size: 32px; font-weight: bold; color: #495057; letter-spacing: 5px; font-family: 'Courier New', monospace;">
              ${otpCode}
            </div>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
            This code will expire in <strong>15 minutes</strong> for security reasons.
          </p>
          
          <p style="font-size: 14px; color: #666; margin-bottom: 30px;">
            If you didn't request this verification code, please ignore this email. Your account remains secure.
          </p>
          
          <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 40px;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              This is an automated message from Signedwork. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Hi ${firstName}!

You requested to ${purposeText}. Please use the verification code below:

${otpCode}

This code will expire in 15 minutes for security reasons.

If you didn't request this verification code, please ignore this email. Your account remains secure.

---
This is an automated message from Professional Network. Please do not reply to this email.
    `;

    // Use environment variable for verified sender or fallback
    const fromEmail = process.env.SENDGRID_VERIFIED_SENDER || 'noreply@signedwork.com';
    
    const emailPayload = {
      to,
      from: fromEmail,
      subject,
      text: textContent,
      html: htmlContent,
    };

    console.log(`Attempting to send OTP email to ${to} from ${fromEmail} for ${purpose}`);
    
    const response = await mailService.send(emailPayload);
    
    console.log(`SendGrid response:`, {
      statusCode: response[0]?.statusCode,
      headers: response[0]?.headers?.['x-message-id'] ? 'Message ID present' : 'No Message ID',
      to,
      subject
    });

    console.log(`OTP email sent successfully to ${to} for ${purpose}`);
    return true;
  } catch (error: any) {
    console.error('SendGrid email error:', {
      message: error.message,
      code: error.code,
      response: error.response?.body || 'No response body',
      to: params.to,
      from: process.env.SENDGRID_VERIFIED_SENDER || 'noreply@signedwork.com'
    });
    return false;
  }
}

// Generate a 6-digit OTP code
export function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Check if OTP is expired (15 minutes)
export function isOTPExpired(createdAt: Date): boolean {
  const now = new Date();
  const diffInMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
  return diffInMinutes > 15;
}