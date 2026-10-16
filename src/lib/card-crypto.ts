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
  if (!raw) {
    throw new Error("CARD_ENCRYPTION_KEY is not set");
  }
  const key = /^[0-9a-f]{64}$/i.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");
  if (key.length !== KEY_BYTES) {
    throw new Error("CARD_ENCRYPTION_KEY must decode to 32 bytes");
  }
  return key;
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

export function maskCard(pan: string): string {
  const digits = pan.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  return `•••• •••• •••• ${digits.slice(-4)}`;
}
