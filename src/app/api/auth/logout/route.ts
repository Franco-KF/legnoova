import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";
import { rejectCrossOrigin, requestMeta } from "@/lib/auth/request";
import { recordSecurityEvent } from "@/models/AuditLog";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const crossOrigin = rejectCrossOrigin(req);
  if (crossOrigin) return crossOrigin;

  const { ip, userAgent } = requestMeta(req);

  try {
    await recordSecurityEvent({
      type: "token_revoked",
      ip,
      userAgent,
      details: { action: "sign_out" },
      severity: "low",
    });
  } catch {
    /* logging must never block logout */
  }

  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } }
  );
  clearSessionCookie(response);
  return response;
}
