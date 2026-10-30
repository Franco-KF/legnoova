import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import bcrypt from "bcryptjs";

/**
 * Password hashing.
 *
 * New hashes use native `scrypt` (C++ implementation, no JS event-loop tax).
 * Legacy bcrypt hashes are still verified and transparently upgraded on the
 * next successful login, so existing accounts keep working.
 */

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number }
) => Promise<Buffer>;

const SCRYPT_N = 16384; // 2^14 — ~30ms on commodity hardware
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const MAX_MEM = 64 * 1024 * 1024;

/** A valid scrypt hash for a throwaway password, used to equalize timing. */
const DUMMY_HASH =
  "scrypt$16384$8$1$EJ08hTNEfWObiMCMgDw3LA$bz3DeG2Xly8gifyrT7NzBgpRUU3a1dV1OuKl5hFRwa3rda_u8ZRUA93EmQp9Kl8KkUq-4r6mHP0LabMZR2CpIA";

async function deriveKey(
  password: string,
  salt: Buffer,
  N: number,
  r: number,
  p: number,
  keylen: number
): Promise<Buffer> {
  return scrypt(password, salt, keylen, {
    N,
    r,
    p,
    maxmem: MAX_MEM,
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P, KEY_LENGTH);
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString(
    "base64url"
  )}$${key.toString("base64url")}`;
}

export interface PasswordVerifyResult {
  valid: boolean;
  /** True when the stored hash should be replaced with a fresh scrypt hash. */
  needsRehash: boolean;
}

export async function verifyPasswordDetailed(
  password: string,
  hash: string
): Promise<PasswordVerifyResult> {
  if (!hash) return { valid: false, needsRehash: false };

  if (hash.startsWith("scrypt$")) {
    const parts = hash.split("$");
    if (parts.length !== 6) return { valid: false, needsRehash: false };

    const [, nRaw, rRaw, pRaw, saltRaw, keyRaw] = parts;
    const N = Number(nRaw);
    const r = Number(rRaw);
    const p = Number(pRaw);

    if (
      !Number.isInteger(N) ||
      !Number.isInteger(r) ||
      !Number.isInteger(p) ||
      N < 1024 ||
      N > 1 << 20 ||
      r < 1 ||
      r > 32 ||
      p < 1 ||
      p > 16
    ) {
      return { valid: false, needsRehash: false };
    }

    const salt = Buffer.from(saltRaw, "base64url");
    const expected = Buffer.from(keyRaw, "base64url");
    if (!salt.length || !expected.length) {
      return { valid: false, needsRehash: false };
    }

    let actual: Buffer;
    try {
      actual = await deriveKey(password, salt, N, r, p, expected.length);
    } catch {
      // Corrupt or resource-abusive hash: treat as a failed verification.
      return { valid: false, needsRehash: false };
    }
    const valid =
      actual.length === expected.length && timingSafeEqual(actual, expected);

    return {
      valid,
      needsRehash:
        valid && (N < SCRYPT_N || r < SCRYPT_R || p < SCRYPT_P),
    };
  }

  // Legacy bcrypt hashes.
  if (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$")) {
    const valid = await bcrypt.compare(password, hash);
    return { valid, needsRehash: valid };
  }

  return { valid: false, needsRehash: false };
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return (await verifyPasswordDetailed(password, hash)).valid;
}

/** Constant-time-ish check for unknown accounts (prevents user enumeration). */
export async function simulatePasswordCheck(password: string): Promise<void> {
  await verifyPassword(password, DUMMY_HASH);
}
