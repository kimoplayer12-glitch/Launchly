import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, name, type } = req.body;

  if (!email || !name || !type) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping email");
    return res.status(200).json({ success: true, message: "Email service not configured" });
  }

  try {
    const dashboardUrl = "https://zenith-psi-one.vercel.app/dashboard";
    let subject = "";
    let preheader = "";
    let headline = "";
    let body = "";

    if (type === "signup") {
      subject = "Welcome to Launchly";
      preheader = "Your account is ready. Start building in minutes.";
      headline = `Welcome to Launchly, ${name}`;
      body = `
        <p style="margin: 0 0 12px; color: #1f2937;">Your account is live and ready for launch.</p>
        <p style="margin: 0 0 16px; color: #1f2937;">Here is what you can do right now:</p>
        <ul style="margin: 0 0 16px; padding-left: 20px; color: #1f2937;">
          <li>Generate a business plan in minutes</li>
          <li>Create a website and launch pages</li>
          <li>Schedule content across social channels</li>
          <li>Produce ads with AI copy and visuals</li>
        </ul>
      `;
    } else if (type === "login") {
      subject = "New sign-in to Launchly";
      preheader = "If this was not you, secure your account.";
      headline = `Welcome back, ${name}`;
      body = `
        <p style="margin: 0 0 12px; color: #1f2937;">You just signed in to Launchly.</p>
        <p style="margin: 0 0 16px; color: #1f2937;">If this was not you, reset your password immediately.</p>
      `;
    } else {
      return res.status(400).json({ error: "Invalid email type" });
    }

    const htmlContent = `
      <div style="background: #f3f4f6; padding: 32px 12px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="padding: 28px 32px; background: linear-gradient(135deg, #00D9FF, #D946EF); color: #0b0b0b;">
            <div style="font-size: 18px; font-weight: 700; letter-spacing: 0.08em;">LAUNCHLY</div>
            <div style="font-size: 14px; opacity: 0.9;">Founder operations platform</div>
          </div>
          <div style="padding: 28px 32px; font-family: Arial, sans-serif;">
            <div style="display: none; visibility: hidden; opacity: 0; height: 0; overflow: hidden;">${preheader}</div>
            <h2 style="margin: 0 0 12px; font-size: 22px; color: #0f172a;">${headline}</h2>
            ${body}
            <a href="${dashboardUrl}" style="display: inline-block; margin-top: 8px; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 600;">
              Go to Dashboard
            </a>
            <p style="margin: 20px 0 0; font-size: 13px; color: #6b7280;">
              Need help? Reply to this email or visit our support page.
            </p>
          </div>
          <div style="padding: 16px 32px; background: #f8fafc; font-size: 12px; color: #94a3b8;">
            Launchly, 2026. All rights reserved.
          </div>
        </div>
      </div>
    `;

    const data = await resend.emails.send({
      from: "Launchly <onboarding@resend.dev>",
      to: email,
      subject,
      html: htmlContent,
      text: `${headline}\n\n${preheader}\n\nOpen your dashboard: ${dashboardUrl}\n\nIf you did not request this, please secure your account.`,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Email error:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
