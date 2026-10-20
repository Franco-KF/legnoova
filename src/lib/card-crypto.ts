import crypto from "node:crypto";

/**
 * Card number encryption at rest.
 *
 * The full PAN is encrypted with AES-256-GCM before it ever touches MongoDB.
 * The key lives only in the server environment (`CARD_ENCRYPTION_KEY`), so a
 * database dump is useless without the key. Only trusted server code — namely
 * the admin panel — decrypts it.
 */

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const KEY_BYTES = 32;

export type EncryptedCard = {
  ciphertext: string;
  iv: string;
  tag: string;
};

function getKey(): Buffer {
  const raw = process.env.CARD_ENCRYPTION_KEY;
  if (raw) {
    try {
      const key = /^[0-9a-f]{64}$/i.test(raw)
        ? Buffer.from(raw, "hex")
        : Buffer.from(raw, "base64");
      if (key.length === KEY_BYTES) return key;
      console.warn(
        "CARD_ENCRYPTION_KEY is not 32 bytes; falling back to AUTH_SECRET-derived key"
      );
    } catch {
      console.warn(
        "CARD_ENCRYPTION_KEY could not be decoded; falling back to AUTH_SECRET-derived key"
      );
    }
  }

  // Fallback: derive a stable 32-byte key from AUTH_SECRET (always present
  // wherever the app runs) so card saving works without extra configuration.
  // Prefer setting CARD_ENCRYPTION_KEY explicitly in production.
  const secret = process.env.AUTH_SECRET;
  if (secret) {
    const derived = crypto.hkdfSync(
      "sha256",
      secret,
      "legnoova",
      "card-encryption",
      KEY_BYTES
    );
    return Buffer.from(derived);
  }

  throw new Error(
    "CARD_ENCRYPTION_KEY is not set and AUTH_SECRET is unavailable"
  );
}

export function encryptCard(pan: string): EncryptedCard {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(pan, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

/** Encrypt other saved payment metadata with the same authenticated cipher. */
export const encryptPaymentField = encryptCard;

export function decryptCard(payload: EncryptedCard): string | null {
  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      getKey(),
      Buffer.from(payload.iv, "base64")
    );
    decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, "base64")),
      decipher.final(),
    ]);
    return plaintext.toString("utf8");
  } catch {
    return null;
  }
}

/** Decrypt an encrypted payment metadata field. */
export const decryptPaymentField = decryptCard;
