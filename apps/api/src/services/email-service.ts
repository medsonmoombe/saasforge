import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST!,
  port: Number(process.env.EMAIL_PORT ?? 587),
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER!,
    pass: process.env.EMAIL_PASSWORD!,
  },
});

export const EmailService = {
  async sendInvite({
    to,
    orgName,
    inviterName,
    inviteUrl,
    role,
  }: {
    to: string;
    orgName: string;
    inviterName: string;
    inviteUrl: string;
    role: string;
  }) {
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const isDev = process.env.NODE_ENV !== "production";

    await transporter.sendMail({
      from: `"SaaSForge" <${process.env.EMAIL_FROM}>`,
      to,
      subject: `${inviterName} invited you to join ${orgName} on SaaSForge`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>You're invited</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Gradient header bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#2563eb,#6366f1,#a855f7);"></td>
          </tr>

          <!-- Logo + heading -->
          <tr>
            <td style="padding:40px 40px 0;text-align:center;">
              <div style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#2563eb,#6366f1);margin-bottom:20px;">
                <span style="font-size:24px;">⚡</span>
              </div>
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">You're invited!</h1>
              <p style="margin:0;font-size:15px;color:#64748b;">
                <strong style="color:#1e293b;">${inviterName}</strong> has invited you to join
                <strong style="color:#1e293b;">${orgName}</strong> as a <strong style="color:#6366f1;">${role}</strong>.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}"
                       style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#2563eb,#6366f1);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.01em;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Link fallback -->
          <tr>
            <td style="padding:0 40px 24px;">
              <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-align:center;">Or copy this link into your browser:</p>
              <p style="margin:0;font-size:12px;color:#6366f1;text-align:center;word-break:break-all;">${inviteUrl}</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #f1f5f9;margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">This invite expires in <strong>7 days</strong>.</p>
              <p style="margin:0;font-size:12px;color:#94a3b8;">If you didn't expect this, you can safely ignore it.</p>
              ${isDev ? `<p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">🛠 Dev mode — App URL: ${appUrl}</p>` : ""}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    });
  },
  async sendShareLink({
    to,
    projectName,
    shareUrl,
    senderName,
  }: {
    to: string;
    projectName: string;
    shareUrl: string;
    senderName: string;
  }) {
    await transporter.sendMail({
      from: `"SaaSForge" <${process.env.EMAIL_FROM}>`,
      to,
      subject: `${senderName} shared a project board with you`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="height:4px;background:linear-gradient(90deg,#2563eb,#6366f1,#a855f7);"></td></tr>
        <tr><td style="padding:40px 40px 0;text-align:center;">
          <div style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#2563eb,#6366f1);margin-bottom:20px;">
            <span style="font-size:24px;">📋</span>
          </div>
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Project Board Shared</h1>
          <p style="margin:0;font-size:15px;color:#64748b;">
            <strong style="color:#1e293b;">${senderName}</strong> has shared the
            <strong style="color:#1e293b;"> ${projectName}</strong> board with you.
          </p>
        </td></tr>
        <tr><td style="padding:32px 40px;text-align:center;">
          <a href="${shareUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#2563eb,#6366f1);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;">View Project Board</a>
        </td></tr>
        <tr><td style="padding:0 40px 24px;">
          <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-align:center;">Or copy this link:</p>
          <p style="margin:0;font-size:12px;color:#6366f1;text-align:center;word-break:break-all;">${shareUrl}</p>
        </td></tr>
        <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #f1f5f9;margin:0;"/></td></tr>
        <tr><td style="padding:24px 40px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">This is a read-only view. No account required.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
    });
  },
};
