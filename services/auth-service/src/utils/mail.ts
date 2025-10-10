import nodemailer from "nodemailer";
import { config } from "../config";
import logger from "../config/logger";

// Validate SMTP configuration before creating transporter
const validateSMTPConfig = () => {
  if (!config.SMTP_EMAIL_USER) {
    throw new Error("SMTP_EMAIL_USER is not configured");
  }
  if (!config.SMTP_EMAIL_PASS) {
    throw new Error("SMTP_EMAIL_PASS is not configured");
  }
  logger.info("SMTP configuration validated successfully");
};

// Validate config on module load
validateSMTPConfig();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.SMTP_EMAIL_USER,
    pass: config.SMTP_EMAIL_PASS,
  },
  // Anti-spam configurations
  pool: true,
  maxConnections: 5,
  maxMessages: 10,
});

// Test the connection on startup
transporter.verify((error, success) => {
  if (error) {
    logger.error("SMTP connection failed:", error);
  } else {
    logger.info("SMTP server is ready to send emails");
  }
});

export const sendOTPEmail = async (
  toEmail: string,
  otp: string,
  name?: string,
): Promise<boolean> => {
  // Validate inputs
  if (!toEmail || !otp) {
    logger.error("Invalid parameters: toEmail and otp are required");
    return false;
  }

  const recipientName = name || "User";

  // Professional, non-spammy subject line
  const subject = "Verification Code for Your Account";

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Verification</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f8f9fa;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #e9ecef;">
                            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                                <span style="color: white; font-size: 24px; font-weight: bold;">🔐</span>
                            </div>
                            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #2c3e50;">Account Verification</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #555555;">
                                Hello ${recipientName},
                            </p>

                            <p style="margin: 0 0 30px 0; font-size: 16px; color: #555555;">
                                We received a request to verify your account. Please use the verification code below to complete your authentication:
                            </p>

                            <!-- OTP Code Box -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="text-align: center; padding: 30px 0;">
                                        <div style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px 40px; border-radius: 10px; box-shadow: 0 4px 15px rgba(245, 87, 108, 0.3);">
                                            <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: bold; color: white; letter-spacing: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                                                ${otp}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 30px 0 20px 0; font-size: 14px; color: #777777; text-align: center;">
                                This verification code will expire in <strong>10 minutes</strong> for your security.
                            </p>

                            <!-- Security Notice -->
                            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0;">
                                <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #856404; display: flex; align-items: center;">
                                    <span style="margin-right: 8px;">⚠️</span>
                                    Security Notice
                                </h3>
                                <p style="margin: 0; font-size: 14px; color: #856404;">
                                    Never share this code with anyone. Our team will never ask for your verification code via phone, email, or text message.
                                </p>
                            </div>

                            <p style="margin: 30px 0 0 0; font-size: 14px; color: #777777;">
                                If you didn't request this verification code, please ignore this email. Your account remains secure.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; border-radius: 0 0 12px 12px;">
                            <p style="margin: 0; font-size: 12px; color: #999999; text-align: center; line-height: 1.5;">
                                This email was sent by ECOM App. If you have any questions, please contact our support team.
                                <br><br>
                                © ${new Date().getFullYear()} ECOM App. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;

  // Clean, professional plain text version
  const textFallback = `
ACCOUNT VERIFICATION

Hello ${recipientName},

We received a request to verify your account. Please use the verification code below:

Verification Code: ${otp}

This code will expire in 10 minutes for your security.

SECURITY NOTICE:
Never share this code with anyone. Our team will never ask for your verification code via phone, email, or text message.

If you didn't request this verification code, please ignore this email. Your account remains secure.

---
ECOM App Support Team
© ${new Date().getFullYear()} ECOM App. All rights reserved.
  `.trim();

  const mailOptions = {
    from: {
      name: "ECOM App",
      address: config.SMTP_EMAIL_USER,
    },
    to: toEmail,
    subject,
    html: htmlContent,
    text: textFallback,
    // Anti-spam headers
    headers: {
      "X-Priority": "3",
      "X-MSMail-Priority": "Normal",
      Importance: "Normal",
      "X-Mailer": "ECOM App Notification System",
      "Reply-To": config.SMTP_EMAIL_USER,
    },
    // Message classification
    category: "verification",
    // Disable click tracking to avoid spam flags
    clickTracking: false,
    openTracking: false,
  };

  try {
    logger.info(`Attempting to send verification email to ${toEmail}`);
    const info = await transporter.sendMail(mailOptions);
    logger.info(
      `Verification email sent successfully to ${toEmail} | Message ID: ${info.messageId}`,
    );
    return true;
  } catch (error) {
    logger.error(`Failed to send verification email to ${toEmail}:`, error);

    // Log specific error details for debugging
    if (error instanceof Error) {
      logger.error(`Error message: ${error.message}`);
      logger.error(`Error stack: ${error.stack}`);
    }

    return false;
  }
};
