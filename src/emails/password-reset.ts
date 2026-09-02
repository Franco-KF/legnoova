import { APP_URL } from "@/lib/email";

export function passwordResetHtml({
  resetUrl,
  expiresInHours,
}: {
  resetUrl: string;
  expiresInHours: number;
}) {
  return `
  <div style="background-color:#0b0f1a;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e5e7eb;">
    <div style="max-width:480px;margin:0 auto;background-color:#131a2b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:#10b981;border-radius:10px;padding:10px 14px;font-weight:700;font-size:14px;color:#03140c;">Legnoova</div>
      </div>
      <h1 style="font-size:22px;margin:0 0 8px;color:#fff;text-align:center;">Reset your password</h1>
      <p style="font-size:14px;line-height:1.6;color:#9ca3af;margin:0 0 24px;text-align:center;">
        We received a request to reset your Legnoova password. This link is valid for the next ${expiresInHours} hour(s).
      </p>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${resetUrl}" style="display:inline-block;background:#10b981;color:#03140c;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:15px;">Reset Password</a>
      </div>
      <p style="font-size:13px;line-height:1.6;color:#6b7280;margin:0 0 16px;">
        If you didn't request this, you can safely ignore this email. Your password won't change until you click the link and set a new one.
      </p>
      <p style="font-size:12px;color:#6b7280;margin:0;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;text-align:center;">
        If the button doesn't work, copy and paste this link:<br/>
        <a href="${resetUrl}" style="color:#10b981;word-break:break-all;">${resetUrl}</a>
      </p>
    </div>
  </div>
  `;
}

export function passwordResetText({ resetUrl, expiresInHours }: { resetUrl: string; expiresInHours: number }) {
  return [
    `Legnoova — Reset your password`,
    ``,
    `We received a request to reset your Legnoova password. This link is valid for the next ${expiresInHours} hour(s).`,
    ``,
    `${resetUrl}`,
    ``,
    `If you didn't request this, you can safely ignore this email.`,
  ].join("\n");
}

export { APP_URL };
