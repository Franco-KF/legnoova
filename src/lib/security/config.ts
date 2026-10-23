export const SECURITY = {
  /** SHA-256 of an empty string; used to detect missing CSRF tokens. */
  EMPTY_HASH: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",

  /** MT5 device token derivation iterations. */
  TOKEN_ITERATIONS: 100_000,

  /** Maximum image upload size in bytes (~9 MB). */
  MAX_IMAGE_BYTES: 9_000_000,

  /** Allowed image MIME types. */
  ALLOWED_IMAGE_MIME: new Set([
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
  ]),

  /** Login lockout thresholds. */
  LOGIN_MAX_FAILURES: 5,
  LOGIN_LOCKOUT_MINUTES: 30,

  /** Session max age in seconds (24 hours). */
  SESSION_MAX_AGE: 24 * 60 * 60,

  /** CSRF token name (double-submit cookie). */
  CSRF_COOKIE_NAME: "lv_csrf",
  CSRF_HEADER_NAME: "x-csrf-token",

  /** MT5 bridge nonce tolerance window in seconds (5 minutes). */
  MT5_NONCE_TOLERANCE_SECONDS: 300,
} as const;

export type SecurityEventType =
  | "login_success"
  | "login_failure"
  | "login_lockout"
  | "token_created"
  | "token_revoked"
  | "automation_enabled"
  | "automation_disabled"
  | "automation_mode_changed"
  | "signal_executed"
  | "signal_rejected"
  | "trade_event_received"
  | "bridge_heartbeat"
  | "rate_limit_exceeded"
  | "csrf_failure"
  | "unauthorized_access"
  | "suspicious_activity"
  | "password_reset"
  | "email_changed"
  | "plan_changed";

export interface SecurityEventInput {
  type: SecurityEventType;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  severity?: "low" | "medium" | "high" | "critical";
}
