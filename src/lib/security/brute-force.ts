import { dbConnect } from "@/lib/mongodb";
import { LoginAttempt } from "@/models/LoginAttempt";
import { recordSecurityEvent } from "@/models/AuditLog";
import { SECURITY } from "@/lib/security/config";

export interface BruteForceResult {
  allowed: boolean;
  reason?: string;
  retryAfterSec?: number;
}

export async function checkLoginThrottle(
  identifier: string
): Promise<BruteForceResult> {
  await dbConnect();

  const record = await LoginAttempt.findOne({ identifier }).lean();
  const now = new Date();

  if (record && record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSec = Math.ceil(
      (record.lockedUntil.getTime() - now.getTime()) / 1000
    );
    return {
      allowed: false,
      reason: "account_locked",
      retryAfterSec,
    };
  }

  return { allowed: true };
}

export async function recordLoginFailure(
  identifier: string,
  ip: string,
  userAgent: string | null
): Promise<void> {
  await dbConnect();

  const now = new Date();
  const record = await LoginAttempt.findOneAndUpdate(
    { identifier },
    {
      $inc: { failures: 1 },
      $set: {
        lastFailureAt: now,
        ip,
        userAgent,
        updatedAt: now,
      },
    },
    { upsert: true, new: true }
  );

  const failures = (record?.failures ?? 0) + 1;
  if (failures >= SECURITY.LOGIN_MAX_FAILURES) {
    const lockedUntil = new Date(
      now.getTime() + SECURITY.LOGIN_LOCKOUT_MINUTES * 60 * 1000
    );
    await LoginAttempt.findOneAndUpdate(
      { identifier },
      { $set: { lockedUntil, updatedAt: now } }
    );
    await recordSecurityEvent({
      type: "login_lockout",
      ip,
      userAgent,
      details: { identifier, failures, lockoutMinutes: SECURITY.LOGIN_LOCKOUT_MINUTES },
      severity: "high",
    });
  } else {
    await recordSecurityEvent({
      type: "login_failure",
      ip,
      userAgent,
      details: { identifier, failures },
      severity: "medium",
    });
  }
}

export async function recordLoginSuccess(
  identifier: string,
  ip: string,
  userAgent: string | null
): Promise<void> {
  await dbConnect();
  const now = new Date();
  await LoginAttempt.findOneAndUpdate(
    { identifier },
    {
      $set: { failures: 0, lockedUntil: null, lastSuccessAt: now, ip, userAgent, updatedAt: now },
    },
    { upsert: true, new: true }
  );
  await recordSecurityEvent({
    type: "login_success",
    ip,
    userAgent,
    details: { identifier },
    severity: "low",
  });
}
