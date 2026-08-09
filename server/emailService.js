import nodemailer from "nodemailer";

/**
 * Transactional Email Service (Gmail SMTP / Brevo API / Fallback)
 * Sends OTP verification emails to Gmail / Email accounts.
 */
export async function sendOtpEmail({ recipientEmail, recipientName, otpCode, purpose = "Verification" }) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER || gmailUser;
  const smtpPass = process.env.SMTP_PASS || gmailPass;

  const brevoApiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SENDER_EMAIL || gmailUser || "noreply@pharmacare.com";
  const senderName = process.env.BREVO_SENDER_NAME || "PharmaCare Security";

  if (!recipientEmail || !recipientEmail.includes("@")) {
    console.log(`[EmailService] Skipping invalid email recipient: ${recipientEmail}`);
    return { success: false, reason: "Invalid email recipient" };
  }

  const subject = `Your PharmaCare ${purpose} Code: ${otpCode}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #087EA4; margin: 0;">PharmaCare Health</h2>
        <p style="color: #64748B; font-size: 14px; margin-top: 4px;">Express Digital Pharmacy & Security</p>
      </div>
      <div style="background-color: #F8FAFC; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #334155;">Use the following One-Time Password (OTP) to complete your ${purpose.toLowerCase()}:</p>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #087EA4; font-family: monospace; margin: 12px 0;">${otpCode}</div>
        <p style="margin: 0; font-size: 12px; color: #94A3B8;">This code is valid for 10 minutes. Do not share this code with anyone.</p>
      </div>
      <p style="font-size: 12px; color: #64748B; text-align: center; margin: 0;">
        © 2026 PharmaCare digital health platform. Authorized transactional email.
      </p>
    </div>
  `;

  // 1. Try Nodemailer / Gmail SMTP if credentials exist
  if (gmailUser || smtpHost) {
    try {
      const transporter = nodemailer.createTransport(
        gmailUser
          ? {
              service: "gmail",
              auth: {
                user: gmailUser,
                pass: gmailPass,
              },
            }
          : {
              host: smtpHost,
              port: Number(smtpPort),
              secure: Number(smtpPort) === 465,
              auth: {
                user: smtpUser,
                pass: smtpPass,
              },
            }
      );

      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: recipientEmail,
        subject,
        html: htmlContent,
      });

      console.log(`[Gmail/SMTP] OTP Email successfully delivered to ${recipientEmail}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error("[Nodemailer SMTP Error] Failed to send email:", err);
    }
  }

  // 2. Try Brevo API if configured
  if (brevoApiKey) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: recipientEmail, name: recipientName || recipientEmail.split("@")[0] }],
          subject,
          htmlContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[Brevo] OTP Email successfully delivered to ${recipientEmail}. MessageId: ${data.messageId}`);
        return { success: true, messageId: data.messageId };
      } else {
        const errText = await response.text();
        console.error(`[Brevo API Error] ${response.status}: ${errText}`);
        return { success: false, error: errText };
      }
    } catch (err) {
      console.error("[Brevo Request Failed]", err);
      return { success: false, error: err.message };
    }
  }

  console.log(`[EmailService] OTP code for ${recipientEmail}: [${otpCode}] (Configure GMAIL_USER & GMAIL_APP_PASSWORD in .env for direct Gmail delivery)`);
  return { success: true, devMode: true };
}

