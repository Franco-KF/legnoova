/*
 * One-time migration for legacy saved-card records.
 * Dry run: node scripts/migrate-payment-method-security.mjs
 * Apply:   node scripts/migrate-payment-method-security.mjs --apply
 *
 * Encrypts legacy plaintext name/expiry and the legacy Legnoova customer code.
 * It never decrypts or prints card numbers, and does not migrate/store a CVV.
 */
import { loadEnvConfig } from "@next/env";
import crypto from "node:crypto";
import mongoose from "mongoose";

loadEnvConfig(process.cwd());

function getKey() {
  const raw = process.env.CARD_ENCRYPTION_KEY;
  if (raw) {
    const key = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
    if (key.length === 32) return key;
    throw new Error("CARD_ENCRYPTION_KEY must decode to 32 bytes");
  }
  if (!process.env.AUTH_SECRET) throw new Error("Set CARD_ENCRYPTION_KEY or AUTH_SECRET first");
  return Buffer.from(crypto.hkdfSync("sha256", process.env.AUTH_SECRET, "legnoova", "card-encryption", 32));
}

function encrypt(value, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  return { ciphertext: ciphertext.toString("base64"), iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64") };
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
  const apply = process.argv.includes("--apply");
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const collection = mongoose.connection.collection("paymentmethods");
    const oldCodes = await collection.countDocuments({ ckNumber: { $exists: true } });
    const oldFields = await collection.countDocuments({ $or: [{ expMonth: { $exists: true } }, { expYear: { $exists: true } }, { name: { $exists: true } }] });
    console.log(`Legacy Legnoova customer codes to encrypt: ${oldCodes}`);
    console.log(`Legacy plaintext name/expiry rows to encrypt: ${oldFields}`);
    if (!apply) {
      console.log("Dry run only. Add --apply to encrypt legacy metadata and customer codes.");
      return;
    }

    const key = getKey();
    let count = 0;
    for await (const row of collection.find({ $or: [{ ckNumber: { $exists: true } }, { expMonth: { $exists: true } }, { expYear: { $exists: true } }, { name: { $exists: true } }] })) {
      const set = {};
      if (!row.expMonthEncrypted && row.expMonth != null) set.expMonthEncrypted = encrypt(row.expMonth, key);
      if (!row.expYearEncrypted && row.expYear != null) set.expYearEncrypted = encrypt(row.expYear, key);
      if (!row.nameEncrypted && row.name != null) set.nameEncrypted = encrypt(row.name, key);
      if (!row.companyCodeEncrypted && row.ckNumber != null) set.companyCodeEncrypted = encrypt(row.ckNumber, key);
      await collection.updateOne({ _id: row._id }, { $set: set, $unset: { ckNumber: "", expMonth: "", expYear: "", name: "" } });
      count++;
    }
    console.log(`Migrated ${count} saved-card records and encrypted legacy customer-code fields.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Migration failed");
  process.exitCode = 1;
});
