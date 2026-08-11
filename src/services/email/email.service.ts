import axios from "axios";

export const emailService = {
  sendPortalInvitationEmail: async (toEmail: string, recipientName: string, inviteUrl: string, role: "teacher" | "student"): Promise<boolean> => {
    const roleLabel = role === "teacher" ? "Teacher Portal" : "Student Portal";
    const subject = `TuitionPro ${roleLabel} invitation`;
    const html = `<p>Hello ${recipientName},</p><p>Your institute has enabled access to the ${roleLabel}.</p><p><a href="${inviteUrl}">Set your password and activate your account</a></p><p>This secure link expires in 72 hours and can be used once.</p>`;
    if (process.env.RESEND_API_KEY) {
      try {
        await axios.post("https://api.resend.com/emails", { from: "TuitionPro <onboarding@resend.dev>", to: [toEmail], subject, html }, { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } });
        return true;
      } catch (err: any) {
        console.warn("[EmailService] Portal invitation email failed:", err?.response?.data || err?.message);
      }
    }
    console.log(`[PORTAL INVITATION] To: ${toEmail} | ${inviteUrl}`);
    return true;
  },
  /**
   * Helper to get Google OAuth2 Access Token using Refresh Token
   */
  getGoogleAccessToken: async (): Promise<string | null> => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return null;
    }

    try {
      const res = await axios.post("https://oauth2.googleapis.com/token", {
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      });

      return res.data?.access_token || null;
    } catch (err: any) {
      console.warn("Failed to get Google Access Token:", err?.response?.data || err?.message || err);
      return null;
    }
  },

  /**
   * Send Email OTP via Google Gmail REST API, Resend API, or Console Fallback
   */
  sendOtpEmail: async (toEmail: string, otpCode: string, recipientName?: string): Promise<boolean> => {
    const senderEmail = process.env.GMAIL_SENDER_EMAIL || process.env.SMTP_USER || "noreply@tuitionpro.app";

    const subject = `🔐 Your TuitionPro Login OTP Code: ${otpCode}`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 900;">TuitionPro</h2>
          <p style="color: #64748b; font-size: 12px; margin-top: 4px;">Tuition & Coaching Platform</p>
        </div>

        <div style="background-color: #f8fafc; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 20px; border: 1px solid #cbd5e1;">
          <p style="color: #334155; font-size: 14px; font-weight: 600; margin-top: 0;">Hello ${recipientName || "User"},</p>
          <p style="color: #64748b; font-size: 12px; margin-bottom: 16px;">Use the verification code below to log in to your TuitionPro Account:</p>
          <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #4f46e5; background: #e0e7ff; padding: 12px 24px; border-radius: 8px; display: inline-block; font-family: monospace;">
            ${otpCode}
          </div>
          <p style="color: #94a3b8; font-size: 11px; margin-top: 16px; margin-bottom: 0;">This OTP is valid for 5 minutes. Do not share it with anyone.</p>
        </div>

        <div style="text-align: center; font-size: 11px; color: #94a3b8;">
          <p style="margin: 0;">© 2026 TuitionPro SaaS. All rights reserved.</p>
        </div>
      </div>
    `;

    // Strategy 1: Resend HTTP REST API (if RESEND_API_KEY set)
    if (process.env.RESEND_API_KEY) {
      try {
        await axios.post(
          "https://api.resend.com/emails",
          {
            from: "TuitionPro <onboarding@resend.dev>",
            to: [toEmail],
            subject: subject,
            html: htmlBody,
          },
          { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } }
        );
        console.log(`[EmailService] OTP Email sent successfully via Resend API to ${toEmail}`);
        return true;
      } catch (err: any) {
        console.warn("[EmailService] Resend API failed:", err?.response?.data || err?.message);
      }
    }

    // Strategy 2: Google OAuth2 Gmail REST API
    const accessToken = await emailService.getGoogleAccessToken();
    if (accessToken) {
      try {
        // RFC 2047 encode the subject so emojis appear correctly in email clients
        const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;

        const rawMessage = [
          `MIME-Version: 1.0`,
          `From: "TuitionPro Platform" <${senderEmail}>`,
          `To: ${toEmail}`,
          `Subject: ${encodedSubject}`,
          `Content-Type: text/html; charset=UTF-8`,
          `Content-Transfer-Encoding: quoted-printable`,
          ``,
          htmlBody,
        ].join("\r\n");

        const encodedMessage = Buffer.from(rawMessage, "utf-8")
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        await axios.post(
          "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
          { raw: encodedMessage },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        console.log(`[EmailService] OTP Email sent successfully via Gmail API to ${toEmail}`);
        return true;
      } catch (err: any) {
        console.warn("[EmailService] Gmail API send failed (Scope Permission Error):", err?.response?.data || err?.message || err);
      }
    }

    // Fallback Logger for local testing
    console.log(`\n==============================================`);
    console.log(`📩 [LOGIN OTP CODE] To: ${toEmail} | Code: ${otpCode}`);
    console.log(`==============================================\n`);
    return true;
  },

  /**
   * Send Welcome Email with Auto-Generated Login Credentials to new Student or Teacher
   */
  sendWelcomeCredentialsEmail: async (
    toEmail: string,
    name: string,
    loginEmail: string,
    password: string,
    role: "student" | "teacher",
    instituteCode?: string
  ): Promise<boolean> => {
    const senderEmail = process.env.GMAIL_SENDER_EMAIL || "noreply@tuitionpro.app";
    const isStudent = role === "student";

    const subject = isStudent
      ? `🎓 Welcome to TuitionPro! Your Student Login Credentials`
      : `👨‍🏫 Welcome to TuitionPro! Your Teacher Login Credentials`;

    const roleLabel = isStudent ? "Student Portal" : "Teacher Dashboard";
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    const accentColor = isStudent ? "#6366f1" : "#0ea5e9";
    const bgLight = isStudent ? "#e0e7ff" : "#e0f2fe";

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: ${accentColor}; margin: 0; font-size: 22px; font-weight: 900;">TuitionPro</h2>
          <p style="color: #64748b; font-size: 12px; margin-top: 4px;">Tuition & Coaching Management Platform</p>
        </div>

        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
          <p style="color: #1e293b; font-size: 15px; font-weight: 700; margin-top: 0;">Hello ${name}! 👋</p>
          <p style="color: #475569; font-size: 13px; margin-bottom: 20px;">
            ${isStudent
              ? "Your student account has been created by your tuition teacher. Use the credentials below to log in to your Student Portal."
              : "Your teacher account has been created. Use the credentials below to log in to your Teacher Dashboard."
            }
          </p>

          <div style="background: ${bgLight}; border-radius: 10px; padding: 16px; margin-bottom: 8px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Login Credentials</p>
            ${instituteCode ? `
            <div style="margin-bottom: 10px;">
              <span style="font-size: 11px; color: #64748b; font-weight: 600;">🏢 Institute Code (8-Character):</span>
              <div style="font-size: 15px; font-weight: 900; color: #4338ca; font-family: monospace; margin-top: 3px; letter-spacing: 2px;">${instituteCode}</div>
            </div>
            ` : ""}
            <div style="margin-bottom: 10px;">
              <span style="font-size: 11px; color: #64748b; font-weight: 600;">📧 Email / Login ID:</span>
              <div style="font-size: 14px; font-weight: 900; color: ${accentColor}; font-family: monospace; margin-top: 3px;">${loginEmail}</div>
            </div>
            <div>
              <span style="font-size: 11px; color: #64748b; font-weight: 600;">🔐 Password:</span>
              <div style="font-size: 18px; font-weight: 900; color: #1e293b; font-family: monospace; letter-spacing: 3px; margin-top: 3px;">${password}</div>
            </div>
          </div>

          <p style="color: #94a3b8; font-size: 11px; margin-top: 12px; margin-bottom: 0;">
            ⚠️ Please change your password after your first login.
          </p>
        </div>

        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${loginUrl}" style="display: inline-block; background-color: ${accentColor}; color: #ffffff; font-size: 13px; font-weight: 700; padding: 12px 28px; border-radius: 10px; text-decoration: none;">
            Login to ${roleLabel} →
          </a>
        </div>

        <div style="text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} TuitionPro SaaS. All rights reserved.</p>
        </div>
      </div>
    `;

    // Strategy 1: Resend API
    if (process.env.RESEND_API_KEY) {
      try {
        const axios = (await import("axios")).default;
        await axios.post(
          "https://api.resend.com/emails",
          { from: "TuitionPro <onboarding@resend.dev>", to: [toEmail], subject, html: htmlBody },
          { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } }
        );
        console.log(`[EmailService] Welcome Credentials Email sent via Resend to ${toEmail}`);
        return true;
      } catch (err: any) {
        console.warn("[EmailService] Resend welcome email failed:", err?.response?.data || err?.message);
      }
    }

    // Strategy 2: Gmail OAuth2 API
    const accessToken = await emailService.getGoogleAccessToken();
    if (accessToken) {
      try {
        const axios = (await import("axios")).default;

        // RFC 2047 encode the subject so emojis appear correctly in email clients
        const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;

        const rawMessage = [
          `MIME-Version: 1.0`,
          `From: "TuitionPro Platform" <${senderEmail}>`,
          `To: ${toEmail}`,
          `Subject: ${encodedSubject}`,
          `Content-Type: text/html; charset=UTF-8`,
          `Content-Transfer-Encoding: quoted-printable`,
          ``,
          htmlBody,
        ].join("\r\n");

        const encodedMessage = Buffer.from(rawMessage, "utf-8")
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        await axios.post(
          "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
          { raw: encodedMessage },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        console.log(`[EmailService] Welcome Credentials Email sent via Gmail API to ${toEmail}`);
        return true;
      } catch (err: any) {
        console.warn("[EmailService] Gmail API welcome email failed:", err?.response?.data || err?.message);
      }
    }

    // Console Fallback
    console.log(`\n==============================================`);
    console.log(`📩 [WELCOME CREDENTIALS] To: ${toEmail} | Login: ${loginEmail} | Password: ${password}`);
    console.log(`==============================================\n`);
    return true;
  },
};
