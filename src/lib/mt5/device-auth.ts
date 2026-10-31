import { createHash } from "node:crypto";
import type { HydratedDocument } from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { User, type IUser } from "@/models/User";
import { hasBrokerAutomationAccess } from "@/lib/mt5-access";
import {
  parseMt5Headers,
  verifyMt5Signature,
} from "@/lib/security/mt5-signing";
import { recordSecurityEvent } from "@/models/AuditLog";
import { getClientIp } from "@/lib/rate-limit";

export const MT5_MAX_BODY_BYTES = 16 * 1024;

const DEVICE_FIELDS =
  "+eaTokenHash plan planStatus planCurrentPeriodEnd trialEndsAt " +
  "brokerAutomationEnabled brokerAutomationMode brokerRiskPercent " +
  "mt5LastSignalId mt5LeaseSignalId mt5LeaseUntil mt5LastHeartbeatAt mt5Runtime";

export interface BodyReadResult {
  text: string;
  tooLarge: boolean;
}

/** Read the request body exactly once so the same bytes can be HMAC-verified. */
export async function readBodyText(
  req: Request,
  maxBytes: number = MT5_MAX_BODY_BYTES
): Promise<BodyReadResult> {
  const reader = req.body?.getReader();
  if (!reader) return { text: "", tooLarge: false };

  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return { text: "", tooLarge: true };
    }
    chunks.push(value);
  }
  return { text: Buffer.concat(chunks).toString("utf8"), tooLarge: false };
}

export function parseJsonBody(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function hashDeviceToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export interface DeviceAuthResult {
  user: HydratedDocument<IUser> | null;
  reason?: string;
  status?: number;
}

/**
 * Authenticate an MT5 bridge request.
 *
 * The device token identifies the user, while the HMAC proves the bridge knows
 * the token and binds the signature to this method, path, and exact body.
 */
export async function authorizeMt5Device(
  req: Request,
  options: { bodyText: string; endpoint: string }
): Promise<DeviceAuthResult> {
  const authHeader = req.headers.get("authorization") ?? "";
  const rawToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!rawToken) {
    return { user: null, reason: "missing_bearer_token", status: 401 };
  }

  const tokenHash = hashDeviceToken(rawToken);
  await dbConnect();
  const user = await User.findOne({ eaTokenHash: tokenHash }).select(
    DEVICE_FIELDS
  );
  if (!user) {
    return { user: null, reason: "unauthorized", status: 401 };
  }
  if (!hasBrokerAutomationAccess(user)) {
    return { user: null, reason: "broker_plan_required", status: 401 };
  }

  const { timestampSec, nonce, signature } = parseMt5Headers(req.headers);
  if (!timestampSec || !nonce || !signature) {
    return { user: null, reason: "missing_mt5_headers", status: 401 };
  }

  const path = new URL(req.url).pathname;
  const verify = await verifyMt5Signature(
    tokenHash,
    req.method,
    path,
    timestampSec,
    nonce,
    options.bodyText,
    signature
  );
  if (!verify.ok) {
    await recordSecurityEvent({
      type: "unauthorized_access",
      userId: user._id.toString(),
      ip: getClientIp(req),
      userAgent: req.headers.get("user-agent") ?? null,
      details: { reason: verify.reason, endpoint: options.endpoint },
      severity: "high",
    });
    return { user: null, reason: verify.reason, status: 401 };
  }

  return { user };
}
