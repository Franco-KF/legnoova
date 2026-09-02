import crypto from "crypto";

export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function generateOtp(digits = 6): string {
  const max = Math.pow(10, digits);
  return Math.floor(crypto.randomInt(0, max))
    .toString()
    .padStart(digits, "0");
}
