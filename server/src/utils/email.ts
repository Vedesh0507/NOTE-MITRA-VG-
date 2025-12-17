import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  // Use environment variables for email configuration
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('⚠️  Email credentials not configured. Password reset emails will not be sent.');
    console.warn('   Set SMTP_USER and SMTP_PASS environment variables.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });
};

let transporter: nodemailer.Transporter | null = null;

// Initialize transporter
export const initEmailService = () => {
  transporter = createTransporter();
  if (transporter) {
    console.log('✅ Email service initialized');
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  userName: string
): Promise<boolean> => {
  if (!transporter) {
    console.error('Email service not configured');
    // In development, log the reset link instead
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    console.log('📧 Password Reset Email (Development Mode):');
    console.log(`   To: ${email}`);
    console.log(`   Reset URL: ${resetUrl}`);
    console.log('   Token expires in 15 minutes');
    return true; // Return true in dev mode so the flow continues
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"NoteMitra" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Password Reset Request - NoteMitra',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">NoteMitra</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Password Reset Request</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Hello <strong>${userName}</strong>,</p>
          
          <p>We received a request to reset your password for your NoteMitra account. If you didn't make this request, you can safely ignore this email.</p>
          
          <p>To reset your password, click the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea; font-size: 14px;">${resetUrl}</p>
          
          <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              ⚠️ This link will expire in <strong>15 minutes</strong> for security reasons.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            If you didn't request a password reset, please ignore this email or contact support if you have concerns.
          </p>
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} NoteMitra. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${userName},

We received a request to reset your password for your NoteMitra account.

To reset your password, visit the following link:
${resetUrl}

This link will expire in 15 minutes for security reasons.

If you didn't request a password reset, please ignore this email.

© ${new Date().getFullYear()} NoteMitra. All rights reserved.
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    return false;
  }
};

// Export for testing
export { transporter };
