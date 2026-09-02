import { MailtrapClient } from "mailtrap";

const MAILTRAP_TOKEN =
  process.env.MAILTRAP_TOKEN ||
  process.env.MAILTRAP_API_TOKEN ||
  "";
const MAILTRAP_TEST_INBOX_ID = process.env.MAILTRAP_TEST_INBOX_ID
  ? parseInt(process.env.MAILTRAP_TEST_INBOX_ID, 10)
  : undefined;
const EMAIL_FROM_EMAIL = process.env.EMAIL_FROM_EMAIL || "hello@demomailtrap.co";
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "Legnoova";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

let client: MailtrapClient | null = null;

function getClient(): MailtrapClient | null {
  if (!MAILTRAP_TOKEN) {
    return null;
  }
  if (!client) {
    client = new MailtrapClient({
      token: MAILTRAP_TOKEN,
      ...(MAILTRAP_TEST_INBOX_ID ? { testInboxId: MAILTRAP_TEST_INBOX_ID } : {}),
    });
  }
  return client;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  category = "transactional",
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  category?: string;
}) {
  const c = getClient();
  if (!c) {
    // Dev fallback: log the email instead of failing
    console.log(
      `\n[Legnoova DEV EMAIL] To: ${to}\nSubject: ${subject}\n${text || html}\n`
    );
    return { ok: true, dev: true };
  }

  const result = await c.send({
    from: { email: EMAIL_FROM_EMAIL, name: EMAIL_FROM_NAME },
    to: [{ email: to }],
    subject,
    ...(html ? { html } : {}),
    ...(text ? { text } : {}),
    ...(category ? { category } : {}),
  });

  return { ok: true, dev: false, result };
}
