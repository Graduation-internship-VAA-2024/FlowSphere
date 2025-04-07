import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// Read and convert logo to base64 at startup
const logoPath = path.join(process.cwd(), "public", "logo.svg");
const LOGO_BASE64 = `data:image/svg+xml;base64,${fs
  .readFileSync(logoPath)
  .toString("base64")}`;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendInviteEmail = async (
  to: string,
  inviteUrl: string,
  workspaceName: string,
  senderName: string
) => {
  const mailOptions = {
    from: `"${senderName} via FlowSphere" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Join ${workspaceName} on FlowSphere`,
    html: `
    <div style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 40px; margin: 0;">
      <div style="max-width: 600px; margin: auto; background-color: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); overflow: hidden;">
        <!-- Header with Logo -->
        <div style="background: linear-gradient(135deg, #22C55E 0%, #3B82F6 100%); padding: 32px; text-align: center;">
        
          <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600;">Join ${workspaceName}</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">
            You've been invited by ${senderName}
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 40px;">
          <div style="background-color: #f1fdf7; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
            <p style="margin: 0; font-size: 16px; color: #475569;">
              Hi there! 👋<br><br>
              ${senderName} has invited you to collaborate on the <strong style="color: #1e293b;">${workspaceName}</strong> workspace.
              Join now to start collaborating with the team!
            </p>
          </div>

          <!-- Action Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a 
              href="${inviteUrl}"
              style="
                display: inline-block;
                padding: 16px 32px;
                background: linear-gradient(135deg, #22C55E 0%, #3B82F6 100%);
                color: white;
                text-decoration: none;
                font-weight: 600;
                font-size: 16px;
                border-radius: 12px;
                transition: all 0.2s;
                box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
              "
              onmouseover="this.style.transform='translateY(-2px)'"
              onmouseout="this.style.transform='translateY(0)'"
            >
              Accept Invitation
            </a>
          </div>

          <!-- Alternative Link -->
          <div style="text-align: center; margin-top: 24px;">
            <p style="font-size: 14px; color: #475569; margin: 0 0 8px 0;">
              Or copy this link into your browser:
            </p>
            <a 
              href="${inviteUrl}" 
              style="color: #22C55E; font-size: 14px; text-decoration: none; word-break: break-all;"
            >
              ${inviteUrl}
            </a>
          </div>

          <!-- Footer -->
          <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 13px; color: #94a3b8; margin: 0; text-align: center;">
              This invitation was sent through FlowSphere.<br>
              If you weren't expecting this invitation, you can safely ignore this email.
            </p>
          </div>
        </div>
      </div>

      <!-- Powered By -->
      <div style="text-align: center; margin-top: 24px;">
        <p style="font-size: 12px; color: #475569; margin: 0;">
          Powered by 
          <a 
            href="${process.env.NEXT_PUBLIC_APP_URL}" 
            style="color: #22C55E; text-decoration: none; font-weight: 500;"
          >
            FlowSphere
          </a>
        </p>
      </div>
    </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
